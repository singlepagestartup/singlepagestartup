#!/bin/bash

# Writes a custom-format archive of the application database to /home/code/db_backups.
# Root's crontab runs it every night (server/set_cron_jobs.yaml).
#
# pg_dump runs inside the postgres_postgres container as the application login over
# TCP, so the client matches the server version. The archive includes
# identity records. The directory is 0700 and each dump 0600. The job publishes
# the archive and prunes old dumps only after pg_dump succeeds. Retention is
# DATABASE_BACKUP_RETENTION_DAYS days (default 14; 0 keeps every dump).

set -euo pipefail

BACKUP_DIRECTORY="${DATABASE_BACKUP_DIRECTORY:-/home/code/db_backups}"
RETENTION_DAYS="${DATABASE_BACKUP_RETENTION_DAYS:-14}"

if [[ ! "$RETENTION_DAYS" =~ ^[0-9]{1,9}$ ]]; then
    echo "Error: DATABASE_BACKUP_RETENTION_DAYS must be a non-negative integer of up to 9 digits" >&2
    exit 1
fi

if [[ $# -gt 1 ]]; then
    echo "Usage: create_db_dump.sh [POSTGRES_CONTAINER]" >&2
    exit 2
fi
if [[ $# -eq 1 ]]; then
    POSTGRES_CONTAINER_ID=$1
else
    POSTGRES_CONTAINER_ID="$(
        docker ps \
            --filter label=com.docker.swarm.service.name=postgres_postgres \
            --format '{{.ID}}' \
        | head -n 1
    )"
fi

if [ -z "$POSTGRES_CONTAINER_ID" ]
then
    echo "Error: no running postgres_postgres container to dump" >&2
    exit 1
fi

umask 077
mkdir -p "$BACKUP_DIRECTORY"
chmod 700 "$BACKUP_DIRECTORY"

DATABASE_NAME="$(docker exec "$POSTGRES_CONTAINER_ID" printenv POSTGRES_DB)"
if [[ "$DATABASE_NAME" = */* || -z "$DATABASE_NAME" ]]; then
    echo "Error: database name cannot be used as a backup filename" >&2
    exit 1
fi
DUMP_PATH="$BACKUP_DIRECTORY/${DATABASE_NAME}_$(date +%d-%m-%Y).dump"
PARTIAL_DUMP_PATH="$(mktemp "$BACKUP_DIRECTORY/.partial.XXXXXX")"

trap 'rm -f "$PARTIAL_DUMP_PATH"' EXIT

if ! docker exec "$POSTGRES_CONTAINER_ID" \
    sh -ec '
        /docker-entrypoint-initdb.d/create_application_role.sh --check-login >&2
        export PGDATABASE="$POSTGRES_DB" PGPASSWORD="$DATABASE_PASSWORD" PGREQUIREAUTH=scram-sha-256,md5
        exec pg_dump --host="$(hostname)" --username="$DATABASE_USERNAME" --no-password \
            --format=custom --no-acl --exclude-extension=vector
    ' \
    > "$PARTIAL_DUMP_PATH"
then
    echo "Error: pg_dump failed, the existing dumps are kept" >&2
    exit 1
fi

mv "$PARTIAL_DUMP_PATH" "$DUMP_PATH"

find "$BACKUP_DIRECTORY" -maxdepth 1 -type f -name '*.dump' -exec chmod 600 {} +

if [ "$RETENTION_DAYS" -gt 0 ]
then
    find "$BACKUP_DIRECTORY" -maxdepth 1 -type f -name '*.dump' -mtime +"$RETENTION_DAYS" -delete
fi

echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) wrote $DUMP_PATH"
