const program = require('commander');
const pjson = require('../package.json');

program
    .version(pjson.version)
    .command('describe', 'Describe a Stack, Layer, or Instance').alias('d')
    .command ('list', 'List all Stacks, layers in a specified stack, or instances in a specified layer').alias('ls')
    .parse(process.argv);