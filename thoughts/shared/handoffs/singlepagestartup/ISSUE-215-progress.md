---
issue_number: 215
issue_title: "Harden public PostgreSQL, Redis, Portainer, and Traefik configuration"
start_date: 2026-07-26T00:28:06+03:00
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-215.md
status: complete
completed_date: 2026-07-26T00:52:38+03:00
---

# Implementation Progress: ISSUE-215 - Harden public PostgreSQL, Redis, Portainer, and Traefik configuration

**Started**: 2026-07-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-215.md`

## Phase Progress

### Phase 1: Enforce Redis Authentication and Local Parity

- [x] Started: 2026-07-26T00:28:06+03:00
- [x] Completed: 2026-07-26T00:42:02+03:00
- [x] Automated verification: PASSED 2026-07-26T00:38:27+03:00

**Notes**: Added production/local `requirepass`, authenticated health checks, Ansible replica plus negative/positive authentication probes, production empty-password validation, and local `KV_PROVIDER=redis` generation. Shell syntax, Ansible syntax, both Compose validations, isolated Redis health/authentication, the exact focused backend KV scenario (4/4), and `git diff --check` pass. Production rollout exposed two probe defects: Swarm `start-first` could select the retiring task, and an absent `REDIS_PORT` produced an empty positive-probe port. The follow-up waits for update completion, selects the current desired task, and defaults every deployment path to `6379`.

### Phase 2: Remove Public Infrastructure Exposure and Move Portainer Bootstrap to HTTPS

- [x] Started: 2026-07-26T00:42:02+03:00
- [x] Completed: 2026-07-26T00:43:57+03:00
- [x] Automated verification: PASSED 2026-07-26T00:43:57+03:00

**Notes**: Removed the Traefik database publication/entrypoint and PostgreSQL/Redis TCP labels, retained internal overlays, moved all Portainer administrator bootstrap requests to HTTPS before removing port `9000`, and added container-local PostgreSQL readiness. Shell/Ansible syntax, four rendered Compose configs, forbidden-route absence, preserved HTTP/HTTPS/overlay contracts, live local `pg_isready`, and whitespace checks pass. Production checks remain deferred to the operator's server redeploy.

### Phase 3: Add Traefik Log Controls, Operational Documentation, and End-to-End Verification

- [x] Started: 2026-07-26T00:43:57+03:00
- [x] Completed: 2026-07-26T00:49:02+03:00
- [x] Automated verification: PASSED 2026-07-26T00:49:02+03:00

**Notes**: Parameterized Traefik logging with an `INFO` default and temporary `DEBUG` override across local and CI deployment inputs, then documented the hardened network boundary, private administration paths, credential flow, rollout, verification, and rollback procedure. Shell and Ansible syntax, default/override/restored Traefik renders, production and preview CI propagation, rendered Compose validation, supported-file formatting, forbidden-route scans, and `git diff --check` pass. Live-host checks remain deferred until the operator redeploys.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 7 -->

### Incident 1 — Plan linked unrelated issue 199 research

- **Occurrences**: 1
- **Stage**: Implementation preflight
- **Symptom**: The plan's deployment-history reference pointed to `research/ISSUE-199.md`, which covers MCP tool execution rather than Traefik/Swarm deployment history.
- **Root Cause**: The plan carried the correct issue number with the wrong artifact kind.
- **Fix**: Pointed the plan to issue 199's process log and implementation handoff, then read the pinned Traefik/Swarm verification sections.
- **Reusable Pattern**: Verify both the issue number and artifact kind when reusing historical context.

### Incident 2 — Sandbox blocked Ansible and Docker verification

- **Occurrences**: 3
- **Stage**: Phase 1 - automated verification
- **Symptom**: Ansible could not create its local temporary directory and Docker commands could not access the desktop daemon socket.
- **Root Cause**: Both tools require host resources outside the workspace sandbox.
- **Fix**: Reran the same syntax and integration checks with the required scoped host access; Ansible syntax, Compose validation, and Redis authentication checks passed.
- **Reusable Pattern**: When deployer verification fails on `.ansible/tmp` or the Docker socket before exercising code, rerun the same scoped command with host access rather than changing the implementation.

### Incident 3 — Scenario runner could not recover from an occupied Bun watch port

- **Occurrences**: 1
- **Stage**: Phase 1 - API KV scenario
- **Symptom**: With port `4000` already occupied, the scenario runner started Bun watch mode; its child reported `EADDRINUSE`, but the watcher remained alive and prevented the runner from trying its fallback ports.
- **Root Cause**: The runner's fallback logic waits for the watch-process PID to exit, while Bun watch remains alive after its server child fails.
- **Fix**: Stopped the attempt and selected the known-free `SCENARIO_API_PORT=4001` explicitly.
- **Reusable Pattern**: For isolated scenario runs alongside a development API, choose a verified free `SCENARIO_API_PORT` up front.

### Incident 4 — Existing local API environment predates scenario and Redis parity inputs

- **Occurrences**: 1
- **Stage**: Phase 1 - API KV scenario
- **Symptom**: The existing ignored `apps/api/.env` lacked the fixed scenario identity and its `KV_PASSWORD` did not match the current ignored Redis environment.
- **Root Cause**: Persistent local environment files predated the current generators and are intentionally not overwritten by `create_env.sh`.
- **Fix**: Kept user files unchanged and supplied the fixed test identity plus an isolated Redis host, port, and password only to the verification processes.
- **Reusable Pattern**: Do not rewrite persistent ignored environments during verification; inject isolated test values into the process when generator parity, rather than migration of old files, is under test.

### Incident 5 — Issue-level scenario runner included an unrelated frontend failure

- **Occurrences**: 1
- **Stage**: Phase 1 - API KV scenario
- **Symptom**: The issue-152 runner discovered both backend and frontend scenario files; the backend Redis/KV suite passed, while an unrelated frontend cart assertion failed.
- **Root Cause**: The runner executes every scenario under the historical issue directory, but the approved issue-215 criterion targets only `backend-cart.scenario.spec.ts`.
- **Fix**: Ran the plan's exact project-qualified backend target, which passed 4/4.
- **Reusable Pattern**: Use the plan's focused project target when an issue-level scenario directory contains unrelated suites.

### Incident 6 — Redis probe selected the retiring Swarm task

- **Occurrences**: 1
- **Stage**: Production rollout
- **Symptom**: The first authenticated Redis rollout failed the negative probe even though the replacement task enforced authentication after the old task stopped.
- **Root Cause**: `docker ps ... | head -n 1` could select the retiring passwordless container while `update_config.order=start-first` temporarily kept both tasks running.
- **Fix**: Wait for the Redis service update to complete, resolve the desired running task ID, and select the container carrying that exact Swarm task label.
- **Reusable Pattern**: Deployment probes must bind to the orchestrator's current desired task rather than an arbitrary container matching the service name.

### Incident 7 — Positive Redis probe assumed an optional port variable

- **Occurrences**: 1
- **Stage**: Production rollout retry
- **Symptom**: The unauthenticated probe correctly returned `NOAUTH`, but the authenticated probe failed even though a protected read-only diagnostic returned `PONG` on port `6379`.
- **Root Cause**: `REDIS_PORT` was absent from the deployer environment. Redis startup and the negative probe defaulted to `6379`, while the positive probe passed an empty value to `redis-cli -p`.
- **Fix**: Add `REDIS_PORT=6379` to the example environment, resolve it through `get_env_or_default`, render an empty input as the string `"6379"`, and retain a container-side `${REDIS_PORT:-6379}` fallback.
- **Reusable Pattern**: Apply the same default at input, render, runtime, health-check, and verification boundaries for optional deployment values.

## Summary

### Changes Made

- Enforced authenticated Redis startup and health checks in production and local Compose flows while preserving the existing protected credential path into API and MCP.
- Made Redis port `6379` explicit and consistent across deployer input, rendered service environment, runtime commands, and probes; probes now target the current desired Swarm task.
- Removed public PostgreSQL/Redis Traefik routing and direct Portainer publication, retained private overlay connectivity, and moved Portainer bootstrap to its HTTPS route.
- Defaulted Traefik logging to `INFO` with an explicit temporary `DEBUG` override propagated through deployer and CI inputs.
- Added bounded Ansible convergence/authentication probes and documented firewall ownership, private administration, coordinated rollout, rollback risks, and post-deploy verification.

### Pull Request

- [x] PR created: https://github.com/singlepagestartup/singlepagestartup/pull/217
- [x] PR number: 217

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [x] Issue submitted to Code Review

---

**Last updated**: 2026-07-26T02:05:16+03:00
