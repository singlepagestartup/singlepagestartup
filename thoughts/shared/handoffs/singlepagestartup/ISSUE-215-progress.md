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

**Notes**: Added production/local `requirepass`, production empty-password validation, `REDIS_PORT=6379` defaulting, and local `KV_PROVIDER=redis` generation. Shell syntax, Ansible syntax, both Compose validations, isolated Redis authentication, the exact focused backend KV scenario (4/4), and `git diff --check` pass. Production rollout showed that the added Ansible wait/task/probe chain was more fragile than the service startup. The operator directed its removal together with Redis healthchecks; the final implementation keeps only the wrapper password guard and the container command that refuses to start without `requirepass`.

### Phase 2: Remove Public Infrastructure Exposure and Move Portainer Bootstrap to HTTPS

- [x] Started: 2026-07-26T00:42:02+03:00
- [x] Completed: 2026-07-26T00:43:57+03:00
- [x] Automated verification: PASSED 2026-07-26T00:43:57+03:00

**Notes**: Removed the Traefik database publication/entrypoint and PostgreSQL/Redis TCP labels, retained internal overlays, and moved all Portainer administrator bootstrap requests to HTTPS before removing port `9000`. Shell/Ansible syntax, four rendered Compose configs, forbidden-route absence, preserved HTTP/HTTPS/overlay contracts, live local `pg_isready`, and whitespace checks pass. The operator later directed removal of added PostgreSQL wait/container/readiness tasks so its Ansible deployment remains a simple render plus stack deploy.

### Phase 3: Add Traefik Log Controls, Operational Documentation, and End-to-End Verification

- [x] Started: 2026-07-26T00:43:57+03:00
- [x] Completed: 2026-07-26T00:49:02+03:00
- [x] Automated verification: PASSED 2026-07-26T00:49:02+03:00

**Notes**: Parameterized Traefik logging with an `INFO` default and temporary `DEBUG` override across local and CI deployment inputs, then documented the hardened network boundary, private administration paths, credential flow, rollout, verification, and rollback procedure. Shell and Ansible syntax, default/override/restored Traefik renders, production and preview CI propagation, rendered Compose validation, supported-file formatting, forbidden-route scans, and `git diff --check` pass. Production verification later confirmed all replicas, private infrastructure ports, DNS, TLS, current logs, and fresh Admin login.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 11 -->

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
- **Fix**: Removed the Redis task-discovery and post-deploy probe chain per operator direction; Redis deployment now ends after `docker stack deploy`.
- **Reusable Pattern**: Do not add orchestrator task discovery when the requested deployment contract only requires a guarded service start.

### Incident 7 — Positive Redis probe assumed an optional port variable

- **Occurrences**: 1
- **Stage**: Production rollout retry
- **Symptom**: The unauthenticated probe correctly returned `NOAUTH`, but the authenticated probe failed even though a protected read-only diagnostic returned `PONG` on port `6379`.
- **Root Cause**: `REDIS_PORT` was absent from the deployer environment. Redis startup and the negative probe defaulted to `6379`, while the positive probe passed an empty value to `redis-cli -p`.
- **Fix**: Add `REDIS_PORT=6379` to the example environment, resolve it through `get_env_or_default`, render an empty input as the string `"6379"`, and remove the unnecessary positive deployment probe.
- **Reusable Pattern**: Apply the same default at input, render, and runtime boundaries for optional deployment values.

### Incident 8 — Redis authentication rollover left existing clients aborted

- **Occurrences**: 1
- **Stage**: Production rollout verification
- **Symptom**: Correct production credentials returned `500 Internal server error: The operation was aborted.`, and API/MCP logged repeated ioredis errors.
- **Root Cause**: Redis was replaced with authentication before an earlier aborted rollout reached API and MCP, leaving their long-lived connections in an unrecovered state despite matching credentials.
- **Fix**: Confirmed a fresh authenticated connection returned `PONG`, force-restarted API and MCP, then verified successful Admin login and clean current logs.
- **Reusable Pattern**: When Redis is recreated outside the complete rollout, restart its API and MCP clients before application verification.

### Incident 9 — Domain deployment continued after Certbot failure

- **Occurrences**: 1
- **Stage**: Production rollout verification
- **Symptom**: Traefik reloaded an absent certificate path after Let's Encrypt rejected the HTTP-01 challenge.
- **Root Cause**: Cloudflare retained both old and current A-records, while `domain.sh` continued to certificate registration after the Certbot Ansible command failed.
- **Fix**: Made the managed A-record exclusive, added fail-fast shell behavior to domain deployment and certificate renewal, then successfully issued and registered the Traefik certificate.
- **Reusable Pattern**: Keep one A-record for the managed service hostname, and require certificate issuance to succeed before registration or reload.

### Incident 10 — Redundant Portainer update raced with stack deployment

- **Occurrences**: 1
- **Stage**: Production rollout
- **Symptom**: LLM stack deployment succeeded, then the following Portainer service update failed with `update out of sequence`.
- **Root Cause**: Five application playbooks posted the unchanged service Spec back through Portainer using a version captured immediately after `docker stack deploy`.
- **Fix**: Removed the repeated version/Spec/update tasks from LLM, API, MCP, Telegram, and Host; all five subsequently deployed through the shorter stack-and-webhook flow.
- **Reusable Pattern**: Use one service mutation per deploy path and avoid version-sensitive duplicate updates.

### Incident 11 — MCP and Telegram secret tasks exposed loop values

- **Occurrences**: 1
- **Stage**: Production rollout
- **Symptom**: MCP printed a generated webhook update URL while creating GitHub secrets.
- **Root Cause**: MCP and Telegram lacked the `no_log: true` used by the other service secret tasks.
- **Fix**: Added the mask to both playbooks and confirmed Telegram values were censored during deployment.
- **Reusable Pattern**: Secret-writing tasks must mask both command arguments and loop item values.

## Summary

### Changes Made

- Enforced authenticated Redis startup in production and local Compose flows while preserving the existing protected credential path into API and MCP.
- Made Redis port `6379` explicit across deployer input, rendered service environment, and runtime command while removing fragile post-deploy task/probe orchestration.
- Removed public PostgreSQL/Redis Traefik routing and direct Portainer publication, retained private overlay connectivity, and moved Portainer bootstrap to its HTTPS route.
- Defaulted Traefik logging to `INFO` with an explicit temporary `DEBUG` override propagated through deployer and CI inputs.
- Documented firewall ownership, private administration, coordinated rollout, rollback risks, and operator-driven post-deploy verification.
- Made domain issuance and certificate renewal fail fast so a missing certificate cannot be registered as a successful deployment.
- Verified production Redis connectivity and restored Admin login by restarting the API/MCP clients after the Redis authentication rollover.
- Keep Cloudflare service A-records exclusive so certificate validation cannot reach a retired server.
- Removed redundant Portainer service updates from all five application deploys and masked MCP/Telegram secret output.

### Pull Request

- [x] PR created: https://github.com/singlepagestartup/singlepagestartup/pull/217
- [x] PR number: 217

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [x] Issue submitted to Code Review

---

**Last updated**: 2026-07-26T03:00:45+03:00
