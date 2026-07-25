---
issue_number: 215
issue_title: "Harden public PostgreSQL, Redis, Portainer, and Traefik configuration"
repository: singlepagestartup
created_at: 2026-07-25T23:36:05+03:00
last_updated: 2026-07-26T00:53:39+03:00
status: complete
current_phase: complete
---

# Process Log: ISSUE-215 - Harden public PostgreSQL, Redis, Portainer, and Traefik configuration

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: complete
- Next step: code review / merge

## Phase Notes

### Create

- Summary: Issue requirements were captured from GitHub into the canonical local ticket artifact.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-215.md`
- Notes: The GitHub issue had no comments at capture time.

### Research

- Summary: Documented the production Swarm render/deploy chain, public and internal network paths, PostgreSQL/Redis TCP router overlap, Redis server/client credential flow, Portainer's direct/HTTPS access paths, Traefik logging configuration, firewall ownership, and current deployment verification surfaces.
- Outputs:
  - Research: `thoughts/shared/research/singlepagestartup/ISSUE-215.md`
  - GitHub comment: https://github.com/singlepagestartup/singlepagestartup/issues/215#issuecomment-5080517763
  - GitHub Project status: Research in Review
- Notes:
  - Six parallel research agents covered code locations, networking behavior, Redis auth/client flow, existing patterns, and thoughts history.
  - Live code is primary truth; issue 199's process/handoff supplied the historical Traefik v3.7 Swarm-provider and shared-overlay context.
  - The four production templates named by issue 215 are unchanged between tag `0.0.290` and researched commit `53b059643cee05a4593aaed0127e87c4bf7ea3ce`.
  - Static repository research did not access the production host or reproduce its listener, firewall, authentication, or log-volume observations.

### Plan

- Summary: Produced an approved three-phase implementation plan covering Redis authentication and local parity, removal of public infrastructure routing with HTTPS-only Portainer bootstrap, and Traefik log controls plus operational verification.
- Outputs:
  - Plan: `thoughts/shared/plans/singlepagestartup/ISSUE-215.md`
  - GitHub comment: https://github.com/singlepagestartup/singlepagestartup/issues/215#issuecomment-5080586093
  - GitHub Project status: Plan in Review
- Notes:
  - The operator explicitly approved removing all public PostgreSQL/Redis routing, using Redis `requirepass` with the existing protected secret, moving Portainer bootstrap to HTTPS before removing port `9000`, defaulting Traefik to `INFO` with a temporary `DEBUG` override, and documenting rather than automating firewall changes.
  - Six parallel planning analyses covered change locations, network sequencing, Redis secret/client compatibility, deployment verification patterns, historical constraints, and prior artifacts.
  - Plan validation checked referenced paths, phase/success-criteria structure, the focused Nx test target, and `git diff --check`.

### Implement

- Summary: All three implementation phases and their automated verification are complete; live-host verification is intentionally deferred until the operator redeploys the server.
- Outputs:
  - Progress: `thoughts/shared/handoffs/singlepagestartup/ISSUE-215-progress.md`
  - Pull request: https://github.com/singlepagestartup/singlepagestartup/pull/217
  - Implementation commit: `34b22b86367767cbb15b57e1cf81edd1c45ed7e4`
- Notes:
  - Production and local Redis now enforce the existing password, deployment probes verify negative and positive authentication, and new local API environments explicitly select Redis.
  - Phase 1 shell, Ansible, Compose, isolated Redis, focused API KV scenario, and whitespace checks pass.
  - Phase 2 removed public data/admin routes, moved Portainer bootstrap to HTTPS, and added internal PostgreSQL readiness; rendered Compose and local readiness verification pass.
  - Phase 3 added the Traefik `INFO` default and temporary `DEBUG` override through deployer and CI paths, plus the hardened operational and post-deploy runbook.
  - The final automated sweep passed shell and Ansible syntax, rendered Compose validation, default/override/restored log-level behavior, static exposure checks, supported-file formatting, API KV integration, MCP OAuth tests, and whitespace validation.
  - The operator directed implementation through all phases before redeploying the server; live environment verification is deferred to the documented post-deploy checklist.
  - Pull request 217 was linked from issue 215 and the GitHub Project status was verified as `Code Review`.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 9 -->

### Incident 1 — GitHub CLI connectivity from sandbox

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: The initial repository-context/status helper call reported `error connecting to api.github.com`, then could not resolve Project owner metadata inside the sandbox.
- **Root Cause**: GitHub CLI network access was unavailable on the sandboxed command path.
- **Fix**: Reran the same canonical helper flow with escalated network access; repository context resolved to `singlepagestartup/singlepagestartup` and the status gate returned `Research Needed`.
- **Preventive Action**: When a canonical GitHub helper reports the explicit sandbox connectivity diagnostic, rerun that helper with network escalation instead of replacing its repository or Project logic.
- **References**: `.claude/helpers/load_config.sh`, `.claude/helpers/get_issue_status.sh`, `.claude/references/repository-context-contract.md`

### Incident 2 — Production and local Compose files share service basenames

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: The issue named rendered files such as `docker-compose.postgres.yaml` and `docker-compose.redis.yaml`; the first filename lookup surfaced the local `apps/db` and `apps/redis` files before the production sources.
- **Root Cause**: Production files are generated on the host from Jinja templates under `tools/deployer/<service>/`, while local-development Compose files use the same basenames under `apps/`.
- **Fix**: Traced `tools/deployer/up.sh` through each service wrapper and Ansible playbook to the Jinja template and corrected the ticket references before decomposing research.
- **Preventive Action**: For deployer issues, resolve the source of truth through the deployment entrypoint and render chain; treat `/home/code/docker-compose.*.yaml` as generated output and keep it distinct from local Compose.
- **References**: `tools/deployer/up.sh`, `tools/deployer/postgres/create_postgres.yaml`, `tools/deployer/redis/create_redis.yaml`, `apps/db/docker-compose.postgres.yaml`, `apps/redis/docker-compose.redis.yaml`

### Incident 3 — Security policy choices remain conditional in the ticket

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: The issue conditionally allows a remote PostgreSQL path, names both Redis ACL and `requirepass` as authentication options without selecting a protected delivery mechanism, and removes Portainer port `9000` even though administrator bootstrap currently calls that loopback port.
- **Root Cause**: The ticket establishes the required security outcomes but leaves deployment-policy and bootstrap-mechanism choices open.
- **Fix**: Paused before drafting and obtained explicit operator confirmation to remove all public PostgreSQL/Redis routing, reuse the protected `REDIS_PASSWORD` secret with Redis `requirepass`, bootstrap Portainer through its HTTPS Traefik route before removing port `9000`, default Traefik to `INFO` with a temporary `DEBUG` override, and document firewall ownership without automating firewall changes.
- **Preventive Action**: Resolve conditional exposure, credential-delivery, and provisioning-path decisions before writing a security implementation plan so downstream implementation has no policy choices left to infer.
- **References**: `thoughts/shared/tickets/singlepagestartup/ISSUE-215.md`, `thoughts/shared/research/singlepagestartup/ISSUE-215.md`, `tools/deployer/portainer/create_portainer_user.yaml`

### Incident 4 — Generic focused-test command is not executable

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: The first plan draft named `npm run test:file -- <scenario>` as the focused API KV verification command, but prior process/handoff artifacts record that this repository script fails in Nx argument parsing before Jest receives a project.
- **Root Cause**: The package script invokes `nx run` without an owning project, while the selected file belongs to the API application's `jest:scenario` target.
- **Fix**: Replaced the generic wrapper with the project-qualified `api:jest:scenario` Nx command and verified the target and scenario file exist.
- **Preventive Action**: Use the owning project's explicit Nx Jest target in plans until the generic `test:file` package script is repaired.
- **References**: `package.json`, `apps/api/project.json`, `apps/api/specs/scenario/singlepagestartup/issue-152/backend-cart.scenario.spec.ts`, `thoughts/shared/processes/singlepagestartup/ISSUE-209.md`

### Incident 5 — Plan linked unrelated issue 199 research

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: The plan's deployment-history reference pointed to `research/ISSUE-199.md`, which documents MCP tool execution rather than the Traefik/Swarm deployment history cited by issue 215 research.
- **Root Cause**: The plan reference used the correct issue number but the wrong artifact kind; the relevant deployment incidents live in issue 199's process log and implementation handoff.
- **Fix**: Replaced the reference with the issue 199 process and handoff artifacts and read their pinned Traefik/Swarm verification sections before implementation.
- **Preventive Action**: Verify both the issue number and artifact kind when carrying a historical reference from research into a plan.
- **References**: `thoughts/shared/plans/singlepagestartup/ISSUE-215.md`, `thoughts/shared/processes/singlepagestartup/ISSUE-199.md`, `thoughts/shared/handoffs/singlepagestartup/ISSUE-199-progress.md`

### Incident 6 — Sandbox blocked Ansible and Docker verification

- **Phase**: Implement
- **Occurrences**: 2
- **Symptom**: Ansible could not create its local temporary directory and Docker commands could not access the desktop daemon socket.
- **Root Cause**: Both tools require host resources outside the workspace sandbox.
- **Fix**: Reran the same scoped syntax and integration checks with host access; all passed.
- **Preventive Action**: Treat `.ansible/tmp` and Docker-socket permission failures as execution-boundary failures and rerun the unchanged check with scoped host access.
- **References**: `tools/deployer/redis/create_redis.yaml`, `apps/redis/docker-compose.redis.yaml`

### Incident 7 — Scenario runner could not recover from an occupied Bun watch port

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: The scenario runner attempted occupied port `4000`; Bun watch remained alive after `EADDRINUSE`, so fallback ports were not tried.
- **Root Cause**: The runner waits for the watch-process PID to exit, but Bun watch survives its failed server child.
- **Fix**: Stopped the attempt and selected verified-free `SCENARIO_API_PORT=4001`.
- **Preventive Action**: Set an explicit free scenario port when a development API is already running.
- **References**: `tools/testing/test-scenario-issue.sh`, `/tmp/sps-api-scenario.log`

### Incident 8 — Existing local environment predates scenario and Redis parity inputs

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: The ignored API environment lacked the fixed scenario identity and its KV password differed from the ignored Redis environment.
- **Root Cause**: Persistent local `.env` files predated current generators and are intentionally never overwritten.
- **Fix**: Preserved the user's files and injected fixed identity and isolated Redis connection values only into verification processes.
- **Preventive Action**: Verify generator behavior without mutating persistent ignored environments; use process-scoped test inputs for historical local setups.
- **References**: `apps/api/create_env.sh`, `apps/redis/create_env.sh`, `tools/testing/test-scenario-issue.sh`

### Incident 9 — Issue-level scenario runner included an unrelated frontend failure

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: The issue-152 runner executed backend and frontend suites; the backend Redis/KV suite passed while an unrelated frontend cart assertion failed.
- **Root Cause**: The runner discovers every scenario under an issue directory, but issue 215's approved verification names only the backend file.
- **Fix**: Ran the exact project-qualified backend target; all four tests passed.
- **Preventive Action**: Prefer the plan's focused project target when a historical issue directory contains unrelated suites.
- **References**: `tools/testing/test-scenario-issue.sh`, `apps/api/specs/scenario/singlepagestartup/issue-152/backend-cart.scenario.spec.ts`

## Reusable Learnings

- Production deployment behavior is sourced from `tools/deployer/**/*.j2` through Ansible, while `apps/db` and `apps/redis` describe local development.
- Preserve the current reverse-proxy/orchestrator boundary when reasoning about deployment behavior: Traefik and service labels share one explicit `traefik_overlay`, while internal application clients use Swarm service DNS.
