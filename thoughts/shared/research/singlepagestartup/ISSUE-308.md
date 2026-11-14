---
date: 2026-09-26T01:40:00+03:00
researcher: flakecode
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-308-allow-list-cors
repository: singlepagestartup
topic: "Anchor the remaining authorization allow rules and restrict CORS origins"
tags: [research, codebase, is-authorized, allow-list, rbac, broadcast, cors, api, telegram, openapi, deployer]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Anchor the remaining authorization allow rules and restrict CORS origins

**Date**: 2026-09-26
**Researcher**: flakecode
**Git Commit**: 78d7d43125
**Branch**: claude/issue-308-allow-list-cors
**Repository**: singlepagestartup

## Research Question

The ticket (findings SEC-27, SEC-05 and SEC-19 of the 2026-09-25 review)
states three things. Several `is-authorized` allow rules are unanchored and
admit more routes than they name, among them the channel messages route. The
API, Telegram and OpenAPI apps reflect any `Origin` with credentials allowed.
The origin write in `is-authorized` sets no header. This research checks each
claim against the tree, lists every route the affected rules admit and every
caller of those routes, and records what the CORS configuration serves today,
so the change can keep each legitimate caller working.

## Summary

- `is-authorized` lowercases the request path and skips the permission check
  when the path and method match an allow rule
  (`libs/middlewares/src/lib/is-authorized/index.ts:42-43,72-74`). The matcher
  runs `RegExp.test` on the path (`libs/shared/utils/src/lib/routes/index.ts:85`),
  so a rule without `^` and `$` matches any path that contains its text.
- None of the fourteen framework rules starts with `^`. Nine of them also have
  no `$` or end in `.*`
  (`libs/middlewares/src/lib/is-authorized/routes/singlepage.ts:10-42,72-75`);
  the four #276 module read rules and `permissions$` end in `$`.
  On the unfixed tree, an anonymous `GET /api/broadcast/channels/:id/messages`
  answered 200 with the message rows, `GET /api/agent/agents/favicon.ico`
  reached the agents find-by-id handler (500), and every `POST` under
  `/api/rbac/subjects/authentication/` passed the allow-list whether or not a
  route exists there.
