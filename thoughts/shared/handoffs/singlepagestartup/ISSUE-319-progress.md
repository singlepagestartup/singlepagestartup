---
issue_number: 319
issue_title: "Harden the deployer edge and server configuration"
start_date: 2026-09-25T21:30:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-319.md
status: in_progress
---

# Implementation Progress: ISSUE-319 - Harden the deployer edge and server configuration

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-319.md`

## Phase Progress

### Phase 1: Cron secret in the API

- [x] Started: 2026-09-26
- [x] Completed: 2026-09-26
- [x] Automated verification: PASSED (unit lanes, lint, tsc, mutation checks)

**Notes**: guard `RequestCanRunCron` in the new agent-model middleware package; `secretMatches` extracted in `rbac-secret`; anchored `POST /api/agent/agents/cron$` allow rule. HTTP proof recorded below.

### Phase 2: Deployer transport and crontab

- [x] Started: 2026-09-26
- [x] Completed: 2026-09-26
- [x] Automated verification: PASSED (syntax-check, render, `bash -n`, api.sh refusal)

**Notes**: the check in `api.sh` mirrors `redis.sh`; the cron task runs with `no_log`.

### Phase 3: Traefik access log and security headers

- [x] Started: 2026-09-26
- [x] Completed: 2026-09-26
- [x] Automated verification: PASSED (render, YAML parse, label checks, `docker compose config`)

**Notes**: the headers middleware is defined per service beside its router (traefik/traefik#9363, Traefik restarts on every deployment).

### Phase 4: Ansible host key checking

- [x] Started: 2026-09-26
- [x] Completed: 2026-09-26
- [x] Automated verification: PASSED (generated inventories, throwaway sshd run, sshpass run)

**Notes**: the previous settings accepted a changed host key end to end; the new ones refuse it.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 5 -->

### Incident 1 — zsh modifier swallowed the Nx target name

- **Occurrences**: 1
- **Stage**: Phase 1 - Cron secret in the API
- **Symptom**: `npx nx run $p:eslint:lint` in a loop failed with `Cannot find project 'slint'` for every project.
- **Root Cause**: the Bash tool runs zsh, where `$p:e` is the "extension" history modifier, so `$p:eslint` expanded to `slint`.
- **Fix**: delimit the variable: `"${p}:eslint:lint"`.
- **Reusable Pattern**: in zsh, always brace a variable that is followed by a colon (`${var}:target`).

### Incident 2 — jest passed a spec that tsc rejects

- **Occurrences**: 1
- **Stage**: Phase 1 - Cron secret in the API
- **Symptom**: `tsc --noEmit -p libs/modules/agent/tsconfig.json` reported TS2339 on `.then` in the new spec while jest passed it.
- **Root Cause**: `Hono#request` returns `Response | Promise<Response>`; the jest preset runs ts-jest with `diagnostics: false`, so type errors never fail a test run.
- **Fix**: the spec helper is `async` and awaits `hono.request(...)`.
- **Reusable Pattern**: type-check spec files with `tsc --noEmit`; a green jest run says nothing about types here.

### Incident 3 — fixture check read the wrong database

- **Occurrences**: 1
- **Stage**: Phase 1 - HTTP proof
- **Symptom**: the fixture `POST /api/broadcast/channels` answered 409 although the checked table was empty.
- **Root Cause**: the read-only check used `apps/db/.env` (`POSTGRES_DB`), but the API connects to `DATABASE_NAME` from `apps/api/.env`, a different database on the same server. That database holds a `cron` channel and four scheduled agents, so a valid call to the cron route would run real maintenance jobs on data other agents share. The 409 wrote nothing.
- **Fix**: stopped the API; ran the proof against a throwaway database created, migrated and dropped for this issue, with gates that confirm the API uses it before any valid call.
- **Reusable Pattern**: inspect the database named by `apps/api/.env` `DATABASE_NAME`, never `apps/db/.env`, before calling a route that writes; the cron route runs every due agent.

### Incident 4 — Nx envFile overrides the process environment

- **Occurrences**: 1
- **Stage**: Phase 1 - HTTP proof
- **Symptom**: an environment override such as `DATABASE_NAME=...` would not reach `nx run ...:repository-migrate` or other targets with `envFile: apps/api/.env`.
- **Root Cause**: Nx `loadEnvVarsFile` unloads every key of the env file from the task environment and loads the file again, so the file wins.
- **Fix**: resolved the 156 steps of `api:db:migrate` from the Nx targets and ran each script with `bun --no-env-file --env-file=<proof env>`; booted the API the same way.
- **Reusable Pattern**: to point a local API or migration at another database, bypass Nx and give Bun one explicit env file; confirm the effect with an observable read before writing.

### Incident 5 — Ansible control socket path too long in the scratchpad

- **Occurrences**: 1
- **Stage**: Phase 4 - Ansible host key checking
- **Symptom**: `ControlPath too long (... >= 104 bytes)` made the throwaway-sshd pings unreachable.
- **Root Cause**: the scratchpad path plus Ansible's control socket name exceeds the macOS Unix socket limit.
- **Fix**: `ANSIBLE_SSH_ARGS=-C` for the harness, so Ansible adds no ControlPath; host key handling is unaffected.
- **Reusable Pattern**: when testing Ansible from a long temporary path, disable SSH multiplexing rather than moving files out of the scratchpad.

## Verification Log

