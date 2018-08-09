const sinon = require('sinon');
const chai = require('chai');
const rabbit = require('../../src/clients/rabbit');
const amqp = require('amqplib');
const config = require('../../config');
const { sleep } = require('../../src/utils/common');

const { expect } = chai;

const sandbox = sinon.createSandbox();

describe('Rabbit Client', () => {
    beforeEach(() => {
        sandbox.restore();
    });

    after(async () => {
        sandbox.restore();

        await rabbit.disconnect();
    });

    describe('connect', () => {
        afterEach(async () => {
            await rabbit.disconnect();
        });

        it('invokes amqp.connect with the configured URL', async () => {
            const amqpConnect = sandbox.spy(amqp, 'connect');

            await rabbit.connect();

            const expectedURL = `amqp://${config.rabbit.host}:${config.rabbit.port}`;
            expect(amqpConnect.calledOnceWith(expectedURL)).to.be.true;
        });

        it('establishes publish and consume channels', async () => {
            expect(rabbit.publishChannel).to.be.undefined;
            expect(rabbit.consumeChannel).to.be.undefined;

            await rabbit.connect();

            // The channels will have been created in this method as well
            expect(rabbit.publishChannel).to.be.an('object');
            expect(rabbit.consumeChannel).to.be.an('object');
        });
    });

    describe('disconnect', () => {
        beforeEach(async () => {
            await rabbit.connect();
        });

        it('closes the publish and consume channels, and the connection', async () => {
            const publishClose = sandbox.spy(rabbit.publishChannel, 'close');
            const consumeClose = sandbox.spy(rabbit.consumeChannel, 'close');
            const connectionClose = sandbox.spy(rabbit.connection, 'close');

            await rabbit.disconnect();

            // It will close the channels, and the connection
            expect(publishClose.called).to.be.true;
            expect(consumeClose.called).to.be.true;
            expect(connectionClose.called).to.be.true;
        });

        it('sets connected to false, and the connection and channels to undefined', async () => {
            expect(rabbit.connected).to.be.true;
            expect(rabbit.connection).to.be.an('object');
            expect(rabbit.publishChannel).to.be.an('object');
            expect(rabbit.consumeChannel).to.be.an('object');

            await rabbit.disconnect();

            // It will set connected to false, and remove the connection and channel objects
            expect(rabbit.connected).to.be.false;
            expect(rabbit.connection).to.be.undefined;
            expect(rabbit.publishChannel).to.be.undefined;
            expect(rabbit.consumeChannel).to.be.undefined;
        });
    });

    describe('maybeAssertQueue', async () => {
        before(async () => {
            await rabbit.connect();
        });

        after(async () => {
            await rabbit.disconnect();
        });

        it('asserts a queue if this client has not previously asserted a queue by that name', async () => {
            // This client has not previously asserted any queues
            expect(Object.keys(rabbit.assertedQueues).length).to.equal(0);

            const assertQueue = sandbox.spy(rabbit.publishChannel, 'assertQueue');

            await rabbit.maybeAssertQueue('testQueue');

            expect(assertQueue.called).to.be.true;
            expect(rabbit.assertedQueues.testQueue).to.be.true;
        });

        it('does not assert a queue if this client has previously asserted a queue by the same name', async () => {
            rabbit.assertedQueues.testQueue = true;

            const assertQueue = sandbox.spy(rabbit.publishChannel, 'assertQueue');

            await rabbit.maybeAssertQueue('testQueue');

            expect(assertQueue.called).to.be.false;
        });
    });

    describe('sendToQueue', () => {
        const originalMsg = { key: 'value' };
        const queueName = 'testQueue';

        before(async () => {
            await rabbit.connect();
        });

        after(async () => {
            await rabbit.disconnect();
        });

        it('uses maybeAssertQueue to ensure queue existence', async () => {
            const maybeAssertQueue = sandbox.spy(rabbit, 'maybeAssertQueue');

            await rabbit.sendToQueue(queueName, originalMsg);

            expect(maybeAssertQueue.calledOnceWithExactly(queueName)).to.be.true;

            // Remove the message from the queue
            const { ack } = await rabbit.get(queueName);
            ack();
        });

        it('publishes a JSON object to the specified queue', async () => {
            // Ensure we start from a fresh queue
            await rabbit.publishChannel.deleteQueue(queueName);
            delete rabbit.assertedQueues[queueName];

            const publish = sandbox.spy(rabbit.publishChannel, 'sendToQueue');

            await rabbit.sendToQueue(queueName, originalMsg);

            expect(publish.calledWith(queueName)).to.be.true;

            const { msg, ack } = await rabbit.get(queueName);

            expect(msg).to.deep.equal(originalMsg);
            ack();
        });
    });

    describe('get', () => {
        const queueName = 'testQueue';
        const originalMsg = { key: 'value' };

        before(async () => {
            await rabbit.connect();
        });

        beforeEach(async () => {
            // Ensure we start from a fresh queue
            await rabbit.publishChannel.deleteQueue(queueName);
            delete rabbit.assertedQueues[queueName];
        });

        after(async () => {
            await rabbit.disconnect();
        });

        it('retrieves and parses a JSON message from a specified queue', async () => {
            await rabbit.sendToQueue(queueName, originalMsg);

            const consume = sandbox.spy(rabbit.consumeChannel, 'get');

            const { msg, ack } = await rabbit.get(queueName);

            expect(consume.calledWith(queueName)).to.be.true;

            expect(msg).to.deep.equal(originalMsg);
            ack();
        });

        it('provides an ack function', async () => {
            await rabbit.sendToQueue(queueName, originalMsg);

            const { ack } = await rabbit.get(queueName);

            expect(ack).to.be.a('function');

            const consumeAck = sandbox.spy(rabbit.consumeChannel, 'ack');

            ack();

            expect(consumeAck.called).to.be.true;
        });

        it('provides a nack function that accepts a requeue boolean', async () => {
            await rabbit.sendToQueue(queueName, originalMsg);

            const { nack } = await rabbit.get(queueName);

            expect(nack).to.be.a('function');

            const consumeNack = sandbox.spy(rabbit.consumeChannel, 'nack');

            // This is requeue=true by default;
            nack();

            // The consume channel's nack function should have the requeue option as true
            expect(consumeNack.args[0][2]).to.be.true;

            await sleep(200);

            const { nack: secondNack } = await rabbit.get(queueName);

            expect(secondNack).to.be.a('function');

            secondNack(false);

            // The consume channel's nack function should have the requeue option as true
            expect(consumeNack.args[1][2]).to.be.false;
        });
    });

    describe('consume', () => {
        const queueName = 'testQueue';
        const originalMsg = { key: 'value' };

        before(async () => {
            await rabbit.connect();
        });

        beforeEach(async () => {
            // Ensure we start from a fresh queue
            await rabbit.publishChannel.deleteQueue(queueName);
            delete rabbit.assertedQueues[queueName];
        });

        after(async () => {
            await rabbit.disconnect();
        });

        it('uses maybeAssertQueue to ensure queue existence', async () => {
            const maybe = sandbox.spy(rabbit, 'maybeAssertQueue');

            await rabbit.consume(queueName);

            expect(maybe.calledWithExactly(queueName)).to.be.true;
        });

        it('passes a parsed json message to the consumer', (done) => {
            rabbit.sendToQueue(queueName, originalMsg);

            rabbit.consume(queueName, async (msg, ack, nack) => {
                expect(msg).to.deep.equal(originalMsg);

                ack();
                done();
            });
        });

        it('passes an ack function to the consumer', (done) => {
            rabbit.sendToQueue(queueName, originalMsg);

            const ackSpy = sandbox.spy(rabbit.consumeChannel, 'ack');

            rabbit.consume(queueName, async (msg, ack, nack) => {
                expect(msg).to.deep.equal(originalMsg);

                ack();

                expect(ackSpy.called).to.be.true;
                done();
            });
        });

        it('passes a nack function to the consumer that accepts a requeue boolean', (done) => {
            rabbit.sendToQueue(queueName, originalMsg);

            const nackSpy = sandbox.spy(rabbit.consumeChannel, 'nack');

            let msgCount = 0;

            rabbit.consume(queueName, async (msg, ack, nack) => {
                // The message should be the same each time.
                expect(msg).to.deep.equal(originalMsg);

                // nack with requeue=true (default) the first time
                if (msgCount === 0) {
                    nack();

                    expect(nackSpy.args[msgCount][2]).to.be.true;
                } else if (msgCount === 1) {
                    nack(false);

                    // The consume channel's nack function should have the requeue option as false
                    expect(nackSpy.args[msgCount][2]).to.be.false;
                    done();
                } else {
                    // This message should not be delivered a third time, because it was not requeued after number 2.
                    expect.fail();
                }

                msgCount += 1;
            });
        });
    });

    describe('cancel', () => {
        before(async () => {
            await rabbit.connect();
        });

        after(async () => {
            await rabbit.disconnect();
        });

        it('throws an error if there is no consumer on the queue provided', async () => {
            try {
                await rabbit.cancel('notreal');
                expect.fail();
            } catch (e) {
                expect(e.message).to.equal('notreal is not an active consumer. Choose one of: ');
            }
        });

        it('cancels a consumer on a queue', async () => {
            let queueName = 'testQueue';
            await rabbit.consume(queueName, (msg, ack, nack) => { ack(); });

            expect(rabbit.consumers[queueName]).to.not.be.undefined;

            const cancelSpy = sandbox.spy(rabbit.consumeChannel, 'cancel');

            await rabbit.cancel(queueName);

            expect(cancelSpy.called).to.be.true;
            expect(rabbit.consumers[queueName]).to.be.undefined;
        });
    });
});