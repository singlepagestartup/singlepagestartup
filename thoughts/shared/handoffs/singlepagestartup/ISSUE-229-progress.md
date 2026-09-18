---
issue_number: 229
issue_title: "Shared HTTP error mapping: expired JWT (401), unique violation (409), unprocessable entity (422)"
covers_issues: [229, 232, 241]
start_date: 2026-09-18T23:26:21Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-229.md
status: in_progress
---

# Implementation Progress: ISSUE-229, ISSUE-232, ISSUE-241

**Started**: 2026-09-19
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-229.md`
**Worktree**: `.claude/worktrees/issue-229-error-mapping`, branch
`claude/issue-229-error-mapping` from `origin/main`.

One progress file covers the three issues because they change the same four
files and are implemented as three commits in one branch.

## Phase Progress

### Phase 1: Restore the 422 category and make the lane runnable (#241)

- [x] Started: 2026-09-18T23:30:00Z
- [x] Completed: 2026-09-18T23:45:00Z
- [x] Automated verification: `npx nx run @sps/backend-utils:jest:test`
      78 passed, 78 total (75 passed with 6 failures before the change);
      `npx nx run @sps/shared-backend-api:jest:test` 12 passed, 1 skipped.

**Notes**: The restored 422 entry alone would have moved every
`Validation error. Invalid body['data']: ... Expected string, got: ...` message
from the generic REST handlers to 422. A narrow 400 entry anchored to a leading
`Validation error` phrase, placed directly before the 422 entry, keeps those at 400. Three regression cases were added to the spec's 400 block to lock that.
The README's 422 keyword list named `invalid type`, which no restored pattern
matches on its own; it now names `invalid body['data']`, and the precedence rule
is stated under the table.

### Phase 2: Safe JWT verification and message sanitization (#229)

- [x] Started: 2026-09-18T23:50:00Z
- [x] Completed: 2026-09-19T00:25:00Z
- [x] Automated verification: `npx nx run-many --target=jest:test --projects=@sps/backend-utils,@sps/shared-backend-api,@sps/rbac`
      91, 12 (1 skipped) and 305 passed; `npx tsc --noEmit -p libs/shared/backend/utils/tsconfig.json`
      clean; `npx nx run-many --target=eslint:lint` over the same three projects clean.

**Notes**: The verification helper identifies a credential failure by
`error.name` rather than by message text, and only `JwtToken*`, `JwtHeader*` and
`JwtPayload*` are treated as credential failures; `JwtAlgorithmNotImplemented`
and any runtime failure (an empty secret raises `DataError`, an undefined one a
`TypeError`) are rethrown unchanged and keep mapping to 500. The helper's spec
uses the real Hono implementation rather than a mock, so it also documents what
Hono actually throws.

### Phase 3: Conflict category for unique violations (#232)

- [x] Started: 2026-09-19T00:30:00Z
- [x] Completed: 2026-09-19T01:10:00Z
- [x] Automated verification: `npx nx run-many --target=jest:test --projects=@sps/backend-utils,@sps/shared-backend-api,@sps/rbac`
      97, 12 (1 skipped) and 305 passed; `npx nx run-many --target=eslint:lint`
      over the same three projects clean; `npx tsc --noEmit` clean for
      `libs/shared/backend/utils`, `libs/shared/backend/api` and
      `libs/modules/rbac`.

**Notes**: The plan assumed the module-level duplicate recovery paths catch the
driver error before any mapper call. They do not: all three reach the database
through a server SDK over HTTP, so they receive whatever the remote app's
exception filter returned. See Incident 1.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 1 -->

### Incident 1 — The sanitized 409 would have broken every cross-hop conflict recovery

- **Occurrences**: 1
- **Stage**: Phase 3 - Conflict category for unique violations
- **Symptom**: Replacing the driver message with `Conflict error. Entity already exists` removes the text that three module-level recovery paths match on: the Telegram bootstrap replay (`telegram/bootstrap.ts:832`, `:862`), the OAuth identity link (`authentication/oauth/callback.ts:557`, `:595`) and, indirectly, anything else that inspects a server-SDK failure. Nothing failed in the suite, because their fixtures still carried the old raw payload.
- **Root Cause**: The plan recorded, from the research, that these paths receive the driver error before the mapper. They do not. Each one calls a server SDK over HTTP, so the error they catch is the `HTTPException` that `responsePipe` builds from the remote app's JSON body, which the remote exception filter produced after its own handler had already called the mapper.
- **Fix**: The shared `isUniqueConstraintError` now recognises the sanitized signature as well: the fixed conflict message and a `409` status, anywhere in the message, the record or a nested cause. The OAuth callback's private duplicate of the check delegates to the shared helper instead of matching the driver text itself. The Telegram bootstrap fixtures were rebuilt around the payload the API now returns.
- **Reusable Pattern**: Before changing a message that the framework produces, grep for code that matches on that text, and check whether the matcher sits in the same process or one HTTP hop away. In this repository, cross-model calls always go through a server SDK, so a message is a contract between hops.

## Summary

### Changes Made

- (populated during implementation)

### Pull Request

- [ ] PR created: not in this session; the lead verifies the branch first.

### Final Status

- [ ] All phases completed
- [ ] All automated verification passed

---

**Last updated**: 2026-09-19T01:10:00Z
