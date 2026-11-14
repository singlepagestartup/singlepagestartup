---
date: 2026-09-26T03:27:00+00:00
researcher: flakecode
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-352-order-ownership-check
repository: singlepagestartup
topic: "Per-order subject routes: check the order belongs to the subject"
tags: [research, codebase, rbac, subject, ecommerce, order, middleware]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Per-order subject routes: check the order belongs to the subject

**Date**: 2026-09-26T03:27:00Z
**Researcher**: flakecode
**Git Commit**: 78d7d43125
**Branch**: claude/issue-352-order-ownership-check
**Repository**: singlepagestartup

## Research Question

How do the four per-order subject routes decide which order a request may act on, which middleware pattern the subject module uses for "this resource belongs to the subject in the path", and who calls the four routes? The answers decide the shape of a route middleware that checks the `subjects-to-ecommerce-module-orders` link without changing the four handlers.

## Summary

- The route table declares `GET /:id/ecommerce-module/orders/:orderId/quantity`, `GET …/:orderId/total`, `PATCH /:id/ecommerce-module/orders/:orderId` and `DELETE /:id/ecommerce-module/orders/:orderId` without `middlewares` (`controller/singlepage/index.ts:306-315,328-332,344-348`). Their permission rows carry no role.
- The update and delete handlers check that the token's `subject.id` equals `:id`, then read `:orderId` by id, require status `new`, and change or delete it with the operator secret. No handler reads `subjects-to-ecommerce-module-orders`.
- The two `…/:orderId/quantity` and `…/:orderId/total` handlers parse a request body before anything else, so a GET without a body answers 400 "Validation error. Invalid body" for every caller; no SDK action or component calls them.
- On `main` over HTTP, a PATCH and a DELETE sent with a subject's own token on its own path and an order linked to another subject both answered 200 and changed or removed that order.
- Link checks in this module are route middlewares that receive the subject service and run after `RequestSubjectIdOwner`: `RequestSubjectOwnsSocialModuleChat`, `RequestSocialModuleThreadBelongsToChat`, `RequestSubjectCanManageChatAgentProfile`. They refuse a missing link with an "Authorization error. …" message (401). The operator secret passes `RequestSubjectIdOwner`; the link checks apply to every caller.
- Callers: the client and server SDK actions `ecommerceModuleOrderUpdate` and `ecommerceModuleOrderDelete`, the `ecommerce-module-order-update-default` and `ecommerce-module-order-delete-default` variants rendered by the cart sheet and the product cart for the signed-in subject's own cart orders, and the issue-152 scenario fixture that deletes a subject's own cart orders.

## Detailed Findings

