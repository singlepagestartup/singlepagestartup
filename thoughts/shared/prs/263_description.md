Closes #257

## Summary

`GET /api/rbac/subjects/:id/ecommerce-module/orders/:orderId/total` and the
matching `/quantity` route never returned a total or a quantity. Both handlers
were copies of the deanonymize handler, born byte-identical in `27d0a2475c` and
never implemented: they parsed a multipart body on a GET, so every request died
at the `data` check with `Validation error. Invalid body`.

Both handlers now compute. They mirror their aggregate siblings for a single
order: load the order, assert that the subject owns it, compute, answer.

## Changes

- New subject singlepage service
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/assert-subject-owns.ts`,
  exposed as `ecommerceModuleAssertSubjectOwnsOrder`. It looks the order up
  through the `subjectsToEcommerceModuleOrders` relation and throws
  `Permission error. Only order owner can read order`. Knowing that the caller
  is the subject named in the path is not the same as knowing that the order in
  the path is theirs, and both per-order routes need the second answer.
- The per-order total handler groups the order's totals by currency and answers
  the entry shape the aggregate route answers, holding the one order, with the
  `unpriced` lines #255 introduced beside it. The per-order quantity handler
  answers a number.
- The caller identity check moved off the handler bodies and onto the two route
  definitions as the existing `RequestSubjectIdOwner` middleware, which is what
  the rest of the controller does.
- Specs: 4 scenarios for the total route, 3 for the quantity route, 2 for the
  ownership service.

No deanonymize behaviour is lost. It stays reachable through
`POST /:id/ecommerce-module/orders/checkout` and
`POST /:id/ecommerce-module/products/:productId/checkout`, both spec-covered.
Nothing called the two broken paths: no SDK action, no OpenAPI entry, no
frontend component, no test.

## Verification

- [x] `npx nx run @sps/rbac:jest:test` — 76 suites, 330 tests
- [x] `npx nx run @sps/rbac:eslint:lint`
- [x] `npx tsc --noEmit -p libs/modules/rbac/tsconfig.json`
- [x] Manual verification against a running instance, below.

## How to verify it

Start this worktree's API with `API_SERVICE_PORT=4017
API_SERVICE_URL=http://localhost:4017`.

**Step 0 — grant the two routes.** No RBAC permission row covers either path
and the resolver is default-deny, so the middleware refuses them before the
handler runs. Create the two permissions once; a permission with no role links
is public, matching the aggregate routes.

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

Passing `X-RBAC-SECRET-KEY` on the reads instead also works, but it bypasses
`RequestSubjectIdOwner` and cannot show the permission-error case. Delete the
two rows afterwards to leave the local database as it was.

**Step 1 — a fresh anonymous subject and its JWT.**

```bash
A_JWT="$(curl -s "$API/api/rbac/subjects/authentication/init" | jq -r '.data.jwt')"
A_ID="$(curl -s "$API/api/rbac/subjects/authentication/me" \
  -H "Authorization: Bearer $A_JWT" | jq -r '.data.id')"
```

**Step 2 — a cart order holding a priced product.**

```bash
curl -s -X POST "$API/api/rbac/subjects/$A_ID/ecommerce-module/orders" \
  -H "Authorization: Bearer $A_JWT" \
  -F 'data={"productId":"e939ed88-22ba-4630-86e4-9743ad94338c","quantity":2,"storeId":"92aefa1f-247b-49a9-b1b9-c8029cc840dc"}'

ORDER_ID="$(curl -s "$API/api/rbac/subjects/$A_ID/ecommerce-module/orders" \
  -H "Authorization: Bearer $A_JWT" | jq -r '.data[0].id')"
```

**Step 3 — the two routes as the owner.** The total answers one currency entry
holding the order and an empty `unpriced` for a fully priced product; the
quantity answers `{ "data": 2 }`. Before this change both answered
`Validation error. Invalid body`.

```bash
curl -s "$API/api/rbac/subjects/$A_ID/ecommerce-module/orders/$ORDER_ID/total" \
  -H "Authorization: Bearer $A_JWT" | jq
curl -s "$API/api/rbac/subjects/$A_ID/ecommerce-module/orders/$ORDER_ID/quantity" \
  -H "Authorization: Bearer $A_JWT" | jq
```

**Step 4 — a second subject is refused.** Initialise another subject and call
its own path with the first subject's order id: both routes answer
`Permission error. Only order owner can read order` from the relation check.
Calling subject A's path with subject B's JWT is refused earlier, by
`RequestSubjectIdOwner`.

**Step 5 — an unknown order id** answers `Not Found error. No order found`.

**Step 6 — clean up.** `DELETE
/api/rbac/subjects/$A_ID/ecommerce-module/orders/$ORDER_ID` removes the order
and its lines. The two anonymous subjects are reclaimed by the anonymous-subject
cleanup.

## Downstream migration

Impact: required.

- Reason: two framework routes change from always failing to returning real
  data, their caller identity check moves from the handler body to route
  middleware, and they now refuse an order the subject has no relation row for.
- Applies to: projects that override either per-order handler, that copied the
  deanonymize body out of them, that documented a deanonymize-style request
  body for these two paths in an owned SDK action or OpenAPI spec, or that
  expect these paths to be callable.
- Replace any owned copy of the per-order total or quantity handler with the
  aggregate-mirroring shape, or delete the override and inherit it; a copy that
  still parses a multipart body on a GET cannot work.
- Correct any owned SDK action or OpenAPI path entry that describes a request
  body for these two GET paths. The total answers `data` plus `unpriced` and
  the quantity answers a number.
- Register an RBAC permission row for each path before calling either route,
  because the resolver is default-deny and no row ships for them.
- Make sure every order reachable through these paths has a
  `subjects-to-ecommerce-module-orders` row for its subject; the handlers refuse
  an order with no relation instead of trusting the JWT alone.
- Verify by calling both paths with the owner's JWT and expecting a total and a
  quantity, with another subject's JWT and expecting a permission error, and
  with an unknown order id and expecting a not-found error.

## Notes

- Base branch: `claude/issue-cart-unpriced-product` (#262, which closes #255).
  GitHub retargets this pull request to `main` when that one merges. The
  per-order total depends on the `{ totals, unpriced }` shape introduced there.
- Not done: neither path has an RBAC permission row, so both stay refused for
  an ordinary subject until one is granted. Registering them means editing
  repository permission snapshots, which the repository rules reserve for an
  explicit data-management flow; the gap is recorded in the research note and
  the plan and is the owner's decision.
- #258 (`claude/issue-cart-duplicate-guard`) branches from the same base and
  also adds a method to
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts`.
  The two conflict there on the second merge; keep both methods.
