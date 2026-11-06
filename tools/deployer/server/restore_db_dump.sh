#!/usr/bin/env bash
# Restore stdin into an offline, newly bootstrapped SPS database. The caller
# names the container explicitly so the live stack is never selected for them.
set -euo pipefail
if [[ $# != 1 || -z "$1" ]]; then
    echo "Usage: restore_db_dump.sh TARGET_CONTAINER < backup.dump" >&2
    exit 2
fi

docker exec "$1" /docker-entrypoint-initdb.d/create_application_role.sh --check-login
ready=$(docker exec -i "$1" sh -ec '
    export PGREQUIREAUTH=scram-sha-256,md5
    export PGDATABASE="$POSTGRES_DB" PGPASSWORD="$DATABASE_PASSWORD"
    exec psql -XqAt --no-password -h "$(hostname)" -U "$DATABASE_USERNAME" -v ON_ERROR_STOP=1
' <<'SQL'
SET search_path = pg_catalog;
-- Implicit array types and operator families belong to extension objects.
WITH RECURSIVE extension_objects (classid, objid) AS (
  SELECT 'pg_extension'::regclass::oid, oid FROM pg_extension
  UNION
  SELECT d.classid, d.objid FROM pg_depend d
  JOIN extension_objects e ON (d.refclassid, d.refobjid) = (e.classid, e.objid)
  WHERE d.deptype IN ('e', 'i', 'a')
)
SELECT EXISTS (SELECT FROM pg_extension WHERE extname = 'vector')
  AND NOT EXISTS (
    SELECT FROM pg_namespace
    WHERE nspname NOT IN ('public', 'information_schema') AND nspname !~ '^pg_'
  )
  AND NOT EXISTS (
    SELECT FROM pg_depend d
    WHERE d.refclassid = 'pg_namespace'::regclass AND d.refobjid = 'public'::regnamespace
      AND NOT EXISTS (
        SELECT FROM extension_objects e WHERE (e.classid, e.objid) = (d.classid, d.objid)
      )
  );
SQL
)
if [[ "$ready" != t ]]; then
    echo "Restore requires an empty target with vector already installed." >&2
    exit 1
fi

docker exec -i "$1" sh -ec '
    export PGREQUIREAUTH=scram-sha-256,md5
    export PGDATABASE="$POSTGRES_DB" PGPASSWORD="$DATABASE_PASSWORD" PGUSER="$DATABASE_USERNAME"
    exec pg_restore --dbname="host=$(hostname)" --no-password --format=custom \
        --no-owner --no-acl --exit-on-error --single-transaction
'
