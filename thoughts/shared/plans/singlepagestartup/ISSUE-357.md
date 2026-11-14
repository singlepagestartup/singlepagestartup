---
date: 2026-09-26T20:31:31Z
issue_number: 357
repository: singlepagestartup
topic: "Order fulfilment: confirm the payment before granting products"
status: approved
---

# Order fulfilment: payment confirmation Implementation Plan

## Overview

Before fulfilment grants a product's roles or top-up balances, it confirms that the order was paid for: a payment intent linked to the order is `succeeded` and carries a `paid` invoice, which every automated payment path writes. An order in `paid` or `delivering` without that record is not granted, keeps its status, and is logged once. The `delivering` branch also grants roles, so it gets the same check. An offline payment is recorded in billing by an admin, so it passes the same check (see "Manual marking by an admin").

## Current State Analysis

- `fromPaidStatus` (`proceed.ts:599-784`) and the `delivering` branch (`proceed.ts:333-353`) grant on the order status alone.
- The ecommerce order check is the only writer of an order's `paid`, and it requires a linked `succeeded` payment intent (`find-by-id/check/index.ts:193-212`). `updatePaymentIntentStatus` is the only writer of `succeeded`, and every automated path writes the invoice `paid` before calling it (research, "Payment records per path").
- The extended order that fulfilment already loads carries each linked intent with its invoices (`find-by-id/extended.ts:246-465`), so the check needs no query.

## Desired End State

- `fromPaidStatus` grants roles, credits top-ups, advances the status and notifies only when the order has a linked payment intent in `succeeded` with at least one linked invoice in `paid`. Otherwise it returns without writing anything and logs `orderId`, `orderStatus` and `subjectId` once per API process and status.
- The `delivering` branch grants missing product roles under the same condition, with the same once-per-process log.
- Every automated path keeps working: provider purchases, Stripe renewals, Telegram Stars, the dummy provider in development, and zero-amount free subscriptions.

### Key Discoveries:

- The proceed service is a singleton, so an instance set lasts for the process, as `processingOrderIds` does (`proceed.ts:129`); projects can override the confirmation by rebinding `SubjectDI.IEcommerceOrderProceedService` to a subclass.
- Renewals add paid invoices to an intent that stays `succeeded`, and several orders of one checkout can share one intent; "any linked intent succeeded with any paid invoice" covers both.
- Requiring the invoice as well as the intent means the confirmation stands on two records written by the payment path, not one derived state.

## What We're NOT Doing

- No change to the ecommerce order check, the billing webhooks or `updatePaymentIntentStatus`; gating the dummy provider is #302, and provider-specific webhook issues stay with their own issues.
- No change to the `delivered` and `canceling` branches (they revoke; the balances the `canceling` branch resets are #360), to the order statuses, to the schema, or to the admin panel.
- No dedicated offline-payment action (#359).
- No new status for unconfirmed orders; the order keeps its status, so an admin sees it stay in `paid` and an operator sees the log line.
- The order stays among the 100 candidates each run; many unconfirmed orders could fill that batch. After #356 only an admin or an operator can create such an order, so this stays a known limitation.

## Manual marking by an admin

The admin panel lets an admin set an order to `paid` or `delivering` (free status select). That alone leaves no payment record, so fulfilment does not grant such an order. An offline payment is recorded in billing instead: the admin marks the order's payment intent `succeeded` and its invoice `paid` in the billing forms (creating and linking an intent and an invoice first when the order has none). The ecommerce order check then moves a `paying` order to `paid`, and fulfilment grants it. The subject README documents the procedure. A dedicated action that records an offline payment in one step is #359.

## Implementation Approach

A protected method on the proceed service decides whether the order's payment is confirmed; both granting branches call it first. A second protected method logs an unconfirmed order once per process through the shared `logger`. Everything else in the branches stays as it is.

## Phase 1: Payment confirmation in fulfilment

### Changes Required:

#### 1. Proceed service

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts`
**Changes**:

- A protected method, taking the extended order, that answers whether a linked payment intent is `succeeded` and has a linked invoice in `paid`.
- A protected method that logs an unconfirmed order with `logger.error` (`orderId`, `orderStatus`, `subjectId`) the first time the process meets that order in that status, remembered in an instance set.
- `fromPaidStatus` returns before any grant, write or notification when the payment is not confirmed.
- The `delivering` branch skips the role grant, with the same log, when the payment is not confirmed.

#### 2. Specs

**File**: `…/ecommerce/order/proceed.spec.ts`
**Changes**: `fromPaidStatus` grants with a succeeded intent and a paid invoice; does not grant, write or notify with no intent, with a succeeded intent without a paid invoice, or with a paid invoice on an intent that did not succeed; logs once across two runs; accepts a subscription intent whose renewal invoices include open ones, a zero-amount paid invoice, and an intent shared by two orders. The `delivering` branch grants a missing role only when the payment is confirmed. The `logger` mock gains the methods used.

#### 3. Documentation

**File**: `libs/modules/rbac/models/subject/README.md`
**Changes**: a short section on fulfilment: what counts as payment, what happens to an order without it, and how an offline payment is recorded so the order is fulfilled.

### Success Criteria:

#### Automated Verification:

- [x] `proceed.spec.ts` passes; without the confirmation the new scenarios fail.
- [x] `npx nx run @sps/rbac:jest:test`, `npx nx run @sps/rbac:eslint:lint`, `npx tsc --noEmit -p libs/modules/rbac/tsconfig.json` and `node tools/agents/code-placement.mjs` pass.

#### Manual Verification:

- [x] HTTP run (Testing Strategy) matches the Desired End State.

---

## Testing Strategy

### Manual Testing Steps:

1. Run the API from this worktree on port 4357 against a `pg_dump` copy of the development database, before and after the change.
2. A dummy-provider purchase: webhook, order check, subject check; the order is fulfilled.
3. A cart order set to `paid` with the operator secret and no payment: the subject check grants nothing, the order stays `paid`, and one log line names the order; a second check adds no line.
4. A cart order set to `delivering` with the operator secret and no payment: no role is granted.
5. The Telegram free-subscription route: the zero-amount invoice is paid, the order check marks the order `paid`, and the subject check fulfils it.
6. The offline-payment procedure through the admin routes with the operator secret: for the order from step 3, create a payment intent in `succeeded` and an invoice in `paid`, link them to each other and to the order; the next subject check fulfils it. For a checked-out order, mark its invoice `paid` and its intent `succeeded`; the order check and the subject check fulfil it.
7. Drop the throwaway database and stop the API.

## Performance Considerations

No query is added: the extended order already holds the intents and invoices. An unconfirmed order costs its extended load each run, as any candidate does.

## Migration Notes

Projects that mark orders `paid` or `delivering` by hand, or grant products from orders without billing records, must record the payment in billing first, or override the confirmation in a subclass bound to `SubjectDI.IEcommerceOrderProceedService`.

## References

- Original ticket: GitHub issue #357 (https://github.com/singlepagestartup/singlepagestartup/issues/357)
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-357.md`
