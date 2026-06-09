---
date: 2026-05-03T23:00:23+03:00
researcher: flakecode
git_commit: 0e30ea072ddc631c2a4822b94967a0dfb6ba7ff0
branch: debug
repository: singlepagestartup
topic: "[log-watch] [LW-aaf94be18dff] api_api Validation error. Checking out order has active subscription products."
tags: [research, codebase, agent, rbac, ecommerce, billing, telegram]
status: complete
last_updated: 2026-05-03
last_updated_by: flakecode
---

# Research: Issue 173 - Telegram checkout active subscription validation

**Date**: 2026-05-03T23:00:23+03:00
**Researcher**: flakecode
**Git Commit**: 0e30ea072ddc631c2a4822b94967a0dfb6ba7ff0
**Branch**: debug
**Repository**: singlepagestartup

## Research Question

Issue #173 is a copied production log-watch report for repeated `400` responses from `POST /api/agent/agents/telegram-bot` with message `Validation error. Checking out order has active subscription products.` The local workspace is connected to a restored `doctorgpt-production` database dump from the affected project, so the research includes read-only database observations in addition to codebase analysis.

## Summary

The logged `telegram-bot` stack frame is an outer wrapper. The validation string originates in RBAC subject order checkout, where a subscription checkout scans the subject's existing orders and detects another non-final subscription order containing the same product. Product checkout creates a new order graph first, then delegates to this shared order checkout service.

The agent Telegram callback path can reach this checkout code when a logged social action has callback data beginning with `checkout_ec_me_pt_`. The handler resolves the message-origin subject, then calls `rbacModuleSubjectApi.ecommerceModuleProductCheckout` for the callback product.

Read-only SQL against the restored local `doctorgpt-production` database found recent callback action rows for `checkout_ec_me_pt_594d8cc6-a8ca-4136-9960-455603f44e2c` where the message-origin subject already has an active matching `delivering` order for the same `free-subscription` product. The database also contains many active `delivered`/`delivering` subscription orders for the same product. No mutating checkout request was executed during research because the product checkout endpoint creates orders and updates statuses.

## Detailed Findings

### Agent Telegram Entry Point

- The API app mounts middleware and modules in `apps/api/app.ts`: action logger at `apps/api/app.ts:157`, bill-route middleware at `apps/api/app.ts:163`, and `/api/agent` at `apps/api/app.ts:172`.
- The agent singlepage controller registers `POST /telegram-bot` at `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/index.ts:85`, and dispatches it to the Telegram bot handler at `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/index.ts:148`.
- The Telegram bot handler parses form `data`, calls `onAction` and `onMessage`, and wraps any error with `getHttpErrorType` before throwing `HTTPException` at `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:40` and `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:69`.
- For logged social actions, `onAction` finds the social action, chat, profiles, and automatic reply profiles, then calls `agentSocialModuleProfileHandler` for each automatic profile at `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:64` and `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:311`.
- The agent service enters the `telegram-bot` profile branch at `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:229`. Callback queries are routed to `telegramBotCallbackQueryHandler` at `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:250`.
- Callback data prefixed by `checkout_ec_me_pt_` is dispatched to `telegramBotEcommerceModuleProductFindByIdCheckout` at `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:828`.
- `telegramBotEcommerceModuleProductFindByIdCheckout` resolves the message-origin subject through `getMessageFromRbacModuleSubject`, finds the `telegram-star` currency, and calls `rbacModuleSubjectApi.ecommerceModuleProductCheckout` at `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1213` and `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1255`.
- `getMessageFromRbacModuleSubject` maps `messageFromSocialModuleProfile.id` through `subjectsToSocialModuleProfiles` and then loads the RBAC subject at `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:2552` and `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:2581`.

### Product Checkout Delegation

- RBAC subject routes include `POST /:id/ecommerce-module/products/:productId/checkout` at `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:231` and `POST /:id/ecommerce-module/orders/checkout` at `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:255`.
- Product checkout validates request params/body, skips deanonymization when `data.provider === "telegram-star"`, and otherwise calls `deanonymize` at `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/product/id/checkout.ts:37` and `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/product/id/checkout.ts:81`.
- Product checkout creates a new order and related rows before delegating: order at `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/product/id/checkout.ts:153`, subject-to-order at `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/product/id/checkout.ts:160`, order-to-product at `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/product/id/checkout.ts:170`, store-to-order at `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/product/id/checkout.ts:181`, and order-to-currency at `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/product/id/checkout.ts:191`.
- Product checkout delegates to `this.service.ecommerceOrderCheckout` with the newly created order at `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/product/id/checkout.ts:210`.
- Product checkout catches downstream errors and throws an `HTTPException` at `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/product/id/checkout.ts:222`.
- The server SDK used by the agent posts to `/api/rbac/subjects/:id/ecommerce-module/products/:productId/checkout` and pipes non-OK responses through `responsePipe` at `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/ecommerce-module/product/checkout.ts:40` and `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/ecommerce-module/product/checkout.ts:64`.

### Order Classification

