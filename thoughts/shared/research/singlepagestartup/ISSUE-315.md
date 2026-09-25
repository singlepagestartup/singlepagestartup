---
date: 2026-09-26T00:05:13+03:00
researcher: flakecode
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-315-host-revalidate-guard
repository: singlepagestartup
topic: "Review the host revalidation route access model"
tags: [research, codebase, host, revalidation, middlewares, agent, deployer, secrets]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Review the host revalidation route access model

**Date**: 2026-09-26T00:05:13+03:00
**Researcher**: flakecode
**Git Commit**: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
**Branch**: claude/issue-315-host-revalidate-guard
**Repository**: singlepagestartup

## Research Question

Issue #315 (finding SEC-25 of the 2026-09-25 security review) states that the
host's `GET /api/revalidate` revalidates any tag or path for any caller, and
that the API's revalidation middleware calls it without a credential and
without encoding the tag. This document checks both claims against the
worktree and records:

- every caller of the route, in the API, the modules, the host and the tools;
- what the tags and paths control on the host, which sizes the impact;
- how environment values reach the API and the host, locally and in
  deployment, and how an existing secret shared by two services is wired;
- which constant-time comparison primitives exist and which packages the host
  route can import;
- how the affected code is tested today.

Paths are relative to the repository root.

## Summary

- The claim about the route holds. `apps/host/app/api/revalidate/route.ts:7-32`
  reads `tag`, `path` and `type` from the query string and calls
  `revalidateTag` and `revalidatePath` with no credential, header or origin
  check. The host's Next.js middleware matcher excludes `/api`
  (`apps/host/middleware.ts:24-28`), so nothing runs in front of the handler.
- The impact is cache flushing on demand. The catch-all page caches for a day
  (`apps/host/app/[[...url]]/page.tsx:10`), the host SDK tags each cached API
  read with its route (`libs/shared/frontend/api/src/lib/actions/find/index.ts:44-45`),
  and `revalidatePath("/", "layout")` covers every page under the root layout.
  A caller who repeats that request keeps the host cache cold, so every page
  render fetches from the API again.
- The claim about the middleware holds. It appends the path to the URL
  unencoded and sends no header (`libs/middlewares/src/lib/revalidation/index.ts:126-132`).
  It ignores the response status and logs only a network error.
