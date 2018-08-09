const program = require('commander');
const pjson = require('../package.json');

program
    .version(pjson.version)
    .command('describe', 'Describe a Stack, Layer, or Instance').alias('d')
    .parse(process.argv);