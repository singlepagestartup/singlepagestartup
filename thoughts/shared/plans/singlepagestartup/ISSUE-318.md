---
date: 2026-09-26T00:45:00+03:00
issue_number: 318
repository: singlepagestartup
topic: "Create a least-privilege database role and restrict backup permissions"
status: implemented
---

# Least-privilege database role and private backups Implementation Plan

## Overview

The API gets its own PostgreSQL role that owns the application database but is
not a superuser, while the image superuser stays for initialization and
administration. The nightly dump runs inside the PostgreSQL container, is
readable by root only, and is pruned by age.

## Current State Analysis

The research document `thoughts/shared/research/singlepagestartup/ISSUE-318.md`
holds the evidence. In short:

- Locally and on servers the API, its start-time migrations and seed, and the
  RBAC repair connect as the image's bootstrap superuser
  (`apps/db/create_env.sh:32-42`, `apps/api/create_env.sh:56-69`,
  `tools/deployer/postgres/docker-compose.postgres.yaml.j2:10-13`,
  `tools/deployer/api/api.env.j2:12-20`, `start.sh:10-14`).
- The only statement in that workload that needs a superuser is the first
  `CREATE EXTENSION IF NOT EXISTS vector`
  (`libs/shared/backend/database/config/src/lib/migrate/index.ts:58`);
  pgvector is not a trusted extension.
- The deployer runs the stock `pgvector/pgvector:pg17` image and deploys
  PostgreSQL with `start-first`, so any change to the service briefly starts a
  second postmaster on the same data directory, the hazard the Redis template
  already removed.
- `tools/deployer/server/create_db_dump.sh` cannot produce a dump today, writes
  world-readable empty files into a `0755` directory, and never prunes.

## Desired End State

- A fresh local bootstrap (`./up.sh`) and a fresh deployment create the
  `vector` extension and an application role at the first initialization of
  the data directory. The API environment holds that role, and
  `SELECT rolsuper FROM pg_roles WHERE rolname = current_user` returns `f` for
  the API connection. Migrations and seed succeed as that role.
- An existing installation keeps working unchanged after the upgrade. The
  operator moves it to the application role with one documented procedure:
  set the variables, redeploy the PostgreSQL stack, run the same script inside
  the container, redeploy the API.
- The nightly dump runs `pg_dump` inside the `postgres_postgres` container as
  the superuser over the local socket, writes into `/home/code/db_backups`
  with mode `0700`, leaves every dump at mode `0600`, keeps a dump only when
  `pg_dump` succeeds, and after a successful dump deletes dumps older than
  `DATABASE_BACKUP_RETENTION_DAYS` (default 14, `0` keeps every dump). The dump
  still contains every table.

Verification: the throwaway runs, script tests, template rendering and
syntax checks listed in Phase 5.

### Key Discoveries:

- `REASSIGN OWNED BY` the bootstrap superuser is refused; per-object
  `ALTER ... OWNER TO` works (research, observed behavior).
- A non-superuser that owns the database runs every kind of DDL the
  migrations use, and `CREATE EXTENSION IF NOT EXISTS vector` is a no-op for
  it once the extension exists (observed).
- The image trusts local socket connections, so `docker exec ... pg_dump`
  needs no password and matches the server version (observed).
- `apps/llm/ollama-init.sh` is the pattern for a script owned by an app,
  mounted read-only by the dev compose and copied plus mounted by the deployer
  (`tools/deployer/llm/create_llm.yaml:16-20`).
- `NEXT_STATIC_RETENTION_DAYS` is the pattern for a deployer retention setting
  (`tools/deployer/.env.example:87`, `tools/deployer/host.sh:16`).
- `tools/dev/generate-secret.test.ts` is the pattern for `bun:test` tests of
  deployer shell scripts.
- Nx 22 lets `envFile` values override exported variables, so migrations
  against a throwaway database run with a swapped `apps/api/.env`.

## What We're NOT Doing

- No separate migration credential. The application role runs the
  migrations as owner of the database (verified in research, re-verified in
  Phase 5).
- No change to the migrator's `CREATE EXTENSION IF NOT EXISTS vector` line;
  it stays a no-op for the application role and still works for a legacy
  superuser connection.
- No exclusion or encryption of identity tables in dumps. Identities stay in
  the backup; the directory and files become root-only instead.
- No off-host backup copy, compression or format change; the dump stays plain
  SQL with the same file name.
