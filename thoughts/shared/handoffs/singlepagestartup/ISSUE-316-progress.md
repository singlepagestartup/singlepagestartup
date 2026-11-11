---
issue_number: 316
issue_title: "Harden MCP OAuth registration, scopes, sessions and outbound authentication"
start_date: 2026-09-25T22:00:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-316.md
status: in_progress
---

# Implementation Progress: ISSUE-316 - Harden MCP OAuth registration, scopes, sessions and outbound authentication

**Started**: 2026-09-25
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-316.md`

## Phase Progress

### Phase 1: Registered clients expire

- [x] Started: 2026-09-25T22:02Z
- [x] Completed: 2026-09-25T22:24Z
- [x] Automated verification: PASSED (`oauth.spec.ts`: unused client expires after its TTL; a client that obtains tokens outlives its first TTL)

**Notes**: `saveClient` takes a TTL in both stores. Registration uses `MCP_SERVICE_OAUTH_CLIENT_TTL_SECONDS` (default 2592000); every token issue saves the client again with the larger of that TTL and the refresh-token TTL. HTTP proof: `TTL mcp:oauth:client:<id>` read 2591972 after the flow.

### Phase 2: Redirect URI validation

- [x] Started: 2026-09-25T22:02Z
- [x] Completed: 2026-09-25T22:24Z
- [x] Automated verification: PASSED (accepted: https, `localhost`, `127.0.0.1`, `[::1]`; refused: `javascript:`, `data:`, fragment, empty fragment, credentials, public http, whitespace, unparseable, non-string; exact matching at authorize and token)

**Notes**: one predicate, used at registration and in `validateAuthorizeParams`. Malformed registration JSON answers 400 `invalid_client_metadata`. Mutation check: with the predicate reduced to "parses", 7 refusal specs fail.

### Phase 3: Scopes and the consent step

- [x] Started: 2026-09-25T22:01Z
- [x] Completed: 2026-09-25T22:26Z
- [x] Automated verification: PASSED (`oauth.spec.ts` consent, cancel, approved-scope and error-page scenarios; `operations.spec.ts` scope scenarios; `content-management.spec.ts` scope wiring)

**Notes**: scope constants live in `apps/mcp/lib/auth.ts` and reach content-management through `lib/content-management/auth.ts`. Mutation check: with the scope check disabled, "refuses delete apply for a connection without the delete scope" fails.

### Phase 4: Body limits

- [x] Started: 2026-09-25T22:04Z
- [x] Completed: 2026-09-25T22:24Z
- [x] Automated verification: PASSED (`request-body.spec.ts`; `oauth.spec.ts` 70 KiB registration answers 413)

**Notes**: see Incident 1.

### Phase 5: Session eviction

- [x] Started: 2026-09-25T22:07Z
- [x] Completed: 2026-09-25T22:26Z
- [x] Automated verification: PASSED (`session-store.spec.ts`)

**Notes**: a session is looked up, and so refreshed, before its request body is read.

### Phase 6: Operator secret out of the MCP environment

- [x] Started: 2026-09-25T22:10Z
- [x] Completed: 2026-09-25T22:12Z
- [x] Automated verification: PASSED (template rendered with Ansible's Jinja: `RBAC_SECRET_KEY` absent with the fallback on and the secret passed; empty tunables fall back to their defaults)

**Notes**: the template already gated the secret on the fallback flag; `mcp.sh` passed it on every run and `apps/mcp/create_env.sh` copied it locally. All three are gone. The four new settings are plumbed like the OAuth TTLs.

### Phase 7: Boot-time secret check in MCP and Telegram

- [x] Started: 2026-09-25T22:08Z
- [x] Completed: 2026-09-25T22:39Z
- [x] Automated verification: PASSED (`secret-strength/index.spec.ts`; runtime checks below)

**Notes**: runtime, with the public test digest of `echo 0 | md5sum`: MCP with a legacy `RBAC_JWT_SECRET` exits 1 with "Refusing to start"; with `MCP_SECRET_STRENGTH=report` it starts and answers 200. Telegram (run from a directory without `.env`, no bot token) with a legacy `RBAC_SECRET_KEY` exits 1; with `TELEGRAM_SECRET_STRENGTH=report` it starts and answers 200.

### Phase 8: Fetch patch limited to the API origin

- [x] Started: 2026-09-25T22:10Z
- [x] Completed: 2026-09-25T22:26Z
- [x] Automated verification: PASSED (`auth-context.spec.ts`)

**Notes**: mutation check: without the origin check, "sends no credentials to another origin" fails.

### Phase 9: Documentation

- [x] Started: 2026-09-25T22:29Z
- [x] Completed: 2026-09-25T22:41Z
- [x] Automated verification: PASSED (`prettier --check` on the touched Markdown; table churn in `tools/deployer/README.md` kept to one row)

**Notes**: `README.md`, `apps/mcp/README.md`, `apps/mcp/USAGE.md`, `AI_GUIDE.md` section 6, `tools/deployer/README.md`, and the browser test page text.

## Verification

| Command                                                                                                                                  | Result                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run mcp:jest:test --skip-nx-cache`                                                      | 12 suites, 91 tests passed (baseline 9 suites, 54 tests)                           |
| `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run-many --target=jest:test --projects=telegram,@sps/shared-utils --skip-nx-cache`      | `telegram` 5 suites, 45 tests; `@sps/shared-utils` 12 suites, 77 tests; all passed |
| `NODE_OPTIONS=--max-old-space-size=12288 npx nx run-many --target=eslint:lint --projects=mcp,telegram,@sps/shared-utils --skip-nx-cache` | passed, no findings; `mcp` re-run after the last edit passed                       |
| `npx tsc --noEmit -p apps/mcp/tsconfig.json`, `-p apps/telegram/tsconfig.json`, `-p libs/shared/utils/tsconfig.json`                     | no errors                                                                          |
| `node tools/agents/code-placement.mjs`                                                                                                   | no same-name file and folder pairs                                                 |
| Mutation checks (redirect predicate, delete scope check, client TTL extension, fetch origin check)                                       | each disabled guard fails its spec; files restored and the lane passes             |

