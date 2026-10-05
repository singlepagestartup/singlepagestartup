Closes #308.

## Summary

`is-authorized` skips the permission check for a request whose path matches an allow rule, and it matches with `RegExp.test` on the lowercased path. Most framework rules had neither `^` nor `$`, so each admitted every path that contained its text. Without credentials, `GET /api/broadcast/channels/:id/messages` returned the channel's messages, `GET /api/agent/agents/favicon.ico` reached the agents handler, and any `POST` under `/api/rbac/subjects/authentication/` skipped authorization whether or not a route answered it. The API, Telegram and OpenAPI apps also echoed any `Origin` with credentials allowed, and a deployment had no way to narrow that.

Every framework allow rule is now anchored at both ends and names its routes and methods; the routes that leave the list are decided by the permission service like any other route. A new optional `API_CORS_ALLOWED_ORIGINS` limits the origins the three apps echo. Unset, CORS behaves exactly as before, so local development, Codespaces, Gitpod and tunnels keep working.

## Changes

- `libs/middlewares/src/lib/is-authorized/routes/singlepage.ts`:
  - `GET /favicon.ico` only, with the dot escaped.
  - `GET /api/broadcast/channels` only. The observer middleware reads the channel list without a credential to find its channel; the channel by id and count, its messages and `channels-to-messages` leave the list.
  - The 14 routes of the subject authentication controller, each with its own method, in five rules. The OAuth provider segment keeps a slug shape, so a provider a project adds needs no new rule.
  - `^` added to the #276 module and page reads and to `/public/file-storage/`.
  - The `permissions`, `roles-to-permissions` and `subjects-to-roles` rules are removed. Their readers are the admin UI with the administrator's token, in-process services, the billing route check with the operator secret, and the admin-v2 overview cards, whose `count` routes have permission rows.
- `libs/middlewares/src/lib/is-authorized/routes/index.spec.ts`: 14 scenarios (8 before). The scenario that pinned the prefix siblings is inverted. New scenarios admit every named route and refuse each path the old rules admitted beyond it (other methods, look-alike names, sub-paths, embedded paths, the RBAC graph reads, the channel sub-routes), and one reopens a closed route through a project rule.
- `libs/middlewares/src/lib/is-authorized/index.ts`: removes the block that compared `Host` with two origins and assigned a property on `c.res.headers`. It never set a header.
- `libs/shared/utils/src/lib/envs/api.ts`: `API_CORS_ALLOWED_ORIGINS`, empty by default.
- `libs/shared/backend/utils/src/lib/cors-origin/index.ts` with its spec, exported from `@sps/backend-utils`: `resolveCorsOrigin(origin)`, the `hono/cors` `origin` option. An empty list echoes any origin, a set list echoes only an exact entry, and a request without `Origin` gets no allow-origin header in either mode.
- `apps/api/app.ts`, `apps/telegram/app.ts`, `apps/openapi/app.ts`: `origin: resolveCorsOrigin` replaces the three inline echoes. The other `cors()` options are unchanged; `X-RBAC-SECRET-KEY` stays an allowed header because the browser client still sends it.
- Documentation: `apps/api/README.md` (Environment), `apps/telegram/README.md`, `apps/telegram/.env.example`, `apps/openapi/README.md`, and "Browser origins for the API" in `tools/deployer/README.md`.
- Deployer, following `MCP_SERVICE_ALLOWED_ORIGINS`: `tools/deployer/.env.example`, `api.sh`, `telegram.sh`, `api/api.env.j2`, `telegram/telegram.env.j2`, `github_deployer.sh`, and both secret lists in `.github/workflows/ansible.yml`.

## Verification

- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/middlewares:jest:test`: 10 suites, 70 tests (64 before).
- [x] `npx nx run @sps/backend-utils:jest:test`: 7 suites, 135 tests (126 before). `@sps/shared-utils` 74, `api` 4 and `telegram` 45 tests, as before.
- [x] Mutation checks: the new routes spec against the old rules fails 6 of 14 scenarios, and dropping any single anchor (broadcast `$`, favicon `^`, authentication `$`, module reads `^`) fails that anchor's scenario. On the helper, echoing every origin fails 3 scenarios, and a prefix match, untrimmed entries and a refusing empty list each fail theirs.
- [x] `npx tsc --noEmit -p` for `libs/middlewares`, `libs/shared/backend/utils`, `libs/shared/utils`, `apps/telegram` and `apps/openapi`: clean. `apps/api`: the same 25 errors as `main`, none in a changed file.
- [x] `NODE_OPTIONS=--max-old-space-size=12288 npx nx run <project>:eslint:lint`: `@sps/backend-utils`, `@sps/shared-utils`, `telegram` and `openapi` clean; `api` 0 errors and its 2 existing warnings. `npx eslint libs/middlewares/src/lib/is-authorized` (the package has no lint target): clean.
- [x] HTTP against a local API, requests without credentials, `main` → branch: `GET /api/broadcast/channels/:id/messages` 200 → 403; channel by id 200 → 403; `GET /api/broadcast/channels-to-messages` 200 → 403; `GET /api/rbac/permissions` 200 → 403; `GET /api/rbac/roles-to-permissions` 200 → 403; `GET /api/agent/agents/favicon.ico` 500 → 403; `POST .../authentication/unknown` 404 → 403. Unchanged: `GET /api/broadcast/channels` 200, including the observer's filtered lookup; `GET .../me` 200; `GET .../init` 201; `POST .../refresh` 400; `POST .../logout` 200; `POST .../email-and-password/authentication` 400; `POST .../oauth/<provider>` and its callback reach their handlers. With the operator secret the closed routes answer 200.
- [x] CORS against the same API: unset, a preflight from any origin gets its origin back, as on `main`. With `API_CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com`, both listed origins get theirs back, `https://unlisted.example.net` gets a 204 without `Access-Control-Allow-Origin`, and a request without `Origin` answers 200 without it. The Telegram and OpenAPI apps behave the same in process.
- [x] Deployer: `bash -n` on the three scripts; both templates rendered with Ansible's Jinja2 with the value unset, empty and set; `ansible -e` passes an empty value with length 0 and a comma list whole.
- [ ] Browser check of the host and the admin UI on a deployment with `API_CORS_ALLOWED_ORIGINS` set: not run.

