const ms = require('ms');
const moment = require('moment');

const log = require('../../utils/logger');
const rabbit = require('../../clients/rabbit');
const { DATE_FORMATS } = require('../../utils/coerce');
const { parsePersistError, errorTypes, messages } = require('../../utils/errors');

function doTask(taskName, task) {
    return async (req, res) => {
        try {
            let createdTask = await task.model.create(req.body);

            let { delay: rawDelay, when: rawWhen } = req.query;

            let { delay, error } = getDelay(rawDelay, rawWhen);

            if (error) {
                log.error(error);
                return res.status(400).json({ errors: [error] });
            }

            try {
                await rabbit.publish(taskName, { _id: createdTask._id }, delay);
            } catch (e) {
                // If we fail to enqueue in rabbit, fail the task.
                log.error(messages.ENQUEING);

                createdTask = await task.model.findByIdAndUpdate(createdTask._id, { status: 'FAILED', $push: {
                    exceptions: messages.ENQUEING
                } });

                return res.status(500).json({ errors: [messages.ENQUEING] });
            }


            return res.status(202).json(createdTask);
        } catch (e) {
            let { errors, errorType } = parsePersistError(e);
            log.error(e);

            if (errorType === errorTypes.CLIENT) {
                return res.status(400).json( { errors });
            } else {
                return res.status(500).json( { errors });
            }
        }
    };
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

module.exports = { doTask, getDelay };