- `findByIdCheckoutAttributesByCurrency` delegates to the same checkout-attributes service as `findByIdCheckoutAttributes` at `libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/index.ts:146` and `libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/index.ts:152`.
- Checkout attributes load order products at `libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/find-by-id/checkout-attributes.ts:99`, then iterate each product at `libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/find-by-id/checkout-attributes.ts:121`.
- Product type is required to be `subscription` or `one-time`, and mixed product types on one order throw at `libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/find-by-id/checkout-attributes.ts:130` and `libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/find-by-id/checkout-attributes.ts:136`.
- Price attributes are loaded through `productsToAttributes`, `attributeKeysToAttributes`, and optionally `attributesToBillingModuleCurrencies` at `libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/find-by-id/checkout-attributes.ts:142`, `libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/find-by-id/checkout-attributes.ts:164`, and `libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/find-by-id/checkout-attributes.ts:191`.
- Interval attributes are normalized from `interval` attribute keys at `libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/find-by-id/checkout-attributes.ts:246`, and the method returns `{ amount, type, interval }` at `libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/find-by-id/checkout-attributes.ts:318`.

### Active Subscription Validation

- Order checkout loads the requested orders at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:81`, their `ordersToProducts` relations at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:101`, products at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:119`, and product attributes/keys/currencies at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:139`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:162`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:186`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:216`, and `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:239`.
- For each checkout order, the service builds `checkoutOrderProductIds` at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:447`, resolves the order currency at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:466`, and computes checkout attributes by currency at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:478`.
- The active-subscription scan only runs when the current checkout order resolves to `type === "subscription"` at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:485`.
- The service loads all subject-to-order relations for the subject at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:486`, then loads each existing order at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:503`.
- Existing orders are skipped when they are part of the current checkout request or when their status is one of `requested_cancelation`, `canceling`, `completed`, or `canceled` at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:512` and `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:520`.
- Existing orders are also skipped when their checkout attributes do not resolve to `subscription` at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:531` and `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:536`.
- For remaining existing subscription orders, the service loads `ordersToProducts` and checks product-ID intersection with the current checkout order at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:542` and `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:557`.
- If an existing active subscription order contains the same product and the checkout provider is not `telegram-star`, the service throws `Validation error. Checking out order has active subscription products.` at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:586`.
- The surrounding catch matches that message, cancels each current checkout order, and rethrows the same message at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:607`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:614`, and `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:629`.
- If the provider is `telegram-star`, the same product-intersection branch cancels the current checkout orders and returns `{ billingModule: { invoices: [] } }` instead of throwing at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:562` and `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:579`.

### Read-Only Production Dump Observations

- Local Docker services are running with Postgres exposed on port 5433, and `apps/api/.env` points the API at database `doctorgpt-production`. This matches the user-provided context that the local DB is the same data state where the production error occurred.
- All database inspection used `BEGIN READ ONLY` transactions. No checkout endpoint was called, because the product checkout handler creates orders and writes relations before delegating to order checkout.
- The inspected tables exist in `public`: `rc_action`, `sps_ee_order`, `sps_ee_product`, `sps_ee_os_to_ps_d4c`, and `sps_rc_ss_to_ee_me_os_oq2`.
- Order/product status summary for subscription order-product rows in the restored database: `canceled` 2518, `canceling` 1, `completed` 63608, `delivered` 82, `delivering` 156, `new` 2, `requested_cancelation` 31. Under the current order checkout code, `delivered`, `delivering`, and `new` are non-final for active-subscription scanning because only `requested_cancelation`, `canceling`, `completed`, and `canceled` are skipped.
- The restored DB contains repeated active rows for product `594d8cc6-a8ca-4136-9960-455603f44e2c`, slug `free-subscription`, type `subscription`. Example recent active rows include subjects with `delivered` or `delivering` orders updated on 2026-05-03.
- The related copied issue #177 references subject `07e140f9-b44b-4502-9d25-8193671f9a56` and product `594d8cc6-a8ca-4136-9960-455603f44e2c`. In the restored DB, that subject has order `40ac163e-4635-4f94-a298-fbc82793cfce` with status `delivered` for the same `free-subscription` product, plus older `completed` and `canceled` orders.
- Recent `rc_action` callback rows show `checkout_ec_me_pt_594d8cc6-a8ca-4136-9960-455603f44e2c` action payloads. Mapping those action rows through `sl_ps_to_as_b33` and `rc_ss_to_sl_me_ps_ges` found message-origin subjects with active matching `delivering` orders:
  - `8a1c9fd0-76e1-4136-bc86-203ce2dd6c83` at 2026-05-03 15:24:41, subject `2d514835-63b3-458d-8ab9-9b15c77e9bd2`, active order `db56b1b7-c0a1-4b7c-863b-ef5c1f64b627`.
  - `90c5737d-1179-4df3-a7da-e788218afb94` at 2026-05-03 12:58:53, subject `362de5a1-953d-420c-9648-6ffc10ca177b`, active order `8ac916d1-3911-4d9c-a081-78dfe7cf263e`.
  - `81c05a4e-b977-46a5-9575-e1361f5e78b0`, `7150674b-1c60-4d1a-92cb-947b0bb3d13e`, and `1f7453c2-24df-4053-b0e6-a71139ede435` between 2026-05-03 12:48:37 and 12:48:43, subject `2cdce1d9-a1aa-42e9-8c40-d310ff284ba9`, active order `dd8ac4ab-f89d-4ca6-b50c-c824ea61c837`.

