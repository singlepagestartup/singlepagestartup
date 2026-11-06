---
date: 2026-09-26T00:15:00+03:00
researcher: flakecode
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-318-db-role-backups
repository: singlepagestartup
topic: "Create a least-privilege database role and restrict backup permissions"
tags: [research, codebase, deployer, postgres, pgvector, backups, docker-swarm, ansible]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Create a least-privilege database role and restrict backup permissions

**Date**: 2026-09-26
**Researcher**: flakecode
**Git Commit**: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
**Branch**: claude/issue-318-db-role-backups
**Repository**: singlepagestartup

## Research Question

Which PostgreSQL role does each SPS environment create, which processes
connect with it and which privileges their work uses, and how is the nightly
database dump produced, stored and retained? The question covers the
"PostgreSQL role" and "Backups" rows of finding N-10 in
`2026-09-25-security-review.md`.

## Summary

Every environment has exactly one PostgreSQL role, and it is a superuser. The
local bootstrap writes `POSTGRES_USER` and a generated `POSTGRES_PASSWORD` into
`apps/db/.env`, and `apps/api/create_env.sh` copies the same pair into
`DATABASE_USERNAME` and `DATABASE_PASSWORD`. The deployer passes one
`DATABASE_*` triple both to the PostgreSQL stack, as the image's
`POSTGRES_DB`, `POSTGRES_USER` and `POSTGRES_PASSWORD`, and to the API
environment. The `pgvector/pgvector:pg17` entrypoint runs `initdb` with
`--username=$POSTGRES_USER`, so that role is the cluster's bootstrap superuser
with OID 10.

Only the API process tree connects to PostgreSQL: the server, the migrations
and seed that the API container runs at start, the dump target and the RBAC
natural-key repair. MCP, Telegram, OpenAPI and the host have no database
settings. The work they do uses DDL and DML in the `public` and `drizzle`
schemas, temporary tables, and one statement that needs a superuser the first
time it runs: `CREATE EXTENSION IF NOT EXISTS vector` in the shared migrator.
pgvector's control file does not mark the extension trusted.

The nightly dump cannot run as written. `create_db_dump.sh` sources
`./get_env.sh` relative to cron's working directory, and no play copies that
file to the server. It then connects to the host address on port 5432, where
nothing listens (issue 215), with the Ubuntu `postgresql-client`, whose
`pg_dump` is older than the server's major version 17. The shell redirection
creates the dump file before `pg_dump` starts, with the default umask. The directory is created with mode `0755`, and nothing
removes old files.

A throwaway container confirmed the PostgreSQL behavior a fix depends on:
`REASSIGN OWNED BY` the bootstrap superuser is refused, per-object
`ALTER ... OWNER TO` works, a non-superuser that owns the database runs the
same DDL the migrations use, and `CREATE EXTENSION IF NOT EXISTS vector` is a
no-op for that role once the extension exists.

## Detailed Findings

### Local database bootstrap (`apps/db`)

- `apps/db/create_env.sh:32-42` derives `REPO_NAME` from the `origin` remote
  and writes `COMPOSE_PROJECT_NAME`, `POSTGRES_DB` and `POSTGRES_USER` as that
  name and `POSTGRES_PASSWORD` from `generate_secret 32`. The script exits
  early when `.env` exists (`:5-8`) and writes it with `umask 077` and mode
  `600` (`:11`, `:52`).
- `apps/db/.env.example:6-9` documents `POSTGRES_DB=sps`,
  `POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=password`.
- `apps/db/docker-compose.postgres.yaml:4-16` builds `apps/db/Dockerfile`,
  mounts `./db_data` as the data directory, loads `.env` and publishes
  `${POSTGRES_PORT}:5432`. `apps/db/docker-compose.yaml:4-11` and the root
  `docker-compose.yaml:4-9` both extend this service, so a volume added to it
  reaches both.
