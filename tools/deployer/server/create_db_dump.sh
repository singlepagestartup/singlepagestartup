#!/bin/bash

# Writes a plain SQL dump of the application database to /home/code/db_backups.
# Root's crontab runs it every night (server/set_cron_jobs.yaml).
#
# pg_dump runs inside the postgres_postgres container as its POSTGRES_USER over
# the local socket, so the client matches the server version and no password is
# read or passed. The dump holds every table, identities included, so the
# directory is 0700 and every dump in it 0600. A new dump is moved into place
# only after pg_dump succeeds, and only then are dumps older than
# DATABASE_BACKUP_RETENTION_DAYS deleted (default 14; 0 keeps every dump).

set -euo pipefail

BACKUP_DIRECTORY="${DATABASE_BACKUP_DIRECTORY:-/home/code/db_backups}"
RETENTION_DAYS="${DATABASE_BACKUP_RETENTION_DAYS:-14}"

case "$RETENTION_DAYS" in
    "" | *[!0-9]*)
        echo "Error: DATABASE_BACKUP_RETENTION_DAYS must be a non-negative integer, received: $RETENTION_DAYS" >&2
        exit 1
        ;;
esac

POSTGRES_CONTAINER_ID="$(
    docker ps \
        --filter label=com.docker.swarm.service.name=postgres_postgres \
        --format '{{.ID}}' \
    | head -n 1
)"

if [ -z "$POSTGRES_CONTAINER_ID" ]
then
    echo "Error: no running postgres_postgres container to dump" >&2
    exit 1
fi

umask 077
mkdir -p "$BACKUP_DIRECTORY"
chmod 700 "$BACKUP_DIRECTORY"

DATABASE_NAME="$(docker exec "$POSTGRES_CONTAINER_ID" printenv POSTGRES_DB)"
DUMP_PATH="$BACKUP_DIRECTORY/${DATABASE_NAME}_$(date +%d-%m-%Y).dump"
PARTIAL_DUMP_PATH="$(mktemp "$BACKUP_DIRECTORY/.partial.XXXXXX")"

trap 'rm -f "$PARTIAL_DUMP_PATH"' EXIT

if ! docker exec "$POSTGRES_CONTAINER_ID" \
    sh -c 'exec pg_dump --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"' \
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
