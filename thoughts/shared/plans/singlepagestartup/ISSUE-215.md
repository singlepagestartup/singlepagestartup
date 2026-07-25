---
date: 2026-07-26T00:04:49+03:00
issue_number: 215
repository: singlepagestartup
topic: "Harden public PostgreSQL, Redis, Portainer, and Traefik configuration"
status: in_review
---

# Harden Public PostgreSQL, Redis, Portainer, and Traefik Configuration Implementation Plan

## Overview

Harden the production deployment by keeping PostgreSQL and Redis internal to Docker Swarm, enforcing Redis authentication with the existing protected secret, moving Portainer bootstrap behind HTTPS, and making Traefik logging quiet by default with an explicit temporary override.

## Current State Analysis

The production deployment is rendered from Jinja Compose templates by service-specific Ansible playbooks. Traefik currently publishes host port `5432`, owns a generic TCP entrypoint on that port, and runs at `DEBUG`; the PostgreSQL and Redis stacks both attach catch-all TCP routers to that entrypoint (`tools/deployer/traefik/docker-compose.traefik.yaml.j2:6-23`, `tools/deployer/postgres/docker-compose.postgres.yaml.j2:20-25`, `tools/deployer/redis/docker-compose.redis.yaml.j2:20-25`).

Redis receives `REDIS_PASSWORD` as an environment value, but its stock server command does not consume the value. API and MCP already receive the same deployment secret as `KV_PASSWORD` and pass it to their Redis clients, so the missing control is server-side enforcement rather than a new client credential flow (`tools/deployer/redis/docker-compose.redis.yaml.j2:4-13`, `tools/deployer/api/api.env.j2:92-99`, `tools/deployer/mcp/mcp.env.j2:41-46`).

Portainer is available through both a published host port and an HTTPS Traefik router. Administrator initialization is the remaining dependency on `http://127.0.0.1:9000`; subsequent provisioning already uses the HTTPS service hostname (`tools/deployer/portainer/docker-compose.portainer.yaml.j2:12-33`, `tools/deployer/portainer/create_portainer_user.yaml:9-25`, `tools/deployer/portainer/add_docker_hub_registry.yaml:18-46`).

## Desired End State

- The production host publishes only the intended SSH and HTTP/HTTPS ingress; Traefik has no database port or generic database TCP entrypoint.
- PostgreSQL and Redis have no Traefik TCP routers and remain reachable by API and MCP through service DNS on `traefik_overlay`.
- Redis refuses unauthenticated commands and accepts the existing `REDIS_PASSWORD`/`KV_PASSWORD` credential used by API and MCP.
- Portainer administrator bootstrap and all later API calls use its HTTPS hostname, with no published host port `9000`.
- Traefik runs at `INFO` by default; operators can temporarily select `DEBUG` through the normal deployment inputs and restore `INFO` without editing a template.
- Deployment checks prove service convergence, Redis authentication behavior, internal database connectivity, and HTTPS Portainer availability without exposing credentials.
- Operator documentation defines the expected ingress, SSH-based database administration, log override procedure, rollout order, rollback considerations, and provider-firewall ownership.

### Key Discoveries

- API and MCP connect to `postgres` and `redis` through Swarm service DNS, so their runtime connectivity does not depend on Traefik's public TCP entrypoint (`tools/deployer/api/api.env.j2:12-19,92-99`, `tools/deployer/mcp/mcp.env.j2:41-46`).
- Both current data-service routers use the same `tcp` entrypoint and `HostSNI('*')`, so removing the public path also removes an ambiguous router collision (`tools/deployer/postgres/docker-compose.postgres.yaml.j2:20-25`, `tools/deployer/redis/docker-compose.redis.yaml.j2:20-25`).
- The protected Redis value already travels through local deployment, GitHub Actions, API, and MCP configuration; implementation should reuse it rather than introduce a second secret (`.github/workflows/ansible.yml:55-64,172-181`, `tools/deployer/github_deployer.sh:37-50,157-167`).
- `portainer.sh` establishes the hostname before deploying Portainer, and the stack already declares the HTTPS router needed for bootstrap (`tools/deployer/portainer.sh:21-41`, `tools/deployer/portainer/docker-compose.portainer.yaml.j2:27-33`).
- The deployer already documents inbound `22`, `80`, and `443` and explicitly leaves firewall configuration to the infrastructure operator (`tools/deployer/README.md:7-22`).
- Traefik v3.7, the Swarm provider, the explicit shared overlay, and the ACME redirect exclusion are established deployment constraints and must remain intact (`tools/deployer/traefik/docker-compose.traefik.yaml.j2:5-20,35-53`).

