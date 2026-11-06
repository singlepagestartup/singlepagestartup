---
issue_number: 257
issue_title: "fix(rbac): make the per-order cart total and quantity routes compute"
start_date: 2026-09-19T16:40:00Z
completed_date: 2026-09-19T17:10:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-257.md
status: complete
---

# Implementation Progress: ISSUE-257 - the per-order cart total and quantity routes are copies of the deanonymize handler

**Started**: 2026-09-19
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-257.md`

## Phase Progress

### Phase 1: A shared "subject owns this order" service

- [x] Started: 2026-09-19T16:40:00Z
- [x] Completed: 2026-09-19T16:45:00Z
- [x] Automated verification: PASSED

**Notes**: `assert-subject-owns.ts` holds the relation lookup and exports `SUBJECT_DOES_NOT_OWN_ORDER_ERROR`, following `resolve-currency.ts`. Wired as `ecommerceModuleAssertSubjectOwnsOrder` on the singlepage service, next to `ecommerceModuleResolveOrderCurrency`.

### Phase 2: Real handlers for the two routes

- [x] Started: 2026-09-19T16:45:00Z
- [x] Completed: 2026-09-19T16:55:00Z
- [x] Automated verification: PASSED

**Notes**: Both handlers now read the order, assert ownership, compute, answer. `RequestSubjectIdOwner` moved onto the two route definitions, so the handlers no longer parse the JWT themselves and no longer import `@sps/shared-utils` or `hono/jwt`.

### Phase 3: Specs

- [x] Started: 2026-09-19T16:55:00Z
- [x] Completed: 2026-09-19T17:05:00Z
- [x] Automated verification: PASSED

**Notes**: 3 new spec files, 9 new scenarios. The handler specs hand the handler a service double; the service spec drives the real relation lookup.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 2 -->

### Incident 1 — Project status update fails right after issue creation

- **Occurrences**: 1
- **Stage**: Create
- **Symptom**: `create_issue_with_project.sh` printed `Added issue #257 to project #2 via gh project item-add` and then `Error: Issue #257 ... not found in GitHub Project #2`, exiting non-zero although the issue and the project item both existed.
- **Root Cause**: `update_issue_status.sh` reads the project item list immediately after `item-add`; the GitHub Projects API had not yet indexed the new item. Identical to Incident 1 on #255.
- **Fix**: Left the status alone and folded the retry into the single "In Dev" status call the budget allows, made minutes later. It succeeded.
- **Reusable Pattern**: Treat the create helper's status step as best-effort. When it fails with "not found in GitHub Project", do not re-run the create helper — that would open a duplicate issue. Set the status in the next scheduled status call instead.

### Incident 2 — Prettier rejects hand-written spec formatting

- **Occurrences**: 1
- **Stage**: Phase 3 - Specs
- **Symptom**: `npx nx run @sps/rbac:eslint:lint` failed with 3 `prettier/prettier` errors in the new spec files, all about line wrapping the formatter would collapse or expand.
- **Root Cause**: The specs were written by hand and never passed through the repository formatter.
- **Fix**: `npx prettier --write` on the changed files, then the lint target passed.
- **Reusable Pattern**: Run prettier over new files before the lint target; the eslint run only reports the diff, it does not apply it.

## Summary

### Changes Made

Code:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/assert-subject-owns.ts` — new. Asserts that a subject owns an ecommerce order through the `subjectsToEcommerceModuleOrders` relation, and exports the permission error message.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts` — imports the new service and exposes `ecommerceModuleAssertSubjectOwnsOrder`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/total.ts` — rewritten. Loads the order, asserts ownership, calls `findByIdTotal` for that order, groups its totals by currency, answers `{ data, unpriced }`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/quantity.ts` — rewritten. Same first three steps, then `findByIdQuantity` and `{ data: <number> }`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts` — `RequestSubjectIdOwner` added to the two per-order route definitions.

Specs:

- `.../controller/singlepage/ecommerce-module/order/id/total.spec.ts` — new, 4 scenarios.
- `.../controller/singlepage/ecommerce-module/order/id/quantity.spec.ts` — new, 3 scenarios.
- `.../service/singlepage/ecommerce/order/assert-subject-owns.spec.ts` — new, 2 scenarios.

Pipeline artifacts:

- `thoughts/shared/tickets/singlepagestartup/ISSUE-257.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-257.md`
- `thoughts/shared/plans/singlepagestartup/ISSUE-257.md`
- `thoughts/shared/processes/singlepagestartup/ISSUE-257.md`
- `thoughts/shared/handoffs/singlepagestartup/ISSUE-257-progress.md`

### Verification

| Command                                               | Result                          |
| ----------------------------------------------------- | ------------------------------- |
| `npx nx run @sps/rbac:jest:test`                      | PASSED — 76 suites, 330 tests   |
| `npx nx run @sps/rbac:eslint:lint`                    | PASSED — all files pass linting |
| `npx tsc --noEmit -p libs/modules/rbac/tsconfig.json` | PASSED — no output, exit 0      |

### Manual verification recipe for the lead

Start this worktree's API with `API_SERVICE_PORT=4017 API_SERVICE_URL=http://localhost:4017`.

