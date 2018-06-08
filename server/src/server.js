const express = require('express');
const log = require('./utils/logger');
const authMiddleware = require('./middleware/auth');
const stackRouter = require('./routes/stacks').router;

const app = express();

app.use('/stacks', authMiddleware, stackRouter);

function start() {
    log.info('Server listening on Port 4242');
    app.listen(4242);
}

module.exports = {
    app,
    start
};