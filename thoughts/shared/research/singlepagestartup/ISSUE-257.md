---
date: 2026-09-19T16:20:00Z
issue_number: 257
repository: singlepagestartup
topic: "The per-order cart total and quantity routes are copies of the deanonymize handler"
status: complete
---

# Research: ISSUE-257

## Question

Two handlers under the RBAC subject `singlepage` controller are copies of a deanonymize handler. What do they actually do, what should they do, who calls them, and does replacing their bodies lose any behaviour?

## Summary

The two files were born as byte-identical copies of the checkout handler and were never implemented. They are registered as `GET` routes but read a multipart body, so every request dies before it reaches any logic. Nothing in the repository calls them: no SDK action, no OpenAPI path, no frontend component, no test, and no RBAC permission row. The deanonymize behaviour they contain is reachable through two working `POST` checkout routes and is covered by specs there, so replacing these bodies loses nothing.

One adjacent finding matters for verification: because no RBAC permission row exists for either path, a corrected handler is still answered with a permission error for an ordinary subject. That is a separate registration gap, recorded below.

## The defect

### The two files

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/total.ts` (82 lines)
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/quantity.ts` (82 lines)

Both read `id` and `orderId` from the path, then:

```
const body = await c.req.parseBody();            // line 37
if (typeof body["data"] !== "string") { ... }    // line 39 — every GET dies here
const data = JSON.parse(body["data"]);           // line 43
...verify JWT, load order, require status "new"...
await this.service.deanonymize({ id, email: data["email"] });   // lines 69-72
return c.json({ data: true });                   // lines 74-76
```

They differ from each other only in three error-message prefixes (lines 48, 54, 66), which is what `getHttpErrorType` maps to a status code. Nothing else differs.

### Registration

`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts`

- lines 46-47 — imports as `EcommerceModuleOrderIdTotal` / `EcommerceModuleOrderIdQuantity`
- lines 306-308 — `GET /:id/ecommerce-module/orders/:orderId/quantity`
- lines 311-313 — `GET /:id/ecommerce-module/orders/:orderId/total`
- lines 865-874 — the two controller methods

A `GET` carries no multipart body, so `parseBody()` returns `{}` and both routes answer `Validation error. Invalid body`. Neither can compute anything, and neither can deanonymize anything.

Route ordering is safe: the literal `/quantity` and `/total` routes (lines 286-293) are registered before the `:orderId` variants, so the aggregate routes are unaffected.

Neither route declares `middlewares`, unlike the chat-profile routes nearby which use `RequestSubjectIdOwner`.

### Origin

Both files were created in `27d0a2475c` ("ecommerce cart", 2025-05-10) at `.../controller/ecommerce-module/order/id/{total,quantity}.ts`, byte-identical to each other, already containing the `deanonymize` call. `eac0e7cf3d` ("feat: refactoring", 2025-10-17) moved them under `singlepage/`. Every later touch was a sweeping refactor (`ead07e18ff` error categories, `908ed0310e` service-layer migration). Git's rename detection independently traces both back to `controller/ecommerce/order/checkout.ts`, which is mechanical confirmation that they are copies of the checkout handler.

`thoughts/shared/research/singlepagestartup/ISSUE-255.md:64-65` already recorded the defect and deferred it to a separate issue.

## What the corrected handlers should do

### The aggregate siblings

`.../controller/singlepage/ecommerce-module/order/total.ts`

1. Verifies the JWT subject equals `:id` inline (lines 38-45).
2. Loads `subjectsToEcommerceModuleOrders` filtered by `subjectId` (lines 47-60); answers `{ data: [], unpriced: [] }` when there are none.
3. Loads the subject's orders filtered to `type = cart` and `status = new` (lines 64-96); answers `{ data: [], unpriced: [] }` when there are none.
4. For each order calls `this.service.ecommerceModule.order.findByIdTotal({ id })`, collects `unpriced`, and groups `totals` by currency id into a map of `{ billingModuleCurrency, total, orders }` (lines 103-150).
5. Answers `{ data: Array.from(totalsMap.values()), unpriced }` (lines 152-155).

`.../order/quantity.ts` is the same shape and sums `findByIdQuantity`, answering `{ data: <number> }`.

Since #255, `findByIdTotal` returns `{ totals, unpriced }`
(`libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/find-by-id/total.ts:13-20`).
`findByIdQuantity` returns a plain number
(`.../find-by-id/quantity.ts:43-47`).

Both throw `Not Found error. Order does not have any products` for an order with no lines.

### Ownership

`libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-is-owner/index.ts` is the existing `RequestSubjectIdOwner` middleware. It accepts either a valid `X-RBAC-SECRET-KEY` / `rbac.secret-key` cookie, or a JWT whose `subject.id` equals the `:id` path parameter. Many routes in the same controller already carry it (for example lines 384, 390, 397).

The subject-to-order relation service is already injected on the service as `service.subjectsToEcommerceModuleOrders`
(`.../service/singlepage/index.ts:151`, `:182-183`, `:204`). No "subject owns this order" helper exists yet: every current caller (`order/total.ts:47`, `order/quantity.ts:43`, `order/list.ts:43`, `order/create.ts:114`) inlines a `find` by `subjectId`.

The per-order siblings `order/id/update.ts` and `order/id/delete.ts` check the JWT subject against `:id` but never check the relation, so today they accept any order id from an authenticated subject. Tightening those is out of scope here, but the new shared check makes it a one-line follow-up.

