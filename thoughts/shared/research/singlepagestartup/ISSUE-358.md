---
date: 2026-09-26T08:35:00+0300
researcher: flakecode
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-358-order-line-quantity-bounds
repository: singlepagestartup
topic: "Subject order routes: bound line quantities"
tags: [research, codebase, rbac, ecommerce, orders-to-products, cart, validation]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Subject order routes: bound line quantities

**Date**: 2026-09-26
**Researcher**: flakecode
**Git Commit**: 78d7d43125
**Branch**: claude/issue-358-order-line-quantity-bounds
**Repository**: singlepagestartup

## Research Question

Where the subject cart routes and the cart form accept an order line quantity,
what they accept today, where a maximum could come from, and which lines the
open branches of #356 and #353 change in the same files.

## Summary

- Three subject routes write a line quantity from the request body: the cart
  order create route (`order/create.ts:305`, `data.quantity || 1`), the
  product checkout route (`product/id/checkout.ts:174`, the same expression)
  and the order update route (`order/id/update.ts`, which forwards
  `data.ordersToProducts` to the order update). None bounds the value.
- The relation insert schema (`drizzle-zod` 0.6.1 over an `integer` column)
  accepts 0 and -1 and refuses 1.5; on the create routes that refusal comes
  after the order and the subject-to-order row were written.
- The cart update form (`update-default`) checks `quantity: z.number()`; the
  number input submits numbers. The create and product checkout forms send a
  fixed quantity of 1 from a hidden field or a default value.
- The product model has no stock or limit field. Order constants live in the
  SDK models (`types`, `statuses` for the order; `variants` for the relation),
  and frontend forms already import values from SDK models.
- #356 changes `order/id/update.ts` at the `ordersToProducts` presence check,
  adds a mapping block after it, and changes the `data` passed to the order
  update; it appends scenarios to `update.spec.ts` and edits its suite header.
  #353 changes the route table and the subject README only.

## Detailed Findings

### Subject routes that write a line quantity

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.ts`:
  validates `data.productId` at `:56-58`, reads stores and prices, creates the
  order (`:276`), the subject-to-order row (`:289`) and the line with
  `quantity: data.quantity || 1` (`:301-311`). A quantity of 0 becomes 1; a
  negative value is stored; 1.5 fails at the relation create after the first
  two rows exist.
- `.../ecommerce-module/product/id/checkout.ts`: parses `data` (`:46-54`),
  creates the order, the subject-to-order row and the line with
  `quantity: data.quantity || 1` (`:170-179`), then checks out.
- `.../ecommerce-module/order/id/update.ts`: after the token and owner checks
  it requires `data.ordersToProducts` (`:58-60`), reads the subject and the
  order, requires status `new` (`:78-80`) and forwards `data` to
  `PATCH /api/ecommerce/orders/:id` with the operator secret (`:82-90`). The
  order update copies each submitted quantity into the matching line
  (`libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/update/index.ts:45-84`).
- Error messages of the sibling checks start with `Validation error.`, which
  `getHttpErrorType` maps to 400 (`libs/shared/backend/utils/src/lib/http-error/paterns/index.ts:76-81`).

### The relation and its descriptions

- `libs/modules/ecommerce/relations/orders-to-products/backend/repository/database/src/lib/schema.ts`:
  `quantity: pgCore.integer("quantity").notNull().default(1)`.
- `sdk/model/src/lib/ecommerce-orders-to-products.yaml`: `quantity` is
  `integer`/`int32` with the description `Quantity`, no minimum.
- `sdk/model/src/lib/ecommerce-orders-to-products-input.yaml`: a JSON string
  whose example carries `"quantity": 0`.
- `libs/modules/ecommerce/relations/orders-to-products/README.md:13`: the
  field list describes `quantity` without bounds.

### Where a maximum lives

- `libs/modules/ecommerce/models/product/backend/repository/database/src/lib/fields/singlepage.ts`:
  no stock, limit or maximum field.
- `libs/modules/ecommerce/models/order/sdk/model/src/lib/index.ts:18-31` holds
  the order's `variants`, `types` and `statuses`;
  `libs/modules/ecommerce/relations/orders-to-products/sdk/model/src/lib/index.ts:17`
  holds the relation's `variants`.
- Admin forms import `variants` and `insertSchema` from SDK models in client
  components (for example `@sps/agent/models/agent/sdk/model`).

### The cart forms

- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/update-default/ClientComponent.tsx:13-20`:
  `ordersToProducts: z.array(z.object({ id: z.string(), quantity: z.number() }))`;
  the relation `form-field-default` renders a number input
  (`libs/shared/ui/adapter/src/lib/input/index.tsx:112-133` converts the value
  to a number).
- `.../order/create-default/ClientComponent.tsx:20,36,71`: hidden field, value 1.
- `.../product/checkout-default/ClientComponent.tsx:40,58`: default 1, no input.
- `update-default/ClientComponent.spec.tsx` mocks `useForm` and `zodResolver`.

### Neighbouring branches

- `origin/claude/issue-355-order-update-fields` (#356): `order/id/update.ts`
  lines 58-69 (presence check and the new mapping block) and line 84 (`data`);
  `update.spec.ts` line 6 and scenarios appended after line 113.
- `origin/claude/issue-352-order-ownership-check` (#353): route table
  (`controller/singlepage/index.ts`), middleware package, subject README.

## Code References

- `.../ecommerce-module/order/create.ts:56-58,301-311` - productId check, line create
- `.../ecommerce-module/product/id/checkout.ts:46-54,170-179` - data parse, line create
- `.../ecommerce-module/order/id/update.ts:58-90` - lines check, order update
- `libs/modules/ecommerce/relations/orders-to-products/sdk/model/src/lib/index.ts:17` - relation constants
- `libs/modules/ecommerce/relations/orders-to-products/sdk/model/src/lib/ecommerce-orders-to-products.yaml` - model description

## Architecture Documentation

- Subject cart handlers validate the request body inline with
  `Validation error.` messages before calling services and SDKs.
- Model and relation constants shared by backend and frontend live in the SDK
  model packages.

## Historical Context (from thoughts/)

- The #355 records on its branch describe the order update payload change.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-349.md` (branch of #354): the cart lines route.

## Open Questions

None.
