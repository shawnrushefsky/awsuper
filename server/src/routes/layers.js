const express = require('express');
const { getStackByName } = require('../utils/stack');
const { listLayers, getLayerWithOnlyNames } = require('../utils/layer');

const router = express.Router();

router.get('/:stackName/layers', async (req, res) => {
    let { error, stack } = await getStackByName(req.params.stackName);

    if (error) {
        return res.status(404).json({
            errors: [error]
        });
    }

    let layers = await listLayers(stack.StackId);

    return res.status(200).json(layers);
});

router.get('/:stackName/layers/:name', async (req, res) => {
    let { error, layer } = await getLayerWithOnlyNames(req.params.stackName, req.params.name);

    if (error) {
        return res.status(404).json({
            errors: [error]
        });
    }

    return res.status(200).json(layer);
});

module.exports = {
    router
};