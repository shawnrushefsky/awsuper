const sinon = require('sinon');
const chai = require('chai');
const mongoose = require('mongoose');
const config = require('../../config');
const mongo = require('../../src/clients/mongo');
const { expect } = chai;

const sandbox = sinon.createSandbox();

describe('Mongo Client', () => {
    beforeEach(() => {
        sandbox.restore();
    });

    after(() => {
        sandbox.restore();
    });

    it('Includes a connect method', async () => {
        expect(mongo.connect).to.be.a('function');

        let mongooseConnect = sandbox.stub(mongoose, 'connect').returns(true);

        await mongo.connect();

        expect(mongooseConnect.called).to.be.true;

        const expectedURL = `mongodb://${config.mongo.host}:${config.mongo.port}/awsuper`;
        expect(mongooseConnect.args[0][0]).to.equal(expectedURL);
    });

    it('includes a disconnect method', async () => {
        expect(mongo.disconnect).to.be.a('function');

        let mongooseDisconnect = sandbox.stub(mongoose, 'disconnect').returns(true);

        await mongo.disconnect();

        expect(mongooseDisconnect.called).to.be.true;
    });
});