- `apps/db/Dockerfile:1` is `FROM pgvector/pgvector:pg17`; lines 3-11 are a
  commented-out `COPY` into `/docker-entrypoint-initdb.d`. No init script is
  mounted or copied today.
- `apps/db/up.sh:1-4` runs `create_env.sh` and `docker-compose up -d`. The root
  `up.sh:1-10` runs the root `create_env.sh`, starts `apps/db` and
  `apps/redis`, and runs `npx nx run api:db:migrate`. The root
  `create_env.sh:50-55` runs the db, redis, host, api, telegram and mcp
  `create_env.sh` scripts in that order.
- `apps/db/dump.sh` and `apps/db/migrate.sh` reference paths that no longer
  exist (`../deployment/ansible/get_env.sh`, `../backend/.env`) or are fully
  commented out; nothing calls them.

### API environment

- `apps/api/create_env.sh:56-69` writes `DATABASE_HOST=localhost` and copies
  `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_PORT` from
  `../db/.env` into `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`
  and `DATABASE_PORT`.
- `libs/shared/utils/src/lib/envs/host.ts:22-49` reads `DATABASE_*`, falling
  back to `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST` and
  `POSTGRES_DATABASE` (the Vercel Postgres names), and builds
  `DATABASE_OPTIONS`.
- `libs/shared/backend/database/config/src/lib/postgres.ts:15-37` builds one
  `postgres` client from `DATABASE_OPTIONS`; migrations get a pool of one
  connection (`isMigration`), the server twenty. There is no second set of
  credentials for migrations.

### Deployer PostgreSQL stack and API environment

- `tools/deployer/postgres.sh:10-29` reads `DATABASE_NAME`,
  `DATABASE_USERNAME` and `DATABASE_PASSWORD` and passes them to
  `postgres/create_postgres.yaml`.
- `tools/deployer/postgres/create_postgres.yaml:6-17` creates
  `/home/code/postgres_data`, renders the Compose template and runs
  `docker stack deploy`. The playbook holds only these three tasks by design
  (commit f70abd3698, "keep data service deploys simple"; README `:238-240`).
- `tools/deployer/postgres/docker-compose.postgres.yaml.j2:4-19` runs the stock
  `pgvector/pgvector:pg17` image, not `apps/db/Dockerfile`, with
  `POSTGRES_DB`, `POSTGRES_USER` and `POSTGRES_PASSWORD` set to the three
  `DATABASE_*` values, the data directory at `/home/code/postgres_data`, no
  published port, and `update_config: order: start-first` (`:14-16`).
- `tools/deployer/api/api.env.j2:12-20` writes the same `DATABASE_NAME`,
  `DATABASE_USERNAME` and `DATABASE_PASSWORD` into `/home/code/api.env` with
  `DATABASE_HOST=postgres` (`tools/deployer/api/create_api.yaml:34-40`,
  `tools/deployer/api.sh:22-24,130-132`).
- `tools/deployer/.env.example:64-67` holds one database block:
  `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`.
- `tools/deployer/up.sh:8-19` deploys server, AWS, Certbot, Traefik,
  Portainer, PostgreSQL, Redis, LLM, API, MCP, Telegram and host in that order.
- `tools/deployer/github_deployer.sh:37-39,158-160` copies the three values
  into GitHub Actions secrets and creates the `ansible-up` and `ansible-down`
  branches (`:246-253`). `.github/workflows/ansible.yml:62-64,181-183` writes
  the production and `PREVIEW_` secrets back into the deployer `.env`, and
  `:22-27,274-276` runs the script named by the branch, so `ansible-up` runs
  `up.sh` including `postgres.sh`.
- `tools/deployer/mcp/mcp.env.j2:1-46` and `apps/mcp/create_env.sh:16-30`
  carry no database settings; `apps/mcp`, `apps/telegram`, `apps/openapi` and
  `apps/host` import no database configuration.

### Processes that connect to PostgreSQL and what they do

