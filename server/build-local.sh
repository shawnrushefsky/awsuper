#! /bin/bash

# get absolute path of this file
CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# use the 1st command line argument as the tag. Default the tag to qa if one isn't provided
TAG=${1:-local}

docker build --no-cache \
    -f ${CWD}/Dockerfile \
    -t awsuper:${TAG} \
    ${CWD}