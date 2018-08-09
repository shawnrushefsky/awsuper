const sinon = require('sinon');
const chai = require('chai');
const rabbit = require('../../src/clients/rabbit');
const amqp = require('amqplib');
const config = require('../../config');

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
        before(async () => {
            await rabbit.connect();
        });

        after(async () => {
            await rabbit.disconnect();
        });

        it('uses maybeAssertQueue to ensure queue existence', async () => {
            const maybeAssertQueue = sandbox.spy(rabbit, 'maybeAssertQueue');

            const originalMsg = { key: 'value' };
            const queueName = 'testQueue';

            await rabbit.sendToQueue(queueName, originalMsg);

            expect(maybeAssertQueue.calledOnceWithExactly(queueName)).to.be.true;

            // Remove the message from the queue
            const { ack } = await rabbit.get(queueName);
            ack();
        });

        it('publishes a JSON object to the specified queue', async () => {
            const originalMsg = { key: 'value' };
            const queueName = 'testQueue';

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
});