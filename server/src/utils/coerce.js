const mongoose = require('mongoose');
const { Types } = mongoose.Schema;
const { ObjectId } = mongoose.Types;
const moment = require('moment');

// These are the formats we will be accepting dates for query parameters
const DATE_FORMATS = [
    'MM-DD-YYYY',
    'MM-DD-YYYY HH',
    'MM-DD-YYYY HH:mm',
    'MM-DD-YYYY HH:mm:ss',
    'YYYY-MM-DD HH:mm:ss'
];

/**
 * Coerce value into the appropriate type for key, as determined by model
 * @param {String} key
 * @param {String} value
 * @param {mongoose.Model} model
 */
function coerceValue(key, value, model) {
    const fieldType = model.schema.paths[key];

    if (!fieldType) {
        return { error: `${key} is not a valid field.` };
    }

    if (fieldType instanceof Types.String || fieldType instanceof Types.Mixed) {
        return { value: value };
    }
    else if (fieldType instanceof Types.Boolean) {
        return coerceBoolean(key, value);
    } else if (fieldType instanceof Types.Number) {
        return coerceNumber(key, value);
    } else if (fieldType instanceof Types.ObjectId) {
        return coerceObjectId(key, value);
    } else if (fieldType instanceof Types.Date) {
        return coerceDate(key, value);
    } else {
        return { error: `Type coercion is not currently supported for ${fieldType.instance}.` };
    }
}

function coerceBoolean(key, value) {
    value = value.toString().toLowerCase();

    if (value === 'false') {
        return { value: false };
    } else if (value === 'true') {
        return { value: true };
    } else {
        return { error: `Expected type:Boolean for field ${key}` };
    }
}

function coerceNumber(key, value) {
    if (isNaN(value)) {
        return { error: `Expected type:Number for field ${key}` };
    } else {
        return { value: Number(value) };
    }
}

function coerceObjectId(key, value) {
    if (ObjectId.isValid(value)) {
        let id = ObjectId(value);

        // A number can be cast to an ObjectId, but we don't want to for this purpose
        if (id.toString() === value) {
            return { value: id };
        } else {
            return { error: `Expected type:ObjectId for field ${key}` };
        }
    } else {
        return { error: `Expected type:ObjectId for field ${key}` };
    }
}

/**
 * Creates a date range query from a specific date. For instance, if a user asks for date_updated=2018-4-11,
 * it will search for all records where the date_updated value falls somewhere on that day
 * @param {String} key
 * @param {String} value
 */
function coerceDate(key, value) {
    let date = moment(value, DATE_FORMATS);

    if (!date.isValid()) {
        return { error: `Expected type:Datetime for field ${key}` };
    }

    let actualResolution;

    /**
     * If a user provided anything less than a full timestamp, we should assume they want
     * all records from within the resolution they specified.
     *
     * Example 1: User provides 2018-8-6: We should assume they want all records for Aug 6, 2018
     *
     * Example 2: User provides 2018-8-6 10:30 : We should assume they want all records that occurred
     * within that minute
     *
     * We can figure this out by going through each possible included time resolution, in order from
     * smallest to biggest, and seeing if the value of it is 0. The first non-zero value we encounter
     * will be the time resolution provided by the User.
     */
    const possibleResolutions = ['millisecond', 'second', 'minute', 'hour', 'date'];

    for (let i = 0; i < possibleResolutions.length - 1; i++) {
        const resolution = possibleResolutions[i];

        // The Moment object has a function for each of these possible resolutions that returns a Number
        if (date[resolution]() === 0) {
            // If it is 0, then the requested time resolution must be at least the next step up
            actualResolution = possibleResolutions[i + 1];
        } else {
            // If it is not 0, we have reached the time resolution provided by the User
            break;
        }
    }

    // We only accept timestamps with second-resolution, so this conditional should always resolve true
    if (actualResolution) {
        return {
            value: {
                $gte: date.startOf(actualResolution).toDate(),
                $lte: date.endOf(actualResolution).toDate()
            }
        };
    } else {
        return { error: `An unknown error occurred parsing this date: ${value}` };
    }
}

module.exports = {
    DATE_FORMATS,
    coerceValue,
    coerceBoolean,
    coerceNumber,
    coerceObjectId,
    coerceDate
};