- Baseline before any change: `npx tsc --noEmit -p <tsconfig>` for `libs/modules/agent`, `libs/middlewares`, `libs/shared/backend/utils` and `libs/shared/utils`: 0 errors each.
- `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/agent:jest:test`: 18 suites, 95 tests passed (new suite `request-can-run-cron`: 7 tests).
- `npx nx run @sps/backend-utils:jest:test`: 6 suites, 129 tests passed (3 new `secretMatches` cases).
- `npx nx run @sps/middlewares:jest:test`: 10 suites, 65 tests passed (1 new allow-list case).
- Mutation checks, each restored byte-identical (shasum): guard replaced by `return next()` fails 5 of 7 guard tests; `===` instead of `secretMatches` fails 2 (unset and empty cron secret); allow rule removed fails the allow-list case; `secretMatches` returning true for an unset secret fails 3 primitive tests and 2 guard tests.
- `NODE_OPTIONS=--max-old-space-size=12288 npx nx run <p>:eslint:lint` for `@sps/agent`, `@sps/backend-utils`, `@sps/shared-utils`: pass; `npx eslint` on the two changed `libs/middlewares` files: pass (the project has no lint target).
- `npx tsc --noEmit -p` for the four projects after the change: 0 errors each.
- `ansible-playbook --syntax-check` with a throwaway inventory: `api/set_cron_jobs.yaml`, `api/create_api.yaml`, `traefik/create_traefik.yaml`, `host/create_host.yaml`, `mcp/create_mcp.yaml`, `telegram/create_telegram.yaml`: pass.
- Rendered with Ansible's PyYAML and Jinja2 (strict undefined): the cron job is one line, sends `X-AGENT-CRON-SECRET`, has no `-k` and no `X-RBAC-SECRET-KEY`, and the task has `no_log: true`; `api.env.j2` writes `AGENT_CRON_SECRET` only when the value is set (27 lines with it, 26 without, no malformed line).
- `bash -n` on `api.sh`, `github_deployer.sh`, `create_inventory.sh`, `apps/api/create_env.sh`: pass; `.github/workflows/ansible.yml` parses.
- `api.sh up` on a scratch copy with an empty `AGENT_CRON_SECRET`: exit 1, `Error: AGENT_CRON_SECRET must be set before API deployment`, before any DNS or Ansible step.
- Traefik and the api, host, mcp, telegram compose templates rendered, parsed and passed `docker compose -f <rendered> config -q`; Traefik has the three access-log flags and json-file rotation 10m x 3; each router references a middleware defined in its own labels with `stsseconds=31536000`, `contenttypenosniff=true`, `referrerpolicy=strict-origin-when-cross-origin`; no CSP, frame, includeSubDomains or preload option.
- `create_inventory.sh` with throwaway key and password envs writes `ansible_ssh_common_args: '-o StrictHostKeyChecking=accept-new'` in both.
- Throwaway `sshd` on 127.0.0.1:22220 (host keys A then B), `ansible -m ping -vvvv`: new settings record key A on first connect and succeed twice; with key B they fail with `REMOTE HOST IDENTIFICATION HAS CHANGED`. The previous settings (`host_key_checking = False`, `UserKnownHostsFile=/dev/null`) succeed against key B, and their SSH command line carries `StrictHostKeyChecking=no` and `UserKnownHostsFile=/dev/null` ahead of the inventory options.
- `sshpass` against the same server: with the SSH default `ask` an unknown host fails with `Host key verification failed` before authentication; with `accept-new` the key is recorded and the connection reaches authentication; a changed key is refused.
- HTTP proof, API from this worktree on port 4319 (`bun --no-env-file --env-file=<proof env> run server.ts` in `apps/api`), throwaway `RBAC_SECRET_KEY` and `AGENT_CRON_SECRET`, throwaway database `sps_issue_319_proof` created on the shared server, migrated with the 156 steps of `api:db:migrate` (153 tables) and dropped afterwards. Gates: `GET /api/broadcast/channels` 200 with 0 channels, operator `GET /api/agent/agents` 200 with 0 agents, operator `POST /api/agent/agents/dummy` 200. Fixture `cron` channel created (201) and deleted (200). `POST /api/agent/agents/cron`: no credential 401; wrong cron secret 401; cron secret 200 (`data`, length 0); operator header 200; operator cookie 200; cron secret in `X-RBAC-SECRET-KEY` 401. The cron secret on `POST /api/agent/agents/dummy` 403 and on `GET /api/agent/agents/cron` 403. Afterwards port 4319 was free, the proof database was gone, and the shared API database still held 3 channels and 4 agents.

## Summary

### Changes Made

- `39a1b6b0ce` fix(agent): the cron route admits the operator secret or `AGENT_CRON_SECRET` through `RequestCanRunCron`, opened by one anchored allow rule; `secretMatches` in `rbac-secret`; the deployer carries the value into the API environment and the crontab, which sends `X-AGENT-CRON-SECRET` without `-k`; `api.sh` refuses to deploy without it; GitHub secret sync and both CI env lists; local generation; OpenAPI and README documentation.
- `5fdbc85ef1` feat(deployer): Traefik JSON access log with header values dropped and json-file rotation; per-service headers middleware (HSTS one year, `nosniff`, `strict-origin-when-cross-origin`) on the api, host, mcp and telegram routers.
- `483dcfed65` fix(deployer): `host_key_checking = True` and `StrictHostKeyChecking=accept-new` without the `/dev/null` known-hosts file in the generated inventory and both examples; README on rebuilt servers and CI runners.
- The ticket file stays uncommitted: it describes items outside the agreed scope that this change does not address.

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-25T23:10:00Z