**Step 0 — grant the two routes.** No RBAC permission row covers either path, and the resolver is default-deny, so the middleware refuses them before the handler runs. Create the two public permissions once (a permission with no role links is public):

```bash
API=http://localhost:4017
SECRET="$(grep -E '^RBAC_SECRET_KEY=' apps/api/.env | cut -d= -f2-)"

for P in total quantity; do
  curl -s -X POST "$API/api/rbac/permissions" \
    -H "X-RBAC-SECRET-KEY: $SECRET" \
    -F "data={\"variant\":\"default\",\"type\":\"HTTP\",\"method\":\"GET\",\"path\":\"/api/rbac/subjects/[rbac.subjects.id]/ecommerce-module/orders/[ecommerce.orders.id]/$P\"}"
  echo
done
```

Delete those two permission rows afterwards if the local database should stay as it was. Passing `X-RBAC-SECRET-KEY` on the reads instead also works, but it bypasses `RequestSubjectIdOwner`, so it cannot show the permission-error case.

**Step 1 — a fresh anonymous subject and its JWT.**

```bash
A_JWT="$(curl -s "$API/api/rbac/subjects/authentication/init" | jq -r '.data.jwt')"
A_ID="$(curl -s "$API/api/rbac/subjects/authentication/me" \
  -H "Authorization: Bearer $A_JWT" | jq -r '.data.id')"
echo "subject A: $A_ID"
```

**Step 2 — a cart order for that subject with a priced product.**

```bash
curl -s -X POST "$API/api/rbac/subjects/$A_ID/ecommerce-module/orders" \
  -H "Authorization: Bearer $A_JWT" \
  -F 'data={"productId":"e939ed88-22ba-4630-86e4-9743ad94338c","quantity":2,"storeId":"92aefa1f-247b-49a9-b1b9-c8029cc840dc"}'

ORDER_ID="$(curl -s "$API/api/rbac/subjects/$A_ID/ecommerce-module/orders" \
  -H "Authorization: Bearer $A_JWT" | jq -r '.data[0].id')"
echo "order: $ORDER_ID"
```

**Step 3 — the two routes as the owner.**

```bash
curl -s "$API/api/rbac/subjects/$A_ID/ecommerce-module/orders/$ORDER_ID/total" \
  -H "Authorization: Bearer $A_JWT" | jq
```

Expect one currency entry holding the order, and an empty `unpriced` for a fully priced product:

```json
{
  "data": [
    {
      "billingModuleCurrency": { "id": "…", "name": "…" },
      "total": 2000,
      "orders": [{ "id": "…", "type": "cart", "status": "new", "total": [ … ] }]
    }
  ],
  "unpriced": []
}
```

```bash
curl -s "$API/api/rbac/subjects/$A_ID/ecommerce-module/orders/$ORDER_ID/quantity" \
  -H "Authorization: Bearer $A_JWT" | jq
```

Expect `{ "data": 2 }`.

Before this change both calls answered `Validation error. Invalid body`.

**Step 4 — a second subject is refused.**

```bash
B_JWT="$(curl -s "$API/api/rbac/subjects/authentication/init" | jq -r '.data.jwt')"
B_ID="$(curl -s "$API/api/rbac/subjects/authentication/me" \
  -H "Authorization: Bearer $B_JWT" | jq -r '.data.id')"

curl -s "$API/api/rbac/subjects/$B_ID/ecommerce-module/orders/$ORDER_ID/total" \
  -H "Authorization: Bearer $B_JWT" | jq
curl -s "$API/api/rbac/subjects/$B_ID/ecommerce-module/orders/$ORDER_ID/quantity" \
  -H "Authorization: Bearer $B_JWT" | jq
```

Expect `Permission error. Only order owner can read order` on both, from the handler's relation check. Calling subject A's path with subject B's JWT instead is refused earlier, by `RequestSubjectIdOwner`.

**Step 5 — an unknown order.**

```bash
curl -s "$API/api/rbac/subjects/$A_ID/ecommerce-module/orders/00000000-0000-0000-0000-000000000000/total" \
  -H "Authorization: Bearer $A_JWT" | jq
```

Expect `Not Found error. No order found`.

**Step 6 — clean up.**

```bash
curl -s -X DELETE "$API/api/rbac/subjects/$A_ID/ecommerce-module/orders/$ORDER_ID" \
  -H "Authorization: Bearer $A_JWT" | jq
```

This removes the order lines and the order. The two anonymous subjects are left behind; the anonymous-subject cleanup reclaims them.

### Pull Request

- [ ] PR created: not requested for this issue — the lead verifies against a running instance first
- [ ] PR number: —

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-19T17:10:00Z
