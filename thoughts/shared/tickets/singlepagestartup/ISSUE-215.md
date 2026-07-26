---
issue_number: 215
repository: singlepagestartup
status: "Research Needed"
created_at: 2026-07-21T18:47:40Z
captured_at: 2026-07-25T23:36:05+03:00
---

# Issue #215: Harden public PostgreSQL, Redis, Portainer, and Traefik configuration

- **URL**: https://github.com/singlepagestartup/singlepagestartup/issues/215
- **Status**: Research Needed
- **State**: OPEN
- **Created**: 2026-07-21T18:47:40Z
- **Author**: flakecode
- **Labels**: `size:medium`, `area:db`, `area:redis`

## Problem to solve

The production single-node Docker Swarm deployment exposes data-plane and administrative services more broadly than intended and contains conflicting or ineffective security configuration across PostgreSQL, Redis, Portainer, and Traefik.

The issue records five confirmed behaviors:

1. PostgreSQL is publicly reachable through host port `5432` while the inspected host firewall is inactive.
2. PostgreSQL and Redis define conflicting Traefik TCP routers on the same entrypoint using the same `HostSNI('*')` catch-all rule.
3. Redis clients are configured with a password, but the stock Redis image does not enable authentication solely from the configured `REDIS_PASSWORD` environment variable.
4. Portainer is published directly on host port `9000` in addition to its HTTPS Traefik route.
5. Traefik runs with DEBUG logging in production and repeatedly emits full dynamic configuration and scanner noise.

The issue intentionally excludes unrelated findings from the same operational review.

## Key details

### Environment

- Deployment: single-node Docker Swarm
- Application image during inspection: `singlepagestartup/singlepagestartup:0.0.290`
- Traefik: `v3.7`
- PostgreSQL: `pgvector/pgvector:pg17`
- Redis: official `redis` image
- Host firewall during inspection: inactive

No credentials or secret values are included in the issue.

### PostgreSQL public exposure

The issue reports that `docker-compose.traefik.yaml` publishes ports `80`, `443`, and `5432`, and configures `--entrypoints.tcp.address=:5432`. The inspected host listened on all interfaces at `*:5432`. PostgreSQL logged clustered failed-password attempts against the generic `postgres` role, while the application uses a different role.

### PostgreSQL/Redis TCP router collision

The issue reports that `docker-compose.postgres.yaml` and `docker-compose.redis.yaml` both attach TCP routers to the `tcp` entrypoint with `HostSNI('*')`. Both non-TLS services therefore match the same catch-all rule on one published port.

### Redis authentication mismatch

The issue reports that the Redis service sets `REDIS_PASSWORD` and clients supply a password, but the stock Redis image is not configured to consume that environment variable. The live MCP service warned that the default user did not require a password even though a password was supplied, and an unauthenticated internal health probe succeeded.

### Portainer direct publication

The issue reports that `docker-compose.portainer.yaml` publishes `9000:9000` while also defining an HTTPS Traefik route for `portainer.singlepagestartup.com`.

### Traefik DEBUG logging

The issue reports `--log.level=DEBUG` in `docker-compose.traefik.yaml`. During inspection, DEBUG output repeatedly included dynamic HTTP/TCP configuration, internal overlay addresses, middleware configuration including Basic Auth hashes, and malformed TLS handshakes from scanners.

## Implementation notes from the issue

The issue proposes:

- removing the default public PostgreSQL port, Traefik TCP entrypoint, and PostgreSQL/Redis TCP router labels when remote database access is not a product requirement;
- retaining PostgreSQL and Redis on the private overlay network;
- using a separately documented, allowlisted, TLS-protected administration path if remote PostgreSQL access is required;
- configuring Redis authentication explicitly with an ACL file or `requirepass` and coordinating all client credentials in one rollout;
- removing Portainer's direct `9000:9000` publication while keeping its HTTPS Traefik route;
- changing the default production Traefik log level to INFO, with DEBUG used only as a temporary troubleshooting override;
- documenting intended host ingress/firewall policy while preserving the SSH management path.

The rollout notes call for checking external dependencies on ports `5432` and `9000`, coordinating Redis server/client changes, validating in a test environment, confirming service convergence, and rotating credentials if policy requires it.

## Acceptance criteria

- [ ] Host port `5432` is no longer publicly published by the default production deployment.
- [ ] PostgreSQL remains reachable by authorized internal application services.
- [ ] PostgreSQL and Redis no longer share a catch-all Traefik TCP entrypoint/rule.
- [ ] Redis authentication is explicitly enabled and verified with positive and negative tests.
- [ ] All Redis clients use the same protected credential source.
- [ ] MCP no longer logs the password-to-passwordless-Redis warning.
- [ ] Host port `9000` is no longer publicly published.
- [ ] Portainer remains available through its HTTPS Traefik route.
- [ ] Production Traefik defaults to INFO logging.
- [ ] Normal Traefik logs no longer repeatedly disclose full dynamic configuration or Basic Auth hashes.
- [ ] Deployment documentation describes the intended ingress/firewall policy and preserves SSH access.
- [ ] A post-deployment check confirms healthy replicas and no unexpected restarts.

## References

Files named in the issue:

- `docker-compose.traefik.yaml`
- `docker-compose.postgres.yaml`
- `docker-compose.redis.yaml`
- `docker-compose.portainer.yaml`

Repository paths corresponding to these names include:

- `tools/deployer/traefik/docker-compose.traefik.yaml.j2`
- `tools/deployer/postgres/docker-compose.postgres.yaml.j2`
- `tools/deployer/redis/docker-compose.redis.yaml.j2`
- `tools/deployer/portainer/docker-compose.portainer.yaml.j2`

Separate local-development Compose files also exist at:

- `apps/db/docker-compose.postgres.yaml`
- `apps/redis/docker-compose.redis.yaml`

Verification commands named in the issue:

- `docker service ls`
- `docker service ps postgres_postgres`
- `docker service ps redis_redis`
- `docker service ps portainer_portainer`
- `docker service ps traefik_traefik`
- `ss -ltnp`

## Comments

No GitHub issue comments were present when this ticket snapshot was captured.
