# Issue #229: Map expired JWT failures to 401 without logging token contents

## Metadata

- **URL**: https://github.com/singlepagestartup/singlepagestartup/issues/229
- **Issue**: #229
- **Status**: Research Needed
- **Created**: 2026-08-08T21:34:01Z
- **Labels**: `size:small`
- **Type**: bug
- **Priority**: high
- **Size**: small

---

## Problem to Solve

An expired RBAC subject JWT is treated as an internal server failure. The
underlying Hono verification error includes the complete token in its message;
the shared HTTP-error mapper does not recognize that expired-token shape, so it
returns HTTP 500 while preserving the token text. The exception filter then
writes that message to production logs, includes it in the API response, and
may forward it to the configured bug-notification channel.

The 2026-08-08 production audit found one normalized event in `api_api`,
represented by four structured status records between
2026-08-08T17:19:39.246535912Z and 2026-08-08T17:19:39.310715738Z.

## Key Details

- Affected service: `api_api`.
- Sanitized signature:
  `Internal server error: token <redacted> expired` with HTTP status 500.
- Minimal safe stack fragment:

  ```text
  HTTPException: Internal server error: token <redacted> expired
    at libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/is-authorized/index.ts:76:17
    at libs/middlewares/src/lib/is-authorized/index.ts:107:19
  ```

- Observed behavior: a normal expired authentication credential becomes a 500
  response and the complete JWT is copied into error logs, response error
  fields, and potentially the status-500 notification message.
- Expected behavior: expired JWT verification fails with a safe 401
  authentication error and no token value appears in logs, API error payloads,
  nested causes, stacks, or notifications.
- Impact: clients see a server failure instead of an authentication challenge,
  monitoring receives a false application incident, and credential material is
  retained in log/notification systems. The observed token was already expired,
  but token values remain sensitive and must never be logged.
- Root cause (as stated in the issue):
  - `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts:127`
    passes the bearer value to `jwt.verify`, whose expired-token error embeds
    that value in the message.
  - `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts:7-18`
    recognizes malformed/signature JWT errors but not the expired-token shape.
  - `libs/shared/backend/utils/src/lib/http-error/index.ts:96-100` falls through
    to HTTP 500 and interpolates the unsanitized source message.
  - `libs/shared/backend/api/src/lib/filters/exception/index.ts:52-59`,
    `61-80`, and `104-114` reuse the message for logs, 500 notifications, and
    the response body.
- Production image evidence:
  `singlepagestartup/didigallery:0.0.224@sha256:50131dc9e1c21c1877a1cc0c6062ae85bda30099d878b2a618b3aebaf377e138`.
- Repository ownership is `singlepagestartup/singlepagestartup`: every
  load-bearing file is framework runtime/shared error-handling code and is
  identical or directly equivalent in fetched `upstream/main@961fe1bc37c3`.
- Open and closed issues in both `singlepagestartup/singlepagestartup` and
  `flakecode/didigallery` were searched by expired-JWT signature,
  `is-authorized`, HTTP-error mapping, and status 500; no duplicate was found.

## Reproduction / Conditions

1. Create or supply an otherwise valid RBAC subject JWT whose `exp` is in the
   past.
2. Call a route protected by `IsAuthorizedMiddleware` with
   `Authorization: Bearer <expired-token>`.
3. Observe that `jwt.verify` rejects with a message containing the token.
4. Observe that `getHttpErrorType` maps it to HTTP 500 and the exception filter
   serializes the token-bearing message.

## Implementation Notes

### Proposed Fix (from the issue)

- Normalize JWT verification failures at a shared boundary so expired tokens
  become a safe authentication error such as `Authentication error. Token is
expired` with status 401.
- Ensure normalization replaces, rather than wraps, source messages that may
  contain credentials. Do not solve the status mapping by a regex that still
  returns the original token-bearing text.
- Add defense-in-depth redaction for JWT-shaped values before exception
  messages and nested causes enter logs, responses, or bug notifications.
- Apply the same contract to other framework paths that call `jwt.verify`, not
  only the global authorization route.

### Alternatives and Risks (from the issue)

- Adding only an expired-token regex to the 401 pattern list fixes status but
  still leaks the token through the original message; this is insufficient.
- Catching only in `is-authorized.ts` leaves other direct `jwt.verify` callers
  vulnerable to the same behavior. A shared normalization/redaction boundary
  provides broader protection, but it must preserve useful non-sensitive error
  details.
- Broad token redaction must avoid corrupting unrelated messages. Tests should
  cover JWT-shaped values and ordinary error text independently.

### Constraints

Keep the fix in shared framework authentication/error-handling code. Do not
log or attach the source JWT verification message before sanitization.

## Acceptance Criteria

- Expired RBAC JWTs return HTTP 401 with a stable, token-free authentication
  error.
- The raw JWT is absent from logs, response error/stack/cause fields, and bug
  notification messages.
- Malformed and invalid-signature JWTs keep their existing 401 behavior and are
  also token-free.
- Genuine configuration/runtime failures continue to map to 500.
- Shared behavior applies consistently to global authorization and other
  framework `jwt.verify` call sites.

## Test Plan (from the issue)

- Add BDD unit coverage for `getHttpErrorType` or the selected shared JWT error
  normalizer using an expired-token error whose message embeds a fake token.
- Add BDD API/middleware coverage that calls a protected route with an expired
  JWT and asserts status 401 plus a token-free response body.
- Capture logger and bug-notifier output in tests and assert that neither the
  fake JWT nor its payload fragments are emitted.
- Regression-test malformed, invalid-signature, valid, and configuration-error
  cases.
- After deployment, audit `api_api` logs and confirm the sanitized signature is
  handled as 401 with no status-500 event.

## References

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/is-authorized/index.ts`
- `libs/middlewares/src/lib/is-authorized/index.ts`
- `libs/shared/backend/utils/src/lib/http-error/index.ts`
- `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts`
- `libs/shared/backend/api/src/lib/filters/exception/index.ts`
- Production image: `singlepagestartup/didigallery:0.0.224`
- Upstream reference: `upstream/main@961fe1bc37c3`

## Comments

No comments on the GitHub issue at the time of ticket creation (2026-09-18).
