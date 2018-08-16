#! /bin/bash

# get absolute path of this file
CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# use the 1st command line argument as the tag. Default the tag to qa if one isn't provided
TAG=${1:-latest}

# use the package version as a tag
PACKAGE_VERSION=$(node -p -e "require('./package.json').version")

docker build --no-cache \
    -f ${CWD}/Dockerfile \
    -t shawnrushefsky/awsuper:${TAG} \
    -t shawnrushefsky/awsuper:${PACKAGE_VERSION}-stretch \
    ${CWD}

docker push shawnrushefsky/awsuper:${TAG}
docker push shawnrushefsky/awsuper:${PACKAGE_VERSION}-stretch