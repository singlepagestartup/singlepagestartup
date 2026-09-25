---
date: 2026-09-26T00:59:00+03:00
issue_number: 316
repository: singlepagestartup
topic: "Harden MCP OAuth registration, scopes, sessions and outbound authentication"
status: implemented
---

# Harden MCP OAuth registration, scopes, sessions and outbound authentication Implementation Plan

## Overview

Close SEC-24 and the MCP and Telegram part of SEC-21: registered OAuth clients
expire, redirect URIs are parsed and limited, deleting needs its own scope that
the user approves on a consent step, request bodies and HTTP sessions are
bounded, the MCP environment stops carrying the operator secret, MCP and
Telegram run the boot-time secret check, and the fetch patch sends credentials
to the API origin only.

## Current State Analysis

The research (`thoughts/shared/research/singlepagestartup/ISSUE-316.md`) holds
the evidence. In short: clients are stored without expiry
(`apps/mcp/lib/oauth.ts:133-135`, `:181-186`); any string is a redirect URI
(`:505-507`); the authorize page is a bare credential form (`:884-930`); one
scope is issued and never checked (`:14`, `content-management.ts:60-68`,
`registry.ts:15-22`); the session map and both body readers are unbounded
(`http.ts:28-32`, `:277-300`, `oauth.ts:1186-1194`); `mcp.sh` passes
`RBAC_SECRET_KEY` to Ansible and `apps/mcp/create_env.sh` copies it locally
(the template already gates it on the fallback flag); only the API runs
`assessSecrets` (`apps/api/server.ts:13-38`); the fetch patch attaches
credentials to every origin (`auth-context.ts:15-32`).

## Desired End State

- A registered client expires after `MCP_SERVICE_OAUTH_CLIENT_TTL_SECONDS`
  (default 30 days, the refresh-token default) and the expiry moves forward each
  time the client obtains tokens, so an active connector outlives its refresh
  token.
- Registration refuses a redirect URI that does not parse, carries a fragment,
  credentials, whitespace or control characters, or is neither `https` nor
  `http` on `localhost`, `127.0.0.1` or `[::1]`. Authorize applies the same rule,
  so a client registered earlier with such a URI stops working. Matching stays
  exact at authorize and token time.
- Scopes: `mcp:content` reads, creates and updates, as every existing token
  already allows; `mcp:content:delete` deletes. Both are advertised. A token
  carries the delete scope only when the authorization request asked for it and
  the user ticked "Also allow deleting records" on the consent step. Delete apply
  answers a permission error without it. The operator-secret fallback, the
  auth-disabled mode and the internal exchange for the API's profile agent carry
  both scopes. Stdio requests carry no OAuth scopes and are not limited.
- `GET /oauth/authorize` validates the request and shows a consent step naming
  the application name, client id and redirect URI with the requested access;
  Continue leads to the unchanged email and password form, Cancel returns
  `error=access_denied` to the client. Authorize pages refuse framing.
- `/mcp` bodies above `MCP_SERVICE_HTTP_MAX_BODY_BYTES` (default 4 MiB) and OAuth
  bodies above 64 KiB are refused with 413 without being buffered.
- HTTP sessions idle longer than `MCP_SERVICE_HTTP_SESSION_IDLE_TTL_SECONDS`
  (default 24 hours) are closed, and at `MCP_SERVICE_HTTP_MAX_SESSIONS` (default 500) the least recently used session is closed to admit a new one. A closed
  session answers 404, which is what a client already receives after a restart.
- Neither the MCP env template, `mcp.sh` nor `apps/mcp/create_env.sh` carries
  `RBAC_SECRET_KEY`. The fallback keeps failing closed without it.
- `apps/mcp/http.ts` and `apps/telegram/server.ts` judge the secrets their
  service holds at boot and stop on a legacy `RBAC_SECRET_KEY` or
  `RBAC_JWT_SECRET` unless `MCP_SECRET_STRENGTH` / `TELEGRAM_SECRET_STRENGTH` is
  `report`.
- The fetch patch adds context credentials and the environment secret only to
  requests whose origin is the `API_SERVICE_URL` origin.

Verification: the `apps/mcp` and `@sps/shared-utils` unit lanes, lint and type
checks pass; an HTTP proof against the API on 4316 and MCP on 3316 shows the
registration, consent, token, read and denied-delete behavior.

### Key Discoveries:

