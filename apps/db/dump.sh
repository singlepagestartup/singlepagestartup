#! /bin/bash
. ../deployment/ansible/get_env.sh

DB_ENV=.env

BACKEND_ENV=../backend/.env

CREATE_DUMP_ON_COMMIT=$(get_env "$BASH_SOURCE" "CREATE_DUMP_ON_COMMIT" $DB_ENV)

if [ $CREATE_DUMP_ON_COMMIT == "false" ]
then
    exit 0
fi

if test -f "$BACKEND_ENV"
then
    DATABASE_CLIENT=$(grep "^DATABASE_CLIENT=" $BACKEND_ENV | cut -d '=' -f2)

    if [ "$DATABASE_CLIENT" != "sqlite" ]
    then
        DATABASE_HOST=$(grep "^DATABASE_HOST=" $BACKEND_ENV | cut -d '=' -f2)
        DATABASE_NAME=$(grep "^DATABASE_NAME=" $BACKEND_ENV | cut -d '=' -f2)
        DATABASE_USERNAME=$(grep "^DATABASE_USERNAME=" $BACKEND_ENV | cut -d '=' -f2)
        DATABASE_PASSWORD=$(grep "^DATABASE_PASSWORD=" $BACKEND_ENV | cut -d '=' -f2)
        DATABASE_PORT=$(grep "^DATABASE_PORT=" $BACKEND_ENV | cut -d '=' -f2)
        
        if [ -z "$DATABASE_HOST" ]
        then
            DATABASE_HOST="localhost"
        fi

        if [ -z "$DATABASE_NAME" ]
        then
            DATABASE_NAME="sps"
        fi

        if [ -z "$DATABASE_USERNAME" ]
        then
            DATABASE_USERNAME="postgres"
        fi

        if [ -z "$DATABASE_PASSWORD" ]
        then
            DATABASE_PASSWORD="password"
        fi

        if [ -z "$DATABASE_PORT" ]
        then
            DATABASE_PORT="5432"
        fi

        USERNAME=$(git config --get user.name)

        if [ -z "$USERNAME" ]
        then
            USERNAME=default
        fi

        PGPASSWORD=$DATABASE_PASSWORD pg_dump $DATABASE_NAME > $DATABASE_NAME-$USERNAME-dump.sql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USERNAME
    fi
fi