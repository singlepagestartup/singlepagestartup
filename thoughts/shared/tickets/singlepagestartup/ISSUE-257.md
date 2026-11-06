---
repository: singlepagestartup
issue_number: 257
status: In Dev
created: 2026-09-19
---

# Issue: the per-order cart total and quantity routes are copies of the deanonymize handler

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/257
**Status**: In Dev
**Created**: 2026-09-19
**Priority**: medium
**Size**: small
**Type**: bug

---

## Problem to Solve

Two route handlers under the RBAC subject `singlepage` controller are copy-paste duplicates of the subject deanonymize handler. Neither computes a total or a quantity, and neither can reach its own body, because both are registered as `GET` routes and the copied body reads a multipart form field.

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/total.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/quantity.ts`

Both are registered in `.../controller/singlepage/index.ts`:

- `GET /:id/ecommerce-module/orders/:orderId/quantity`
- `GET /:id/ecommerce-module/orders/:orderId/total`

## What happens now

Each body calls `c.req.parseBody()`, requires a `data` field holding a JSON string with an `email`, checks that the order is in `new` status, calls `this.service.deanonymize({ id, email })` and answers `{ data: true }`.

A `GET` request carries no multipart body, so `parseBody()` returns an empty object and both handlers fail at `typeof body["data"] !== "string"` with `Validation error. Invalid body`. The two routes are therefore unreachable in every sense: they cannot return a total or a quantity, and they cannot deanonymize anything either.

Neither route carries the `RequestSubjectIdOwner` middleware that the rest of the per-subject routes in this controller use; each copied body re-parses the JWT itself.

## Expected behaviour

Mirror the aggregate siblings in the same folder, restricted to the single `:orderId`.

1. `GET /:id/ecommerce-module/orders/:orderId/total` answers `{ data: <totals>, unpriced: [...] }` with the same grouped entry shape the aggregate `/orders/total` route returns (`billingModuleCurrency`, `total`, `orders`), holding the one order. Since #255 `findByIdTotal` returns `{ totals, unpriced }`, and the unpriced lines are reported beside the data.
2. `GET /:id/ecommerce-module/orders/:orderId/quantity` answers `{ data: <number> }`, the quantity of that one order.
3. Both routes carry `RequestSubjectIdOwner` so the caller must be the subject in the path, and both handlers additionally check that the subject owns the order through `subjectsToEcommerceModuleOrders` before computing anything.
4. An unknown order is a not-found error; another subject's order is a permission error and no total or quantity is computed.

## Scope

Framework layer only: the `singlepage` variants and shared libs. `startup` variants are not touched. No schema change, no new dependency.

## Key Details

- Aggregates to mirror: `.../controller/singlepage/ecommerce-module/order/total.ts`, `.../order/quantity.ts`
- Ownership middleware: `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-is-owner/index.ts`
- Subject singlepage service: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts`
- The subject-to-order relation service is already injected as `service.subjectsToEcommerceModuleOrders`
- This branch builds on the #255 branch, which changed `findByIdTotal` to return `{ totals, unpriced }`

## Implementation Notes

- The "subject owns order" check is shared by both handlers, so it belongs in the subject `singlepage` service, next to the other ecommerce order services.
- Prefer the route middleware plus the relation check over re-parsing the JWT in each handler.
- Audit the subject SDK, the OpenAPI spec and the subject frontend for entries that document the wrong (deanonymize) contract for these two paths, and record whether the deanonymize behaviour is reachable through any other route.
