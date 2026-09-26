---
issue_number: 355
issue_title: "Subject order update: forward only the order lines"
start_date: 2026-09-26T03:57:03Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-355.md
status: in_progress
---

# Implementation Progress: ISSUE-355 - Subject order update: forward only the order lines

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-355.md`

## Phase Progress

### Phase 1: Order lines payload

- [x] Started: 2026-09-26T03:57Z
- [x] Completed: 2026-09-26T03:59:57Z
- [x] Automated verification: `update.spec.ts` 5/5 (three new scenarios). Mutation check: with the `main` handler the three new scenarios fail; source restored.

**Notes**: the handler maps `data.ordersToProducts` to `{ id, quantity }` lines and sends `data: { ordersToProducts }`; the presence check became `Array.isArray` with the same message, since a non-array would otherwise fail in `map` with a 500. The edits sit below the import block and the token verification line that PR #339 changes, and the new scenarios sit at the end of the spec, away from the mock line PR #339 adds. The sibling cart handlers need no change.

### Verification

- Unit lane (`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/rbac:jest:test --skip-nx-cache`): 82 suites / 383 tests passed.
- Lint (`NODE_OPTIONS=--max-old-space-size=12288 npx nx run @sps/rbac:eslint:lint --skip-nx-cache`): passed, no warnings.
- Types (`npx tsc --noEmit -p libs/modules/rbac/tsconfig.json`): 0 errors.
- Placement (`node tools/agents/code-placement.mjs`): no same-name file and folder pairs.
- HTTP before and after the change: API from this worktree on port 4355 against `sps-lite-issue-355`, a `pg_dump` copy of the development database (351 tables, restore without errors), with the host URLs on a closed port and the Telegram, bug-report and SES credentials blanked. Each run creates anonymous subject A with two cart orders of `pro`, and subject C linked to the Admin role through `POST /api/rbac/subjects-to-roles` with the operator secret.
  - After the change: A's quantity change through the subject route answers 200 and sets the line to 2; the same request with `status`, `type` and `comment` in `data` answers 200, sets the line to 3 and leaves the order `new` / `cart` without a comment; the cart quantity read answers 4.
  - `PATCH /api/ecommerce/orders/:id`: A's token 403; C's admin token 200, writing `status`, `comment` and `receipt`, as before the change.
  - Before the change the same requests answered with the same statuses; the order fields in `data` reached the module-level update.
  - The only errors logged during the post-change run are the expected 403 for A's token on the module-level route.
- Cleanup: API stopped, `sps-lite-issue-355` dropped, scratch files holding tokens removed. The development database was only read by `pg_dump`.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 0 -->

## Summary

### Changes Made

- `order/id/update.ts` sends the module-level order update only the order lines, each as `id` and `quantity`; `ordersToProducts` must be a list.
- `order/id/update.spec.ts`: three new scenarios.

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [ ] All phases completed
- [ ] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-26T03:59:57Z
