const { listInstancesFromNames, getInstanceByID } = require('./instance');
const { sleep } = require('../utils/common');
const { OpsWorks } = require('../clients/aws');
const ms = require('ms');
const log = require('./logger');

const DEFAULT_OPTIONS = {
    window: 1
};

/**
 * This performs a rolling restart of an opsworks layer
 * @param {String} stackName
 * @param {String} layerName
 * @param {Object} options
 */
async function rollingRestart(stackName, layerName, options) {
    let { error, instances } = await listInstancesFromNames(stackName, layerName);

    if (error) {
        return { error };
    }

    // Merge user provided options with default options
    options = { ...DEFAULT_OPTIONS, ...options };

    let restarted = [];

    log.info(`Restarting ${instances.length} instances in ${stackName}/${layerName}, ${options.window} at a time.`);

    // Go through the instances and restart them {options.window} at a time with an async process
    for (let i = 0; i < instances.length; i += options.window) {
        let promises = [];
        let awaitingRestart = [];

        for (let j = 0; j < options.window, j + i < instances.length; j++) {
            const instanceID = instances[i+j].InstanceId;
            promises.push(restartInstance(instanceID, `${j * 15}s`));
            awaitingRestart.push(instanceID);
        }

        try {
            await Promise.all(promises);
        } catch (e) {
            return { error: e };
        }

        restarted = restarted.concat(awaitingRestart);

        log.info(`Rolling Restarter for ${stackName}/${layerName}: ${restarted.length} / ${instances.length} restarted.`);
    }

    return { instances };
}

/**
 * This shuts down and starts up one instance, by ID
 * @param {String} instanceID
 */
async function restartInstance(instanceID, offset='0s') {
    await OpsWorks.rebootInstance({ InstanceId: instanceID });

    let instance = { status: 'rebooting' };

    do {
        await sleep(ms('1m') + ms(offset));

        instance = await getInstanceByID(instanceID);

    } while (instance.status !== 'online');

    return instance;
}

module.exports = {
    rollingRestart,
    restartInstance
};