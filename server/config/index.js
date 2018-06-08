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

module.exports = config;