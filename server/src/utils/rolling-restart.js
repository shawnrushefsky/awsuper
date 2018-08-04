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
async function rollingRestart(msg, ack, nack) {
    let { stackName, layerName, options } = msg;

    let { error, instances } = await listInstancesFromNames(stackName, layerName);

    if (error) {
        log.error(error);
        return nack(false);
    }

    // Merge user provided options with default options
    options = { ...DEFAULT_OPTIONS, ...options };

    let restarted = [];

    // We only want to restart instances that are actually online already
    instances = instances.filter(instance => instance.Status === 'online');

    log.info(`Restarting ${instances.length} instances in ${stackName}/${layerName}, ${options.window} at a time.`);

    // Go through the instances and restart them {options.window} at a time with an async process
    for (let i = 0; i < instances.length; i += options.window) {
        let promises = [];
        let awaitingRestart = [];

        // restart this window of instances
        for (let j = 0; j < options.window && j + i < instances.length; j++) {
            const instanceID = instances[i+j].InstanceId;
            promises.push(restartInstance(instanceID, `${j * 15}s`));
            awaitingRestart.push(instanceID);
        }

        try {
            await Promise.all(promises);
            restarted = restarted.concat(awaitingRestart);
        } catch (e) {
            log.error(e);
            return nack(false);
        }

        log.info(`Rolling Restarter for ${stackName}/${layerName}: ${restarted.length} / ${instances.length} restarted.`);
    }

    return ack();
}

/**
 * This shuts down and starts up one instance, by ID
 * @param {String} instanceID
 */
async function restartInstance(instanceID, offset='0s') {
    // Stop the instance
    log.info(`Stopping Instance: ${instanceID}`);
    await OpsWorks.stopInstance({ InstanceId: instanceID }).promise();

    let instance = { Status: undefined };

    // Wait for it to be stopped
    do {
        await sleep(ms('1m') + ms(offset));

        instance = await getInstanceByID(instanceID);
    } while (instance.Status !== 'stopped');

    // Start the instance
    log.info(`Starting Instance: ${instanceID}`);
    await OpsWorks.startInstance({ InstanceId: instanceID }).promise();

    // Wait for it to be online
    do {
        await sleep(ms('1m') + ms(offset));

        instance = await getInstanceByID(instanceID);
    } while (instance.Status !== 'online');

    return instance;
}

module.exports = {
    rollingRestart,
    restartInstance
};