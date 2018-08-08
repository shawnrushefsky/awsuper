const amqp = require('amqplib');
const log = require('../utils/logger');
const { sleep } = require('../utils/common');
const config = require('../../config');
const { inspect } = require('util');

class Rabbit {
    constructor() {
        this.connection = undefined;
        this.publishChannel = undefined;
        this.consumeChannel = undefined;
        this.connected = false;
        this.connecting = false;
        this.assertedQueues = {};
        this.consumers = {};
    }

    /**
     * Connect the client to the rabbit server. It will retry until it succeeds.
     * @param {Object} options { prefetchLimit: the number of unacked messages allowed (Default 10),
     *                           prefetchGlobal: if true (default), applies to the channel, if false applies to each consumer.}
     */
    async connect(options = {}) {
        const DEFAULT_OPTIONS = {
            prefetchLimit: 10,
            prefetchGlobal: true
        };

        options = { ...DEFAULT_OPTIONS, ...options };
        /**
         * This prevents a race condition: If a call is made to `await connect()` and then another call
         * is made before the first call resolves, it can result in orphaned connections
         */
        if (this.connecting) {
            while (!this.connected) {
                await sleep(200);
            }
        }

        while (!this.connected) {
            try {
                this.connecting = true;
                log.info('RabbitMQ Client - Connecting...');

                const rabbitURL = `amqp://${config.rabbit.host}:${config.rabbit.port}`;

                this.connection = await amqp.connect(rabbitURL);

                // Auto-reconnect if the connection breaks
                this.connection.on('error', async (err) => {
                    log.error(inspect(err));

                    this.connected = false;
                    this.connecting = false;
                    await this.connect();
                });

                this.connected = true;
                await this.setUpConsumeChannel(options);
                await this.setUpPublishChannel(options);

                log.info('RabbitMQ Client - Connected.');
            } catch (e) {
                log.warn(e);
                log.info('RabbitMQ Client failed to connect. retying in 1s');
                await sleep(1000);
            }
        }

        this.connecting = false;

        return { connection: this.connection, publishChannel: this.publishChannel, consumeChannel: this.consumeChannel };
    }

    /**
     * This method disconnects the rabbit client
     */
    async disconnect() {
        if (this.connected) {
            await this.consumeChannel.close();
            this.consumeChannel = undefined;

            await this.publishChannel.close();
            this.publishChannel = undefined;

            await this.connection.close();
            this.connection = undefined;

            this.connected = false;

            this.consumers = {};
            this.assertedQueues = {};

            log.info('Disconnected');
        }
    }

    /**
     * Creates the publish channel, sets the prefetch, and attaches error handling
     * @param {Object} options { prefetchLimit: the number of unacked messages allowed (Default 10),
     *                           prefetchGlobal: if true (default), applies to the channel, if false applies to each consumer.}
     */
    async setUpPublishChannel(options) {
        // Set up the publish channel
        this.publishChannel = await this.connection.createChannel();
        await this.publishChannel.prefetch(options.prefetchLimit, options.prefetchGlobal);

        this.handlePublishChannelErrors(options);
    }

    /**
     * Creates the consume channel, sets the prefetch, and attaches error handling
     * @param {Object} options { prefetchLimit: the number of unacked messages allowed (Default 10),
     *                           prefetchGlobal: if true (default), applies to the channel, if false applies to each consumer.}
     */
    async setUpConsumeChannel(options) {
        // Set up the consume channel
        this.consumeChannel = await this.connection.createChannel();
        await this.consumeChannel.prefetch(options.prefetchLimit, options.prefetchGlobal);

        this.handleConsumeChannelErrors(options);
    }

    /**
     * This method attaches the error listener to the consume channel. Hopefully this provides
     * self-healing channel functionality.
     * @param {Object} options { prefetchLimit: the number of unacked messages allowed (Default 10),
     *                           prefetchGlobal: if true (default), applies to the channel, if false applies to each consumer.}
     */
    handleConsumeChannelErrors(options) {
        this.consumeChannel.on('error', async (err) => {
            log.error(`An error occurred in the Rabbit Consume Channel: ${inspect(err)}`);

            await this.setUpConsumeChannel(options);
        });
    }

