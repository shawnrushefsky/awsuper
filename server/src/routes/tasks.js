const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const rabbit = require('../clients/rabbit');
const log = require('../utils/logger');
const { parsePersistError, errorTypes } = require('../utils/errors');

const taskDir = path.join(__dirname, '..', 'tasks');

const router = express.Router();

router.use(bodyParser.json());

function loadTasks() {
    let directories = fs.readdirSync(taskDir);

    for (let taskName of directories) {
        let taskPath = path.join(taskDir, taskName);
        try {
            let task = require(taskPath);

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

            router.get(`/${taskName}/:id`, async (req, res) => {
                try {
                    const task = await task.model.findOneById(req.params.id);

                    if (!task) {
                        return res.status(404).json({ errors: [`No ${taskName} with that name could be found.`] });
                    } else {
                        return res.status(200).json(task);
                    }
                } catch (e) {
                    log.error(e);
                    return res.status(500).json({
                        'errors': ['An internal error was encountered while processing your request.']
                    });
                }
            });

            rabbit.consume(taskName, task.task);
        } catch (e) {
            log.error(e);
        }
    }
}

loadTasks();

module.exports = { router };