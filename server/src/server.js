const express = require('express');
const Logger = require('logger-nodejs');
const log = new Logger({ name: 'awsuper' });

const app = express();

app.get('/', (req, res) => {
    return res.status(200).json({ msg: 'hello' });
});

function start() {
    log.info('Server listening on Port 4242');
    app.listen(4242);
}

module.exports = {
    app,
    start
};