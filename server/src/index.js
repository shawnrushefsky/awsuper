const server = require('./server');
const { generateJWT } = require('./utils/auth');
const rabbit = require('./clients/rabbit');

(async () => {
    console.log(`
    *******************TOKEN*******************
    ${generateJWT()}
    *******************************************
    `);

    await rabbit.connect();

    server.start();
})();
