---
date: 2026-09-26T03:56:00Z
researcher: flakecode
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-355-order-update-fields
repository: singlepagestartup
topic: "Subject order update: forward only the order lines"
tags: [research, codebase, rbac, subject, ecommerce, order, payload]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Subject order update: forward only the order lines

**Date**: 2026-09-26T03:56:00Z
**Researcher**: flakecode
**Git Commit**: 78d7d43125
**Branch**: claude/issue-355-order-update-fields
**Repository**: singlepagestartup

## Research Question

What does `PATCH /api/rbac/subjects/:id/ecommerce-module/orders/:orderId` forward to the module-level order update, which parts of that payload the cart sends and the module-level handler consumes, and which sibling cart handlers forward caller data to a module-level write in the same way?

## Summary

- The subject handler parses `data` from the body, requires `data.ordersToProducts`, checks the order is `new`, and sends the whole parsed `data` to `ecommerceOrderApi.update` with the operator secret (`controller/singlepage/ecommerce-module/order/id/update.ts:50-90`).
- The module-level handler writes every field it receives through `this.service.update({ id, data })` and then, when `data.ordersToProducts` is present, updates the `quantity` of each listed line that belongs to the order, matched by line `id` (`ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/update/index.ts:43-86`).
- The cart sends exactly `{ ordersToProducts: [{ id, quantity }] }`: the `update-default` form schema declares those two fields and `zodResolver` drops any other (`frontend/component/src/lib/singlepage/ecommerce-module/order/update-default/ClientComponent.tsx:13-20`).
- No sibling cart handler forwards the parsed body to a module-level write: `order/create.ts` reads `productId`, `storeId`, `billingModule.currency.id` and `quantity` into records it builds itself; the per-order quantity and total handlers pass only `data.email` to `deanonymize`; the cart list, quantity and total handlers parse no body.
- On `main` over HTTP, order fields sent in `data` beside the lines reached the module-level update; the admin panel's module-level update with an admin token wrote every field, and the same route refused a customer token with 403.

## Detailed Findings

### Subject order update

`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/update.ts`:

- `:38-48` token and owner check; PR #339 rewrites the verification line (`:44`) and the imports.
- `:50-56` parse `body.data`; `:58-60` require a truthy `data.ordersToProducts`.
- `:62-80` subject lookup, order lookup and the `new` status check.
- `:82-90` `ecommerceOrderApi.update({ id: orderId, data, options: { headers: { "X-RBAC-SECRET-KEY": … } } })`.
- `:92-96` answer the subject row.
- The order SDK's `update` takes `data: any` (`libs/shared/frontend/api/src/lib/actions/update/index.ts:9-20`).

### Module-level order update

`libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/update/index.ts`:

- `:43` `this.service.update({ id: uuid, data })`; the order service inherits `update` from `CRUDService`.
- `:45-86` with `data.ordersToProducts`: reads the order's lines, and for each listed `orderToProduct` whose `id` matches a line of this order calls `ordersToProductsUpdate` with the existing line and `quantity: orderToProduct.quantity`; then answers.
- The order columns are `status`, `type`, `receipt` and `comment` besides the timestamps (`repository/database/src/lib/fields/singlepage.ts:8-11`); a line's `quantity` is an integer (`relations/orders-to-products/backend/repository/database/src/lib/schema.ts:16`).
- The route has no permission row of its own; the root permission `* *` carries one role, so a customer token is refused and an admin token passes.

### Sibling cart handlers

`controller/singlepage/ecommerce-module/order/`:

- `create.ts:44-356`: builds the order with `data: {}`, the subject link, a line with `quantity: data.quantity || 1`, the store link and the currency link; `data` appears again only in the response.
- `id/quantity.ts` and `id/total.ts`: `:69-72` `deanonymize({ id, email: data["email"] })`.
- `list.ts`, `quantity.ts`, `total.ts`, `id/delete.ts`: no body.
- `checkout.ts` (PR #350) patches only `comment` into the orders it finds.

### Cart caller

- `update-default/ClientComponent.tsx:13-38`: form schema `ordersToProducts: z.array(z.object({ id: z.string(), quantity: z.number() }))`, submitted through `api.ecommerceModuleOrderUpdate` with `props.data.id` and `props.order.id`.
- Server SDK action `sdk/server/src/lib/singlepage/ecommerce-module/order/id/update.ts` forwards `data` as the multipart `data` field.

### Baseline over HTTP

API from this worktree on port 4355 against `sps-lite-issue-355`, a `pg_dump` copy of the development database, before any change. Anonymous subject A with two cart orders of `pro`; subject C linked to the Admin role through `POST /api/rbac/subjects-to-roles` with the operator secret.

- A's quantity change through the subject route: 200, line quantity 2.
- The same request with `status`, `type` and `comment` beside the lines: 200; those fields reached the module-level update with the lines.
- `PATCH /api/ecommerce/orders/:id`: A's token 403; C's admin token 200, with `status`, `comment` and `receipt` written.

## Code References

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/update.ts:58-90` - the check and the forwarded payload.
- `libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/update/index.ts:43-86` - what the module-level update writes and reads.
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/update-default/ClientComponent.tsx:13-20` - the cart's payload shape.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.ts:276-351` - records built from picked fields.

## Architecture Documentation

- Subject cart handlers act for the customer and call module-level routes with the operator secret, so the module-level route applies no customer-level rule; the subject handler decides which fields reach it.

## Historical Context (from thoughts/)

- PR #353 (issue #352) documents the four per-order routes and the cart callers of the update route in `thoughts/shared/research/singlepagestartup/ISSUE-352.md` on its branch; it adds route middleware only and leaves this handler unchanged.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-352.md` (on the PR #353 branch)

## Open Questions

- None. Line quantities are not bounded by the subject route; that is outside this change.