## What We're NOT Doing

- Adding a public, allowlisted, VPN, or bastion-routed PostgreSQL or Redis endpoint.
- Automating Lightsail, cloud-provider, UFW, or other host firewall changes.
- Introducing Redis ACL users, a new secret manager, a second Redis password, or new API/MCP client constructors.
- Removing PostgreSQL or Redis from `traefik_overlay` or renaming their Swarm services.
- Replacing Traefik, Portainer, Docker Swarm, or the existing certificate flow.
- Changing application schemas, persisted PostgreSQL/Redis data, or repository data snapshots.
- Broadly refactoring deployment scripts beyond the security controls and verification required by issue 215.

## Implementation Approach

Apply the hardening in dependency order. First make Redis authentication real and verify existing clients can use it. Then move Portainer bootstrap to the already-established HTTPS route and remove all public infrastructure routing while preserving overlay connectivity. Finally expose the Traefik log level through existing deployment-input paths, document operational procedures, and validate both rendered configuration and a live deployment.

The full deployment order already places Traefik and Portainer before PostgreSQL, Redis, API, and MCP (`tools/deployer/up.sh:6-19`). Preserve that order so HTTPS Portainer bootstrap is available before port `9000` disappears and authenticated Redis is healthy before application clients start.

## Phase 1: Enforce Redis Authentication and Local Parity

### Overview

Make the existing Redis password an enforced server control in production and local development, then prove both the negative and positive authentication paths without changing application client implementations.

### Changes Required

#### 1. Production Redis server configuration

**File**: `tools/deployer/redis/docker-compose.redis.yaml.j2`

**Why**: The template currently places `REDIS_PASSWORD` in the environment but launches the stock Redis command, so the server remains unauthenticated (`tools/deployer/redis/docker-compose.redis.yaml.j2:4-13`).

**Changes**:

- Start Redis with password authentication enabled through `requirepass`, consuming the existing `REDIS_PASSWORD` value.
- Keep the internal service name, data volume, default port, placement constraint, and `traefik_overlay` attachment unchanged.
- Add an authenticated health check that does not print the credential.
- Treat a missing password as an invalid production configuration rather than silently starting an unauthenticated server.

#### 2. Redis deployment validation

**Files**:

- `tools/deployer/redis.sh`
- `tools/deployer/redis/create_redis.yaml`

**Why**: The wrapper passes the password today, but the playbook stops after `docker stack deploy` and does not establish service convergence or authentication behavior (`tools/deployer/redis.sh:10-27`, `tools/deployer/redis/create_redis.yaml:11-17`).

**Changes**:

- Validate that the production password is non-empty before deployment.
- Wait for the Redis Swarm service to reach its expected replica state.
- Run a negative probe that confirms an unauthenticated command is rejected.
- Run a credential-protected positive probe that confirms authenticated `PING` returns `PONG`.
- Apply `no_log` or equivalent output suppression to any task that receives or uses the password.

#### 3. Local Redis and API parity

**Files**:

- `apps/redis/docker-compose.redis.yaml`
- `apps/api/create_env.sh`

**Why**: Local Redis has the same env-only password gap, while the generated API environment copies the Redis port and password but does not select the Redis provider (`apps/redis/docker-compose.redis.yaml:4-16`, `apps/api/create_env.sh:75-79`, `libs/shared/utils/src/lib/envs/host.ts:54-62`).

**Changes**:

- Start the local Redis service with `requirepass` from its generated `REDIS_PASSWORD`.
- Add an authenticated local health check while preserving the existing published development port.
- Generate `KV_PROVIDER=redis` for the local API; continue using the existing localhost default, copied port, and copied password.

### Success Criteria

#### Automated Verification

