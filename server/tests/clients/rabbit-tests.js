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

    it('provides a connect method', async () => {
        expect(rabbit.connect).to.be.a('function');
        expect(rabbit.publishChannel).to.be.undefined;
        expect(rabbit.consumeChannel).to.be.undefined;

        const amqpConnect = sandbox.spy(amqp, 'connect');

        await rabbit.connect();

        const expectedURL = `amqp://${config.rabbit.host}:${config.rabbit.port}`;
        expect(amqpConnect.calledOnceWith(expectedURL)).to.be.true;

        // The channels will have been created in this method as well
        expect(rabbit.publishChannel).to.be.an('object');
        expect(rabbit.consumeChannel).to.be.an('object');
    });

    it('provides a disconnect method', async () => {
        expect(rabbit.disconnect).to.be.a('function');

        await rabbit.connect();

        expect(rabbit.publishChannel).to.be.an('object');
        expect(rabbit.consumeChannel).to.be.an('object');

        const publishClose = sandbox.spy(rabbit.publishChannel, 'close');
        const consumeClose = sandbox.spy(rabbit.consumeChannel, 'close');
        const connectionClose = sandbox.spy(rabbit.connection, 'close');

        await rabbit.disconnect();

        // It will close the channels, and the connection
        expect(publishClose.called).to.be.true;
        expect(consumeClose.called).to.be.true;
        expect(connectionClose.called).to.be.true;

        // It will set connected to false, and remove the connection and channel objects
        expect(rabbit.connected).to.be.false;
        expect(rabbit.connection).to.be.undefined;
        expect(rabbit.publishChannel).to.be.undefined;
        expect(rabbit.consumeChannel).to.be.undefined;
    });

});