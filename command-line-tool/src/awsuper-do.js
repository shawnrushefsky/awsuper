/**
 * This will start a task
 */

const program = require('commander');
const awsuper = require('./utils/awsuper-client');

program
    .usage('<task> [key=value...]')
    .arguments('<task> [options...]')
    .option('-d, --delay <delay>', 'How far in the future to perform this task. Example: 1d, 12h, 5m')
    .option('-w, --when <datetime>', 'A specific date time in the future (relative to server-time) to perform the task')
    .action(async (task, opts, cmd) => {
        let body = {};

        for (let pair of opts) {
            let [ key, value ] = pair.split('=');
            body[key] = value;
        }

        let { delay, when } = cmd;

        let response = await awsuper.delayTask(task, body, { delay, when });

        console.log(JSON.stringify(response, null, 4));
    })
    .parse(process.argv);