- [x] Shell syntax passes for the changed wrappers: `bash -n tools/deployer/redis.sh apps/api/create_env.sh`.
- [x] Ansible syntax validation passes for `tools/deployer/redis/create_redis.yaml`.
- [x] The rendered production Redis Compose file passes `docker compose config`.
- [x] The local Redis Compose file passes `docker compose config`.
- [x] The local Redis service reaches healthy state with its generated environment.
- [x] An unauthenticated local `PING` is rejected and an authenticated `PING` returns `PONG`.
- [x] The existing real API KV scenario passes with `KV_PROVIDER=redis`: `npx nx run api:jest:scenario --testFile=apps/api/specs/scenario/singlepagestartup/issue-152/backend-cart.scenario.spec.ts`.

#### Manual Verification

- [ ] The deployed `redis_redis` service reaches `1/1`.
- [ ] A probe inside the deployment network rejects Redis commands without a password and succeeds with the protected password.
- [ ] API starts without Redis authentication errors and can exercise its configured KV-backed behavior.
- [ ] MCP starts with its Redis OAuth store and no longer reports that the server accepts unauthenticated access.
- [ ] No Redis password appears in Ansible output, deployment logs, or verification output.

---

## Phase 2: Remove Public Infrastructure Exposure and Move Portainer Bootstrap to HTTPS

### Overview

Remove the public PostgreSQL, Redis, and Portainer paths as one coordinated deployment change while retaining internal service discovery and adding internal readiness checks.

### Changes Required

#### 1. Remove the public data-service entrypoint

**File**: `tools/deployer/traefik/docker-compose.traefik.yaml.j2`

**Why**: Traefik publishes `5432` and binds a generic TCP entrypoint that is unnecessary for application traffic (`tools/deployer/traefik/docker-compose.traefik.yaml.j2:6-23`).

**Changes**:

- Remove the `5432:5432` host publication.
- Remove the generic `tcp` entrypoint.
- Preserve ports `80` and `443`, the Swarm provider, file provider, dashboard route, ACME challenge redirect exclusion, Docker socket mount, and explicit `traefik_overlay`.

#### 2. Remove PostgreSQL and Redis TCP routers

**Files**:

- `tools/deployer/postgres/docker-compose.postgres.yaml.j2`
- `tools/deployer/redis/docker-compose.redis.yaml.j2`

**Why**: Both services currently register public catch-all TCP routers on the same entrypoint; neither router is needed for API/MCP service-DNS traffic (`tools/deployer/postgres/docker-compose.postgres.yaml.j2:20-25`, `tools/deployer/redis/docker-compose.redis.yaml.j2:20-25`).

**Changes**:

- Remove Traefik enablement, TCP service/router, catch-all SNI rule, and router-network labels from both data services.
- Keep both services attached to `traefik_overlay` for their current internal clients.
- Do not add replacement host publications or public routes.

#### 3. Add internal PostgreSQL readiness

**File**: `tools/deployer/postgres/create_postgres.yaml`

**Why**: PostgreSQL deployment currently returns immediately after `docker stack deploy`, while the hardened deployment needs an internal health signal that does not rely on port `5432` being public (`tools/deployer/postgres/create_postgres.yaml:11-17`).

**Changes**:

- Wait for the PostgreSQL Swarm service to reach its expected replica state.
- Verify readiness from the host or service container using the configured database/user over the internal service boundary.
- Suppress credential-bearing task output.

#### 4. Move Portainer bootstrap to the HTTPS hostname

**Files**:

- `tools/deployer/portainer.sh`
- `tools/deployer/portainer/create_portainer_user.yaml`
- `tools/deployer/portainer/docker-compose.portainer.yaml.j2`

**Why**: Administrator initialization is the only remaining code path that requires published port `9000`; the wrapper already computes the service hostname and later Portainer tasks already use HTTPS (`tools/deployer/portainer.sh:21-50`, `tools/deployer/portainer/create_portainer_user.yaml:9-42,73-88`).

**Changes**:

- Pass the computed Portainer service hostname into the administrator-initialization playbook.
- Change status, administrator-check, restart-readiness, and initialization requests to the HTTPS service URL.
- Preserve the setup-token flow, accepted status handling, retries, and secret-output suppression.
- Remove `9000:9000` only after every bootstrap request uses the HTTPS route.
- Preserve the internal Portainer agent connection, data volume, `websecure` router, TLS, host rule, and overlay attachment.

### Success Criteria

#### Automated Verification