- The API's profile agent exchanges subject JWTs for MCP tokens and may call the
  delete tools (`singlepagestartup-client.ts:137-176`, `catalog.ts:56-69`,
  plan ISSUE-199:644), so the internal exchange keeps the delete scope.
- Local clients authenticate with `X-RBAC-SECRET-KEY` through the fallback
  (`.mcp.json`, `.codex/config.toml`, `AI_GUIDE.md:145-168`); the local MCP
  still holds the secret after the `create_env.sh` change because
  `apps/mcp/env.ts:19-21` loads `apps/api/.env` outside production.
- The SDK hands `req.auth` to tool handlers as `extra.authInfo`
  (`streamableHttp.js:297`, `:374`); stdio handlers receive none.
- `transport.close()` ends SSE streams and calls the `onclose` that removes the
  session (`streamableHttp.js:526-536`, `http.ts:169-173`).
- One session costs about 143 KiB of heap, so 500 sessions stay near 70 MiB.
- `http.ts` starts a server on import; new logic that needs specs goes into
  `apps/mcp/lib`.

## What We're NOT Doing

- No private-use redirect schemes (RFC 8252 §7.1 such as `cursor://`); none of
  the documented clients (Claude Code, Claude Desktop and Claude.ai, Codex,
  Inspector, ChatGPT, the browser test page) uses one. A deployment that needs
  one needs a follow-up allow-list.
- No HTTP-level `insufficient_scope` step-up for delete; the tool answers a
  permission error that tells the user to reconnect and approve deleting.
- No change to which subject may do what in the API; RBAC in `apps/api` stays the
  authority, the scope limits what a connector may ask for.
- No rate limiting of registration or sessions (SEC-18), no binding of a session
  to its creator, no `@modelcontextprotocol/sdk` upgrade (N-07), no timing-safe
  rewrite of the fallback comparison (SEC-07 tracks the API side).
- No change to the API's own boot check or to its fatal list.
- No change to Telegram behavior beyond the boot check.

## Implementation Approach

Follow the order agreed in the ticket. Keep each concern where its kind lives:
scope constants beside the tool-side credential helpers in `apps/mcp/lib/auth.ts`
(re-exported into content-management through `lib/content-management/auth.ts`,
as `getMcpAuthHeaders` already is); the scope check inside `requireOperation`;
OAuth behavior in `oauth.ts`; two small `apps/mcp/lib` modules for the body
reader and the session store, both needed by `http.ts` and testable only
outside it; the secret lists in the shared secret-strength module beside the
API's. MCP settings keep the `apps/mcp` pattern (`DEFAULT_*` constants read from
`process.env` at the point of use); the Telegram knob goes to
`libs/shared/utils/src/lib/envs/telegram.ts` like the API's goes to `envs/api.ts`.

## Phase 1: Registered clients expire

### Changes Required:

**File**: `apps/mcp/lib/oauth.ts`
**Why**: clients are the only OAuth records without expiry.
**Changes**: `saveClient` takes a TTL in both stores (memory entries through
`withTtl`/`getUnexpired`, Redis with `EX`); `DEFAULT_CLIENT_TTL_SECONDS` and a
getter for `MCP_SERVICE_OAUTH_CLIENT_TTL_SECONDS`; registration saves with it;
code exchange and refresh save the client again after issuing tokens.

### Success Criteria:

#### Automated Verification:

- [x] Spec: an unused client is gone after its TTL; a client that refreshes keeps working past the first TTL.
- [x] `npx nx run mcp:jest:test` passes.

#### Manual Verification:

- [x] Redis shows a positive TTL on `mcp:oauth:client:<id>` after registration.

## Phase 2: Redirect URI validation

**File**: `apps/mcp/lib/oauth.ts`
**Why**: any string is accepted as a redirect target today.
**Changes**: one predicate for allowed redirect URIs (parse with `new URL()`,
refuse `#`, credentials, whitespace and control characters, allow `https:` and
`http:` on the three loopback hosts); registration answers
`invalid_redirect_uri` when any entry fails it and `invalid_client_metadata` for
malformed JSON; `validateAuthorizeParams` applies it next to the exact match.

### Success Criteria:

- [x] Specs: loopback `http`, IPv6 loopback and `https` accepted; `javascript:`, fragment, credentials, non-loopback `http` refused; exact matching unchanged at authorize and token.
- [x] Mutation check: disabling the predicate fails the refusal specs.

