# AWSuper

A containerized Webserver and accompanying Command Line tool for easily performing and automating long-running tasks in AWS, such as rolling green/blue updates, EBS snapshots, etc.

[Docker Hub](https://hub.docker.com/r/shawnrushefsky/awsuper/)

[NPM](https://www.npmjs.com/package/awsuper)

### Goals

- [x] Webserver should be natively deployable through docker
- [x] Webserver should have minimal system requirements
- [x] Webserver should follow security best practices, and protect aws credentials
- [ ] Command line tool should feature tab autocompletion
- [x] Command line tool should be maximally expressive
- [x] Command line tool should be installable through common package managers

There is documentation for the server in the `server` directory, and documentation for the CLI in the `command-line-tool` directory.

## Getting Started

First, you'll want to deploy the server using docker. This is recommended to be done inside your AWS security group, though it can be done locally as well.

```shell
docker container run --name awsuper -e ACCESS_KEY_ID=<your key> -e SECRET_ACESS_KEY=<your secret> -e REGION=<your region> -p 4242:4242 shawnrushefsky/awsuper
```

This will output your auth token as it starts up. Save this for later.

Next, install the command line tool:

```shell
npm install -g awsuper
```

The command line tool requires the existence of a file `~/.awsuper` that includes some details about connecting to the AWSuper server. It should take this form:

```javascript
{
    "token": "the token that your server spat out when it started up",
    "server": {
        "host": "localhost",
        "port": 4242,
        "protocol": "http" // You should definitely put https in front of this server in production
    }
}
```

You can create this file interactively by running

```shell
awsuper setup
```

Once this file is created, you're ready to go! Verify your installation by running

```shell
awsuper tasks
```

This will tell you the available tasks that are installed on your server.

## Plugins

AWSuper supports plugins called `Tasks`. Learn how to create them [here.](https://github.com/shawnrushefsky/awsuper/tree/master/server#tasks)
