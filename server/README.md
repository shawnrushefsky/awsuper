# AWSuper Server

[How can I contribute?](https://github.com/shawnrushefsky/awsuper/blob/master/server/DEVELOPERS.md)

# Launching with Docker

The AWSuper server is hosted on [Docker Hub](https://hub.docker.com/r/shawnrushefsky/awsuper/)

```shell
docker container run --name awsuper -e ACCESS_KEY_ID=<your key> -e SECRET_ACESS_KEY=<your secret> -e REGION=<your region> -p 4242:4242 shawnrushefsky/awsuper
```

# Launching with Docker from Source

If you are building a docker image from source, instead of using the version hosted on docker hub:

```shell
cd server
./build-local.sh
```

This builds the image from `./Dockerfile`, and tags it `awsuper:local`.

And then running it with your AWS credentials as environment variables:

```shell
docker container run --name awsuper -e ACCESS_KEY_ID=<your key> -e SECRET_ACESS_KEY=<your secret> -e REGION=<your region> -p 4242:4242 awsuper:local
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

# Environment Variables

You may customize the deployment of AWSuper through the use of environment variables:

name | required | description
-----|----------|-------------
ACCESS_KEY_ID | yes | Your AWS Access Key ID
SECRET_ACCESS_KEY | yes | Your AWS Secret Access Key
REGION | yes | The AWS region you'll be orchestrating, i.e. "us-east-1".
RABBIT_HOST | no | Just the hostname of your RabbitMQ instance, or other AMQP broker. Defaults to `localhost`, as the container includes RabbitMQ by default.
RABBIT_PORT | no | Just the port of the your RabbitMQ instance, or other AMQP broker. Defaults to `5672`.
MONGO_HOST | no | Just the hostname of your MongoDB primary. Defaults to `localhost`, as the container includes MongoDB by default.
MONGO_PORT | no | Just the port of your MongoDB primary. Defaults to `27017`.

## NOTES

AWSuper relies on the [delayed message exchange](https://github.com/rabbitmq/rabbitmq-delayed-message-exchange) plugin for RabbitMQ to handle scheduling, so if you choose not to rely on the rabbitmq that is included with the container, make sure the rabbitmq you point to does include this plugin, such as [shawnrushefsky/rabbitmq-delayed-message-exchange](https://hub.docker.com/r/shawnrushefsky/rabbitmq-delayed-message-exchange/).

# Tasks

While the AWSuper API provides some basic inspection capabilities of your OpsWorks stacks and Layers, most of it's functionality is provided by a pluggable `Task` framework.

## What is a `Task`?

An AWSuper Task is typically a long-running scripted process, such as performing a rolling restart of hundreds of machines. These are supported through a modular task framework, where each task is given some standard endpoints and a MongoDB Collection. These tasks get executed asynchronously using RabbitMQ, with logs or updates being written to the database as the task executes.

## Provided Endpoints

Your task will automatically be assigned several endpoints, and it's name will be determined by the name of the directory.

### `POST /tasks/<taskname>`

This endpoint accepts a JSON request body, and attempts to create a new document for it in MongoDB using the model provided by your task. Once the new document is created, it will enqueue the task in RabbitMQ, where it will be executed asynchronously.

This endpoint supports two optional query parameters:

`?delay=<ms>` - You can start a task at some point in the future by specifying either a number of milliseconds to delay, or an [ms](https://github.com/zeit/ms) compatible string.

`?when=<datetime>` - You can start a task at a specific date and time in the future by providing a datetime string in one of these formats:

* `MM-DD-YYYY`
* `MM-DD-YYYY HH`,
* `MM-DD-YYYY HH:mm`,
* `MM-DD-YYYY HH:mm:ss`,
* `YYYY-MM-DD HH:mm:ss`,
* `YYYY-MM-DD HH:mm`,
* `YYYY-MM-DD HH`,
* `YYYY-MM-DD`

This endpoint will return the created task.

### `GET /tasks/<taskname>/:id`

This endpoint retrieves a task from the database by ID. This lets you check up on the status of long-running tasks as they run.

### `GET /tasks/<taskname>?key=value`

This endpoint allows you to retrieve many instances of your task at once, and filter them with query parameters

#### Query Parameters

This endpoint supports query parameters. Query parameters provide advanced functionality for using the API, including range queries and sorting of returned results.

##### Exact Matches

You can query for records where a field exactly matches a query parameter. For date fields, this will match records
where the value falls anywhere in the specified time frame:

* `field_name=value` - For records where `field_name === value`

**Examples**:

* `?layer=api` - Matches records where `record.layer == "api"`

* `?createdAt=2018-8-6 10` - Matches records where `record.createdAt` falls anywhere in the 10a hour of 2018-8-6

* `?createdAt=2018-8-6` - Matches records where `record.createdAt` occurs anytime on 2018-8-6

##### Range Queries

You can query for records with values in a range. These range queries will work with any `Number` or `Date` field:

* `field_name[min]=min_value` - For records where `field_name >= min_value`

* `field_name[max]=max_value` - For records where `field_name <= max_value`

**Examples**

* `?totalInstances[min]=20&totalInstances[max]=120` - Matches records where `20 <= record.totalInstances <= 120`

* `?totalInstances[min]=5000` - Matches records where `record.totalInstances >= 5000`

##### Sorting

You can use query parameters to sort the records that are returned by a query:

* `sort[field_name]=direction` - Sorts returned records by the value of `field_name`, in a `direction` direction.

**Examples**

* `?sort[totalInstances]=desc` - Sorts the returned records by `record.totalInstances` in descending order (i.e. highest value of `totalInstances` is first).

* `?sort[totalInstances]=asc` - Sorts the returned records by `record.totalInstances` in ascending order (i.e. lowest value of `totalInstances` first).

##### OR queries

You can search for documents that match one of several conditions:

* `?field_name=value1&field_name=value2` - For records where `field_name` is either `value1` **OR** `value2`

**Examples**

* `?status=RUNNING&status=COMPLETED` - Matches records where `record.status` equals either `RUNNING` or `COMPLETED`

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

Beyond that, your task can do virtually anything you achievable with Node. Because your task will be running in context of the server, you do have access to convenience utilities.

### Task

When a task is enqueued, it gets executed by this function. Your function should take the form:

```javascript
async function(msg, ack, nack) {
    let task = await Model.findById(msg._id);

    // Do some stuff

    return ack();
}
```

#### msg
This will always take the form `{ _id: TaskID }`.

In order to retrieve the rest of the the task, you should use `await Model.findById`.

#### ack
Once your task has fully executed correctly, you should acknowledge it like:

```javascript
return ack();
```

#### nack(requeue=true)
If you are unable to complete the execution of a task, and you want to try again, use:

```javascript
return nack();

// is equivalent to
return nack(true);
```

If you are unable to complete the execution of a task, and you want to give up:

```javascript
return nack(false);
```

### Model

You must construct a [mongoose.js Model](http://mongoosejs.com/docs/models.html) that represents that data model required for your task. This model will be used to validate incoming JSON bodies through the provided endpoints, and of course you can use it within your task to make updates to documents as your task runs. When naming your model, please name it identically to your directory name, to avoid collisions between different tasks.

### Cancel

This is a function that takes an `_id` for your mongo collection. You should specify whatever needs to happen to make your task cancel in this code block. One way to do it is to set `{status: 'CANCELLED'}` on the document. This requires periodic status checks from within your task to cease doing things if the status has become `CANCELLED`.

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
    "stack": "stack",
    "layer": "layer",
    "window": 1 // Optional. Default is 1
}
```

| Paramater | Default | Description |
|-----------|---------|-------------|
| stack | None | The name of the stack
| layer | None | The name of the layer 
| window | 1 | This is how many instances should be restarted at a time

This will return JSON:

```javascript
{
    "window": 1,
    "status": "PENDING",
    "_id": "5b6b71dbe30e1f1ae3ff2e07",
    "stack": "stack",
    "layer": "layer",
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
    "stack": "stack",
    "layer": "layer",
    "instancesShutdown": [],
    "instancesStarted": [],
    "instancesOnline": [],
    "date_created": "2018-08-08T22:42:35.644Z",
    "date_updated": "2018-08-08T22:42:35.644Z"
}
```

## GET /tasks/layer-rolling-restarter?key=value

This allows you to query the layer-rolling-restarter collection with [query parameters](#query-parameters)

This will return JSON:

```json
{
    "num_found": 100,
    "data": [
        {
            "window": 1,
            "status": "RUNNING",
            "_id": "5b6b71dbe30e1f1ae3ff2e07",
            "stack": "stack",
            "layer": "layer",
            "instancesShutdown": [],
            "instancesStarted": [],
            "instancesOnline": [],
            "date_created": "2018-08-08T22:42:35.644Z",
            "date_updated": "2018-08-08T22:42:35.644Z"
        }
    ]
}
```

## DELETE /tasks/layer-rolling-restarter/:id

This cancels a layer-rolling-restarter task. 

> Warning: if you do this while 1 or more machines are shutting down, they will not automatically come back online