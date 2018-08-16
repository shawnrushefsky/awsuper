const log = require('../utils/logger');

const CLIENT = 'client';
const INTERNAL = 'internal';
const INTERNAL_ERROR = 'An internal error was encountered while processing your request.';
const ENQUEUING_ERROR = 'An error occurred enqueuing the task.';

/**
 * parses the error provided by properties that exist on it and returns an array of coherent error messages that
 * can be sent back to the frontend
 * @param {Error} e
 */
function parsePersistError(e) {
    let errorType;
    const errors = [];

    if (e.name === 'ValidationError') {
        errorType = CLIENT;

        // Collect all of the validation errors to send back to the requester
        for (let name in e.errors) {
            errors.push(e.errors[name].message);
        }
    } else if (e.name === 'MongoError') {
        errorType = CLIENT;

        // Error code 11000 is a duplicate key error which means that the value provided for a given field already exists i.e.
        // a user is being created with an email that already exists in our database.
        if (e.code === 11000) {
            // Parse out the field that caused the exception. I hate this but there's no other way to do it.
            // An example of what this error message looks like is:
            // 'E11000 duplicate key error collection: client_grid.members index: email_1 dup key'
            const erroneousField = e.message.split('index: ')[1].split('_')[0];
            log.warn(e.message);

            errors.push(`This ${erroneousField} has already been taken.`);
        }
    } else {
        errorType = INTERNAL;
        errors.push('Oops, this is an issue on our end.');
    }

    return { errorType, errors };
}

module.exports = {
    parsePersistError,
    errorTypes: { CLIENT, INTERNAL },
    messages: { INTERNAL: INTERNAL_ERROR, ENQUEUING: ENQUEUING_ERROR }
};