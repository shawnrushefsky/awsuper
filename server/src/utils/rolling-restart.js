const { listInstancesFromNames } = require('./instance');

async function rollingRestart(stackName, layerName, options) {
    let { error, instances } = await listInstancesFromNames(stackName, layerName);

    if (error) {
        return { error };
    }

    // Go through the instances and restart them {options.window} at a time with an async process

    return { instances };
}

module.exports = {
    rollingRestart
};