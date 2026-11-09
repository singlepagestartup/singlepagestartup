Closes #310.

## Summary

The API previously allowed unlimited attempts to sign in, create sessions and guess operator credentials. Unknown accounts also produced different login/reset answers. This PR adds authentication budgets and uniform answers, plus general admission limits for every API route and public file read.

Users are identified through RBAC's verified access token and Subject revocation checks. IP and Subject budgets are independent, shared across replicas in Redis, and expire automatically. No permanent account ban or additional database model is introduced.

## Changes

- Add a global middleware before body parsing, observers, permission lookups and HTTP cache reads. Default IP budgets are 500 requests/10 seconds and 3000/minute; Subject budgets are 100/10 seconds and 600/minute. Token refresh, devices and social profiles share the same Subject budget. Conflicting header/cookie identities are refused.
- Preserve stricter authentication budgets: login/reset requests count IP and normalized account; registration, reset-password and wallet authentication count IP; session init/refresh count IP. Login returns the same 401 after bcrypt for unknown accounts and wrong passwords. Forgot-password returns the same 201 response.
- Share counters through the existing KV provider. `INCR` and expiry update execute together in a Redis transaction. The general guard returns 503 during store failure, with bounded commands and a one-second retry pause instead of allowing uncounted visitor requests.
- Return standard `Rate limit error` responses with 429, `Retry-After` and `Cache-Control: no-store`. Expose `Retry-After` through CORS. Log the first threshold crossing, with Subject/IP marker, route pattern and request ID. Repeated refusals skip diagnostic body inspection and Telegram delivery. Wrong operator secrets are logged once per address/window, without their value.
- Replace hop-count trust with explicit `RBAC_RATE_LIMIT_TRUSTED_PROXY_CIDRS`. Start with the socket peer and stop at the first untrusted IP. Count private addresses; normalize mapped IPv4 and group IPv6 addresses by /64. Verified operator calls remain exempt from general visitor budgets; the wrong-secret guard remains independent.
- Publish Traefik ports in host mode so Swarm ingress does not hide client addresses. Ansible reads the actual Traefik overlay subnets for API trust. When Cloudflare is enabled, API and Traefik trust its documented proxy ranges. Pass every setting through preview/production Actions, the deployer and API environment template.
- Document limits, proxy configuration, Redis failure behavior and server log queries in the Subject and deployer READMEs. No database migration is required.

## Verification

- [x] Jest: 265 suites passed, 1832 tests passed, one test/suite skipped across RBAC, middleware, backend utilities/API, KV, shared utilities and API app. As on the base branch, the broad runner retained a Redis handle after reporting results and was stopped; focused tests exited normally.
- [x] Focused admission/authentication/error-filter tests: 11 suites, 131 tests. Includes multiple instances/devices, token changes, forged forwarding headers, private/IPv6 addresses, expiry, unavailable KV, bounded logging and conflicting credentials.
- [x] TypeScript: RBAC, middleware and backend utilities; ESLint on changed TypeScript files; module dependency check (0 violations).
- [x] Two actual API processes on ports 4002/4003 with local PostgreSQL and Redis: with a test Subject limit of four, eight concurrent requests yielded exactly four 200s and four 429s across both processes. Inspected the Redis counter and TTL directly. Another Subject remained usable. After `Retry-After`, access recovered and the old Redis key no longer existed.
- [x] Disconnected a separate test process's real Redis socket: five requests returned 503 without reaching the handler; reconnect restored admission. The shared Redis server was not stopped.
- [x] Browser: the framework page and cart loaded on the local Host/API without API errors. Only an existing Next.js image-loading warning appeared.
- [x] Rendered API/Traefik templates for Cloudflare on/off and a custom trust override. Validated YAML, Bash syntax and every preview/production setting mapping. Existing deploy credential tests: six passed.
- [ ] Production rollout of the new Traefik publication and trust configuration has not been performed in this task.

## Notes

The defaults are starting budgets, not measured server capacity or a universal DDoS threshold. Fixed windows can admit two budgets near their boundary. These limits do not cap work already running, WebSocket frames, the separate Next.js Host or distributed network floods; expensive domain operations still need bounded execution and upstream protection.

Traefik uses `stop-first` updates with host-published ports. On a single node, its update causes a brief interruption. An API-only image update does not change an existing Traefik deployment.

Authentication account budgets can temporarily affect the owner when others repeatedly target their login. Registration still reveals an existing identity; confirmation is tracked in #280. This PR does not implement reset-mail delivery.

## Downstream migration

- Projects overriding `apps/api/app.ts` must compose the general guard before body parsing, observers, permissions, caches and public reads, passing the effective RBAC Subject resolver. Preserve startup overrides rather than importing a private repository.
- Projects overriding authentication routes must retain their route-specific guards. Consumers must handle the uniform login 401/forgot-password 201 and respect 429/503 retry delays.
- Replace the unpublished hop-count setting with explicit trusted proxy CIDRs. Redeploy Traefik as well as API; verify real client addresses, forged-header rejection and two-replica budgets. For the standard deployer, overlay subnets and optional Cloudflare ranges are supplied automatically. Keep the API port internal and configure custom upstream proxies explicitly.
- Tune all four `API_RATE_LIMIT_*` budgets to normal traffic and propagate overrides through both deployment environments. All replicas need the same KV store and settings. Keep warning logging enabled to retain rate-limit events.
- Verify a normal page load, independent users, shared budgets after token refresh, 429 plus recovery, Redis outage/recovery, and `rate_limit.exceeded` in the server journal without credentials.
