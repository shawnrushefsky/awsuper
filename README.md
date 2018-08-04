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

## PUT /stacks/:stackName/layers/:layerName/rolling-restart

This will perform a rolling restart on the specified layer.

Accepts optional JSON body:

```json
{
    "window": 1
}
```

| Paramater | Default | Description |
|-----------|---------|-------------|
| window | 1 | This is how many instances should be restarted at a time