const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const rabbit = require('../clients/rabbit');
const { queryParamsMiddleware } = require('../middleware/query-params');
const log = require('../utils/logger');
const { doTask } = require('./endpoints/do-task');
const { getTaskByID, queryAllTasks } = require('./endpoints/get-task');
const { cancelTask } = require('./endpoints/cancel-task');

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
            router.post(`/${taskName}`, doTask(taskName, task));

            // This endpoint retrieves 1 task by ID
            router.get(`/${taskName}/:id`, getTaskByID(taskName, task));

            // This endpoint queries the database for tasks based on URL Query Parameters
            router.get(`/${taskName}`, queryParamsMiddleware(task.model), queryAllTasks(task));

            // This endpoint cancels a running task
            router.delete(`/${taskName}/:id`, cancelTask(task));

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