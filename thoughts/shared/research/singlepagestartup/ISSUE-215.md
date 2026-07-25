---
date: 2026-07-25T23:45:02+03:00
researcher: flakecode
git_commit: 53b059643cee05a4593aaed0127e87c4bf7ea3ce
branch: main
repository: singlepagestartup
topic: "Harden public PostgreSQL, Redis, Portainer, and Traefik configuration"
tags: [research, codebase, deployer, docker-swarm, traefik, postgres, redis, portainer]
status: complete
last_updated: 2026-07-25
last_updated_by: flakecode
---

# Research: Harden public PostgreSQL, Redis, Portainer, and Traefik configuration

**Date**: 2026-07-25T23:45:02+03:00
**Researcher**: flakecode
**Git Commit**: 53b059643cee05a4593aaed0127e87c4bf7ea3ce
**Branch**: main
**Repository**: singlepagestartup

## Research Question

How does the current repository produce the PostgreSQL, Redis, Portainer, and Traefik behavior recorded in issue 215, and which deployment, networking, credential, client, documentation, and verification surfaces define that behavior today?

This research describes the current codebase. Runtime observations such as the inactive host firewall, external password attempts, MCP warning, and Traefik log volume come from the issue ticket; they were not reproduced against the production host during this codebase research.

## Summary

The production deployment path lives under `tools/deployer/**`: `up.sh` invokes service wrappers, each wrapper passes environment values to an Ansible playbook, each playbook renders a Jinja Compose template into `/home/code`, and each service is installed as a separate Docker Swarm stack with `docker stack deploy` (`tools/deployer/up.sh:6-19`, `tools/deployer/postgres/create_postgres.yaml:11-17`, `tools/deployer/redis/create_redis.yaml:11-17`, `tools/deployer/portainer/create_portainer.yaml:11-17`, `tools/deployer/traefik/create_traefik.yaml:59-64,84-100`).

The five issue behaviors all have direct counterparts in the current production templates:

1. Traefik publishes host port `5432`, creates a `tcp` entrypoint on `:5432`, and runs with hard-coded DEBUG logging (`tools/deployer/traefik/docker-compose.traefik.yaml.j2:5-23`).
2. PostgreSQL and Redis each register a TCP router on that same `tcp` entrypoint using the same `HostSNI('*')` rule; their backend ports are `5432` and `6379`, respectively (`tools/deployer/postgres/docker-compose.postgres.yaml.j2:20-25`, `tools/deployer/redis/docker-compose.redis.yaml.j2:20-25`).
3. The Redis stack uses the stock `redis` image and supplies `REDIS_PASSWORD` only as a container environment variable. No repository-managed command, Redis config, ACL file, or `requirepass` setting consumes it. API and MCP clients separately receive the same value as `KV_PASSWORD` and pass it to `ioredis` (`tools/deployer/redis/docker-compose.redis.yaml.j2:4-13`, `tools/deployer/api/api.env.j2:92-99`, `tools/deployer/mcp/mcp.env.j2:41-46`, `libs/providers/kv/src/lib/redis/index.ts:18-33`, `apps/mcp/lib/oauth.ts:937-948`).
4. Portainer publishes `9000:9000` and also registers an HTTPS Traefik route to its internal port `9000` (`tools/deployer/portainer/docker-compose.portainer.yaml.j2:12-33`).
5. Traefik's log level is not a deployer input; `--log.level=DEBUG` is embedded directly in the Compose template (`tools/deployer/traefik/docker-compose.traefik.yaml.j2:12-14`, `tools/deployer/traefik.sh:10-29`).

PostgreSQL and Redis do not need the public Traefik TCP path for the internal application connections represented in the repository. API configuration names the Swarm services directly as `DATABASE_HOST=postgres` and `KV_HOST=redis`, and API/MCP join `traefik_overlay` alongside the data services (`tools/deployer/api/api.env.j2:12-19,92-99`, `tools/deployer/mcp/mcp.env.j2:41-46`, `tools/deployer/api/docker-compose.api.yaml.j2:4-7,32-34`, `tools/deployer/mcp/docker-compose.mcp.yaml.j2:4-7,30-32`).

