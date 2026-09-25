---
issue_number: 303
issue_title: "Review the permission default for routes without roles"
start_date: 2026-09-25T23:25:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-303.md
status: complete
completed_date: 2026-09-26
---

# Implementation Progress: ISSUE-303 - Review the permission default for routes without roles

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-303.md`

## Phase Progress

### Phase 1: Cart reads through the owner route

- [x] Started: 2026-09-26T02:40+0300
- [x] Completed: 2026-09-26T03:20+0300
- [x] Automated verification: `cart-read.spec.ts` 4/4; cart sheet spec 3/3; product cart spec 2/2; order list widget spec 2/2; order `cart-default` and `form-field-default` specs 2/2. Mutation checks: the `main` versions of the cart sheet, the product cart, the widget and the two order variants each fail their new scenario.

**Notes**: the owner list route applies caller filters inside the subject's orders; the client query key carries the params; the order variants `cart-default` and `form-field-default` render the order they receive (the fetching halves of `form-field-default` are removed); the cart sheet uses `subject-default` and the inner action components; the product cart drops the module-level order read; the host order list widget reads the owner route with a type filter.

### Phase 2: Admin role on the listed seed rows

- [x] Started: 2026-09-26T02:25+0300
- [x] Completed: 2026-09-26T02:35+0300
- [x] Automated verification: 29 new files, each with the snapshot Admin role id and a distinct intended permission id that exists in the permission snapshots; no other data file changed; the inventory script now counts 475 permissions, 293 role-less, 184 attachments, 0 orphans.

**Notes**: ran first, while the API on port 4303 served `sps-lite-issue-303` (a `pg_dump` copy of the development database). 29 `POST /api/rbac/roles-to-permissions` calls with the operator secret answered 201; `npx nx run api:db:dump` wrote 29 new relation files and one unrelated broadcast channel file, which was removed. Spot check on the running API: `GET /api/ecommerce/orders` 403 without a token and with an `init` token, `GET /api/billing/invoices` 403, `GET /api/rbac/subjects-to-ecommerce-module-orders` 403, `POST /api/notification/topics/send-all` 403, `GET /api/blog/articles` 200.

### Phase 3: Reviewed list of role-less permissions

- [x] Started: 2026-09-26T03:20+0300
- [x] Completed: 2026-09-26T03:45+0300
- [x] Automated verification: `is-authorized.spec.ts` 11/11 with four new scenarios. Mutation checks: removing the `GET /api/blog/articles` entry fails the seed scenario and names the row; removing the list filter fails all four new scenarios; moving the 29 new attachment files out makes the seed scenario name exactly 29 rows.

**Notes**: 293 entries in seven groups, generated from the seed with a scratchpad classifier and checked by hand; five rows that match no route were found by matching every subject row against the controller route table and every module segment against the module apps.

### Phase 4: Owner middleware on `openrouter/models`

- [x] Started: 2026-09-26T03:45+0300
- [x] Completed: 2026-09-26T03:55+0300
- [x] Automated verification: `controller/singlepage/index.spec.ts` 4/4, mounting the real route table through `DefaultApp.useRoutes`. Mutation check: without the middleware the three refusal scenarios fail.

**Notes**: —

### Verification

- Unit lanes (`npx nx run-many --target=jest:test`, `NX_DAEMON=false NX_ISOLATE_PLUGINS=false`, `--skip-nx-cache`): `@sps/rbac` 84 suites / 391 tests, `@sps/ecommerce` 16 suites, `@sps/host` 10 suites, `@sps/shared-frontend-components` 14, `@sps/shared-frontend-client-api` 5, `@sps/shared-frontend-client-utils` 5, `@sps/shared-frontend-api` 1, `@sps/shared-frontend-server-api` 1, `@sps/shared-frontend-client-store` 1; all passed.
- Lint (`NODE_OPTIONS=--max-old-space-size=12288 npx nx run-many --target=eslint:lint --projects=@sps/rbac,@sps/ecommerce,@sps/host`): passed, 0 warnings, after one Prettier fix (incident 2).
- Types (`npx tsc --noEmit -p libs/modules/{rbac,ecommerce,host}/tsconfig.json`): 0 errors each.
- `node tools/agents/code-placement.mjs`: no same-name file and folder pairs.
- HTTP on port 4303 against `sps-lite-issue-303` (copy of the development database, new code): `init` subject A creates a cart order (200) and lists it through the owner route (200, 1 order; with a type filter 1; with a status `paid` filter 0); A on subject B's owner route 403; `GET /api/ecommerce/orders` 403 without a token and with A's token, 200 with admin B's token; `GET /api/ecommerce/orders/:id` 403, 403, 200; `GET /api/ecommerce/orders/count` with A's token 403; `POST /api/rbac/subjects-to-ecommerce-module-orders` without a token 403; `GET /api/rbac/subjects-to-ecommerce-module-orders` 403 with A's token, 200 with B's; `GET /api/billing/invoices` 403 without a token, 200 with B's; `GET /api/billing/payment-intents` with A's token 403; `POST /api/notification/topics/send-all` and `POST /api/file-storage/files/create-from-url` without a token 403; `openrouter/models` without a token 400, with B's token 401, with A's token and a profile A does not own 404; `GET /api/ecommerce/products`, `/api/ecommerce/orders-to-products`, `/api/blog/articles` 200. Fixtures: subjects A and B, B's admin role link and A's order, all removed by dropping the throwaway database.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 3 -->

### Incident 1 — Order variant specs fail to load through the package entry

- **Occurrences**: 1
- **Stage**: Phase 1 - Cart reads through the owner route
- **Symptom**: `This module cannot be imported from a Client Component module` when the new specs imported `@sps/ecommerce/models/order/frontend/component`.
- **Root Cause**: the package dispatcher imports every variant, and some server halves import `server-only`, which throws outside a React server build.
- **Fix**: `jest.mock("server-only", () => ({}), { virtual: true })`, as `libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/server.spec.tsx` does.
- **Reusable Pattern**: mock `server-only` in any jsdom spec that imports a component package entry or a variant `index.tsx`.

### Incident 2 — Lint failed on the formatting of two new specs

- **Occurrences**: 1
- **Stage**: Verification
- **Symptom**: `prettier/prettier` errors in the product cart spec and the order form field spec.
- **Root Cause**: the files were written by hand without running Prettier.
- **Fix**: `npx prettier --write` over every changed file, then lint again (passed).
- **Reusable Pattern**: run Prettier on new files before the lint target.

### Incident 3 — The issue-152 scenario lane cannot run in this environment

- **Occurrences**: 1
- **Stage**: Verification
- **Symptom**: the scenario preflight failed: `GET /api/http-cache/clear` answered 404 without `MIDDLEWARE_HTTP_CACHE=true` and 500 with it.
- **Root Cause**: the HTTP cache needs Redis, and the Redis on port 6384 rejects the password in this checkout's `apps/api/.env` (`WRONGPASS`).
- **Fix**: none in scope; the product cart path is covered by the unit specs and the HTTP run.
- **Reusable Pattern**: check `KV connection error` in the API log before relying on the scenario lane.

## Summary

### Changes Made

- Owner order list: caller filters inside the subject's orders; client query key with params; list variant params type.
- Order variants `cart-default` and `form-field-default` render the order they receive.
- Cart sheet, product cart and order list widget read orders through the owner route.
- 29 `roles-to-permissions` seed rows attach the Admin role (dumped from a copy of the development database).
- `roleless-permissions` list beside the permission seed, `findUnlistedRolelessPermissions()` and the narrowed boot report.
- `RequestProfileSubjectIdOwner` on `openrouter/models`.
- RBAC and permission READMEs.

### Commits

- `40d8282abe` fix(rbac): require the Admin role for order and billing reads
- `13167d7069` docs: add research, plan and process log for #303

### Pull Request

- [x] PR created: https://github.com/singlepagestartup/singlepagestartup/pull/346
- [x] PR number: 346

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-26T04:05:00+0300
