const express = require('express');
const log = require('./utils/logger');
const authMiddleware = require('./middleware/auth');
const stackRouter = require('./routes/stacks').router;
const config = require('../config');
const taskRouter = require('./routes/tasks').router;

const app = express();

app.use('/stacks', authMiddleware, stackRouter);
app.use('/tasks', authMiddleware, taskRouter);

function start() {
    log.info(`Server listening on Port ${config.server.port}`);

    // rabbit.consume(config.rabbit.queues.rollingRestart, rollingRestart);
    app.listen(config.server.port);
}

module.exports = {
    app,
    start
};