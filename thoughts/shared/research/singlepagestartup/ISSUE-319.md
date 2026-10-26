---
date: 2026-09-26T00:11:19+03:00
researcher: flakecode
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-319-deployer-hardening
repository: singlepagestartup
topic: "Harden the deployer edge and server configuration"
tags: [research, codebase, deployer, ansible, traefik, cron, agent, rbac, is-authorized]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Harden the deployer edge and server configuration

**Date**: 2026-09-26
**Researcher**: flakecode
**Git Commit**: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
**Branch**: claude/issue-319-deployer-hardening
**Repository**: singlepagestartup

## Research Question

How do the agent cron trigger, the Traefik edge and the Ansible SSH settings
work today, and what does each of the agreed deliverables touch? The agreed
scope (ticket, "Scope after review") is: a dedicated secret that opens only the
agent cron route, TLS verification instead of `curl -k`, a Traefik access log on
stdout, a Traefik headers middleware with HSTS, `nosniff` and `Referrer-Policy`,
and Ansible host key checking in `accept-new` mode. The TLS minimum version,
password SSH, dev compose ports and the LLM service are outside that scope.

## Summary

- The server crontab is installed by `tools/deployer/api/set_cron_jobs.yaml`
  with `become: yes`, so it is root's crontab. Every minute it runs
  `curl -k -X POST https://<api host>/api/agent/agents/cron` with the operator
  secret in an `X-RBAC-SECRET-KEY` header on the command line. `api.sh` passes
  `RBAC_SECRET_KEY` to that play and nothing else reads a cron-specific value.
- The cron route has no route middleware. The global is-authorized middleware
  decides access: the operator secret passes, the route is not on the
  allow-list, and the permission seed has no row for it, so only the operator
  secret or a JWT whose subject holds the root `* *` permission reaches the
  handler. Every other caller receives a permission error.
- Nothing in the frontend, the server SDKs, MCP, the Telegram app or the tests
  calls the cron route. Its only caller is the crontab line; the OpenAPI path
  file documents it.
