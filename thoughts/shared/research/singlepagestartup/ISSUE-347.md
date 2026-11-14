---
date: 2026-09-26T02:58:55+03:00
researcher: flakecode
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-347-checkout-owner-check
repository: singlepagestartup
topic: "Subject checkout routes: add the owner check"
tags: [research, codebase, rbac, subject, ecommerce, checkout, middleware, telegram, agent]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Subject checkout routes: add the owner check

**Date**: 2026-09-26T02:58:55+03:00
**Researcher**: flakecode
**Git Commit**: 78d7d43125
**Branch**: claude/issue-347-checkout-owner-check
**Repository**: singlepagestartup

## Research Question

How do the two subject checkout routes, `POST /api/rbac/subjects/:id/ecommerce-module/orders/checkout` and `POST /api/rbac/subjects/:id/ecommerce-module/products/:productId/checkout`, decide who may call them, which orders the order checkout acts on, and which callers inside the repository send which credential? The answers decide whether `RequestSubjectIdOwner` can be added to both routes without breaking the browser cart, the Telegram bot, the agent module and subscription renewal.

## Summary

- The subject controller route table declares both checkout routes without `middlewares` (`controller/singlepage/index.ts:276-280` and `:301-305`). The table attaches `new RequestSubjectIdOwner().init()` to 24 other routes and `new RequestProfileSubjectIdOwner().init()` to 23.
- Neither handler checks the caller. Both read the subject id from the path and run the checkout for it with the operator secret on every downstream call (`order/checkout.ts:72-131`, `product/id/checkout.ts:75-219`).
- The permission rows for both routes (`739da09a-…` and `935dc5e7-…`) have no `roles-to-permissions` row, so the global authorization step admits any caller, with or without a token (`service/singlepage/is-authorized.ts:230-245`).
- The order checkout looks up the order ids from the request body with `inArray` and the operator secret, patches each order's comment and passes them to `ecommerceOrderCheckout`. Neither the handler nor the service limits the ids to orders linked to the path subject (`order/checkout.ts:80-131`, `service/singlepage/ecommerce/order/checkout.ts:91-105`).
- `RequestSubjectIdOwner` admits a request that carries the operator secret in `X-RBAC-SECRET-KEY` (or the `rbac.secret-key` cookie) equal to `RBAC_SECRET_KEY`, or a JWT whose `subject.id` equals the path `:id`. Otherwise it answers 400 for a missing token, 401 for a token of another subject and 400 for a wrong secret (`middlewares/src/lib/request-subject-is-owner/index.ts:22-49`, status mapping in `http-error/paterns/index.ts:3-22,78-81`). On the assembled API a wrong secret never reaches it: the global step sends it to `authenticationIsAuthorized`, which refuses it with 401.
- Callers: the browser components send the signed-in subject's own JWT; the Telegram free-subscription service sends the operator secret; the subscription renewal in the order proceed service (`proceed.ts:1000-1009`) and the agent module's `checkout_ec_me_pt_` callback (`agent/.../service/singlepage/index.ts:1908-1918`) send no credential at all.

## Detailed Findings

