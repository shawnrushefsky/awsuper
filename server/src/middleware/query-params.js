const _ = require('lodash');
const mongoose = require('mongoose');
const moment = require('moment');
const { coerceValue, DATE_FORMATS } = require('../utils/coerce');
const { Types } = mongoose.Schema;

/**
 * This will return a middleware that parses query parameters into a mongo find query
 * that corresponds to the provided model. It handles type conversion, $or, and range queries.
 * @param {mongoose.Model} model
 */
function queryParamsMiddleware(model) {
    return async (req, res, next) => {
        const { query: rawQuery } = req;

        let query = {};
        let errors = [];

        for (let key in rawQuery) {
            let rawValue = rawQuery[key];
            if (_.isString(rawValue)) {
                let { value, error } = coerceValue(key, rawValue, model);

                if (error) {
                    errors.push(error);
                    continue;
                }

                query[key] = value;
            } else if (Array.isArray(rawValue)) {
                /**
                 * ?key=value1&key=value2 gets received as { key: [value1, value2] }
                 *
                 * We are going to interpret this as an $or query, where key can be either value1 or value2
                 */
                query.$or = rawValue.map(opt => {
                    let { value, error } = coerceValue(key, rawValue, model);

                    if (error) {
                        errors.push(error);
                    } else {
                        return { [opt]: value };
                    }
                });
            } else if (_.isPlainObject(rawValue)) {
                /**
                 * ?key[min]=45&key[max]=100 get received as { key { min: 45, max: 100 }}
                 *
                 * We use this to construct a range query
                 */
                const fieldType = model.schema.paths[key];

                let queryFunc;

                if (fieldType === Types.Date) {
                    queryFunc = getDateRangeQuery;
                } else {
                    queryFunc = getRangeQuery;
                }

                let { value, error } = queryFunc(key, rawValue, model);

                if (error) {
                    errors.push(error);
                } else {
                    query[key] = value;
                }
            }
        }

        // If there were any errors processing the query params, return a 400
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        req.mongoQuery = query;
        return next();
    };
}

/**
 * Construct a date range query, using moment.js to understand date strings
 * @param {String} key
 * @param {Object} rawValue
 * @param {mongoose.Model} model unsused here, but required to match an interface.
 */
function getDateRangeQuery(key, rawValue, model) {
    const { min, max } = rawValue;
    let query = {};

    if (min) {
        let date = moment(min, DATE_FORMATS);

        if (!date.isValid()) {
            return { error: `${min} is not a valid date format. Use one of: ${DATE_FORMATS}` };
        }

        query.$gte = date;
    }

    if (max) {
        let date = moment(max, DATE_FORMATS);

        if (!date.isValid()) {
            return { error: `${max} is not a valid date format. Use one of: ${DATE_FORMATS}` };
        }

        query.$lte = date;
    }

    return { value: query };
}

/**
 * Construct a range query, applying appropriate type coercion
 * @param {String} key
 * @param {Object} rawValue
 * @param {mongoose.Model} model This is used to handle type coercion correctly for the model
 */
function getRangeQuery(key, rawValue, model) {
    const { min, max } = rawValue;
    let query = {};

    if (min) {
        let { value, error } = coerceValue(key, min, model);

        if (error) {
            return { error };
        }

        query.$gte = value;
    }

    if (max) {
        let { value, error } = coerceValue(key, max, model);

        if (error) {
            return { error };
        }

        query.$lte = value;
    }

    return { value: query };
}

module.exports = {
    queryParamsMiddleware,
    getDateRangeQuery,
    getRangeQuery
};