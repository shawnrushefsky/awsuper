const Logger = require('logger-nodejs');

/**
 * This is where we would load any logger plugins we want to use throughout the application
 */

module.exports = new Logger({ name: 'awsuper' });