const { OpsWorks } = require('../clients/aws');
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

module.exports = {
    listInstances
};