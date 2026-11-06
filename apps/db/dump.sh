#!/usr/bin/env bash
# Back up this checkout's running Compose database using the same archive
# format and application role as the server's nightly job.
set -euo pipefail
cd "$(dirname "$0")"
container=$(docker compose ps --status running -q db)
if [[ -z "$container" ]]; then
    echo "Start the local db Compose service before taking a dump." >&2
    exit 1
fi
export DATABASE_BACKUP_DIRECTORY="${DATABASE_BACKUP_DIRECTORY:-$PWD/db_backups}"
exec bash ../../tools/deployer/server/create_db_dump.sh "$container"
