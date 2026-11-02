## Summary

Three production failures share one cause: the shared HTTP error mapper in `@sps/backend-utils` had no category for them, so each fell through to the 500 branch and carried the raw error text into the response body, the stack, the log record and the Telegram bug channel.

- An expired session answered 500 with the whole JWT inside the message, because Hono builds its failure text as `token (<the whole token>) expired`. The global authorization middleware calls the RBAC API back over loopback, so the token was written twice per request.
- A duplicate unique value answered 500 with the constraint name in the body, so a client could not tell a correctable conflict from an outage and every duplicate insert raised a bug report.
- A zod-shaped message answered 500 after the 422 category was removed from the pattern table in `9d60d206df` without touching the README that documents it or the spec that asserts it. Six of the mapper's own cases had been red since, unnoticed because the project declared an Nx target named `test` rather than `jest:test` and belonged to no lane.

Expired and invalid credentials now answer 401 with a fixed message and no token anywhere in the output, a unique violation answers 409 with `Conflict error. Entity already exists` and no database detail, and a failed schema parse answers 422 with a message naming the field and the issue.

Closes #229
Closes #232
Closes #241

## Changes

**Credential failures (#229)**

- `libs/shared/backend/utils/src/lib/jwt-verify/index.ts` — `verifyJwt` stands in front of `hono/jwt`. It recognises a credential failure by `error.name` (`JwtToken*`, `JwtHeader*`, `JwtPayload*`) and throws a new error reading `Authentication error. Token expired` or `Authentication error. Invalid token`. The source error is replaced rather than wrapped, because a cause would carry the token back into the details and the stack. `JwtAlgorithmNotImplemented` and runtime faults such as a missing secret are rethrown untouched and still map to 500.
- Four call sites that verify a caller-supplied token use it: the is-authorized service behind the global middleware, the `authentication/me` handler, the refresh service, and the `request-subject-is-owner` middleware. The remaining `jwt.verify` calls read a token the same handler has just signed.
- `libs/shared/backend/utils/src/lib/http-error/sanitize/index.ts` — `sanitizeErrorMessage` replaces the interpolated value in each known Hono shape and any remaining three-part `eyJ` value with `<redacted>`. Every pattern is bounded by a character a token cannot contain, so a message embedded in a serialized payload stays parseable.
- The mapper sanitizes the message before classification, and `libs/shared/backend/api/src/lib/filters/exception/index.ts` sanitizes the joined message, the stack and the nested causes once, before the log, the Telegram report and the response body are built. Both are defences for callers this change did not migrate.
- The 401 pattern list gained the expired, invalid, invalid-JWT and not-yet-valid shapes; without them `Authentication error. Token expired` would have matched the `/authentication/i` pattern in the 403 entry.

**Unique violations (#232)**

- The mapper recognises the violation before it classifies anything, through the shared `isUniqueConstraintError`, and answers 409 with the fixed message. The driver error stays on `details`, so server-side code keeps the constraint, table, column and detail fields.
- `isUniqueConstraintError` also recognises the sanitized signature and the 409 status. Two module-level recovery paths, the Telegram bootstrap replay and the OAuth identity link, reach the database through a server SDK, so what they catch is the remote app's response rather than the driver error. Sanitizing the text alone would have disabled both without failing a test, because their fixtures still carried the old payload. The OAuth callback's private copy of the check delegates to the shared helper, and the bootstrap fixtures were rebuilt around the payload the API now returns.

**Schema rejections (#241 and the follow-up)**

- `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts` — the `Unprocessable Entity error` entry returns, preceded by a narrow 400 entry anchored to `/^validation error\b/i`. Its first pattern, `/expected string/i`, also matches the generic REST handlers' `Validation error. Invalid body['data'] ...` text, which stays 400; only an unprefixed shape-validation message reaches 422.
- `libs/shared/backend/utils/src/lib/http-error/zod-issues/index.ts` — `formatZodIssues` turns the issue list the shared repository rethrows as `JSON.stringify({ zodError: error.issues })` into one line. That payload has no `message` key, so the mapper used to return the raw JSON and the exception filter printed an empty string. The first three issues are described and the rest counted, so a wide form cannot produce an unbounded message, and a trailing quoted `received '...'` segment is dropped so submitted values stay out of the client text. The issue list stays in `details`, which the filter does not serialize.
- A missing required field is fixed by the same change: its issue message is `Required`, which matched no pattern and fell to 500.
- `libs/shared/backend/utils/project.json` — the target `test` is renamed to `jest:test` and reduced to the shared target default, which puts the mapper's suite back in a lane.
- `README.md` — the 422 keyword list names `invalid body['data']` rather than `invalid type`, a 409 row is added, and the precedence rule, the two structurally recognised categories and the zod message shape are stated under the table.

## Downstream migration

Four code commits carry `Downstream-Impact: required`; the progress-record commit carries `none`.

**Applies to** projects that branch on the status or the text of authentication failures, alert on 500 responses from the authorization path, or call `hono/jwt` verify directly in owned code; projects that surface or retry create conflicts, alert on 500 responses from write paths, or detect duplicates by matching the driver message; projects whose clients, tests or monitoring branch on the status of validation failures, or whose clients read the error text of a rejected create or update; and projects with an owned copy of the mapper, the pattern table, the category union, the mapper spec, or the repository that serializes zod issues.

**Actions**

- Treat 401 from the authorization path as an expired or invalid credential and refresh or re-authenticate instead of reporting an outage; drop alert rules that counted these as server errors.
- Replace direct `hono/jwt` verify calls on caller-supplied tokens in owned code with `verifyJwt` from `@sps/backend-utils`, otherwise those paths keep writing the token into logs.
- Update owned assertions or log parsers that expect the previous authentication text, which contained the token. The message is now `Authentication error. Token expired` or `Authentication error. Invalid token`, and redacted text reads `token <redacted> expired`.
- Handle 409 on create and update paths as a duplicate the caller can correct, and present it instead of a generic failure.
- Replace owned duplicate-detection regexes over the driver message with `isUniqueConstraintError` from `@sps/backend-utils`, since a message crossing an HTTP hop no longer contains the constraint text.
- Update owned test fixtures that simulate a lost race with a 500 and a duplicate-key message; the API now returns 409 with the fixed conflict message.
- Treat 422 as a client-correctable validation failure wherever 400 or 500 was expected for shape-validation messages, in API clients, error handling and alert rules, and treat a missing required field as 422 rather than 500.
- In an owned pattern table, add the `Unprocessable Entity error` entry and keep an anchored `Validation error` entry before it, otherwise owned messages that open with a category phrase move to 422. In an owned mapper, describe a `zodError` payload before classification, because the exception filter parses a JSON-looking message instead of printing it.
- Show the returned error text on a rejected form instead of a generic failure, and stop treating an empty 422 body as the expected shape.
- Rename an owned `@sps/backend-utils` test target from `test` to `jest:test`, or keep invoking the old name explicitly in owned scripts.

**Verify**

- Call a protected route with an expired token: 401, with no part of the token in the body, the stack or the log record; a valid token still authorizes and a missing `RBAC_JWT_SECRET` still yields a configuration error.
- Create an entity twice with the same unique value: 409, with no constraint, table, column or submitted value in the body; a non-unique database failure still returns 500 and a concurrent bootstrap still replays.
- Post a create request with a field of the wrong type: 422, with a message naming the field and the issue; a missing required field is 422 rather than 500; no submitted value appears in either body; a request with a non-string `data` field still returns 400.
- Run the mapper suite through the renamed target and confirm the 422 block passes.

## Verification

- [x] `npx nx run-many --target=jest:test --projects=@sps/backend-utils,@sps/shared-backend-api,@sps/rbac --skip-nx-cache` — 102 passed, 12 passed with 1 skipped, 305 passed.
- [x] `npx nx run-many --target=eslint:lint --projects=@sps/backend-utils,@sps/shared-backend-api,@sps/rbac --skip-nx-cache` — 0 errors. The 2 warnings are on `libs/shared/backend/api/src/lib/controllers/rest/index.ts:155` and `:169`, which this branch does not touch.
- [x] `npx tsc --noEmit` for `libs/shared/backend/utils`, `libs/shared/backend/api` and `libs/modules/rbac` — clean.
- [x] `node tools/upstream/migrations.mjs message` — valid for each commit, before and after committing.
- [x] Manual verification against a running instance: probes (a), (b), (c) and (d) below all behaved as described.

## How to verify it

The worktree's `apps/api/.env` sets `API_SERVICE_URL=http://localhost:4000` and no `API_SERVICE_PORT`, so the default port is 4000. To run this branch on 4011, set **both** values, because the global authorization middleware calls itself back through `API_SERVICE_URL`; with only the port changed, the loopback reaches a different instance.

```
API_SERVICE_PORT=4011
API_SERVICE_URL=http://localhost:4011
```

Then `npm run api:dev` from the worktree root.

**(a) Expired JWT answers 401 (#229)**

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

Expected `HTTP/1.1 401` with a body shaped `{"requestId":"...","path":".../authentication/me","method":"GET","status":401,"error":"Authentication error. Token expired","stack":"Error: Authentication error. Token expired\n    at ...","cause":[{"message":"Authentication error. Token expired","stack":"..."}]}`. The check that matters: `grep -c "$TOKEN"` over the whole response is 0, and the same holds for the API log lines for that request. Before this change the same call returned 500 with `Internal server error: token (<the whole token>) expired`.

A protected route with the same header exercises the middleware loopback and must also return 401 with no token in the body or in either of the two log records:

```bash
curl -i -H "Authorization: Bearer $TOKEN" http://localhost:4011/api/blog/articles
```

**(b) Unique violation answers 409 (#232)**

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

Expected: the first call `201`, the second `HTTP/1.1 409` with `"error":"Conflict error. Entity already exists"` and the same text in `cause`. The checks that matter: the body contains neither `sps_blog_article_slug_unique` nor `duplicate key` nor the submitted slug, and no Telegram report is sent, because the status is below 500. Before this change the second call returned 500 with the constraint name in `error`, `stack` and `cause`.

**(c) Unprefixed shape message answers 422, prefixed stays 400 (#241)**

The notification template render handler throws its body message without a category prefix and rejects a `data` part that is not a string. Any uuid works, because the check runs before the lookup:

```bash
SECRET=$(grep -m1 '^RBAC_SECRET_KEY=' apps/api/.env | cut -d= -f2-)
printf 'not-a-string' > /tmp/sps-422-probe.txt
curl -i -X POST \
  "http://localhost:4011/api/notification/templates/00000000-0000-0000-0000-000000000001/render" \
  -H "X-RBAC-SECRET-KEY: $SECRET" \
  -F "data=@/tmp/sps-422-probe.txt"
```

Expected `HTTP/1.1 422` with `"error":"Invalid body['data']: ... . Expected string, got: object"`. Before this change the same call returned 400.

The counterpart that must not move: the same probe against a generic REST create route, whose handler prefixes the message with `Validation error.`, still returns 400.

```bash
curl -i -X POST http://localhost:4011/api/blog/articles \
  -H "X-RBAC-SECRET-KEY: $SECRET" \
  -F "data=@/tmp/sps-422-probe.txt"
```

**(d) Zod type error carries a readable message**

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

The article insert schema reports exactly one issue for this body, so the message has no `; ` list and no `and N more` suffix. Before the fourth commit the same call answered `{"status":422,"error":"","cause":[{"message":""}]}`.

## Notes

- Two framework error paths change status without a downstream flag of their own: the ecommerce order update and the notification template render controllers throw the `body['data']` text without a category prefix, so both move from 400 to 422.
- The remaining `hono/jwt` verify call sites are unchanged. They read a token the same handler has just signed, which is not a path a caller's credential travels.
- The rest of #240 — scoped test lanes and the `package.json` scripts — is untouched; only the `@sps/backend-utils` target is renamed here.
- Nx reported `@sps/backend-utils:jest:test` as a flaky task on a cached run. Two consecutive runs with `--skip-nx-cache` passed 102 of 102; the flag follows the target rename, which changes the task hash.
