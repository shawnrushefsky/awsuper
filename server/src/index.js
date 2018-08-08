const server = require('./server');
const { generateJWT } = require('./utils/auth');
const rabbit = require('./clients/rabbit');
const mongo = require('./clients/mongo');

(async () => {
    console.log(`
    *******************TOKEN*******************
    ${generateJWT()}
    *******************************************
    `);

    await mongo.connect();
    await rabbit.connect();

    server.start();
})();
