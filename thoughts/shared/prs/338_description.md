Closes #316.

## Summary

MCP accepted unsafe callback URLs, kept unbounded pending registrations, HTTP sessions and request bodies, and could forward credentials outside the API. Refreshing an MCP token reused the original RBAC access JWT, so the connection stopped working after that JWT expired. Expiring the connector registration with its user tokens also broke later sign-in, and exact loopback-port matching rejected native clients that changed callback ports.

This PR validates callback URLs, bounds pending registrations, preserves completed registrations, limits bodies and sessions, and rejects API redirects. OAuth login and refresh use the subject SDK. MCP uses the same RBAC lifetimes and permissions as direct API requests, including deletion. It adds no separate delete permission.

## Changes

- Opening the MCP server root in a browser redirects to `/authentication/oauth`; `/mcp` remains the authenticated protocol endpoint.
- OAuth registration accepts HTTPS callbacks and HTTP callbacks on localhost or loopback addresses. Credentials, fragments, whitespace and non-ASCII characters are rejected. Native HTTP loopback callbacks may change only their port; HTTPS, host, path and query matching stay exact. Code exchange requires the exact callback used for that authorization.
- The consent page names the application, client id and callback before sign-in. It explains that the subject's existing permissions apply. The single `mcp:content` scope identifies the connection; API RBAC authorizes each operation. Existing delete previews and confirmation tokens remain.
- Access and refresh lifetimes come from `RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS` and `RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS`, capped by the actual expiry of the corresponding signed RBAC JWT. Client registrations are separate from sessions: pending registrations expire after 24 hours with an atomic limit of 1000; successful sign-in makes the registration persistent and releases its pending slot.
- MCP stores the subject's refresh JWT on the server. Refresh calls the RBAC SDK, checks the returned subject, and issues a new MCP pair mapped to the renewed RBAC session. A failed refresh requires signing in again. Codes and refresh tokens are consumed atomically with Redis `GETDEL` or the memory-store equivalent.
- The fetch wrapper adds credentials only for the configured API origin and forces `redirect: "error"` for API requests, including login and refresh bodies. This closes the reviewed redirect leak for both operator headers and subject credentials. Configure the final API URL, without a redirecting alias.
- OAuth bodies are limited to 64 KiB; `/mcp` bodies default to 4 MiB. HTTP sessions expire after 24 idle hours by default, with a maximum of 500 sessions and oldest-session eviction.
- All 20 tools declare read-only, destructive and external-effect annotations for MCP clients. The generic mutation tools cover all modules and conservatively describe publication, notification, file-fetch and record-change capabilities. These hints add no authorization layer.
- Local and deployed Redis default to `volatile-lru`, preserving completed OAuth registrations and the bounded pending index while cache keys may be evicted. Deployer and both Actions environments pass memory-limit and policy overrides. Existing `.env` files must be updated; the Redis data volume must survive deployments.
- The MCP deployment no longer copies `RBAC_SECRET_KEY` into its environment. API and MCP receive the same RBAC lifetime settings through local setup, the deployer and both GitHub Actions environments.
- MCP and Telegram run the existing shared secret-strength check on startup. Legacy predictable RBAC authorization secrets stop startup; the service-specific `report` setting permits a temporary warning-only mode. The Telegram change adds this check only; it is independent of MCP OAuth.

## Verification

Main `3cb105c225` is integrated. The only textual merge conflict was in `.github/workflows/ansible.yml`; both preview and production retain the API/outbound and MCP settings.

