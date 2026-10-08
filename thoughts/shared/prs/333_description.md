Closes #318.

## Summary

The API, the migrations and seed it runs at start, and the RBAC repair connected to PostgreSQL as the superuser the `pgvector/pgvector:pg17` image creates, locally and on servers. SQL the API could be made to run could start programs through `COPY ... PROGRAM`, read server files and create roles. The nightly dump wrote world-readable files into a world-readable directory, never pruned them, and could not reach the database at all: it sourced a helper that no play copies to the server, connected to a host port that has no listener since issue 215, and used a host `pg_dump` older than server 17.

Fresh bootstraps and deployments now create a login role without superuser, database or role creation rights that owns the application database, and the API connects with it. The image superuser remains for initialization and administration inside the container. The dump runs inside the PostgreSQL container, is readable by root only, and is pruned by age after each successful run. Existing installations keep working unchanged until the operator follows the documented move.

## Changes

- `apps/db/create_application_role.sh` (new, executable) — runs as `POSTGRES_USER` against `POSTGRES_DB`: creates the untrusted `vector` extension, creates `DATABASE_USERNAME` with `LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS` and `DATABASE_PASSWORD`, makes it the owner of the database and of every schema, table, sequence, view, type and routine the superuser owns there. Names and the password travel as psql variables, never as SQL text. Idempotent; without a separate role it creates only the extension and warns. The image runs it once from `/docker-entrypoint-initdb.d`; an initialized database is moved by running it with `docker exec`.
- Local bootstrap — `apps/db/docker-compose.postgres.yaml` mounts the script read-only (both compose entry points extend this service). `apps/db/create_env.sh` writes `POSTGRES_USER=postgres` with its own password and `DATABASE_USERNAME` (the repository name the API used before) with a separate generated password. `apps/api/create_env.sh` reads the application pair and falls back to the superuser pair, with a message, for an `apps/db/.env` that predates the role.
- Deployer PostgreSQL stack — `postgres/create_postgres.yaml` copies the script to `/home/code/` (the `apps/llm/ollama-init.sh` pattern) and `delete_postgres.yaml` removes it; the template mounts it, takes the superuser from new `POSTGRES_USER`/`POSTGRES_PASSWORD` values, passes `DATABASE_USERNAME`/`DATABASE_PASSWORD` for the script, renders values with `to_json`, and drops `start-first` so an update never runs two postmasters on one data directory (as Redis already does). `postgres.sh` warns and falls back to the `DATABASE_*` pair when `POSTGRES_USER` is unset, and refuses a `POSTGRES_USER` without password or equal to `DATABASE_USERNAME`. `.env.example`, `github_deployer.sh` and `.github/workflows/ansible.yml` carry the two new values, production and `PREVIEW_`.
- Nightly dump — `server/create_db_dump.sh` finds the `postgres_postgres` container, runs `pg_dump` inside it over the local socket, writes to a `mktemp` file in a `0700` directory, moves it into place only after success, tightens every `*.dump` to `0600`, then deletes dumps older than `DATABASE_BACKUP_RETENTION_DAYS` (default `14`, `0` keeps all). `server/set_cron_jobs.yaml` creates `/home/code/db_backups` as `0700`, passes the retention and logs to `/home/code/create_db_dump.log`; `server.sh` reads the retention with a default. The dump still contains every table.
- Tests — `tools/dev/create-env.test.ts` (credential wiring, legacy fallback) and `tools/dev/create-db-dump.test.ts` (modes, success-only replacement, pruning, failure paths), both `bun:test`, exposed as `npm run database:test`.
- Docs — `tools/deployer/README.md`: "PostgreSQL roles", "Nightly database dumps" with a restore command, `POSTGRES_PASSWORD` among generated secrets, split rotation rows, "Moving an existing installation to the application role" (server and developer checkout), and the data-service paragraph. `libs/modules/knowledge/README.md`: where the extension comes from and a troubleshooting line.

No API code, schema, route or dependency changes. MCP and Telegram have no database access and are untouched.

## Verification

