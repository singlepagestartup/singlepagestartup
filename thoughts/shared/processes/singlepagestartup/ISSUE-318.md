---
issue_number: 318
issue_title: "Create a least-privilege database role and restrict backup permissions"
repository: singlepagestartup
created_at: 2026-09-25T00:00:00Z
last_updated: 2026-09-25T23:30:00Z
status: active
current_phase: implement
---

# Process Log: ISSUE-318 - Create a least-privilege database role and restrict backup permissions

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: implement
- Next step: commit, push, open the pull request and answer the lead's review

## Phase Notes

### Create

- Summary: raised by the 2026-09-25 security review (`thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`), findings N-10. The issue is under embargo: neutral public title, detail only in the local ticket.
- Incidents: none.

### Research

- Summary: every environment has one PostgreSQL role, the image's bootstrap superuser, and the API, its migrations, seed and repair jobs all connect with it. The nightly dump cannot run as written (missing `get_env.sh` on the server, no host listener on 5432 since issue 215, host `pg_dump` older than server 17). A throwaway container showed that `REASSIGN OWNED BY` the bootstrap superuser is refused, per-object `ALTER ... OWNER TO` works, and a non-superuser that owns the database runs the migrations' DDL.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-318.md`
- Notes: the deployer runs the stock `pgvector/pgvector:pg17` image, not `apps/db/Dockerfile`, so the init script is copied and mounted the way `apps/llm/ollama-init.sh` is. Nx 22 lets `envFile` values override exported variables, so migration tests against a throwaway database must swap `apps/api/.env`, not export `DATABASE_*`.

### Plan

- Summary: one idempotent script, `apps/db/create_application_role.sh`, creates the extension and the application role at first initialization (mounted by the dev compose and the deployer stack) and moves an existing database when run with `docker exec`. Separate superuser and application credentials in the local bootstrap and the deployer, with a warned fallback for configurations that predate the split. The dump runs `pg_dump` inside the container into a root-only directory with success-only replacement and pruning by age.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-318.md`
- Notes: plan approval is delegated to the issue agent for this wave. Deviations from the ticket and the lead's notes: the existing-server procedure uses the script instead of `REASSIGN OWNED`, which PostgreSQL refuses for the bootstrap superuser; the dump script is rewritten to run inside the container because it cannot run as written; the PostgreSQL service drops `start-first` because the new mount triggers a service update.

### Implement

- Summary: the role script, local and deployer wiring, the dump rewrite, two `bun:test` suites and the README sections are in place. Throwaway runs proved a fresh bootstrap (local compose and the deployer's stock image), migrations and seed as the application role, the API serving reads and writes as that role, the documented move of a single-superuser database with the real SPS schema, the real dump script, and the README restore command.
- Outputs: `thoughts/shared/handoffs/singlepagestartup/ISSUE-318-progress.md` (commands and results), the files listed there.
- Notes: `npx nx run api:db:migrate`, the last step of `./up.sh`, stops after the RBAC repair step on `main` (Incident 2); verification used the root `./migrate.sh`, which the API container runs.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 4 -->

### Incident 1 — Exported DATABASE\_\* do not reach Nx migration targets

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: exporting `DATABASE_*` to aim migrations at a throwaway database would have reached the shared database.
- **Root Cause**: Nx 22 `run-commands` reloads `envFile` keys over the process environment.
- **Fix**: swap `apps/api/.env` through a wrapper that refuses port 5433 and restores the file on exit.
- **Preventive Action**: check the port in the swapped file before any migration run.
- **References**: `node_modules/nx/src/executors/run-commands/running-tasks.js:393-433`

### Incident 2 — `api:db:migrate` stops at the RBAC repair step

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `NX ENOENT ... open 'apps/api/.env'` after `repository-natural-key-repair-apply` succeeded; later modules stay unmigrated.
- **Root Cause**: pre-existing; `api:db:migrate` runs from `cwd: apps/api`, and the repair targets resolve their relative `envFile` against it. Reproduced with the read-only check target from `apps/api`; passes from the root.
- **Fix**: verified with the root `./migrate.sh`; reported to the lead as a separate defect.
- **Preventive Action**: use `./migrate.sh` from the root when verifying migrations.
- **References**: `apps/api/project.json` (`db:migrate`), `libs/modules/rbac/project.json` (`repository-natural-key-repair-*`), `up.sh:10`

### Incident 3 — Bind-mounted PGDATA refused with "wrong ownership"

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `docker run -v <scratch dir>:/var/lib/postgresql/data` exited during init.
- **Root Cause**: Docker Desktop ownership mapping for that bind mount.
- **Fix**: a named volume.
- **Preventive Action**: use named volumes for throwaway PostgreSQL data with `docker run` on macOS.
- **References**: progress file, Phase 5

### Incident 4 — zsh does not word-split variables in verification loops

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: a loop reported a missing `POSTGRES_PASSWORD` for a variant that set it.
- **Root Cause**: the Bash tool runs zsh; `$cfg` stays one word.
- **Fix**: `${=cfg}`.
- **Preventive Action**: split explicitly in loops that build files from lists.
- **References**: progress file, Phase 2

## Reusable Learnings

- PostgreSQL refuses `REASSIGN OWNED BY` for the image's `POSTGRES_USER` (the bootstrap superuser, OID 10); move ownership per object instead.
- Deployer scripts owned by an app live at the app root and are copied by the playbook from `../../../apps/<app>/` and mounted read-only, as `apps/llm/ollama-init.sh` and `apps/db/create_application_role.sh` are.
