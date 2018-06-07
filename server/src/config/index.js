const _ = require('lodash');
const base = require('./base');

const env = process.env.APP_ENV || 'local';
const envConfig = require(`./${env}`);
