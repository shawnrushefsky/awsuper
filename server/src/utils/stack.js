const { OpsWorks } = require('../clients/aws');
const { mapByName } = require('./common');

/**
 * Returns an array of Stack objects
 */
async function listStacks() {
    let stacks = await OpsWorks.describeStacks({}).promise();

    // We really just need the array of stacks
    return stacks.Stacks;
}

/**
 * This will return a Stack object by name, or return an error if it doesn't exist
 * @param {String} name The name of the Stack
 * @returns {Object} { error, stack }
 */
async function getStackByName(name) {
    name = name.toLowerCase();
    const stackArray = await listStacks();
    const stacks = mapByName(stackArray);

    if (stacks[name]) {
        return { stack: stacks[name] };
    } else {
        return { error: `No stack named ${name}` };
    }
}

module.exports = {
    listStacks,
    getStackByName
};