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

Branch `claude/issue-229-error-mapping`, three commits from `origin/main`:

| Commit       | Issue | Subject                                                           |
| ------------ | ----- | ----------------------------------------------------------------- |
| `b124c57c41` | #241  | restore the 422 category the mapper lost                          |
| `ebe7c0ad92` | #229  | answer an expired JWT with 401 and keep the token out of the logs |
| `fd18256bbe` | #232  | answer a unique violation with 409 and no database detail         |

Nothing is pushed and no pull request exists; the lead verifies the branch first.

### Changes Made

**`b124c57c41` (#241)**

- `libs/shared/backend/utils/src/lib/http-error/type/index.ts` — added
  `Unprocessable Entity error`.
- `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts` — restored the
  422 entry removed in `9d60d206df`, preceded by a narrow 400 entry anchored to
  `/^validation error\b/i`.
- `libs/shared/backend/utils/project.json` — target `test` renamed to
  `jest:test`, reduced to the shared target default.
- `libs/shared/backend/utils/src/lib/http-error/index.spec.ts` — three prefixed
  messages locked at 400.
- `README.md` — corrected the 422 keywords and stated the precedence rule.

**`ebe7c0ad92` (#229)**

- `libs/shared/backend/utils/src/lib/jwt-verify/index.ts` and `index.spec.ts` —
  new shared `verifyJwt`.
- `libs/shared/backend/utils/src/lib/http-error/sanitize/index.ts` — new shared
  `sanitizeErrorMessage`.
- `libs/shared/backend/utils/src/lib/index.ts` — exports both.
- `libs/shared/backend/utils/src/lib/http-error/index.ts` — sanitizes the
  extracted message before classification.
- `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts` — 401 entries
  for an expired, invalid, invalid-JWT and not-yet-valid token; the subsumed
  `/invalid token issued/i` removed.
- `libs/shared/backend/api/src/lib/filters/exception/index.ts` — sanitizes the
  joined message, the stack and the nested causes once, before the log, the
  Telegram report and the response body.
- Four call sites migrated to `verifyJwt`:
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts`,
  `.../controller/singlepage/authentication/me.ts`,
  `.../service/singlepage/refresh.ts`,
  `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-is-owner/index.ts`.
- Specs: `http-error/index.spec.ts` (credential safety block) and
  `.../service/singlepage/is-authorized.spec.ts` (expired-token scenario using
  the real `JwtTokenExpired`).

**`fd18256bbe` (#232)**

- `libs/shared/backend/utils/src/lib/http-error/index.ts` — 409 with
  `Conflict error. Entity already exists` for a unique violation, `details`
  unchanged.
- `libs/shared/backend/utils/src/lib/http-error/type/index.ts` and
  `paterns/index.ts` — `Conflict error` category and a 409 entry.
- `libs/shared/backend/utils/src/lib/unique-constraint-error/index.ts` — also
  recognises the sanitized conflict message and a 409 status.
- `libs/modules/rbac/.../authentication/oauth/callback.ts` — the protected
  `isUniqueConstraintError` delegates to the shared helper.
- `libs/modules/rbac/.../telegram/bootstrap.spec.ts` — conflict fixtures rebuilt
  around the payload the API now returns.
- `README.md` — 409 row and a note on the two structural categories.
- Specs: `http-error/index.spec.ts` (409 block) and
  `unique-constraint-error/index.spec.ts` (sanitized cross-hop payload).

### Automated verification

- `npx nx run-many --target=jest:test --projects=@sps/backend-utils,@sps/shared-backend-api,@sps/rbac --skip-nx-cache`
  — 97 passed / 97, 12 passed with 1 skipped / 13, 305 passed / 305.
- `npx nx run-many --target=eslint:lint --projects=@sps/backend-utils,@sps/shared-backend-api,@sps/rbac --skip-nx-cache`
  — clean.
- `npx tsc --noEmit -p libs/shared/backend/utils/tsconfig.json`,
  `-p libs/shared/backend/api/tsconfig.json`, `-p libs/modules/rbac/tsconfig.json`
  — clean.
- `node tools/upstream/migrations.mjs message` — valid for each commit, before
  and after committing.

### Not done

- No push, no pull request, no `submit_pr_for_code_review.sh`.
- No verification against a running API; the recipe below is for the lead.
- The remaining Hono `jwt.verify` call sites are unchanged; they read a token the
  same handler has just signed.
- The rest of #240 (scoped test lanes, `package.json` scripts) is untouched.

### Manual verification against a running instance

The worktree's `apps/api/.env` sets `API_SERVICE_URL=http://localhost:4000` and no
`API_SERVICE_PORT`, so the default port is 4000. To run this worktree on 4011,
set **both** in `apps/api/.env`, because the global authorization middleware
calls itself back through `API_SERVICE_URL`; with only the port changed, the
loopback would reach a different instance:

```
API_SERVICE_PORT=4011
API_SERVICE_URL=http://localhost:4011
```

Then, from the worktree root, `npm run api:dev`.

**(a) Expired JWT to 401, #229**

Sign an expired token; the secret is read from the file and never printed:

```bash
bun -e '
const text = await Bun.file("apps/api/.env").text();
const line = text.split("\n").find((l) => l.startsWith("RBAC_JWT_SECRET="));
const secret = line.slice("RBAC_JWT_SECRET=".length).trim();
const { sign } = await import("hono/jwt");
const now = Math.floor(Date.now() / 1000);
console.log(await sign({ exp: now - 60, iat: now - 3600, subject: { id: "00000000-0000-0000-0000-000000000001" } }, secret));
'
```

```bash
TOKEN="<the printed token>"
curl -i -H "Authorization: Bearer $TOKEN" \
  http://localhost:4011/api/rbac/subjects/authentication/me
```

Expected: `HTTP/1.1 401`, and a body shaped
`{"requestId":"...","path":".../authentication/me","method":"GET","status":401,"error":"Authentication error. Token expired","stack":"Error: Authentication error. Token expired\n    at ...","cause":[{"message":"Authentication error. Token expired","stack":"..."}]}`.
The check that matters: `grep -c "$TOKEN"` over the whole response is 0, and the
same holds for the API log lines for that request. Before this change the same
call returned 500 with `Internal server error: token (<the whole token>) expired`.

A protected route with the same header, for example
`curl -i -H "Authorization: Bearer $TOKEN" http://localhost:4011/api/blog/articles`,
exercises the middleware loopback and must also return 401 with no token in the
body or in either of the two log records.

**(b) Unique violation to 409, #232**

```bash
SECRET=$(grep -m1 '^RBAC_SECRET_KEY=' apps/api/.env | cut -d= -f2-)
SLUG="conflict-check-$(date +%s)"
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:4011/api/blog/articles \
  -H "X-RBAC-SECRET-KEY: $SECRET" \
  -F "data={\"slug\":\"$SLUG\",\"adminTitle\":\"conflict check\"}"
curl -i -X POST http://localhost:4011/api/blog/articles \
  -H "X-RBAC-SECRET-KEY: $SECRET" \
  -F "data={\"slug\":\"$SLUG\",\"adminTitle\":\"conflict check\"}"
```

Expected: the first call `201`, the second `HTTP/1.1 409` with
`{"requestId":"...","path":".../api/blog/articles","method":"POST","status":409,"error":"Conflict error. Entity already exists","stack":"...","cause":[{"message":"Conflict error. Entity already exists","stack":"..."}]}`.
The checks that matter: the body contains neither `sps_blog_article_slug_unique`
nor `duplicate key` nor the submitted slug, and no Telegram report is sent,
because the status is below 500. Before this change the second call returned 500
with the constraint name in `error`, `stack` and `cause`.

**(c) Zod-shaped message to 422, #241**

The notification template render handler throws its body message without a
category prefix, and rejects a `data` part that is not a string. Any uuid works,
because the check runs before the lookup:

```bash
SECRET=$(grep -m1 '^RBAC_SECRET_KEY=' apps/api/.env | cut -d= -f2-)
printf 'not-a-string' > /tmp/sps-422-probe.txt
curl -i -X POST \
  "http://localhost:4011/api/notification/templates/00000000-0000-0000-0000-000000000001/render" \
  -H "X-RBAC-SECRET-KEY: $SECRET" \
  -F "data=@/tmp/sps-422-probe.txt"
```

Expected: `HTTP/1.1 422` with
`"error":"Invalid body['data']: ... . Expected string, got: object"`. Before this
change the same call returned 400.

The counterpart that must not move: the same probe against a generic REST create
route, whose handler prefixes the message with `Validation error.`, still returns
400:

```bash
curl -i -X POST http://localhost:4011/api/blog/articles \
  -H "X-RBAC-SECRET-KEY: $SECRET" \
  -F "data=@/tmp/sps-422-probe.txt"
```

### Pull Request

- [ ] PR created: not in this session; the lead verifies the branch first.

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Manual verification against a running API: for the lead

---

## Follow-up after the lead's verification

The lead verified (a), (b) and (c) on a running instance; all three behaved as
described. One gap was found and closed in the fourth code commit on this
branch, `fix(backend-utils): describe zod issues in 422 responses`.

### The gap

`POST /api/blog/articles` with `data={"slug":123}` answered 422, but with an
empty text: `{"status":422,"error":"","cause":[{"message":""}]}`. The shared
repository rethrows a failed schema parse as
`new Error(JSON.stringify({ zodError: error.issues }))`
(`libs/shared/backend/api/src/lib/repository/database/index.ts:105`, `:131`,
`:160`, `:176`, `:222`, `:254`, `:311`). That payload has no `message` key, so
the mapper returned the raw JSON as the message, and the exception filter's JSON
branch found nothing to push into `errorMessages`.

### The fix

- `libs/shared/backend/utils/src/lib/http-error/zod-issues/index.ts` (new) —
  `formatZodIssues` turns the issue list into
  `Unprocessable Entity error. <path>: <issue message>`, joins the first three
  with `; `, counts the rest, and drops a trailing quoted `received '<value>'`
  segment so request data stays out of the client-facing text. It accepts either
  the issue array the repository sends or an object with an `issues` array.
- `libs/shared/backend/utils/src/lib/http-error/index.ts` — when the parsed
  payload carries `zodError`, the mapper returns 422 with that message and keeps
  the issue list in `details`, which the handler passes as the exception cause
  and the filter does not serialize.
- `libs/shared/backend/utils/src/lib/http-error/index.spec.ts` — five scenarios:
  a type mismatch described by path, a missing field, a quoted submitted value
  that must not survive, several issues with a counted remainder, and an empty
  payload that keeps its previous classification.
- `README.md` — the behaviour is documented under the category table.

A second case is fixed with it: a missing required field serializes as
`{"message":"Required"}` inside the payload, which matched no pattern and fell
to 500. It now answers 422 as well.

`Validation error.` prefixed messages are untouched, because this branch runs
only for a payload with a `zodError` key.

### Verification of the follow-up

- `npx nx run @sps/backend-utils:jest:test --skip-nx-cache` — 102 passed / 102.
- `npx nx run @sps/shared-backend-api:jest:test --skip-nx-cache` — 12 passed,
  1 skipped.
- `npx nx run-many --target=eslint:lint --projects=@sps/backend-utils,@sps/shared-backend-api --skip-nx-cache`
  — clean.
- `npx tsc --noEmit -p libs/shared/backend/utils/tsconfig.json` and
  `-p libs/shared/backend/api/tsconfig.json` — clean.
- The mapper and the real exception filter were also driven with the article
  insert schema outside the suite, which is where the expected body below comes
  from.

### (d) Zod type error carries a readable message

```bash
SECRET=$(grep -m1 '^RBAC_SECRET_KEY=' apps/api/.env | cut -d= -f2-)
curl -i -X POST http://localhost:4011/api/blog/articles \
  -H "X-RBAC-SECRET-KEY: $SECRET" \
  -F 'data={"slug":123}'
```

Expected `HTTP/1.1 422` and:

```json
{
  "requestId": "<x-request-id>",
  "path": "http://localhost:4011/api/blog/articles",
  "method": "POST",
  "status": 422,
  "error": "Unprocessable Entity error. slug: Expected string, received number",
  "stack": "Error: Unprocessable Entity error. slug: Expected string, received number\n    at ...",
  "cause": [
    {
      "message": "Unprocessable Entity error. slug: Expected string, received number",
      "stack": "..."
    }
  ]
}
```

The article insert schema reports exactly one issue for this body, so the
message has no `; ` list and no `and N more` suffix. The probes in (a), (b) and
(c) are unchanged.

---

**Last updated**: 2026-09-19T02:10:00Z
