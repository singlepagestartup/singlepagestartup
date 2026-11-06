Closes #357.

## Summary

Order fulfilment grants a product's roles and top-up balances for an order in `paid`, and re-grants missing roles for an order in `delivering`. It now does both only when the order's payment is confirmed: a payment intent linked to the order is `succeeded` and carries an invoice in `paid`. Every payment path writes both records, so purchases, renewals, Telegram Stars and free products are fulfilled as before. An order in `paid` or `delivering` without them keeps its status and is logged once, so an operator can check it. An offline payment is recorded in billing, as the subject README describes, and is then fulfilled.

## Changes

- **Confirmation.** `isPaymentConfirmed` in `service/singlepage/ecommerce/order/proceed.ts` answers whether a payment intent linked through `orders-to-billing-module-payment-intents` is `succeeded` and has an invoice in `paid` through `payment-intents-to-invoices`. It reads the intents and invoices that `findByIdExtended` already loads, so there is no new query.
- **Both grant points.** `fromPaidStatus` returns before any grant, credit, status change or notification when the payment is not confirmed. The `delivering` branch skips its role grant under the same condition.
- **Log once.** `reportUnconfirmedPayment` logs `orderId`, `orderStatus` and `subjectId` with `logger.error` once per order and status for the life of the API process, so the minute-by-minute check does not repeat it. The service is a singleton, like its existing `processingOrderIds` set.
- **Offline payments.** The subject README gains "Ecommerce Order Fulfilment" and "Recording an offline payment". The admin sets the order's invoice to `paid` and its payment intent to `succeeded`, creating and linking them first when the order has none; the next order check and fulfilment run do the rest. A one-step action for this is #359.
- **Specs** in `proceed.spec.ts`:
  - granted with both records;
  - not granted with a succeeded intent and no paid invoice, with a paid invoice on an intent that did not succeed, or with no intent;
  - reported once across two runs;
  - accepted records for a provider purchase, Telegram Stars, the dummy provider, a zero-amount free subscription, a subscription with an open renewal invoice, and a failed attempt followed by a successful payment;
  - the `delivering` branch with and without the records.
- **Unchanged.** The ecommerce order check, the billing webhooks, the `delivered` and `canceling` branches (the balances the `canceling` branch resets are #360), the statuses, the schema and the admin panel. PayKeeper's webhook is tracked by #230.

## Verification

- [x] `npx nx run @sps/rbac:jest:test`: 82 suites, 393 tests pass (`proceed.spec.ts` 21, 13 of them new).
- [x] `npx nx run @sps/rbac:eslint:lint`: pass, no warnings.
- [x] `npx tsc --noEmit -p libs/modules/rbac/tsconfig.json`: no errors.
- [x] `node tools/agents/code-placement.mjs`: clean.
- [x] Mutation checks, each failing at least one scenario:
  - removing the confirmation from `fromPaidStatus` fails its four refusal scenarios;
  - removing it from the `delivering` branch fails that branch's refusal scenario;
  - accepting a succeeded intent without a paid invoice fails one scenario;
  - accepting a paid invoice without a succeeded intent fails one scenario.
- [x] Merge simulation (`git merge-tree`) with the branches of #339, #346, #350, #353 and #356: clean.
- [x] HTTP on port 4357 against a fresh throwaway copy of the development database, with the operator secret standing in for the scheduled calls:
  - **Dummy-provider purchase:** webhook, order check and subject check fulfil it (`pro-subscriber`, 300 `token`, order `delivering`), as before.
  - **Cart order set to `paid` without billing records:** two subject checks grant nothing and the order stays `paid`.
  - **Cart order set to `delivering` without billing records:** no role granted.
  - **Telegram free-subscription route:** the zero-amount invoice is paid, and the order is fulfilled (`free-subscriber`, 10 `token`, `delivering`).
  - **Offline payment through the admin routes, order without billing records:** a `succeeded` intent and a `paid` invoice created and linked; the next subject check fulfils it.
  - **Offline payment, order awaiting payment:** its invoice set to `paid` and intent to `succeeded`; the order check marks it `paid` and the subject check fulfils it.
  - **Logs:** the API logged exactly two unconfirmed orders, once each, with order id, status and subject id.
  - **Unrelated 500:** in this run the order check answered 500 while generating a receipt through the host application, which was unreachable by design, after it had already written `paid`.
- [ ] Browser check of the admin panel procedure. Not run: the host does not build on the worktree's symlinked `node_modules`. The HTTP run drives the same admin routes the forms call.

## Notes

- Unconfirmed orders stay among the 100 candidates the fulfilment check reads each run.

## Downstream migration

- **Orders marked by hand.** Projects that mark orders `paid` or `delivering` by hand, or create orders through their own flows without billing records, record the payment in billing first: a payment intent in `succeeded` with a `paid` invoice, linked to the order, as the subject README describes. Alternatively, override `isPaymentConfirmed` in a subclass bound to `SubjectDI.IEcommerceOrderProceedService`.
- **After deployment.** Look for "skipped an order without a confirmed payment" in the API log and record the payment for any listed order that was actually paid.

_Verify:_ an order paid through a provider is fulfilled as before; an order marked `paid` without billing records is not fulfilled and is logged once; an offline payment recorded in billing leads to fulfilment on the next check.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
