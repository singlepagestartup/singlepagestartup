---
date: 2026-09-26T02:10:00+03:00
issue_number: 305
repository: singlepagestartup
topic: "Session credentials travel only in request headers"
status: approved
---

# Session Credentials in Headers Only: Implementation Plan

## Overview

The API stops writing its own `rbac.subject.jwt` cookie and accepts the
subject JWT only from `Authorization: Bearer`; every reader of the operator
secret accepts it only from `X-RBAC-SECRET-KEY`. The browser keeps writing its
own JWT cookie with js-cookie and sending it as a header, unchanged.

## Current State Analysis

Research: `thoughts/shared/research/singlepagestartup/ISSUE-305.md`.

- Six issuance routes write a JavaScript-readable `rbac.subject.jwt` cookie
  on the API origin (research section 1), so any script that runs on that
  origin can read the session token.
- The API accepts the JWT from that cookie in the shared `authorization`
  helper (cookie before header), the is-authorized middleware, the subject
  `is-authorized` and `bill-route` controllers and OAuth `start` (section 2).
- Seven readers accept the operator secret from an `rbac.secret-key` cookie
  and the browser forwards that cookie as a header (section 3). Nothing writes
  it.
- The browser holds its session in its own cookie and localStorage and sends
  `Authorization` through `saturateHeaders`; four browser request paths that
  need a session never send it (section 5).

## Desired End State

- `init`, `refresh`, the Ethereum login, the OAuth exchange and
  email-and-password authentication and registration answer `201` with
  `{ jwt, refresh }` in the body and send no `rbac.subject.jwt` cookie.
- A JWT presented only in a cookie is anonymous to every API guard and
  handler; `Authorization: Bearer <jwt>` authenticates as before.
- The operator secret presented only in an `rbac.secret-key` cookie grants
  nothing anywhere; `X-RBAC-SECRET-KEY` keeps working.
- The browser sends no `X-RBAC-SECRET-KEY`; identity `changePassword`, the
  wallet component's identity lookup and the hand-written broadcast and social
  client functions send `Authorization` like every other client SDK call.
- Documentation describes header-only credentials.

Verification: the unit lanes of every changed project, lint and type checks,
and an HTTP proof on port 4305 (Phase 5).

### Key Discoveries

- Cookies ignore ports: in local development (`localhost:3000` and
  `localhost:4000`) the API cookie and the js-cookie cookie are one jar entry.
  An HttpOnly API cookie hides the JWT from `document.cookie` and blocks the
  js-cookie write (measured, research section 6), and `init-default` then
  refreshes on every one-second tick (`init-default/ClientComponent.tsx:128-147,214-228`).
- Every login response carries the tokens in its body and every client login
  hook persists from the body (`persistAuthenticationTokens`, research section
  4); MCP OAuth reads `data.jwt` from the body (`apps/mcp/lib/oauth.ts:845-880`);
  server rendering sends the header (`me-default/server.tsx:9-12`).
- In the six issuance handlers the lifetime guard, the re-verification of the
  just-signed token and its `exp` check exist only to build the cookie; the
  services guard their own secrets and always set `exp` (research section 1).
- `readRbacSecret` and `authorization` in `@sps/backend-utils` are the shared
  readers; making them header-only and routing every inline read through them
  puts each rule in one place.
- The identity `changePassword` route has no permission row, so only an
  authenticated subject holding the root permission passes; today that request
  authenticates only through the API cookie.

## Decision: option (b)

The API takes the JWT only from the `Authorization` header and writes no
session cookie of its own.

- **Option (a) breaks local development.** With the host on `localhost:3000`
  and the API on `localhost:4000`, an HttpOnly API cookie shadows the
  frontend's own cookie of the same name, path and host. The frontend can no
  longer see or rewrite its JWT and `init-default` loops on `refresh`. Gitpod
  serves both apps from one origin and breaks the same way. This is the flow
  the ticket requires to stay unchanged.
- **Option (a) leaves the session usable from the API origin.** A script
  there cannot read an HttpOnly cookie, but its same-origin requests carry the
  cookie and it reads the responses. Under (b) the API origin holds no
  credential the API accepts.
- **Nothing needs the API cookie.** The browser authenticates with the header
  on every path once the four gaps below are closed. Deployments whose API and
  host are on different registrable domains already work that way, because a
  `SameSite=Strict` cookie is never sent across sites.
