#!/bin/bash
. ./get_environment_type.sh

get_environment_type "$2"

./create_inventory.sh || exit 1

. ./get_env.sh
. ./github/input.sh

PROJECT_NAME=$(get_env "$BASH_SOURCE" "PROJECT_NAME")

DOCKER_HUB_USERNAME=$(get_env "$BASH_SOURCE" "DOCKER_HUB_USERNAME")
DOCKER_HUB_LOGIN_USERNAME=$(get_env "$BASH_SOURCE" "DOCKER_HUB_LOGIN_USERNAME")
DOCKER_HUB_URL=$(get_env "$BASH_SOURCE" "DOCKER_HUB_URL")
DOCKER_HUB_PASSWORD=$(get_env "$BASH_SOURCE" "DOCKER_HUB_PASSWORD")

GITHUB_TOKEN=$(get_env "$BASH_SOURCE" "GITHUB_TOKEN")
GITHUB_REPOSITORY=$(get_env "$BASH_SOURCE" "GITHUB_REPOSITORY")

SECRETS=(
    "DOCKER_HUB_PASSWORD $DOCKER_HUB_PASSWORD"
)

VARIABLES=(
    "PROJECT_NAME $PROJECT_NAME"
    "DOCKER_HUB_USERNAME $DOCKER_HUB_USERNAME"
    "DOCKER_HUB_LOGIN_USERNAME $DOCKER_HUB_LOGIN_USERNAME"
    "DOCKER_HUB_URL $DOCKER_HUB_URL"
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
    (cd ./github/github-node-api && npm install) || exit 1

    for i in "${BRANCHES[@]}"
    do
        BRANCH_NAME=$i
        github_command create_branch BRANCH_NAME || exit 1
    done
        
    # Move configured non-sensitive settings first to free old secret slots.
    for i in "${VARIABLES[@]}"
    do
        VARIABLE_NAME="${PREFIX}${i%% *}"
        VARIABLE_CONTENT="${i#* }"
        if [ -n "$VARIABLE_CONTENT" ]
        then
            github_command create_variable VARIABLE_NAME VARIABLE_CONTENT || exit 1
        fi
    done

    for i in "${SECRETS[@]}"
    do
        SECRET_NAME="${i%% *}"
        SECRET_CONTENT="${i#* }"

        if [ -n "$SECRET_CONTENT" ]
        then
            SECRET_NAME="${PREFIX}${SECRET_NAME}" github_command create_secret SECRET_NAME SECRET_CONTENT || exit 1
        fi
    done
else
    (cd ./github/github-node-api && npm install) || exit 1

    for i in "${SECRETS[@]}"
    do
        SECRET_NAME="${i%% *}"
        SECRET_CONTENT="${i#* }"

        SECRET_NAME="${PREFIX}${SECRET_NAME}" github_command delete_secret SECRET_NAME || exit 1
    done
    for i in "${VARIABLES[@]}"
    do
        VARIABLE_NAME="${PREFIX}${i%% *}"
        github_command delete_variable VARIABLE_NAME || exit 1
    done

fi
