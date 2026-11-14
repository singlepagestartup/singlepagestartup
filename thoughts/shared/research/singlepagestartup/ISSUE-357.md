---
date: 2026-09-26T20:30:19Z
researcher: flakecode
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-357-order-fulfilment-payment-check
repository: singlepagestartup
topic: "Order fulfilment: confirm the payment before granting products"
tags: [research, codebase, rbac, subject, ecommerce, billing, order, payment-intent, invoice, fulfilment]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Order fulfilment: confirm the payment before granting products

**Date**: 2026-09-26T20:30:19Z
**Researcher**: flakecode
**Git Commit**: 78d7d43125
**Branch**: claude/issue-357-order-fulfilment-payment-check
**Repository**: singlepagestartup

## Research Question

Which paths move an ecommerce order to `paid`, which billing records does each leave behind, and what does order fulfilment read before it grants a product's roles and top-up balances? The answers define the evidence fulfilment can require without breaking a legitimate path.

## Summary

- Fulfilment is the RBAC order proceed service (`service/singlepage/ecommerce/order/proceed.ts`). It dispatches on `order.status` (`:308-432`): `paid` runs `fromPaidStatus` (`:599-784`), which grants the product roles the subject lacks, credits top-up balances and moves the order to `approving` (one-off) or `delivering` (subscription); `delivering` grants the product roles the subject lacks (`:333-353`); `delivered` and `canceling` revoke. Neither granting branch reads the order's payment intents or invoices, although the extended order it already loads carries both (`ecommerce/models/order/backend/app/api/src/lib/service/singlepage/find-by-id/extended.ts:246-465`).
- The only code that writes an order status of `paid` is the ecommerce order check: a `paying` order with a linked payment intent in `succeeded` becomes `paid` (`ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/find-by-id/check/index.ts:193-212`).
- The only code that writes a payment intent status of `succeeded` is `updatePaymentIntentStatus` (`billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/index.ts:64-140`, write at `:126`). Every provider webhook, the zero-amount branch and the CloudPayments reconciliation call it after writing an invoice `paid`; it marks each linked intent whose amount the invoice covers.
- So every order that reaches `paid` through a payment carries a linked payment intent in `succeeded` with a linked invoice in `paid`. In a copy of the development database, all 11 orders that went through `paid` (Telegram Stars) carry both, and no order sits in `paid`.
- The admin panel's order, invoice and payment-intent forms expose their `status` as a free select, and the order form embeds the order-to-payment-intent relation. No documentation, provider or action describes an offline or manual payment flow, so an order marked `paid` by hand in the panel carries no payment record.

## Detailed Findings

### Fulfilment (RBAC order proceed)

`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts`:

- `:54-59` `ECOMMERCE_ORDER_PROCEED_STATUSES = ["paid", "delivering", "delivered", "canceling"]`; `:166-223` reads up to 100 candidate orders, oldest `updatedAt` first.
- `:264-275` per order: the `processingOrderIds` guard (`:129`), then `getExtendedEcommerceModuleOrderById` (`:1375-1387`).
- `:321-332` `paid` → `fromPaidStatus`; `:333-353` `delivering` → `subjectsToRolesApi.create` for each product role the subject lacks; `:308-320` `delivered` → `delivered` (revokes roles, zeroes balances, completes, may create a Telegram Stars renewal checkout); `:354-431` `canceling` → revokes and cancels.
- `fromPaidStatus` `:599-784`: grants missing roles (`:613-632`), collects top-ups (`collectTopupCurrencies`, `:446-597`), adds an invite bonus, credits or creates balances (`:686-748`), moves the order to `approving` or `delivering` (`:750-769`), notifies the admin and the owner (`:771-783`).
- The service is a singleton (`bootstrap.ts:647-649`, `inSingletonScope`), and projects replace it by rebinding `SubjectDI.IEcommerceOrderProceedService`.
- Runs: the agent `rbac-module-subjects-check` (interval `* * * * *`) calls `POST /api/rbac/subjects/check`; checkout also stores an observer pipe that calls `POST /api/rbac/subjects/:id/check` after any PATCH of the order (`service/singlepage/ecommerce/order/checkout.ts:831-858`, `libs/middlewares/src/lib/observer/index.ts`).

### From `paying` to `paid` (ecommerce order check)

`find-by-id/check/index.ts`: for `paying` (`:102-307`) it loads the order's payment intents; any `succeeded` intent moves the order to `paid` and `history` (`:193-212`); all `failed`/`canceled` move it to `canceling`; no intent or no invoice after the grace period cancels it. The agent `ecommerce-module-orders-check` runs it every minute for `paying`, `delivering` and `requested_cancelation` orders (`agent/…/controller/singlepage/ecommerce-module/order/check.ts:8-14,31-65`), and the checkout's observer pipe runs it after the provider's webhook.

### Payment records per path

