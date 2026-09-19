---
date: 2026-09-19T16:40:00Z
issue_number: 258
repository: singlepagestartup
topic: "The add-to-cart duplicate guard never fires"
status: complete
---

# Research: ISSUE-258 — the add-to-cart duplicate guard compares a subject id against a store id

## Question

Why can the same product be added to the cart twice, when the add-to-cart handler carries a guard against exactly that? And does the guard need a store dimension at all?

## Summary

The guard walks five lookups and the fourth one compares a subject id against a store id. Ids of two different tables never match, so the lookup is always empty, the fifth never runs and the throw is unreachable. Removing the store hop is not only safe but required: every cart read path in the repository keys the cart on `(subjectId, type: "cart", status: "new")` and none of them mentions a store, so a store-scoped guard would let one product appear twice in the single badge, single total and single order list the UI renders.

## The defect

`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.ts`

- `:30` — `const id = c.req.param("id")`. This is the RBAC subject id; `:52` asserts it equals the token's subject.
- `:62-78` — `storeId` is resolved from `data.storeId` or from the single store, and is the value written into the `stores-to-orders` row at `:259-269`.
- `:98-111` — `orders-to-products` filtered by `productId` only. No order-id narrowing, so this returns every cart in the system holding that product.
- `:113-126` — `subjects-to-ecommerce-module-orders` filtered by `subjectId`.
- `:143-162` — `orders` with `id inArray <intersection>` and `status: "new"`. `type` is not checked, unlike every read path.
- `:165-185` — `stores-to-orders` filtered by `{ column: "storeId", method: "eq", value: id }`. `id` is the subject id, not `storeId`. Always empty.
- `:188-206` — `orders-to-billing-module-currencies`, never reached.
- `:209` — `throw new Error("Internal error. Order already exists")`, unreachable.

The store lookup and the currency lookup are both dead weight: the currency hop only narrowed the set further, and nothing about the currency of an existing order bears on whether the product is already in the cart.

## Decision: the store dimension does not belong in this guard

A subject cannot hold the same product in two open carts for two different stores in any sense the product exposes, because nothing that reads a cart partitions it by store.

### Every cart read uses the same three-predicate key

| Path                                                                                                 | Filter                                                                                                                  | Store predicate                                                                           |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `controller/singlepage/ecommerce-module/order/list.ts:77-89`                                         | `id inArray <subject's orders>`, `type eq cart`, `status eq new`                                                        | none                                                                                      |
| `.../order/total.ts:69-95`                                                                           | same triple; `:117-151` then sums `findByIdTotal` across all of them into one currency-keyed map                        | none                                                                                      |
| `.../order/quantity.ts:64-107`                                                                       | same triple; `:106` accumulates the badge number across all open carts                                                  | none                                                                                      |
| `.../order/checkout.ts`                                                                              | trusts the order ids in the request body (`:58-100`)                                                                    | none                                                                                      |
| `.../order/id/{total,quantity,update,delete}.ts`                                                     | order id from the route plus `status !== "new"`                                                                         | none                                                                                      |
| frontend `.../subject/frontend/.../ecommerce-module/product/cart-default/ClientComponent.tsx:42-155` | same triple, intersected with `orders-to-products` by `productId` alone (`:100-104`), then renders every match (`:157`) | receives `props.store` but forwards it only to `OrderCreateDefault` (`:36, 87, 128, 152`) |
| frontend `.../ecommerce-module/order/list/quantity-default/client.tsx:8-11`                          | calls the store-blind quantity route                                                                                    | none                                                                                      |

The GET route itself takes no store input: `controller/singlepage/index.ts:295-299` registers `/:id/ecommerce-module/orders` and the handler reads only `c.req.param("id")` — the server SDK stringifies `params` into the query (`sdk/server/.../order/list.ts:26-28, 44-47`), but the controller never reads the query string.

### The data model has no store on an order

`libs/modules/ecommerce/models/order/backend/repository/database/src/lib/fields/singlepage.ts:4-11` is `id, createdAt, updatedAt, variant, status, type, receipt, comment`. Store membership exists only as a `stores-to-orders` relation row that no cart read ever joins.

### Multi-store is anticipated, never exercised

- One store seed: `libs/modules/ecommerce/models/store/backend/repository/database/src/lib/data/` holds `.gitkeep` and `92aefa1f-247b-49a9-b1b9-c8029cc840dc.json` (`single-page-shop`). All 17 `stores-to-orders` seeds and both `stores-to-products` seeds point at it.
- The live instance on `http://localhost:4000` answers `{"data":1}` for `GET /api/ecommerce/stores/count`.
- The only two mentions of multiple stores in the repository are the same defensive write-path string, `Internal error. Multiple stores found. Pass 'data.storeId'` (`order/create.ts:73`, `product/id/checkout.ts:68`). The write path refuses to guess; no read path honours the distinction.
- `libs/modules/ecommerce/models/store/README.md` and `libs/modules/ecommerce/README.md` describe store-specific catalogs, not store-specific carts.

