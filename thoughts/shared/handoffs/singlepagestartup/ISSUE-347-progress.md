---
issue_number: 347
issue_title: "Subject checkout routes: add the owner check"
start_date: 2026-09-26T00:30:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-347.md
status: in_progress
---

# Implementation Progress: ISSUE-347 - Subject checkout routes: add the owner check

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-347.md`

## Phase Progress

### Phase 1: Server-side callers carry a credential

- [x] Started: 2026-09-26T03:32+0300
- [x] Completed: 2026-09-26T03:45+0300
- [x] Automated verification: `proceed.spec.ts` 8/8; `telegram-subscription-checkout.spec.ts` 2/2 (one new scenario). Mutation checks: with `main`'s `proceed.ts` the renewal scenario fails; with `main`'s agent service both agent scenarios fail. Sources restored after each check.

**Notes**: the renewal sends `X-RBAC-SECRET-KEY` and `Cache-Control: no-store` like the other calls in `proceed.ts`; the agent callback signs a token for the Telegram user's subject with `signRbacModuleSubjectJwt` and sends it as `Authorization: Bearer`, as the react-by-openrouter call in the same service does. Specs run with `npx jest -c libs/modules/<module>/jest.config.ts <spec path>`.

### Phase 2: Owner guard and subject-scoped order checkout

- [x] Started: 2026-09-26T03:45+0300
- [x] Completed: 2026-09-26T04:05+0300
- [x] Automated verification: route-table spec `controller/singlepage/index.spec.ts` 8/8 (new); `order/checkout.spec.ts` 5/5 (two new scenarios). Mutation checks: without the guard on the order route its two refusal scenarios fail (2 of 8), likewise for the product route (2 of 8); with `main`'s order checkout handler three scenarios fail. Sources restored after each check.

**Notes**: the route-table spec mounts the real table through `DefaultApp.useRoutes()`, as PR #346's spec does; a service whose `findById` resolves `null` stops a handler at its first lookup (404), so no request leaves the test process. The order checkout reads the subject's `subjectsToEcommerceModuleOrders`, keeps the body ids linked to the subject and answers 404 before any order read when none remain; ids of deleted orders are still dropped by the order lookup.

### Phase 3: Subject README

- [x] Started: 2026-09-26T04:05+0300
- [x] Completed: 2026-09-26T04:10+0300
- [x] Automated verification: `npx prettier --check libs/modules/rbac/models/subject/README.md` passed.

**Notes**: the section "Ecommerce Checkout Routes" follows "Social Thread Permission Routes" and names the guard, the credential of each caller kind and the order scope.

### Verification

- Unit lanes (`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run <project>:jest:test --skip-nx-cache`): `@sps/rbac` 83 suites / 390 tests passed; `@sps/agent` 17 suites / 89 tests passed.
- Lint (`NODE_OPTIONS=--max-old-space-size=12288 npx nx run-many --target=eslint:lint --projects=@sps/rbac,@sps/agent --skip-nx-cache`): passed, no warnings.
- Types (`npx tsc --noEmit -p libs/modules/{rbac,agent}/tsconfig.json`): 0 errors each.
- Placement (`node tools/agents/code-placement.mjs`): no same-name file and folder pairs.
- Prettier: every changed file passes `npx prettier --check` (the research table was realigned with `--write`).
- HTTP run: API from this worktree on port 4347 against `sps-lite-issue-347`, a `pg_dump` copy of the development database on the local PostgreSQL (351 tables, restore without errors), with `API_SERVICE_URL` and `NEXT_PUBLIC_API_SERVICE_URL` on 4347, the host URLs on a closed port, and the Telegram, bug-report and SES credentials blanked for the run. Fixtures: two anonymous `init` subjects A and B; A adds two cart orders of the `startup` product with its own token (200, 200) and lists them (200, 2 orders).
  - Order checkout route of A: no credential 400 ("Validation error. No JWT token provided"); B's token 401 ("Authorization error. Only profile owner can get access"); a wrong operator secret 401 from the global authorization step; B's own route naming A's second order 404 ("No ecommerce module orders found"). After these requests A's second order was still `new`/`cart` without a comment. A's own token checked out A's first order: 200, one invoice, order `paying`/`history`. The operator secret checked out A's second order: 200, one invoice.
  - Product checkout route of A: no credential 400; B's token 401; A's own token 200; the operator secret 200; a token signed the way the agent module signs it (`{ exp, iat, subject }` with the subject row) 200.
  - Telegram free subscription for A through `POST /api/rbac/subjects/:id/telegram/checkout-free-subscription` with the operator secret: 200; the free-subscription service reached the guarded product checkout with the operator secret and created a `paying` order with a zero-amount `telegram-star` invoice (a zero amount never reaches the Telegram service).
  - The subscription renewal and the agent callback were not run end to end (they need an expired Telegram Stars order and a Telegram callback action); they are covered by their unit scenarios and by the operator-secret and agent-token requests above, which carry the same credentials.
  - Cleanup: API stopped, `sps-lite-issue-347` dropped, scratch files holding tokens removed. The development database was only read by `pg_dump`.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 2 -->

### Incident 1 — The proof API cannot authenticate to the shared Redis

- **Occurrences**: 1
- **Stage**: Verification
- **Symptom**: the worktree's `apps/api/.env` `KV_PASSWORD` differs from the password the `sps-lite-redis-1` container runs with (known from #303, `WRONGPASS`).
- **Root Cause**: the container starts with `--requirepass "${REDIS_PASSWORD}"` from `apps/redis/.env`; the API env copy carries another value.
- **Fix**: the launcher passes `KV_PASSWORD` read from `apps/redis/.env` on the command line (shell values override both Bun's `.env` loading and `dotenv`); equality was checked by hash only. The boot log then showed no KV or Redis error.
- **Reusable Pattern**: compare secrets by hash, never by value, and override them per process instead of editing the env copy.

### Incident 2 — The run stopped at the account usage limit

- **Occurrences**: 1
- **Stage**: Verification
- **Symptom**: the session ended after the unit lanes, lint, type checks and the database copy, before the HTTP run.
- **Root Cause**: account usage limit.
- **Fix**: resumed from this file and `git status`; the throwaway database had survived, the API was restarted on port 4347 and the run completed.
- **Reusable Pattern**: record each verification result here as soon as it exists, so a resumed session does not repeat finished work.

## Summary

### Changes Made

- `RequestSubjectIdOwner` on `POST /:id/ecommerce-module/orders/checkout` and `POST /:id/ecommerce-module/products/:productId/checkout` in the subject route table.
- The order checkout keeps only body order ids linked to the subject through `subjects-to-ecommerce-module-orders`.
- Subscription renewal in `proceed.ts` sends `X-RBAC-SECRET-KEY`; the agent's Telegram checkout callback sends a token signed for the Telegram user's subject.
- Specs: new route-table spec, two new order checkout scenarios, updated renewal and agent scenarios with one new agent scenario.
- Subject README: "Ecommerce Checkout Routes".

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [ ] All phases completed
- [ ] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-26T05:40:00Z
