#!/usr/bin/env bash
# Run against two disposable PostgreSQL 17 instances on tmpfs, without host ports.
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)
bootstrap="$root/apps/db/create_application_role.sh"
admin_password=$(openssl rand -hex 16)
app_password=$(openssl rand -hex 16)
containers=()
cleanup() {
  for id in "${containers[@]}"; do
    docker rm -fv "$id" >/dev/null
  done
}
trap cleanup EXIT

start_database() {
  local target="$1"
  db=$(docker run -d --network none --tmpfs /var/lib/postgresql/data:rw,size=384m \
    --mount "type=bind,source=$bootstrap,target=$target,readonly" \
    -e POSTGRES_DB=project -e POSTGRES_USER=project_admin -e POSTGRES_PASSWORD="$admin_password" \
    -e DATABASE_USERNAME=project_api -e DATABASE_PASSWORD="$app_password" pgvector/pgvector:pg17)
  containers+=("$db")
  # The image starts a socket-only server for initdb; TCP becomes available
  # once the real server starts after all entrypoint scripts finish.
  for attempt in {1..60}; do
    if docker exec "$db" pg_isready -qh 127.0.0.1 -U project_admin -d project; then
      return
    fi
    sleep 1
  done
  echo "PostgreSQL did not finish startup" >&2
  return 1
}
admin_sql() {
  docker exec -i "$db" psql -XqAt -v ON_ERROR_STOP=1 -U project_admin -d project "$@"
}
app_sql() {
  docker exec -i -e PGPASSWORD="$app_password" "$db" psql -XqAt -v ON_ERROR_STOP=1 \
    -v VERBOSITY=verbose -h 127.0.0.1 -U project_api -d project "$@"
}
verify_role() {
  local actual denial
  actual=$(app_sql -c "SELECT current_user, rolsuper OR rolcreaterole OR rolcreatedb OR rolreplication OR rolbypassrls,
    current_user = pg_get_userbyid(datdba), EXISTS (SELECT FROM pg_auth_members WHERE member = pg_roles.oid)
    FROM pg_roles, pg_database WHERE rolname = current_user AND datname = current_database()")
  [[ "$actual" = 'project_api|f|t|f' ]]
  app_sql -c "CREATE EXTENSION IF NOT EXISTS vector; CREATE TABLE write_probe (embedding vector(2)); DROP TABLE write_probe;"
  if denial=$(app_sql -c "COPY (SELECT 1) TO PROGRAM 'true'" 2>&1); then
    echo "Application role could execute a server program" >&2
    return 1
  fi
  [[ "$denial" = *42501* ]]
  if denial=$(app_sql -c "SELECT pg_read_file('/etc/hostname')" 2>&1); then
    echo "Application role could read a server file" >&2
    return 1
  fi
  [[ "$denial" = *42501* ]]
}
expect_rejected_upgrade() {
  local error
  if error=$(docker exec "$db" /tmp/role-bootstrap.sh 2>&1); then
    echo "Bootstrap accepted an unsafe existing role" >&2
    return 1
  fi
  [[ "$error" = *"${1:-must be a dedicated login}"* ]]
  [[ "$(admin_sql -c "SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = current_database()")" = project_admin ]]
  [[ "$(admin_sql -c "SELECT count(*) FROM pg_extension WHERE extname='vector'")" = 0 ]]
  [[ "$(admin_sql -c "SELECT relowner::regrole FROM pg_class WHERE oid='old.entries'::regclass")" = project_admin ]]
  [[ "$(admin_sql -c "SELECT nspowner::regrole FROM pg_namespace WHERE nspname='old'")" = project_admin ]]
  docker exec -e PGPASSWORD="$old_password" "$db" psql -XqAt -h 127.0.0.1 -U project_api -d project -c 'SELECT 1' >/dev/null
}

start_database /docker-entrypoint-initdb.d/create_application_role.sh
verify_role
echo "Fresh database: image bootstrap, application login, vector and privilege denials passed"

start_database /tmp/role-bootstrap.sh
old_password=$(openssl rand -hex 16)
if docker exec -e DATABASE_USERNAME=project_admin "$db" /tmp/role-bootstrap.sh; then
  echo "Bootstrap accepted the administrator as the application role" >&2
  exit 1
fi
if docker exec -e DATABASE_PASSWORD="$admin_password" "$db" /tmp/role-bootstrap.sh; then
  echo "Bootstrap accepted a shared administrator password" >&2
  exit 1
fi
admin_sql -v old_password="$old_password" <<'SQL'
CREATE SCHEMA old;
CREATE TABLE old.entries (id serial PRIMARY KEY, title text);
INSERT INTO old.entries (title) VALUES ('preserved');
CREATE VIEW old.entry_titles AS SELECT title FROM old.entries;
CREATE ROLE project_api LOGIN PASSWORD :'old_password';
GRANT pg_execute_server_program TO project_api;
SQL
expect_rejected_upgrade
admin_sql <<'SQL'
REVOKE pg_execute_server_program FROM project_api;
CREATE ROLE operator_group;
GRANT pg_execute_server_program TO operator_group;
GRANT operator_group TO project_api WITH INHERIT FALSE, SET TRUE;
SQL
expect_rejected_upgrade
admin_sql -c 'REVOKE operator_group FROM project_api; ALTER ROLE project_api CREATEROLE;'
expect_rejected_upgrade
admin_sql -c 'ALTER ROLE project_api NOCREATEROLE;'
admin_sql <<'SQL'
CREATE FUNCTION reject_transfer() RETURNS event_trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'simulated transfer failure';
END $$;
CREATE EVENT TRIGGER reject_transfer ON ddl_command_start
  WHEN TAG IN ('ALTER TABLE') EXECUTE FUNCTION reject_transfer();
SQL
expect_rejected_upgrade 'simulated transfer failure'
admin_sql -c 'DROP EVENT TRIGGER reject_transfer; DROP FUNCTION reject_transfer();'
docker exec "$db" /tmp/role-bootstrap.sh >/dev/null
docker exec "$db" /tmp/role-bootstrap.sh >/dev/null
verify_role
[[ "$(app_sql -c 'SELECT title FROM old.entry_titles')" = preserved ]]
[[ "$(app_sql -c "INSERT INTO old.entries (title) VALUES ('new') RETURNING id")" = 2 ]]
app_sql -c 'ALTER TABLE old.entries ADD COLUMN migrated boolean'
echo "Existing database: unsafe grants rejected before changes; retry, data, sequence, view and migration passed"
