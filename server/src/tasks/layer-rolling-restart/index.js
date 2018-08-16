const ms = require('ms');
const { listInstancesFromNames, getInstanceByID } = require('../../utils/instance');
const { sleep } = require('../../utils/common');
const { OpsWorks } = require('../../clients/aws');
const log = require('../../utils/logger');
const Model = require('./model');

/**
 * This performs a rolling restart of an opsworks layer
 * @param {Object} msg { _id }
 * @param {Function} ack acknowledge the message
 * @param {Function(requeue)} nack negatively acknowledge the message. requeue=true by default
 */
async function rollingRestart(msg, ack, nack) {
    let task = await Model.findById(msg._id);
    const { stack, layer, window, status: originalStatus } = task;

    // We do not want to ever run more than one rolling restart on a particular stack+layer
    let runningTask = await Model.find({ stack, layer, status: 'RUNNING' }).limit(1);

    if (runningTask.length > 0) {
        // If there is already one of these running, then fail this one
        await Model.findByIdAndUpdate(msg._id, { status: 'FAILED', $push: {
            exceptions: 'Rolling Restart already running for that stack and layer.'
        } });

        // And do not requeue it
        return nack(false);
    }

    // If this task has actually already been finished, cancelled, or failed, discard this message
    if (originalStatus === 'COMPLETED' || originalStatus === 'FAILED' || originalStatus === 'CANCELLED') {
        return nack(false);
    }

    // If we've made it this far, we're clear to start the task, so we'll mark it running
    await Model.findByIdAndUpdate(msg._id, { status: 'RUNNING' });

    let { error, instances } = await listInstancesFromNames(stack, layer);

    // If the stack or layer don't exist, we'll have an error here
    if (error) {
        log.error(error);

        // So we fail the job, and discard the message
        await Model.findByIdAndUpdate(msg._id, { status: 'FAILED', $push: { exceptions: error } });
        return nack(false);
    }

    let restarted = 0;

    // We only want to restart instances that are actually online already
    instances = instances.filter(instance => instance.Status === 'online');

    // If this is the first time this job has been attempted, update the database record with the now discovered totalInstances
    if (originalStatus === 'PENDING') {
        await Model.findByIdAndUpdate(msg._id, { $set: { totalInstances: instances.length } });

        log.info(`Beginning layer-rolling-restart: ${task._id}`);
    } else {
        log.info(`Resuming layer-rolling-restart: ${task._id}`);
    }

    log.info(`Restarting ${instances.length} instances in ${stack}/${layer}, ${window} at a time.`);

    // Go through the instances and restart them {window} at a time with an async process
    for (let i = 0; i < instances.length; i += window) {
        task = await Model.findById(msg._id);

        if (task.status === 'COMPLETED' || task.status === 'FAILED' || task.status === 'CANCELLED') {
            return nack(false);
        }

        let promises = [];
        let awaitingRestart = 0;

        // restart this window of instances
        for (let j = 0; j < window && j + i < instances.length; j++) {
            promises.push(restartInstance(instances[i+j], msg._id, `${j * 15}s`));
            awaitingRestart += 1;
        }

        try {
            await Promise.all(promises);
            restarted += awaitingRestart;
        } catch (e) {
            log.error(e);

            // If there was an error performing any restart, we fail the task and discard the message
            await Model.findByIdAndUpdate(msg._id, { status: 'FAILED', $push: { exceptions: e } });
            return nack(false);
        }

        log.info(`Rolling Restarter for ${stack}/${layer}: ${restarted} / ${instances.length} restarted.`);
    }

    // If we made it this far, the task is completed!
    await Model.findByIdAndUpdate(msg._id, { status: 'COMPLETED' });

    log.info(`Completed layer-rolling-restart: ${task._id}`);

    return ack();
}

/**
 * This shuts down and starts up one instance, by ID
 * @param {String} instanceID
 * @returns {Instance}
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

/**
 * Set the record to status: CANCELLED
 * @param {String|ObjectId} recordID The _id of the record to cancel
 * @returns {Object} The cancelled Task
 */
async function cancelTask(recordID) {
    const cancelledTask = await Model.findByIdAndUpdate(recordID, { $set: { status: 'CANCELLED' } }, { new: true });

    return cancelledTask;
}

module.exports = {
    task: rollingRestart,
    model: Model,
    cancel: cancelTask
};