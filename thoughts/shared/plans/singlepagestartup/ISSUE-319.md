---
date: 2026-09-26T00:25:00+03:00
issue_number: 319
repository: singlepagestartup
topic: "Harden the deployer edge and server configuration"
status: approved
---

# Harden the deployer edge and server configuration Implementation Plan

## Overview

Give the agent cron route a secret that opens nothing else and move the server
crontab onto it with TLS verification, add a Traefik JSON access log and
security headers on the four public routers, and make Ansible remember and
enforce server host keys.

## Current State Analysis

Research: `thoughts/shared/research/singlepagestartup/ISSUE-319.md`.

- Root's crontab calls `POST /api/agent/agents/cron` every minute with
  `curl -k` and the operator secret on the command line
  (`tools/deployer/api/set_cron_jobs.yaml:9-16`).
- The route has no guard of its own; is-authorized admits the operator secret
  and, through the root permission, admin JWTs
  (`libs/middlewares/src/lib/is-authorized/index.ts:60-117`). The crontab is its
  only caller.
- Traefik has no access log, no log rotation and no headers middleware
  (`tools/deployer/traefik/docker-compose.traefik.yaml.j2`).
- `host_key_checking = False` (`tools/deployer/ansible.cfg:3`) and the generated
  inventory's `UserKnownHostsFile=/dev/null` (`tools/deployer/create_inventory.sh:92`)
  together accept any host key on every connection.

## Desired End State

- `POST /api/agent/agents/cron` admits the operator secret (header or cookie)
  or `AGENT_CRON_SECRET` in the `X-AGENT-CRON-SECRET` header, both compared in
  constant time, and answers every other request with one 401. The cron secret
  opens no other route. Without `AGENT_CRON_SECRET` configured, only the
  operator secret opens the route.
- The crontab sends `X-AGENT-CRON-SECRET` without `-k`; the cron task runs with
  `no_log`. `api.sh` refuses to deploy while `AGENT_CRON_SECRET` is empty, and
  the value reaches the API env, the GitHub secret sync and the CI env file.
- Traefik writes a JSON access log to stdout with header values dropped, and its
  container log rotates at 10 MB x 3.
- The api, host, mcp and telegram routers each attach a headers middleware
  defined in the same label set: HSTS `max-age=31536000`, `nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`.
- Ansible records a new server's host key once and refuses a changed one, with
  key or password authentication.

Verification: unit specs with a mutation check, an HTTP proof on port 4319,
`ansible-playbook --syntax-check`, rendered templates parsed as YAML and checked
by `docker compose config`, the generated inventory, and an SSH run against a
throwaway local `sshd` showing a key accepted once and a changed key refused.

### Key Discoveries

