const { OpsWorks } = require('../clients/aws');

async function listStacks() {
    console.log('Describing stacks');
    let stacks = await OpsWorks.describeStacks({}).promise();
    console.log(stacks);

    return stacks;
}

module.exports = {
    listStacks
};