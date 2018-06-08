const { OpsWorks } = require('../clients/aws');
const { mapByName } = require('./common');

const { getStackByName } = require('./stack');

/**
 * Returns an array of Layer objects from the specified stack
 * @param {String} stackID the StackId of the Stack
 */
async function listLayers(stackID) {
    let layers = await OpsWorks.describeLayers({
        StackId: stackID
    }).promise();

    // We really just need the array of stacks
    return layers.Layers;
}

/**
 * Returns a Layer object by name if it is found in the specified stack.
 * @param {String} stackID The StackId of the stack
 * @param {String} layerName The Name of the layer
 * @returns {Object} { error, layer }
 */
async function getLayerByName(stackID, layerName) {
    layerName = layerName.toLowerCase();
    let layerArray = await listLayers(stackID);
    let layers = mapByName(layerArray);

    if (layers[layerName]) {
        return { layer: layers[layerName] };
    }

    return { error: `That stack does not container a Layer named ${layerName}` };
}

async function getLayerWithOnlyNames(stackName, layerName) {
    let { error, stack } = await getStackByName(stackName);

    if (error) {
        return { error };
    }

    let layer = await getLayerByName(stack.StackId, layerName);

    if (layer.error) {
        return { error: layer.error };
    }

    return { layer: layer.layer };
}

module.exports = {
    listLayers,
    getLayerByName,
    getLayerWithOnlyNames
};