Portainer's direct publication has one current provisioning dependency: administrator initialization polls and calls `http://127.0.0.1:9000`. Later registry and service-management playbooks use the HTTPS Portainer hostname instead (`tools/deployer/portainer/create_portainer_user.yaml:9-25,33-42,73-88`, `tools/deployer/portainer/add_docker_hub_registry.yaml:18-46`, `tools/deployer/api/create_api.yaml:35-41,94-113`).

The four production templates named by issue 215 are unchanged between the inspected application tag `0.0.290` and the researched commit. The selected `0.0.290..HEAD` diff across those templates and the Redis client-env templates contained no changes to them.

## Detailed Findings

### Production deployment topology

`tools/deployer/up.sh` creates the inventory and runs deployment stages in this order: server, AWS, Certbot, Traefik, Portainer, PostgreSQL, Redis, LLM, API, MCP, Telegram, and Host (`tools/deployer/up.sh:6-19`). Relevant services are therefore separate Swarm stacks rather than members of one Compose project.

Each service wrapper reads values from the deployer environment and invokes a focused Ansible playbook:

- Traefik: `DOMAIN`, dashboard credentials, service subdomain, and Cloudflare mode (`tools/deployer/traefik.sh:8-29`).
- Portainer: domain/subdomain, administrator credentials, and Docker Hub credentials (`tools/deployer/portainer.sh:8-50`).
- PostgreSQL: database name, username, and password (`tools/deployer/postgres.sh:8-29`).
- Redis: password and optional port (`tools/deployer/redis.sh:8-27`).

The four create playbooks render their templates to `/home/code/docker-compose.<service>.yaml` and call `docker stack deploy` (`tools/deployer/traefik/create_traefik.yaml:59-64,90-91`, `tools/deployer/portainer/create_portainer.yaml:11-17`, `tools/deployer/postgres/create_postgres.yaml:11-17`, `tools/deployer/redis/create_redis.yaml:11-17`).

The local-development files with similar names are separate:

- `apps/db/docker-compose.postgres.yaml` builds the local Dockerfile and publishes `${POSTGRES_PORT}:5432` (`apps/db/docker-compose.postgres.yaml:4-16`).
- `apps/redis/docker-compose.redis.yaml` builds `redis:latest` through a one-line Dockerfile and publishes `${REDIS_PORT}:6379` (`apps/redis/docker-compose.redis.yaml:4-16`, `apps/redis/Dockerfile:1`).
- The root local Compose file extends those services on `overlay_network`, not the production `traefik_overlay` Swarm network (`docker-compose.yaml:3-16,42-45`).

### Shared Swarm network and internal service discovery

Swarm is initialized by the server provisioning flow, and both Certbot and Traefik idempotently create an attachable overlay named `traefik_overlay` before their stacks are deployed (`tools/deployer/server/init_docker_swarm.yaml:6-17`, `tools/deployer/certbot/create_certbot.yaml:20-30`, `tools/deployer/traefik/create_traefik.yaml:84-91`).

Traefik, PostgreSQL, Redis, Portainer, API, MCP, Host, Telegram, and other production services declare that network as external. Traefik is configured to discover Swarm services on it (`tools/deployer/traefik/docker-compose.traefik.yaml.j2:10-11,15-18,48-53`, `tools/deployer/postgres/docker-compose.postgres.yaml.j2:8-9,27-29`, `tools/deployer/redis/docker-compose.redis.yaml.j2:8-9,27-29`, `tools/deployer/portainer/docker-compose.portainer.yaml.j2:19-20,33-37`).

Internal application configuration uses Swarm service DNS:

- API gets `DATABASE_HOST=postgres`, `DATABASE_PORT=5432`, and database credentials (`tools/deployer/api/api.env.j2:12-19`).
- API gets `KV_HOST=redis`, its configured/default port, and `KV_PASSWORD` when a Redis password is supplied (`tools/deployer/api/api.env.j2:92-99`).
- MCP gets `KV_HOST=redis`, a defaultable port, and optional `KV_PASSWORD`; its OAuth store is fixed to Redis in production configuration (`tools/deployer/mcp/mcp.env.j2:24,41-46`).

