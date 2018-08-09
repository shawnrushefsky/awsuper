/**
 * This will check a task
 */

const awsuper = require('./utils/awsuper-client');

(async () => {
    let response = await awsuper.listAllTasks();

    console.log('     Available Tasks     ');
    console.log('-------------------------');

    for (let task of response) {
        console.log(task);
    }
})();