- No attempt to demote or rename an existing bootstrap superuser. PostgreSQL
  requires it to keep `SUPERUSER`, so an existing deployment keeps it for
  administration and gains a new application role.
- No automatic move of an existing installation. The upgrade changes nothing
  on an initialized data directory until the operator runs the procedure.
- No revocation of the default `PUBLIC` privileges on the database; no other
  login role exists in the cluster.
- Nothing from the other rows of finding N-10; they are tracked separately.
- No removal of the host `postgresql-client` install; operators may use it.
- No change to `libs/shared/utils/src/lib/envs/*.ts`: the API already reads
  `DATABASE_USERNAME` and `DATABASE_PASSWORD`, and the new variables are read
  only by shell scripts and templates.

## Implementation Approach

One executable script, `apps/db/create_application_role.sh`, serves both the
first initialization and existing databases. At first initialization the
image entrypoint runs it from `/docker-entrypoint-initdb.d`; on an existing
database the operator runs the same file with `docker exec`. It is idempotent:
it creates the extension if missing, creates the role if missing, sets the
role's attributes and password, makes it the owner of the database and moves
to it every object the superuser owns outside system schemas and extension
members. When no separate role is configured (legacy environments, where the
API name equals the superuser name or is absent) it creates only the extension
and prints a warning. This keeps legacy installations working and makes the
separate role the default for every newly generated configuration.

## Phase 1: Application role at first initialization (local)

### Overview

Create the script, mount it in the local compose service, and make the local
bootstrap generate separate superuser and application credentials.

### Changes Required:

#### 1. Role script

**File**: `apps/db/create_application_role.sh` (new, mode `0755`)
**Why**: the extension needs a superuser, and the API needs a role without
superuser rights that still owns what the migrations create.
**Changes**: POSIX `sh` with `set -eu`, in the style of `apps/llm/ollama-init.sh`.
Runs `psql` as `POSTGRES_USER` against `POSTGRES_DB` with `ON_ERROR_STOP`, and
passes names and the password as psql variables so no value is interpolated
into SQL text. Steps: create the extension; skip with a warning when
`DATABASE_USERNAME` is empty or equals `POSTGRES_USER`; fail when
`DATABASE_PASSWORD` is empty; create the role when missing; set `LOGIN
NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS` and the password;
make it the database owner; move ownership of schemas, relations (sequences
owned by a column follow their table), types and routines owned by the
superuser.

#### 2. Local compose service

**File**: `apps/db/docker-compose.postgres.yaml`
**Why**: both `apps/db/docker-compose.yaml` and the root `docker-compose.yaml`
extend this service.
**Changes**: mount the script read-only at
`/docker-entrypoint-initdb.d/create_application_role.sh`. `apps/db/Dockerfile`
stays unchanged so the local image and the deployer's stock image receive the
script the same way.

#### 3. Local bootstrap

**File**: `apps/db/create_env.sh`, `apps/db/.env.example`
**Why**: the superuser and the application role need separate names and
passwords.
**Changes**: `POSTGRES_USER=postgres` with a generated password;
`DATABASE_USERNAME` set to the repository name (the name the API used before)
with its own `generate_secret 32` password. The example file documents both.

**File**: `apps/api/create_env.sh`
**Why**: the API must connect as the application role.
**Changes**: read `DATABASE_USERNAME` and `DATABASE_PASSWORD` from
`../db/.env`. When that file predates the role (no `DATABASE_USERNAME`), fall
back to the superuser pair and print that the API connects as the superuser,
so a partly regenerated checkout keeps working.

#### 4. Tests

**File**: `tools/dev/create-env.test.ts` (new), `package.json`
**Why**: regression test for the finding at the point where the API
credentials are produced, plus the legacy use case.
**Changes**: `bun:test` suite that runs both `create_env.sh` scripts in a
temporary copy of the directory layout with a stub `origin` remote. Scenarios:
the generated API credentials equal the db env's application pair and differ
from the superuser pair; the passwords are 64 hex characters; a db env
without `DATABASE_USERNAME` makes the API fall back to the superuser pair.
`package.json` gets a `database:test` script for this file and the dump test.

### Success Criteria:

#### Automated Verification:

- [x] `bash -n` passes for the changed scripts; `sh -n` for the POSIX script
- [x] `bun test tools/dev/create-env.test.ts` passes
- [x] Mutation check: reading `POSTGRES_USER` again in `apps/api/create_env.sh` fails the regression scenario

#### Manual Verification:

- [x] Phase 5 local compose run

