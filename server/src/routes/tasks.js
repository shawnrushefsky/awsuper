const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const ms = require('ms');
const rabbit = require('../clients/rabbit');
const { queryParamsMiddleware } = require('../middleware/query-params');
const log = require('../utils/logger');
const { DATE_FORMATS } = require('../utils/coerce');
const { parsePersistError, errorTypes, messages } = require('../utils/errors');

const taskDir = path.join(__dirname, '..', 'tasks');

const router = express.Router();

router.use(bodyParser.json());

let directories = [];

function loadTasks() {
    directories = fs.readdirSync(taskDir);

    for (let taskName of directories) {
        log.info(`Loading Task: ${taskName}`);
        let taskPath = path.join(taskDir, taskName);
        try {
            let task = require(taskPath);

            // This endpoint starts a new task, with an optional delay
            router.post(`/${taskName}`, async (req, res) => {
                try {
                    const createdTask = await task.model.create(req.body);

                    let { delay: rawDelay, when: rawWhen } = req.params;

                    let { delay, error } = getDelay(rawDelay, rawWhen);

                    if (error) {
                        return res.status(400).json({ errors: [error] });
                    }

                    await rabbit.scheduledPublish(taskName, { _id: createdTask._id }, delay);

                    return res.status(202).json(createdTask);
                } catch (e) {
                    let { errors, errorType } = parsePersistError(e);

                    if (errorType === errorTypes.CLIENT) {
                        return res.status(400).json( { errors });
                    } else {
                        return res.status(500).json( { errors });
                    }
                }
            });

            // This endpoint retrieves 1 task by ID
            router.get(`/${taskName}/:id`, async (req, res) => {
                try {
                    const retrievedTask = await task.model.findById(req.params.id);

                    if (!retrievedTask) {
                        return res.status(404).json({ errors: [`No ${taskName} with that name could be found.`] });
                    } else {
                        return res.status(200).json(retrievedTask);
                    }
                } catch (e) {
                    log.error(e);
                    return res.status(500).json({
                        errors: [messages.INTERNAL_ERROR]
                    });
                }
            });

            // This endpoint queries the database for tasks based on URL Query Parameters
            router.get(`/${taskName}`, queryParamsMiddleware(task.model), async (req, res) => {
                try {
                    let count;

                    if (Object.keys(req.mongoQuery).length === 0) {
                        // This is faster for getting the total count of the entire collection
                        count = task.model.estimatedDocumentCount();
                    } else {
                        count = task.model.countDocuments(req.mongoQuery);
                    }

                    const num_found = await count;

                    let query = task.model.find(req.mongoQuery)
                        .skip(req.skip)
                        .limit(req.limit);

                    req.sort && query.sort(req.sort);

                    let data = await query;

                    return res.status(200).json({ num_found, data });
                } catch (e) {
                    log.error(e);
                    return res.status(500).json({
                        errors: [messages.INTERNAL_ERROR]
                    });
                }
            });

            // This endpoint cancels a running task
            router.delete(`/${taskName}/:id`, async (req, res) => {
                try {
                    const cancelledTask = await task.cancel(req.params.id);

                    return res.status(200).json(cancelledTask);
                } catch (e) {
                    let { errors, errorType } = parsePersistError(e);

                    if (errorType === errorTypes.CLIENT) {
                        return res.status(400).json( { errors });
                    } else {
                        return res.status(500).json( { errors });
                    }
                }
            });

            // We also need set up the consumer to actually perform created tasks
            rabbit.consume(taskName, task.task);
            log.info(`Task Loaded: ${taskName}`);
        } catch (e) {
            log.error(e);
        }
    }
}

/**
 * Calculates how long a delay should be based on 2 optional parameters.
 * @param {*} delay Either a number of milliseconds, or a ms-compatible string like "1d"
 * @param {*} when A string matching one of DATE_FORMATS
 * @returns {Object} { delay, error }. Error will be undefined if no errors. Delay is a Number of
 * milliseconds
 */
function getDelay(delay, when) {
    if (delay) {
        if (isNaN(delay)) {
            try {
                delay = ms(delay);
            } catch (e) {
                return { error: 'Invalid value for "delay" parameter' };
            }
        } else {
            delay = Number(delay);
        }
    } else if (when) {
        let actualWhen = moment(when, DATE_FORMATS);

        if (!actualWhen.isValid()) {
            return { error: `${when} is not a valid Date format. Use one of: ${DATE_FORMATS}` };
        }

        delay = actualWhen.diff(moment());
    } else {
        delay = 0;
    }

    return { delay };
}

loadTasks();

router.get('/', async (req, res) => {
    return res.status(200).json(directories);
});

module.exports = { router };