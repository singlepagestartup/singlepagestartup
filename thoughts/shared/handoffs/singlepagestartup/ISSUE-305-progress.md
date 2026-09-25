---
issue_number: 305
issue_title: "Review session cookie attributes and client token handling"
start_date: 2026-09-26T02:15:00+03:00
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-305.md
status: complete
completed_date: 2026-09-26
---

# Implementation Progress: ISSUE-305 - Review session cookie attributes and client token handling

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-305.md`

## Phase Progress

### Phase 1: The operator secret travels only in the header

- [x] Started: 2026-09-26T02:15+03:00
- [x] Completed: 2026-09-26T02:55+03:00
- [x] Automated verification: PASSED

**Notes**:

- `readRbacSecret` reads only `X-RBAC-SECRET-KEY`; the is-authorized and bill-route middlewares, `request-subject-is-owner` and the subject `is-authorized` and `bill-route` controllers read the secret through it. MCP and the browser header helper no longer read `rbac.secret-key`. The comparisons are untouched (#295).
- The live-server `is-authorized` controller spec, which no lane ran, is replaced by a unit spec; its exclusion is removed from `libs/modules/rbac/jest.config.ts`.
- `npx jest -c libs/middlewares/jest.config.ts .../is-authorized/index.spec.ts .../operator-secret/index.spec.ts .../bill-route/index.spec.ts`: 3 suites, 10 tests passed.
- `npx jest -c libs/modules/rbac/jest.config.ts request-subject-is-owner is-authorized bill-route`: 3 suites, 8 tests passed.
- `npx jest` on `rbac-secret` (10 passed), client-utils `authorization` (2 suites, 4 passed), MCP `auth.spec.ts` (9 passed).
- Mutation check (`scratchpad/issue-305/mutate.py`, re-adding each cookie read): 9 of 9 mutations killed — `readRbacSecret` (rbac-secret and operator-secret specs), is-authorized, bill-route, `request-subject-is-owner`, subject `is-authorized` and `bill-route` controllers, MCP, browser header helper. Files restored; no backup left.

### Phase 2: Browser requests that need a session send the header

- [x] Started: 2026-09-26T02:55+03:00
- [x] Completed: 2026-09-26T03:20+03:00
- [x] Automated verification: PASSED

**Notes**:

- Identity `changePassword`, the wallet component's `subjects-to-identities` lookup and the broadcast channel (`pushMessage`, `messageCreate`, `messageDelete`, `messageFind`), social chat `messageFind` and social profile `findByIdChatFind` client functions send `saturateHeaders(...)`. `changePassword` keeps its original `next` fallback.
- `npx jest -c libs/modules/rbac/jest.config.ts .../identity/sdk/client .../ethereum-virtual-machine-default`: 2 suites, 3 tests passed.
- `npx jest -c libs/modules/broadcast/jest.config.ts .../channel/sdk/client`: 4 passed; `npx jest -c libs/modules/social/jest.config.ts .../chat/sdk/client .../profile/sdk/client`: 2 suites, 2 passed.
- Mutation check (removing each `saturateHeaders`): 6 of 6 killed.
- The wallet spec first failed with two lookups instead of one: the `useJwt` mock returned a new object per render, which re-ran the effect. A stable mock value fixed the test; the component was correct.

### Phase 3: The API reads the JWT only from the header and writes no session cookie

- [x] Started: 2026-09-26T03:20+03:00
- [x] Completed: 2026-09-26T04:05+03:00
- [x] Automated verification: PASSED

**Notes**:

- `authorization` in `@sps/backend-utils` reads only the `Authorization` header; the is-authorized middleware, the subject `is-authorized` and `bill-route` controllers and OAuth `start` read the JWT through it.
- `init`, `refresh`, the Ethereum login, the OAuth exchange and email-and-password authentication and registration no longer write `rbac.subject.jwt`; the lifetime guards, the re-verification of the issued token and its `exp` check went with the cookie. `logout` keeps its delete with a comment. The OAuth exchange still clears its exchange-code cookie.
- The two placeholder email-and-password specs are replaced; `libs/modules/rbac/jest.config.ts` now ignores only `*.integration.spec.ts`, like the broadcast and social configs.
- Direct runs: rbac authentication controllers and owner guard, 11 suites, 33 tests passed; middlewares is-authorized and bill-route, 4 suites, 19 tests passed; backend-utils `authorization`, 4 passed.
- Mutation check: 14 of 14 killed (the JWT cookie read re-added in the helper, both middlewares, the owner guard, both subject controllers and OAuth start; the cookie write re-added in all six issuance handlers).
- `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run-many --target=jest:test --projects=@sps/backend-utils,@sps/middlewares,@sps/rbac,@sps/broadcast,@sps/social,mcp,@sps/shared-frontend-client-utils,@sps/shared-frontend-client-api --parallel=3 --skip-nx-cache`: 8 projects passed — client-utils 5/23, client-api 5/41, backend-utils 7/130, broadcast 3/10, social 18/39, middlewares 12/72, mcp 9/56, rbac 93/406 (suites/tests).

### Phase 4: Documentation

- [x] Started: 2026-09-26T04:05+03:00
- [x] Completed: 2026-09-26T04:25+03:00
- [x] Automated verification: PASSED

**Notes**:

- `README.md` (Connecting MCP clients), `AI_GUIDE.md` section 6, `libs/middlewares/src/lib/http-cache/README.md`, the `RBAC_SECRET_KEY` row of `tools/deployer/README.md`, `libs/shared/frontend/client/utils/README.md`, and `libs/modules/rbac/models/subject/README.md` (new "Session Credentials" section; `init` reuse reads the header only).
- `npx prettier --write` on every changed file; the deployer table change stays one row.
- Type check: `NODE_OPTIONS=--max-old-space-size=12288 npx tsc --noEmit -p <project>/tsconfig.json` for `libs/middlewares`, `libs/shared/backend/utils`, `libs/shared/frontend/client/utils`, `apps/mcp`, `libs/modules/broadcast`, `libs/modules/social`, `libs/modules/rbac`: 0 errors each (after Incident 1).
- Lint: `NODE_OPTIONS=--max-old-space-size=12288 NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run-many --target=eslint:lint --projects=@sps/backend-utils,@sps/shared-frontend-client-utils,mcp,@sps/broadcast,@sps/social,@sps/rbac --skip-nx-cache`: 6 projects passed (after Incident 2). `@sps/middlewares` has no lint target; `npx eslint` on its six changed files with the root config exits 0.
- `node tools/agents/code-placement.mjs`: no same-name file and folder pairs.

### Phase 5: Verification over HTTP

- [x] Started: 2026-09-26T04:25+03:00
- [x] Completed: 2026-09-26T04:45+03:00
- [x] Automated verification: PASSED

**Notes**:

- API booted from the worktree: `API_SERVICE_PORT=4305 API_SERVICE_URL=http://localhost:4305 NEXT_PUBLIC_API_SERVICE_URL=http://localhost:4305 npm run api:dev`. Every request sent `Cache-Control: no-store`, which bypasses the HTTP cache (`http-cache/index.ts:248-260`). Script: `scratchpad/issue-305/proof.sh`; it prints status codes, cookie and attribute names, key names and booleans only.
- `init` without a token: 201, no `Set-Cookie`, keys `jwt,refresh`.
- `init` with the JWT only in an `rbac.subject.jwt` cookie: 201, no `Set-Cookie`, a new subject (not the token's).
- `init` with the same JWT as `Authorization: Bearer`: 201, no `Set-Cookie`, the token's subject is reused.
- `me` with the JWT only in a cookie: 200 with `data=null`; as a bearer header: 200 with the token's subject.
- `GET /api/rbac/subjects` with the operator secret only in an `rbac.secret-key` cookie: 403 (`Permission error`); with `X-RBAC-SECRET-KEY`: 200 with a data array.
- `GET .../authentication/is-authorized` with the secret only in a cookie: 403; with the header: 200 `ok=true`.
- Email-and-password registration: 201, no `Set-Cookie`, `jwt,refresh`; authentication with the same throwaway credentials: 201, no `Set-Cookie`, same subject; refresh with the returned refresh token: 201, no `Set-Cookie`.
- OAuth exchange with a fixture `oauth-exchange` action and the `rbac.oauth.exchange-code` cookie: 201, `jwt,refresh`, the fixture subject; the only `Set-Cookie` is `rbac.oauth.exchange-code [Max-Age, Path]`, which clears the code.
- `logout`: 200 with `Set-Cookie: rbac.subject.jwt [Max-Age, Path]`, the delete of a leftover copy.
- Cleanup: action 200, identity 200, three subjects 200; each subject then answers 404 and no identity row is left for the fixture login. Server stopped by PID (`npm`, `nx`, `bun run dev`, `bun --watch`); port 4305 free.
- The Ethereum login is covered by its unit spec only: `publicClient.verifyMessage` may call an RPC endpoint.
- Final runs on the finished tree: the eight unit lanes pass (same counts as Phase 3); `npm run test:unit:shared -- --skip-nx-cache` passes 6 projects (client-utils 5/23, client-store 1/4, frontend-api 1/5, server-api 1/3, client-api 5/41, components 14/44); `npx prettier --check` on every changed file passes; `@sps/backend-utils:eslint:lint` passes after the last comment edit.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 2 -->

### Incident 1 — A spec passed a request option object without `next`

- **Occurrences**: 1
- **Stage**: Phase 4 - Documentation (type check after Phase 2)
- **Symptom**: `tsc --noEmit -p libs/modules/rbac/tsconfig.json` reported TS2741 in `identity/sdk/client/.../index.spec.tsx`: property `next` missing in the `options` passed to `changePassword`.
- **Root Cause**: `NextRequestOptions.next` is required; jest with `diagnostics: false` does not type-check specs.
- **Fix**: the spec passes `next: {}` like a typed caller.
- **Reusable Pattern**: run `tsc --noEmit` on the project tsconfig (it includes specs) before trusting a green jest run.

### Incident 2 — Prettier findings in new specs

- **Occurrences**: 1
- **Stage**: Phase 4 - Documentation (lint)
- **Symptom**: `@sps/rbac:eslint:lint` failed with two `prettier/prettier` errors in new spec files.
- **Root Cause**: `core.hooksPath` points at `.husky/_`, which does not exist in this worktree, so lint-staged never formats staged files here.
- **Fix**: `npx prettier --write` on every changed file, then lint again.
- **Reusable Pattern**: in a worktree, run prettier on the changed files before lint and before committing.

## Summary

### Changes Made

- The API accepts the subject JWT only from `Authorization` (`authorization` in `@sps/backend-utils`) and the operator secret only from `X-RBAC-SECRET-KEY` (`readRbacSecret`); every inline reader goes through them.
- The six issuance handlers write no `rbac.subject.jwt` cookie; `logout` still deletes a leftover copy.
- MCP and the browser header helper no longer read `rbac.secret-key`.
- Identity `changePassword`, the wallet identity lookup and six hand-written broadcast and social client functions send the session header.
- Documentation: root README, AI_GUIDE, http-cache README, deployer README, client-utils README, subject README.
- Specs: 14 new spec files, 3 replaced (the live-server is-authorized controller spec and two placeholders) and 5 updated; the rbac unit lane runs the email-and-password and is-authorized controller folders again.

### Pull Request

- [x] PR created: https://github.com/singlepagestartup/singlepagestartup/pull/342
- [x] PR number: 342
- Commits: `0f00341dfe` (code, specs, docs), `e79ce03e25` (research, plan, process, progress), then the saved description `thoughts/shared/prs/342_description.md`.

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-25T23:14:30Z
