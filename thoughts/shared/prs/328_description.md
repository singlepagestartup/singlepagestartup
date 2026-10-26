Closes #319.

## Summary

The deployer installed a root crontab line that called the agent cron route every minute with the operator secret (`RBAC_SECRET_KEY`, the full authorization bypass) on its command line and with certificate verification off (`curl -k`). Traefik kept no access log, the public routers sent no security headers, and Ansible accepted whatever host key a server presented.

After this change:

- `POST /api/agent/agents/cron` admits a dedicated `AGENT_CRON_SECRET` in `X-AGENT-CRON-SECRET`, or the operator credential, and nothing else. The crontab holds only the cron secret and verifies the certificate.
- Traefik writes a JSON access log without header values, with log rotation, and the api, host, mcp and telegram routers send HSTS, `nosniff` and a referrer policy.
- Ansible records a new server's host key once and refuses a changed one, with key or password authentication.

The per-minute schedule and password SSH keep working. CORS, uploads, the anonymous cart, framed widgets and MCP OAuth are not touched.

## Changes

### Agent cron route (`39a1b6b0ce`)

- `libs/modules/agent/models/agent/backend/app/middlewares/` (new package, shaped like the rbac subject middleware package): `RequestCanRunCron` admits `rbacSecretMatches(readRbacSecret(c))`, the operator secret in the header or the `rbac.secret-key` cookie, or `secretMatches(AGENT_CRON_SECRET, X-AGENT-CRON-SECRET)`, and throws one 401 `Unauthorized` otherwise. An unset `AGENT_CRON_SECRET` matches nobody.
- `.../controller/singlepage/index.ts`: the guard is bound to `POST /cron` in the route table.
- `libs/middlewares/src/lib/is-authorized/routes/singlepage.ts`: an anchored `POST /api/agent/agents/cron$` allow rule. Route middleware runs after is-authorized, so without the rule the cron secret would never reach the guard; for this route the guard is the whole check, and a project can subtract the rule through `routes/startup.ts`.
- `libs/shared/backend/utils/src/lib/rbac-secret/index.ts`: the constant-time comparison becomes `secretMatches(configured, provided)`; `rbacSecretMatches` delegates to it.
- `libs/shared/utils/src/lib/envs/artificial-intelligence.ts`: `AGENT_CRON_SECRET`, no default. `apps/api/create_env.sh` generates one for new local environments.
- Deployer: `tools/deployer/.env.example`; `api.sh` reads the value, refuses to deploy while it is empty, and passes it to both plays; `api/api.env.j2`; `api/set_cron_jobs.yaml` (cron header, no `-k`, `no_log`); `github_deployer.sh` and `.github/workflows/ansible.yml` (production and `PREVIEW_` secrets).
- Docs: the OpenAPI path (both headers, 401), the agent model README, and the deployer README (secret list, rotation rows, an "Agent cron" section with the certificate note).

### Traefik (`5fdbc85ef1`)

- `tools/deployer/traefik/docker-compose.traefik.yaml.j2`: `--accesslog=true`, `--accesslog.format=json`, `--accesslog.fields.headers.defaultmode=drop`, and `json-file` rotation at 10 MB x 3.
- `tools/deployer/{api,host,mcp,telegram}/docker-compose.*.yaml.j2`: each router attaches `<service>-security-headers`, defined in the same labels with `stsseconds=31536000`, `contenttypenosniff=true` and `referrerpolicy=strict-origin-when-cross-origin`.
- Deployer README section "Traefik access log and security headers".

### SSH host keys (`483dcfed65`)

- `tools/deployer/ansible.cfg`: `host_key_checking = True`.
- `tools/deployer/create_inventory.sh` and both inventory examples: `-o StrictHostKeyChecking=accept-new` without `-o UserKnownHostsFile=/dev/null`.
- Deployer README: first connection, rebuilt servers (`ssh-keygen -R`), CI runners.

### Records (`5f8e22704a`)

- Research, plan, process log and progress file for #319 under `thoughts/shared/`.

## Verification

