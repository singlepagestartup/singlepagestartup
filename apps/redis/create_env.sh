#!/bin/bash
. ../../tools/deployer/generate_secret.sh

# Check is .env file exists
if [ -f .env ]; then
    echo "File .env already exists"
    exit 1
fi

# Clear env file
umask 077
> .env
echo "Created /redis/.env file"

add_env() {
    echo "$1=$2" >> .env
}

get_available_port() {
    START=$1
    
    while nc -z localhost $START
    do
        START=$((START+1))
    done

    echo $START
}

REPO_NAME=$(basename -s .git `git config --get remote.origin.url`)

add_env "COMPOSE_PROJECT_NAME" $REPO_NAME

add_env "REDIS_DATABASES" 16

add_env "REDIS_MAXMEMORY" "256mb"

add_env "REDIS_MAXMEMORY_POLICY" "allkeys-lru"

REDIS_PASSWORD=$(generate_secret 32) || exit 1

add_env "REDIS_PASSWORD" $REDIS_PASSWORD

REDIS_PORT=$(get_available_port 6379)

add_env "REDIS_PORT" $REDIS_PORT

chmod 600 .env