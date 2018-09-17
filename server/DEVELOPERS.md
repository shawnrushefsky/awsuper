# Contributing to AWSuper

First, thanks for wanting to help!

Second, let's get you set up with a developer environment.

## The Basics

1. [Install Docker and Docker-Compose](https://www.docker.com/products/docker-desktop) for your platform
2. [Clone down this Repo](https://github.com/shawnrushefsky/awsuper), or even better, your own fork of it.
3. `cd` into the new directory.
4. `cd` into the `server` directory
5. Run `./build-local.sh`. This will create a local docker image, `awsuper:local` that our dev environment will be based on.

## Connecting to your AWS resources

There are 2 ways to accomplish this. You may create a config file as described [here](https://github.com/shawnrushefsky/awsuper/tree/master/server#launching-the-server-locally), or you may specify your credentials through environment variables. A simple way to do this is to create a new file, `env.yml`, that will look like this:

```yml
version: '3'

services:
  awsuper-server:
    environment:
        - ACCESS_KEY_ID=<your key>
        - SECRET_ACESS_KEY=<your secret>
        - REGION=<your region>
```

Both `config/aws.js` and `env.yml` are already included in the `.gitignore`, which should streamline PRs by automatically excluding any variables that are specific to your AWS environment.

## Launching the Development container

Once you've followed the previous steps, this one is easy:

`docker-compose -f docker-compose.yml -f env.yml up --build`.  This will start a container named `awsuper` on your machine, with the appropriate environment variables, and with the `server` directory volume-mounted into the container. It will not start the server, though.

To get a shell in the container, open a new terminal and enter:

`docker exec -it awsuper bash`.

You can start the server with `npm start`.