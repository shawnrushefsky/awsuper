/**
 * This will query tasks
 */

const program = require('commander');
const awsuper = require('./utils/awsuper-client');

program
    .usage('<task> [key=value...]')
    .arguments('<task> [options...]')
    .action(async (task, opts) => {
        let params = {};

        for (let pair of opts) {
            let [ key, value ] = pair.split('=');
            params[key] = value;
        }

        let response = await awsuper.queryTasks(task, params);

        console.log(JSON.stringify(response, null, 4));
    })
    .parse(process.argv);