---

## Phase 2: Deployer PostgreSQL stack

### Overview

Give the stack a separate superuser, deliver the script to the server, and
keep existing deployments deployable.

### Changes Required:

#### 1. Playbooks and template

**File**: `tools/deployer/postgres/create_postgres.yaml`,
`tools/deployer/postgres/delete_postgres.yaml`
**Why**: the stock image needs the script on the host to mount it.
**Changes**: copy `../../../apps/db/create_application_role.sh` to
`/home/code/create_application_role.sh` with mode `0755`; the delete playbook
removes it, as `delete_llm.yaml` removes `ollama-init.sh`.

**File**: `tools/deployer/postgres/docker-compose.postgres.yaml.j2`
**Why**: the superuser and the application role must come from different
variables, and a changed service must not overlap two postmasters.
**Changes**: mount the script read-only into `/docker-entrypoint-initdb.d`;
`POSTGRES_USER` and `POSTGRES_PASSWORD` from the new variables;
`DATABASE_USERNAME` and `DATABASE_PASSWORD` passed for the script; render
values with `to_json` as the Redis template does; drop `start-first` so Swarm
stops the old task before starting the new one.

#### 2. Wrapper and configuration

**File**: `tools/deployer/postgres.sh`
**Why**: existing `.env` files have no superuser variables.
**Changes**: read `POSTGRES_USER` and `POSTGRES_PASSWORD`. When
`POSTGRES_USER` is empty, use the `DATABASE_*` pair for it and print a warning
that the API connects as the superuser and where the README explains the
move. When it is set, require `POSTGRES_PASSWORD` and require
`POSTGRES_USER` to differ from `DATABASE_USERNAME`, following the Redis
wrapper's early exit.

**File**: `tools/deployer/.env.example`
**Changes**: document `POSTGRES_USER=postgres` and a `POSTGRES_PASSWORD`
placeholder beside the `DATABASE_*` block, stating which service uses each.

**File**: `tools/deployer/github_deployer.sh`, `.github/workflows/ansible.yml`
**Why**: `ansible-up` runs `up.sh`, which includes `postgres.sh`.
**Changes**: carry `POSTGRES_USER` and `POSTGRES_PASSWORD` into the GitHub
secrets and back into the deployer `.env`, production and `PREVIEW_`.

### Success Criteria:

#### Automated Verification:

- [x] `ansible-playbook --syntax-check` passes for the changed plays
- [x] The template renders and `docker compose config` accepts the result; `postgres.sh` passes values in the separate-role and the legacy configuration and refuses the two invalid ones
- [x] `bash -n` passes for `postgres.sh` and `github_deployer.sh`

#### Manual Verification:

- [x] Phase 5 stock-image run with the rendered environment

---

## Phase 3: Nightly dump

### Overview

Make the dump run, keep it private, and prune it.

### Changes Required:

#### 1. Dump script

**File**: `tools/deployer/server/create_db_dump.sh`
**Why**: the script cannot reach the database today and writes world-readable
files that are never removed.
**Changes**: `set -euo pipefail`; no `get_env.sh` or `api.env` reads. Validate
`DATABASE_BACKUP_RETENTION_DAYS` (default 14) as a non-negative integer.
Create the directory if missing and set it to `0700`. Find the running
`postgres_postgres` container as the README's administration section does.
Under `umask 077`, write `pg_dump` output from inside the container to a
temporary file in the directory, set it to `0600` and move it to the dated
name only when `pg_dump` succeeded; otherwise delete it, keep every older dump
and exit non-zero. Tighten existing `*.dump` files to `0600`. Then delete
`*.dump` files older than the retention unless it is `0`. Directory and
retention can be overridden by environment for tests.

#### 2. Cron and server wrapper

**File**: `tools/deployer/server/set_cron_jobs.yaml`, `tools/deployer/server.sh`,
`tools/deployer/.env.example`
**Why**: the directory mode and the retention are set where the job is
installed.
**Changes**: create `/home/code/db_backups` with mode `0700` (Ansible also
corrects an existing directory); run the job with
`DATABASE_BACKUP_RETENTION_DAYS` and append its output to
`/home/code/create_db_dump.log`, as the prune jobs log. `server.sh` reads the
value with `get_env_or_default` (default 14) and passes it; `.env.example`
documents it.

#### 3. Tests

