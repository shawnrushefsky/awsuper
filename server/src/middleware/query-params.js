const _ = require('lodash');
const mongoose = require('mongoose');
const moment = require('moment');
const { coerceValue, DATE_FORMATS } = require('../utils/coerce');
const { Types } = mongoose.Schema;

const DEFAULT_PARAMS = { page: 1, limit: 10 };
const MAX_LIMIT = 50;

const SORT_DIR_MAP = {
    'asc': 1,
    'ascending': 1,
    'desc': -1,
    'descending': -1
};

const SORT_DIRECTIONS = Object.keys(SORT_DIR_MAP).join(', ');

/**
 * This will return a middleware that parses query parameters into a mongo find query
 * that corresponds to the provided model. It handles type conversion, $or, and range queries.
 * @param {mongoose.Model} model
 */
function queryParamsMiddleware(model) {
    return (req, res, next) => {
        const { query: rawQuery } = req;

        let query = {};
        let errors = [];

        let { sort, limit, page } = { ...DEFAULT_PARAMS, ...rawQuery };

        /**
         * ?sort[key]=asc will sort by key, in ascending order
         */
        if (sort) {
            let { value, errors: sortErrors } = getSortQuery(sort);

            if (sortErrors) {
                errors = errors.concat(sortErrors);
            } else {
                req.sort = value;
            }

            delete rawQuery.sort;
        }

        // This is for how many results to return in one request
        if (isNaN(limit) || limit < 1) {
            errors.push('limit must be a positive integer.');
        } else {
            // Set limit to the lower of the provided number, or the max limit
            req.limit = Math.min(parseInt(limit), MAX_LIMIT);
        }
        delete rawQuery.limit;

        // This is interpreted as database offset when querying, to allow pagination of results
        if (isNaN(page) || page < 0) {
            errors.push('page must be an integer >= 0');
        } else {
            page = parseInt(page);

            req.skip = (page - 1) * req.limit;
        }
        delete rawQuery.page;

        // Process the remaining query parameters
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

                if (!fieldType) {
                    errors.push(`${key} is not a valid field`);
                    continue;
                }

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
            } else {
                errors.push(`Could not parse query for field: ${key}`);
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

function getSortQuery(sort, model) {
    let sortOpts = {};
    let errors = [];

    for (let field in sort) {
        const fieldType = model.schema.paths[field];

        if (!fieldType) {
            errors.push(`${field} is not a valid field`);
            continue;
        }
        let dirStr = sort[field];
        let mongoDir = SORT_DIR_MAP[dirStr];

        if (mongoDir) {
            sortOpts[field] = mongoDir;
        } else {
            errors.push(`${dirStr} is not a valid sort direction. Use one of: ${SORT_DIRECTIONS}`);
        }
    }

    if (errors.length > 0) {
        return { errors };
    }

    return { value: sortOpts };
}

module.exports = {
    queryParamsMiddleware,
    getDateRangeQuery,
    getRangeQuery,
    getSortQuery
};