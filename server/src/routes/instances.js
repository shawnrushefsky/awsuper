const express = require('express');

const { listInstancesFromNames, getInstanceByOnlyNames } = require('../utils/instance');

const router = express.Router();

router.get('/:stackName/layers/:layerName/instances', async (req, res) => {
    let { error, instances } = await listInstancesFromNames(req.params.stackName, req.params.layerName);

    if (error) {
        return res.status(404).json({ errors: [error] });
    }

    return res.status(200).json(instances);
});

router.get('/:stackName/layers/:layerName/instances/:hostName', async (req, res) => {
    let { stackName, layerName, hostName } = req.params;
    let { error, instance } = await getInstanceByOnlyNames(stackName, layerName, hostName);

    if (error) {
        return res.status(404).json({ errors: [error] });
    }

    return res.status(200).json(instance);
});

module.exports = {
    router
};