- Two API-side callers exist beyond the ticket: the API seed, which runs on
  every API container start, revalidates the root layout and sends
  `X-RBAC-SECRET-KEY` to the host (`apps/api/src/db/seed.ts:393-417`); and the
  agent module's host page-cache handler, which revalidates each page with an
  unencoded full URL (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts:69-85`).
- No browser caller reaches the route. The admin-v2 settings page would call
  it from the browser, but its import and mount are commented out
  (`apps/host/src/components/admin-v2/Component.tsx:66,206`). `global-error.tsx`
  and the host seed call `/api/revalidation/revalidate`, which has no handler.
- Secrets shared by two services follow one pattern: a constant with no
  default in `libs/shared/utils/src/lib/envs/*.ts`; generated locally by
  `apps/api/create_env.sh` and copied by the sibling app's `create_env.sh`; in
  deployment an operator-supplied placeholder carried by `tools/deployer/.env.example`,
  the service scripts, the `*.env.j2` templates, both secret lists of
  `.github/workflows/ansible.yml` and `tools/deployer/github_deployer.sh`. The
  deployer README states that the deployer generates no secret.
- Constant-time comparison exists twice: `rbacSecretMatches` in
  `@sps/backend-utils`, bound to `RBAC_SECRET_KEY`, and a private
  `secretsAreEqual` in `apps/mcp/lib/oauth.ts`. No runtime host file imports
  `@sps/backend-utils`, and `@sps/shared-utils` stays free of node built-ins
  because client components import it.
- The host tests route handlers by calling `GET` with a `NextRequest` under
  jest (`apps/host/app/api/telegram-generator/route.spec.tsx`). The
  revalidation middleware spec covers topic resolution only.

## Detailed Findings

### 1. The host route

- `apps/host/app/api/revalidate/route.ts:4-5` declares `dynamic = "force-dynamic"`
  and `runtime = "nodejs"`.
- `:7-11` reads `tag`, `path` and `type` from `request.url`.
- `:13-15` calls `revalidateTag(tag)` when `tag` is present.
- `:17-23` calls `revalidatePath(path, type)` when `type` is `page` or
  `layout`, otherwise `revalidatePath(path)`.
- `:25-31` answers 200 with `{ revalidated: { tag, path }, now }`.
- No branch reads a header, a cookie or the origin. Only `GET` is exported.
- `apps/host/middleware.ts:24-28`: the matcher's negative lookahead lists
  `api`, so the locale middleware does not run for `/api/*`.
- `apps/host/next.config.js:51-76` sets CORS headers on `/api/:path*`:
  `Access-Control-Allow-Origin` is `NEXT_PUBLIC_API_SERVICE_URL` with
  credentials, and `Access-Control-Allow-Headers` lists standard headers only.
  A cross-origin browser request cannot add a custom header without a
  preflight that this list refuses.

### 2. The API middleware call

- `libs/middlewares/src/lib/revalidation/index.ts:85-123`: after `next()`, a
  2xx `POST`, `PUT`, `PATCH` or `DELETE` that no skip-route matches throws
  when `RBAC_SECRET_KEY` is unset (`:99-103`), then, for the normalized path
  and the path without its trailing UUID (`:73-83`), broadcasts a WebSocket
  message and calls `void this.revalidateTag(payload)` (`:110-120`).
- `:126-132`: `revalidateTag` runs `fetch(HOST_SERVICE_URL + "/api/revalidate?tag=" + tag)`
  inside `try`, and logs a caught error with `console.log`. The status of the
  response is not read.
- `HOST_SERVICE_URL` comes from `libs/shared/utils/src/lib/envs/host.ts:15-16`,
  default `http://localhost:3000`. In deployment the API reaches the host over
  the Swarm network at `http://host:3000` (`tools/deployer/api/api.env.j2:1-4`).
- Skip-routes: `libs/middlewares/src/lib/revalidation/routes/singlepage.ts:10-27`
  (authentication, broadcast and RBAC action writes); `startup.ts` is empty;
  constructor options can add more (`apps/api/app.ts:153-154` passes none).

### 3. Other callers of the route

| Caller                                                                                              | Request                                | Credential today    | Notes                                                                                                                       |
| --------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `libs/middlewares/src/lib/revalidation/index.ts:128`                                                | `?tag=<path>`                          | none                | fire and forget, per mutation                                                                                               |
| `apps/api/src/db/seed.ts:409-417`                                                                   | `?path=/&type=layout`                  | `X-RBAC-SECRET-KEY` | skipped when `RBAC_SECRET_KEY` is unset (`:393-395`); the host never reads that header                                      |
| `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts:69-85` | `?path=<full page URL>&type=page`      | none                | awaited; a non-OK answer is logged as `Internal error. Failed to revalidate page` and the page is fetched anyway (`:39-54`) |
| `apps/host/src/components/admin-v2/settings-page/data.ts:23-31`                                     | `?path=/&type=layout` from the browser | none                | not rendered: import and mount commented out in `apps/host/src/components/admin-v2/Component.tsx:66,206`                    |
| `apps/host/app/global-error.tsx:57,69`                                                              | `/api/revalidation/revalidate?...`     | none                | no handler exists at that path                                                                                              |
| `apps/host/src/db/seed.ts:342-352`                                                                  | `/api/revalidation/revalidate?...`     | `X-RBAC-SECRET-KEY` | no handler at that path; no target runs this file                                                                           |
| `apps/studio/runnable/**` (four files)                                                              | endpoint text in prototype data        | —                   | design prototypes, not runtime                                                                                              |

- The API seed is not a one-off script in deployment: `start.sh:10-13` runs
  `./migrate.sh seed &` on every API container start, `migrate.sh:25-27` runs
  `npx nx run api:db:seed`, and `apps/api/project.json:147-158` runs
  `bun run src/db/seed.ts`. After the layout revalidation the seed schedules
  the agent page-cache job (`seed.ts:419-440`).
- MCP, Telegram, the server SDKs and the deployer contain no call to the
  route.

### 4. What the tags and paths control on the host

- `apps/host/app/[[...url]]/page.tsx:10`: `export const revalidate = 86400`.
  Every public page renders from the full route cache for up to a day.
- The host SDK tags cached reads with the API route:
  `find/index.ts:44-45` (`[route]`), `find-by-id/index.ts:42-43`
  (`[route, id].join("/")`), `count/index.ts:44-45` (`${route}/count`).
- The middleware's payloads are exactly those routes (normalized path, and the
  path without its trailing UUID), so a mutation refreshes the host's cached
  reads of that collection and entity. Without a working call, an edit made in
  the admin reaches the public pages only after the page's revalidate window.
- `apps/host/.env.production:15` sets `NEXT_PUBLIC_REVALIDATE=86400`;
  `.env.development` sets none.

### 5. How the API and the host receive environment values

Local development:

- `./up.sh` runs the root `create_env.sh`, which runs each app's
  `create_env.sh` in this order: db, redis, host, api, telegram, mcp
  (`create_env.sh:50-55`).
- `apps/api/create_env.sh` exits when `.env` exists (`:9-13`), then generates
  secrets with `generate_secret` (`:81-92`), including
  `MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET` (`:90-91`).
- `apps/mcp/create_env.sh:24-30` copies `RBAC_JWT_SECRET`, `RBAC_SECRET_KEY`
  and the MCP exchange secret from `../api/.env` with `get_env`
  (`tools/deployer/get_env.sh:3-25`), which prints an error and returns
  nothing when the file is absent.
- `apps/host/create_env.sh` exits when `.env.local` exists (`:8-12`), writes
  only Codespaces or Gitpod URLs, and reads nothing from a sibling app. It runs
  before the API's script, so `../api/.env` does not exist yet on a fresh
  checkout at that point.
- Both scripts exit early on an existing file, so an existing checkout never
  receives a new variable from them.

Deployment:

- The API container runs `./start.sh api`, which writes the process
  environment into `apps/api/.env` (`create_env.sh:3-11,33-36`). The host
  container runs `./start.sh host`, which writes `apps/host/.env.production`
  plus the process environment into `apps/host/.env.local`
  (`create_env.sh:13-26,28-31`).
- The process environment comes from the Swarm `env_file`:
  `/home/code/api.env` rendered from `tools/deployer/api/api.env.j2`
  (`tools/deployer/api/create_api.yaml:34-40`) and
  `/home/code/host.env.local` rendered from
  `tools/deployer/host/host.env.local.j2`
  (`tools/deployer/host/create_host.yaml:28-34`,
  `docker-compose.host.yaml.j2:8-9`). There is no `host.env.j2`.
- `tools/deployer/api.sh` and `tools/deployer/host.sh` read values from
  `tools/deployer/.env` with `get_env` and pass them to the playbooks with
  `-e`. `host.sh:10-37` reads no secret today; the host template holds only
  URLs, public payment identifiers, analytics identifiers and the static
  retention days.
- GitHub Actions deployments build `tools/deployer/.env` from repository
  secrets in two lists, `PREVIEW_`-prefixed (`.github/workflows/ansible.yml:32-150`)
  and default (`:151-269`), before running the service script.
  `tools/deployer/github_deployer.sh` uploads the same values from the
  operator's `.env` (`:10-139` reads, `:141-243` the `SECRETS` list).
- A Jinja template cannot call the shell's `generate_secret`, and `api.sh` and
  `host.sh` run as separate processes, so a value generated inside either
  script would differ between the two services.

### 6. Precedents for a secret shared by two services

- `MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET` (API and MCP):
  `apps/api/create_env.sh:90-91`, `apps/mcp/create_env.sh:26,30`,
  `tools/deployer/.env.example:125-126` (comment plus 64 `X` placeholder),
  `tools/deployer/api.sh:29,136`, `tools/deployer/mcp.sh:37,100`,
  `tools/deployer/api/api.env.j2:25`, `tools/deployer/mcp/mcp.env.j2:16`,
  `.github/workflows/ansible.yml:92,211`, `tools/deployer/github_deployer.sh:82,196`,
  `tools/deployer/README.md:136-141,180`, and the boot report list
  `libs/shared/utils/src/lib/secret-strength/index.ts:19-26`. The two apps
  read it from `process.env` directly rather than through an envs file, and
  the header name `x-mcp-internal-token-exchange-secret` is an inline literal
  on both sides (`apps/mcp/lib/oauth.ts:348`,
  `.../mcp/singlepagestartup-client.ts:148`).
- `TELEGRAM_SERVICE_WEBHOOK_SECRET` (Telegram and Telegram's servers):
  `libs/shared/utils/src/lib/envs/telegram.ts:5-9` documents "no default: an
  absent value must fail the service closed"; wired through
  `apps/telegram/create_env.sh:18-19`, `tools/deployer/.env.example:151-154`,
  `tools/deployer/telegram.sh:23,91`, `telegram/telegram.env.j2:8` and
  `.github/workflows/ansible.yml:114,233`. It is absent from
  `tools/deployer/github_deployer.sh`.
- Naming: shared secrets are named `<SERVICE>_SERVICE_<PURPOSE>_SECRET`, and
  host values use the `HOST_SERVICE_` prefix (`HOST_SERVICE_URL`,
  `HOST_SERVICE_NAME`, `HOST_SERVICE_SUBDOMAIN`).
- Shared literals: `libs/shared/utils/src/lib/constants/index.ts:36-43` holds
  `RBAC_PRIVILEGED_CONTEXT_KEY`, a context key shared by a middleware and the
  REST boundary, with a JSDoc that names the issue.
- Rejection shape: `libs/middlewares/src/lib/operator-secret/index.ts:8-13,24-33`
  answers one 401 for a missing credential, a wrong one and an unconfigured
  service, so the caller cannot tell them apart.

### 7. Constant-time comparison and import boundaries

- `libs/shared/backend/utils/src/lib/rbac-secret/index.ts:23-36`:
  `rbacSecretMatches` refuses when `RBAC_SECRET_KEY` or the candidate is
  empty, compares byte lengths, then `timingSafeEqual`. It is bound to
  `RBAC_SECRET_KEY` and has no parameter for another secret.
- `apps/mcp/lib/oauth.ts:1038-1057,1080-1087`: the MCP app keeps its own
  private `secretsAreEqual` with the same length check and `timingSafeEqual`.
- `@sps/backend-utils` (`libs/shared/backend/utils/src/lib/index.ts:1-21`)
  exports the Bun WebSocket manager (`websocket-manager/index.ts:1` imports
  from `bun`), a pino-backed logger (`logger/providers/pino.ts:1`) and
  hono-based helpers. Within `apps/host`, only `src/db/dump.ts` and
  `src/db/seed.ts` import it, and no target runs either file.
- `@sps/shared-utils` is imported by client components;
  `libs/shared/utils/src/lib/secret-strength/index.ts:66-71` records that the
  package stays free of node built-ins for that reason.
- `@sps/shared-frontend-server-utils` exists and exports nothing
  (`libs/shared/frontend/server/utils/src/lib/index.ts`).
- The host route runs on the Node.js runtime (`route.ts:5`), where
  `node:crypto` is available.

### 8. Boot-time secret report

- `apps/api/server.ts:13-19` assesses every name in `CHECKED_SECRET_NAMES`
  and prints one `[secret-strength]` line per finding (`missing`, `short`,
  `legacy`), naming the key and never the value.
- `:21-38` stops the process only for the names in `FATAL_SECRET_NAMES`
  (`RBAC_SECRET_KEY`, `RBAC_JWT_SECRET`); every other finding is reported.

### 9. Tests

- Host: `apps/host/jest.config.ts` runs ts-jest against `tsconfig.spec.json`
  in a node environment. `apps/host/app/api/telegram-generator/route.spec.tsx`
  and `email-generator/index.html/route.spec.tsx` build a `NextRequest` and
  call the exported `GET`. No spec covers `api/revalidate`.
- Middleware: `libs/middlewares/src/lib/revalidation/index.spec.ts` mocks
  `@sps/backend-utils` to a `websocketManager` stub and tests
  `resolveBroadcastTopics` only. `revalidateTag` and `init()` have no test.
- Agent: `.../controller/singlepage/page/cache.spec.ts` mocks
  `@sps/shared-utils` to `HOST_SERVICE_URL` and `RBAC_SECRET_KEY`, and replaces
  `revalidatePage` with a spy, so the request it sends is untested.
- Boot report: `libs/shared/utils/src/lib/secret-strength/index.spec.ts:96-122`
  asserts the assessed names and verdicts in `CHECKED_SECRET_NAMES` order.
- Baseline at `78d7d43125`: `host:jest:test` 2 suites and 14 tests,
  `@sps/middlewares:jest:test` 10 and 64, `@sps/shared-utils:jest:test` 12
  and 74, `@sps/agent:jest:test` 17 and 88, all passing.

## Code References

- `apps/host/app/api/revalidate/route.ts:7-32` - the unauthenticated handler.
- `apps/host/middleware.ts:24-28` - matcher that skips `/api`.
- `apps/host/next.config.js:51-76` - CORS headers for `/api/*`.
- `apps/host/app/[[...url]]/page.tsx:10` - one-day page revalidation window.
- `libs/shared/frontend/api/src/lib/actions/find/index.ts:44-45` - route tags on cached reads.
- `libs/middlewares/src/lib/revalidation/index.ts:97-132` - mutation branch and the host call.
- `apps/api/src/db/seed.ts:393-417` - boot-time layout revalidation with the RBAC header.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts:69-85` - page revalidation.
- `apps/host/src/components/admin-v2/settings-page/data.ts:23-31` - unmounted browser action.
- `apps/host/app/global-error.tsx:57,69` - calls to a path with no handler.
- `libs/shared/utils/src/lib/envs/host.ts:15-16` - `HOST_SERVICE_URL`.
- `libs/shared/utils/src/lib/envs/telegram.ts:5-9` - a secret with no default.
- `libs/shared/utils/src/lib/constants/index.ts:36-43` - a shared key constant.
- `libs/shared/utils/src/lib/secret-strength/index.ts:19-35` - boot report lists.
- `libs/shared/backend/utils/src/lib/rbac-secret/index.ts:23-36` - constant-time comparison bound to the RBAC secret.
- `libs/middlewares/src/lib/operator-secret/index.ts:8-33` - one refusal for every rejection.
- `apps/mcp/lib/oauth.ts:1038-1057,1080-1087` - a private constant-time comparison in an app.
- `create_env.sh:13-31,50-55` - runtime env materialization and local script order.
- `apps/api/create_env.sh:81-92`, `apps/mcp/create_env.sh:24-30`, `apps/host/create_env.sh:1-51` - local env generation.
- `tools/deployer/api.sh:29,136,152`, `tools/deployer/host.sh:10-37,73-92` - deployer transport.
- `tools/deployer/api/api.env.j2:1-4,25`, `tools/deployer/host/host.env.local.j2:1-30` - service templates.
- `.github/workflows/ansible.yml:32-269`, `tools/deployer/github_deployer.sh:10-243` - GitHub secret lists.
- `tools/deployer/README.md:126-200` - secret generation and rotation.

## Architecture Documentation

- The API owns data; the host renders it with Next.js and caches both pages
  and API reads. The API pushes freshness to the host over HTTP (this route)
  and to browsers over the `/ws/revalidation` WebSocket.
- Environment values are read through `@sps/shared-utils` envs files; a
  secret with no default fails closed where it is checked.
- Framework defaults live in `singlepage` files and project overrides in
  `startup` files or constructor options; the revalidation middleware follows
  that layering for topic rules and skip-routes.
- Shared secrets between services are operator-supplied in deployment and
  generated by the API's bootstrap script locally.

## Historical Context (from thoughts/)

- The 2026-09-19 audit (local branch `security/audit-2026-09-19`, appendix
  `2026-09-19-audit-appendix-apps.md`, finding A-4) described the same open
  route and suggested a timing-safe header check plus `encodeURIComponent(tag)`
  at the middleware call. Its remediation plan named the variable
  `HOST_REVALIDATION_SECRET`.
- The 2026-09-25 review's SEC-25 row names the revalidation route only, and
  this issue covers that route.
- `thoughts/shared/research/singlepagestartup/ISSUE-223.md:220-223` recorded
  `revalidatePage` calling this route with `type=page`.

## Related Research

- `thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md` (SEC-25, embargoed).
- `thoughts/shared/research/singlepagestartup/ISSUE-223.md` - agent host page cache.
- `thoughts/shared/research/singlepagestartup/ISSUE-233.md` - HTTP cache and the seed's cache clear.

## Open Questions

- What the host does when it has no secret configured. Refusing keeps the
  route closed, and existing deployments lose host freshness until an
  operator sets the value on both services. Admitting keeps freshness and
  leaves those deployments open.
- How new deployments receive the value, given that the deployer transports
  operator-supplied secrets and cannot generate one value for two services.
