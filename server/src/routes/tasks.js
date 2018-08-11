const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const rabbit = require('../clients/rabbit');
const { queryParamsMiddleware } = require('../middleware/query-params');
const log = require('../utils/logger');
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

            // This endpoint starts a new task
            router.post(`/${taskName}`, async (req, res) => {
                try {
                    const createdTask = await task.model.create(req.body);

                    await rabbit.sendToQueue(taskName, { _id: createdTask._id });

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
                    const tasks = await task.model.find(req.mongoQuery);

                    return res.status(200).json(tasks);
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

loadTasks();

router.get('/', async (req, res) => {
    return res.status(200).json(directories);
});

module.exports = { router };