The shared database client builds PostgreSQL configuration from `DATABASE_*` (`libs/shared/utils/src/lib/envs/host.ts:22-49`, `libs/shared/backend/database/config/src/lib/postgres.ts:29-37`). The shared KV provider builds its Redis client from `KV_HOST`, `KV_PORT`, `KV_USERNAME`, and `KV_PASSWORD` (`libs/shared/utils/src/lib/envs/host.ts:54-62`, `libs/providers/kv/src/lib/redis/index.ts:18-33`).

### PostgreSQL public path

The PostgreSQL service template itself has no `ports` section. It joins `traefik_overlay`, supplies the standard PostgreSQL initialization environment, and registers a Traefik TCP service and router (`tools/deployer/postgres/docker-compose.postgres.yaml.j2:4-25`).

The host publication occurs in the Traefik stack:

- `5432:5432` is a published Traefik port (`tools/deployer/traefik/docker-compose.traefik.yaml.j2:6-9`).
- `--entrypoints.tcp.address=:5432` binds a TCP entrypoint (`tools/deployer/traefik/docker-compose.traefik.yaml.j2:21-23`).
- PostgreSQL's router uses `entrypoints=tcp` and `HostSNI('*')`, with backend port `5432` (`tools/deployer/postgres/docker-compose.postgres.yaml.j2:21-25`).

The issue ticket records that the inspected host listened on all interfaces and that the host firewall was inactive. The repository documents a provider firewall allowing inbound `22`, `80`, and `443`, and explicitly says the deployer does not create firewall rules (`tools/deployer/README.md:7-22`). No repository deployment file found in the targeted search configures UFW or another host firewall.

### PostgreSQL and Redis TCP router collision

Both data stacks set `traefik.enable=true`, attach a TCP router to the single `tcp` entrypoint, and use the identical catch-all rule:

- PostgreSQL: service port `5432`, router `postgres`, entrypoint `tcp`, rule `HostSNI('*')` (`tools/deployer/postgres/docker-compose.postgres.yaml.j2:20-25`).
- Redis: service port `6379`, router `redis`, entrypoint `tcp`, rule `HostSNI('*')` (`tools/deployer/redis/docker-compose.redis.yaml.j2:20-25`).

Traefik exposes only one data-plane entrypoint, on host port `5432` (`tools/deployer/traefik/docker-compose.traefik.yaml.j2:6-9,21-23`). The templates do not assign different priorities, TLS/SNI identities, entrypoints, or matching rules to the two routers.

### Redis server authentication and client credential flow

The production Redis service is defined as:

- image `redis`;
- environment keys `REDIS_DATABASES`, `REDIS_PORT`, and `REDIS_PASSWORD`;
- an attached volume and `traefik_overlay`;
- Swarm placement/update settings and Traefik TCP labels (`tools/deployer/redis/docker-compose.redis.yaml.j2:4-25`).

The server template contains no Redis startup `command`, mounted `redis.conf`, ACL file, `requirepass`, or health check. The local Redis service has the same env-only shape over a one-line `FROM redis:latest` Dockerfile (`apps/redis/docker-compose.redis.yaml:4-16`, `apps/redis/Dockerfile:1`).

The credential originates in local/deployer configuration and is transported independently to server and clients:

1. `tools/deployer/.env.example` defines `REDIS_PASSWORD` (`tools/deployer/.env.example:66-67`).
2. `redis.sh`, `api.sh`, and `mcp.sh` each read it and pass it to their respective Ansible render flows (`tools/deployer/redis.sh:10-22`, `tools/deployer/api.sh:74-75,155-156`, `tools/deployer/mcp.sh:32-33,96-97`).
3. The Redis stack renders it as `REDIS_PASSWORD` (`tools/deployer/redis/docker-compose.redis.yaml.j2:10-13`).
4. API renders it as `KV_PASSWORD`, selects `KV_PROVIDER=redis`, and names host `redis` when the password is non-empty (`tools/deployer/api/api.env.j2:92-99`).
5. MCP always selects Redis for OAuth storage, names host `redis`, and renders the password when non-empty (`tools/deployer/mcp/mcp.env.j2:24,41-46`).
6. The shared API KV provider passes username and password into `ioredis`; MCP creates a separate `ioredis` client with an optional password (`libs/providers/kv/src/lib/redis/index.ts:20-33`, `apps/mcp/lib/oauth.ts:937-948`).

