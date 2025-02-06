#!/bin/bash
. ./get_env.sh

POSTGRES_PASSWORD=$(get_env "$BASH_SOURCE" "DATABASE_PASSWORD" backend.env)
POSTGRES_DB=$(get_env "$BASH_SOURCE" "DATABASE_NAME" backend.env)
POSTGRES_USER=$(get_env "$BASH_SOURCE" "DATABASE_USERNAME" backend.env)
HOST=$(hostname -I | awk '{print $1}')
DUMP_NAME="$POSTGRES_DB"_"$($(command -v date) +%d-%m-%Y).dump"

PGPASSWORD=$POSTGRES_PASSWORD pg_dump $POSTGRES_DB > /home/code/db_backups/$DUMP_NAME -h $HOST -p 5432 -U $POSTGRES_USER