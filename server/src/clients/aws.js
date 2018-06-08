const AWS = require('aws-sdk');
const config = require('../../config');

const EC2 = new AWS.EC2(config.aws);
const OpsWorks = new AWS.OpsWorks(config.aws);

module.exports = {
    EC2,
    OpsWorks
};