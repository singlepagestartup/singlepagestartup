#!/bin/bash

# Check is .env file exists
if [ -f .env ]; then
    echo "File .env already exists"
    exit 1
fi

# Clear env file
> .env
echo "Created /redis/.env file"

add_env() {
    echo "$1=$2" >> .env
}

generate_random_string() {
    echo $RANDOM | md5sum | head -c 32;
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

add_env "REDIS_PASSWORD" $(generate_random_string)

REDIS_PORT=$(get_available_port 6379)

add_env "REDIS_PORT" $REDIS_PORT