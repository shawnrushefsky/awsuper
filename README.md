# AWSuper

A containerized Webserver and accompanying Command Line tool for easily performing and automating long-running tasks in AWS, such as rolling green/blue updates, EBS snapshots, etc.

### Goals

1. Webserver should be natively deployable through docker
2. Webserver should have minimal system requirements
3. Webserver should follow security best practices, and protect aws credentials
4. Command line tool should feature tab autocompletion
5. Command line tool should be maximally expressive
6. Command line tool should be installable through common package managers

# Launching with Docker

This will eventually be hosted on Docker hub, but it isn't yet. For now, you can run this in docker by first building the docker image:

```shell
cd server
docker build -t awsuper .
```

And then running it with your AWS credentials as environment variables:

```shell
docker container run --name awsuper -e ACCESS_KEY_ID=<your key> -e SECRET_ACESS_KEY=<your secret> -e REGION=<your region> -p 4242:4242 awsuper
```

After outputing your auth token, the server will be listening on port 4242.

# Installing for local use

This was built using Node.js 10.4.0. You may experience problems if you are using a different version.

```shell
cd server
npm install
```

# Launching the Server locally

From within the directory `/server`

```shell
ACCESS_KEY_ID=<your key> SECRET_ACESS_KEY=<your secret> REGION=<your region> node src/index.js
```

Alternatively to using environment variables, you can create a config file called `aws.js` in the directory `/server/src/config`.

It should take the form:

```javascript
module.exports = {
    aws: {
        accessKeyId: 'YOUR KEY',
        secretAccessKey: 'YOUR SECRET',
        region: 'YOUR REGION'
    }
};
```

When the server starts it will output your auth token, which you will need to use in the Authorization header for every request

# Tasks

While the AWSuper API provides some basic inspection capabilities of your OpsWorks stacks and Layers, most of it's functionality is provided by a pluggable `Task` framework.

## What is a `Task`?

An AWSuper Task is typically a long-running scripted process, such as performing a rolling restart of hundreds of machines. These are supported through a modular task framework, where each task is given some standard endpoints and a MongoDB Collection. These tasks get executed asynchronously using RabbitMQ, with logs or updates being written to the database as the task executes.

## Provided Endpoints

Your task will automatically be assigned several endpoints, and it's name will be determined by the name of the directory.

### `POST /tasks/<taskname>`

This endpoint accepts a JSON request body, and attempts to create a new document for it in MongoDB using the model provided by your task. Once the new document is created, it will enqueue the task in RabbitMQ, where it will be executed asynchronously.

This endpoint will return the created task.

### `GET /tasks/<taskname>/:id`

This endpoint retrieves a task from the database by ID. This lets you check up on the status of long-running tasks as they run.

### `GET /tasks/<taskname>?key=value`

> Not Yet Implemented

This endpoint allows you to retrieve many instances of your task at once, and filter them with query parameters

### `DELETE /tasks/<taskname>/:id`

This endpoint is used to cancel a running task by ID. In practice, it will execute the `cancel(id)` function provided by your task.

## Anatomy of a `Task`

Your custom Task will take the form of a directory within the `tasks` directory of the server. You should have a file `index.js` that exports an object like:

```javascript
module.exports = {
    task: async function(msg, ack, nack),
    model: mongoose.Model,
    cancel: async function(recordID)
}
```

Beyond that, your task can do virtually anything you achievable with Node. Because your task will be running in context of the server, you do have access to convenience utilities:

### Utilities

This is not an exhaustive list:

#### sleep

```javascript
const { sleep } = require('../../utils/common');

await sleep(1000); // Sleep for 1 second
```

#### OpsWorks and EC2

These come already authorized with your AWS credentials, and ready to use.

```javascript
const { OpsWorks, EC2 } = require('../../clients/aws');
```

#### logging

It is recommended that you include useful log statements with your task.

```javascript
const log = require('../../utils/logger');

log.debug(`somevar = ${someVar}`);
log.info('Wow! My task is working!');
log.warn('Maybe that should not have happened.');
log.error('Oh No!');
log.fatal('Ack! This is a complete disaster!');
```

#### Get instances from an OpsWork Layer

```javascript
const { listInstancesFromNames } = require('../../utils/instance');

let instances = await listInstancesFromNames(stackName, layerName);
// [ Instance{} ]
```

#### Get instance by ID

Note: this only works with the OpsWorks `InstanceId`.

```javascript
const { getInstanceByID } = require('../../utils/instance');

let instance = await getInstanceByID(InstanceId);
// Instance{}
```

### Model

You must construct a mongoose.js Model that represents that data model required for your task. This model will be used to validate incoming JSON bodies through the provided endpoints, and of course you can use it within your task to make updates to documents as your task runs.

### Cancel

This is a function that takes an `_id` for your mongo collection. You should specify whatever needs to happen to make your task cancel in this code block. One way to do it is to set `{status: 'CANCELLED'}` on the document. This requires periodic status checks from within your task to cease doing things if the status has become `CANCELLED`.

# Endpoints

All endpoints require an Authorization header:

`Authorization: Bearer ${token}`

## GET /stacks

Gets a JSON array of all your stacks

## GET /stacks/:name

Gets a JSON object describing one stack

## GET /stacks/:name/layers

Gets a JSON array of all layers on a particular stack

## GET /stacks/:stackName/layers/:name

Gets a JSON object of one layer on a particular stack

## GET /stacks/:stackName/layers/:layerName/instances

Gets a JSON array of all instances that belong to a layer

## GET /stacks/:stackName/layers/:layerName/instances/:hostName

Gets a JSON object of an instance by hostname. Also accepts a number if hostnames match `${layerName}${number}`

## POST /tasks/layer-rolling-restart

This will perform a rolling restart on the specified stack/layer.

Requires JSON body:

```javascript
{
    "stackName": "stack",
    "layerName": "layer",
    "window": 1 // Optional. Default is 1
}
```

| Paramater | Default | Description |
|-----------|---------|-------------|
| stackName | None | The name of the stack
| layerName | None | The name of the layer 
| window | 1 | This is how many instances should be restarted at a time

This will return JSON:

```javascript
{
    "window": 1,
    "status": "PENDING",
    "_id": "5b6b71dbe30e1f1ae3ff2e07",
    "stackName": "stack",
    "layerName": "layer",
    "instancesShutdown": [],
    "instancesStarted": [],
    "instancesOnline": [],
    "date_created": "2018-08-08T22:42:35.644Z",
    "date_updated": "2018-08-08T22:42:35.644Z"
}
```

## GET /tasks/layer-rolling-restarter/:id

This retrieves a layer-rolling-restarter task. As the restarter runs, it updates this task periodically.

This will return JSON:

```javascript
{
    "window": 1,
    "status": "RUNNING",
    "_id": "5b6b71dbe30e1f1ae3ff2e07",
    "stackName": "stack",
    "layerName": "layer",
    "instancesShutdown": [],
    "instancesStarted": [],
    "instancesOnline": [],
    "date_created": "2018-08-08T22:42:35.644Z",
    "date_updated": "2018-08-08T22:42:35.644Z"
}
```

## DELETE /tasks/layer-rolling-restarter/:id

This cancels a layer-rolling-restarter task. 

> Warning: if you do this while 1 or more machines are shutting down, they will not automatically come back online