- [x] Shell syntax passes for `tools/deployer/portainer.sh`.
- [x] Ansible syntax validation passes for the changed PostgreSQL and Portainer playbooks.
- [x] Rendered Traefik, PostgreSQL, Redis, and Portainer Compose files pass `docker compose config`.
- [x] Static inspection of rendered files finds no published `5432`, published `9000`, generic database TCP entrypoint, or PostgreSQL/Redis Traefik TCP router.
- [x] Rendered files still contain the intended `80`/`443` publications, HTTPS Portainer router, and external `traefik_overlay` declarations.

#### Manual Verification

- [ ] A clean or repeat Portainer deployment completes administrator initialization through `https://<portainer-host>` and registry bootstrap still succeeds.
- [ ] `traefik_traefik`, `portainer_portainer`, `postgres_postgres`, and `redis_redis` report healthy expected replicas.
- [ ] Host listener inspection shows no listeners on `5432` or `9000`.
- [ ] External connection attempts to the host on `5432`, `6379`, and `9000` fail.
- [ ] API reaches PostgreSQL and Redis through service DNS, and MCP reaches Redis through service DNS.
- [ ] Traefik dashboard, Portainer HTTPS, ACME challenge handling, and normal application HTTPS routes still work.

---

## Phase 3: Add Traefik Log Controls, Operational Documentation, and End-to-End Verification

### Overview

Make `INFO` the default Traefik log level across local and CI deployment entrypoints, document the temporary override and security boundary, and complete rollout/rollback verification.

### Changes Required

#### 1. Parameterize Traefik logging

**Files**:

- `tools/deployer/traefik.sh`
- `tools/deployer/traefik/docker-compose.traefik.yaml.j2`
- `tools/deployer/.env.example`

**Why**: The log level is hard-coded to `DEBUG`, and the wrapper has no input for changing it (`tools/deployer/traefik/docker-compose.traefik.yaml.j2:12-14`, `tools/deployer/traefik.sh:10-29`).

**Changes**:

- Read `TRAEFIK_LOG_LEVEL` through the existing default-value helper with `INFO` as the default.
- Pass the resolved value into the Traefik render flow and use it in the template.
- Add the setting to `.env.example` with `INFO` as the normal value and `DEBUG` described as temporary troubleshooting only.
- Preserve the current Traefik image, provider, entrypoint, TLS, dashboard, and readiness behavior.

#### 2. Propagate the optional log override through CI

**Files**:

- `.github/workflows/ansible.yml`
- `tools/deployer/github_deployer.sh`

**Why**: GitHub Actions builds the deployer `.env` from repository secrets, and the helper publishes the same input set for production and preview deployments; both paths must be able to carry a deliberate override (`.github/workflows/ansible.yml:55-64,172-181`, `tools/deployer/github_deployer.sh:37-50,157-167`).

**Changes**:

- Add production and preview `TRAEFIK_LOG_LEVEL` inputs to the generated deployment environment.
- Add the value to the GitHub-deployer helper's read/publish/delete set.
- Preserve `INFO` when the optional CI value is absent or empty so troubleshooting does not become the lasting default.

#### 3. Document the hardened operational model

**File**: `tools/deployer/README.md`

**Why**: The README already assigns firewall ownership to the operator but does not describe private database administration, Redis authentication, Portainer's HTTPS-only path, or the log-level override (`tools/deployer/README.md:7-22,114-137`).

**Changes**:

- State that expected provider ingress is TCP `22`, `80`, and `443`, that the deployer does not manage firewall rules, and that database/admin ports must not be opened.
- Document PostgreSQL and Redis administration through SSH followed by container/service-local tooling rather than a public route.
- Document the single `REDIS_PASSWORD`/`KV_PASSWORD` credential flow and the need to keep production and preview secrets populated.
- Document HTTPS-only Portainer access and bootstrap expectations.
- Document how to temporarily set Traefik to `DEBUG`, redeploy Traefik, collect diagnostics, restore `INFO`, and verify the restored level.
- Document the coordinated rollout order, post-deploy checks, and rollback risks, including that reverting the network templates would reintroduce public listeners.

### Success Criteria

#### Automated Verification