- Route guards are composed per route through `IHttpRoute.middlewares`, which
  `App.useRoutes` registers with `hono.use(path, middleware)` after the global
  middlewares, so a route guard runs after is-authorized. A route that must be
  opened by a credential other than the operator secret therefore needs an
  allow-list rule plus a guard bound to the route. The http-cache clear route
  (#277) and the Telegram control routes carry their guard on the route.
- The constant-time comparison lives in
  `libs/shared/backend/utils/src/lib/rbac-secret/index.ts` and is bound to
  `RBAC_SECRET_KEY`; no generic form exists yet.
- The only module-level route-middleware package is
  `libs/modules/rbac/models/subject/backend/app/middlewares`. The agent model has
  none. Modules do not import `@sps/middlewares`, and `@sps/middlewares` already
  imports the agent server SDK, so an import in the other direction would be a
  project cycle.
- The Traefik service runs `traefik:v3.7` with no access log flags, no
  `logging` block (the other services rotate `json-file` logs at 10 MB x 3, and
  the Docker daemon configures no default rotation) and two middlewares defined
  through its labels: `redirect-to-https` and the dashboard basic auth. Service
  routers for api, host, mcp and telegram attach no middleware. Every service
  deployment force-restarts Traefik, and a reported Traefik race loses
  middlewares defined on the Traefik service's own labels after some restarts.
- `create_traefik.yaml` renders the Traefik compose file on every run but writes
  the dynamic `traefik.yml` only when it does not exist; afterwards
  `yaml_editor.py` edits it in place to add certificates.
- `ansible.cfg` sets `host_key_checking = False`. The generated inventory adds
  `-o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=/dev/null` as
  `ansible_ssh_common_args`. With checking disabled, Ansible places
  `-o StrictHostKeyChecking=no` ahead of the inventory arguments, and the
  `/dev/null` known-hosts file would stop `accept-new` from remembering a key
  even with checking enabled.

## Detailed Findings

### 1. The cron trigger and the secrets it carries

- `tools/deployer/api/set_cron_jobs.yaml:1-16`: `hosts: all`, `become: yes`,
  vars `api_service_url` and `rbac_secret_key`; one `cron` task named
  `agent service cron` with `minute: "*"` and the job
  `curl -k -X POST https://{{ api_service_url }}/api/agent/agents/cron -H 'X-RBAC-SECRET-KEY: {{ rbac_secret_key }}' -F 'data={}' >> /home/code/api_agent_agents_cron.log 2>&1`.
  The job string is a double-quoted YAML scalar whose line ends are escaped, so
  it renders to one line.
- `tools/deployer/api.sh:26-27` reads `RBAC_JWT_SECRET` and `RBAC_SECRET_KEY`
  from `tools/deployer/.env`; `api.sh:119-189` is the `up` branch: DNS and
  certificate (`domain.sh`), image pull, `create_api.yaml` with the service
  variables, `set_cron_jobs.yaml` with `API_SERVICE_URL=$SERVICE_URL` and
  `RBAC_SECRET_KEY` (`api.sh:179-182`), then `fill_github.yaml`.
- `tools/deployer/api/create_api.yaml:34-40` renders `api.env.j2` into
  `/home/code/api.env`; `api/api.env.j2:22-27` writes the RBAC secrets. Optional
  values use the `{% if X is defined and X | length > 0 %}` guard throughout the
  template.
- `tools/deployer/.env.example:134-139` holds the RBAC secret placeholders. The
  deployer README ("Generating deployment secrets", `README.md:126-150`) states
  that every placeholder credential is operator supplied and lists the values
  to generate with `openssl rand -hex 32`.
- The rotation table (`tools/deployer/README.md:179`) tells the operator to
  re-run the cron play after rotating `RBAC_SECRET_KEY`, and the list of copies
  that survive a rotation names the server crontab (`README.md:184-194`).
- CI builds `tools/deployer/.env` from repository secrets:
  `.github/workflows/ansible.yml:32-150` (preview, `PREVIEW_` prefix) and
  `:151-269` (default). `tools/deployer/github_deployer.sh:89-92` and
  `:141-243` push the same names to GitHub. `TELEGRAM_SERVICE_WEBHOOK_SECRET`
  appears in the workflow but not in `github_deployer.sh`.
- `tools/deployer/redis.sh:16-22` refuses a deployment when `REDIS_PASSWORD` is
  empty, before any play runs.
- `tools/deployer/server.sh:10,29-32` passes `RBAC_SECRET_KEY` to
  `server/set_cron_jobs.yaml`, which declares `rbac_secret_key` (`:6`) and uses
  it in no task.

### 2. How the cron route is authorized today

- `apps/api/app.ts:171-172` registers the is-authorized middleware globally;
  `:180` mounts the agent app under `/api/agent`.
- `libs/middlewares/src/lib/is-authorized/index.ts:44-45` reads the operator
  secret from the header or the `rbac.secret-key` cookie; `:60-70` passes a
  matching secret (plain `===`, tracked as #295) and marks the request
  privileged; `:72-74` passes allow-listed routes; `:76-117` asks the subject
  service.
- `libs/middlewares/src/lib/is-authorized/routes/singlepage.ts:9-76` has no
  agent rule. `routes/startup.ts:21` is the project layer; `routes/index.ts`
  composes options, startup and singlepage.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts:150-277`
  authorizes a role-less permission row for everyone unless the route is
  sensitive, a row with roles for subjects holding one, and the root `* *`
  permission for subjects holding its roles. The permission seed contains 475
  rows; the only agent-model row is `GET /api/agent/agents/count`
  (`libs/modules/rbac/models/permission/backend/repository/database/src/lib/data/7ab43e6a-b35b-4700-a8d9-8c67392146b1.json`),
  no POST template row matches `/api/agent/agents/cron`, and no `* POST`
  wildcard row exists. The root row is `7e8e189b-e067-4a23-8ad6-3ba0756b2914`.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/index.ts:35-39`
  binds `POST /cron` with no `middlewares`; `:137-139` delegates to the
  `cron.ts` handler.
- `controller/singlepage/cron.ts:21-159` refuses to run without
  `RBAC_SECRET_KEY` configured, loads the agents and the broadcast channel with
  slug `cron` (it answers 400 unless exactly one exists), and runs each due
  agent. `cron.ts:161-243` records start and result markers through the
  broadcast SDK and POSTs to `API_SERVICE_URL/api/agent/agents/<slug>` with the
  operator secret from the process environment. The operator secret therefore
  stays inside the API process for the per-agent calls whatever credential
  opened the cron route.
- Due-ness comes from `cron-parser` and the last marker (`cron.ts:87-148`), so a
  call made before an agent is due runs nothing for that agent.

### 3. Callers of the cron route

- `tools/deployer/api/set_cron_jobs.yaml:14-16` is the only caller.
- `libs/modules/agent/models/agent/sdk/model/src/lib/paths.yaml:160-190`
  documents `POST /agent/agents/cron`; `apps/openapi/openapi.yaml:333-334`
  references it. `apps/openapi/apps/telegram/paths.yaml` documents the operator
  header and a 401 response on the Telegram control routes.
- No match for the route in `apps/host`, `apps/mcp`, `apps/telegram`, the agent
  SDKs and frontend, or any spec.

### 4. Route guards and middleware placement

- `libs/shared/backend/api/src/lib/controllers/interface.ts:14-19`:
  `IHttpRoute.middlewares?: ReturnType<typeof createMiddleware>[]`.
- `libs/shared/backend/api/src/lib/app/default/index.ts:72-82`: each route
  middleware is registered with `this.hono.use(route.path, middleware)` before
  the handler, so it applies to every method on that path and runs after the
  global middlewares of `apps/api/app.ts`.
- `libs/middlewares/src/lib/operator-secret/index.ts:24-33`: one 401
  `Unauthorized` for every refusal; the check is
  `rbacSecretMatches(readRbacSecret(c))`.
- `libs/middlewares/src/lib/http-cache/index.ts:410-424` binds the
  operator-secret guard to `/api/http-cache/clear` because that route is
  registered before is-authorized (#277). `apps/telegram/src/lib/controller.ts:24-47`
  lists the guard in the route table of `/run` and `/stop`.
- `libs/modules/rbac/models/subject/backend/app/middlewares/index.ts` and
  `src/index.ts:1-20` export `Middleware` classes under `Request...` names with
  `IMiddlewareGeneric` interfaces; the subject controller imports them from
  `../../../../../middlewares` (`controller/singlepage/index.ts:7-13`).
- `apps/api/README.md:15`: middlewares from `libs/middlewares` are instantiated
  only in `apps/api`, and modules never import them.
  `libs/middlewares/src/lib/actions-logger/index.ts:16` imports
  `@sps/agent/models/agent/sdk/server`.
- The agent module's unit lane is `@sps/agent:jest:test`
  (`libs/modules/agent/jest.config.ts`), which covers every spec under
  `libs/modules/agent`.

### 5. Constant-time comparison and environment values

- `libs/shared/backend/utils/src/lib/rbac-secret/index.ts:12-14`
  `readRbacSecret(c)`: header, then cookie. `:23-36` `rbacSecretMatches(provided)`:
  false when `RBAC_SECRET_KEY` or the candidate is empty, length check, then
  `timingSafeEqual`. Exported from `libs/shared/backend/utils/src/lib/index.ts:10`;
  used by the operator-secret middleware and
  `billing/.../provider-webhook/index.ts:170`. `index.spec.ts` covers match,
  one-byte miss, length mismatch, empty inputs and unset configuration.
- `libs/shared/utils/src/lib/envs/artificial-intelligence.ts:1-2` holds
  `AGENT_MAX_DURATION_IN_SECONDS`, the existing agent setting; `envs/telegram.ts:5-9`
  documents a secret with no default that fails closed.
- `libs/shared/utils/src/lib/secret-strength/index.ts:19-26` lists the secrets
  the API boot check assesses; only `RBAC_SECRET_KEY` and `RBAC_JWT_SECRET` are
  fatal (`:33`).
- `apps/api/create_env.sh:81-92` generates the local secrets with
  `generate_secret 32`.

### 6. Certificates on the cron call

- With `USE_CLOUDFLARE_SSL=true` the DNS record is proxied
  (`tools/deployer/cloudflare/dns_records.yaml:44-55`) and Traefik serves a
  Cloudflare Origin CA certificate (`cloudflare/create_ssl_certificate.yaml:47-65`).
  A lookup of the API hostname from the server returns Cloudflare's edge, which
  presents a publicly trusted certificate.
- Otherwise `domain.sh:34-39` issues a Let's Encrypt certificate through
  Certbot and Traefik serves it for the hostname.
- The job calls the public hostname, so both modes present a publicly trusted
  chain to curl. A server that resolved the hostname to its own origin while
  Traefik held an Origin CA certificate would fail verification.

### 7. Traefik

- `tools/deployer/traefik/docker-compose.traefik.yaml.j2:11-21`: command flags
  for the log level, API, Swarm and file providers and the two entrypoints; no
  `--accesslog`. `:26-46`: labels define `redirect-to-https`, the redirect
  router, the dashboard router and its `admin` basic-auth middleware. No
  `logging` block.
- `tools/deployer/traefik/traefik.yml.j2:1-4` holds only `tls.certificates`.
  `create_traefik.yaml:48-57` writes it only when `/home/code/traefik.yml` is
  absent; `add_service_cert_to_traefik.yaml` and `yaml_editor.py` then edit it.
  `create_traefik.yaml:59-64` renders the compose file on every run.
- `api/docker-compose.api.yaml.j2:13-30`, `host/docker-compose.host.yaml.j2:13-30`,
  `mcp/docker-compose.mcp.yaml.j2:11-28` and
  `telegram/docker-compose.telegram.yaml.j2:11-28`: `json-file` logging with
  `max-size: "10m"` and `max-file: "3"`, and routers with entrypoint, TLS and
  host rule but no middleware.
- `tools/deployer/server/install_docker.yaml:66-72` writes `daemon.json` with the
  image-store setting only.
- `tools/deployer/up.sh:8-19` deploys Traefik before the api, mcp, telegram and
  host stacks.
- Traefik v3 references a middleware from another Swarm service as
  `<name>@swarm`, and an unsuffixed name resolves within the declaring provider.
  A router whose middleware does not exist is reported with
  `middleware "<name>@<provider>" does not exist` and is not served. Access logs
  go to stdout by default, and request header values are dropped by default
  (`accesslog.fields.headers.defaultmode=drop`). The headers middleware adds
  `Strict-Transport-Security` on TLS requests unless `forceSTSHeader` is set.
- Traefik issue #9363 (closed as frozen, no fix recorded) reports that a
  middleware defined in the Traefik service's own labels is missing after about
  one restart in ten, so routers of other services that reference it fail with
  the error above. `traefik/add_service_cert_to_traefik.yaml:24-27` runs
  `docker service update traefik_traefik --force`, and `domain.sh:41-43` runs
  that play on every service deployment, so Traefik restarts on each rollout.
  The dashboard router uses the `admin` middleware defined in the same service's
  labels, which keeps the router and its middleware in one label set.

### 8. Ansible and SSH

- `tools/deployer/ansible.cfg:1-7`: `inventory = inventory.yaml`,
  `host_key_checking = False`, `deprecation_warnings = False`, and
  `[ssh_connection] retries=10`. No `ssh_args`, so Ansible's default
  `-C -o ControlMaster=auto -o ControlPersist=60s` applies.
- `tools/deployer/create_inventory.sh:87-103` writes `inventory.yaml` with
  `ansible_ssh_common_args: '-o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=/dev/null'`
  (`:92`) and either a private key or `ansible_password` (`:98-102`). Every
  service script runs `./create_inventory.sh` first, so the generated file is
  the one Ansible reads.
- `tools/deployer/inventory.yaml.example:3` and
  `tools/deployer/actions/inventory.yaml.example:3` carry the same common args.
- The OpenSSH connection plugin adds `-o StrictHostKeyChecking=no` when host key
  checking is off, before the inventory's common args; `ssh` keeps the first
  value it reads for an option.
- Password authentication goes through `sshpass`. With
  `StrictHostKeyChecking=accept-new`, `ssh` records an unknown key without
  prompting, so `sshpass` sees no host-key prompt; a changed key still fails.
- GitHub-hosted runners start each run with an empty `~/.ssh/known_hosts`.

## Code References

- `tools/deployer/api/set_cron_jobs.yaml:1-16` - root crontab line with `curl -k` and the operator secret
- `tools/deployer/api.sh:26-27,119-189` - secrets read and the `up` chain
- `tools/deployer/api/api.env.j2:22-27` - RBAC secrets in the API env
- `tools/deployer/.env.example:134-139` - RBAC secret placeholders
- `tools/deployer/github_deployer.sh:89-92,141-243` - GitHub secret sync
- `.github/workflows/ansible.yml:32-269` - CI env file assembly
- `tools/deployer/redis.sh:16-22` - refusal on a missing secret
- `apps/api/app.ts:171-180` - global is-authorized and the agent mount
- `libs/middlewares/src/lib/is-authorized/index.ts:40-121` - authorization order
- `libs/middlewares/src/lib/is-authorized/routes/singlepage.ts:9-76` - framework allow-list
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/index.ts:29-139` - agent route table
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/cron.ts:21-243` - cron dispatcher
- `libs/shared/backend/api/src/lib/app/default/index.ts:72-82` - route middleware registration
- `libs/shared/backend/utils/src/lib/rbac-secret/index.ts:1-36` - constant-time comparison
- `libs/middlewares/src/lib/operator-secret/index.ts:1-34` - operator-secret guard
- `libs/modules/rbac/models/subject/backend/app/middlewares/src/index.ts:1-20` - module middleware package
- `libs/shared/utils/src/lib/envs/artificial-intelligence.ts:1-2` - agent environment values
- `tools/deployer/traefik/docker-compose.traefik.yaml.j2:1-51` - Traefik service
- `tools/deployer/traefik/create_traefik.yaml:48-64` - which Traefik files are re-rendered
- `tools/deployer/ansible.cfg:1-7` - Ansible defaults
- `tools/deployer/create_inventory.sh:87-103` - generated inventory

## Architecture Documentation

- Access control is two layers: the global is-authorized middleware, then route
  middleware bound in a controller's route table. A route that takes a
  credential other than the operator secret or a JWT is opened in the allow-list
  and guarded on the route.
- The operator secret is read by one helper and compared by one constant-time
  function in `@sps/backend-utils`; guards decide only the refusal.
- Framework defaults live in `singlepage` files (allow-list, controllers); a
  project extends them through `startup` files and constructor options.
- Deployer secrets are operator supplied, transported through
  `tools/deployer/.env`, the GitHub secret sets and the Jinja templates, and
  never generated by the deployer.
- The Traefik service's labels define the middlewares its own routers use
  (`redirect-to-https`, `admin`); service stacks carry their own routers and
  define no middleware.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-223.md:305-320` traces the
  cron trigger through Traefik and notes that the curl call sets no timeouts.
- `thoughts/shared/research/singlepagestartup/ISSUE-234.md:34,120` describes the
  dispatcher and its per-minute trigger.
- `thoughts/shared/research/singlepagestartup/ISSUE-233.md:51,193` records that
  Traefik has no access log.
- Commits `bf7127bcd3` (#276), `a820f34b3f` and `368d8fa6a9` (#277) bind guards
  to routes rather than to the allow-list, and introduce the shared primitive.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-223.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-233.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-234.md`

## Open Questions

None blocking. Two items sit outside the agreed scope: `server.sh` passes the
operator secret to a play that does not use it, and CI runners trust the host
key they see first on every run unless the key is pinned.
