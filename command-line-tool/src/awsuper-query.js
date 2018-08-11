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

        let { num_found, data } = response;
        let page_num = params.page || 1;

        let page_size = Math.min(params.limit || 10, 50);

        console.log(`Total Found: ${num_found}`);
        console.log(`Displaying Page ${page_num} (${page_size} per page)`);
        console.log('====================================================');

        for (let item of data) {
            console.log(JSON.stringify(item, null, 4));
        }

        console.log('====================================================');

        if (data.length < page_size) {
            console.log('>>> END OF COLLECTION <<<');
        }
    })
    .parse(process.argv);