- [x] Shell syntax passes for all changed shell files, including `tools/deployer/traefik.sh` and `tools/deployer/github_deployer.sh`.
- [x] Ansible syntax validation passes for every changed playbook.
- [x] A render with no log-level input produces Traefik `INFO`.
- [x] A render with the supported override produces Traefik `DEBUG`, and returning the input to `INFO` restores the default.
- [x] Production and preview GitHub Actions environment generation include the log-level input while continuing to include the existing Redis password secret.
- [x] All changed rendered Compose files pass `docker compose config`.
- [x] Repository formatting and whitespace validation passes: `git diff --check`.

#### Manual Verification

- [ ] Traefik starts at `INFO` after the normal deployment and no longer emits sustained debug-volume logs.
- [ ] A temporary `DEBUG` deployment produces diagnostic output, and the documented restoration procedure returns the service to `INFO`.
- [ ] The provider firewall allows only the documented ingress required for SPS, with no deployer attempt to mutate firewall state.
- [ ] The complete deployment passes the Redis, PostgreSQL, Portainer, Traefik, API, and MCP checks from Phases 1 and 2.
- [ ] Operators can perform documented PostgreSQL and Redis administrative checks over SSH without reopening public ports.

---

## Testing Strategy

### Unit Tests

- No new application unit-test surface is required because API and MCP Redis client construction already passes `KV_PASSWORD` and is not changing.
- Keep the existing MCP OAuth unit suite passing to guard the unchanged store-selection and token behavior.
- If any checked-in test is added for deployment helpers, follow the repository BDD header and behavior-first naming requirements.

### Integration Tests

- Render each affected production Jinja template with representative production and preview inputs, then validate the resulting Compose documents.
- Start local Redis with the generated password and execute negative unauthenticated and positive authenticated probes.
- Run the existing API real-KV scenario against authenticated Redis.
- Deploy the four infrastructure stacks in normal order and let the new Ansible convergence/authentication checks gate later services.
- Start API and MCP against the deployed authenticated Redis and verify their real connection paths, including the MCP OAuth Redis store.

### Manual Testing Steps

1. Confirm the provider firewall has only the intended SPS ingress and record that this is an operator-owned check.
2. Deploy Traefik and verify ports `80`/`443`, the `INFO` default, dashboard HTTPS, and ACME behavior.
3. Deploy Portainer, confirm HTTPS administrator bootstrap and registry setup, and verify host port `9000` is absent.
4. Deploy PostgreSQL and Redis, confirm healthy replicas, internal readiness, Redis negative/positive authentication, and absence of public listeners/routes.
5. Deploy API and MCP, exercise database/KV/OAuth behavior, and inspect logs for connection or unauthenticated-Redis warnings.
6. Exercise the temporary Traefik `DEBUG` override, collect a short diagnostic sample, restore `INFO`, and confirm the final log level.

## Performance Considerations

Moving PostgreSQL and Redis off Traefik removes unnecessary proxy routing from their intended internal paths. Redis authentication adds a small connection-establishment cost but does not alter steady-state data access. The default Traefik log reduction should materially lower log I/O and storage volume. Readiness retries must be bounded so a failed service stops deployment promptly rather than waiting indefinitely.

## Migration Notes

- Roll out these changes as one coordinated infrastructure release; do not deploy a password-enforcing Redis without the existing production/preview `REDIS_PASSWORD` values populated.
- Preserve Redis and PostgreSQL volumes. No data migration or schema generation is required.
- Deploy Traefik before the data-service templates so the host database listener disappears first, then remove the stale service labels as PostgreSQL and Redis are redeployed.
- Deploy Portainer with HTTPS bootstrap and port removal together; its hostname, DNS, certificate path, and Traefik route must be available before administrator initialization runs.
- API and MCP can retain their existing `KV_PASSWORD` wiring and should be redeployed or restarted only as needed to establish fresh authenticated Redis connections.
- A source rollback must be treated as security-sensitive because the previous templates republish `5432` and `9000` and restore catch-all TCP routers. Prefer fixing forward; if rollback is unavoidable, re-check host listeners and provider firewall rules immediately.
- Database administration after migration is through SSH and container/service-local commands. Public database routing is not a fallback.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-215.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-215.md`
- Process log: `thoughts/shared/processes/singlepagestartup/ISSUE-215.md`
- Deployment history context: `thoughts/shared/processes/singlepagestartup/ISSUE-199.md`
- Deployment verification history: `thoughts/shared/handoffs/singlepagestartup/ISSUE-199-progress.md`
