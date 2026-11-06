#!/bin/bash
. ./get_environment_type.sh

get_environment_type $2

./create_inventory.sh

. ./get_env.sh

DATABASE_NAME=$(get_env "$BASH_SOURCE" "DATABASE_NAME")
DATABASE_USERNAME=$(get_env "$BASH_SOURCE" "DATABASE_USERNAME")
DATABASE_PASSWORD=$(get_env "$BASH_SOURCE" "DATABASE_PASSWORD")
POSTGRES_USER=$(get_env "$BASH_SOURCE" "POSTGRES_USER")
POSTGRES_PASSWORD=$(get_env "$BASH_SOURCE" "POSTGRES_PASSWORD")

GITHUB_TOKEN=$(get_env "$BASH_SOURCE" "GITHUB_TOKEN")
GITHUB_REPOSITORY=$(get_env "$BASH_SOURCE" "GITHUB_REPOSITORY")

if [ "$1" != "down" ]
then
    if [ -z "$POSTGRES_USER" ]
    then
        # A deployment configured before the application role existed: its
        # data directory was initialized with DATABASE_USERNAME as the superuser.
        echo "Warning: POSTGRES_USER is not set, so the API connects to PostgreSQL as its superuser. See \"PostgreSQL roles\" in README.md." >&2
        POSTGRES_USER=$DATABASE_USERNAME
        POSTGRES_PASSWORD=$DATABASE_PASSWORD
        DATABASE_USERNAME=""
        DATABASE_PASSWORD=""
    elif [ -z "$POSTGRES_PASSWORD" ]
    then
        echo "Error: POSTGRES_PASSWORD must be set together with POSTGRES_USER" >&2
        exit 1
    elif [ "$POSTGRES_USER" = "$DATABASE_USERNAME" ]
    then
        echo "Error: DATABASE_USERNAME must name a role other than POSTGRES_USER" >&2
        exit 1
    elif [ -z "$DATABASE_USERNAME" ] || [ -z "$DATABASE_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "$DATABASE_PASSWORD" ]
    then
        echo "Error: configure a dedicated DATABASE_USERNAME with a separate DATABASE_PASSWORD" >&2
        exit 1
    fi

    export DATABASE_NAME DATABASE_USERNAME DATABASE_PASSWORD POSTGRES_USER POSTGRES_PASSWORD
    ansible-playbook ./postgres/create_postgres.yaml &&\
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
