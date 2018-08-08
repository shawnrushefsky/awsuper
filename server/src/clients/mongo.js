const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const config = require('../../config');
const log = require('../utils/logger');
const { sleep } = require('../utils/common');

let connected = false;


async function connect() {
    log.info('Connecting to MongoDB...');

    while (!connected) {
        try {
            await mongoose.connect(`mongodb://${config.mongo.host}:${config.mongo.port}/awsuper`, { useNewUrlParser: true });

            connected = true;

            log.info('MongoDB connected.');
        } catch (e) {
            log.error(e);

            log.info('MongoDB failed to connect. Retrying in 1s...');
            await sleep(1000);
        }

    }
}

/**
 * disconnects from mongo
 */
async function disconnect() {
    if (!connected) {
        log.info('MongoDB already disconnected. ignoring');
        return;
    }

    await mongoose.disconnect();

    connected = false;

    log.info('MongoDB disconnected.');
}

module.exports = { connect, disconnect };