### Route table

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:306-310`: `GET /:id/ecommerce-module/orders/:orderId/quantity` → `ecommerceModuleOrderIdQuantity`.
- `index.ts:311-315`: `GET /:id/ecommerce-module/orders/:orderId/total` → `ecommerceModuleOrderIdTotal`.
- `index.ts:328-332`: `PATCH /:id/ecommerce-module/orders/:orderId` → `ecommerceModuleOrderIdUpdate`.
- `index.ts:344-348`: `DELETE /:id/ecommerce-module/orders/:orderId` → `ecommerceModuleOrderIdDelete`.
- None declares `middlewares`. Chat thread routes declare `[new RequestSubjectIdOwner().init(), new RequestSubjectOwnsSocialModuleChat(this.service).init()]` (`index.ts:395-410`).
- `libs/shared/backend/api/src/lib/app/default/index.ts:72-82` registers a route's middlewares in array order just before its handler.
- Permission rows: `038c95c0-…` (PATCH), `065dc7bd-…` (DELETE), `cf0066ad-…` (quantity) and `47a3fcac-…` (total) under `libs/modules/rbac/models/permission/backend/repository/database/src/lib/data/`; no `roles-to-permissions` row references them, so the global authorization step admits any caller.

### Handlers

`controller/singlepage/ecommerce-module/order/id/`:

- `update.ts:38-48`: requires a token ("Validation error. No token", 400) whose `subject.id` equals `:id` ("Validation error. Only order owner can update order", 403 through the explicit pattern in `http-error/paterns/index.ts:30`); `:50-60` requires `data.ordersToProducts`; `:70-80` reads the order by `:orderId` and requires status `new`; `:82-90` sends `data` to `ecommerceOrderApi.update` with the operator secret, whose handler updates the quantities of the order's lines (`ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/update/index.ts:44-86`).
- `delete.ts:39-56`: no token answers 401 with `{ data: null }`; a token of another subject throws "Permission error. Only order owner can update order" (403); `:66-76` reads the order and requires status `new`; `:78-113` deletes the order's lines and the order with the operator secret.
- `quantity.ts` and `total.ts`: `:37-43` parse the body and require `data`; `:45-55` check the token; `:57-67` require an order in status `new`; `:69-72` call `deanonymize` with `data.email`; `:74-76` answer `{ data: true }`. Neither computes a quantity or a total.
- The #311 branch (PR #339) rewrites the token verification lines of all four handlers; it does not change the route table.

### Link-check middlewares

`libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/`:

- `request-subject-owns-social-module-chat/index.ts:1-45`: `export interface IMiddlewareGeneric {}`, a typed `IService` subset, `constructor(private readonly service: IService)`, `init()` returning `createMiddleware`, `:21-31` required `id` and `socialModuleChatId` params, `:33-36` a service assertion, `:39-42` errors mapped through `getHttpErrorType` into `HTTPException`.
- `request-subject-can-manage-chat-agent-profile/index.ts:121-151` (`assertRequestingProfileAccess`): `this.service.subjectsToSocialModuleProfiles.find` with `eq` filters on both columns and `limit: 1`; an empty result throws "Authorization error. Requesting social-module profile does not belong to subject" (401 through `/authorization error/i`).
- `service/singlepage/social-module/chat/lifecycle.ts:74-112`: the chat assertion throws "Authorization error. Requested social-module chat does not belong to subject" and lets an admin subject pass.
- `request-subject-is-owner/index.ts:22-49`: the operator secret passes; otherwise a token whose `subject.id` equals `:id` is required (400 without a token, 401 for another subject).
- `middlewares/src/index.ts:1-20` exports each middleware as `Middleware as <Name>` with `type IMiddlewareGeneric as I<Name>MiddlewareGeneric`.
- The controller passes `this.service`, the subject `Service`, which holds `subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService` (`service/singlepage/index.ts:154`). The relation columns `subjectId` and `ecommerceModuleOrderId` are non-null UUIDs (`libs/modules/rbac/relations/subjects-to-ecommerce-module-orders/backend/repository/database/src/lib/schema.ts:17-24`).
- `request-subject-can-manage-chat-agent-profile/index.spec.ts` mounts a middleware on a bare `Hono` route with a filter-aware service mock.

### Callers

- Server SDK: `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/ecommerce-module/order/id/update.ts:49-52` (PATCH) and `…/id/delete.ts:43-46` (DELETE); headers come from the caller.
- Client SDK: `…/sdk/client/src/lib/singlepage/ecommerce-module/order/id/{update,delete}.ts` wrap them and add the signed-in subject's token through `saturateHeaders`.
- Components: `frontend/component/src/lib/singlepage/ecommerce-module/order/update-default/ClientComponent.tsx:32-38` and `…/delete-default/ClientComponent.tsx:25-30` send `props.data.id` and `props.order.id`. They are rendered by `…/order/list/checkout-default` (the cart sheet) and `…/product/cart-default` (the product cart), which take their orders from the subject's own cart list (`product/cart-default/ClientComponent.tsx:22-27`).
- `apps/api/specs/scenario/singlepagestartup/issue-152/test-utils/fixtures.ts:260-280` deletes a subject's own cart orders with that subject's token.
- No SDK action, component or server code calls `…/:orderId/quantity` or `…/:orderId/total`.

### Baseline over HTTP

API from this worktree on port 4352 against `sps-lite-issue-352`, a `pg_dump` copy of the development database, before any change. Anonymous subjects A (two cart orders of `pro`) and B (one):

| Request                                                        | Status                               |
| -------------------------------------------------------------- | ------------------------------------ |
| PATCH, A's token, A's path, A's order                          | 200                                  |
| PATCH, no credential                                           | 400 "Validation error. No token"     |
| PATCH, B's token, A's path, A's order                          | 403                                  |
| PATCH, B's token, B's path, A's order                          | 200, A's order line changed          |
| PATCH, operator secret                                         | 400 "Validation error. No token"     |
| DELETE, no credential                                          | 401                                  |
| DELETE, B's token, A's path, A's order                         | 403                                  |
| DELETE, B's token, B's path, A's order                         | 200, A's order removed               |
| DELETE, operator secret                                        | 401                                  |
| GET `…/:orderId/quantity` and `…/:orderId/total`, every caller | 400 "Validation error. Invalid body" |

The cart reads `GET /:id/ecommerce-module/orders/quantity` and `…/total` answered 200 throughout. With the `startup` product the cart total answers 500: one of its price attributes has no currency link, which the total service requires (`ecommerce/relations/orders-to-products/backend/app/api/src/lib/service/singlepage/get-total/index.ts:145-162`).

## Code References

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:306-315,328-332,344-348` - the four routes.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/update.ts:38-90` - token check, order read, update.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/delete.ts:39-113` - token check, order read, delete.
- `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-owns-social-module-chat/index.ts:1-45` - the middleware shape to mirror.
- `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-can-manage-chat-agent-profile/index.ts:121-151` - relation lookup with `limit: 1` and its refusal.
- `libs/modules/rbac/models/subject/backend/app/middlewares/src/index.ts:1-20` - middleware exports.

## Architecture Documentation

- A subject route checks the caller first (`RequestSubjectIdOwner`: the subject's token or the operator secret) and then each path resource against the subject with a link-check middleware from the module's middleware package; handlers may repeat checks as defense in depth.
- Link checks read relation services through the subject service passed to the middleware constructor, so a project can override the relation service or the subject service without changing the middleware.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-234.md` documents the anonymous `init` subject that owns the cart.
- PR #350 (issue #347) adds `RequestSubjectIdOwner` to the two checkout routes of the same table and a route-table spec at `controller/singlepage/index.spec.ts`; PR #346 adds a spec at the same path.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-234.md`

## Open Questions

- None blocking. The per-order quantity and total handlers answer 400 to every GET because they require a body; that stays as it is, since the handlers are outside this change.
