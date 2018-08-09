/**
 * This will pretty-print a JSON Array of the contents of a specified stack or layer.
 */

const program = require('commander');
const awsuper = require('./utils/awsuper-client');

program
    .usage('[options]')
    .option('-s, --stack <stack>', 'A Stack name')
    .option('-l, --layer <layer>', 'A layer name')
    .parse(process.argv);

(async () => {
    if (program.stack && program.layer) {
        let layer = await awsuper.getInstancesInLayer(program.stack, program.layer);
        console.log(JSON.stringify(layer, null, 4));
    } else if (program.stack) {
        let stack = await awsuper.getLayersInStack(program.stack);
        console.log(JSON.stringify(stack, null, 4));
    } else {
        let stacks = await awsuper.getAllStacks();
        console.log(JSON.stringify(stacks, null, 4));
    }
})();
