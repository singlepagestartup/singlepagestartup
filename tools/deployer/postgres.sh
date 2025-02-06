#!/bin/bash
. ./get_environment_type.sh

get_environment_type $2

./create_inventory.sh

. ./get_env.sh

DATABASE_NAME=$(get_env "$BASH_SOURCE" "DATABASE_NAME")
DATABASE_USERNAME=$(get_env "$BASH_SOURCE" "DATABASE_USERNAME")
DATABASE_PASSWORD=$(get_env "$BASH_SOURCE" "DATABASE_PASSWORD")

GITHUB_TOKEN=$(get_env "$BASH_SOURCE" "GITHUB_TOKEN")
GITHUB_REPOSITORY=$(get_env "$BASH_SOURCE" "GITHUB_REPOSITORY")

if [ "$1" != "down" ]
then
    ansible-playbook \
        ./postgres/create_postgres.yaml \
         -e "DATABASE_NAME=$DATABASE_NAME \
            DATABASE_USERNAME=$DATABASE_USERNAME \
            DATABASE_PASSWORD=$DATABASE_PASSWORD \
            ENVIRONMENT_TYPE=$ENVIRONMENT_TYPE" &&\
    ansible-playbook \
        ./postgres/fill_github.yaml \
        -e "GITHUB_TOKEN=$GITHUB_TOKEN \
            GITHUB_REPOSITORY=$GITHUB_REPOSITORY \
            ENVIRONMENT_TYPE=$ENVIRONMENT_TYPE"
else
    ansible-playbook \
        ./postgres/delete_postgres.yaml && \
    ansible-playbook \
        ./postgres/clear_github.yaml \
        -e "GITHUB_TOKEN=$GITHUB_TOKEN \
            GITHUB_REPOSITORY=$GITHUB_REPOSITORY \
            ENVIRONMENT_TYPE=$ENVIRONMENT_TYPE"
fi