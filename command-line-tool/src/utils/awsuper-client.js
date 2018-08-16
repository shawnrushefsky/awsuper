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

class AWSuperClient {
    constructor(config) {
        this.client = axios.create({
            baseURL: `${config.server.protocol}://${config.server.host}:${config.server.port}`,
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Content-Type': 'application/json'
            },
            validateStatus: status => !!status
        });
    }

    async get(url, params) {
        try {
            let res = await this.client.get(url, params);

            return res.data;
        } catch (e) {
            return { errors: [e.message] };
        }
    }

    async post(url, body, params) {
        try {
            let res = await this.client.post(url, body, params);

            return res.data;
        } catch (e) {
            return { errors: [e.message] };
        }
    }

    async delete(url, params) {
        try {
            let res = await this.client.delete(url, params);

            return res.data;
        } catch (e) {
            return { errors: [e.message] };
        }
    }

    async put(url, body, params) {
        try {
            let res = await this.client.put(url, body, params);

            return res.data;
        } catch (e) {
            return { errors: [e.message] };
        }
    }

    async getAllStacks() {
        return await this.get('/stacks');
    }

    async describeStack(stackName) {
        return await this.get(`/stacks/${stackName}`);
    }

    async getLayersInStack(stackName) {
        return await this.get(`/stacks/${stackName}/layers`);
    }

    async describeLayer(stackName, layerName) {
        return await this.get(`/stacks/${stackName}/layers/${layerName}`);
    }

    async getInstancesInLayer(stackName, layerName) {
        return await this.get(`/stacks/${stackName}/layers/${layerName}/instances`);
    }

    async describeInstance(stackName, layerName, hostName) {
        return await this.get(`/stacks/${stackName}/layers/${layerName}/instances/${hostName}`);
    }

    async doTask(task, body) {
        return await this.post(`/tasks/${task}`, body);
    }

    async delayTask(task, job, params) {
        return await this.post(`/tasks/${task}`, job, { params });
    }

    async checkTask(task, id) {
        return await this.get(`/tasks/${task}/${id}`);
    }

    async queryTasks(task, params) {
        return await this.get(`/tasks/${task}`, { params });
    }

    async cancelTask(task, id) {
        return await this.delete(`/tasks/${task}/${id}`);
    }

    async listAllTasks() {
        return await this.get('/tasks');
    }
}

module.exports = new AWSuperClient(config);