The GitHub Actions deploy workflow writes preview and production `REDIS_PASSWORD` secrets into the generated deployer environment (`.github/workflows/ansible.yml:61-65,178-182`). The local GitHub-deployer helper also publishes `REDIS_PASSWORD` and `REDIS_PORT` (`tools/deployer/github_deployer.sh:37-42,157-161`). The Redis-specific `fill_github.yaml` playbook publishes only `REDIS_HOST`; the password used by the deployment still comes from the deployer/CI environment (`tools/deployer/redis/fill_github.yaml:37-47`).

Repository search found these two Redis client construction surfaces: the shared KV provider used by API middleware/features, and the MCP OAuth Redis store. Other deployed applications do not construct direct Redis clients in the checked-in source.

`REDIS_DATABASES=16` is rendered into the server container, but neither client constructor supplies a Redis `db` option (`tools/deployer/redis/docker-compose.redis.yaml.j2:10-13`, `libs/providers/kv/src/lib/redis/index.ts:20-31`, `apps/mcp/lib/oauth.ts:941-947`).

For local development, `apps/redis/create_env.sh` generates a password and port, and `apps/api/create_env.sh` copies them to `KV_PASSWORD` and `KV_PORT` (`apps/redis/create_env.sh:32-42`, `apps/api/create_env.sh:75-79`). The local Redis service still contains no startup configuration that consumes the password.

### Portainer direct and HTTPS paths

The Portainer stack has an agent service attached to the Docker socket and volume directory, plus the Portainer service connected to the agent at `tcp://agent:9001` (`tools/deployer/portainer/docker-compose.portainer.yaml.j2:4-20`).

Portainer has two access paths in the same template:

- direct host publication `9000:9000` (`tools/deployer/portainer/docker-compose.portainer.yaml.j2:15-16`);
- a TLS Traefik router on `websecure` with a host rule and backend port `9000` (`tools/deployer/portainer/docker-compose.portainer.yaml.j2:27-33`).

The deployment sequence uses both paths:

- Admin readiness, admin existence checks, restart readiness, and admin initialization call `http://127.0.0.1:9000` (`tools/deployer/portainer/create_portainer_user.yaml:9-25,27-42,73-88`).
- Registry bootstrap logs in through `https://{{ service_url }}/api/auth` (`tools/deployer/portainer/add_docker_hub_registry.yaml:18-46`).
- API, MCP, Host, Telegram, and LLM provisioning also use `https://{{ portainer_url }}` for authentication, service inspection/update, and webhook setup (for example `tools/deployer/api/create_api.yaml:35-41,94-113` and `tools/deployer/mcp/create_mcp.yaml:21-27,77-91`).

### Traefik logging and dashboard configuration

The Traefik image is pinned to `traefik:v3.7`. Its command enables DEBUG logging, the Swarm provider, the file provider, and three entrypoints (`tools/deployer/traefik/docker-compose.traefik.yaml.j2:4-23`).

The log level is embedded directly in the Compose template. `traefik.sh` passes domain, dashboard credentials, SSL mode, and environment type, but no log-level variable (`tools/deployer/traefik.sh:10-29`).

The dashboard is exposed through an HTTPS host router using `api@internal` and an `admin` Basic Auth middleware. The hash is generated by the playbook and injected into a service label (`tools/deployer/traefik/docker-compose.traefik.yaml.j2:41-48`, `tools/deployer/traefik/create_traefik.yaml:43-64`).

The issue ticket's observation that DEBUG output contained dynamic configuration and Basic Auth hashes is a runtime observation. The codebase evidence establishes that DEBUG is enabled and that the Basic Auth hash is present in the dynamic service labels.

### Current deployment verification surfaces

The deployer currently contains these relevant live checks:

