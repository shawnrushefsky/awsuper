const express = require('express');
const log = require('./utils/logger');

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