    /**
     * This method attaches the error listener to the publish channel. Hopefully this provides
     * self-healing channel functionality.
     * @param {Object} options { prefetchLimit: the number of unacked messages allowed (Default 10),
     *                           prefetchGlobal: if true (default), applies to the channel, if false applies to each consumer.}
     */
    handlePublishChannelErrors(options) {
        this.publishChannel.on('error', async (err) => {
            log.error(`An error occurred in the Rabbit Publish Channel: ${inspect(err)}`);

            await this.setUpPublishChannel(options);
        });
    }

    async maybeAssertQueue(queueName) {
        const { publishChannel } = await this.connect();

        if (!this.assertedQueues[queueName]) {
            // If this client has never asserted this queue, go ahead and assert it to be safe.
            await publishChannel.assertQueue(queueName);
            this.assertedQueues[queueName] = true;
        }
    }

    /**
     * Serialize a message and send it to a queue.
     * @param {String} queueName The name of the Queue to send a message to
     * @param {Object} msg A JSON-serializable message object
     */
    async sendToQueue(queueName, msg, options) {
        // All publishes are made on the publish channel
        const { publishChannel } = await this.connect();

        await this.maybeAssertQueue(queueName);

        const serializedMsg = Buffer.from(JSON.stringify(msg));

        return await publishChannel.sendToQueue(queueName, serializedMsg, options);
    }

    /**
     * Returns the JSON-parsed contents of a queued message, along with an ack and nack function.
     * Will return an empty object if no messages are present in the queue.
     * @param {String} queueName The queue to get one message from.
     * @returns {Object} { msg, ack, nack }
     */
    async get(queueName) {
        const { consumeChannel } = await this.connect();

        await this.maybeAssertQueue(queueName);

        const message = await consumeChannel.get(queueName);

        if (message && message.content) {
            const msg = JSON.parse(message.content.toString());

            // The value of `this` is not preserved by the time we need it, so we use self.
            // The benefit here is that we can then spy on the ack and nack functions in tests.
            const self = this;
            const ack = () => self.consumeAck(message);
            const nack = (requeue = true) => self.consumeNack(message, requeue);

            return { msg, ack, nack };
        }

        return {};
    }

    /**
     * A generic consume function
     * @param {String} queueName The name of the queue to consume
     * @param {Function} callback A callback: async (msg, ack, nack(requeue=true))
     * @param {Function} [condition=(msg) => true] condition
     */
    async consume(queueName, callback, condition = msg => true) {
        // Inside the consume callback, `this` no longer refers to the rabbit client.
        const { consumeChannel } = await this.connect();

        // The value of `this` is not preserved by the time we need it, so we use self.
        // The benefit here is that we can then spy on the ack and nack functions in tests.
        const self = this;

        await this.maybeAssertQueue(queueName);

        // consume the scheduledCancellations queue with the callback
        const reply = await consumeChannel.consume(queueName, async msg => {
            // It is for some reason possible for this callback to receive a null message.
            // I'm guessing that it means a queue is empty, but really I have no idea.
            if (!msg) return;

            let parsed;
            try {
                parsed = JSON.parse(msg.content.toString());
            } catch (e) {
                // If the message is corrupt in some fashion, nack and don't requeue.
                log.error(`${queueName} received an unparsable message: ${msg}`);
                return await consumeChannel.nack(msg, undefined, false);
            }

            if (!condition(parsed)) {
                log.error(`This message has been routed incorrectly: ${inspect(parsed)}`);
                return await consumeChannel.nack(msg, undefined, false);
            }


            const ack = () => self.consumeAck(msg);
            const nack = (requeue = true) => self.consumeNack(msg, requeue);

            await callback(parsed, ack, nack);
        });

        // You can `channel.cancel(consumerTag)` to cancel a consumer
        this.consumers[queueName] = reply.consumerTag;
    }

    /**
     * This will cancel an `amqp:consume` action.
     * @param {String} queueName
     */
    async cancel(queueName) {
        if (!this.consumers[queueName]) {
            throw new Error(`${queueName} is not an active consumer. Choose one of: ${Object.keys(this.consumers)}`);
        }

        const { consumeChannel } = await this.connect();

        await consumeChannel.cancel(this.consumers[queueName]);
        delete this.consumers[queueName];
    }

    consumeAck(message) {
        this.consumeChannel.ack(message);
    }

    consumeNack(message, requeue) {
        this.consumeChannel.nack(message, undefined, requeue);
    }

    publishAck(message) {
        this.publishChannel.ack(message);
    }

    publishNack(message, requeue) {
        this.publishChannel.nack(message, undefined, requeue);
    }
}

module.exports = new Rabbit();
