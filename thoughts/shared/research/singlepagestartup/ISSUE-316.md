---
date: 2026-09-26T00:56:42+03:00
researcher: flakecode
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-316-mcp-oauth-hardening
repository: singlepagestartup
topic: "Harden MCP OAuth registration, scopes, sessions and outbound authentication"
tags: [research, codebase, mcp, oauth, scopes, sessions, deployer, secret-strength, telegram]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Harden MCP OAuth registration, scopes, sessions and outbound authentication

**Date**: 2026-09-26T00:56:42+03:00
**Researcher**: flakecode
**Git Commit**: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
**Branch**: claude/issue-316-mcp-oauth-hardening
**Repository**: singlepagestartup

## Research Question

Issue #316 names seven weaknesses in `apps/mcp` and its deployment, and one gap
in `apps/telegram`. This document checks each claim against the tree at
`78d7d43125`, records how the affected code connects to its callers (the host
and Codex/Claude clients, the API's profile agent, the deployer, the tests),
and lists the constraints a change has to respect. Paths are relative to the
repository root.

## Summary

- Dynamic client registration stores clients without an expiry in both stores
  (`apps/mcp/lib/oauth.ts:133-135`, `:181-186`), while codes, access tokens and
  refresh tokens carry a TTL (`:141-143`, `:192-199`, `:209-233`). Redis keys
  share database 0 with the API cache under the `mcp:oauth:` prefix (`:1133-1135`).
- Registration keeps every string in `redirect_uris` without parsing it
  (`oauth.ts:505-507`). Matching is exact at authorize (`:811-815`) and at token
  time (`:664-672`). `GET /oauth/authorize` renders the credential form without
  validating the client (`:552-553`); validation runs only on POST (`:564`).
- One scope string, `mcp:content` (`oauth.ts:14`), is issued by every path: the
  authorize flow stores whatever `scope` the request carries (`:796`, `:582`),
  the internal exchange issues it (`:409`, `:418`), and the operator-secret and
  auth-disabled paths hard-code it (`apps/mcp/http.ts:201`, `:237`). Nothing
  reads the scopes back: `withAuth` only converts errors into an envelope
  (`apps/mcp/content-management.ts:60-68`) and every entity advertises and
  permits `delete` (`apps/mcp/lib/content-management/registry.ts:15-22`, `:110`;
  `operations.ts:107-116`, `:1002`).
- The HTTP session map has no eviction (`http.ts:28-32`); a session leaves it
  only through `DELETE /mcp` or a transport close (`:161-173`). One session costs
  about 143 KiB of heap (measured, see Code References).
- Neither body reader has a limit (`http.ts:277-300`, `oauth.ts:1186-1194`). The
  `/mcp` reader runs after authentication (`http.ts:68-77`); the OAuth readers
  run on unauthenticated endpoints.
- `tools/deployer/mcp/mcp.env.j2:10-12` writes `RBAC_SECRET_KEY` only when
  `MCP_SERVICE_ALLOW_RBAC_SECRET_FALLBACK` is `'true'`; the default render does
  not contain it. `tools/deployer/mcp.sh:30`, `:95` still read the secret and
  pass it to Ansible on every run, and `apps/mcp/create_env.sh:25`, `:29` copies
  it into the local MCP env.
- The operator-secret fallback compares the header with
  `process.env.RBAC_SECRET_KEY` behind a truthiness check on the header
  (`http.ts:229-241`), so an absent variable rejects every value.
- `apps/api/server.ts:13-38` runs the boot-time secret check;
  `apps/mcp/http.ts`, `apps/mcp/index.ts` and `apps/telegram/server.ts` do not.
- The fetch patch sends the request context's credentials to any origin and,
  without a context, the environment's `RBAC_SECRET_KEY` to any origin
  (`apps/mcp/lib/auth-context.ts:15-32`). In HTTP mode the one fetch outside a
  context is the OAuth login call to the API (`oauth.ts:844-854`); every
  in-context fetch targets `API_SERVICE_URL`.

## Detailed Findings

### Client registration and expiry

- `IOAuthClient` holds `clientId`, optional `clientSecret`, `clientName`,
  `redirectUris`, `createdAt` (`oauth.ts:24-30`). `IOAuthStore.saveClient`
  takes no TTL (`:99`), unlike `saveCode`, `saveAccessToken` and
  `saveRefreshToken` (`:101`, `:104-107`, `:110-113`).
- The memory store keeps clients in a plain `Map` (`:118`, `:129-135`); codes and
  tokens use `withTtl`/`getUnexpired` (`:1097-1121`). The Redis store writes the
  client with `SET` and no `EX` (`:181-186`).
- The store is chosen once: Redis when `MCP_SERVICE_OAUTH_STORE=redis` or
  `KV_PROVIDER=redis`, memory otherwise (`:932-954`). Deployments render
  `MCP_SERVICE_OAUTH_STORE=redis` (`mcp.env.j2:24`).
- A registered client is read again at authorize (`:811`), at code exchange
  (`:662`) and at refresh (`:699`). A refresh fails with `invalid_client` once
  its client record is gone (`:699-703`). Refresh tokens live 30 days by default
  (`:13`, `:1151-1156`).
- `handleRegister` parses JSON through `readJsonBody`; a malformed body throws a
  `SyntaxError` that `handleOAuthRequest` answers with 500 (`:316-321`).
- TTL settings follow one pattern: a `DEFAULT_*` constant at the top of the file
  and a getter through `getEnvNumber(name, fallback)`, which accepts only
  positive finite numbers (`:11-13`, `:1137-1162`). The deployer renders each
  TTL with a default (`mcp.env.j2:25-39`), reads it in `mcp.sh:39-41`, passes it
  in `mcp.sh:102-104`, and transports it through `github_deployer.sh:85-87`,
  `:199-201` and `.github/workflows/ansible.yml:95-97` plus the production block.

### Redirect URI handling

- Registration filters `redirect_uris` to strings and requires one
  (`oauth.ts:505-514`); nothing parses them. The response echoes them and
  `scope: "mcp:content"` (`:535-544`).
- `validateAuthorizeParams` requires `response_type=code`, an S256 challenge,
  a matching `resource` when present, and an exact `redirect_uri` match against
  the stored list (`:789-825`). The code record keeps the redirect URI (`:578`);
  the token exchange requires the posted `redirect_uri` to be registered and to
  equal the stored one (`:664-672`).
- The redirect is built with `new URL(request.redirectUri)` (`:590-599`).
- `new URL()` in Node 24 and Bun 1.3 reports `hostname` `[::1]` for IPv6
  loopback, lower-cases hosts, drops an empty fragment (`"https://a.b/c#"` has
  `hash === ""`), and keeps `username`/`password` (checked in this session).
- Redirect URIs used by the documented clients: the browser test page registers
  `<origin>/authentication/oauth` (`apps/mcp/lib/oauth-authentication-page.ts:75`,
  `:113-120`), which is `http://127.0.0.1:3001/...` locally and `https://` in
  production. Claude Code, Codex and Inspector use loopback callbacks; Claude.ai,
  Claude Desktop and ChatGPT connectors use HTTPS callbacks.

### Authorize page

- `renderAuthorizePage` (`oauth.ts:884-930`) returns one form: hidden
  `response_type`, `client_id`, `redirect_uri`, `scope` (default `mcp:content`),
  `state`, `code_challenge`, `code_challenge_method`, `resource`, then `email`
  and `password`, posted to `/oauth/authorize`. It names neither the client nor
  the redirect target. The response sets only `Content-Type`.
- A POST validates, calls the API login route with the credentials
  (`:827-882`), stores a code with the requested scope and redirects (`:560-599`).
  A failure re-renders the form with the error (`:600-602`).
- No repository script posts to `/oauth/authorize`; the browser test page
  navigates to it (`oauth-authentication-page.ts:132-142`).

### Scopes

- Advertised: `scopes_supported: ["mcp:content"]` in both metadata documents
  (`oauth.ts:269`, `:280`). The Bearer challenge carries only
  `resource_metadata` (`:460-464`).
- Issued: the requested `scope` string is stored unchanged (`:796`, `:582`) and
  copied into access and refresh records (`:676-683`, `:707-712`, `:732-749`).
  `verifyMcpAccessToken` returns `record.scope.split(" ")` (`:450-457`), and
  `http.ts` passes the scopes into `req.auth` and the request context
  (`:111-131`). The SDK hands `req.auth` to tool handlers as `extra.authInfo`
  (`node_modules/@modelcontextprotocol/sdk/dist/esm/server/streamableHttp.js:297`,
  `:374`). The stdio transport provides no `authInfo`.
- Not enforced: `withAuth` wraps handlers in a try/catch only
  (`content-management.ts:60-68`). `requireOperation` checks the descriptor's
  operation list (`operations.ts:107-116`), which is `defaultOperations` for every
  discovered entity (`registry.ts:15-22`, `:110`). Delete is two tools: preview
  (a read that returns a deterministic token, `operations.ts:944-975`) and apply
  (`:977-1008`), registered at `content-management.ts:298-331` and `:419-452`.
- Operation options travel as `IContentOperationOptions { registry, authHeaders }`
  (`operations.ts:52-55`); every API-backed tool builds `authHeaders` with
  `getMcpAuthHeaders(extra)` and passes `{ authHeaders }`
  (`content-management.ts:219-452`).
- The SDK client in this repository (1.18.1) sends `scope` only when the caller
  or its client metadata supplies one
  (`node_modules/@modelcontextprotocol/sdk/dist/esm/client/auth.js:239`). The MCP
  authorization specification tells clients to use the challenge's `scope`,
  else every value in the protected-resource `scopes_supported`. Codex is
  documented with `--scopes mcp:content` (`README.md:52`, `:191`, `:200`;
  `apps/mcp/README.md:149`, `:157`; `tools/mcp/setup-project-mcp.sh:126-149`).

### The internal exchange and the profile agent

- `POST /internal/rbac-subject-token-exchange` issues a five-minute token for
  client `internal-rbac-subject` with scope `mcp:content` (`oauth.ts:372-420`).
- Its only caller is the API's profile agent:
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/mcp/singlepagestartup-client.ts:137-176`
  exchanges the subject JWT, and `catalog.ts:56-69` exposes the live tool list,
  delete tools included, to the agent. Plan ISSUE-199 keeps "mutation behavior
  defined by the MCP tools themselves, including current dry-run and
  preview/apply contracts" (`thoughts/shared/plans/singlepagestartup/ISSUE-199.md:644`).

### HTTP sessions

- `sessions` is a module-level `Map<string, { transport }>` (`http.ts:28-32`).
  `createHttpSession` builds one `McpServer` and one
  `StreamableHTTPServerTransport` per initialize request; the session enters the
  map in `onsessioninitialized` and leaves it in `onsessionclosed` and
  `transport.onclose` (`:157-181`).
- `transport.close()` ends open SSE responses, clears pending responses and
  calls `onclose` (`streamableHttp.js:526-536`); `Protocol.connect` chains its
  own close handler after the one `http.ts` sets before `connect`
  (`shared/protocol.js:70-73`).
- An unknown `mcp-session-id` answers 404 `Session not found` (`http.ts:83-92`);
  a request without one that is not an initialize request answers 400
  (`:100-109`).
- Measured in this session with Bun 1.3.6: 200 sessions built through
  `createMcpServer()` and a connected transport added about 143 KiB of heap each.

### Request bodies

- `/mcp` POST bodies go through `readJsonBody(req, res)`, which concatenates every
  chunk and answers a parse failure with a JSON-RPC `-32700` error
  (`http.ts:277-300`). It runs after `getRequestAuth` (`:68-77`).
- OAuth routes read through `readBody` (`oauth.ts:1186-1194`) via
  `readJsonBody` (register, internal exchange) and `readFormBody` (authorize,
  token, revoke) (`:1164-1184`).
- The largest legitimate `/mcp` bodies are `file-storage.file` uploads that carry
  base64 content in tool arguments (`apps/mcp/lib/content-management/file-storage.ts:107-172`;
  `apps/mcp/README.md:64-79`).

### RBAC secret in the MCP environment and the fallback

- `http.ts:229-241` accepts `X-RBAC-SECRET-KEY` only when
  `MCP_SERVICE_ALLOW_RBAC_SECRET_FALLBACK === "true"` and the header is truthy and
  equals `process.env.RBAC_SECRET_KEY`; with the variable unset no header can
  match. The comparison is a plain `===`.
- Deployment: `mcp.env.j2:9` renders the fallback flag (default `false`) and
  `:10-12` adds `RBAC_SECRET_KEY` only when the flag is `'true'` and a value is
  present. `mcp.sh:30` reads `RBAC_SECRET_KEY` and `mcp.sh:95` passes it to
  `ansible-playbook` regardless of the flag.
- Local: `apps/mcp/create_env.sh:21-22` writes `MCP_SERVICE_AUTH_REQUIRED=true`
  and `MCP_SERVICE_ALLOW_RBAC_SECRET_FALLBACK=true`, and `:25`, `:29` copy
  `RBAC_SECRET_KEY` from `apps/api/.env`. `apps/mcp/env.ts:19-21` also loads
  `apps/api/.env` whenever `NODE_ENV` is not `production`, so a local MCP process
  holds the secret without the copy.
- Local clients depend on the fallback: `.mcp.json` and `.codex/config.toml` send
  `X-RBAC-SECRET-KEY` from the developer's `RBAC_SECRET_KEY` (`AI_GUIDE.md:145-168`).
  `apps/mcp/README.md:97-103` documents the flag for local debugging.
- Deployment secrets documentation lists MCP among the services to redeploy
  after rotating `RBAC_SECRET_KEY` (`tools/deployer/README.md:179`).

### Boot-time secret check

- `apps/api/server.ts:13-38`: `assessSecrets(process.env)` over the fixed
  `CHECKED_SECRET_NAMES`, a warning per non-`ok` finding, and `process.exit(1)` on
  a fatal finding unless `API_SECRET_STRENGTH=report`.
- `libs/shared/utils/src/lib/secret-strength/index.ts`: `CHECKED_SECRET_NAMES`
  (`:19-26`), fatal names `RBAC_SECRET_KEY` and `RBAC_JWT_SECRET` (`:33`), fatal
  verdicts `legacy` and `missing` (`:35`), `assessSecrets(env)` (`:212-216`),
  `isFatalSecretAssessment` (`:218-225`), and `formatSecretAssessment`, which never
  prints a value (`:231-242`). The knob lives in
  `libs/shared/utils/src/lib/envs/api.ts:8-9`.
- MCP secrets: `RBAC_JWT_SECRET` verifies subject JWTs (`oauth.ts:980-1036`) and
  is the fallback signing key (`:956-968`); `MCP_SERVICE_OAUTH_JWT_SECRET` signs
  MCP tokens; `MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET` gates the exchange
  (`:1038-1057`); `KV_PASSWORD` opens Redis (`:941-948`). Absent values fail at
  use: token issuance throws (`:961-965`), the exchange answers 500 or 401
  (`:1042-1048`, `:1016-1020`), the fallback rejects every header.
- Telegram secrets: `RBAC_SECRET_KEY` for API calls, `RBAC_JWT_SECRET` to sign
  subject JWTs, `TELEGRAM_SERVICE_WEBHOOK_SECRET` for the webhook
  (`apps/telegram/src/lib/telegram-bot.ts:308-358`, `:423-443`, `:569-571`). The
  service throws a configuration error at the point of use when either RBAC value
  is absent, and refuses to build the bot without a 32-character webhook secret.
  `apps/telegram/env.ts:1-3` loads only its own `.env`;
  `apps/telegram/create_env.sh:17-19`, `:33-34` writes the webhook secret and
  `RBAC_SECRET_KEY`, not `RBAC_JWT_SECRET`. `telegram.env.j2:21-22` renders both
  RBAC values. Telegram env constants live in
  `libs/shared/utils/src/lib/envs/telegram.ts`.
- Entry points: deployments run `npm run mcp:http` (`start.sh:19-22`), that is
  `bun http.ts`; `index.ts` is the stdio transport a local client launches.
  `apps/telegram/server.ts:1-28` serves the Hono app.

### Fetch patch

- `installMcpFetchAuthForwarding` replaces `globalThis.fetch` in both entry points
  (`http.ts:36`, `index.ts:6`). `mergeHeaders` adds the context's
  `authorization` and `x-rbac-secret-key` when absent, and without a context sets
  `x-rbac-secret-key` from the environment (`auth-context.ts:15-32`), for any URL.
- Outbound fetches in the MCP process: server SDKs call `API_SERVICE_URL`
  (`libs/modules/*/sdk/model/src/lib/index.ts`, `serverHost = API_SERVICE_URL`),
  the base64 upload calls `${API_SERVICE_URL}${route}`
  (`file-storage.ts:163-167`), and the OAuth login calls
  `API_SERVICE_URL || http://127.0.0.1:4000` outside any request context
  (`oauth.ts:841-854`). `API_SERVICE_URL` defaults to `http://localhost:4000` in
  `libs/shared/utils/src/lib/envs/host.ts:7-8`.

## Code References

- `apps/mcp/lib/oauth.ts:14` - `DEFAULT_SCOPE = "mcp:content"`
- `apps/mcp/lib/oauth.ts:97-115` - `IOAuthStore`; `saveClient` has no TTL parameter
- `apps/mcp/lib/oauth.ts:133-135`, `:181-186` - client writes without expiry
- `apps/mcp/lib/oauth.ts:499-545` - `handleRegister`
- `apps/mcp/lib/oauth.ts:547-603` - `handleAuthorize`; GET renders without validation
- `apps/mcp/lib/oauth.ts:645-713` - code and refresh exchanges
- `apps/mcp/lib/oauth.ts:789-825` - `validateAuthorizeParams`
- `apps/mcp/lib/oauth.ts:884-930` - `renderAuthorizePage`
- `apps/mcp/lib/oauth.ts:1164-1194` - body readers without a limit
- `apps/mcp/http.ts:28-32` - session map
- `apps/mcp/http.ts:183-250` - `getRequestAuth` (auth-disabled, Bearer, secret fallback)
- `apps/mcp/http.ts:277-300` - `/mcp` body reader
- `apps/mcp/lib/auth-context.ts:15-32` - header merge for every outbound fetch
- `apps/mcp/content-management.ts:60-68` - `withAuth`
- `apps/mcp/lib/content-management/registry.ts:15-22` - `defaultOperations`
- `apps/mcp/lib/content-management/operations.ts:52-55`, `:107-116`, `:977-1008` - options, `requireOperation`, delete apply
- `apps/mcp/create_env.sh:21-29` - local flags and secret copies
- `apps/mcp/env.ts:11-21` - env loading, `apps/api/.env` in non-production
- `tools/deployer/mcp/mcp.env.j2:9-12` - fallback flag and gated `RBAC_SECRET_KEY`
- `tools/deployer/mcp.sh:30`, `:95` - secret read and passed to Ansible
- `apps/api/server.ts:13-38` - boot-time secret check
- `libs/shared/utils/src/lib/secret-strength/index.ts:19-35`, `:212-225` - checked and fatal names
- `apps/telegram/server.ts:1-28` - Telegram entry point
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/mcp/singlepagestartup-client.ts:137-176` - internal exchange caller
- Specs: `apps/mcp/lib/oauth.spec.ts` (metadata, challenge, PKCE, exchange),
  `apps/mcp/lib/content-management/operations.spec.ts:672-739` (delete preview
  and apply), `apps/mcp/lib/content-management/auth.spec.ts`,
  `apps/mcp/content-management.spec.ts`, `apps/mcp/actions.spec.ts`,
  `libs/shared/utils/src/lib/secret-strength/index.spec.ts`. Baseline: 9 suites and
  54 tests pass in `npx nx run mcp:jest:test`; `tsc --noEmit -p apps/mcp/tsconfig.json`
  reports no error.

## Architecture Documentation

- `apps/mcp` reads its settings from `process.env` at the point of use, with
  `DEFAULT_*` constants and `getEnvNumber` in `oauth.ts` and module-level
  constants in `http.ts` (`:33-34`). Shared framework settings come from
  `@sps/shared-utils` (`file-storage.ts:1-5`).
- `apps/mcp/lib` holds the server's building blocks: request context and fetch
  patch (`auth-context.ts`), tool-side credential resolution (`auth.ts`),
  guidance text (`guidance.ts`), the OAuth server (`oauth.ts`) and the browser
  test page (`oauth-authentication-page.ts`). `lib/content-management/auth.ts`
  re-exports `getMcpAuthHeaders` into the content-management package.
- `http.ts` starts a server when imported, so no spec imports it; its logic is
  covered only where it calls into `lib/`.
- Deployer variables for MCP flow from `tools/deployer/.env` through `mcp.sh`
  into `mcp.env.j2`, and for CI through `github_deployer.sh` and
  `.github/workflows/ansible.yml`. `API_SECRET_STRENGTH` is documented in
  `tools/deployer/README.md:142-149` and is not rendered by any template.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`
  (SEC-24, SEC-21, N-10) raised the items this issue tracks. Its N-10 row states
  that the MCP template hands over `RBAC_SECRET_KEY`; the template gates it on
  the fallback flag, and the unconditional hand-over is in `mcp.sh`.
- `thoughts/shared/plans/singlepagestartup/ISSUE-199.md:598-644` introduced the
  internal exchange and keeps the tools' own mutation rules for the profile agent.
- `thoughts/shared/research/singlepagestartup/ISSUE-233.md:113`, `:132` records
  that the MCP OAuth store shares Redis database 0 with the API cache and that
  Redis runs without `maxmemory`, so keys without expiry accumulate there.
- `thoughts/shared/research/singlepagestartup/ISSUE-227.md:91` lists the
  `apps/mcp` specs and their BDD headers.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-187.md` - MCP content management
- `thoughts/shared/research/singlepagestartup/ISSUE-199.md` - profile agent and internal exchange

## Open Questions

- Whether Claude Code and Codex start a new session after a 404 on a stale
  session id is not visible from this repository. Server restarts already
  produce that 404 today.
- Which scope strings Claude.ai and Claude Desktop request depends on their
  client versions; the specification's rule is the challenge `scope`, else every
  advertised value.
