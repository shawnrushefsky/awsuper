/**
 * This will start a task
 */

const program = require('commander');
const awsuper = require('./utils/awsuper-client');

program
    .usage('<task> [key=value...]')
    .arguments('<task> [options...]')
    .action(async (task, opts) => {
        let body = {};

        for (let pair of opts) {
            let [ key, value ] = pair.split('=');
            body[key] = value;
        }

        let response = await awsuper.doTask(task, body);

        console.log(JSON.stringify(response, null, 4));
    })
    .parse(process.argv);