- [x] `npm run database:test` — 13 pass (4 credential scenarios, 9 dump scenarios); `npm run secrets:test` — 9 pass.
- [x] Mutation checks: the API script reading the superuser pair again fails the regression scenario; removing the dump tightening, the directory `chmod 700`, or pruning before the success check each fails its scenario.
- [x] `npx nx run api:jest:test` (4 tests) and `npx nx run @sps/knowledge:jest:test` (62 tests); ESLint and strict `tsc` on the new tests; `node tools/agents/code-placement.mjs`; `bash -n`/`sh -n` on every changed script; `ansible-playbook --syntax-check` on the changed plays; the stack template rendered through Ansible and accepted by `docker compose config`.
- [x] Throwaway containers only (never the shared database): a fresh bootstrap through the real compose files runs the script at init; the role reports `rolsuper f` and the other attributes `f`; `./migrate.sh` (206 targets) and `api:db:seed` succeed as the role; 853 relations belong to it; the API as that role answers `GET /api/host/pages` 200 and session init 201 with a new row.
- [x] Existing installation: a volume initialized with a single superuser, migrated and seeded as it, recreated with the new environment and mount, moved with the README step-3 command (310 `ALTER TABLE` plus schema, role and database), then `./migrate.sh seed` as the new role succeeds and the README step-5 query shows `sps_app | f`.
- [x] The real dump script with the real `docker`: a 713 KB `0600` dump in a `0700` directory, an old dump pruned, a recent `0644` one tightened; the README restore command loads it into a fresh deployer-shaped stack with 0 errors.
- [x] First-init edge cases: no application role and the same name as the superuser both initialize with the extension and a warning; a role without a password stops the init with exit 1.

## Notes

- `REASSIGN OWNED BY` is refused for the image's bootstrap superuser (OID 10), which is why the move changes owners per object.
- Deploying the new template restarts PostgreSQL once (new mount, stop-first).
- Files in `/home/code/db_backups` written by the previous script are usually empty.
- Pre-existing and out of scope: `npx nx run api:db:migrate`, the last step of `./up.sh`, stops after the RBAC natural-key repair because that target resolves its relative `envFile` from `apps/api` (reproduced with the read-only check target; the root `./migrate.sh`, which the API container runs, is unaffected).
- The branch carries the ticket, research, plan, process and progress records under `thoughts/shared/`.

## Downstream migration

Adaptation is required. Fresh bootstraps and deployments get the separate role and private dumps automatically; a data directory initialized earlier keeps the superuser until it is moved by hand.

**Applies to:** every deployment and developer checkout initialized before this change; projects with their own copies of `apps/db/create_env.sh`, `apps/api/create_env.sh`, the deployer PostgreSQL stack or the server cron play; projects whose migrations create extensions or other objects that require a superuser.

**New variables:**

| Variable                         | Where                                  | Default                                   | Meaning                                       |
| -------------------------------- | -------------------------------------- | ----------------------------------------- | --------------------------------------------- |
| `POSTGRES_USER`                  | `tools/deployer/.env`, GitHub secrets  | falls back to `DATABASE_USERNAME` (warns) | Superuser the image creates                   |
| `POSTGRES_PASSWORD`              | `tools/deployer/.env`, GitHub secrets  | required when `POSTGRES_USER` is set      | Its password                                  |
| `DATABASE_USERNAME`, `DATABASE_PASSWORD` | `apps/db/.env` (generated)     | —                                         | Application role the init script creates      |
| `DATABASE_BACKUP_RETENTION_DAYS` | `tools/deployer/.env`                  | `14`                                      | Dump age in days before deletion; `0` keeps all |

**Actions:**

- In project-owned copies of the bootstrap scripts and deployer templates, give the superuser and the application role separate names and passwords and mount `apps/db/create_application_role.sh` into `/docker-entrypoint-initdb.d`.
- On each server, move the current `DATABASE_USERNAME`/`DATABASE_PASSWORD` to `POSTGRES_USER`/`POSTGRES_PASSWORD`, set a new role name and generated password as `DATABASE_USERNAME`/`DATABASE_PASSWORD` (deployer `.env` and both GitHub secret sets), run `./postgres.sh up`, run the script inside the postgres container, then `./api.sh up` — "Moving an existing installation to the application role" in `tools/deployer/README.md`.
- Run `./server.sh up` to install the dump script, the `0700` directory and the cron entry.
- On a developer checkout, either recreate the data directory with `./up.sh` after moving the env files aside, or follow the developer paragraph of the move section.
- Create any extension or object that requires a superuser in the init script, not in a migration.

**Verify:** the README query in the postgres container lists the API connections under the application role with `rolsuper` false; `./migrate.sh seed` succeeds after the API redeploy; the next nightly run leaves a non-empty `0600` dump in the `0700` `/home/code/db_backups` and no error in `/home/code/create_db_dump.log`.