- **One reading rule.** The `authorization` helper reads the cookie first and
  the middleware reads the header first; header-only removes the difference.

Consequences carried by this plan:

- The browser requests that relied on the API cookie send the header
  (Phase 2).
- No compatibility flag restores the cookie. A flag would restore exactly the
  readable credential the finding is about, and no framework caller needs it.
  A child project whose own browser code authenticates through the API cookie
  sends the header instead; the commit trailers say so.
- `logout` keeps deleting `rbac.subject.jwt`, which clears a copy an earlier
  release left in the browser. Such a copy is ignored by the API and expires
  within `RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS` (default 3600) of its issuance.

Use cases verified to keep working, with the evidence:

- Local development and tunnels: header-based, and the API no longer writes a
  cookie that could collide with the frontend's.
- Cross-origin API access and integrations: header-based today.
- File uploads: the file-storage admin form uses the factory `create`
  mutation, which calls `saturateHeaders`.
- Anonymous cart: the subject order routes are called through the subject
  client SDK with `saturateHeaders`; the issue-152 scenario uses the same flow.
- Every documented login path: tokens come from the response body.
- MCP OAuth: reads `data.jwt` from the login response body.

## What We're NOT Doing

- Not changing the browser's own session flow: `persistAuthenticationTokens`,
  `init-default`, `response-pipe` and the JWT part of `authorization.headers()`
  stay as they are, and the host cookie stays readable by design.
- Not changing the OAuth exchange-code cookie or
  `RBAC_OAUTH_EXCHANGE_CODE_IN_QUERY`.
