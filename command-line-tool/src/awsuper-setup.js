const prompt = require('prompt');
const path = require('path');
const os = require('os');
const fs = require('fs');

const configPath = path.join(os.homedir(), '.awsuper');

prompt.message = '';

prompt.start();

const schema = {
    properties: {
        token: {
            type: 'string',
            message: 'The AWSuper outputs a security token when it launches.',
            required: true
        },
        protocol: {
            type: 'string',
            message: 'http / https',
            default: 'http'
        },
        host: {
            type: 'string',
            message: 'Just the hostname. No protocol or port.',
            default: 'localhost'
        },
        port: {
            type: 'number',
            default: 4242
        }
    }
};

console.log(`
Welcome to AWSuper! Before you can use the command line tool,
you need to configure it to connect to the AWSuper server.
`);

prompt.get(schema, (err, result) => {
    if (!err) {
        const config = {
            token: result.token,
            server: {
                protocol: result.protocol,
                host: result.host,
                port: result.port
            }
        };

        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
    }
});