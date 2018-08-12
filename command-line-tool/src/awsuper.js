#!/usr/bin/env node

const program = require('commander');
const pjson = require('../package.json');

program
    .version(pjson.version)
    .command('setup', 'Configure awsuper')
    .command('describe', 'Describe a Stack, Layer, or Instance').alias('d')
    .command ('list', 'List all Stacks, layers in a specified stack, or instances in a specified layer').alias('ls')
    .command('do', 'Start a new Task')
    .command('schedule', 'Schedule a task for a future time')
    .command('check', 'Check a running Task')
    .command('query', 'Query tasks of a specified type')
    .command('cancel', 'Cancel a running Task')
    .command('tasks', 'List all availabe Tasks').alias('lst')
    .parse(process.argv);