- The subject controller registers 14 routes under
  `/api/rbac/subjects/authentication/`, each with one method. All of them are
  called without a session by design (first visit, login, OAuth, the
  middlewares' own checks). The only OAuth provider is `google`.
- The only caller that reads broadcast channels without a credential is the
  observer middleware's `channelApi.find` for the `observer` channel
  (`libs/middlewares/src/lib/observer/index.ts:73-85`). Its message read sends
  the operator secret (`:103-128`). The admin UI reads channels, messages and
  channel links with the admin's token.
- `permissions`, `roles-to-permissions` and `subjects-to-roles` are read by the
  admin UI with the admin's token, by the host's admin gate and account menu
  with the visitor's token, by the billing route check with the operator
  secret, and in process by the subject `is-authorized` service. No caller
  reads them without any credential except the admin-v2 overview cards, which
  request `.../count` routes during server rendering.
- All three apps pass the same `cors()` options with an `origin` function that
  echoes any non-empty `Origin` (`apps/api/app.ts:41-64`,
  `apps/telegram/app.ts:8-31`, `apps/openapi/app.ts:37-60`). Browser SDK calls
  use `credentials: "include"` and may send `X-RBAC-SECRET-KEY` from a
  browser cookie, so the allowed headers and the credential mode carry live
  traffic. The MCP app already has an optional origin list,
  `MCP_SERVICE_ALLOWED_ORIGINS`, wired through the deployer.
- `is-authorized/index.ts:50-58` compares the `Host` header with two origins
  and assigns a property on a `Headers` object. `Host` never carries a scheme,
  so the branch never runs, and the assignment would not set a header if it
  did.

## Detailed Findings

### How `is-authorized` uses the allow-list

- The middleware reads the method and the lowercased path
  (`is-authorized/index.ts:42-43`), then the operator secret from the
  `X-RBAC-SECRET-KEY` header or the `rbac.secret-key` cookie and the subject
  token from `Authorization` or the `rbac.subject.jwt` cookie (`:44-48`).
- A matching operator secret marks the request privileged and continues
  (`:60-70`). Otherwise an allow-list match continues without any check
  (`:72-74`). Every other request is decided by
  `subjectApi.authenticationIsAuthorized`, which forwards the caller's own
  credentials (`:76-113`), with a 30-second positive cache (`:28-29,83-91`).
- The allow-list is the composition of constructor options, the project
  `routes/startup.ts` (empty) and the framework `routes/singlepage.ts`
  (`is-authorized/routes/index.ts:18-26`). A `deny` rule in either project
  layer subtracts a framework rule (`libs/shared/utils/src/lib/routes/index.ts:96-122`).
- Hono routes strictly and case-sensitively: with the API's defaults
  `/api/broadcast/channels/` and `/API/broadcast/channels` answer 404 while
  `/api/broadcast/channels` reaches the handler (checked with a throwaway Hono
  app of the same shape). A path that matches a rule only after lowercasing
  therefore reaches no handler.

### What each current rule admits

Rules in `libs/middlewares/src/lib/is-authorized/routes/singlepage.ts`:

| Lines | Rule                                                                                      | Methods   | Admits beyond the named routes                                                                                                              |
| ----- | ----------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 10-13 | `/\/favicon.ico/`                                                                         | GET       | any path containing `/favicon` plus one character plus `ico`, such as `/api/agent/agents/favicon.ico`                                       |
| 14-17 | `/\/api\/broadcast\/channels/`                                                            | GET       | `/channels/count`, `/channels/:uuid`, `/channels/:id/messages`, and the `channels-to-messages` relation                                     |
| 18-22 | `/\/api\/rbac\/subjects\/authentication\/(is-authorized\|me\|init\|refresh\|bill-route)/` | GET, POST | the other method of each route, and any path that starts with one of the names, such as `.../authentication/meanwhile`                      |
| 23-26 | `/\/api\/rbac\/subjects\/authentication\/oauth\/.*/`                                      | GET, POST | any path under `oauth/`                                                                                                                     |
| 27-30 | `/\/api\/rbac\/subjects\/(authentication)\/(\w+)?/`                                       | POST      | every POST path under `/api/rbac/subjects/authentication/`                                                                                  |
| 31-34 | `/\/api\/rbac\/roles-to-permissions/`                                                     | GET       | the whole relation: find, count, find-by-id and any sub-path                                                                                |
| 35-38 | `/\/api\/rbac\/subjects-to-roles/`                                                        | GET       | the whole relation: find, count, find-by-id and any sub-path                                                                                |
| 39-42 | `/\/public\/file-storage\/.*/`                                                            | GET       | inert in `apps/api`: the `/public/*` handler is registered before the middlewares and answers every GET and HEAD (`apps/api/app.ts:69-114`) |
| 50-67 | host, website-builder, file-storage reads and three page reads (#276)                     | GET       | anchored at the end only                                                                                                                    |
| 68-71 | `/\/api\/rbac\/permissions$/`                                                             | GET       | anchored at the end only                                                                                                                    |
| 72-75 | `/\/api\/rbac\/permissions\/.*/`                                                          | GET       | every sub-path: count, find-by-id, `find-by-route`, `resolve-by-route`                                                                      |

The rule spec pins this breadth: "still opens the prefix siblings the rbac and
broadcast rules cover" asserts that `/api/broadcast/channels-to-messages/dump`
and `/api/rbac/subjects-to-roles/dump` pass
(`libs/middlewares/src/lib/is-authorized/routes/index.spec.ts:81-97`), and
"allows public framework endpoints" includes `GET /api/rbac/permissions`
(`:18-31`).

Baseline on the unfixed tree, API on port 4308, requests without credentials:

| Request                                           | Status                                  |
| ------------------------------------------------- | --------------------------------------- |
| `GET /favicon.ico`                                | 404                                     |
| `GET /api/agent/agents/favicon.ico`               | 500                                     |
| `GET /api/broadcast/channels`                     | 200                                     |
| `GET /api/broadcast/channels/:uuid`               | 200                                     |
| `GET /api/broadcast/channels/:id/messages`        | 200, one message row with its `payload` |
| `GET /api/broadcast/channels-to-messages`         | 200                                     |
| `GET /api/rbac/subjects/authentication/meanwhile` | 404                                     |
| `POST /api/rbac/subjects/authentication/unknown`  | 404                                     |
| `GET /api/rbac/permissions`                       | 200                                     |
| `GET /api/rbac/roles-to-permissions`              | 200                                     |

The two 404s show the allow-list letting the requests through to the router;
a request the allow-list refuses is answered by the permission service first.

### The authentication routes and their callers

`apps/api/app.ts:182` mounts the rbac module at `/api/rbac`, the module mounts
the subject model at `/subjects`
(`libs/modules/rbac/backend/app/api/src/lib/apps.ts:51-55`), and the startup
controller adds no routes
(`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/startup/index.ts:5-12`).
The singlepage controller registers
(`.../controller/singlepage/index.ts:116-174,226-234`):

| Method | Path under `/api/rbac/subjects/authentication/` | Caller without a session                                                                                                                     |
| ------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `is-authorized`                                 | `is-authorized` middleware for every non-allow-listed request (`is-authorized/index.ts:95-104`); the `is-authorized-wrapper-default` variant |
| POST   | `bill-route`                                    | `bill-route` middleware for billed routes (`libs/middlewares/src/lib/bill-route/index.ts:57-65`)                                             |
| GET    | `me`                                            | `me-default` server variant; scripts and scenario helpers                                                                                    |
| POST   | `logout`                                        | logout button and logout action variants                                                                                                     |
| GET    | `init`                                          | `init-default`, mounted on every host page (`apps/host/app/layout.tsx:42`)                                                                   |
| POST   | `email-and-password/registration`               | registration form; `apps/api/create_rbac_subject.sh`                                                                                         |
| POST   | `ethereum-virtual-machine`                      | wallet login variant                                                                                                                         |
| POST   | `refresh`                                       | `init-default` when the stored refresh token is valid and the access cookie is not                                                           |
| POST   | `oauth/exchange`                                | `select-method-default` after the OAuth redirect                                                                                             |
| POST   | `oauth/:provider`                               | `select-method-default` "Sign in with Google"                                                                                                |
| GET    | `oauth/:provider/callback`                      | Google's redirect to the `redirect_uri` the start service builds (`service/singlepage/authentication/oauth/start.ts:146-149`)                |
| POST   | `email-and-password/authentication`             | login form; the MCP OAuth login page by raw `fetch` (`apps/mcp/lib/oauth.ts:827-849`); scenario helpers                                      |
| POST   | `email-and-password/forgot-password`            | forgot-password form                                                                                                                         |
| POST   | `email-and-password/reset-password`             | no live caller; the form body is commented out                                                                                               |

Every caller builds the path from the literal `/api/rbac/subjects` route
(`libs/modules/rbac/models/subject/sdk/model/src/lib/index.ts:16`) and a
lowercase suffix, with no trailing slash and parameters in the query string.
`google` is the only provider the start and callback services accept
(`service/singlepage/authentication/oauth/start.ts:41-43`,
`callback.ts:81-83`). No other controller mounts routes under this prefix.

### Broadcast channel reads

- Routes: the channel controller registers find, count, find-by-id and
  `GET /:id/messages` (`libs/modules/broadcast/models/channel/backend/app/api/src/lib/controller/singlepage/index.ts:20-44`);
  messages and `channels-to-messages` are plain REST controllers mounted at
  `/api/broadcast/messages` and `/api/broadcast/channels-to-messages`
  (`libs/modules/broadcast/backend/app/api/src/lib/apps.ts:16-30`).
- The observer middleware runs after every 2xx `POST`, `PATCH` and `DELETE`
  and calls `channelApi.find` for the channel titled `observer` with no
  options, so no credential (`libs/middlewares/src/lib/observer/index.ts:61-85`).
  The channel SDK's default options carry only `next.revalidate`
  (`libs/modules/broadcast/models/channel/sdk/model/src/lib/index.ts:20-24`).
  It then reads each channel's messages with `X-RBAC-SECRET-KEY`
  (`:103-128`).
- The agent cron and the expired-message cleanup read channels, messages and
  links through repositories bound in process
  (`libs/modules/agent/models/agent/backend/app/api/src/lib/bootstrap.ts:307-322`)
  and send the operator secret on their HTTP writes (`cron.ts:178-236`).
- Admin v1 and admin-v2 tables fetch in the browser with the admin's token
  (`libs/modules/broadcast/frontend/component/src/lib/admin-v2/overview/channel/admin-v2-table/ClientComponent.tsx`
  passes `isServer={false}`). The admin-v2 overview cards call `count` during
  server rendering without credentials
  (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/server.tsx:20-29`).
- The module's `App` component reads the `revalidation` channel, then the
  channel by id and its links, from the browser without credentials
  (`libs/modules/broadcast/frontend/component/src/lib/app/index.tsx:13-42`,
  `libs/modules/broadcast/models/channel/frontend/component/src/lib/singlepage/subscription/client.tsx:12`).
  Nothing in the repository renders it; revalidation reaches browsers over
  `/ws/revalidation` (`apps/api/app.ts:126-144`,
  `libs/middlewares/src/lib/revalidation/index.ts:111-117`).
- `apps/mcp`, `apps/telegram` and the specs do not request these routes over
  HTTP. The HTTP cache never stores broadcast responses
  (`libs/middlewares/src/lib/http-cache/routes/singlepage.ts:22`).

### Permission graph reads

- Routes: the permission controller registers `find-by-route`,
  `resolve-by-route`, find, count and find-by-id
  (`libs/modules/rbac/models/permission/backend/app/api/src/lib/controller/singlepage/index.ts:18-43`);
  `roles-to-permissions` and `subjects-to-roles` are plain REST controllers
  (`libs/modules/rbac/relations/*/backend/app/api/src/lib/controller/singlepage/index.ts:1-9`).
  No other `/api/rbac` sub-app name starts with `roles-to-permissions` or
  `subjects-to-roles`; `permissions-to-billing-module-currencies` does not
  match the current `permissions` rules.
- The subject `is-authorized` service reads all three through injected
  services, in process
  (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts:47-149,197-207`).
- The billing route check calls `resolve-by-route` over HTTP with the operator
  secret (`.../service/singlepage/billing/route.ts:120-135`); `find-by-route`
  has no caller.
- Admin UI: the admin-v2 permission table and the relation tables in the
  permission, role and subject forms render with `isServer={false}` and fetch
  with the admin's token
  (`libs/modules/rbac/frontend/component/src/lib/admin-v2/overview/permission/admin-v2-table/ClientComponent.tsx`,
  `.../overview/{permission,role,subject}/admin-v2-form/ClientComponent.tsx`).
  The admin-v2 permission card calls `GET /api/rbac/permissions/count` during
  server rendering without credentials.
- Host admin gate, rendered on every public page
  (`apps/host/app/[[...url]]/page.tsx:74`): it reads `GET /api/rbac/roles`
  with the visitor's token and reads `subjects-to-roles` only when that
  returns the `admin` role (`apps/host/src/components/admin/ClientComponent.tsx:10-57`).
  `GET /api/rbac/roles` is refused to a subject without a role, so a visitor
  who is not an administrator never issues the `subjects-to-roles` read. The
  admin-v2 gate has the same shape (`apps/host/src/components/admin-v2/ClientComponent.tsx`).
- Account menu for a signed-in subject: reads `subjects-to-roles` filtered by
  the subject's id, then each role
  (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/button-default/Component.tsx:83-137`).
- `apps/mcp`, `apps/telegram` and `tools/` do not call these routes.

### What decides a route that is not on the allow-list

- `resolveByRoute` looks for an exact permission row, then a template row
  such as `/api/rbac/subjects-to-roles/[rbac.subjects-to-roles.id]`, then a
  method wildcard (`libs/modules/rbac/models/permission/backend/app/api/src/lib/service/singlepage/index.ts:197-245`).
- A matched row decides by its roles, and a row without roles by the sensitive
  route list (`is-authorized.ts:230-254`,
  `.../permission/.../service/singlepage/sensitive-routes.ts:22-43`). With no
  row, only the root permission `* *` applies, which the seed attaches to the
  `Admin` role, and a caller without that role is refused (`:256-273`).
- Seeded rows for the routes above: `GET /api/broadcast/channels/count`,
  `/api/broadcast/messages/count`, `/api/broadcast/channels-to-messages/count`,
  `/api/rbac/permissions/count` and `/api/rbac/roles-to-permissions/count`;
  `subjects-to-roles` has seeded rows too, which issue #303 revises. The
  channel find, find-by-id and messages routes, the channel links find, the
  permission find, find-by-id and resolution routes and the
  `roles-to-permissions` find and find-by-id have no row.

### CORS in the API, Telegram and OpenAPI apps

- The three apps register `cors()` first, with an `origin` function that
  returns the request's `Origin` or `null` when there is none, the methods
  `GET, POST, PUT, PATCH, DELETE, OPTIONS`, eight allowed headers including
  `Authorization` and `X-RBAC-SECRET-KEY`, `credentials: true` and
  `maxAge: 86400` (`apps/api/app.ts:41-64`, `apps/telegram/app.ts:8-31`,
  `apps/openapi/app.ts:37-60`).
- `hono/cors` 4.10.4 sets `Access-Control-Allow-Origin` only when the function
  returns a value, sets `Access-Control-Allow-Credentials` whenever
  `credentials` is on, answers every `OPTIONS` itself with 204 and appends
  `Vary: Origin` (`node_modules/hono/dist/middleware/cors/index.js`). The
  function receives `(origin, c)`, with `""` when the header is absent.
- Baseline: a preflight from any origin to the API received its own origin
  back with credentials allowed; a request without `Origin` received no
  allow-origin header.
- Browser calls use `credentials: "include"`
  (`libs/shared/frontend/api/src/lib/actions/find/index.ts:38` and the other
  actions) and copy the `rbac.subject.jwt` and `rbac.secret-key` cookies into
  `Authorization` and `X-RBAC-SECRET-KEY`
  (`libs/shared/frontend/client/utils/src/lib/authorization/headers.ts:4-21`).
  Issue #305 changes the cookie handling; `X-RBAC-SECRET-KEY` stays in the
  allowed headers while a browser can send it.
- Local setups put the host and the API on different origins: ports 3000 and
  4000, or the Codespaces and Gitpod host names that `apps/api/create_env.sh:26-54`
  writes. They depend on the echo.
- The Telegram service is called by Telegram's servers and by operators, and
  the OpenAPI service serves documentation; neither has a browser front end of
  its own in the repository.
- The MCP app refuses a request whose `Origin` is not in the optional
  `MCP_SERVICE_ALLOWED_ORIGINS` list and accepts every origin when the list is
  empty (`apps/mcp/http.ts:64-66,252-269`). The list is wired through
  `tools/deployer/.env.example:123-124`, `tools/deployer/mcp.sh:36,99`,
  `tools/deployer/github_deployer.sh:81,195`,
  `tools/deployer/mcp/mcp.env.j2:13-15` and
  `.github/workflows/ansible.yml:91,210`.

### Environment and placement

- Environment values are read in `libs/shared/utils/src/lib/envs/*.ts`;
  `envs/api.ts:1-9` holds the API's own setting `API_SECRET_STRENGTH`, and
  list values are exported as raw strings and split by the consumer
  (`ALLOWED_BILLING_SERVICE_PROVIDERS`, `envs/host.ts:9-11`, split in
  `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/provider/index.ts:85`).
- Each server imports its `env.ts` before anything else, so `@sps/shared-utils`
  reads the loaded values (`apps/api/server.ts:1`, `apps/telegram/server.ts:1`,
  `apps/openapi/server.ts:1`).
- `libs/shared/backend/utils/src/lib/` holds request helpers that read an
  environment value: `rbac-secret/index.ts:1-36` imports `RBAC_SECRET_KEY` from
  `@sps/shared-utils`, and its spec mocks that export with a getter
  (`rbac-secret/index.spec.ts:10-16`). `apps/api` and `apps/telegram` already
  import `@sps/backend-utils` (`apps/api/app.ts:19`,
  `apps/telegram/src/lib/telegram-bot.ts:33`); `apps/openapi` imports only
  `@sps/shared-utils` and runs from the same monorepo image.
- Deployment: the API and Telegram services receive their environment from
  `tools/deployer/api/api.env.j2` and `tools/deployer/telegram/telegram.env.j2`,
  rendered with the variables `api.sh` and `telegram.sh` pass through
  `ansible-playbook -e`. `github_deployer.sh` copies the local deployer `.env`
  into GitHub secrets, and `.github/workflows/ansible.yml` writes them back,
  keeping each value up to its first space (`ansible.yml:145-150`). In the
  container, `create_env.sh <service> deployment` writes the whole process
  environment to the app's `.env` (`create_env.sh:3-11`). The deployer has no
  template for the OpenAPI app.

### The origin write in `is-authorized`

`is-authorized/index.ts:50-58` builds a set of `http://localhost:3000` and
`NEXT_PUBLIC_HOST_SERVICE_URL`, compares it with `c.req.header("Host")` and
assigns `c.res.headers["Access-Control-Allow-Origin"]`. `Host` carries a host
and port without a scheme, so the comparison is never true, and a property
assignment on a `Headers` object does not add a header.
`NEXT_PUBLIC_HOST_SERVICE_URL` is imported only for this block (`:5`).

### Work in flight on the same files

- #319 (PR #328) appends an anchored-at-the-end agent cron rule to the same
  allow-list and extends the same spec.
- #305 changes how `is-authorized` reads the operator cookie
  (`is-authorized/index.ts:44-45`).
- #303 revises seeded permission rows, including `subjects-to-roles`.
- #304 (PR #331) edits `apps/api/app.ts` inside the `/public/*` handler; #315,
  #319 and #304 add entries to `tools/deployer/.env.example`, `api.sh`,
  `api/api.env.j2`, `github_deployer.sh` and `ansible.yml`; #320 (PR #323)
  rewrites the head of `ansible.yml` and keeps its secret lists.

## Code References

- `libs/middlewares/src/lib/is-authorized/routes/singlepage.ts:9-76` - framework allow rules
- `libs/middlewares/src/lib/is-authorized/routes/index.spec.ts:12-139` - allow-list spec
- `libs/middlewares/src/lib/is-authorized/index.ts:42-74` - path normalization, credentials, dead origin write, allow-list check
- `libs/shared/utils/src/lib/routes/index.ts:64-163` - `RouteMatcher` and layered composition
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:116-174,226-234` - authentication routes
- `libs/middlewares/src/lib/observer/index.ts:61-128` - anonymous channel find, secret-bearing message read
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts:151-278` - permission decision
- `libs/modules/rbac/models/permission/backend/app/api/src/lib/service/singlepage/index.ts:197-245` - route resolution
- `apps/host/src/components/admin/ClientComponent.tsx:10-57` - admin gate
- `apps/api/app.ts:41-64`, `apps/telegram/app.ts:8-31`, `apps/openapi/app.ts:37-60` - CORS options
- `libs/shared/frontend/client/utils/src/lib/authorization/headers.ts:4-21` - browser credential headers
- `apps/mcp/http.ts:252-269` - MCP origin list
- `libs/shared/utils/src/lib/envs/api.ts:1-9` - API environment settings
- `libs/shared/backend/utils/src/lib/rbac-secret/index.ts:1-36` - environment-reading request helper
- `tools/deployer/api.sh:38,145`, `tools/deployer/api/api.env.j2:64`, `tools/deployer/telegram.sh:27-29,88-93`, `tools/deployer/telegram/telegram.env.j2:21-23`, `tools/deployer/github_deployer.sh:99,212`, `.github/workflows/ansible.yml:108,227` - deployer wiring points

## Architecture Documentation

- Path-gating middlewares keep their route lists in `routes/singlepage.ts`
  (framework) and `routes/startup.ts` (project), composed with constructor
  options by `createLayeredRouteMatcher`; each list has a pure BDD spec
  (`libs/shared/utils/src/lib/routes/README.md`).
- Newer rule lists anchor both ends: the sensitive routes
  (`sensitive-routes.ts:22-43`) and the HTTP cache exclusions for rbac entities
  (`libs/middlewares/src/lib/http-cache/routes/singlepage.ts:56-59`) use
  `^...$`, the #276 module read rules use `$`.
- An optional deployment value follows the `MCP_SERVICE_ALLOWED_ORIGINS`
  shape: an empty line in the deployer `.env.example` with a comment, a
  `get_env` read and an `-e` pass in the service script, a conditional block
  in the service template, and entries in `github_deployer.sh` and both secret
  lists of `ansible.yml`.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`
  records SEC-05, SEC-19 and SEC-27 (Part 1) and N-11 (the origin write).
- `thoughts/shared/tickets/singlepagestartup/ISSUE-297.md` asks whether the
  allow-list can be replaced by permission rows and records that #276 narrowed
  the module read rules.
- Commit `bf7127bcd3` (Refs #276) replaced the module-wide read rule with the
  four anchored read rules; `aecef44e7d` removed an allow rule for a route that
  does not exist.

## Related Research

- `thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`

## Open Questions

None block the change. Once the RBAC graph reads leave the allow-list, the
permission service decides them; #303 revises the rows it reads.