- [x] `npx nx run @sps/agent:jest:test`: 18 suites, 95 tests (new `request-can-run-cron` suite, 7 tests).
- [x] `npx nx run @sps/backend-utils:jest:test`: 6 suites, 129 tests.
- [x] `npx nx run @sps/middlewares:jest:test`: 10 suites, 65 tests.
- [x] Mutation checks: a pass-through in place of the guard fails 5 of its 7 tests; `===` in place of `secretMatches` fails the two unset-secret tests; removing the allow rule fails its case; a `secretMatches` that admits an unset secret fails 3 primitive tests and 2 guard tests.
- [x] `eslint:lint` for `@sps/agent`, `@sps/backend-utils` and `@sps/shared-utils`, and eslint on the changed `libs/middlewares` files.
- [x] `tsc --noEmit` for `libs/modules/agent`, `libs/middlewares`, `libs/shared/backend/utils` and `libs/shared/utils`: 0 errors, as before the change.
- [x] HTTP on a local API (port 4319) with throwaway secrets and a throwaway, freshly migrated database: cron secret 200; operator header 200; operator cookie 200; no credential 401; wrong cron secret 401; cron secret in `X-RBAC-SECRET-KEY` 401; cron secret on `POST /api/agent/agents/dummy` 403 and on `GET /api/agent/agents/cron` 403.
- [x] `ansible-playbook --syntax-check` for `api/set_cron_jobs.yaml`, `api/create_api.yaml`, `traefik/create_traefik.yaml`, `host/create_host.yaml`, `mcp/create_mcp.yaml` and `telegram/create_telegram.yaml`.
- [x] Templates rendered with Ansible's Jinja2 and strict undefined variables: the cron job is one line with the cron header, no `-k` and no operator header; `api.env` carries `AGENT_CRON_SECRET` only when it is set; the five compose files parse and pass `docker compose config`.
- [x] `api.sh up` with an empty `AGENT_CRON_SECRET`: exit 1 with an error, before any DNS or Ansible step.
- [x] Against a throwaway `sshd` on 127.0.0.1: the new settings record host key A and connect twice, then refuse the server once it presents key B; the previous settings connect to key B. `sshpass` reaches authentication with `accept-new` and fails with "Host key verification failed" under the SSH default.
- [ ] On a deployed server, not run here: `./up.sh`, then the checks under Downstream migration.

## Notes

- A JWT holding the root permission no longer opens `POST /api/agent/agents/cron`; the route answers to the two secrets only. Nothing in the frontend, the SDKs, MCP, Telegram or the tests calls it.
- The dispatcher still calls each due agent's route with the operator secret from the API's own environment; that secret stays inside the API process.
- The headers middleware is defined per service, beside its router, not once on the Traefik service. Traefik restarts on every service deployment, and a middleware defined on its own labels can be missing after a restart ([traefik/traefik#9363](https://github.com/traefik/traefik/issues/9363)), which would stop every router that references it.
- Not in this change: a TLS minimum version (Traefik 3 defaults to TLS 1.2), a Content-Security-Policy or frame policy (pages embed widgets in frames), HSTS `includeSubDomains` or `preload`, and host key pinning for CI runners (the deployer README says how).
- `AGENT_CRON_SECRET` is not part of the API boot strength check: an absent value is a valid setting that leaves the route to the operator secret.

## Downstream migration

Adaptation is required for every project that deploys with `tools/deployer`.

**Applies to:** projects that deploy with `tools/deployer`, locally or through the ansible workflow; projects that call `POST /api/agent/agents/cron` from anything other than the deployer crontab; projects whose startup agent controller rebinds the agent routes; projects with their own compose templates, additional browser-facing Traefik routers, or their own inventory or `ansible.cfg`.

**New environment variable:**

| Variable            | Where                                                                                                          | Meaning                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENT_CRON_SECRET` | `tools/deployer/.env`, repository secrets `AGENT_CRON_SECRET` and `PREVIEW_AGENT_CRON_SECRET`, API environment | Opens `POST /api/agent/agents/cron` and nothing else; the crontab sends it in `X-AGENT-CRON-SECRET`, and `api.sh` refuses to deploy without it |

**Actions:**

- Generate `AGENT_CRON_SECRET` with `openssl rand -hex 32`, add it to `tools/deployer/.env` and to both repository secrets (`github_deployer.sh` syncs it), then run `./api.sh up` once so the API environment and the crontab receive it. Until then the existing crontab keeps working, because the route still admits the operator secret.
- Point any other caller of the cron route at `X-AGENT-CRON-SECRET` or the operator credential; a JWT is no longer accepted there.
- A startup controller that rebinds the agent routes keeps `RequestCanRunCron` on `POST /cron`, because the allow rule lets the request past is-authorized.
- Run `./up.sh`, or `./traefik.sh up` plus each service's script, so the access log and the headers reach the server. Give any project router that serves browsers the same three header labels under a middleware named after that router, and keep a CSP or frame policy in the application.
- After rebuilding a server on the same address, remove its old entry with `ssh-keygen -R <host>`, or `ssh-keygen -R '[<host>]:<port>'` for a port other than 22. Remove `-o UserKnownHostsFile=/dev/null` from any project inventory or `ansible.cfg`, keep `-o StrictHostKeyChecking=accept-new`, and set `host_key_checking = True`.

**Verify:** `sudo crontab -l` shows the agent line with `X-AGENT-CRON-SECRET` and without `-k` or `X-RBAC-SECRET-KEY`; `/home/code/api_agent_agents_cron.log` receives a JSON body with a `data` array each minute; `curl -sI` against the api, host, mcp and telegram hostnames shows `Strict-Transport-Security`, `X-Content-Type-Options` and `Referrer-Policy`; `docker service logs traefik_traefik` shows JSON access lines without header values; `ansible all -m ping`, run twice from `tools/deployer`, succeeds and records the host key once.
