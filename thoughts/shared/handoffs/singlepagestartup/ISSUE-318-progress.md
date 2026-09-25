---
issue_number: 318
issue_title: "Create a least-privilege database role and restrict backup permissions"
start_date: 2026-09-25T21:50:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-318.md
status: in_progress
---

# Implementation Progress: ISSUE-318 - Create a least-privilege database role and restrict backup permissions

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-318.md`

## Phase Progress

### Phase 1: Application role at first initialization (local)

- [x] Started: 2026-09-25T21:52:00Z
- [x] Completed: 2026-09-25T22:05:00Z
- [x] Automated verification: PASSED

**Notes**:

- `apps/db/create_application_role.sh` (mode `0755`), mounted read-only by
  `apps/db/docker-compose.postgres.yaml`; `apps/db/create_env.sh` writes
  `POSTGRES_USER=postgres` and `DATABASE_USERNAME`/`DATABASE_PASSWORD`;
  `apps/api/create_env.sh` reads the application pair and falls back to the
  superuser pair for an older `apps/db/.env`.
- `sh -n apps/db/create_application_role.sh`, `bash -n` on both
  `create_env.sh`: pass.
- `bun test tools/dev/create-env.test.ts`: 4 pass, 0 fail.
- Mutation: `apps/api/create_env.sh` reading `POSTGRES_USER`/`POSTGRES_PASSWORD`
  again made 2 of 4 fail (the regression scenario and the legacy-message
  scenario); restored, 4 pass.

### Phase 2: Deployer PostgreSQL stack

- [x] Started: 2026-09-25T22:06:00Z
- [x] Completed: 2026-09-25T22:20:00Z
- [x] Automated verification: PASSED

**Notes**:

- `ansible-playbook --syntax-check -i localhost,` on
  `postgres/create_postgres.yaml`, `postgres/delete_postgres.yaml`,
  `server/set_cron_jobs.yaml`, `server/install_psql.yaml`: exit 0 each (run with
  stdin from `/dev/null`; Ansible rejects the non-blocking handles otherwise).
- Template rendered with `ansible localhost -c local -m ansible.builtin.template`;
  `docker compose config` accepts it and a password containing spaces, `#` and
  double quotes survives `to_json` unchanged.
- `postgres.sh` branches with `ansible-playbook` and the inventory stubbed: no
  `POSTGRES_USER` warns and deploys with the `DATABASE_*` pair as superuser (exit
  0); `POSTGRES_USER` without password exits 1; `POSTGRES_USER` equal to
  `DATABASE_USERNAME` exits 1; separate roles deploy (exit 0).
- `bash -n` on `postgres.sh`, `server.sh`, `github_deployer.sh`,
  `server/create_db_dump.sh`: pass. `.github/workflows/ansible.yml` parses with
  the `yaml` package and carries `POSTGRES_USER`/`POSTGRES_PASSWORD` in both
  secret blocks.

### Phase 3: Nightly dump

- [x] Started: 2026-09-25T22:10:00Z
- [x] Completed: 2026-09-25T22:25:00Z
- [x] Automated verification: PASSED

**Notes**:

- `bun test tools/dev/create-db-dump.test.ts`: 9 pass, 0 fail.
- Mutations, each restored afterwards: removing the tightening of existing dumps
  failed "tightens dumps left by the previous script"; removing
  `chmod 700` on the directory failed "writes the dump with mode 0600 into a
  0700 directory"; pruning before the success check failed "keeps every earlier
  dump and leaves no partial file when pg_dump fails". Restored: 9 pass.
- Cron job line rendered through Ansible: retention empty or absent gives
  `DATABASE_BACKUP_RETENTION_DAYS=14`, `30` gives `30`.
- `npm run database:test`: 13 pass. `npm run secrets:test`: 9 pass (the
  `$RANDOM` scan over every `create_env.sh` still passes).
- `npx eslint` on the three `tools/dev` tests: clean. `npx tsc` in strict mode
  with `@types/bun` on the two new tests: clean.
  `node tools/agents/code-placement.mjs`: no same-name file and folder pairs.
- Unit lanes of the touched Nx projects: `npx nx run api:jest:test` 2 suites,
  4 tests; `npx nx run @sps/knowledge:jest:test` 12 suites, 62 tests (both
  unaffected: a shell script and a README changed there).

### Phase 4: Documentation

- [x] Started: 2026-09-25T22:26:00Z
- [x] Completed: 2026-09-25T22:35:00Z
- [x] Automated verification: PASSED

