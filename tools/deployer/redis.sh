#!/bin/bash
. ./get_environment_type.sh

get_environment_type $2

./create_inventory.sh

. ./get_env.sh

REDIS_PASSWORD=$(get_env "$BASH_SOURCE" "REDIS_PASSWORD")
REDIS_PORT=$(get_env_or_default "$BASH_SOURCE" "REDIS_PORT" "6379")

GITHUB_TOKEN=$(get_env "$BASH_SOURCE" "GITHUB_TOKEN")
GITHUB_REPOSITORY=$(get_env "$BASH_SOURCE" "GITHUB_REPOSITORY")

if [ "$1" != "down" ]
then
    if [ -z "$REDIS_PASSWORD" ]
    then
        echo "Error: REDIS_PASSWORD must be set before Redis deployment" >&2
        exit 1
    fi

    ansible-playbook \
        ./redis/create_redis.yaml \
         -e "REDIS_PORT=$REDIS_PORT \
            REDIS_PASSWORD=$REDIS_PASSWORD \
            ENVIRONMENT_TYPE=$ENVIRONMENT_TYPE" &&\
    ansible-playbook \
        ./redis/fill_github.yaml \
        -e "GITHUB_TOKEN=$GITHUB_TOKEN \
            GITHUB_REPOSITORY=$GITHUB_REPOSITORY \
            ENVIRONMENT_TYPE=$ENVIRONMENT_TYPE"
else
    ansible-playbook \
        ./redis/delete_redis.yaml && \
    ansible-playbook \
        ./redis/clear_github.yaml \
        -e "GITHUB_TOKEN=$GITHUB_TOKEN \
            GITHUB_REPOSITORY=$GITHUB_REPOSITORY \
            ENVIRONMENT_TYPE=$ENVIRONMENT_TYPE"
fi
