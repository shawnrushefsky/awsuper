const path = require('path');
const os = require('os');
const fs = require('fs');
const log = require('./logger');
const axios = require('axios');

const configPath = path.join(os.homedir(), '.awsuper');

if (!fs.existsSync(configPath)) {
    log.fatal('Place your auth token in a file: ~/.awsuper');
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath).toString());

const url = `${config.server.protocol}://${config.server.host}:${config.server.port}`;

const client = axios.create({
    baseURL: url,
    headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
    },
    validateStatus: status => !!status
});

async function get(url, params) {
    try {
        let res = await client.get(url, params);

        return res.data;
    } catch (e) {
        return { errors: [e.message] };
    }
}

async function post(url, body) {
    try {
        let res = await client.post(url, body);

        return res.data;
    } catch (e) {
        return { errors: [e.message] };
    }
}

async function clientDelete(url) {
    try {
        let res = await client.delete(url);

        return res.data;
    } catch (e) {
        return { errors: [e.message] };
    }
}

async function getAllStacks() {
    return await get('/stacks');
}

async function describeStack(stackName) {
    return await get(`/stacks/${stackName}`);
}

async function getLayersInStack(stackName) {
    return await get(`/stacks/${stackName}/layers`);
}

async function describeLayer(stackName, layerName) {
    return await get(`/stacks/${stackName}/layers/${layerName}`);
}

async function getInstancesInLayer(stackName, layerName) {
    return await get(`/stacks/${stackName}/layers/${layerName}/instances`);
}

async function describeInstance(stackName, layerName, hostName) {
    return await get(`/stacks/${stackName}/layers/${layerName}/instances/${hostName}`);
}

async function doTask(task, body) {
    return await post(`/tasks/${task}`, body);
}

async function checkTask(task, id) {
    return await get(`/tasks/${task}/${id}`);
}

async function queryTasks(task, params) {
    return await get(`/tasks/${task}`, { params });
}

async function cancelTask(task, id) {
    return await clientDelete(`/tasks/${task}/${id}`);
}

async function listAllTasks() {
    return await get('/tasks');
}

module.exports = {
    client,
    getAllStacks,
    describeStack,
    getLayersInStack,
    describeLayer,
    getInstancesInLayer,
    describeInstance,
    doTask,
    checkTask,
    queryTasks,
    cancelTask,
    listAllTasks
};