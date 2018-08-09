/**
 * This will pretty-print the JSON description of the stack, layer, or instance.
 */

const program = require('commander');
const awsuper = require('./utils/awsuper-client');

program
    .usage('[options]')
    .option('-s, --stack <stack>', 'A Stack name')
    .option('-l, --layer <layer>', 'A layer name')
    .option('-i, --instance <hostname>', 'an instance hostname')
    .parse(process.argv);

(async () => {
    if (program.stack && program.layer && program.instance) {
        let instance = await awsuper.describeInstance(program.stack, program.layer, program.instance);
        console.log(JSON.stringify(instance, null, 4));
    } else if (program.stack && program.layer) {
        let layer = await awsuper.describeLayer(program.stack, program.layer);
        console.log(JSON.stringify(layer, null, 4));
    } else if (program.stack) {
        let stack = await awsuper.describeStack(program.stack);
        console.log(JSON.stringify(stack, null, 4));
    } else {
        program.outputHelp();
    }
})();
