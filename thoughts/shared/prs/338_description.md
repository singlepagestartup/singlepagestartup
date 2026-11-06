Closes #316.

## Summary

The MCP OAuth server kept every registered client forever and accepted any string as a redirect target. Every token carried the one scope `mcp:content`, and no tool checked it, so any connector a user authorized could delete. The HTTP session map and both request-body readers had no bound. The fetch patch attached the caller's credentials, or the local operator secret, to requests for any origin. `tools/deployer/mcp.sh` passed `RBAC_SECRET_KEY` to Ansible on every run and `apps/mcp/create_env.sh` copied it into the local MCP env. Neither MCP nor Telegram ran the boot-time secret check the API runs.

With this change a registration expires unless it is used, redirect targets must be `https` or loopback `http`, deleting needs a scope that the user approves on a new consent step, bodies and sessions are bounded, credentials reach the API origin only, the MCP environment no longer carries the operator secret, and MCP and Telegram refuse to start on a legacy RBAC secret. Existing connectors keep reading and writing without reconnecting; the documented Claude Code, Claude Desktop and Claude.ai, Codex, Inspector and browser-test flows keep their callbacks and form fields.

## Changes

- `apps/mcp/lib/oauth.ts`
  - Registered clients expire after `MCP_SERVICE_OAUTH_CLIENT_TTL_SECONDS` (30 days) in the memory and Redis stores. Every token issue saves the client again with the larger of that TTL and the refresh-token TTL, so a client in use outlives its refresh token.
  - One redirect predicate, used at registration and at authorize: the value must parse with `new URL()`, carry no fragment, credentials, whitespace or non-ASCII character, and be `https` or `http` on `localhost`, `127.0.0.1` or `[::1]`. Matching stays exact at authorize and token time. Malformed registration JSON answers 400 `invalid_client_metadata`.
  - Both metadata documents advertise `mcp:content` and `mcp:content:delete`. A requested scope is reduced to known values with `mcp:content` always present. The internal rbac.subject exchange issues both scopes, so the API's profile agent keeps the tools' preview and confirmation delete flow.
  - `/oauth/authorize` runs in two steps. `GET` validates the request and shows a consent step with the application name, client id and redirect URI, the access requested, and "Also allow deleting records" when the delete scope was requested. Continue leads to the unchanged email and password form carrying the approved scope; Cancel redirects with `error=access_denied` and the state. An invalid request shows an error page without a form. The pages send `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'` and `Cache-Control: no-store`.
  - OAuth bodies are read with a 64 KiB limit and answer 413. `handleOAuthRequest` now awaits its handlers, so their errors reach its error mapping instead of the generic 500 in `http.ts`.
