const express = require('express');
const bodyParser = require('body-parser');

const { getStackByName } = require('../utils/stack');
const { listLayers, getLayerWithOnlyNames } = require('../utils/layer');
const { rollingRestart } = require('../utils/rolling-restart');

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

router.put('/:stackName/layers/:layerName/rolling-restart', bodyParser.json(), async (req, res) => {
    const { stackName, layerName } = req.params;

    const DEFAULTS = {
        window: 1
    };

    const options = { ...DEFAULTS, ...req.body };

    let { error, instances } = await rollingRestart(stackName, layerName, options);

    if (error) {
        return res.status(404).json({ errors: [error] });
    }

    return res.status(202).json({
        stack: stackName,
        layer: layerName,
        window: options.window,
        totalInstances: instances.length
    });
});

module.exports = {
    router
};