### Route table and route middleware

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:276-280`: `POST /:id/ecommerce-module/products/:productId/checkout`, handler `ecommerceModuleProductIdCheckout`, no `middlewares`.
- `index.ts:301-305`: `POST /:id/ecommerce-module/orders/checkout`, handler `ecommerceModuleOrderCheckout`, no `middlewares`.
- `index.ts:385`, `:391`, `:435`, `:441`, `:456` and others declare `middlewares: [new RequestSubjectIdOwner().init()]` on subject-owned social routes; the import is at `index.ts:7-13`.
- `libs/shared/backend/api/src/lib/app/default/index.ts:72-82`: `useRoutes()` registers each route's middlewares with `this.hono.use(route.path, middleware)` immediately before `this.hono.on(route.method, route.path, route.handler)`, so a route middleware runs before its handler.
- `libs/modules/rbac/models/subject/README.md:20-22`: subject-owned routes keep `RequestSubjectIdOwner` or `RequestProfileSubjectIdOwner` as the first ownership guard, and guards live in the module middleware package.

### `RequestSubjectIdOwner`

- `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-is-owner/index.ts:10-57`, exported as `RequestSubjectIdOwner` from `middlewares/src/index.ts:1-4`.
- Operator path (`:22-23`, `:45-48`): reads `X-RBAC-SECRET-KEY`, then the `rbac.secret-key` cookie; a present value must equal `RBAC_SECRET_KEY` (compared with `!==`), else "Validation error. Wrong secret key".
- Token path (`:31-44`): `authorization(c)` reads the `rbac.subject.jwt` cookie, then the `Authorization: Bearer` header (`libs/shared/backend/utils/src/lib/authorization/index.ts:4-10`); `verifyJwt` verifies it (`jwt-verify/index.ts:19-34`); `decoded.subject.id` must equal the path `:id`.
- Statuses through `getHttpErrorType` (`libs/shared/backend/utils/src/lib/http-error/index.ts:10-131`): "Validation error. No JWT token provided" matches `/^validation error\b/i` → 400; "Authorization error. Only profile owner can get access" matches `/authorization error/i` in the 401 entry (`paterns/index.ts:4-21`) → 401; "Validation error. Wrong secret key" → 400. The route-table spec on PR #346 pins the same 400 and 401 for `RequestProfileSubjectIdOwner`.

### Global authorization before the route

- `libs/middlewares/src/lib/is-authorized/index.ts:60-70`: a request whose operator secret equals `RBAC_SECRET_KEY` skips the permission check.
- Otherwise `subjectApi.authenticationIsAuthorized` runs `service/singlepage/is-authorized.ts:151-280`: a malformed or expired token fails in `verifyJwt` (401); a permission with no role is authorized unless the route is in the sensitive list (`:230-245`).
- Permission seed: `libs/modules/rbac/models/permission/backend/repository/database/src/lib/data/739da09a-abe7-42a9-9025-6d00105898b8.json` (`POST /api/rbac/subjects/[rbac.subjects.id]/ecommerce-module/orders/checkout`) and `935dc5e7-0b38-40d4-bae6-1749e20eee34.json` (`POST …/ecommerce-module/products/[ecommerce.products.id]/checkout`). No file under `libs/modules/rbac/relations/roles-to-permissions/backend/repository/database/src/lib/data/` references either id.
- `POST /:id/telegram/checkout-free-subscription`, `/:id/telegram/sync-membership` and `/telegram/bootstrap` have no permission row, so only the operator secret reaches them.

### Order checkout handler

`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/checkout.ts`:

- `:21-70` validates `:id` and the body: `data.provider`, `data.email`, `data.ecommerceModule.orders[].id`.
- `:72-78` loads the subject and calls `this.service.deanonymize({ id, email })`.
- `:80-104` finds orders with `column: "id", method: "inArray"` over the body ids through `ecommerceModuleOrderApi.find` with the operator secret; an empty result answers "Not Found error. No ecommerce module orders found" (404).
- `:106-120` writes `data.comment` into every found order with the operator secret.
- `:122-131` calls `this.service.ecommerceOrderCheckout` with the found order ids.
- Spec `order/checkout.spec.ts:137-179`: ids of orders that no longer exist are ignored and only found orders reach the checkout service.
- No step reads `subjectsToEcommerceModuleOrders`. The owner-scoped siblings do: `order/list.ts:43-90` filters by the subject's `subjectsToEcommerceModuleOrders` rows, and `order/create.ts:289-299` links every new order to the path subject.

### Product checkout handler

`controller/singlepage/ecommerce-module/product/id/checkout.ts`:

- `:56-73` resolves the store (`data.storeId` or the only store), `:75-83` loads the subject and calls `deanonymize` unless `data.provider === "telegram-star"`.
- `:85-151` resolves the billing currency; `:153-208` creates the order, links it to the path subject, adds the product line, the store link and the currency link, all with the operator secret.
- `:210-219` calls `ecommerceOrderCheckout` with the new order.

### Checkout service

`service/singlepage/ecommerce/order/checkout.ts:77-906` (`ecommerceOrderCheckout`, called only by the two handlers):

- `:91-105` finds the orders by id with `inArray`, no subject filter.
- `:495-781` moves each order to `paying`/`history`, creates or extends payment intents; `:783-799` asks the billing provider for invoices; `:801-859` pushes two observer messages per order, the second calling `POST /api/rbac/subjects/${props.id}/check` with the operator secret.
- `:533-627`: for subscription orders it reads the subject's other orders through `this.subjectsToEcommerceModuleOrders` and requests cancellation of the subject's active subscriptions.

### Callers of the two routes

Server SDK actions: `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/ecommerce-module/order/checkout.ts:33-64` and `…/product/checkout.ts:40-76`. Both spread `options` into the `fetch` options, so headers come only from the caller.

| Caller                              | File                                                                                                                                                              | Credential sent today                                                                                                                                           |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser order checkout form         | `frontend/component/src/lib/singlepage/ecommerce-module/order/checkout-default/ClientComponent.tsx:44-70`                                                         | client SDK `saturateHeaders` adds `Authorization: Bearer <rbac.subject.jwt cookie>` (`libs/shared/frontend/client/utils/src/lib/authorization/headers.ts:1-24`) |
| Browser cart checkout (order list)  | `…/order/list/checkout-default/ClientComponent.tsx:53-82`                                                                                                         | same                                                                                                                                                            |
| Browser product checkout            | `…/product/checkout-default/ClientComponent.tsx:51-73`                                                                                                            | same                                                                                                                                                            |
| Telegram free subscription          | `service/singlepage/telegram/checkout-free-subscription.ts:323-339`                                                                                               | `X-RBAC-SECRET-KEY`                                                                                                                                             |
| Subscription renewal                | `service/singlepage/ecommerce/order/proceed.ts:1000-1009` (inside `delivered`, `:786`)                                                                            | none                                                                                                                                                            |
| Agent `checkout_ec_me_pt_` callback | `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1908-1918` (in `telegramBotEcommerceModuleProductFindByIdCheckout`, `:1866`) | none                                                                                                                                                            |

- The browser components receive `data` from `authentication-me-default` (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject/singlepage/me/ecommerce-module/product/checkout-default/ClientComponent.tsx:7-24`, `…/me/ecommerce-module/order/list/checkout-default/ClientComponent.tsx:7-26`), so the path id is the subject of the token the browser sends.
- The anonymous session: `GET /api/rbac/subjects/authentication/init` signs `{ exp, iat, subject }` for a new or reused subject and sets the `rbac.subject.jwt` cookie (`service/singlepage/init.ts:79-97`, `controller/singlepage/authentication/init.ts:22-47`).
- The Telegram bot calls `POST /:id/telegram/checkout-free-subscription` with `X-RBAC-SECRET-KEY` (`apps/telegram/src/lib/telegram-bot.ts:1391-1414`); the free-subscription service then calls the product checkout with the operator secret.
- Subscription renewal runs inside `POST /api/rbac/subjects/check` and `POST /api/rbac/subjects/:id/check` (`controller/singlepage/check.ts:20`, `findById/check.ts:26`); every other outbound call in `proceed.ts` sends `X-RBAC-SECRET-KEY` (for example `:919-930`).
- The agent callback runs with `props.jwtToken`, signed for the bot's own subject (`agent/.../service/singlepage/index.ts:535-568`), while the checkout path id is the subject of the Telegram user who pressed the button (`getMessageFromRbacModuleSubject`, `:3261-3338`). The same service already signs a token for that user with `signRbacModuleSubjectJwt` (`:735-756`), used by `getTelegramThreadCommandSubjectContext` (`:758-773`), and sends such a token as `Authorization: Bearer` on the owner-guarded react-by-openrouter route (`:2426-2448`).
- No other caller exists in `libs`, `apps` or `tools`: the OpenAPI entries (`sdk/model/src/lib/paths.yaml:898-940`, `:1010-1045`) document the routes, and the remaining matches are specs, Storybook stories and the websocket topic rules (`libs/shared/utils/src/lib/topics/singlepage.ts:111`).