- `apps/mcp/lib/auth.ts`, `apps/mcp/lib/content-management/auth.ts` — the scope constants, re-exported into content-management the way `getMcpAuthHeaders` already is.
- `apps/mcp/lib/content-management/operations.ts` — `IContentOperationOptions.scopes`; `requireOperation` maps `find`, `count`, `get`, `create` and `update` to `mcp:content` and `delete` to `mcp:content:delete`, and throws a `Permission error` when the granted scopes lack it. Stdio calls carry no OAuth scopes and are not limited.
- `apps/mcp/content-management.ts` — API-backed tools pass `extra.authInfo?.scopes` with the forwarded credentials.
- `apps/mcp/lib/request-body.ts` (new) — reads a body up to a limit; a declared or streamed length above it rejects with `RequestBodyTooLargeError` and the rest is drained without being kept.
- `apps/mcp/lib/session-store.ts` (new) — sessions in least-recently-used order; idle sessions close on lookup, on insert and on a one-minute sweep, and at the maximum the least recently used session closes. A closed session answers 404, as after a restart.
- `apps/mcp/http.ts` — the boot-time secret check (`MCP_SECRET_STRENGTH=report` to start anyway), the session store with `MCP_SERVICE_HTTP_SESSION_IDLE_TTL_SECONDS` (86400) and `MCP_SERVICE_HTTP_MAX_SESSIONS` (500), `/mcp` bodies limited by `MCP_SERVICE_HTTP_MAX_BODY_BYTES` (4194304, room for base64 uploads) with a JSON-RPC 413, and both scopes for the operator-secret fallback and `MCP_SERVICE_AUTH_REQUIRED=false`.
- `apps/mcp/lib/auth-context.ts` — the fetch patch forwards credentials and the local operator secret only to the `API_SERVICE_URL` origin; other requests go out as their caller built them.
- `libs/shared/utils/src/lib/secret-strength/index.ts` — `assessSecrets` takes the names to check (the API's default is unchanged), `MCP_CHECKED_SECRET_NAMES`, `TELEGRAM_CHECKED_SECRET_NAMES`, and `assessConfiguredSecrets`, which judges only values that are set. The fatal rule is the API's: a legacy `RBAC_SECRET_KEY` or `RBAC_JWT_SECRET`.
- `libs/shared/utils/src/lib/envs/telegram.ts`, `apps/telegram/server.ts` — `TELEGRAM_SECRET_STRENGTH` and the Telegram boot check.
- Deployer: `tools/deployer/mcp/mcp.env.j2`, `mcp.sh` and `apps/mcp/create_env.sh` drop `RBAC_SECRET_KEY`; the four new settings are plumbed like the OAuth TTLs through `mcp.env.j2`, `mcp.sh`, `.env.example`, `github_deployer.sh` and `.github/workflows/ansible.yml`.
- Docs: `README.md`, `AI_GUIDE.md` section 6, `apps/mcp/README.md` (scopes and consent, limits, deployment), `apps/mcp/USAGE.md` (delete needs the scope), `tools/deployer/README.md` (MCP and Telegram strength knobs, rotation table).
- Specs: `oauth.spec.ts` (TTL, redirect rule, consent, cancel, approved scope, error page, 413), `operations.spec.ts` (scope enforcement), `content-management.spec.ts` (scope wiring), and new `request-body.spec.ts`, `session-store.spec.ts`, `auth-context.spec.ts`; `secret-strength/index.spec.ts` covers the service lists.

## Verification

- [x] `npx nx run mcp:jest:test` — 12 suites, 91 tests (before: 9 suites, 54 tests).
- [x] `npx nx run-many --target=jest:test --projects=telegram,@sps/shared-utils` — 5 suites and 45 tests; 12 suites and 77 tests.
- [x] `npx nx run-many --target=eslint:lint --projects=mcp,telegram,@sps/shared-utils` — no findings.
- [x] `npx tsc --noEmit -p apps/mcp/tsconfig.json`, `-p apps/telegram/tsconfig.json`, `-p libs/shared/utils/tsconfig.json` — no errors.
- [x] `node tools/agents/code-placement.mjs` — no same-name file and folder pairs.
- [x] Mutation checks: with the redirect predicate reduced to "parses", the delete-scope check disabled, the client TTL extension removed, or the fetch origin check removed, the matching specs fail.
- [x] HTTP proof, API on 4316 and MCP on 3316 with the Redis store, a throwaway subject, the fallback flag on and `RBAC_SECRET_KEY` empty: metadata lists both scopes; a loopback registration answers 201 and its Redis key carries a 30-day TTL; `javascript:`, fragment, public `http` and credential redirects answer 400; a 70 KiB registration answers 413; the consent page names the client and the callback and has no password field; approval without the delete choice yields a `mcp:content` token, with it `mcp:content mcp:content:delete`; Cancel returns `access_denied`; `model-record-find` succeeds and `model-record-delete-apply` is refused for scope with the first token and reaches the API with the second; a 5 MiB `/mcp` body answers 413; `X-RBAC-SECRET-KEY` without a bearer answers 401; with three sessions allowed, opening a fourth leaves the least recently used one answering 404. Tokens were revoked and the client key, subject, identity and link deleted afterwards.
- [x] Boot checks at runtime: MCP with a legacy `RBAC_JWT_SECRET` and Telegram with a legacy `RBAC_SECRET_KEY` exit 1; with `MCP_SECRET_STRENGTH=report` or `TELEGRAM_SECRET_STRENGTH=report` they start.
- [x] `tools/deployer/mcp/mcp.env.j2` rendered with Ansible's Jinja: no `RBAC_SECRET_KEY` with the fallback on and the secret passed; empty settings fall back to their defaults.

## How to verify it

1. Start the API, then `npm run mcp:http`.
2. `curl http://127.0.0.1:3001/.well-known/oauth-protected-resource/mcp` lists `mcp:content` and `mcp:content:delete`.
3. `POST /oauth/register` with `{"redirect_uris":["javascript:alert(1)"]}` answers 400 `invalid_redirect_uri`; with `["http://127.0.0.1:53316/callback"]` it answers 201.
4. Open `http://127.0.0.1:3001/authentication/oauth` and start: the consent step names the client and `…/authentication/oauth`; Continue, sign in, and the page receives a token. Through that connection `model-record-find` works and `model-record-delete-apply` answers a permission error.
5. Log in with Codex (`codex mcp login <name> --scopes "mcp:content mcp:content:delete"`) or Inspector, tick "Also allow deleting records", and the same delete passes the scope check; the API still decides for the subject.

## Notes

- Private-use redirect schemes (RFC 8252 7.1, for example `cursor://`) are refused. None of the documented clients uses one; a deployment that needs one needs a follow-up allow-list.
- Deleting is not stepped up at the HTTP level (`insufficient_scope`); the delete-apply tools answer a permission error that tells the user to reconnect and approve deleting.
- The session idle default is 24 hours so a client left idle overnight keeps its session; the maximum count bounds memory (about 143 KiB of heap per session, measured).
- The template `tools/deployer/mcp/mcp.env.j2` already rendered `RBAC_SECRET_KEY` only when the fallback flag was `'true'`; the unconditional hand-over was in `mcp.sh`. Enabling the fallback on a server now needs the secret added to the MCP env by hand.
- The internal exchange keeps the delete scope because the profile agent deletes through the tools' preview and confirmation flow; limiting the agent is a separate product decision.
- Found during the proof and left unchanged: the local `sps-lite-redis-1` container runs with the password in `apps/redis/.env`, which differs from `KV_PASSWORD` in `apps/api/.env`, and `apps/mcp/.env` holds older secrets than `apps/api/.env`.
- The branch carries the research, plan, process and progress records under `thoughts/shared/`.

## Downstream migration

Adaptation is required where a project deploys MCP or Telegram, connects OAuth clients to MCP, or overrides the MCP OAuth, HTTP or content-management code.

**Applies to:** projects that deploy `apps/mcp` or `apps/telegram`, connect MCP clients over OAuth, override `apps/mcp` oauth, http, content-management or operations code, enable `MCP_SERVICE_ALLOW_RBAC_SECRET_FALLBACK` on a server, or upload files larger than 4 MiB through MCP.

**New environment variables:**

| Variable                                    | Default             | Meaning                                                                                                   |
| ------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------- |
| `MCP_SERVICE_OAUTH_CLIENT_TTL_SECONDS`      | `2592000` (30 days) | Lifetime of a registered OAuth client; each token issue extends it to at least the refresh-token lifetime |
| `MCP_SERVICE_HTTP_MAX_BODY_BYTES`           | `4194304` (4 MiB)   | Largest `/mcp` request body                                                                               |
| `MCP_SERVICE_HTTP_SESSION_IDLE_TTL_SECONDS` | `86400` (24 hours)  | Idle time after which a Streamable HTTP session closes                                                    |
| `MCP_SERVICE_HTTP_MAX_SESSIONS`             | `500`               | Live sessions; the least recently used closes to admit a new one                                          |
| `MCP_SECRET_STRENGTH`                       | `enforce`           | `report` starts MCP on a legacy RBAC secret                                                               |
| `TELEGRAM_SECRET_STRENGTH`                  | `enforce`           | `report` starts Telegram on a legacy RBAC secret                                                          |

**Actions:**

- Reconnect every OAuth connector that has to delete and tick "Also allow deleting records" on the consent step; for Codex run `codex mcp login <server-name> --scopes "mcp:content mcp:content:delete"`. Existing tokens keep read and write.
- Where the MCP fallback is enabled on a server, add `RBAC_SECRET_KEY` to that MCP service env by hand; the deployer no longer renders it.
- Before redeploying MCP and Telegram, rotate a legacy `RBAC_SECRET_KEY` or `RBAC_JWT_SECRET` as `tools/deployer/README.md` describes, or set `MCP_SECRET_STRENGTH=report` and `TELEGRAM_SECRET_STRENGTH=report` for the rotation window.
- Re-register MCP clients whose redirect URI is not `https` or loopback `http`, raise `MCP_SERVICE_HTTP_MAX_BODY_BYTES` if base64 uploads through MCP exceed 4 MiB, and optionally set an expiry on existing Redis keys `mcp:oauth:client:*` that have none (they get one at their next token issue).
- In overrides of `apps/mcp/content-management.ts` or `lib/content-management/operations.ts`, pass `extra.authInfo?.scopes` into the operation options and keep `requireOperation`'s scope check; in overrides of `lib/oauth.ts`, keep the consent step, the redirect rule and the body limit.

**Verify:** `npx nx run mcp:jest:test` passes; `GET /.well-known/oauth-protected-resource/mcp` lists both scopes; registering a `javascript:` redirect URI answers 400; a token without the delete scope gets a permission error from `model-record-delete-apply`; MCP and Telegram boot logs name only secrets that are set.