- Traefik deployment waits until `traefik_traefik` reports `1/1` replicas (`tools/deployer/traefik/create_traefik.yaml:93-100`).
- Certbot writes a known ACME challenge file and polls its public HTTP URL before invoking Certbot (`tools/deployer/certbot/create_ssl_certificate.yaml:22-47`).
- Portainer admin setup polls the local API, can force a service restart, extracts a setup token from service logs, and validates initialization (`tools/deployer/portainer/create_portainer_user.yaml:9-97`).
- Top-level deployment stages are chained with `&&`, so a failing playbook prevents subsequent stages from running (`tools/deployer/up.sh:8-19`).

The PostgreSQL and Redis create playbooks end after `docker stack deploy` and contain no service-replica, protocol, or authentication probe (`tools/deployer/postgres/create_postgres.yaml:11-17`, `tools/deployer/redis/create_redis.yaml:11-17`). The Portainer stack create playbook itself ends after stack deploy; readiness occurs in the following user-initialization playbook (`tools/deployer/portainer/create_portainer.yaml:11-17`, `tools/deployer/portainer.sh:33-49`).

No dedicated `*.spec.*`, `*.test.*`, or `*.e2e.*` files exist under `tools/deployer`, `apps/db`, or `apps/redis`. Existing deployment-adjacent patterns elsewhere include:

- BDD scenario runners that poll API readiness and exercise real database-backed behavior (`tools/testing/test-scenario-issue.sh:41-69`);
- Compose health checks in the LLM local stack (`apps/llm/docker-compose.yml:23-31`);
- the public Certbot reachability probe described above.

The existing issue-152 scenario constructs the configured KV provider and clears the HTTP cache, but it does not assert Redis authentication behavior (`apps/api/specs/scenario/singlepagestartup/issue-152/backend-cart.scenario.spec.ts:29-45,124-126`). MCP OAuth unit tests select memory storage rather than Redis (`apps/mcp/lib/oauth.spec.ts:25-34`).

No checked-in verification found in the targeted search runs `ss -ltnp`, tests external closure of `5432`/`9000`, or performs authenticated and unauthenticated Redis `PING` checks. Those commands exist in the issue's verification plan rather than current repository automation.

## Code References

- `tools/deployer/up.sh:6-19` - production provisioning/deployment order.
- `tools/deployer/traefik/docker-compose.traefik.yaml.j2:5-23` - Traefik image, public ports, DEBUG mode, providers, and entrypoints.
- `tools/deployer/traefik/docker-compose.traefik.yaml.j2:34-48` - HTTP redirect, dashboard route, Basic Auth, and Swarm network labels.
- `tools/deployer/traefik/create_traefik.yaml:43-64,84-100` - Basic Auth generation, template rendering, network creation, stack deployment, and readiness wait.
- `tools/deployer/postgres/docker-compose.postgres.yaml.j2:4-25` - PostgreSQL image, credentials, overlay attachment, and TCP router.
- `tools/deployer/redis/docker-compose.redis.yaml.j2:4-25` - Redis image, env-only configuration, overlay attachment, and TCP router.
- `tools/deployer/portainer/docker-compose.portainer.yaml.j2:4-33` - Portainer agent, direct port, overlay, and HTTPS route.
- `tools/deployer/portainer/create_portainer_user.yaml:9-97` - loopback port `9000` provisioning dependency.
- `tools/deployer/api/api.env.j2:12-19,92-99` - internal PostgreSQL and Redis service discovery plus credentials.
- `tools/deployer/mcp/mcp.env.j2:24,41-46` - Redis-backed MCP OAuth store configuration.
- `libs/providers/kv/src/lib/redis/index.ts:18-33` - shared API `ioredis` client options.
- `apps/mcp/lib/oauth.ts:937-948` - MCP OAuth `ioredis` client options.
- `tools/deployer/README.md:7-22` - documented Lightsail ingress and firewall ownership.
- `tools/deployer/certbot/create_ssl_certificate.yaml:22-47` - existing public reachability verification pattern.

## Architecture Documentation

### Render and deploy flow

```text
tools/deployer/.env or CI secrets
  -> per-service shell wrapper
  -> Ansible create_<service>.yaml
  -> /home/code/docker-compose.<service>.yaml
  -> docker stack deploy
  -> separate Swarm stack on traefik_overlay
```