### Billing Route Context

- The issue #173 log samples include bill-route balance failures adjacent to the checkout validation error. The bill-route middleware currently applies only to the OpenRouter reaction route regex in `libs/middlewares/src/lib/bill-route/index.ts:20`, detects matching requests at `libs/middlewares/src/lib/bill-route/index.ts:54`, and calls `rbacModuleSubjectApi.authenticationBillRoute` at `libs/middlewares/src/lib/bill-route/index.ts:72`.
- The RBAC authentication bill-route controller validates permission query params and delegates to `service.billRoute` at `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/bill-route/index.ts:56` and `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/bill-route/index.ts:69`.
- The bill-route service resolves permissions with billing requirements at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/bill-route.ts:105`, loads subject currency relations at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/bill-route.ts:145`, and throws the logged insufficient-balance validation message at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/bill-route.ts:243`.
- OpenRouter route billing allows the first request to go negative but blocks later requests while already negative at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/bill-route.ts:232` and `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/bill-route.ts:292`.
- OpenRouter settlement is performed through `billRouteSettle` in the OpenRouter controller at `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:407` and `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:419`.

## Code References

- `apps/api/app.ts:157` - action logger middleware runs before authorization and billing middleware.
- `apps/api/app.ts:163` - bill-route middleware is installed.
- `apps/api/app.ts:172` - agent module mounted at `/api/agent`.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/index.ts:85` - `POST /telegram-bot` route registration.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:40` - telegram-bot handler parses form payload and calls action/message handlers.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:69` - outer error wrapper for the logged stack frame.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:828` - callback data `checkout_ec_me_pt_` dispatch.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1255` - agent calls RBAC product checkout SDK.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:2552` - message-origin subject resolution helper.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/product/id/checkout.ts:153` - product checkout creates a new ecommerce order.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/product/id/checkout.ts:210` - product checkout delegates to order checkout.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:485` - active-subscription scan begins for subscription checkouts.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:520` - non-active statuses skipped by current code.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:557` - same-product intersection check.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:586` - exact validation message throw for non-telegram-star providers.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:562` - `telegram-star` branch in same-product conflict.
- `libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/find-by-id/checkout-attributes.ts:130` - order checkout type derives from product type.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/bill-route.ts:243` - adjacent insufficient-balance validation message.

## Architecture Documentation

The flow is layered through SDKs and module services:

- `apps/api/app.ts` composes middleware and mounts modules.
- Agent action handling receives logged RBAC actions through the agent SDK and controller.
- The agent service resolves social profile relations to the message-origin RBAC subject before invoking checkout.
- RBAC subject product checkout owns one-step order graph creation.
- RBAC subject order checkout owns payment intent creation and active-subscription validation.
- Ecommerce order checkout attributes derive order payment type and interval from products and attributes.
- Billing route middleware and OpenRouter settlement are separate from subscription checkout, but they appear in the same production log windows because user message actions can trigger OpenRouter replies and subscription checkout callbacks through the same telegram/action processing surface.

## Historical Context (from thoughts/)

- `thoughts/shared/tickets/singlepagestartup/ISSUE-173.md` is the direct ticket for fingerprint `LW-aaf94be18dff`; it records `POST /api/agent/agents/telegram-bot` and stack frame `telegram/bot.ts:72`.
- `thoughts/shared/tickets/singlepagestartup/ISSUE-176.md` is a neighboring copied issue that mixes bill-route balance failures with the same `telegram-bot` active-subscription validation message.
- `thoughts/shared/tickets/singlepagestartup/ISSUE-177.md` is a neighboring copied issue for the same validation message where the stack lands in product checkout `ecommerce-module/product/id/checkout.ts:224` and includes subject/product UUIDs.
- `thoughts/shared/research/singlepagestartup/ISSUE-154.md` documents the thread-aware social/telegram/openrouter routing baseline.
- `thoughts/shared/research/singlepagestartup/ISSUE-158.md` documents OpenRouter billing behavior and settlement context.
- `thoughts/shared/handoffs/singlepagestartup/ISSUE-158-progress.md` records that OpenRouter billing implementation added request-scoped billing ledger aggregation and final-message billing metadata.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-154.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-158.md`

## Open Questions

- The issue #173 log samples do not include request IDs or UUIDs. Related issue #177 includes concrete subject/product IDs for the same validation message, and the restored database provides matching callback/action rows for the same product.
- Direct HTTP reproduction was not executed during research because the product checkout route mutates the restored production-copy database by creating orders and relations before reaching the validation branch.
