#!/bin/bash
. ./get_environment_type.sh

get_environment_type $2

./create_inventory.sh

. ./get_env.sh
. ./ansible_vars.sh

REDIS_PASSWORD=$(get_env "$BASH_SOURCE" "REDIS_PASSWORD")
REDIS_PORT=$(get_env_or_default "$BASH_SOURCE" "REDIS_PORT" "6379")
REDIS_MAXMEMORY=$(get_env_or_default "$BASH_SOURCE" "REDIS_MAXMEMORY" "256mb")
REDIS_MAXMEMORY_POLICY=$(get_env_or_default "$BASH_SOURCE" "REDIS_MAXMEMORY_POLICY" "volatile-lru")

GITHUB_TOKEN=$(get_env "$BASH_SOURCE" "GITHUB_TOKEN")
GITHUB_REPOSITORY=$(get_env "$BASH_SOURCE" "GITHUB_REPOSITORY")

if [ "$1" != "down" ]
then
    if [ -z "$REDIS_PASSWORD" ]
    then
        echo "Error: REDIS_PASSWORD must be set before Redis deployment" >&2
        exit 1
    fi

    ansible_with_vars ./redis/create_redis.yaml \
        REDIS_PORT REDIS_PASSWORD REDIS_MAXMEMORY REDIS_MAXMEMORY_POLICY ENVIRONMENT_TYPE &&\
    ansible_with_vars ./redis/fill_github.yaml \
        GITHUB_TOKEN GITHUB_REPOSITORY ENVIRONMENT_TYPE
else
    ansible-playbook \
        ./redis/delete_redis.yaml && \
    ansible_with_vars ./redis/clear_github.yaml \
        GITHUB_TOKEN GITHUB_REPOSITORY ENVIRONMENT_TYPE
fi
