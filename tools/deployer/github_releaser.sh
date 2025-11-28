#!/bin/bash
. ./get_environment_type.sh

get_environment_type $2

./create_inventory.sh

. ./get_env.sh

PROJECT_NAME=$(get_env "$BASH_SOURCE" "PROJECT_NAME")

DOCKER_HUB_USERNAME=$(get_env "$BASH_SOURCE" "DOCKER_HUB_USERNAME")
DOCKER_HUB_LOGIN_USERNAME=$(get_env "$BASH_SOURCE" "DOCKER_HUB_LOGIN_USERNAME")
DOCKER_HUB_URL=$(get_env "$BASH_SOURCE" "DOCKER_HUB_URL")
DOCKER_HUB_PASSWORD=$(get_env "$BASH_SOURCE" "DOCKER_HUB_PASSWORD")

GITHUB_TOKEN=$(get_env "$BASH_SOURCE" "GITHUB_TOKEN")
GITHUB_REPOSITORY=$(get_env "$BASH_SOURCE" "GITHUB_REPOSITORY")

SECRETS=(\
    "PROJECT_NAME $PROJECT_NAME" \
    "DOCKER_HUB_USERNAME $DOCKER_HUB_USERNAME" \
    "DOCKER_HUB_LOGIN_USERNAME $DOCKER_HUB_LOGIN_USERNAME" \
    "DOCKER_HUB_URL $DOCKER_HUB_URL" \
    "DOCKER_HUB_PASSWORD $DOCKER_HUB_PASSWORD" \
)

if [ -z "$ENVIRONMENT_TYPE" ]; then
    BRANCHES=( \
        "update-host"
    )
else
    ENVIRONMENT_TYPE_LOWER=$(echo "$ENVIRONMENT_TYPE" | tr '[:upper:]' '[:lower:]')
    BRANCHES=( \
        "update-host-${ENVIRONMENT_TYPE_LOWER}"
    )
fi

PREFIX=""
if [ ! -z "$ENVIRONMENT_TYPE" ]
then
    PREFIX="${ENVIRONMENT_TYPE}_"
fi

if [ "$1" != "down" ]
then
    cd ./github/github-node-api && npm install && cd ../..

    for i in "${BRANCHES[@]}"
    do
        BRANCH_NAME=$i
        node ./github/github-node-api/create_branch.js \
            $GITHUB_TOKEN \
            $GITHUB_REPOSITORY \
            $BRANCH_NAME
    done
        
    for i in "${SECRETS[@]}"
    do
        SECRET_NAME="${i%% *}"
        SECRET_CONTENT="${i#* }"

        node ./github/github-node-api/create_secret.js \
            $GITHUB_TOKEN \
            $GITHUB_REPOSITORY \
            "${PREFIX}${SECRET_NAME}" \
            $SECRET_CONTENT
    done
else
    cd ./github/github-node-api && npm install && cd ../..

    for i in "${SECRETS[@]}"
    do
        SECRET_NAME="${i%% *}"
        SECRET_CONTENT="${i#* }"

        node ./github/github-node-api/delete_secret.js \
            $GITHUB_TOKEN \
            $GITHUB_REPOSITORY \
            "${PREFIX}${SECRET_NAME}"
    done
fi