/**
 * This will start a task
 */

const program = require('commander');
const awsuper = require('./utils/awsuper-client');

program
    .usage('<task> <time> [key=value...]')
    .arguments('<task> <time> [options...]')
    .action(async (task, time, opts) => {
        let job = {};

        for (let pair of opts) {
            let [ key, value ] = pair.split('=');
            job[key] = value;
        }

        let response = await awsuper.scheduleTask(task, job, time);

        console.log(JSON.stringify(response, null, 4));
    })
    .parse(process.argv);