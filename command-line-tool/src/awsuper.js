const program = require('commander');
const pjson = require('../package.json');

program
    .version(pjson.version)
    .command('describe', 'Describe a Stack, Layer, or Instance').alias('d')
    .command ('list', 'List all Stacks, layers in a specified stack, or instances in a specified layer').alias('ls')
    .command('do', 'Start a new Task')
    .command('check', 'Check a running Task')
    .command('cancel', 'Cancel a running Task')
    .parse(process.argv);