## Notes

- **New optional variable:** `API_CORS_ALLOWED_ORIGINS`. Unset keeps the current echo. A deployment that sets it lists the host and every other browser front end; a front end whose origin is missing cannot read API responses in the browser.
- **Deploy step:** with `MIDDLEWARE_HTTP_CACHE=true`, GET responses stored before the upgrade for the routes that left the list stay in the cache until it is cleared. `start.sh api` runs the seed, which ends by calling the clear route; a deployment that does not run it calls `GET /api/http-cache/clear` with `X-RBAC-SECRET-KEY` once.
- The broadcast module's `App` component reads a channel by id and its links without a credential; nothing in the repository renders it.
- #328 appends a rule to the same allow-list; whichever lands second anchors it the same way.

## Downstream migration

Assembled from the commit trailers; the records commit needs no action.

**Anchored allow-list** (`fix(is-authorized)`)

- **Reason:** requests without credentials that matched an unanchored framework allow rule now go through the permission service. A caller of a channel by id, its messages, `channels-to-messages` or the permission graph, or of a project route under `/api/rbac/subjects/authentication/`, receives 403 unless a permission row, a project rule or a credential admits it.
- **Applies to:** projects whose frontend, scripts or services call those routes without a session or the operator secret; projects with their own routes under `/api/rbac/subjects/authentication/` or with allow rules copied from the old framework list; projects that render the broadcast `App` channel subscription for visitors.
- **Actions:**
  - For each such caller, send the operator secret from server-side code, give the route a permission row with the intended role, or declare the exact route in `is-authorized/routes/startup.ts` or the `IsAuthorizedMiddleware` constructor options, anchored at both ends and with its method.
  - Anchor project-owned allow rules the same way, with `^`, `$` and named methods.
  - With `MIDDLEWARE_HTTP_CACHE` on and no start-up seed run after the deploy, call `GET /api/http-cache/clear` with `X-RBAC-SECRET-KEY` once.
- _Verify:_ without credentials, `GET /api/broadcast/channels/<id>/messages` and `GET /api/rbac/permissions` answer 403, `GET /api/broadcast/channels` and `GET /api/rbac/subjects/authentication/me` answer as before, and the project's own anonymous reads, login, registration, OAuth and observer pipelines keep working.

**CORS origin list** (`fix(api)`)

- **Reason:** nothing changes until a deployment sets `API_CORS_ALLOWED_ORIGINS`. A deployment that sets it must list every browser front end, and a project that replaced the `cors()` origin option in an app entry point keeps echoing every origin until it uses the shared helper.
- **Applies to:** deployments that want browsers limited to known front ends, projects with their own deployer scripts or templates, and projects that edited the `cors()` options in `apps/api/app.ts`, `apps/telegram/app.ts` or `apps/openapi/app.ts`.
- **Actions:**
  - To limit origins, set `API_CORS_ALLOWED_ORIGINS` for the API and Telegram services, in `tools/deployer/.env` or the GitHub secrets `API_CORS_ALLOWED_ORIGINS` and `PREVIEW_API_CORS_ALLOWED_ORIGINS`, listing the host and every other browser front end as `scheme://host[:port]`, comma-separated without spaces, then run `api.sh` and `telegram.sh`.
  - In project-owned deployer scripts or templates, pass the value through as the framework's `api.sh`, `telegram.sh` and service templates do; in a project-owned app entry point, pass `resolveCorsOrigin` from `@sps/backend-utils` as the `cors()` origin option.
- _Verify:_ with the value unset, a preflight from any origin gets its origin back; with it set, a listed origin gets its origin back, another origin gets no `Access-Control-Allow-Origin`, and requests without `Origin`, such as MCP, scripts and webhooks, answer as before.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