The production Compose templates are the authoritative repository surface for host publications, Traefik labels, service images, and Swarm networking. The `apps/db` and `apps/redis` Compose files are local-development surfaces.

### Current external and internal data paths

```text
External TCP :5432
  -> Traefik tcp entrypoint
  -> postgres router HostSNI(*) -> postgres:5432
  -> redis router HostSNI(*)    -> redis:6379

API internal PostgreSQL
  -> DATABASE_HOST=postgres:5432
  -> traefik_overlay

API/MCP internal Redis
  -> KV_HOST=redis:6379
  -> traefik_overlay

External/admin Portainer
  -> host :9000 -> Portainer :9000
  -> HTTPS :443 -> Traefik host router -> Portainer :9000
```

### Current Redis credential flow

```text
REDIS_PASSWORD
  -> Redis service environment: REDIS_PASSWORD
  -> API environment: KV_PASSWORD -> shared ioredis client
  -> MCP environment: KV_PASSWORD -> OAuth-store ioredis client
```

The repository contains client-side password use but no server startup configuration that turns the Redis service environment value into an authentication rule.

## Historical Context (from thoughts/)

No earlier research or plan artifact covers this issue's infrastructure-hardening topic.

Issue 199's process log records the most relevant deployment history. Its Lightsail deployment work replaced Traefik v2.3 and the removed Docker `swarmMode` option with Traefik v3.7's Swarm provider, moved service labels to `traefik.swarm.network`, made one attachable overlay explicit, added a public ACME probe, and documented the provider firewall boundary (`thoughts/shared/processes/singlepagestartup/ISSUE-199.md:971-1047`).

The matching handoff records that the changed Ansible playbooks passed syntax checks and the rendered Traefik/Certbot templates passed `docker compose config`; it distinguishes that verification from pending live-host completion at that time (`thoughts/shared/handoffs/singlepagestartup/ISSUE-199-progress.md:489-504`). The process log promotes the reverse-proxy/orchestrator boundary, shared overlay, and public ACME proof as reusable deployment knowledge (`thoughts/shared/processes/singlepagestartup/ISSUE-199.md:1118-1125`).

Current live-code inspection confirms that the v3.7 Swarm-provider and shared-overlay structure remains present. This research uses current templates as primary truth rather than the historical artifact.

## Related Research

- No directly related research or plan artifact was found.
- Historical deployment context: `thoughts/shared/processes/singlepagestartup/ISSUE-199.md`
- Historical implementation handoff: `thoughts/shared/handoffs/singlepagestartup/ISSUE-199-progress.md`
- Issue snapshot: `thoughts/shared/tickets/singlepagestartup/ISSUE-215.md`

## Open Questions

1. Does any authorized external operator or integration currently depend on public PostgreSQL port `5432` or direct Portainer port `9000`? The repository cannot establish live external dependencies.
2. Which exact Redis server authentication mode and credential-delivery mechanism is approved for this deployment? The issue names ACL or `requirepass` as examples but does not select one.
3. How should Portainer administrator initialization reach the service when direct host publication is absent? The current playbook depends on `127.0.0.1:9000`, while subsequent Portainer operations use the HTTPS hostname.
4. Which environment will provide live validation of host listeners, external port closure, Redis positive/negative authentication, and replica stability? Those states are not reproducible from static repository inspection alone.
5. Is host firewall enforcement owned entirely by the infrastructure provider/operator for all supported deployment targets? Current documentation explicitly covers Lightsail and states that the deployer does not create firewall rules.

## Known Pitfalls (from implementation)

### Ansible and Docker verification may require host access

- **Occurrences**: 2
- **Symptom**: Ansible can fail before syntax validation when it cannot create its local temporary directory, and Docker checks can fail before exercising the configuration when the desktop daemon socket is inaccessible.
- **Root Cause**: Both tools depend on host resources outside a restricted workspace sandbox.
- **Fix**: Rerun the unchanged, narrowly scoped validation command with host access; do not modify deployment code to work around the execution boundary.
- **Preventive Action**: Classify `.ansible/tmp` and Docker-socket permission errors as environment failures before debugging the implementation.
- **References**: `tools/deployer/redis/create_redis.yaml`, `apps/redis/docker-compose.redis.yaml`