| Path                                              | Receives the signal at                                                                                                                                         | Invoice `paid`                                                     | Intent `succeeded`                           |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------- |
| Stripe checkout                                   | `POST …/stripe/webhook`; the event is re-read from Stripe by id                                                                                                | `service/singlepage/index.ts:401`                                  | `:414`                                       |
| Stripe subscription, first cycle and renewals     | same; each renewal adds a paid invoice to the same intent                                                                                                      | `:492`                                                             | `:505` (the intent stays `succeeded`)        |
| 0xprocessing                                      | `POST …/0xprocessing/webhook`, MD5 signature                                                                                                                   | `:679`                                                             | `:692`                                       |
| Payselection                                      | `POST …/payselection*/webhook`, HMAC-SHA256                                                                                                                    | `:1184`                                                            | `:1202`                                      |
| CloudPayments                                     | webhook with HMAC; reconciliation through the payment-intent check                                                                                             | `cloudpayments.ts:245`; `controller/singlepage/check/index.ts:232` | `cloudpayments.ts:258`; `check/index.ts:241` |
| TipTopPay                                         | webhook with HMAC                                                                                                                                              | `tiptoppay.ts:243`                                                 | `tiptoppay.ts:256`                           |
| PayKeeper (webhook tracked by #230)               | webhook; the invoice is re-read from PayKeeper                                                                                                                 | `paykeeper.ts:545-559`                                             | `paykeeper.ts:566`                           |
| Telegram Stars                                    | `POST …/telegram-star/webhook` with the operator secret, sent by the Telegram app after `successful_payment` (`apps/telegram/src/lib/telegram-bot.ts:811-826`) | `telegram-star.ts:143`                                             | `telegram-star.ts:156`                       |
| Dummy (development)                               | `POST …/dummy/webhook`                                                                                                                                         | `index.ts:787`                                                     | `index.ts:800`                               |
| Zero-amount invoice (free products, any provider) | the provider controller's self-call to its own webhook route (`controller/singlepage/provider/index.ts:93-162`)                                                | `provider-webhook/index.ts:72`                                     | `provider-webhook/index.ts:81`               |

Paths are under `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/`. `updatePaymentIntentStatus` marks an intent `succeeded` only when the invoice's amount covers the intent's amount and the intent is not already `succeeded` or `canceled` (`index.ts:113-130`).

### Admin panel

- Order: `ecommerce/models/order/frontend/component/src/lib/singlepage/admin/form/ClientComponent.tsx:60-68` and `…/admin-v2/form/ClientComponent.tsx:118-126` render `status` as a free select over `statuses` (`ecommerce/models/order/sdk/model/src/lib/index.ts:19-31`); the admin-v2 form embeds `orders-to-billing-module-payment-intents` (`:69`). The module update handler writes the received fields (`controller/singlepage/update/index.ts:43`).
- Payment intent and invoice: their admin-v2 forms render `status` as a free select (`billing/models/payment-intent/…/admin-v2/form/ClientComponent.tsx:152-160`, `billing/models/invoice/…/admin-v2/form/ClientComponent.tsx:133-141`); admin variants exist for `orders-to-billing-module-payment-intents` and `payment-intents-to-invoices`.
- These routes have no permission row of their own; the root permission `* *` carries the Admin role, so only an admin token or the operator secret reaches them.
- No README, provider or action describes an offline, cash, bank-transfer or manual payment flow (`libs/modules/ecommerce/README.md`, `libs/modules/ecommerce/models/order/README.md`, `libs/modules/billing/README.md`, `libs/modules/billing/models/{invoice,payment-intent}/README.md`).

### Development data

In a `pg_dump` copy of the development database: canceled 3 (1 with a succeeded intent), canceling 1, completed 2, delivered 7, delivering 1 (all with a succeeded intent and a paid invoice, Telegram Stars), new 4 and requested_cancelation 1 (none); no order in `paid`.

### Over HTTP

On the unchanged worktree API (port 4357) against that copy:

- A dummy-provider purchase leaves a succeeded intent and a paid invoice, becomes `paid` through the order check, and is fulfilled by the subject check (role granted, top-up credited, order `delivering`).
- The Telegram free-subscription route leaves a zero-amount paid invoice and a succeeded intent, and is fulfilled the same way (`free-subscriber`, top-up, `delivering`).

## Code References

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:321-353,599-784` - the two granting branches.
- `libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/find-by-id/check/index.ts:193-212` - the only writer of an order's `paid`.
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/index.ts:64-140` - the only writer of an intent's `succeeded`.
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/provider-webhook/index.ts:59-93` - the zero-amount branch.
- `libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/find-by-id/extended.ts:246-465` - the extended order with intents and invoices.

## Architecture Documentation

- Billing records a payment on the invoice (provider-specific verification) and derives the intent's `succeeded`; the ecommerce order check derives `paid` from the intent; fulfilment acts on `paid` and `delivering`.
- Fulfilment runs every minute under the operator secret; everything it grants comes from the order's products (`roles-to-ecommerce-module-products`, top-up attributes).

## Historical Context (from thoughts/)

- PR #356 (issue #355) limits the subject order update to the order lines; PR #350 and PR #353 add owner checks on the subject order routes.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-355.md` (on the PR #356 branch)

## Open Questions

- None. Manual marking by an admin is covered by the plan's "Manual marking by an admin" section.
