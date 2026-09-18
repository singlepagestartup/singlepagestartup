---
date: 2026-09-19T02:26:21+03:00
issue_number: 229
repository: singlepagestartup
topic: "Shared HTTP error mapping: expired JWT (401), unique violation (409), unprocessable entity (422)"
status: in_review
covers_issues: [229, 232, 241]
---

# Shared HTTP Error Mapping Implementation Plan

## Overview

Three open issues change the same four files: the shared error mapper
(`libs/shared/backend/utils/src/lib/http-error/*`), its pattern table, its
category union, and its spec. This plan covers all three in one place and
implements them as three commits in the order #241, #229, #232, so the spec
lane is green before new scenarios are added to it.

## Current State Analysis

`getHttpErrorType` classifies an error by a JSON-encoded status, a
`[Category]` message prefix, a numeric `status` property, or a regex table, and
otherwise returns 500 with `Internal server error: ${message}`
(`libs/shared/backend/utils/src/lib/http-error/index.ts:7-102`). In every branch
the message text is returned unchanged.

Three consequences are in scope:

1. Hono's JWT error classes interpolate the token into the message
   (`node_modules/hono/dist/utils/jwt/types.js`): `token (${token}) expired`,
   `invalid JWT token: ${token}`, `token(${token}) signature mismatched`. An
   expired token matches no pattern, so the request ends as a 500 whose message,
   response body, log record and Telegram report all carry the JWT (#229).
2. A PostgreSQL unique violation arrives as a `PostgresError` with
   `code: "23505"`, `constraint_name` and `detail` and a message reading
   `duplicate key value violates unique constraint "<name>"`. The mapper reads
   no driver field, so the request ends as a 500 carrying the constraint name
   (#232).
3. The `Unprocessable Entity error` (422) category was removed from the pattern
   table in `9d60d206df` (2025-10-23) without updating `README.md:456` or
   `http-error/index.spec.ts:100-114`. The spec has been red since
   (`npx nx run @sps/backend-utils:test`: 6 failed, 69 passed, 75 total at the
   branch point), and it stayed invisible because the project declares an Nx
   target named `test` rather than `jest:test`, so it is in no scoped lane
   (#241, #240).

Two shared pieces already exist and are reused rather than rewritten:

- `isUniqueConstraintError` (`libs/shared/backend/utils/src/lib/unique-constraint-error/index.ts`)
  already recognises `code === "23505"`, the `duplicate key ...` message, and
  both nested causes and `responsePipe`-serialized payloads.
- `authorization(c)` (`libs/shared/backend/utils/src/lib/authorization/index.ts`)
  is the shared reader for the cookie-then-header token.

### Research note for #241 (no research phase was run)

The evidence for #241 is in the issue body and in
`thoughts/shared/research/singlepagestartup/ISSUE-232.md:34`, `:108-110`, plus
the following checks made while planning:

- The removed entry is recoverable verbatim from `git show 9d60d206df -- libs/shared/backend/utils/src/lib/http-error/paterns/index.ts`:
  status 422, category `Unprocessable Entity error`, patterns
  `/expected string/i`, `/invalid body\['data'\]/i`, `/unprocessable entity/i`,
  `/invalid type[.]? expected email, got:/i`, positioned between the 403 and the
  500 entries.
- Restoring it at that position would move framework messages that begin with
  `Validation error.` from 400 to 422, because the generic REST create, update
  and find-or-create handlers throw
  `Validation error. Invalid body['data']: ... Expected string, got: ...`
  (`libs/shared/backend/api/src/lib/controllers/rest/handler/create/index.ts:23-26`
  and the matching lines in `update` and `find-or-create`). Those must stay 400.
- Exactly two framework messages legitimately move from 400 to 422, both of them
  the same unprefixed "body['data'] is not a string" text:
  `libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/update/index.ts:31-37`
  and
  `libs/modules/notification/models/template/backend/app/api/src/lib/controller/singlepage/render/index.ts:30-36`.
- `Validation error. Unprocessable Entity`
  (`.../template/.../render/index.ts:69`) and
  `Validation error. Invalid type. Expected email, got: ...` (`:52`) keep 400.
- Zod messages surfaced as `Expected string, received number` move from the 500
  fallback to 422. That is the behaviour the issue asks for.

## Desired End State

- An expired, malformed, not-yet-valid or signature-mismatched RBAC JWT produces
  HTTP 401 with a fixed message that contains no token, in the response body, the
  log record, the stack and the Telegram report.
- A PostgreSQL unique violation, direct or wrapped by a server-SDK hop, produces
  HTTP 409 with the fixed message `Conflict error. Entity already exists`; the
  constraint name, table, column, detail and submitted value stay out of the
  client payload and remain reachable server-side through `UtilsProp.details`.
- `README.md`, `type/index.ts`, `paterns/index.ts` and `index.spec.ts` agree on
  the category set, and `npx nx run @sps/backend-utils:jest:test` passes.

### Key Discoveries

- The 401 pattern list is evaluated before the 403 list, and `/authentication/i`
  sits in the 403 entry (`paterns/index.ts:26`). A message beginning
  `Authentication error.` therefore maps to 403 unless it also matches a 401
  pattern — the new fixed messages need matching 401 patterns to reach 401
  (`thoughts/shared/research/singlepagestartup/ISSUE-229.md:197-205`).
- The exception filter works from `error.message` and `error.stack` only; it
  never serializes `HTTPException.cause`
  (`libs/shared/backend/api/src/lib/filters/exception/index.ts:26-59`, `104-115`).
  An error thrown with a safe message therefore has a safe stack, because a
  stack begins with `Name: message`.
- Module-level duplicate recovery (`ensureEntity`, `createSubjectRoleIfMissing`,
  `linkIdentityToSubject`) catches the raw error before any handler calls the
  mapper, so a sanitized 409 message does not reach those code paths
  (`thoughts/shared/research/singlepagestartup/ISSUE-232.md:94-96`).
- The global `IsAuthorizedMiddleware` authorizes over an HTTP loopback, so one
  expired-token request passes through the exception filter twice. Fixing the
  message at the source fixes both passes.

## What We're NOT Doing

- Not migrating the other 21 Hono `jwt.verify` call sites listed in
  `thoughts/shared/research/singlepagestartup/ISSUE-229.md:305-346`. The sites
  that verify a token the handler has just signed are not a credential-leak path.
- Not changing `responsePipe`'s browser session heuristic
  (`libs/shared/utils/src/lib/response-pipe.ts:17-18`, `77-96`). It already fires
  on a 401 when browser auth state exists, which is the expired-token case.
- Not touching the rest of #240 (the scoped test lanes and `package.json`
  scripts); only the target rename that makes `@sps/backend-utils` runnable the
  same way as its neighbours.
- Not changing the exception filter's Telegram threshold, its response shape, or
  its `status >= 500` gate.
- Not adding preflight uniqueness lookups, schema changes, or new dependencies.

## Implementation Approach

The fix belongs at two boundaries. Credential-bearing text is replaced where it
is produced, by a shared verification helper that converts Hono JWT failures into
errors with fixed messages. Classification and sanitization stay in the shared
mapper, which every controller and middleware already calls, so no controller
gains logic.

---

## Phase 1: Restore the 422 category and make the lane runnable (#241)

### Overview

Bring `ErrorCategory`, the pattern table, the README table and the spec back into
agreement, and rename the Nx target so the suite runs through the same command as
its neighbours.

### Changes Required

#### 1. Category union

**File**: `libs/shared/backend/utils/src/lib/http-error/type/index.ts`
**Why**: `ErrorCategory` is the authoritative list; the spec asserts the string
`Unprocessable Entity error`, which the union must contain.
**Changes**: Add the `Unprocessable Entity error` member, keeping the existing
order (new member after `Not Found error`).

#### 2. Pattern table

**File**: `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts`
**Why**: The table is the evaluation order; position decides which of two
matching categories wins.
**Changes**: Restore the 422 entry with the four patterns removed in
`9d60d206df`. Insert, immediately before it, a narrow 400 `Validation error`
entry anchored to a leading `Validation error` phrase, so framework messages that
declare their own category keep 400 while unprefixed zod-shaped messages reach 422. Place both entries after the existing 500 and 404 entries and before the
full 400 entry, so no message that maps to 401, 403, 404 or 500 today changes.

#### 3. Documentation

**File**: `README.md` ("Automatic Error Categorization")
**Why**: The table is one of the four copies of this contract.
**Changes**: The 422 row already exists and becomes true again; no edit is needed
in this phase. Confirm the row still matches the restored keywords.

#### 4. Test target

**File**: `libs/shared/backend/utils/project.json`
**Why**: The target is named `test`, so the suite is absent from every lane that
runs `jest:test` and its failures were invisible for eleven months.
**Changes**: Rename the target to `jest:test`, keeping the executor and options.

### Success Criteria

#### Automated Verification

- [x] `npx nx run @sps/backend-utils:jest:test` passes, including the previously
      red 422 block.
- [x] `npx nx run @sps/shared-backend-api:jest:test` passes (it owns the generic
      REST handlers whose messages the new entry protects).

#### Manual Verification

- [ ] A request whose `data` field is not a string against a generic REST create
      route still returns 400.

---

## Phase 2: Safe JWT verification and message sanitization (#229)

### Overview

Convert Hono JWT failures into fixed, token-free authentication errors at a
shared boundary, classify those messages as 401, and redact any token-shaped text
that still reaches the mapper or the exception filter.

### Changes Required

#### 1. Shared verification helper

**File**: `libs/shared/backend/utils/src/lib/jwt-verify/index.ts` (new), exported
from `libs/shared/backend/utils/src/lib/index.ts`
**Why**: Hono's `verify` is the only producer of token-bearing messages in this
path, and four call sites need the same contract. The package already depends on
Hono, so this adds no dependency.
**Changes**: Verify the token through `hono/jwt` and, on failure, throw a new
`Error` with a fixed message: `Authentication error. Token expired` for
`JwtTokenExpired`, `Authentication error. Invalid token` for the other Hono JWT
error classes. Identify them by `error.name` rather than by message text. Rethrow
anything that is not a Hono JWT error unchanged, so configuration and runtime
failures keep mapping to 500. The original error is not attached as a cause,
because the cause would carry the token back into `UtilsProp.details`.

#### 2. Message sanitizer

**File**: `libs/shared/backend/utils/src/lib/http-error/sanitize/index.ts` (new),
exported from `libs/shared/backend/utils/src/lib/index.ts`
**Why**: Defence in depth for the call sites this plan does not migrate and for
any error that reaches the filter without passing a handler catch.
**Changes**: Replace the token inside each known Hono JWT message shape with
`<redacted>`, and replace any remaining three-part `eyJ...` value. Leave every
other message byte-identical, so unrelated text cannot be corrupted. The
sanitized expired-token text reads `token <redacted> expired`, which is the
signature the issue reports.

#### 3. Mapper

**File**: `libs/shared/backend/utils/src/lib/http-error/index.ts`
**Why**: Every controller and middleware catch already routes through it, so it
is the last common point before a message becomes an `HTTPException`.
**Changes**: Sanitize the extracted message once, before classification, and use
the sanitized text in every returned branch.

#### 4. Pattern table

**File**: `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts`
**Why**: `Authentication error. Token expired` matches `/authentication/i` in the
403 entry today; without new 401 patterns the fixed messages would return 403.
**Changes**: Add to the 401 entry a pattern for a token reported as expired, one
for an invalid token, and keep the existing `signature mismatched` pattern.

#### 5. Call sites

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts:127`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/me.ts:34`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/refresh.ts:35`
- `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-is-owner/index.ts:39`

**Why**: These four verify a token supplied by an unauthenticated caller. The
first is the hot path behind `IsAuthorizedMiddleware` and the one in the
production stack fragment.
**Changes**: Replace `jwt.verify(token, RBAC_JWT_SECRET)` with the shared helper.
Remove the now-unused `hono/jwt` import where nothing else in the file uses it.

#### 6. Exception filter

**File**: `libs/shared/backend/api/src/lib/filters/exception/index.ts`
**Why**: The filter is the only writer of logs, Telegram reports and error
bodies, and it can be reached by errors that never passed a handler catch.
**Changes**: Sanitize the collected messages and the stack before they are
logged, reported and returned.

### Success Criteria

#### Automated Verification

- [ ] `npx nx run @sps/backend-utils:jest:test` passes, including a new spec for
      the verification helper and new mapper scenarios asserting 401 and the
      absence of token text.
- [ ] `npx nx run @sps/rbac:jest:test` passes, including a scenario that makes
      `hono/jwt` throw the real `JwtTokenExpired` class and asserts the
      `is-authorized` service surfaces a token-free authentication error.
- [ ] `npx nx run @sps/shared-backend-api:jest:test` passes.

#### Manual Verification

- [ ] `GET /api/rbac/subjects/authentication/me` with an expired bearer token
      returns 401 and no response field contains the token.
- [ ] A protected route with the same token returns 401 through the middleware
      loopback.
- [ ] A valid token still authorizes, and an absent `RBAC_JWT_SECRET` still
      produces a configuration error with status 500.

---

## Phase 3: Conflict category for unique violations (#232)

### Overview

Recognise a unique violation structurally and answer it with a generic 409.

### Changes Required

#### 1. Category union

**File**: `libs/shared/backend/utils/src/lib/http-error/type/index.ts`
**Why**: `UtilsProp.category` is typed by the union.
**Changes**: Add the `Conflict error` member.

#### 2. Mapper

**File**: `libs/shared/backend/utils/src/lib/http-error/index.ts`
**Why**: The client-facing message must be replaced, not just re-classified, so a
pattern entry alone is not enough.
**Changes**: Before the existing branches, detect a unique violation with the
existing shared `isUniqueConstraintError` helper, which already reads the driver
`code`, the message and nested causes including a `responsePipe` payload. Return
status 409, category `Conflict error`, the fixed message
`Conflict error. Entity already exists`, and the unchanged `details` so the
driver error stays available to server-side code.

#### 3. Pattern table

**File**: `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts`
**Why**: An outer hop receives the already-sanitized message through the JSON
branch, which takes the category from the table.
**Changes**: Add a 409 `Conflict error` entry matching the conflict phrase and
the raw duplicate-key text, placed before the 400 entry.

#### 4. Documentation

**File**: `README.md` ("Automatic Error Categorization")
**Why**: The table is part of the contract that #241 has just made true again.
**Changes**: Add a `Conflict error | 409` row.

### Success Criteria

#### Automated Verification

- [ ] `npx nx run @sps/backend-utils:jest:test` passes, including scenarios for a
      driver-shaped `code: "23505"` error, a wrapped one, and an assertion that
      the returned message carries no constraint name.
- [ ] `npx nx run @sps/rbac:jest:test` passes; the module-level recovery paths
      that test the raw driver message are unaffected because they catch before
      the mapper.
- [ ] A non-`23505` database error still maps to 500.

#### Manual Verification

- [ ] Creating a blog article with an existing slug returns 409 with the generic
      message and no constraint name anywhere in the body.

---

## Testing Strategy

### Unit Tests

- `libs/shared/backend/utils/src/lib/http-error/index.spec.ts`: the restored 422
  block passes unchanged; new scenarios cover the expired-token message mapping
  to 401 with no token text, a driver-shaped unique violation mapping to 409 with
  a generic message, a wrapped unique violation, and a `Validation error.`
  prefixed body message staying 400.
- `libs/shared/backend/utils/src/lib/jwt-verify/index.spec.ts` (new): each Hono
  JWT error class becomes the expected fixed message, a non-JWT error is
  rethrown unchanged, and a valid token returns its payload.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.spec.ts`:
  a scenario where `hono/jwt` throws the real `JwtTokenExpired` from
  `hono/utils/jwt/types`, asserting the rejection message is the fixed text and
  contains no part of the token.

All specs use the repository BDD format: a JSDoc header with `BDD Suite` or
`BDD Scenario` and mandatory `Given`, `When`, `Then` lines, and behaviour-first
names.

### Manual Testing Steps

Against a running API of this worktree on `http://localhost:4011`; the exact
recipe is in the progress file
`thoughts/shared/handoffs/singlepagestartup/ISSUE-229-progress.md`.

1. Sign an expired token with `RBAC_JWT_SECRET` and call
   `GET /api/rbac/subjects/authentication/me`; expect 401 and no token text.
2. Create a blog article twice with the same slug; expect 409 and the generic
   conflict message.
3. Send a create request whose `data` field is not a string to a route that
   throws the unprefixed body message; expect 422.

## Performance Considerations

The sanitizer runs once per mapped error on a path that is already building a
JSON response; the unique-violation check is a bounded walk of at most five
cause levels. Neither runs on a successful request.

## Migration Notes

A child project that overrides the generic REST handlers, the exception filter,
or the pattern table inherits new statuses for three previously mixed cases:
401 for expired credentials, 409 for duplicates, 422 for unprefixed
shape-validation messages. Clients that treat any non-2xx as an outage will see
fewer 500s. Each commit carries the downstream trailers describing that.

## References

- Tickets: `thoughts/shared/tickets/singlepagestartup/ISSUE-229.md`,
  `ISSUE-232.md`, `ISSUE-241.md`
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-229.md`,
  `thoughts/shared/research/singlepagestartup/ISSUE-232.md`
- Companion plans: `thoughts/shared/plans/singlepagestartup/ISSUE-232.md`,
  `thoughts/shared/plans/singlepagestartup/ISSUE-241.md`
- Related: #240 (test lanes; only the target rename is taken here)