### Specs touching the callers

- `service/singlepage/ecommerce/order/proceed.spec.ts:449-551` asserts the renewal call arguments exactly, without `options`.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-subscription-checkout.spec.ts:124-137` asserts the agent call arguments exactly, without `options`; the service is built with `Object.create(Service.prototype)`, so a real signing call there needs JWT settings or a stub.
- `service/singlepage/telegram/checkout-free-subscription.spec.ts:192-230` asserts the operator secret on the free-subscription call.
- Jest runs through `libs/modules/rbac/jest.config.ts` and `libs/modules/agent/jest.config.ts` (preset `jest.server-preset.js`, ts-jest with `diagnostics: false`, so types need a separate `tsc` run).

## Code References

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:276-280,301-305` - the two routes without middleware.
- `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-is-owner/index.ts:10-57` - the owner guard.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/checkout.ts:80-131` - order lookup by body ids.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/list.ts:43-90` - subject-scoped order lookup.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:1000-1009` - renewal call without a credential.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:735-756,1866-1932` - the subject token signer and the checkout callback without a credential.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/checkout-free-subscription.ts:323-339` - operator-secret caller.
- `libs/shared/backend/api/src/lib/app/default/index.ts:72-82` - route middleware registration.
- `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts:3-22,78-81` - status mapping of the guard's messages.

## Architecture Documentation

- Access to a subject route is two steps: the global `is-authorized` middleware checks the permission row, then route middleware from the module's middleware package checks resource ownership. Role-less rows are public, so for these two routes the second step is the only check available.
- Server-side callers choose their credential per call through `options.headers`: operator processes send `X-RBAC-SECRET-KEY`; code acting for a subject signs a JWT for that subject.
- Owner-scoped order reads start from `subjectsToEcommerceModuleOrders` filtered by the path subject and only then read orders by id.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-173.md` documents the active-subscription validation inside `ecommerceOrderCheckout` and the Telegram checkout callback that reports it.
- `thoughts/shared/research/singlepagestartup/ISSUE-234.md:161` documents `deanonymize` and its two callers, the two checkout handlers.
- PR #346 (branch `claude/issue-303-roleless-permissions`, open) adds `controller/singlepage/index.spec.ts`, a spec that mounts the real route table through `DefaultApp.useRoutes`, and changes the same `index.ts` in a different hunk.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-173.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-234.md`

## Open Questions

- None blocking. Two points for the lead: `RequestSubjectIdOwner` answers 401 (not 403) to another subject's token and 400 (not 401) to a missing token on all 24 routes that carry it; and the branch for PR #346 adds a file with the same path as this issue's route-table spec, so the second merge combines the two suites.
