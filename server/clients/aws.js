const AWS = require('aws-sdk');
const config = require('../config');

const EC2 = new AWS.EC2(config.aws.config);

module.exports = {
    EC2
};