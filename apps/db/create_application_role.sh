#!/bin/sh

# Prepares the application database for a role without superuser rights.
#
# The PostgreSQL image runs this file from /docker-entrypoint-initdb.d once,
# when it initializes an empty data directory. A database that is already
# initialized is moved by running the same file inside the running container:
#
#   docker exec <container> /docker-entrypoint-initdb.d/create_application_role.sh
#
# It connects as POSTGRES_USER, the superuser the image created, to POSTGRES_DB
# and then:
# - creates the vector extension, which only a superuser may create;
# - creates DATABASE_USERNAME as a login role without superuser, database or
#   role creation rights, and sets its password to DATABASE_PASSWORD;
# - makes that role the owner of POSTGRES_DB and of every schema, table,
#   sequence, view, type and routine the superuser owns in it, so migrations
#   running as the role can change them.
#
# The migration is atomic. An existing application login must have ordinary
# attributes and no explicit memberships. When DATABASE_USERNAME is empty,
# only the extension is created and the legacy application keeps
# connecting as the superuser.

set -eu

superuser="${POSTGRES_USER:-postgres}"
database="${POSTGRES_DB:-$superuser}"
application_role="${DATABASE_USERNAME:-}"

psql_as_superuser() {
  psql -v ON_ERROR_STOP=1 --username "$superuser" --no-password --no-psqlrc --dbname "$database" "$@"
}

if [ -z "$application_role" ]; then
  psql_as_superuser -c 'CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public'
  echo "create_application_role.sh: DATABASE_USERNAME is unset, so the application connects as the superuser." >&2
  exit 0
fi

if [ "$application_role" = "$superuser" ]; then
  echo "create_application_role.sh: DATABASE_USERNAME must differ from POSTGRES_USER." >&2
  exit 1
fi

if [ -z "${DATABASE_PASSWORD:-}" ]; then
  echo "create_application_role.sh: DATABASE_PASSWORD must be set for the role $application_role." >&2
  exit 1
fi

if [ "$DATABASE_PASSWORD" = "${POSTGRES_PASSWORD:-}" ]; then
  echo "create_application_role.sh: The application and administrator need separate passwords." >&2
  exit 1
fi

psql_as_superuser \
  --set database="$database" \
  --set application_role="$application_role" <<'EOSQL'
\getenv application_password DATABASE_PASSWORD
BEGIN;
SET LOCAL search_path = pg_catalog;

-- A direct membership can grant privileges through a chain of roles, SET
-- ROLE, or ADMIN OPTION. Leave existing grants intact for the operator to
-- review. The implicit pg_database_owner role has no pg_auth_members row.
SELECT EXISTS (
  SELECT FROM pg_roles AS role
  WHERE role.rolname = :'application_role'
    AND (NOT role.rolcanlogin OR role.rolsuper OR role.rolcreatedb OR role.rolcreaterole
      OR role.rolreplication OR role.rolbypassrls
      OR EXISTS (SELECT FROM pg_auth_members WHERE member = role.oid OR roleid = role.oid))
) AS unsafe_role
\gset
\if :unsafe_role
  DO $$ BEGIN
    RAISE EXCEPTION 'DATABASE_USERNAME must be a dedicated login without privileged attributes or explicit role memberships. Choose a new role or review its grants.';
  END $$;
\endif

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

SELECT format('CREATE ROLE %I', :'application_role')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'application_role')
\gexec

ALTER ROLE :"application_role" WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD :'application_password';

ALTER DATABASE :"database" OWNER TO :"application_role";

SELECT format('ALTER SCHEMA %I OWNER TO %I', n.nspname, :'application_role')
FROM pg_namespace n
WHERE n.nspowner = current_user::regrole
  AND n.nspname <> 'information_schema'
  AND n.nspname NOT LIKE 'pg\_%'
  AND NOT EXISTS (
    SELECT FROM pg_depend d
    WHERE d.classid = 'pg_namespace'::regclass AND d.objid = n.oid AND d.deptype = 'e'
  )
\gexec

-- Sequences that belong to a serial or identity column change owner with
-- their table, and PostgreSQL rejects changing them on their own.
SELECT format(
  'ALTER %s %I.%I OWNER TO %I',
  CASE c.relkind
    WHEN 'v' THEN 'VIEW'
    WHEN 'm' THEN 'MATERIALIZED VIEW'
    WHEN 'S' THEN 'SEQUENCE'
    WHEN 'f' THEN 'FOREIGN TABLE'
    ELSE 'TABLE'
  END,
  n.nspname,
  c.relname,
  :'application_role'
)
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relowner = current_user::regrole
  AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
  AND n.nspname <> 'information_schema'
  AND n.nspname NOT LIKE 'pg\_%'
  AND NOT EXISTS (
    SELECT FROM pg_depend d
    WHERE d.classid = 'pg_class'::regclass AND d.objid = c.oid AND d.deptype IN ('e', 'a', 'i')
  )
\gexec

-- Enum, domain, range and standalone composite types. Array, multirange and
-- table row types change owner with the type or table they belong to.
SELECT format('ALTER TYPE %s OWNER TO %I', t.oid::regtype, :'application_role')
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE t.typowner = current_user::regrole
  AND t.typtype IN ('e', 'd', 'r', 'c')
  AND (t.typrelid = 0 OR (SELECT c.relkind FROM pg_class c WHERE c.oid = t.typrelid) = 'c')
  AND n.nspname <> 'information_schema'
  AND n.nspname NOT LIKE 'pg\_%'
  AND NOT EXISTS (
    SELECT FROM pg_depend d
    WHERE d.classid = 'pg_type'::regclass AND d.objid = t.oid AND d.deptype = 'e'
  )
\gexec

SELECT format('ALTER ROUTINE %s OWNER TO %I', p.oid::regprocedure, :'application_role')
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proowner = current_user::regrole
  AND p.prokind IN ('f', 'p')
  AND n.nspname <> 'information_schema'
  AND n.nspname NOT LIKE 'pg\_%'
  AND NOT EXISTS (
    SELECT FROM pg_depend d
    WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e'
  )
\gexec
COMMIT;
EOSQL