## Who calls the two routes

Nobody. Exhaustive audit:

| Surface              | Aggregate `/orders/total`, `/orders/quantity`                                                                             | Per-order `/orders/:orderId/total`, `/quantity` |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Controller           | registered, working                                                                                                       | registered, broken                              |
| SDK server           | `sdk/server/src/lib/singlepage/ecommerce-module/order/{total,quantity}.ts`                                                | absent                                          |
| SDK client           | `sdk/client/src/lib/singlepage/ecommerce-module/order/{total,quantity}.ts`                                                | absent                                          |
| SDK barrels          | client `index.ts:95-108`, `:395-396`, `:472-473`, `:556-557`; server `index.ts:62-70`, `:421-422`, `:508-509`, `:602-603` | absent                                          |
| OpenAPI              | `apps/openapi/openapi.yaml:189`, `:191` → `sdk/model/src/lib/paths.yaml:988`, `:1027`                                     | absent                                          |
| Frontend             | `frontend/component/src/lib/singlepage/ecommerce-module/order/list/{total,quantity}-default/`                             | absent                                          |
| RBAC permission seed | `permission/.../data/38612bfe-….json`, `6baf1a89-….json`                                                                  | absent                                          |
| Tests                | `cart-read.spec.ts`, frontend specs, `apps/api/specs/scenario/singlepagestartup/issue-152/`                               | absent                                          |

A repository-wide search for `orderId}/total`, `orderId}/quantity`, `ecommerceModuleOrderIdTotal` and `ecommerceModuleOrderIdQuantity` finds only the controller index. `apps/host` and `apps/mcp` have no hits.

**Consequence for the task's second question**: no SDK action and no OpenAPI entry documents the wrong (deanonymize) contract for these paths, because none exists at all. There is nothing to correct on those surfaces. The only per-order request body documented in `paths.yaml` is the legitimate `PATCH /{id}/ecommerce-module/orders/{orderId}` multipart body (around line 1044).

Two smaller gaps observed while auditing, both pre-existing and out of scope:

- The aggregate total route returns `unpriced` beside `data`, but the SDK `IResult` (`sdk/server/.../order/total.ts:23-29`) and `paths.yaml:988` describe only the array. `transformResponseItem` reads `data` only, so `unpriced` is dropped by the SDK.
- The HTTP cache exclusion in `libs/middlewares/src/lib/http-cache/routes/singlepage.ts:30-33` is anchored with `$` and covers only the aggregate paths.

## Is the deanonymize behaviour lost?

No. `service.deanonymize` has two working callers, both `POST` routes that read the body they parse:

- `POST /:id/ecommerce-module/orders/checkout` → `.../controller/singlepage/ecommerce-module/order/checkout.ts:78`
- `POST /:id/ecommerce-module/products/:productId/checkout` → `.../controller/singlepage/ecommerce-module/product/id/checkout.ts:82` (skipped for `provider === "telegram-star"`)

Both are covered by controller specs that assert the call (`order/checkout.spec.ts:116`, `product/id/checkout.spec.ts:147`, and the negative case at `:185`). The service is additionally covered on its own at `service/singlepage/deanonymize.spec.ts`, which constructs it with mocks and calls `execute` without any HTTP.

The broken handlers can never reach their `deanonymize` call, and no caller anywhere targets their paths. Their bodies are dead code in the strict sense: unreachable, untested, and duplicated from a live handler. Replacing them loses nothing.

## Adjacent finding: the routes have no RBAC permission row

`libs/middlewares/src/lib/is-authorized/index.ts:38-110` runs on API requests and calls `subjectApi.authenticationIsAuthorized` for any route that is not in the allowed-routes matcher and does not carry the secret key.

`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts:105-210` is default-deny. It resolves a permission by exact path, then by template path, then by a `method` wildcard, then falls back to the root `*`/`*` permission, which is role-gated. A permission with no role links is public (`if (!permissionRoleIds.size) authorized = true`).

The aggregate routes have public permission rows with no `roles-to-permissions` links:

- `.../permission/backend/repository/database/src/lib/data/38612bfe-ab7b-4959-a47c-3fc64bc55620.json` — `GET /api/rbac/subjects/[rbac.subjects.id]/ecommerce-module/orders/total`
- `.../data/6baf1a89-9f1e-41b8-92ca-998e20997caa.json` — the `/quantity` counterpart

Neither per-order path has a row, and the only wildcard row is `7e8e189b-…` (`*`/`*`), which is the root permission. So after the handlers are corrected, an ordinary subject still receives `Permission error. You do not have access to this resource` from the middleware, before the handler runs.

This is a registration gap, not part of the copy-paste defect, and the permission snapshots under `.../repository/database/src/lib/data/` are bulk-exported rather than hand-edited (`53b059643c` touched hundreds of files at once). The repository rules forbid editing those snapshots to implement behaviour. The fix therefore stays in code, and the gap is recorded here and in the plan so the routes can be granted through the normal data-management flow.

## Key files

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/total.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/quantity.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/total.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/quantity.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts`
- `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-is-owner/index.ts`
- `libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/find-by-id/total.ts`
- `libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/find-by-id/quantity.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/cart-read.spec.ts`

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-257.md`
- Prior mention of the defect: `thoughts/shared/research/singlepagestartup/ISSUE-255.md:64-65`
