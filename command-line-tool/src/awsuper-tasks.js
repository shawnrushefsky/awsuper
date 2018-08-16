/**
 * This will check a task
 */

const awsuper = require('./utils/awsuper-client');

(async () => {
    let response = await awsuper.listAllTasks();

    if (response.errors) {
        console.log(JSON.stringify(response, null, 4));
    } else {
        console.log('     Available Tasks     ');
        console.log('-------------------------');

        for (let task of response) {
            console.log(task);
        }
    }
})();