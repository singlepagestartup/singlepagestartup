#!/usr/bin/env bash
# Run against disposable PostgreSQL 17 instances on tmpfs, without host ports.
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)
bootstrap="$root/apps/db/create_application_role.sh"
admin_password=$(openssl rand -hex 16)
app_password=$(openssl rand -hex 16)
backup_dir=$(mktemp -d)
containers=()
cleanup() {
  rm -rf "$backup_dir"
  for id in "${containers[@]}"; do
    docker rm -fv "$id" >/dev/null
  done
}
trap cleanup EXIT
trap 'echo "PostgreSQL integration check failed at line $LINENO" >&2' ERR

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
if docker exec -e DATABASE_USERNAME= "$db" /tmp/role-bootstrap.sh; then
  echo "Bootstrap accepted missing application credentials" >&2
  exit 1
fi
admin_sql -c 'GRANT EXECUTE ON FUNCTION pg_catalog.lo_import(text) TO PUBLIC;'
if docker exec "$db" /tmp/role-bootstrap.sh >"$backup_dir/public-grant.log" 2>&1; then
  echo "Bootstrap accepted a new login inheriting an unsafe PUBLIC grant" >&2
  exit 1
fi
grep -q 'Review the routine ACL' "$backup_dir/public-grant.log"
[[ "$(admin_sql -c "SELECT count(*) FROM pg_roles WHERE rolname='project_api'")" = 0 ]]
admin_sql -c 'REVOKE EXECUTE ON FUNCTION pg_catalog.lo_import(text) FROM PUBLIC;'
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
for grantee in project_api PUBLIC; do
  admin_sql -c "GRANT EXECUTE ON FUNCTION pg_catalog.lo_import(text) TO $grantee;"
  expect_rejected_upgrade 'Review the routine ACL'
  admin_sql -c "REVOKE EXECUTE ON FUNCTION pg_catalog.lo_import(text) FROM $grantee;"
done
admin_sql -c 'GRANT SELECT (rolpassword) ON pg_authid TO project_api;'
expect_rejected_upgrade 'Review the system catalog ACL'
admin_sql -c 'REVOKE SELECT (rolpassword) ON pg_authid FROM project_api;'
admin_sql -c "CREATE FUNCTION public.elevated_helper() RETURNS name LANGUAGE SQL SECURITY DEFINER AS 'SELECT current_user';"
expect_rejected_upgrade 'Review the routine ACL'
admin_sql -c 'REVOKE EXECUTE ON FUNCTION public.elevated_helper() FROM PUBLIC;'
admin_sql -c "CREATE FUNCTION public.server_file(text) RETURNS oid LANGUAGE internal AS 'be_lo_import';"
expect_rejected_upgrade 'Review the routine ACL'
admin_sql -c 'REVOKE EXECUTE ON FUNCTION public.server_file(text) FROM PUBLIC;'
admin_sql -c 'GRANT CREATE ON SCHEMA pg_catalog TO PUBLIC;'
expect_rejected_upgrade 'Review CREATE on the system schema'
admin_sql -c 'REVOKE CREATE ON SCHEMA pg_catalog FROM PUBLIC;'
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
[[ "$(app_sql -c "SELECT has_function_privilege(current_user,'public.server_file(text)','EXECUTE') OR has_function_privilege(current_user,'public.elevated_helper()','EXECUTE')")" = f ]]
# These are non-application routines and deliberately kept with their owner.
admin_sql -c 'DROP FUNCTION public.server_file(text); DROP FUNCTION public.elevated_helper();'
[[ "$(app_sql -c 'SELECT title FROM old.entry_titles')" = preserved ]]
[[ "$(app_sql -c "INSERT INTO old.entries (title) VALUES ('new') RETURNING id")" = 2 ]]
app_sql -c 'ALTER TABLE old.entries ADD COLUMN migrated boolean'
echo "Existing database: unsafe grants rejected before changes; retry, data, sequence, view and migration passed"

# Only Swarm discovery is replaced. All SQL, pg_dump and pg_restore commands
# run against the temporary databases, even on a host with a live Swarm.
source_db=$db
dump_source() (
  docker() {
    if [[ "$1" = ps ]]; then
      printf '%s\n' "$source_db"
    else
      command docker "$@"
    fi
  }
  export source_db
  export -f docker
  DATABASE_BACKUP_DIRECTORY="$backup_dir" bash "$root/tools/deployer/server/create_db_dump.sh"
)
app_sql <<'SQL'
CREATE FUNCTION old.verify_restore_role(input text) RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  IF current_user <> 'project_api' OR session_user <> 'project_api' THEN
    RAISE EXCEPTION 'Unexpected restore identity: % / %', session_user, current_user;
  END IF;
  RAISE WARNING 'restore identity: % / %', session_user, current_user;
  RETURN true;
END $$;
ALTER TABLE old.entries ADD CHECK (old.verify_restore_role(title));
CREATE TABLE old.embeddings (v vector(2));
INSERT INTO old.embeddings VALUES ('[1,2]');
SQL
# Existing installations mount the bootstrap under the entrypoint path after upgrade.
docker exec "$source_db" cp /tmp/role-bootstrap.sh /docker-entrypoint-initdb.d/create_application_role.sh
dump_source
archive=$(find "$backup_dir" -name '*.dump')
[[ -s "$archive" ]]

# This second archive fails during COPY, after pre-data DDL.
app_sql <<'SQL'
CREATE OR REPLACE FUNCTION old.verify_restore_role(input text) RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE 'COPY (SELECT 1) TO PROGRAM ''true''';
  RETURN true;
END $$;
SQL
bad="$backup_dir/failed.archive"
docker exec "$source_db" pg_dump -U project_api -d project -Fc --no-acl --exclude-extension=vector > "$bad"

start_database /docker-entrypoint-initdb.d/create_application_role.sh
restore="$root/tools/deployer/server/restore_db_dump.sh"
admin_sql -c 'ALTER ROLE project_api SUPERUSER;'
if "$restore" "$db" < "$archive" >"$backup_dir/privileged.log" 2>&1; then
  echo "Restore accepted a target configured with a superuser login" >&2
  exit 1
fi
grep -q 'dedicated application login' "$backup_dir/privileged.log"
admin_sql -c 'ALTER ROLE project_api NOSUPERUSER;'
if "$restore" "$db" < "$bad" >"$backup_dir/bad.log" 2>&1; then
  echo "Restore accepted a function that runs a server program" >&2
  exit 1
fi
grep -q 'pg_execute_server_program' "$backup_dir/bad.log" || { cat "$backup_dir/bad.log" >&2; exit 1; }
[[ "$(admin_sql -c "SELECT to_regnamespace('old') IS NULL")" = t ]]

"$restore" "$db" < "$archive" >"$backup_dir/restore.log" 2>&1 || { cat "$backup_dir/restore.log" >&2; exit 1; }
# If either identity differed, the CHECK would have aborted every restored row.
[[ "$(app_sql -c "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='old.entries'::regclass AND contype='c'")" = *verify_restore_role* ]]
[[ "$(app_sql -c "SELECT title FROM old.entry_titles ORDER BY title")" = $'new\npreserved' ]]
[[ "$(app_sql -c "SELECT v FROM old.embeddings")" = '[1,2]' ]]
[[ "$(app_sql -c "INSERT INTO old.entries (title) VALUES ('restored') RETURNING id")" = 3 ]]
if "$restore" "$db" < "$archive"; then
  echo "Restore accepted a populated target" >&2
  exit 1
fi
echo "Restore: data, sequence, view and vector survived; authenticated as project_api; privileged COPY rolled back the entire restore."
