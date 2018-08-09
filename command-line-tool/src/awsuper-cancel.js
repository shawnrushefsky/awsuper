/**
 * This will cancel a task
 */

const program = require('commander');
const awsuper = require('./utils/awsuper-client');

program
    .usage('<task> <id>')
    .arguments('<task> <id>')
    .action(async (task, id) => {
        let response = await awsuper.cancelTask(task, id);

        console.log(JSON.stringify(response, null, 4));
    })
    .parse(process.argv);