- Route middleware runs after is-authorized
  (`libs/shared/backend/api/src/lib/app/default/index.ts:72-82`), so a route
  opened by a credential other than the operator secret needs an allow rule and
  a guard bound to the route, as the http-cache clear route (#277) and the
  Telegram control routes carry theirs.
- Modules never import `@sps/middlewares` (`apps/api/README.md:15`), and
  `@sps/middlewares` imports the agent server SDK
  (`libs/middlewares/src/lib/actions-logger/index.ts:16`); the guard therefore
  goes in a new agent-model middleware package shaped like
  `libs/modules/rbac/models/subject/backend/app/middlewares` and uses the
  `@sps/backend-utils` primitives the operator-secret middleware uses.
- `rbacSecretMatches` hard-wires `RBAC_SECRET_KEY`
  (`libs/shared/backend/utils/src/lib/rbac-secret/index.ts:23-36`); the same
  file gains the generic comparison it is built on.
- Traefik restarts on every service deployment
  (`tools/deployer/traefik/add_service_cert_to_traefik.yaml:24-27`), and a
  middleware defined on the Traefik service's own labels can be missing after a
  restart (traefik/traefik#9363), which would stop serving every router that
  references it. Defining the middleware in each service's own labels, as the
  dashboard router does with `admin`, keeps router and middleware together and
  removes any deployment-order dependency.
- The cron call targets the public hostname; Cloudflare's edge or the Let's
  Encrypt certificate is publicly trusted in both certificate modes.

## What We're NOT Doing

- No TLS minimum version: Traefik 3 defaults to TLS 1.2.
- No `Content-Security-Policy` and no frame policy: pages embed widgets in
  frames, and Next.js pages need a policy written per application.
- No HSTS `includeSubDomains` or `preload`: the host may run on the apex domain,
  and sibling hostnames outside this deployer would be pinned too.
- Password SSH, the dev compose ports and the LLM service stay as they are.
- The cron schedule, the per-agent calls (which keep using the operator secret
  inside the API process) and the curl output handling stay as they are.
- `AGENT_CRON_SECRET` does not join the API boot strength check: a missing
  value is a valid configuration that leaves the route to the operator secret.
- The plain comparison in is-authorized stays; it is tracked as #295.
- CI runners start with an empty `known_hosts` and keep trusting the first key
  per run; pinning is documented, not built.
- `server.sh` keeps passing the operator secret to a play that ignores it.

## Trade-offs

- A JWT holding the root permission no longer opens `POST /api/agent/agents/cron`,
  because the route leaves is-authorized for its own guard. No frontend, SDK,
  MCP, Telegram or test code calls the route; operators use the operator secret.
- A deployment whose `tools/deployer/.env` or GitHub secrets lack
  `AGENT_CRON_SECRET` stops at `api.sh` with an error instead of installing a
  crontab that would be refused. Until the operator adds the value, the existing
  crontab and API keep working, because the route still admits the operator
  secret.

## Use Cases Kept

- Cross-origin API access: CORS and is-authorized are unchanged apart from one
  anchored `POST` rule; the headers middleware adds response headers only.
- File uploads and the anonymous cart: no route, body or authorization change.
- Local development against a tunnel: Traefik is not involved; a local `.env`
  without `AGENT_CRON_SECRET` keeps the route on the operator secret.
- MCP OAuth: the MCP router gains response headers only; the referrer policy
  equals the browser default.
- Widgets in frames: no frame policy is sent.
- Telegram webhook and control routes: response headers only.

## Implementation Approach

Four phases in dependency order: the API accepts the new secret, the deployer
transports it and moves the crontab onto it, then the edge and SSH changes,
which are independent of the first two.

## Phase 1: Cron secret in the API

### Changes Required:

#### 1. Environment value

**File**: `libs/shared/utils/src/lib/envs/artificial-intelligence.ts`
**Why**: agent settings live here (`AGENT_MAX_DURATION_IN_SECONDS`).
**Changes**: add `AGENT_CRON_SECRET` with no default and a comment on what it
opens.

#### 2. Constant-time comparison for any configured secret

**File**: `libs/shared/backend/utils/src/lib/rbac-secret/index.ts`, `index.spec.ts`,
`libs/shared/backend/utils/src/lib/index.ts`
**Why**: the cron guard must use the same primitive as the operator secret.
**Changes**: extract `secretMatches(configured, provided)`; `rbacSecretMatches`
delegates to it; export it; add BDD cases for a non-operator secret.

#### 3. Agent-model middleware package with the cron guard

**File**: `libs/modules/agent/models/agent/backend/app/middlewares/index.ts`,
`src/index.ts`, `src/lib/request-can-run-cron/index.ts`, `index.spec.ts`
**Why**: route middleware lives in the module's middleware package.
**Changes**: `Middleware` admits `rbacSecretMatches(readRbacSecret(c))` or
`secretMatches(AGENT_CRON_SECRET, X-AGENT-CRON-SECRET)`, otherwise throws 401
`Unauthorized`; exported as `RequestCanRunCron`. The spec covers each
credential, cross-header use, one-byte misses, identical refusals that name no
header, and an unset or empty cron secret.

#### 4. Bind the guard and open the route in the allow-list

**File**: `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/index.ts`,
`libs/middlewares/src/lib/is-authorized/routes/singlepage.ts`, `routes/index.spec.ts`
**Why**: the guard only runs if is-authorized lets the cron secret through.
**Changes**: `middlewares: [new RequestCanRunCron().init()]` on `POST /cron`;
an anchored `POST` rule for `/api/agent/agents/cron$`; a spec case that the rule
opens nothing else.

#### 5. Local generation and documentation

**File**: `apps/api/create_env.sh`,
`libs/modules/agent/models/agent/sdk/model/src/lib/paths.yaml`,
`libs/modules/agent/models/agent/README.md`
**Changes**: generate `AGENT_CRON_SECRET` with `generate_secret 32`; document
both headers and the 401 on the path; document who may call the route.

### Success Criteria:

#### Automated Verification:

- [ ] `npx nx run @sps/agent:jest:test`, `@sps/backend-utils:jest:test`, `@sps/middlewares:jest:test` pass
- [ ] `eslint:lint` passes for `@sps/agent`, `@sps/backend-utils`, `@sps/shared-utils`, and eslint on the changed `libs/middlewares` files
- [ ] `tsc --noEmit` for the four projects reports 0 errors (baseline 0)
- [ ] Mutation: removing the guard, or comparing with `===`, fails the new spec

#### Manual Verification:

- [ ] API on 4319: cron secret 200, operator header 200, operator cookie 200, no credential 401, wrong cron secret 401, cron secret in the operator header 401, cron secret on `POST /api/agent/agents/dummy` refused

---

## Phase 2: Deployer transport and crontab

### Changes Required:

**File**: `tools/deployer/.env.example`, `tools/deployer/api.sh`,
`tools/deployer/api/api.env.j2`, `tools/deployer/api/set_cron_jobs.yaml`,
`tools/deployer/github_deployer.sh`, `.github/workflows/ansible.yml`,
`tools/deployer/README.md`
**Why**: the value has to reach the API env and the crontab, locally and in CI.
**Changes**: placeholder with a comment; `api.sh` reads it, refuses an empty
value in the `up` branch as `redis.sh` does, and passes it to `create_api.yaml`
and `set_cron_jobs.yaml`; optional block in `api.env.j2`; crontab line with
`X-AGENT-CRON-SECRET`, no `-k`, `no_log: true`; secret sync and both CI env
lists; README: secret list, rotation rows, surviving copies, an "Agent cron"
section with the certificate note.

### Success Criteria:

#### Automated Verification:

- [ ] `ansible-playbook --syntax-check` passes for `api/set_cron_jobs.yaml` and `api/create_api.yaml` with a throwaway inventory
- [ ] Rendered `api.env.j2` contains the value only when set; the rendered cron job is one line with the header and without `-k`
- [ ] `bash -n` passes for `api.sh` and `github_deployer.sh`; the workflow parses as YAML

---

## Phase 3: Traefik access log and security headers

### Changes Required:

**File**: `tools/deployer/traefik/docker-compose.traefik.yaml.j2`,
`tools/deployer/{api,host,mcp,telegram}/docker-compose.*.yaml.j2`,
`tools/deployer/README.md`
**Changes**: `--accesslog=true`, `--accesslog.format=json`,
`--accesslog.fields.headers.defaultmode=drop` and a `json-file` logging block
(10m, 3) on Traefik; per service, a `<service>-security-headers` middleware
with `stsseconds=31536000`, `contenttypenosniff=true` and
`referrerpolicy=strict-origin-when-cross-origin`, attached to the service
router; README section on the access log and the headers.

### Success Criteria:

#### Automated Verification:

- [ ] Every changed template renders with example values, parses as YAML and passes `docker compose -f <rendered> config`
- [ ] Each service router references a middleware defined in its own labels; no CSP or frame option appears

---

## Phase 4: Ansible host key checking

### Changes Required:

**File**: `tools/deployer/ansible.cfg`, `tools/deployer/create_inventory.sh`,
`tools/deployer/inventory.yaml.example`, `tools/deployer/actions/inventory.yaml.example`,
`tools/deployer/README.md`
**Changes**: `host_key_checking = True`; common args
`-o StrictHostKeyChecking=accept-new` without `UserKnownHostsFile=/dev/null`;
README: first-connection behavior, `ssh-keygen -R` after a rebuild, the CI note.

### Success Criteria:

#### Automated Verification:

- [ ] `create_inventory.sh` with a throwaway env writes the new common args for key and password setups
- [ ] `ansible -vvvv` shows no `StrictHostKeyChecking=no` and no `/dev/null` known-hosts file
- [ ] Against a throwaway `sshd` on 127.0.0.1: first run records the key and succeeds, a changed host key is refused; the old settings accept the changed key

---

## Testing Strategy

### Unit Tests:

- Cron guard: each credential, cross-header use, one-byte miss, identical
  refusals, unset and empty cron secret, fail-open mutation.
- `secretMatches`: match, miss, length mismatch, unset or empty configuration.
- Allow-list: only `POST` on the exact cron path.

### Integration Tests:

- HTTP proof on port 4319 with throwaway secrets passed in the environment and
  a throwaway `cron` broadcast channel removed afterwards.

### Manual Testing Steps:

1. Boot the API on 4319 with throwaway `RBAC_SECRET_KEY` and `AGENT_CRON_SECRET`.
2. Call the cron route with each credential and without one; print status codes.
3. Call `POST /api/agent/agents/dummy` with the cron secret; expect a refusal.

## Performance Considerations

One extra constant-time comparison on the cron route; one access-log line per
request at the edge, bounded by the 30 MB log rotation.

## Migration Notes

1. Generate `AGENT_CRON_SECRET` (`openssl rand -hex 32`) into
   `tools/deployer/.env` and into the `AGENT_CRON_SECRET` and
   `PREVIEW_AGENT_CRON_SECRET` repository secrets (`github_deployer.sh` syncs it).
2. Run `./api.sh up` (or `./up.sh`): the API env and the crontab receive the
   value in one run, and the crontab stops holding the operator secret.
3. Run `./traefik.sh up` for the access log; each service's script applies its
   headers.
4. The first SSH connection records the host key; after a server rebuild on the
   same address, run `ssh-keygen -R <host>`.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-319.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-319.md`
