const express = require('express');
const log = require('./utils/logger');
const authMiddleware = require('./middleware/auth');
const stackRouter = require('./routes/stacks').router;
const config = require('../config');


const app = express();

app.use('/stacks', authMiddleware, stackRouter);


function start() {
    const taskRouter = require('./routes/tasks').router;
    app.use('/tasks', authMiddleware, taskRouter);

    log.info(`Server listening on Port ${config.server.port}`);

    // rabbit.consume(config.rabbit.queues.rollingRestart, rollingRestart);
    app.listen(config.server.port);
}

module.exports = {
    app,
    start
};