**Notes**:

- `tools/deployer/README.md`: "PostgreSQL roles", "Nightly database dumps",
  `POSTGRES_PASSWORD` in the generated secrets list, the database rows of the
  rotation table, "Moving an existing installation to the application role",
  and the data-service paragraph. `libs/modules/knowledge/README.md`: extension
  statement and troubleshooting line.
- `npx prettier --check` on every changed Markdown and TypeScript file: clean
  after one `--write` (table realignment and one wrapped call).

### Phase 5: End-to-end verification

- [x] Started: 2026-09-25T22:27:00Z
- [x] Completed: 2026-09-25T23:15:00Z
- [x] Automated verification: PASSED

**Notes**: every run used throwaway containers on `127.0.0.1` ports 5434,
55318-55321 and 59991, a throwaway Redis, and `API_SERVICE_URL`,
`HOST_SERVICE_URL`, `LLM_SERVICE_URL` pointed at a closed port. The worktree's
`apps/api/.env` was swapped by a wrapper that refuses port 5433 and restores
the file on exit; its fingerprint matched afterwards. Nothing connected to
`localhost:5433`.

1. Fresh local bootstrap in a scratch copy of the layout (origin
   `issue318-verify`): both `create_env.sh` scripts wrote a `0600` env pair with
   `POSTGRES_USER=postgres`, `DATABASE_USERNAME=issue318-verify`, equal
   application passwords in both files and a different superuser password.
   `docker compose up -d db` built `apps/db/Dockerfile`; the log shows the
   entrypoint running `create_application_role.sh` (`CREATE EXTENSION`,
   `CREATE ROLE`, `ALTER ROLE`, `ALTER DATABASE`). Over TCP the role reported
   `rolsuper`, `rolcreatedb`, `rolcreaterole`, `rolreplication`, `rolbypassrls`
   all `f`, owns the database, and created and dropped a table with a `vector`
   column; `CREATE EXTENSION IF NOT EXISTS vector` was a NOTICE no-op.
2. `./migrate.sh` as that role: exit 0, 206 targets succeeded, no privilege
   error. 388 `public` and 465 `drizzle` relations owned by the role, `public`
   owned by `pg_database_owner`, `drizzle` by the role, HNSW index present.
   `npx nx run api:db:seed`: exit 0, 475 permissions and 25 pages; the only
   errors were the two cache/revalidation calls to the closed port.
3. API as that role on port 4318 (`npm run api:dev`, HTTP cache off):
   `GET /api/host/pages` 200, `GET /api/rbac/subjects/authentication/init` 201
   and `sps_rc_subject` went from 0 to 1 row; no `42501` in the log.
4. Existing installation: a volume initialized with `POSTGRES_USER=legacy_owner`
   (OID 10, superuser) and no script, then `./migrate.sh seed` as that superuser
   (exit 0, 207 targets, 853 relations and the extension owned by it). The
   container was recreated on the same volume with the script mounted and
   `DATABASE_USERNAME=sps_app`; the entrypoint did not run the script on the
   initialized data. The README step-3 command ran it: `CREATE ROLE`,
   `ALTER ROLE`, `ALTER DATABASE`, `ALTER SCHEMA`, 310 `ALTER TABLE`. Afterwards
   all 853 relations and `drizzle` belong to `sps_app` (not a superuser).
   `./migrate.sh seed` as `sps_app`: exit 0, 207 targets, no privilege error.
   The README step-5 query listed `sps_app | f` for the application connection.
5. `tools/deployer/server/create_db_dump.sh` with the real `docker` against that
   container (Swarm label set) and a scratch directory created `0755` with a
   dump dated 2000 and a recent `0644` dump: exit 0, a 713 KB dump at `0600`,
   directory `0700`, the 2000 dump deleted, the recent one kept at `0600`. The
   dump holds 155 `COPY public.*` blocks including `sps_rc_identity`, and
   `CREATE EXTENSION IF NOT EXISTS vector`.
6. Deployer-shaped fresh stack (stock `pgvector/pgvector:pg17`, the rendered
   environment, script mounted): first init created the role;
   `sps_app | f`, extension present, table create and drop allowed. The README
   restore command loaded the dump with 0 `ERROR` lines, 475 permissions, all
   310 tables owned by `sps_app`.