- The API container command is `./start.sh api`
  (`tools/deployer/api/docker-compose.api.yaml.j2:10-12`); `start.sh:10-14`
  writes the process environment to `apps/api/.env`, starts
  `./migrate.sh seed` in the background and starts the API. All of them use
  the same `DATABASE_*` values.
- `migrate.sh:7-27` runs every module's `repository-migrate` target, the RBAC
  natural-key repair, and the seed when called with `seed`. Each model target
  runs `bun run ./src/lib/migrate.ts` with `envFile: apps/api/.env`
  (for example `libs/modules/rbac/project.json`, `models:identity:repository-migrate`).
  Nx 22 unloads and reloads the `envFile` keys after copying the process
  environment (`node_modules/nx/src/executors/run-commands/running-tasks.js:393-433`),
  so values in `apps/api/.env` take precedence over exported variables.
- `libs/shared/backend/database/config/src/lib/migrate/index.ts:46-73` runs
  `CREATE EXTENSION IF NOT EXISTS vector` (`:58`), reads
  `drizzle.<migrationsTable>` and runs the drizzle migrator, which creates the
  `drizzle` schema and its history table on first use.
  `libs/modules/knowledge/models/chunk/backend/repository/database/src/lib/migrate.ts:6-19`
  (and the `source` model) also run `CREATE SCHEMA IF NOT EXISTS drizzle` and
  may rename a history table.
- The 255 tracked migration files contain `CREATE TABLE`, `ALTER TABLE`,
  `CREATE [UNIQUE] INDEX` (including an HNSW index on a `vector(768)` column
  in `libs/modules/knowledge/models/chunk/.../migrations/0000_ambitious_gambit.sql:10,18`),
  `UPDATE`, `DELETE`, `DROP TABLE IF EXISTS`, `DROP INDEX` and `DO` blocks. No
  migration creates an extension, a function, a trigger or a role.
- `libs/modules/rbac/backend/repository/database/src/lib/telegram-natural-key-repair.ts:370`
  creates a temporary table. The RBAC integration specs create and drop tables
  in `public`. No code creates databases, roles or schemas other than
  `drizzle`, and none uses `COPY ... PROGRAM`, server file functions or
  `session_replication_role`. The truncate helpers in
  `libs/providers/db/src/lib/drizzle/utils/` have no callers.

### The vector extension

- `/usr/share/postgresql/17/extension/vector.control` in the image (pgvector
  0.8.6) has no `trusted = true` line, so only a superuser may create the
  extension.
- `libs/modules/knowledge/README.md:20-21` states that the shared migration
  wrapper creates the extension; `:219` gives the troubleshooting step for a
  missing extension.

### Nightly backup

- `tools/deployer/server.sh:22-32` runs `create_working_directory.yaml`,
  `install_psql.yaml` and the other server plays, then `set_cron_jobs.yaml`.
- `tools/deployer/server/install_psql.yaml:15-32` installs Ubuntu's
  `postgresql-client` and copies `create_db_dump.sh` to
  `/home/code/create_db_dump.sh` with mode `0755`. It copies nothing else.
- `tools/deployer/server/set_cron_jobs.yaml:20-31` creates
  `/home/code/db_backups` with mode `0755` and adds a root cron job at 00:00
  that runs `/home/code/create_db_dump.sh` with no output redirection. The
  play declares `API_SERVICE_URL` and `RBAC_SECRET_KEY` variables that no task
  in it uses.
