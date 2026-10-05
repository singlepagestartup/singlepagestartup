Closes #305.

## Summary

The API wrote a JavaScript-readable `rbac.subject.jwt` cookie on its own origin at six token routes and accepted the subject JWT from that cookie, so any script running on the API origin could read a visitor's session token. Seven readers also accepted the operator secret from an `rbac.secret-key` cookie, and the browser header helper forwarded such a cookie as `X-RBAC-SECRET-KEY`.

The API now takes the subject JWT only from `Authorization: Bearer` and the operator secret only from `X-RBAC-SECRET-KEY`, and the token routes answer with `{ jwt, refresh }` in the body without writing a cookie. The browser's own session flow is unchanged: it keeps the JWT in its JS-written cookie on the host origin and the refresh token in localStorage, and sends the JWT as a bearer header.

An HttpOnly API cookie was the other option and breaks local development. Cookies are scoped by host, not by port, so the host on `localhost:3000` and the API on `localhost:4000` share one jar entry. Measured in Chromium 152 with a two-port probe: an HttpOnly cookie set by one localhost port is invisible to a page on the other port and silently blocks that page's `document.cookie` write of the same name. With the API cookie HttpOnly, the browser could no longer see or rewrite its own JWT and `init-default` would refresh on every one-second tick. An HttpOnly cookie would also still authenticate same-origin requests made by a script on the API origin.

## Changes

- `libs/shared/backend/utils/src/lib/authorization/index.ts`: the shared JWT reader takes only the `Authorization` header (it read the cookie first). Its 17 callers, including `init`, `me` and the cart order handlers, follow.
- `libs/shared/backend/utils/src/lib/rbac-secret/index.ts`: `readRbacSecret` takes only `X-RBAC-SECRET-KEY`. The operator-secret middleware and the telegram-star webhook use it.
- The is-authorized and bill-route middlewares, `request-subject-is-owner`, the subject `is-authorized` and `bill-route` controllers and OAuth `start` read both credentials through the shared readers instead of their own header-or-cookie code.
- `init`, `refresh`, `ethereum-virtual-machine`, `oauth/exchange` and email-and-password `authentication` and `registration` write no `rbac.subject.jwt` cookie. The lifetime guard, the re-verification of the just-signed token and its `exp` check went with it: they only built the cookie, and the services guard their secrets and always set `exp`. The OAuth exchange still clears its exchange-code cookie.
- `logout` keeps deleting `rbac.subject.jwt`, with a comment: it clears a copy an earlier release left in the browser.
- `apps/mcp/lib/auth.ts`: an `rbac.secret-key` cookie on an MCP request is no longer forwarded as the operator header. The `rbac.subject.jwt` cookie of an MCP request is still forwarded as a bearer header.
- Browser SDK: `authorization.headers()` builds only `Authorization`. Identity `changePassword` (used by both admin forms; its route requires an authenticated root subject), the wallet component's `subjects-to-identities` lookup, and the hand-written broadcast channel (`pushMessage`, `messageCreate`, `messageDelete`, `messageFind`) and social chat and profile client functions send the session header through `saturateHeaders`. They authenticated only through the API cookie before.
- `libs/modules/rbac/jest.config.ts` ignores only `*.integration.spec.ts`, like the broadcast and social configs. The two failing email-and-password placeholder specs and the live-server `is-authorized` controller spec, which no lane ran, are replaced by unit specs.
- Specs: 14 new, 3 replaced, 5 updated, all in the BDD format. Token handlers run in a Hono app and assert the status, the token pair and the absence of a `Set-Cookie`; guards assert that cookie-only credentials are refused or anonymous and that headers still work.
- Docs: `README.md` (Connecting MCP clients), `AI_GUIDE.md` section 6, the http-cache README, the `RBAC_SECRET_KEY` row of `tools/deployer/README.md`, the client-utils README, and a Session Credentials section in the subject README.

## Verification

- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run-many --target=jest:test --projects=@sps/backend-utils,@sps/middlewares,@sps/rbac,@sps/broadcast,@sps/social,mcp,@sps/shared-frontend-client-utils,@sps/shared-frontend-client-api --skip-nx-cache`: backend-utils 7/130, middlewares 12/72, rbac 93/406, broadcast 3/10, social 18/39, mcp 9/56, client-utils 5/23, client-api 5/41 (suites/tests).
- [x] `npm run test:unit:shared -- --skip-nx-cache`: 6 projects pass.
- [x] `npx tsc --noEmit -p <project>/tsconfig.json` for `libs/middlewares`, `libs/shared/backend/utils`, `libs/shared/frontend/client/utils`, `apps/mcp`, `libs/modules/broadcast`, `libs/modules/social` and `libs/modules/rbac`: 0 errors each.
- [x] `npx nx run-many --target=eslint:lint --projects=@sps/backend-utils,@sps/shared-frontend-client-utils,mcp,@sps/broadcast,@sps/social,@sps/rbac`; `npx eslint` on the changed `libs/middlewares` files (the project has no lint target).
- [x] `node tools/agents/code-placement.mjs`: no same-name file and folder pairs.
- [x] Mutation check: each removed cookie read, cookie write and missing header was put back one at a time; 29 of 29 made a spec fail.
- [x] HTTP run against the API booted from the branch on port 4305 (status codes, cookie names and key names only; fixtures deleted afterwards):
  - `init`: 201 with `jwt` and `refresh`, no `Set-Cookie`. With the JWT only in an `rbac.subject.jwt` cookie a new subject is created; with the same JWT as a bearer header the subject is reused.
  - `me`: `data: null` with the JWT only in a cookie, the subject with the bearer header.
  - `GET /api/rbac/subjects` and `GET .../authentication/is-authorized`: 403 with the operator secret only in a cookie, 200 with `X-RBAC-SECRET-KEY`.
  - Email-and-password registration, authentication and refresh: 201 with the token pair and no `Set-Cookie`.
  - OAuth exchange with a fixture `oauth-exchange` action: 201 with the token pair; the only `Set-Cookie` clears `rbac.oauth.exchange-code`.
  - `logout`: 200 with a `Set-Cookie` that deletes `rbac.subject.jwt`.
- [ ] Browser run of the host: not done, because the Next.js host does not start on the worktree's symlinked `node_modules`. The browser session code is unchanged; the SDK changes are covered by jsdom specs.

## Notes

- No compatibility flag restores the cookie: it would restore the readable credential, and no framework caller needs it.
- Browsers that still hold an API-origin `rbac.subject.jwt` from an earlier release send it, and the API ignores it. It expires within `RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS` (default 3600) of its issuance, and `logout` deletes it.
- The operator secret comparisons are unchanged (#295); the edited lines change only where the secret is read.
- `libs/middlewares/src/lib/is-authorized/index.ts` is also edited by #308. This branch touches its import block and the credential reads, so a rebase may need a small manual merge.
- The Ethereum login is covered by its unit spec but not by the HTTP run: its signature check may call an RPC endpoint.
- The server SDK `init` and `logout` actions still replace caller headers. Both routes are allow-listed, and the browser calls `init` only when it holds no valid token.
- The branch carries the research, plan, process log and progress record under `thoughts/shared/`.

## Downstream migration

Adaptation is required where a project authenticates through a cookie. The API no longer writes an `rbac.subject.jwt` cookie and no longer accepts the subject JWT or the operator secret from a cookie, so such a caller is now anonymous.

**Applies to:** projects whose browser code, links, scripts or integrations call the API without an `Authorization` or `X-RBAC-SECRET-KEY` header; whose startup backend code reads `rbac.subject.jwt` or `rbac.secret-key` with `getCookie`; or whose hand-written client SDK functions build request headers without `saturateHeaders`.

**Actions:**

- Send the subject JWT as `Authorization: Bearer <jwt>`. In client SDK code, merge caller headers through `saturateHeaders` from `@sps/shared-frontend-client-utils`, as the factory and the identity `changePassword` mutation do.
- Send the operator secret only as the `X-RBAC-SECRET-KEY` header from server code, cron jobs and MCP clients, and remove any `rbac.secret-key` cookie that a browser, script or MCP client configuration sets.
- In startup backend code, read credentials through `authorization` and `readRbacSecret` from `@sps/backend-utils` instead of `getCookie`, and do not write `rbac.subject.jwt` from a startup handler.

**Verify:** search owned code for `rbac.subject.jwt`, `rbac.secret-key` and `getCookie`; sign in with every login method the project offers; confirm that `GET /api/rbac/subjects/authentication/init` answers without a `Set-Cookie` for `rbac.subject.jwt`; and confirm that authenticated pages, the admin password change and owned client SDK calls still work.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