- [x] `npx jest --config apps/mcp/jest.config.ts --runInBand`: 117 tests in 13 suites.
- [x] `npx tsc --noEmit --project apps/mcp/tsconfig.json`; ESLint on changed TypeScript files using the MCP TypeScript project (the root monorepo project exceeded the default Node heap); `bash -n` on changed shell scripts; `git diff --check`. API/MCP Jinja templates render matching lifetime defaults and overrides.
- [x] `bun test --no-env-file tools/dev/deploy-credentials.test.ts`: 6 tests, including Redis deployer defaults/overrides and the correspondence between declared Actions environment values and the generated `.env`.
- [x] `MCP_TEST_REDIS_PORT=<isolated-port> bun test --no-env-file --timeout 30000 tools/dev/mcp-auth.test.ts`: 5 tests. Runtime authentication check: actual Bun MCP HTTP process, isolated Redis, real SDK calls to a loopback RBAC fixture with signed test JWTs. Verifies expired access/refresh rejection, renewed access, single-use code and refresh exchange, Redis TTLs, stable client identity after session expiry and MCP restart, loopback port changes, ChatGPT/Claude callback shapes, SDK tool discovery/read calls, the concurrent registration cap, and no operator header on login/refresh.
- [x] Isolated Redis under memory pressure: 3914 temporary keys evicted, all 6 completed registrations and the pending index preserved. All 6 registrations and the index also survived a graceful Redis restart. Redis Jinja defaults and explicit overrides rendered successfully.
- [x] Redirect runtime check in the same test file: HTTP 301, 302, 303, 307 and 308; the receiving server gets no request, including POST bodies with synthetic credentials.
- [x] Telegram 45 tests and shared-utils 123 tests passed during the main synchronization; this follow-up does not change their runtime code.
- [x] Live MCP: `GET /` and `HEAD /` return 302 to `/authentication/oauth`; the login page returns 200, `POST /` stays 404 and unauthenticated `/mcp` stays 401. Browser navigation from the root reaches the login page.
- [ ] Connect from hosted ChatGPT and Claude accounts after the public HTTPS deployment. Local protocol tests do not establish hosted end-to-end compatibility. Kimi Code and other MCP agents must be checked in their actual client versions; model APIs alone do not imply MCP support.

## Notes

Removal of migration-only secret checks and temporary `report` modes is tracked in #386. Cleanup starts after the owner confirms that all maintained projects have upgraded and old secrets have been rotated.

The runtime fixture tests MCP's use of the RBAC contract. It does not establish end-to-end authorization against a production account or independently audit the RBAC implementation. No production data or configuration was changed. The current transport negotiates protocol `2025-06-18`; clients must allow that version and DCR. CIMD-only and legacy HTTP+SSE-only clients are not supported.

Redis RDB persistence survives graceful restarts. Abrupt host failure can lose changes since the last snapshot; AOF requires the documented live conversion before enabling it on an existing database. Expiring tokens may be evicted under memory pressure and require sign-in; persistent registrations consume memory and must be monitored.

## Downstream migration

Applies to projects deploying MCP or Telegram, overriding their startup/authentication code, or connecting OAuth clients to MCP.

1. Use the same `RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS` and `RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS` in API and MCP (defaults: 3600 and 86400 seconds). Remove custom `MCP_SERVICE_OAUTH_ACCESS_TOKEN_TTL_SECONDS`, `MCP_SERVICE_OAUTH_REFRESH_TOKEN_TTL_SECONDS` and `MCP_SERVICE_OAUTH_CLIENT_TTL_SECONDS` settings. The authorization-code TTL remains separate.
2. Reconnect existing OAuth clients once: older stored refresh records have no RBAC refresh JWT. If a prior deployment already expired the client registration, clear that server’s cached OAuth registration in the client and register again. No additional delete approval is needed; retain the subject's API permissions and tool confirmation flow in overrides.
3. Configure `API_SERVICE_URL` with the final origin and route base. Redirects from API SDK requests now fail.
4. Use HTTPS or loopback HTTP callback URLs. Private-use URI schemes need a separate explicit allow-list if a downstream connector requires them.
5. Rotate legacy `RBAC_SECRET_KEY` or `RBAC_JWT_SECRET` before deploying. For the rotation window, `MCP_SECRET_STRENGTH=report` and `TELEGRAM_SECRET_STRENGTH=report` permit startup with warnings; see `tools/deployer/README.md`.
6. Set `REDIS_MAXMEMORY_POLICY=volatile-lru` in existing local/deployer environments or the corresponding Actions secret, then redeploy Redis while retaining `redis_data`. The default is applied when the value is empty. Cache resets must not delete OAuth keys.
7. Private operator-fallback deployments must provide `RBAC_SECRET_KEY` explicitly; the deployer no longer copies it. Adjust the documented body and session limits if required.

Verify with `npx nx run mcp:jest:test`. For the runtime check, provide a dedicated Redis port and run `MCP_TEST_REDIS_PORT=<port> bun test --no-env-file --timeout 30000 tools/dev/mcp-auth.test.ts`. Then connect a test subject to the deployed MCP, check its normal API permissions and refresh after access expiry.
