const { OpsWorks } = require('../clients/aws');
const { getLayerWithOnlyNames } = require('./layer');
const { mapByName } = require('./common');

async function listInstances({ stack, layer }) {
    let params = {};

    if (stack) {
        params.StackId = stack;
    } else if (layer) {
        params.LayerId = layer;
    }

    let instances = await OpsWorks.describeInstances(params).promise();

    return instances.Instances;
}

async function listInstancesFromNames(stackName, layerName) {
    let { error, layer, stack } = await getLayerWithOnlyNames(stackName, layerName);

    if (error) {
        return { error };
    }

    let instances = await listInstances({ layer: layer.LayerId });

    return { instances, layer, stack };
}

async function getInstanceByID(instanceID) {
    let params = {
        InstanceIds: [instanceID]
    };

    let instances = await OpsWorks.describeInstances(params).promise();

    if (instances.Instances.length > 0) {
        return instances.Instances[0];
    }

    return null;
}

async function getInstanceByOnlyNames(stackName, layerName, hostName) {
    let { error, instances, layer, stack } = await listInstancesFromNames(stackName, layerName);

    if (error) {
        return { error };
    }

    const instanceMap = mapByName(instances);

    // See if the hostname provided is among the returned instances
    if (instanceMap[hostName]) {
        return { instance: instanceMap[hostName], layer, stack };
    }

    // It is also acceptible to just provide a number
    hostName = Number(hostName);

    if (isNaN(hostName)) {
        return { error: 'No instance with that name exists' };
    }

    // We can use that number to build a hostname
    hostName = `${layer.Shortname.toLowerCase()}${hostName}`;

    if (instanceMap[hostName]) {
        return { instance: instanceMap[hostName], layer, stack };
    }

    return { instance: instanceMap[hostName], layer, stack };
}

module.exports = {
    getInstanceByID,
    listInstances,
    listInstancesFromNames,
    getInstanceByOnlyNames
};