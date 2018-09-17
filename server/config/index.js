const _ = require('lodash');
const log = require('../src/utils/logger');

const base = require('./base');

const env = process.env.APP_ENV || 'local';
const envConfig = require(`./${env}`);

// Check environment variables first. These take priority
let awsConfig = {
    aws: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACESS_KEY,
        region: process.env.REGION
    }
};

// If there weren't enough values provided through environment variables, try to load a config file
if (!validAWSConfig(awsConfig)) {
    try {
        awsConfig = require('./aws');

        // If the config is wrong, throw an error
        if (!validAWSConfig(awsConfig)) throw new Error();
    } catch (e) {
        // If there were any errors above, log, and exit
        log.fatal('You must provide AWS credentials via a config file, or environment variables');
        process.exit(1);
    }
}

/**
 * Checks to make sure awsConfig has the correct structure
 * @param {Object} awsConfig An Object { aws: { accessKeyId, secretAccessKey, region } }
 */
function validAWSConfig(awsConfig) {
    return awsConfig.aws && awsConfig.aws.accessKeyId && awsConfig.aws.secretAccessKey && awsConfig.aws.region;
}


const config = _.merge(base, envConfig, awsConfig);

// Prefer environment variables for rabbit and mongo setup, fall back to config files.
config.rabbit.host = process.env.RABBIT_HOST || config.rabbit.host;
config.rabbit.port = process.env.RABBIT_PORT || config.rabbit.port;
config.mongo.host = process.env.MONGO_HOST || config.mongo.host;
config.mongo.port = process.env.MONGO_PORT || config.mongo.port;

module.exports = config;