const server = require('./server');
const { generateJWT } = require('./utils/auth');

console.log(`
*******************TOKEN*******************
${generateJWT()}
*******************************************
`);

server.start();