const express = require('express');

const { listStacks, getStackByName } = require('../utils/stack');
const layerRouter = require('./layers').router;

const router = express.Router();

router.get('/', async (req, res) => {
    let stacks = await listStacks();

    return res.status(200).json(stacks);
});

router.get('/:name', async (req, res) => {
    let { error, stack } = await getStackByName(req.params.name);

    if (error) {
        return res.status(404).json({
            errors: [error]
        });
    }

    return res.status(200).json(stack);
});

router.use('/', layerRouter);

module.exports = {
    router
};