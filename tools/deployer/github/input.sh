#!/usr/bin/env bash

# Node reads JSON from stdin on both the controller and the server. Only names
# are passed to Python; values stay in the environment of the serializer.
github_command() (
    set -o pipefail
    local operation="$1"
    shift
    export GITHUB_TOKEN GITHUB_REPOSITORY "$@"
    python3 -c 'import json, os, sys; json.dump({key: os.environ[key] for key in sys.argv[1:]}, sys.stdout)' \
        GITHUB_TOKEN GITHUB_REPOSITORY "$@" |
        node "./github/github-node-api/$operation.js"
)