- `tools/deployer/server/create_db_dump.sh:1-10` sources `./get_env.sh`, reads
  `DATABASE_PASSWORD`, `DATABASE_NAME` and `DATABASE_USERNAME` from `api.env`
  next to itself, and runs
  `pg_dump $POSTGRES_DB > /home/code/db_backups/<name>_<dd-mm-yyyy>.dump -h <first host address> -p 5432 -U $POSTGRES_USER`
  in plain SQL format.
  - Cron runs the job with root's home directory as the working directory, and
    `get_env.sh` exists on the server only if copied by hand: the play copies
    the dump script alone (layout since commit 85cf27f8bc, 2024). Without the
    function every variable is empty and `pg_dump` receives `-U` with no
    argument.
  - No listener exists on port 5432 of the host: the PostgreSQL template
    publishes no port, and Traefik has no TCP entrypoint since issue 215
    (`tools/deployer/README.md:73,257-259`).
  - Ubuntu 22.04 and 24.04 ship PostgreSQL client 14 and 16; `pg_dump` refuses
    to dump a server of a newer major version.
  - The redirection creates the file before `pg_dump` runs, so each failed run
    leaves an empty file with the default umask, and the next day's run does
    not remove anything.
- `tools/deployer/README.md:81-98` documents administration through
  `docker exec` into the `postgres_postgres` container, where
  `psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"` connects over the
  local socket.

### Observed PostgreSQL behavior (throwaway `pgvector/pgvector:pg17` container)

A container started with `POSTGRES_USER=legacyowner` on `127.0.0.1:55318` was
used to reproduce a deployment that already initialized its data directory,
then removed.

- `pg_hba.conf` trusts local socket connections and uses `scram-sha-256` for
  other hosts; `legacyowner` is OID 10 with `rolsuper = t`, and no `postgres`
  role exists.
- After creating the extension, a `drizzle` schema with a serial table, an
  enum, a table with an identity column and a `vector(3)` column, a free
  sequence and a view as `legacyowner`,
  `REASSIGN OWNED BY legacyowner TO <role>` failed with "cannot reassign
  ownership of objects owned by role legacyowner because they are required by
  the database system".
- A script that ran `ALTER DATABASE ... OWNER TO`, then `ALTER SCHEMA`,
  `ALTER TABLE`, `ALTER SEQUENCE`, `ALTER VIEW` and `ALTER TYPE ... OWNER TO`
  for every object owned by the superuser outside system schemas and
  extension members, moved all of them. Serial and identity sequences moved
  with their tables. Running it again changed nothing except the role
  password.
- Connected over TCP with a password, the new role reported
  `rolsuper = f, rolcreatedb = f, rolcreaterole = f`; ran
  `CREATE EXTENSION IF NOT EXISTS vector` (NOTICE, no-op),
  `ALTER TABLE ... ADD COLUMN`, `ALTER TYPE ... ADD VALUE`, inserts into both
  schemas, `CREATE`/`DROP TABLE` and `CREATE`/`DROP SCHEMA`; and was refused
  `COPY ... TO PROGRAM`, `pg_read_file` and `CREATE DATABASE`.
- In a database it owned without the extension, the same role got
  "permission denied to create extension "vector"" with the hint "Must be
  superuser to create this extension."
- `docker exec <container> sh -c 'exec pg_dump --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"'`
  produced a complete plain dump over the local socket with no password,
  including `CREATE EXTENSION IF NOT EXISTS vector` and every table's data.
- The image entrypoint executes an executable `*.sh` file in
  `/docker-entrypoint-initdb.d` and sources a non-executable one, only while
  initializing an empty data directory. Its own statements pass names through
  psql variables (`--set db=... CREATE DATABASE :"db"`).

### Patterns in the repository that match this work

- `apps/llm/ollama-init.sh` is an executable POSIX `sh` script at the app root
  with `set -eu` and explicit validation messages. `apps/llm/docker-compose.yml:54-66`
  mounts it read-only; `tools/deployer/llm/create_llm.yaml:16-20` copies it
  from `../../../apps/llm/` to `/home/code/` with mode `0755`, and
  `tools/deployer/llm/docker-compose.llm.yaml.j2:43-55` mounts it read-only.
- `tools/deployer/redis.sh:16-22` rejects an empty password before deploying;
  `tools/deployer/redis/docker-compose.redis.yaml.j2:20-29` renders environment
  values with `to_json` and uses the default stop-first update order, which
  the README explains at `:241-244` (commit 0d4cb3b2b6).
