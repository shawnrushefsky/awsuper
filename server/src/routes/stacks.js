const express = require('express');

const { listStacks } = require('../utils/stack');

const router = express.Router();

router.get('/', async (req, res) => {
    let stacks = await listStacks();

    return res.status(200).json(stacks.Stacks);
});

module.exports = {
    router
};