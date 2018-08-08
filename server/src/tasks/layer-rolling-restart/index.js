const ms = require('ms');
const { listInstancesFromNames, getInstanceByID } = require('../../utils/instance');
const { sleep } = require('../../utils/common');
const { OpsWorks } = require('../../clients/aws');
const log = require('../../utils/logger');
const Model = require('./model');

/**
 * This performs a rolling restart of an opsworks layer
 * @param {String} stackName
 * @param {String} layerName
 * @param {Object} options
 */
async function rollingRestart(msg, ack, nack) {
    const task = await Model.findById(msg._id);
    const { stackName, layerName, window } = task;

    const originalStatus = task.status;

    await Model.findByIdAndUpdate(msg._id, { status: 'RUNNING' });

    let { error, instances } = await listInstancesFromNames(stackName, layerName);

    if (error) {
        log.error(error);
        return nack(false);
    }

    // Merge user provided options with default options

    let restarted = [];

    // We only want to restart instances that are actually online already
    instances = instances.filter(instance => instance.Status === 'online');

    // If this is the first time this job has been attempted, update the database record with the now discovered totalInstances
    if (originalStatus === 'PENDING') {
        await Model.findByIdAndUpdate(msg._id, { $set: { totalInstances: instances.length } });
    }

    log.info(`Restarting ${instances.length} instances in ${stackName}/${layerName}, ${window} at a time.`);

    // Go through the instances and restart them {window} at a time with an async process
    for (let i = 0; i < instances.length; i += window) {
        let promises = [];
        let awaitingRestart = [];

        // restart this window of instances
        for (let j = 0; j < window && j + i < instances.length; j++) {
            promises.push(restartInstance(instances[i+j], msg._id, `${j * 15}s`));
            awaitingRestart.push(instances[i+j]);
        }

        try {
            await Promise.all(promises);
            restarted = restarted.concat(awaitingRestart);
        } catch (e) {
            log.error(e);
            await Model.findByIdAndUpdate(msg._id, { status: 'FAILED' });
            return nack(false);
        }

        log.info(`Rolling Restarter for ${stackName}/${layerName}: ${restarted.length} / ${instances.length} restarted.`);
    }

    await Model.findByIdAndUpdate(msg._id, { status: 'COMPLETED' });

    return ack();
}

/**
 * This shuts down and starts up one instance, by ID
 * @param {String} instanceID
 */
async function restartInstance(instance, recordID, offset='0s') {
    const { InstanceId, Hostname } = instance;

    // Stop the instance
    log.info(`Stopping Instance: ${InstanceId}`);
    await OpsWorks.stopInstance({ InstanceId }).promise();

    await Model.findByIdAndUpdate(recordID, {
        $push: { instancesShutdown: { InstanceId, Hostname } }
    });

    // Wait for it to be stopped
    do {
        await sleep(ms('1m') + ms(offset));

        instance = await getInstanceByID(InstanceId);
    } while (instance.Status !== 'stopped');

    // Start the instance
    log.info(`Starting Instance: ${InstanceId}`);
    await OpsWorks.startInstance({ InstanceId }).promise();

    await Model.findByIdAndUpdate(recordID, {
        $push: { instancesStarted: { InstanceId, Hostname } }
    });

    // Wait for it to be online
    do {
        await sleep(ms('1m') + ms(offset));

        instance = await getInstanceByID(InstanceId);
    } while (instance.Status !== 'online');

    await Model.findByIdAndUpdate(recordID, {
        $push: { instancesOnline: { InstanceId, Hostname } }
    });

    return instance;
}

module.exports = {
    task: rollingRestart,
    model: Model
};