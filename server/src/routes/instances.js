const express = require('express');

const { getLayerWithOnlyNames } = require('../utils/layer');
const { listInstances } = require('../utils/instance');

const router = express.Router();

router.get('/:stackName/layers/:layerName/instances', async (req, res) => {
    let { error, layer } = await getLayerWithOnlyNames(req.params.stackName, req.params.layerName);

    if (error) {
        return res.status(404).json({ errors: [error] });
    }

    let instances = await listInstances({ layer: layer.LayerId });

    return res.status(200).json(instances);
});

module.exports = {
    router
};