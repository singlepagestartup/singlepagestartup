Closes #308.

## Summary

Public-route rules previously matched substrings of a URL. For example, the rule for the channel list also admitted a channel's messages, and the favicon rule admitted an unrelated API path ending in `favicon.ico`. Those requests skipped the global RBAC permission check.

Framework rules now match complete paths and explicit methods. API, Telegram and OpenAPI also share an optional browser-origin list, `API_CORS_ALLOWED_ORIGINS`. This branch includes main through `0bcce599d5`; nine merge conflicts are resolved.

## Changes

- Anchor framework allow rules with `^` and `$`. Limit favicon and broadcast exceptions to their exact GET routes, and enumerate authentication routes by method.
- Remove blanket exceptions for permissions, roles-to-permissions and subjects-to-roles. Their requests use the existing permission service.
- Preserve main's controller-owned checks, subject cache reset, file content, page SEO and public agent cron routes.
- Share `resolveCorsOrigin` across the three Hono apps. A configured list requires an exact origin match. Missing, malformed and opaque (`null`) origins receive no CORS grant. A nonempty unusable list, including commas alone, denies access instead of enabling the permissive default.
- Pass the CORS setting through local deployment and Actions, using **Variables** for production and preview. Preserve main's rate limits, notifications, upload limits, refresh-token and outbound URL settings.
- Remove the ineffective header-property assignment from authorization middleware.
- Restore the missing `"use server"` directive in the Broadcast relation reader. This inherited main defect prevented the Host page from compiling in Turbopack.
- Test CORS on warmed consistency-cache responses and authorization before cache reuse. No cache implementation or database schema changes are needed.

## Verification

Rechecked on the merged code:

- [x] Middleware Jest suite: 16 suites, 91 tests, including 17 route-rule tests.
- [x] CORS helper: 19 tests. Consistency-cache suite: 10 tests.
- [x] `node --test tools/deployer/github/configuration.test.mjs`: 12 tests.
- [x] Real Ansible template rendering for API and Telegram with the origin list unset, empty and configured.
- [x] TypeScript for middlewares and backend-utils; focused ESLint; module dependency check; shell syntax and diff whitespace checks.
- [x] Local API against PostgreSQL and Redis: init, me, refresh, ordinary subject refused, Admin permitted, logout revokes access. Temporary subject and role link deleted.
- [x] Anonymous requests to channel messages, channel relations, permissions, role relations and an embedded favicon path return 403. The channel list, authentication me and public Host reads remain available. Operator reads succeed.
- [x] Real Redis cache hits retain the correct CORS grant for each allowed origin and omit it for unlisted and opaque origins.
- [x] Browser: Host `/ru/framework` renders; sign-in form loads and displays the normal invalid-credentials error.
- [ ] Full API type-check is not clean: 27 diagnostics. A TypeScript compiler run with main's source overlaid and the same installed dependencies produces the identical file/code/message list.
- [ ] Production build/deployment and a live external OAuth provider round trip were not run in this review.

## Notes

With the setting absent or blank, ordinary HTTP(S) origins remain allowed for compatibility. Production must supply an explicit list to restrict browser readers. CORS does not authenticate callers, prevent every cross-origin write, or restrict server-to-server requests.

Leaving the framework allow-list sends a request through existing RBAC rules; it does not make every route private. Permission rows without roles remain public under the current RBAC contract. This PR does not change those records.

Local Redis testing used an isolated temporary container because the existing local dump uses RDB format 14, which the installed Redis 7.4 image cannot read. The original dump was preserved. This is a local infrastructure limitation, not a schema migration in this PR.

## Downstream migration

- Check project-owned callers of channel details/messages, channel relations and the permission graph. Send the user's session for user actions or the operator credential from trusted server code; configure permissions for the intended role. Keep operator credentials out of browser code.
- Anchor project-owned public rules at both ends and specify their methods. Custom authentication endpoints need an explicit rule or their normal RBAC permission.
- For browser-origin restrictions, set `API_CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com` in deployer configuration. Include every browser frontend as `scheme://host[:port]`, without paths. Opaque sandbox origins cannot be enabled.
- Owned GitHub workflows and synchronization scripts must use Variables `API_CORS_ALLOWED_ORIGINS` and `PREVIEW_API_CORS_ALLOWED_ORIGINS`, then pass the list to API and Telegram. Keep credentials in Secrets. Owned Hono entry points should use the shared resolver.
- Owned copies of the Broadcast relation server reader need the server directive as in the framework.
- Verify allowed and unlisted browser origins, anonymous and authenticated RBAC reads, login/refresh/logout, and the Host page with the response cache enabled. Current main authorizes before cache lookup; no legacy GET cache-reset fallback is introduced.