- `NEXT_STATIC_RETENTION_DAYS` is a retention setting with a default in
  `tools/deployer/.env.example:87`, `tools/deployer/host.sh:16` (read with
  `get_env_or_default`), the template, the runtime and `README.md:369-370`,
  where `0` disables pruning.
- `tools/dev/generate-secret.test.ts` tests deployer shell scripts from
  `bun:test` by running them in `bash` with redirected output, and
  `package.json:53` exposes it as `secrets:test`.
- `lint-staged.config.js:2` runs `prettier --write` on staged `md`, `ts` and
  `js` files at commit time; YAML and shell files are not formatted.

## Code References

- `apps/db/create_env.sh:32-42` - one role name and password for the image superuser
- `apps/db/docker-compose.postgres.yaml:4-16` - local PostgreSQL service extended by both compose files
- `apps/api/create_env.sh:56-69` - API credentials copied from the superuser
- `libs/shared/utils/src/lib/envs/host.ts:22-49` - `DATABASE_*` resolution
- `libs/shared/backend/database/config/src/lib/migrate/index.ts:58` - `CREATE EXTENSION IF NOT EXISTS vector`
- `libs/shared/backend/database/config/src/lib/postgres.ts:15-37` - one client, migration pool of one
- `start.sh:10-14` - API container runs migrations and seed with the API credentials
- `migrate.sh:7-27` - module migration order
- `tools/deployer/postgres.sh:10-29` - PostgreSQL stack variables
- `tools/deployer/postgres/docker-compose.postgres.yaml.j2:4-19` - stock image, superuser from `DATABASE_*`, start-first
- `tools/deployer/postgres/create_postgres.yaml:6-17` - three-task playbook
- `tools/deployer/api/api.env.j2:12-20` - API database credentials
- `tools/deployer/.env.example:64-67` - deployer database block
- `tools/deployer/github_deployer.sh:37-39,158-160` and `.github/workflows/ansible.yml:62-64,181-183` - database secrets in CI
- `tools/deployer/server/set_cron_jobs.yaml:20-31` - backup directory `0755`, cron job
- `tools/deployer/server/create_db_dump.sh:1-10` - dump script
- `tools/deployer/server/install_psql.yaml:15-32` - client install and script copy
- `tools/deployer/README.md:81-98,152-200,238-244` - administration, secret rotation, data service deploys
- `libs/modules/knowledge/README.md:20-21,219` - extension statements

## Architecture Documentation

Credentials flow in one direction in both environments. Locally, the db
bootstrap is the source and the API bootstrap copies from it; on a server, the
operator's `tools/deployer/.env` (or the GitHub secrets that the workflow
writes into it) is the source for every stack. The PostgreSQL image applies
`POSTGRES_*` only while initializing an empty data directory; afterwards the
values in the stack environment are informational, and changing a role or
password requires SQL inside the running container. Schema changes are
applied by the API container at every start, with the same connection
settings as the running server. The deployer treats data services as small
playbooks that render one Compose file, and it copies scripts that belong to
an app from `apps/<app>/` to `/home/code/` and mounts them read-only.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`,
  finding N-10, lists the PostgreSQL role and backup rows this issue covers.
  Its other rows are tracked separately.
- `thoughts/shared/research/singlepagestartup/ISSUE-215.md` documents the
  removal of the public 5432 route and the Traefik TCP entrypoint that the
  dump script's host connection relied on.
- Commit d40ad086a3 added the rotation section of
  `tools/deployer/README.md` and states that `POSTGRES_PASSWORD` applies only
  at the first initialization of the data directory.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-215.md`
- `thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`

## Open Questions

- Whether any existing server has a hand-copied `get_env.sh` and a working
  dump cannot be established from the repository; the operator can check
  `/home/code/db_backups` for non-empty files.
