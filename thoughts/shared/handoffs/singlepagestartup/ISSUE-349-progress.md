---
issue_number: 349
issue_title: "Read cart lines through the subject owner route"
start_date: 2026-09-26T00:50:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-349.md
status: complete
completed_date: 2026-09-26
---

# Implementation Progress: ISSUE-349 - Read cart lines through the subject owner route

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-349.md`

## Phase Progress

### Phase 1: Owner route for the subject's order lines

- [x] Started: 2026-09-26T03:50+0300
- [x] Completed: 2026-09-26T04:15+0300
- [x] Automated verification: service spec 5/5; route-table spec 7/7 (three new scenarios: no token 400, another subject 401, owner 200); SDK specs 2/2 (`orders-to-products.spec.ts`, `cache.spec.ts` extended). Mutation checks: without `RequestSubjectIdOwner` the two refusal scenarios fail; without the constraint to the subject's orders the two constraint scenarios of the service spec fail. `tsc --noEmit -p libs/modules/rbac/tsconfig.json`: 0 errors.

**Notes**: route `GET /api/rbac/subjects/:id/ecommerce-module/orders/orders-to-products`; handler `controller/singlepage/ecommerce-module/order/orders-to-products.ts`; service `service/singlepage/ecommerce/order/orders-to-products.ts` (main method `ecommerceOrderOrdersToProducts`); SDK action `ecommerceModuleOrderOrdersToProducts` in both SDKs; `paths.yaml` and `apps/openapi/openapi.yaml`. The service keeps a line whose totals cannot be computed with an empty list (incident 3).

### Phase 2: Cart components read lines through the owner route

- [x] Started: 2026-09-26T04:15+0300
- [x] Completed: 2026-09-26T04:55+0300
- [x] Automated verification: `@sps/rbac` 87 suites / 402 tests, `@sps/ecommerce` 19 / 35, `@sps/host` 10 / 19. Mutation checks against the base versions: cart sheet 3 of 3 scenarios fail, product cart 2 of 3, update action 1 of 1, delete action 1 of 1, order `cart-default` 2 of 2, host order widget 1 of 2, relation `form-field-default` 1 of 1, relation `amount` 1 of 1, quantity variant 1 of 1 (the scenarios that still pass are the empty-cart and no-subject cases, which hold for both versions).

**Notes**: new subject variant `ecommerce-module-order-list-orders-to-products-default`; the order variants `cart-default` and `orders-to-products-quantity-default` take `ordersToProducts`; the relation `form-field-default` binds the line it is handed (fetching halves removed) and `amount` computes from the line it is handed; the cart sheet and the host widget read each order's lines and pass them; the update and delete actions read the order's lines with the same params, so the query is shared; the product cart reads the subject's lines of the product once.

### Phase 3: Seed rows and reviewed list

- [x] Started: 2026-09-26T06:21+0300
- [x] Completed: 2026-09-26T06:26+0300
- [x] Automated verification: `is-authorized.spec.ts` 12/12 with a new scenario naming the four order line reads when their attachments are missing. Mutation checks: moving the four new relation files out makes the seed scenario name exactly the four rows; removing the new route from the reviewed list makes it name that row.

**Notes**: `sps-lite-issue-349` was a `pg_dump` copy of the development database (475 permissions with the snapshot id set, 14 roles, 155 attachments, i.e. without the 29 #303 attachments). The API from this worktree ran on port 4349 against it. Before the change the new route answered 403 to an anonymous caller (no permission row) and `GET /api/ecommerce/orders-to-products` answered 200. `POST /api/rbac/permissions` (201) created `8a1ff60e-...` for the route; four `POST /api/rbac/roles-to-permissions` (201) bound the Admin role to the four order line reads. `npx nx run api:db:dump` deleted the 29 #303 attachment files (absent from the copy) and wrote the five new files, with no other drift; the 29 files were restored with `git checkout`.

### Phase 4: End-to-end verification over HTTP

- [x] Started: 2026-09-26T06:27+0300
- [x] Completed: 2026-09-26T06:45+0300
- [x] Automated verification: script in the session scratchpad, output below.

**Notes**: against the same copy with this branch's API, three `init` subjects A, B (Admin role attached through `POST /api/rbac/subjects-to-roles`, 201) and C:

- A adds two products (`POST .../ecommerce-module/orders` 200, 200); A's orders 200 (2).
- A's lines through the new route 200: 2 lines, keys `className,createdAt,id,orderId,orderIndex,productId,quantity,total,updatedAt,variant`; the complete product has 2 total entries (`billingModuleCurrency,total`), the product with a price attribute without currency has none.
- Filters: A's own order 200 (1 line), an order A does not own 200 (0 lines), product 2 200 (1 line).
- A's route without a token 400, with C's token 401, with admin B's token 401.
- `GET /api/ecommerce/orders-to-products`, `/count`, `/:id`, `/:id/total`: 403 without a token, 403 with A's token, 200 with B's token.
- `PATCH .../orders/:order1` quantity 3: 200; the line reads quantity 3 and total 3.
- `DELETE .../orders/:order2`: 200; the lines drop to 1, product 2's line gone.
- `POST .../orders/checkout` with the dummy provider: 200, one invoice with a payment URL. The API was stopped with SIGKILL immediately after, before the provider's delayed paid webhook (the log shows no webhook call), so no order processing, notification or receipt generation ran.
- Cleanup: the throwaway database dropped, `apps/api/.env` restored byte for byte, scratch files with env values or tokens deleted.

## Verification

- Unit lanes (`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run-many --target=jest:test --projects=@sps/rbac,@sps/ecommerce,@sps/host --skip-nx-cache`), final run: `@sps/rbac` 87 suites / 404 tests, `@sps/ecommerce` 19 / 35, `@sps/host` 10 / 19, all passed (base: 84/391, 16/31, 10/19). `npx nx run api:jest:test`: 2 suites / 4 tests passed.
- Lint (`NODE_OPTIONS=--max-old-space-size=12288 npx nx run-many --target=eslint:lint --projects=@sps/rbac,@sps/ecommerce,@sps/host`): passed, no warnings.
- Types (`npx tsc --noEmit -p libs/modules/{rbac,ecommerce,host}/tsconfig.json`): 0 errors each.
- `node tools/agents/code-placement.mjs`: no same-name file and folder pairs.
- The Next.js host was not built or started: it does not start on the symlinked `node_modules` of this worktree.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 4 -->

### Incident 1 — Prettier received the file list as one argument

- **Occurrences**: 1
- **Stage**: Phase 2 - Cart components read lines through the owner route
- **Symptom**: `npx prettier --write $FILES` failed with `ENAMETOOLONG` and formatted nothing.
- **Root Cause**: zsh does not split an unquoted variable into words.
- **Fix**: wrote the list to a file and ran `xargs npx prettier --write < list`.
- **Reusable Pattern**: pass file lists through `xargs` (or `${=VAR}` in zsh).

### Incident 2 — The HTTP proof script split its JSON bodies

- **Occurrences**: 2
- **Stage**: Phase 4 - End-to-end verification over HTTP
- **Symptom**: add to cart answered 500 (`JSON Parse error`) and each POST line printed twice; the first run also had empty tokens.
- **Root Cause**: an inline JSON body inside `$( ... )` within a double-quoted `echo` was split at the comma into two calls; the token parser was not fed the saved response.
- **Fix**: built every body with `printf` into a variable, called the request function outside `echo`, and read the saved body with `<`.
- **Reusable Pattern**: never inline JSON with commas in a command substitution inside a quoted string; assign first.

### Incident 3 — A line total failure failed the whole line response

- **Occurrences**: 1
- **Stage**: Phase 4 - End-to-end verification over HTTP
- **Symptom**: the new route answered 500 ("Product does not have any target price attributes") as soon as the cart held a product with a price attribute without a currency link.
- **Root Cause**: `ordersToProducts.getTotal` throws on incomplete catalog prices, and the service computed totals for every line inside one response; before this change such a line only lost its totals card, while the update, delete and product-cart reads kept working.
- **Fix**: the service keeps the line with an empty total list and logs the failure (`logger.error`, as `record-activity.ts` does); a new service scenario covers it; `paths.yaml` and the subject README document the empty list.
- **Reusable Pattern**: exercise owner routes against a copy of real data; catalog data is not guaranteed complete.

### Incident 4 — The Bun API ignored SIGTERM

- **Occurrences**: 1
- **Stage**: Phase 4 - End-to-end verification over HTTP
- **Symptom**: after `kill <pid>` the API on port 4349 kept listening.
- **Root Cause**: `bun run --watch server.ts` does not exit on SIGTERM.
- **Fix**: SIGKILL on the server and its parent, then a port check; this is what makes stopping the API before the dummy provider's delayed webhook reliable.
- **Reusable Pattern**: stop a watched Bun API with SIGKILL and confirm the port is closed.

## Summary

### Changes Made

- Owner route, service and SDK actions for the lines of the subject's orders, with totals.
- Subject list variant; cart sheet, update and delete actions, product cart and host order widget read lines through it.
- Order variants `cart-default` and `orders-to-products-quantity-default` take the lines; relation `form-field-default` and `amount` use the line they are handed.
- Seed: one role-less permission row for the route, four Admin attachments for the order line reads; reviewed list updated.
- READMEs of the subject model, the order model and the relation.

### Commits

- `69e41092d8` fix(rbac): read cart lines through the subject owner route
- `89d0a7c1cc` docs: add research, plan and process log for #349

### Pull Request

- [x] PR created: https://github.com/singlepagestartup/singlepagestartup/pull/354 (base `claude/issue-303-roleless-permissions`, PR #346)
- [x] PR number: 354

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-26T07:10:00+0300
