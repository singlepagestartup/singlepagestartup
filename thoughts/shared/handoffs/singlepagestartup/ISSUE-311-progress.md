---
issue_number: 311
issue_title: "Distinguish access and refresh tokens and add server-side revocation"
start_date: 2026-09-26T01:04:00+03:00
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-311.md
status: in_progress
---

# Implementation Progress: ISSUE-311 - Distinguish access and refresh tokens and add server-side revocation

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-311.md`

## Phase Progress

### Phase 1: Token format, revocation column and shared constants

- [x] Started: 2026-09-26T01:04+03:00
- [x] Completed: 2026-09-26T01:08+03:00
- [x] Automated verification: PASSED — `npx nx run @sps/backend-utils:jest:test` 7 suites, 132 tests; predicate spec 6 tests (`npx jest -c libs/modules/rbac/jest.config.ts .../token-revocation.spec.ts`).

**Notes**: `npx nx run @sps/rbac:models:subject:repository-generate` produced `0005_green_celestials.sql` (one `ALTER TABLE ... ADD COLUMN "tokens_valid_after" timestamp`), the 0005 snapshot and the journal entry; the journal ends without a newline like every other generated journal, and lint-staged does not format JSON.

### Phase 2: Every issuance through the helper

- [x] Started: 2026-09-26T01:08+03:00
- [x] Completed: 2026-09-26T01:13+03:00
- [x] Automated verification: PASSED — `@sps/rbac:jest:test` failed only in `init.spec.ts` (partial `@sps/backend-utils` mock), fixed with `requireActual`; after the fix `init.spec.ts` and the OAuth exchange spec pass (14 tests). `npx nx run-many --target=jest:test --projects=@sps/agent,telegram`: 17 suites / 88 tests and 5 suites / 45 tests.

**Notes**: thirteen sign calls moved to `signJwt`; `git grep "jwt.sign("` outside specs now finds only MCP's own OAuth token. The exchange spec and the agent thread-commands spec now pin `typ` and the id-only subject. `init` also received its Phase 3 change here, to edit the file once.

### Phase 3: Type enforcement, revocation and `me`

- [x] Started: 2026-09-26T01:13+03:00
- [x] Completed: 2026-09-26T01:44+03:00
- [x] Automated verification: PASSED — `npx nx run-many --target=jest:test --projects=@sps/rbac,@sps/middlewares,@sps/backend-utils`: 87 suites / 410 tests, 11 / 67, 7 / 134.

**Notes**: `me` became the one resolver of an access token's subject; `init` and `logout` receive it as a function prop, so the verify-load-revoked sequence exists once in the subject module. The is-authorized service reads `tokensValidAfter` through the injected subject repository with a 30-second per-subject cache and `invalidateSubjectRevocationCache`. The middleware change was reworked after the HTTP proof (Incident 3): the context key names the revoked subject and the middleware reads a token's subject id before reusing a cached decision.

Mutation checks (each restored from a scratchpad backup, file content confirmed afterwards):

- Type check removed from `verifyJwt`: 6 service scenarios fail (is-authorized refresh token, OAuth start refresh token, logout with a refresh token, `init` with a refresh token, `me` refresh token, refresh route access token) plus 1 in the `jwt-verify` spec.
- Revocation check removed from the is-authorized service: its 2 revocation scenarios fail.
- Revocation check removed from `refresh`: its revoked-token scenario fails.
- Middleware subject guard replaced by `true`, or the subject mark removed: the two logout scenarios fail each time; the other-subject scenario keeps passing.
- Logout write removed: the logout service scenario fails; context signal removed from the controller: the logout controller scenario fails.

### Phase 4: Browser recovery and documentation

- [x] Started: 2026-09-26T01:36+03:00
- [x] Completed: 2026-09-26T01:50+03:00
- [x] Automated verification: PASSED — see Final verification.

**Notes**: the response pipe clears a browser session refused with `Token revoked` even with a stored refresh token (mutation: removing the branch fails its scenario). The subject README gained the Session Tokens section, the `tokensValidAfter` field and updated route descriptions; the rbac README and the root README error table were adjusted; the subject OpenAPI paths now describe `me`, `logout` and `refresh` as they behave, including the `{ ok }` logout response the file had described as a token pair.

### Final verification

- `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run-many --target=jest:test --projects=@sps/rbac,@sps/middlewares,@sps/backend-utils,@sps/shared-utils,@sps/agent,telegram`: all pass — rbac 87 suites / 410 tests, middlewares 11 / 67, backend-utils 7 / 134, shared-utils 12 / 75, agent 17 / 88, telegram 5 / 45.
- `NODE_OPTIONS=--max-old-space-size=12288 npx nx run-many --target=eslint:lint --projects=@sps/rbac,@sps/backend-utils,@sps/shared-utils,@sps/agent,telegram`: all pass; `npx eslint` on the two changed `@sps/middlewares` files (the project has no lint target): pass.
- `npx tsc --noEmit -p <project>/tsconfig.json` for `libs/shared/backend/utils`, `libs/shared/utils`, `libs/middlewares`, `libs/modules/rbac`, `libs/modules/agent`, `apps/telegram`: 0 errors each.
- `node tools/agents/code-placement.mjs`: no same-name file and folder pairs.
- `npx nx run @sps/rbac:models:subject:repository-migrate`: applied `0005_green_celestials` to the shared local database (`NEW_MIGRATIONS=true`).
- HTTP proof, API from this worktree on port 4311 (`API_SERVICE_PORT=4311 ... npm run api:dev`), protected read `GET /api/rbac/subjects/:id/ecommerce-module/orders/quantity`, status codes and key names only:
  - `init` without a token 201 (`jwt`, `refresh`; claims `exp, iat, jti, subject, typ`, subject keys `id`, types access and refresh, distinct `jti`).
  - `me` with the access token 200 (`createdAt, id, slug, tokensValidAfter, updatedAt, variant`).
  - Protected read: access token 200, refresh token 401.
  - `refresh`: with the access token 401, with the refresh token 201 (typed pair).
  - Untyped token signed for the same subject: protected read 200, `refresh` 201.
  - Protected read with the second access token twice: 200, 200 (second from the middleware cache).
  - `logout` with it: 200 (`ok`).
  - Protected read 19 ms later with that token: 401; with the first access token and the untyped token, both cached earlier: 401, 401.
  - `refresh` with either earlier refresh token: 401, 401; `me` with the logged-out token: 401.
  - `init` with the logged-out token: 201 with a new subject.
  - Subject row read with the operator secret: `tokensValidAfter` set.
  - Cleanup: both throwaway subjects deleted (200, 200); the probe's subject deleted (200). Server stopped; nothing listens on 4311.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 3 -->

### Incident 1 — Partial `@sps/backend-utils` mocks hide new exports

- **Occurrences**: 1
- **Stage**: Phase 2 - Every issuance through the helper
- **Symptom**: all five `init.spec.ts` scenarios failed once `init.ts` imported `signJwt` and `verifyJwt`.
- **Root Cause**: the spec mocked `@sps/backend-utils` with a factory holding only `logger`, so every other export was `undefined`.
- **Fix**: spread `jest.requireActual("@sps/backend-utils")` into the factory and override `logger` only.
- **Reusable Pattern**: thirty specs mock `@sps/backend-utils` partially; when code gains an import from it, run the specs of that code first and switch the ones that execute the new path to `requireActual`.

### Incident 2 — "Authentication error." does not decide the status by itself

- **Occurrences**: 1
- **Stage**: Phase 3 - Type enforcement, revocation and `me`
- **Symptom**: the middleware spec expected 401 for `Authentication error. Token revoked` and got 403.
- **Root Cause**: `parseCategoryFromMessage` honours only a bracketed `[Category]` prefix; plain messages are matched against the keyword lists in order, and the only keyword that matched was the 403 `/authentication/i`. The README's statement that a leading category phrase keeps its category holds only when that phrase is itself a keyword of the category.
- **Fix**: added `/token revoked/i` to the 401 keywords and both new messages to the http-error spec that pins the helper's fixed messages to 401.
- **Reusable Pattern**: a new `Authentication error. ...` message needs a 401 keyword in `http-error/paterns`; check it with `getHttpErrorType` in the http-error spec before relying on its status.

### Incident 3 — Per-token cache eviction under per-subject revocation

- **Occurrences**: 1
- **Stage**: Phase 4 - HTTP proof
- **Symptom**: after logout with one access token, the older access token and an untyped token of the same subject still answered 200 on a protected read; both had decisions cached earlier in the run.
- **Root Cause**: logout revokes every token of the subject, but the context key named only the presented token, so the middleware kept trusting cached decisions for the subject's other tokens for up to 30 seconds. The service refused them; the middleware never asked.
- **Fix**: the logout service resolves to the revoked subject, the controller names its id in `RBAC_REVOKED_SUBJECT_CONTEXT_KEY`, and the middleware reads the subject id from a token's payload before reusing a cached decision (unverified read; it can only make a request skip the cache). A new middleware scenario covers two tokens of one subject.
- **Reusable Pattern**: when revocation is per subject, cache eviction must be per subject too; prove it over HTTP with a second token of the same subject whose decision is already cached, not only with the token that logs out.

## Summary

### Changes Made

- `f7ab6a4625 fix(rbac): distinguish access and refresh tokens and revoke them on logout` — 49 files: `signJwt` and typed `verifyJwt` in `@sps/backend-utils`; thirteen sign sites converted (five session services, three subject controllers, the agent module, the Telegram bot); `tokensValidAfter` with generated migration 0005 and `isRbacSubjectTokenRevoked`; type and revocation checks in is-authorized, refresh, `me`, logout, `init` and OAuth start; the middleware's per-subject cache mark; the response pipe's revoked-session branch; the `Token revoked` 401 keyword; READMEs and OpenAPI paths; twelve spec files new or extended.
- A second `docs` commit carries this progress file with the research, plan and process records.

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-26T01:52:00+03:00
