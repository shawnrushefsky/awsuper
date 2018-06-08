const { listStacks } = require('./utils/stack');

(async () => {
    let stacks = await listStacks();

    console.log(stacks);
})();