7. First-init edge cases: without `DATABASE_USERNAME`, and with it equal to
   `POSTGRES_USER`, init completes with the extension and the warning, and only
   the superuser can log in; with `DATABASE_USERNAME` but no
   `DATABASE_PASSWORD`, init stops and the container exits 1 with the message.
8. Both `docker-compose.yaml` files resolve the read-only mount to
   `apps/db/create_application_role.sh`.
9. Cleanup: no container, volume, network or image named `issue318` remains;
   scratch env files and passwords deleted.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 4 -->

### Incident 1 — Exported DATABASE\_\* do not reach Nx migration targets

- **Occurrences**: 1
- **Stage**: Research
- **Symptom**: planning to run migrations against a throwaway database by
  exporting `DATABASE_*` would have connected to the shared database instead.
- **Root Cause**: Nx 22 `run-commands` unloads and reloads the `envFile` keys
  after copying the process environment
  (`node_modules/nx/src/executors/run-commands/running-tasks.js:393-433`), so
  `apps/api/.env` wins.
- **Fix**: a scratch wrapper that swaps `apps/api/.env`, refuses port 5433 and
  restores the file on exit.
- **Reusable Pattern**: never point migration targets at another database with
  exported variables; swap the env file and check the port first.

### Incident 2 — `npx nx run api:db:migrate` stops at the RBAC repair step

- **Occurrences**: 1
- **Stage**: Phase 5
- **Symptom**: the target ran every module up to Knowledge, then failed with
  `NX ENOENT: no such file or directory, open 'apps/api/.env'` right after
  `repository-natural-key-repair-apply` reported success.
- **Root Cause**: pre-existing. `api:db:migrate` runs its commands with
  `cwd: apps/api`, and the RBAC repair targets have no `cwd` and a relative
  `envFile: apps/api/.env`, which Nx resolves against `apps/api`. The read-only
  `repository-natural-key-repair-check` reproduces it from `apps/api` and passes
  from the root. Neither file is touched by this issue.
- **Fix**: verification used the root `./migrate.sh`, the path the API container
  runs. Reported to the lead as a separate defect: the last step of `./up.sh`
  leaves blog, startup, social, rbac, host, agent, telegram and analytic
  unmigrated.
- **Reusable Pattern**: prefer `./migrate.sh` from the root when verifying
  migrations.

### Incident 3 — Bind-mounted PGDATA refused with "wrong ownership"

- **Occurrences**: 1
- **Stage**: Phase 5
- **Symptom**: `docker run -v <scratch dir>:/var/lib/postgresql/data` exited
  with `data directory ... has wrong ownership`, although the compose-created
  bind mount in the same scratch tree worked.
- **Root Cause**: Docker Desktop ownership mapping for that bind mount.
- **Fix**: a named volume, recreated containers on the same volume to simulate a
  redeploy.
- **Reusable Pattern**: use named volumes for throwaway PostgreSQL data with
  `docker run` on macOS.

### Incident 4 — zsh does not word-split variables in verification loops

- **Occurrences**: 1
- **Stage**: Phase 2
- **Symptom**: a loop over `.env` variants reported
  "POSTGRES_PASSWORD must be set" for a variant that set it.
- **Root Cause**: the Bash tool runs zsh, where `$cfg` stays one word, so both
  keys landed on one `.env` line.
- **Fix**: `${=cfg}`; the direct run of the same variant exited 0.
- **Reusable Pattern**: in this environment, split explicitly or quote list
  elements separately.

## Summary

### Changes Made

- `apps/db/create_application_role.sh` (new): extension, application role,
  database and object ownership; idempotent; used at first init and by
  `docker exec`.
- `apps/db/docker-compose.postgres.yaml`, `apps/db/create_env.sh`,
  `apps/db/.env.example`, `apps/api/create_env.sh`: local split of superuser and
  application role.
- `tools/deployer/postgres/*`, `tools/deployer/postgres.sh`,
  `tools/deployer/.env.example`, `tools/deployer/github_deployer.sh`,
  `.github/workflows/ansible.yml`: deployer split, script delivery, stop-first,
  legacy fallback with warning.
- `tools/deployer/server/create_db_dump.sh`, `server/set_cron_jobs.yaml`,
  `server.sh`: dump inside the container, `0700`/`0600`, success-only
  replacement, retention.
- `tools/dev/create-env.test.ts`, `tools/dev/create-db-dump.test.ts` (new),
  `package.json` (`database:test`).
- `tools/deployer/README.md`, `libs/modules/knowledge/README.md`.

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-25T23:20:00Z