**File**: `tools/dev/create-db-dump.test.ts` (new)
**Why**: the file modes, the success-only replacement and the pruning are
behavior a later edit can silently undo.
**Changes**: `bun:test` suite that runs the script with a stub `docker` on
`PATH` and a temporary backup directory. Scenarios: a successful dump is
`0600` in a `0700` directory and holds the dump output; an existing `0644`
dump becomes `0600`; dumps older than the retention are deleted and newer ones
kept; retention `0` keeps everything; a failing `pg_dump` leaves no new file,
keeps old dumps and exits non-zero; no running container exits non-zero
without writing; an invalid retention exits non-zero.

### Success Criteria:

#### Automated Verification:

- [x] `bun test tools/dev/create-db-dump.test.ts` passes
- [x] Mutation checks: removing the mode tightening fails the mode scenario; pruning before the success check fails the failure scenario
- [x] `ansible-playbook --syntax-check` passes for `set_cron_jobs.yaml`

#### Manual Verification:

- [x] Phase 5 dump from a throwaway container through the real script with a real `docker`

---

## Phase 4: Documentation

### Changes Required:

**File**: `tools/deployer/README.md`
**Changes**:

- PostgreSQL administration: the two roles, which service uses which, and
  that administration uses `POSTGRES_USER`.
- Generating deployment secrets: add `POSTGRES_PASSWORD`.
- Rotation section: a procedure for moving an existing deployment (and a
  developer checkout that keeps its data) to the application role; split the
  database row of the rotation table into the superuser and the application
  role, and name only the API as the database client.
- Nightly database dumps: location, schedule, modes, retention, contents,
  log, restore command.
- Data service deploys: the PostgreSQL playbook also copies the role script,
  and the service uses stop-first like Redis.

**File**: `libs/modules/knowledge/README.md`
**Changes**: the extension is created by the database init script as the
superuser; the troubleshooting line covers "permission denied to create
extension" on a database that predates the script.

### Success Criteria:

- [x] Every command in the new README sections was run in Phase 5 or is a documented `docker` or `psql` invocation already used in the README
- [x] Prettier leaves the Markdown unchanged

---

## Phase 5: End-to-end verification

1. Fresh local bootstrap in a scratch copy of the directory layout with its
   own compose project name and port: run both `create_env.sh` scripts and
   `docker compose up -d db`; then, with the worktree's `apps/api/.env`
   swapped for the generated one, run `npx nx run api:db:migrate` and
   `npx nx run api:db:seed`; connect as the application role and check
   `rolsuper`, table ownership and the extension.
2. Stock-image run shaped like the deployer template: fresh init with
   separate roles; check role attributes, create and drop a table, extension
   present.
3. Existing-installation move: initialize with a single superuser role, run
   the real migrations as that superuser, run the script with `docker exec`,
   then run migrations and seed again as the application role.
4. Dump: run `create_db_dump.sh` against a throwaway container with the
   Swarm label and a scratch backup directory.
5. Remove every throwaway container, volume, image and scratch file; restore
   the worktree's `apps/api/.env`. Never connect to `localhost:5433` beyond
   read-only checks.

## Testing Strategy

### Unit Tests:

- `tools/dev/create-env.test.ts`: credential generation and the legacy
  fallback.
- `tools/dev/create-db-dump.test.ts`: modes, success-only replacement,
  pruning, failure paths.

### Integration Tests:

- The throwaway PostgreSQL runs in Phase 5 with the repository migrations and
  seed.

### Use cases that keep working

- Fresh `./up.sh`: new credentials, migrations and seed as the application
  role.
- Existing local checkout: its env files and data directory are untouched;
  regenerating only `apps/api/.env` falls back to the superuser pair.
- Existing deployment re-running `./up.sh` without new variables: warning,
  same stack environment for the superuser, API unchanged.
- Administration through `docker exec` and `psql --username "$POSTGRES_USER"`.
- Knowledge vector columns and the HNSW index, created by migrations as the
  application role.
- MCP and Telegram: no database access, no change. API routes, CORS, uploads,
  the anonymous cart, tunnel development and MCP OAuth: no API code changes.

## Performance Considerations

None at runtime. The dump streams through `docker exec` into a file on the
same host, as `pg_dump` over TCP would.

## Migration Notes

Existing installations change nothing until the operator follows the README
procedure. The PostgreSQL service is updated once when the new template is
deployed (new mount, stop-first), which restarts PostgreSQL for a few seconds.
Downstream projects with their own `create_env.sh` copies or deployer
templates apply the same split.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-318.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-318.md`
- Security review finding N-10: `thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`