**Conclusion.** The guard key is `(subjectId, productId, type: "cart", status: "new")`. Dropping the store and currency hops removes two lookups and matches what the user can see.

## The `type` predicate has to come back

`type` is a real discriminator, not a formality. `orders.type` defaults to `"cart"` (fields `:9`) and `ecommerceOrderCheckout` moves a checked-out order to `type: "history"` with `status: "paying"` (`service/singlepage/ecommerce/order/checkout.ts:480, 641, 663-664`). The live instance holds both: `cart/new` 1, `cart/canceled` 2, `history/delivered` 7, `history/completed` 2, `history/canceled` 1, `history/canceling` 1, `history/paying` 1.

Filtering on `status: "new"` alone, as the current guard does, would be nearly right by accident. Adding `type: "cart"` makes the guard agree with `list.ts`, `total.ts`, `quantity.ts` and `cart-read.spec.ts` (`:65-83` asserts only the type/status pair) rather than with nothing.

## Error category: 400, not 409, and certainly not 500

An existing cart line is a client-side conflict, so 409 would be the honest status. It does not exist on this branch:

- `libs/shared/backend/utils/src/lib/http-error/type/index.ts:3-11` — `ErrorCategory` has no conflict member.
- `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts` — five entries (401, 403, 500, 404, 400); no 409.
- Issue #232 adds both, together with structural recognition of PostgreSQL unique violations (`thoughts/shared/research/singlepagestartup/ISSUE-232.md:29, 63-64`).

Until then the correct category is `Validation error.`, which `util` maps to 400 through the `/validation error/i` pattern. The message must avoid the 404 table, which is tested first: `/not found/i`, `/order already exists/i` (`paterns/index.ts:57`) and the `no (…) found` alternation must not match it. `Validation error. Product is already in the cart` matches none of them.

Today's message is wrong twice over. `Internal error. Order already exists` has no bracket prefix, so `parseCategoryFromMessage` (`parser/index.ts:5-13`) returns nothing; the 500 table has no pattern for `Internal error.`; and the 404 table's `/order already exists/i` catches it. A duplicate cart line would have been reported as Not Found.

The message reaches the user. The client action toasts a failed add-to-cart with `error.message` (`libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/ecommerce-module/order/create.ts:47`), so the text is read, not just logged.

## The query shape is a second, quieter problem

The guard's first lookup asks `orders-to-products` for every row with this `productId`, across every subject and every order state, and only then intersects in memory. On a catalogue with a popular product that is an unbounded scan whose result feeds an `inArray`. ISSUE-169 and ISSUE-234 record the same shape reaching a 65,534-parameter ceiling in production (`thoughts/shared/research/singlepagestartup/ISSUE-234.md:185`).

Narrowing subject-first inverts it: the subject's order links, then that subject's open cart orders, then `orders-to-products` filtered by `orderId inArray <those>` **and** `productId`. Three queries instead of five, every one of them bounded by one subject's own orders.

## Service placement

`ecommerceModuleResolveOrderCurrency` (`service/singlepage/index.ts:331-337`, implementation `service/singlepage/ecommerce/order/resolve-currency.ts`) is the pattern to follow: a class with an `IExecuteProps` type, a `IConstructorProps` type taking only the module services it needs, an exported error constant, and a thin delegating method on the singlepage service. The new guard is the same shape with `ecommerceModule` and the `subjectsToEcommerceModuleOrders` service.

## Not in the blast radius

- `startup` variants — untouched by the whole change.
- The shared pattern table — `/order already exists/i` in the 404 entry loses its only producer but keeps its test (`http-error/index.spec.ts:89`). Editing it widens the diff into a shared lib whose 409 restructuring belongs to #232.
- Quantity routes, `id/*` routes and checkout — none of them consult this guard.
- Write atomicity for the add-to-cart graph — separate concern, #213.

## References

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.ts:30, 62-78, 98-215, 259-269`
- `.../controller/singlepage/ecommerce-module/order/{list,total,quantity,checkout}.ts`
- `.../controller/singlepage/index.ts:295-299`
- `.../service/singlepage/index.ts:331-337`, `.../service/singlepage/ecommerce/order/resolve-currency.ts`
- `.../service/singlepage/ecommerce/order/checkout.ts:480, 641, 663-664`
- `libs/modules/ecommerce/models/order/backend/repository/database/src/lib/fields/singlepage.ts:4-11`
- `libs/shared/backend/utils/src/lib/http-error/{index.ts,parser/index.ts,paterns/index.ts,type/index.ts}`
- `thoughts/shared/research/singlepagestartup/ISSUE-232.md`, `thoughts/shared/research/singlepagestartup/ISSUE-234.md`