## Phase 3: Scopes and the consent step

**Files**: `apps/mcp/lib/auth.ts`, `apps/mcp/lib/content-management/auth.ts`,
`apps/mcp/lib/oauth.ts`, `apps/mcp/http.ts`,
`apps/mcp/lib/content-management/operations.ts`, `apps/mcp/content-management.ts`
**Why**: one scope is issued and never checked, and the user never sees which
client is asking.
**Changes**:

- Scope constants `mcp:content`, `mcp:content:delete` and their list in
  `lib/auth.ts`, re-exported for content-management.
- `oauth.ts`: metadata advertises both; the requested scope is reduced to known
  values with `mcp:content` always present; the internal exchange issues both;
  the registration response keeps `mcp:content`.
- Authorize: GET validates and renders the consent step (application name,
  client id, redirect URI, access list, delete checkbox only when requested,
  Continue and Cancel); POST `consent=deny` redirects with `access_denied` and
  `state`; POST `consent=approve` without credentials renders the sign-in step
  carrying the approved scope; POST with credentials issues the code; any other
  POST shows the consent step again. Pages send `X-Frame-Options: DENY`,
  `Content-Security-Policy: frame-ancestors 'none'` and `Cache-Control: no-store`.
- `http.ts`: operator-secret and auth-disabled requests carry every scope.
- `operations.ts`: `IContentOperationOptions.scopes`; `requireOperation` maps each
  operation to its scope and throws a `Permission error` when granted scopes are
  present and lack it.
- `content-management.ts`: API-backed tools pass `extra.authInfo?.scopes`.

### Success Criteria:

- [x] Specs: metadata lists both scopes; delete apply refused with `mcp:content` only, allowed with both, allowed without scopes (stdio); reads and writes allowed with `mcp:content`; tools pass the connection's scopes; internal exchange token carries both.
- [x] Specs through `handleOAuthRequest`: consent names client id, name and redirect URI; checkbox only when delete is requested; Cancel redirects with `access_denied`; unticked approval yields `mcp:content`, ticked yields both; invalid client renders an error without a form.
- [x] Mutation check: disabling the scope check fails the refusal spec.

## Phase 4: Body limits

**Files**: `apps/mcp/lib/request-body.ts` (new), `apps/mcp/lib/oauth.ts`, `apps/mcp/http.ts`
**Why**: both readers buffer bodies of any size.
**Changes**: one reader that refuses a declared or received length above a limit
without buffering the rest, and a `RequestBodyTooLargeError`; OAuth routes read
with a 64 KiB limit and answer 413; `/mcp` reads with
`MCP_SERVICE_HTTP_MAX_BODY_BYTES` (default 4 MiB, room for base64 uploads) and
answers 413 as a JSON-RPC error.

### Success Criteria:

- [x] Specs for the reader: under the limit, declared length above it, streamed length above it.
- [x] HTTP proof: 413 on both endpoints.

## Phase 5: Session eviction

**Files**: `apps/mcp/lib/session-store.ts` (new), `apps/mcp/http.ts`
**Why**: sessions live until the client deletes them.
**Changes**: a session store that keeps least-recently-used order, closes idle
sessions on lookup, on insert and on a one-minute sweep, and closes the least
recently used one at capacity; `http.ts` uses it with
`MCP_SERVICE_HTTP_SESSION_IDLE_TTL_SECONDS` (24 hours) and
`MCP_SERVICE_HTTP_MAX_SESSIONS` (500). The long idle default keeps a client that
sits idle overnight connected; the count bounds memory.

### Success Criteria:

- [x] Specs: lookup refreshes; idle lookup closes and misses; capacity closes the least recently used; the sweep closes only idle sessions.

## Phase 6: Operator secret out of the MCP environment

**Files**: `tools/deployer/mcp/mcp.env.j2`, `tools/deployer/mcp.sh`,
`apps/mcp/create_env.sh`, the four new settings in `mcp.env.j2`, `mcp.sh`,
`tools/deployer/.env.example`, `tools/deployer/github_deployer.sh`,
`.github/workflows/ansible.yml`
**Why**: MCP never needs the operator secret unless an operator enables the
debugging fallback on a server, which becomes a manual, documented step.
**Changes**: drop the gated block, the `mcp.sh` read and pass, and the local copy;
add the new settings the way the OAuth TTLs are plumbed.

