#!/bin/sh

# Prepares the application database for a role without superuser rights.
#
# The PostgreSQL image runs this file from /docker-entrypoint-initdb.d once,
# when it initializes an empty data directory. A database that is already
# initialized is moved by running ./postgres.sh migrate-role from tools/deployer.
# The deployer runs this file inside the updated PostgreSQL container:
#
#   docker exec <container> /docker-entrypoint-initdb.d/create_application_role.sh
#
# It connects as POSTGRES_USER, the superuser the image created, to POSTGRES_DB
# and then:
# - creates the vector extension, which only a superuser may create;
# - creates DATABASE_USERNAME as a login role without superuser, database or
#   role creation rights, and sets its password to DATABASE_PASSWORD;
# - makes that role the owner of POSTGRES_DB and of every schema, table,
#   sequence, view, type and ordinary application routine the superuser owns, so migrations
#   running as the role can change them.
#
# The migration is atomic. An existing application login must have ordinary
# attributes, no memberships and no extra privileges on protected objects.

set -eu

superuser="${POSTGRES_USER:-}"
database="${POSTGRES_DB:-}"
application_role="${DATABASE_USERNAME:-}"

psql_as_superuser() {
  psql -v ON_ERROR_STOP=1 --username "$superuser" --no-password --no-psqlrc --dbname "$database" "$@"
}

if [ -z "$superuser" ] || [ -z "${POSTGRES_PASSWORD:-}" ] || [ -z "$database" ] ||
   [ -z "$application_role" ] || [ -z "${DATABASE_PASSWORD:-}" ]; then
  echo "Configure the database name and both PostgreSQL credential pairs. See 'Moving an existing installation to the application role' in tools/deployer/README.md." >&2
  exit 1
fi

if [ "$application_role" = "$superuser" ] || [ "$DATABASE_PASSWORD" = "$POSTGRES_PASSWORD" ]; then
  echo "The PostgreSQL administrator and application must have different names and passwords." >&2
  exit 1
fi

case "${1:-}" in
  --check-config) exit 0 ;;
  --check-login|"") ;;
  *) echo "Usage: create_application_role.sh [--check-config|--check-login]" >&2; exit 2 ;;
esac

protected_object_checks() {
  cat <<'EOSQL'
-- initdb records non-default built-in ACLs in pg_init_privs. A restricted
-- routine such as lo_import must not become executable by this login, even
-- through PUBLIC. A custom SECURITY DEFINER may run arbitrary owner SQL.
SELECT (
  SELECT p.oid::regprocedure::text
  FROM pg_proc p
  JOIN pg_language l ON l.oid = p.prolang
  LEFT JOIN pg_init_privs i ON i.classoid = 'pg_proc'::regclass
    AND i.objoid = p.oid AND i.objsubid = 0
  WHERE has_function_privilege(:'application_role', p.oid, 'EXECUTE')
    AND (
      (i.initprivs IS NOT NULL AND NOT EXISTS (
        SELECT FROM aclexplode(i.initprivs) a
        WHERE a.grantee = 0 AND a.privilege_type = 'EXECUTE'
      ))
      OR (p.oid >= 16384 AND (
        (p.prosecdef AND p.proowner <> (SELECT oid FROM pg_roles WHERE rolname = :'application_role'))
        OR (NOT l.lanpltrusted AND NOT EXISTS (
          SELECT FROM pg_depend d
          WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e'
        ))
      ))
    )
  LIMIT 1) AS unsafe_routine
\gset
\if :{?unsafe_routine}
  \echo Refusing application access to protected routine :unsafe_routine
  DO $$ BEGIN RAISE EXCEPTION 'Review the routine ACL, including PUBLIC, before migrating.'; END $$;
\endif

SELECT EXISTS (
  SELECT FROM pg_namespace n WHERE n.nspname IN ('pg_catalog', 'information_schema')
    AND has_schema_privilege(:'application_role', n.oid, 'CREATE')
) AS writable_catalog
\gset
\if :writable_catalog
  DO $$ BEGIN RAISE EXCEPTION 'Review CREATE on the system schema before migrating.'; END $$;
\endif

-- Extra table or column grants on the server catalogs (e.g. pg_authid)
-- can expose passwords or permit catalog writes without role membership.
WITH catalog_acl AS (
  SELECT c.oid, c.relname, a.grantee, a.privilege_type, 0 AS column_id
  FROM pg_class c CROSS JOIN LATERAL aclexplode(c.relacl) a
  WHERE c.relnamespace = 'pg_catalog'::regnamespace
  UNION ALL
  SELECT c.oid, c.relname, a.grantee, a.privilege_type, col.attnum
  FROM pg_class c JOIN pg_attribute col ON col.attrelid = c.oid
  CROSS JOIN LATERAL aclexplode(col.attacl) a
  WHERE c.relnamespace = 'pg_catalog'::regnamespace
)
SELECT (
  SELECT acl.relname FROM catalog_acl acl
  WHERE (acl.grantee = 0 OR pg_has_role(:'application_role', NULLIF(acl.grantee, 0::oid), 'USAGE'))
    AND NOT EXISTS (
      SELECT FROM pg_init_privs i CROSS JOIN LATERAL aclexplode(i.initprivs) a
      WHERE i.classoid = 'pg_class'::regclass AND i.objoid = acl.oid
        AND i.objsubid IN (0, acl.column_id) AND a.grantee = 0
        AND a.privilege_type = acl.privilege_type
    )
  LIMIT 1
) AS unsafe_catalog
\gset
\if :{?unsafe_catalog}
  \echo Refusing application grant on system catalog :unsafe_catalog
  DO $$ BEGIN RAISE EXCEPTION 'Review the system catalog ACL before migrating.'; END $$;
\endif
EOSQL
}

# The dump and restore clients authenticate over TCP as the actual app login.
# Recheck the live target before reading or executing an archive.
if [ "${1:-}" = "--check-login" ]; then
  {
    cat <<'EOSQL'
SET search_path = pg_catalog;
SELECT EXISTS (
  SELECT FROM pg_roles r JOIN pg_database d ON d.datdba = r.oid
  WHERE r.rolname = session_user AND d.datname = current_database()
    AND NOT (r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication OR r.rolbypassrls)
    AND NOT EXISTS (SELECT FROM pg_auth_members WHERE member = r.oid OR roleid = r.oid)
) AS ordinary_owner
\gset
\if :ordinary_owner
\else
  DO $$ BEGIN RAISE EXCEPTION 'Expected the dedicated application login that owns this database.'; END $$;
\endif
EOSQL
    protected_object_checks
  } | PGREQUIREAUTH=scram-sha-256,md5 PGPASSWORD="$DATABASE_PASSWORD" PGDATABASE="$database" \
        psql -Xq --no-password -h "$(hostname)" -U "$application_role" -v ON_ERROR_STOP=1 -v application_role="$application_role"
  exit $?
fi

bootstrap_sql() {
  cat <<'EOSQL'
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

-- Also check PUBLIC privileges for a brand-new login. If the check fails
-- this transaction rolls back the CREATE ROLE as well.
SELECT format('CREATE ROLE %I', :'application_role')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'application_role')
\gexec

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

ALTER ROLE :"application_role" WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD :'application_password';

ALTER DATABASE :"database" OWNER TO :"application_role";

EOSQL
  protected_object_checks
  cat <<'EOSQL'
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
JOIN pg_language l ON l.oid = p.prolang
WHERE l.lanpltrusted AND NOT p.prosecdef
  AND p.proowner = current_user::regrole
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
}

bootstrap_sql | psql_as_superuser \
  --set database="$database" \
  --set application_role="$application_role"
