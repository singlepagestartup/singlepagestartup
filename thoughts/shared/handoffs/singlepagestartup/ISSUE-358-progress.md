---
issue_number: 358
issue_title: "Subject order routes: bound line quantities"
start_date: 2026-09-26T05:40:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-358.md
status: in_progress
---

# Implementation Progress: ISSUE-358 - Subject order routes: bound line quantities

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-358.md`

## Phase Progress

### Phase 1: Bounds on the routes, the form and the descriptions

- [x] Started: 2026-09-26T08:55+0300
- [x] Completed: 2026-09-26T09:30+0300
- [x] Automated verification: `create.spec.ts` 7/7 (new), `update.spec.ts` 6/6 (four new scenarios between the existing tests), `product/id/checkout.spec.ts` 6/6 (four new), `update-default/ClientComponent.spec.tsx` 5/5 (rewritten on the real form and zod resolver). Mutation checks against the base versions: create 5 of 7 scenarios fail, update 4 of 6, product checkout 4 of 6, form 4 of 5; the scenarios that still pass are the valid, absent-quantity and ownership cases.

**Notes**: `quantityBounds = { min: 1, max: 1000 }` beside the relation's `variants` in its SDK model; inline checks in `order/create.ts` and `product/id/checkout.ts` after the body parse (before any read or write) and in `order/id/update.ts` after the status check (before the order update); `z.number().int().min().max()` in the update form; `minimum: 1` and a description on the relation model's `quantity`, the input example uses 1, README field line.

## Verification

- Unit lanes (`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run-many --target=jest:test --projects=@sps/rbac,@sps/ecommerce --skip-nx-cache`): `@sps/rbac` 83 suites / 399 tests, `@sps/ecommerce` 14 / 29, all passed.
- Lint (`NODE_OPTIONS=--max-old-space-size=12288 npx nx run-many --target=eslint:lint --projects=@sps/rbac,@sps/ecommerce`): passed.
- Types (`npx tsc --noEmit -p libs/modules/{rbac,ecommerce}/tsconfig.json`): 0 errors each.
- `node tools/agents/code-placement.mjs`: clean.
- HTTP on port 4358 against `sps-lite-issue-358` (a `pg_dump` copy of the development database), with a new `init` subject and a product priced 1000 in one currency and 1 in another:
  - create with quantity 0, -1, 1.5: 400 (`Validation error. data.quantity must be a whole number from 1 to 1000`), no order created;
  - create with quantity 2: 200; cart totals 2000 and 2; stored line quantity 2;
  - update to 0, -1, 1.5: 400 (`Validation error. ordersToProducts[].quantity must be ...`), stored quantity stays 2;
  - update to 3: 200; stored quantity 3; cart totals 3000 and 3;
  - product checkout with quantity 0, -1, 1.5: 400, no order created.
  - Cleanup: API stopped, the throwaway database dropped, `apps/api/.env` restored byte for byte.
- `git merge-tree --write-tree` of this branch with `origin/claude/issue-355-order-update-fields` (#356) and with `origin/claude/issue-352-order-ownership-check` (#353): no conflicts; all three together: no conflicts. In the merged `update.ts` the quantity check runs after #356's mapping and checks the same values it forwards.
- The Next.js host was not built or started: it does not start on the symlinked `node_modules` of this worktree.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 0 -->

## Summary

### Changes Made

- `quantityBounds` in the relation SDK model.
- Quantity checks on the subject create, product checkout and update routes.
- Bounds in the cart update form.
- Relation model and input descriptions, README.

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-26T09:35:00+0300