### Success Criteria:

- [x] `grep` finds `RBAC_SECRET_KEY` in none of the MCP template, `mcp.sh` and `apps/mcp/create_env.sh` except the template comment that says it is never rendered; rendering with the fallback on and the secret passed leaves it out.
- [x] HTTP proof: with the fallback enabled and the variable empty, `X-RBAC-SECRET-KEY` is refused with 401.

## Phase 7: Boot-time secret check in MCP and Telegram

**Files**: `libs/shared/utils/src/lib/secret-strength/index.ts` and spec,
`libs/shared/utils/src/lib/envs/telegram.ts`, `apps/mcp/http.ts`, `apps/telegram/server.ts`
**Why**: SEC-21 left both services without the check.
**Changes**: `assessSecrets` accepts the names to check (API default unchanged);
`MCP_CHECKED_SECRET_NAMES`, `TELEGRAM_CHECKED_SECRET_NAMES` and
`assessConfiguredSecrets`, which judges only values that are set; both entry
points copy the API's block with their own names and knob. A missing value is
not a finding for these services: each holds some secrets only in some setups
and refuses the operation that needs an absent one. The fatal rule is the API's,
so a legacy `RBAC_SECRET_KEY` or `RBAC_JWT_SECRET` stops the boot.

### Success Criteria:

- [x] Specs: service lists, set-only judgement, fatal legacy value.
- [x] Runtime: MCP and Telegram exit 1 on a legacy value and start with the report knob.

## Phase 8: Fetch patch limited to the API origin

**File**: `apps/mcp/lib/auth-context.ts` and new spec
**Why**: credentials must not reach another origin.
**Changes**: the patch forwards requests to other origins untouched; for the
`API_SERVICE_URL` origin it keeps today's merge.

### Success Criteria:

- [x] Specs: API origin receives the context credentials and, without a context, the environment secret; another origin receives neither.

## Phase 9: Documentation

**Files**: `README.md` (Remote MCP Connector, Connecting MCP clients),
`apps/mcp/README.md`, `apps/mcp/USAGE.md`, `AI_GUIDE.md` section 6,
`tools/deployer/README.md`
**Changes**: the scope list and how to grant delete (Codex `--scopes`, the
consent checkbox), the redirect rule, the new settings and defaults, the manual
fallback secret on servers, the MCP and Telegram strength knobs, the rotation
table row for `RBAC_SECRET_KEY`.

## Testing Strategy

### Unit Tests:

- `apps/mcp/lib/oauth.spec.ts`: TTL, redirect rule, scopes, consent flow through
  `handleOAuthRequest` with fake request and response objects and a stubbed
  API login.
- `apps/mcp/lib/content-management/operations.spec.ts`: scope enforcement.
- `apps/mcp/content-management.spec.ts`: tools pass the granted scopes.
- `apps/mcp/lib/request-body.spec.ts`, `session-store.spec.ts`, `auth-context.spec.ts`.
- `libs/shared/utils/src/lib/secret-strength/index.spec.ts`.

### Integration Tests:

- HTTP proof: API on 4316, MCP on 3316 with the Redis store; register (loopback
  accepted, `javascript:` and fragment refused), consent, sign-in with a
  throwaway subject, token, read tool accepted, delete apply refused; 413; 401
  for the fallback without the variable; cleanup of created Redis keys and the
  throwaway subject.

### Use cases kept

- Claude Code local and remote HTTP connectors, Claude Desktop and Claude.ai,
  Codex (`--scopes mcp:content`), Inspector and the browser test page: loopback
  or HTTPS callbacks, the same form fields, `mcp:content` for read and write.
- Local secret-header clients (`.mcp.json`, `.codex/config.toml`): every scope.
- The profile agent: the internal exchange carries both scopes.
- Base64 uploads through MCP: 4 MiB default, configurable.

## Migration Notes

- Existing access and refresh tokens carry `mcp:content`; a connector that needs
  to delete reconnects and ticks the checkbox (Codex: `--scopes "mcp:content mcp:content:delete"`).
- Client records registered before this change have no expiry in Redis until
  their next token issuance; an operator can set one by hand.
- A server that enables the fallback adds `RBAC_SECRET_KEY` to the MCP service
  env by hand.
- MCP and Telegram refuse to boot on a legacy secret; rotate or set the report knob.

## References

- Ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-316.md`
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-316.md`