HTTP proof, API on 4316 and MCP HTTP on 3316 (Redis store, fallback flag on, `RBAC_SECRET_KEY` empty, `MCP_SERVICE_HTTP_MAX_SESSIONS=3`), throwaway subject registered through the API:

- Metadata: both documents 200 with `scopes_supported` `["mcp:content","mcp:content:delete"]`.
- Registration: loopback `http://127.0.0.1:53316/callback` 201; `javascript:`, fragment, public http, credentials 400 `invalid_redirect_uri`; 70 KiB body 413; malformed JSON 400 `invalid_client_metadata`.
- Consent without the delete choice (client asked for both scopes): GET 200 with `X-Frame-Options: DENY`, names client id and redirect URI, offers the delete choice, no password field; approve 200 with approved scope `mcp:content`; sign-in 302 to the registered URI with code and state; token 200 with scope `mcp:content`.
- Cancel: 302 with `error=access_denied`, no code.
- MCP with that token: initialize 200 with a session id; `model-record-find` blog.article 200 `ok=true`; `model-record-delete-apply` 200 `ok=false` with the scope refusal.
- Consent with the delete choice ticked: token scope `mcp:content mcp:content:delete`; the same delete call is not refused for scope and reaches the API, which decides for the subject.
- 5 MiB `/mcp` body 413. `X-RBAC-SECRET-KEY` without a bearer, fallback on, variable empty: 401 with `WWW-Authenticate`.
- Sessions with a maximum of three: after A, B, C, using B and C, opening D leaves A answering 404 and B, C, D answering 200.
- Cleanup: four tokens revoked (200 each, their Redis keys gone), the client key deleted, the throwaway subject, its identity and link deleted through the API (subject 404 afterwards, no relation rows left), both servers stopped, ports 4316, 3316, 8316 free.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 2 -->

### Incident 1 — OAuth handler errors skipped the OAuth error mapping

- **Occurrences**: 1
- **Stage**: Phase 4 - Body limits
- **Symptom**: the 70 KiB registration spec rejected with `RequestBodyTooLargeError` instead of answering 413.
- **Root Cause**: `handleOAuthRequest` returned each handler's promise from inside `try` without `await`, so its `catch` never saw asynchronous errors; they surfaced as the generic 500 in `http.ts`.
- **Fix**: `return await` for the register, authorize, token and revoke handlers.
- **Reusable Pattern**: inside `try`/`catch`, `return await` an async call whose errors the `catch` must map.

### Incident 2 — Local environment drift during the HTTP proof

- **Occurrences**: 1
- **Stage**: HTTP proof
- **Symptom**: the API logged `WRONGPASS` for Redis, and the MCP could not verify subject JWTs issued by the API.
- **Root Cause**: the shared Redis container restarted at 2026-09-25T22:04Z with the password from `apps/redis/.env`, which differs from `KV_PASSWORD` in `apps/api/.env` (main checkout and worktree alike); `apps/mcp/.env` holds an older `RBAC_JWT_SECRET` and exchange secret than `apps/api/.env`.
- **Fix**: for the proof processes only, `KV_PASSWORD` came from `apps/redis/.env` and the MCP's `RBAC_JWT_SECRET` and exchange secret from `apps/api/.env`, passed as process variables and never printed. No env file was edited.
- **Reusable Pattern**: before an HTTP proof, compare the secrets two services must share by hash (`shasum` of the value, never the value) and check `redis-cli ping` with the configured password through `docker exec`.

## Summary

### Commits

- `8a63f092ae` fix(mcp): harden OAuth registration, scopes, sessions and outbound credentials
- `c717c8926c` docs: add research, plan, process and progress for #316

### Changes Made

- `apps/mcp/lib/oauth.ts`: client TTL, redirect rule, scope normalization, consent and sign-in steps, 64 KiB OAuth bodies, awaited handlers, both scopes for the internal exchange.
- `apps/mcp/lib/auth.ts`, `lib/content-management/auth.ts`: scope constants.
- `apps/mcp/lib/content-management/operations.ts`, `apps/mcp/content-management.ts`: scope check in `requireOperation`; tools pass the granted scopes.
- `apps/mcp/lib/request-body.ts`, `apps/mcp/lib/session-store.ts` (new), `apps/mcp/http.ts`: body limit, session store, boot check, full scopes for the fallback and auth-disabled paths.
- `apps/mcp/lib/auth-context.ts`: credentials forwarded to the API origin only.
- `libs/shared/utils/src/lib/secret-strength/index.ts`, `envs/telegram.ts`, `apps/telegram/server.ts`: service secret lists, `assessConfiguredSecrets`, Telegram boot check.
- Deployer and local env: `mcp.env.j2`, `mcp.sh`, `github_deployer.sh`, `.env.example`, `.github/workflows/ansible.yml`, `apps/mcp/create_env.sh`.
- Specs and documentation as listed per phase.

### Pull Request

- [x] PR created: https://github.com/singlepagestartup/singlepagestartup/pull/338
- [x] PR number: 338

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-25T22:43:00Z
