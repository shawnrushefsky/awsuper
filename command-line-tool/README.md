# AWSuper Command Line Tool

This command line tool allows convenient access to the endpoints exposed by the AWSuper Server

## Installation

You can install the command line tool conveniently through NPM:

```shell
npm install -g awsuper
```

Configure the command line tool to connect to the server:

```shell
awsuper setup
```

## Use

### Describe

The `describe` command can return a JSON description of a specified Stack, Layer, or Instance

**Describe a Stack**
```shell
awsuper describe --stack <stackName>

awsuper describe -s <stackName>
```

**Describe a Layer**
```shell
awsuper describe --stack <stackName> --layer <layerName>

awsuper describe --s <stackName> -l <layerName>
```

**Describe an Instance**
```shell
awsuper describe --stack <stackName> --layer <layerName> --instance <hostname>

awsuper describe --s <stackName> -l <layerName> -i <hostname>
```

### List

The `list` command will list all stacks, all layers in a specified stack, or all instances in a specified layer.

**List all Stacks**
```shell
awsuper list
```

**List Layers in a Stack**
```shell
awsuper list --stack <stackName>

awsuper list -s <stackName>
```

**List Instances in a Layer**
```shell
awsuper list --stack <stackName> --layer <layerName>

awsuper list --s <stackName> -l <layerName>
```

### Do

The `do` command will execute a new Task.

**Syntax**
```shell
awsuper do <task-name> [key=value...]
```

**Example**
```shell
awsuper do layer-rolling-restart stackName="my stack" layerName="my layer" window=2
```

### Check

The `check` command will check on a running or completed task.

**Syntax**
```shell
awsuper check <task-name> <id>
```

**Example**
```shell
awsuper check layer-rolling-restart 5b6cb5f4e161b303089da220
```

### Cancel

The `check` command will cancel a running task.

**Syntax**
```shell
awsuper cancel <task-name> <id>
```

**Example**
```shell
awsuper cancel layer-rolling-restart 5b6cb5f4e161b303089da220
```

### Tasks

The `tasks` command will list all available tasks

**Syntax**
```shell
awsuper tasks
```