- Not changing how is-authorized, `request-subject-is-owner` and the subject
  controllers compare the operator secret (#295); the edited lines change only
  where the secret is read.
- Not touching the allow rules and origin handling (#308) or the permission
  defaults (#303).
- Not changing the server SDK `init` and `logout` actions that drop caller
  headers: both routes are allow-listed and the browser calls `init` only
  without a valid token (recorded in `plans/singlepagestartup/ISSUE-234.md:46`).
- Not changing the host page URL reads, which are public.
- Not changing file storage or the authorization cache.
- MCP keeps reading `rbac.subject.jwt` from its own incoming requests and
  forwards it as a bearer header; only the secret cookie goes.

## Implementation Approach

Close the secret path first, then make every browser request that needs a
session send the header, then flip the JWT readers and remove the cookie
writes, then the documentation. Each phase carries its own specs, written in
the repository BDD format, and each guard is mutation-checked.

## Phase 1: The operator secret travels only in the header

### Overview

Every reader of the operator secret ignores the `rbac.secret-key` cookie and
the browser stops forwarding it.

### Changes Required

#### 1. Shared reader

**File**: `libs/shared/backend/utils/src/lib/rbac-secret/index.ts`
**Why**: `readRbacSecret` falls back to the cookie (`:12-14`); the
operator-secret middleware and the telegram-star webhook use it.
**Changes**: read the header only and rewrite the doc comment to say the
secret is a service credential sent as a header.

#### 2. Inline readers

**Files**: `libs/middlewares/src/lib/is-authorized/index.ts:44-45`,
`libs/middlewares/src/lib/bill-route/index.ts:38-39`,
`libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-is-owner/index.ts:22-23`,
`.../controller/singlepage/authentication/is-authorized/index.ts:18-20`,
`.../controller/singlepage/authentication/bill-route/index.ts:18-20`
**Why**: each repeats the header-or-cookie read.
**Changes**: read through `readRbacSecret`; drop the `getCookie` imports that
become unused. Leave the comparisons untouched.

#### 3. Operator-secret middleware

**File**: `libs/middlewares/src/lib/operator-secret/index.ts`
**Why**: its doc comment says the secret arrives in a header or a cookie.
**Changes**: comment only; the behavior follows the shared reader.

#### 4. MCP

**File**: `apps/mcp/lib/auth.ts:104-110`
**Why**: forwards an `rbac.secret-key` cookie of an MCP request as the
operator header.
**Changes**: drop the cookie source; keep the header, auth-info and `_meta`
sources.

#### 5. Browser header helper

**File**: `libs/shared/frontend/client/utils/src/lib/authorization/headers.ts`
**Why**: forwards `rbac.secret-key` from `document.cookie`.
**Changes**: build only the `Authorization` header.

#### 6. Specs

- Update `rbac-secret/index.spec.ts` (the cookie is ignored),
  `operator-secret/index.spec.ts` (a cookie-only secret is refused),
  `headers.spec.ts` (no `X-RBAC-SECRET-KEY`) and
  `apps/mcp/lib/content-management/auth.spec.ts` (a cookie-only secret is not
  forwarded).
- New `libs/middlewares/src/lib/is-authorized/index.spec.ts`: a cookie-only
  secret is not privileged and reaches the permission check, the header is.
- New `libs/middlewares/src/lib/bill-route/index.spec.ts`: a cookie-only
  secret is not forwarded to the billing check.
- New `request-subject-is-owner/index.spec.ts`: a cookie-only secret falls
  through to the owner check and is refused.
- Replace `authentication/is-authorized/index.spec.ts` (a live-server test
  that no lane runs) with a unit spec, add `authentication/bill-route/index.spec.ts`,
  and remove the `is-authorized` exclusion from `libs/modules/rbac/jest.config.ts`.

### Success Criteria

#### Automated Verification

- [x] `@sps/backend-utils`, `@sps/middlewares`, `@sps/rbac`, `mcp` and
      `@sps/shared-frontend-client-utils` unit lanes pass.
- [x] Mutation check: restoring the cookie fallback in `readRbacSecret` and in
      the is-authorized middleware fails the new specs.

#### Manual Verification

- [x] HTTP proof in Phase 5.

---

## Phase 2: Browser requests that need a session send the header

### Overview

Close the four gaps in research section 5 before the API stops reading the
cookie.

### Changes Required

#### 1. Identity `changePassword`

**File**: `libs/modules/rbac/models/identity/sdk/client/src/lib/singlepage/index.ts:90-98`
**Why**: the admin forms call it and the route needs an authenticated root
subject; it builds its request without `saturateHeaders`.
**Changes**: pass the caller headers through `saturateHeaders`, as the other
hand-written client mutations do.

#### 2. Wallet component identity lookup

**File**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/ethereum-virtual-machine-default/ClientComponent.tsx:92-110`
**Why**: calls the server SDK without options, so without the API cookie the
lookup runs as an anonymous caller.
**Changes**: pass `saturateHeaders()` as the request headers.

#### 3. Hand-written broadcast and social client functions

**Files**: `libs/modules/broadcast/models/channel/sdk/client/src/lib/singlepage/{push-message,message-create,message-delete,message-find}.ts`,
`libs/modules/social/models/chat/sdk/client/src/lib/singlepage/message-find.ts`,
`libs/modules/social/models/profile/sdk/client/src/lib/singlepage/chat-find.ts`
**Why**: public client SDK functions that spread caller options without
`saturateHeaders`; a project calling them from the browser authenticates today
only through the API cookie.
**Changes**: merge the caller headers through `saturateHeaders`.

#### 4. Specs

- `libs/modules/rbac/models/identity/sdk/client/src/lib/singlepage/index.spec.tsx`:
  `changePassword` sends the session header.
- `ethereum-virtual-machine-default/ClientComponent.spec.tsx`: the identity
  lookup carries the session header.
- One spec per client SDK package entrypoint for broadcast channel, social
  chat and social profile: each function sends the session header and keeps
  caller headers.

### Success Criteria

#### Automated Verification

- [x] `@sps/rbac`, `@sps/broadcast` and `@sps/social` unit lanes pass.
- [x] Mutation check: removing `saturateHeaders` from `changePassword` fails
      its spec.

---

## Phase 3: The API reads the JWT only from the header and writes no session cookie

### Overview

Flip the JWT readers and remove the cookie writes.

### Changes Required

#### 1. Shared reader

**File**: `libs/shared/backend/utils/src/lib/authorization/index.ts`
**Why**: reads the cookie before the header; 17 handlers and middlewares use
it, including `init` and the cart.
**Changes**: read the `Authorization` header only.

#### 2. Inline readers

**Files**: `libs/middlewares/src/lib/is-authorized/index.ts:46-48`,
subject `authentication/is-authorized/index.ts:53-56` and
`authentication/bill-route/index.ts:53-56`,
`authentication/oauth/start.ts:32-34`
**Why**: each repeats a header-or-cookie read.
**Changes**: read through `authorization`.

#### 3. Issuance handlers

**Files**: `authentication/init.ts`, `refresh.ts`,
`ethereum-virtual-machine.ts`, `oauth/exchange.ts`,
`email-and-password/authentication/index.ts`,
`email-and-password/registration/index.ts`
**Why**: they write the cookie, and their lifetime guards, re-verification
and `exp` checks exist only to build it.
**Changes**: remove the cookie write and the code that only fed it; keep body
parsing, the service call and the `201` response. `oauth/exchange.ts` keeps
clearing the exchange-code cookie.

#### 4. Logout

**File**: `authentication/logout.ts`
**Why**: the delete now only clears a copy an earlier release wrote.
**Changes**: a comment saying so.

#### 5. Specs

- New `libs/shared/backend/utils/src/lib/authorization/index.spec.ts`.
- New `init.spec.ts`, `refresh.spec.ts`, `ethereum-virtual-machine.spec.ts`
  and `oauth/start.spec.ts` beside their handlers; update
  `oauth/exchange.spec.ts`; replace the two placeholder email-and-password
  specs and remove their exclusion from `libs/modules/rbac/jest.config.ts`.
  Each issuance spec runs the handler in a Hono app and checks the status,
  the token pair in the body and the absence of a session cookie; `init` and
  `start` also check that a cookie-only JWT is not passed to the service.
- Extend the is-authorized middleware and subject controller specs: a
  cookie-only JWT is anonymous, the header is forwarded.

### Success Criteria

#### Automated Verification

- [x] `@sps/backend-utils`, `@sps/middlewares` and `@sps/rbac` unit lanes pass.
- [x] Mutation check: restoring the cookie read in `authorization` and the
      cookie write in `init` fails the new specs.

---

## Phase 4: Documentation

**Files**: `README.md:221-223`, `AI_GUIDE.md:175`,
`libs/middlewares/src/lib/http-cache/README.md:60-61`,
`tools/deployer/README.md:179`,
`libs/shared/frontend/client/utils/README.md`,
`libs/modules/rbac/models/subject/README.md:55-60`
**Changes**: credentials travel in headers; MCP still accepts the JWT cookie
of its own requests; the API writes no session cookie; `init` reuses a session
from the `Authorization` header.

### Success Criteria

- [x] `npx prettier --check` passes on every changed Markdown file.

---

## Phase 5: Verification over HTTP

Boot the API from the worktree on port 4305 and, printing status codes and
header or key names only:

1. `GET /api/rbac/subjects/authentication/init` answers `201` with `jwt` and
   `refresh` and no `set-cookie`.
2. A protected read with the operator secret only in an `rbac.secret-key`
   cookie is refused; the same read with `X-RBAC-SECRET-KEY` answers `200`.
3. A JWT only in an `rbac.subject.jwt` cookie is anonymous for `me`; the same
   JWT as `Authorization: Bearer` returns the subject.
4. Email-and-password registration and authentication with a throwaway
   identity answer `201` with the token pair and no session cookie.
5. The OAuth exchange with a fixture `oauth-exchange` action and the
   exchange-code cookie answers `201` with the token pair; the only cookie in
   the answer clears the exchange code.
6. Delete every fixture and stop the server.

## Testing Strategy

### Unit Tests

- Shared readers: header accepted, cookie ignored, both present.
- Guards: cookie-only credentials are refused where they used to pass.
- Issuance handlers: token pair in the body, no session cookie.
- Browser SDK: the session header is sent where it was missing.

### Manual Testing Steps

The HTTP proof in Phase 5. The browser flow itself is unchanged; the host is
not booted because the symlinked `node_modules` cannot run Next.js.

## Performance Considerations

Each issuance response loses one `Set-Cookie` header. No other effect.

## Migration Notes

- Browsers that hold an API-origin `rbac.subject.jwt` from an earlier release
  keep it until it expires or the user logs out; the API ignores it.
- A child project whose browser code, links or scripts authenticate through
  the API cookie, or that sends the operator secret as a cookie, must send
  `Authorization: Bearer` or `X-RBAC-SECRET-KEY`.

## References

- Ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-305.md` (local)
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-305.md`
- Review: `thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`
  (local), SEC-13, SEC-07
