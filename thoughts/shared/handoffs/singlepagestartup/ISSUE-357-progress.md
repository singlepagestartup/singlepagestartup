---
issue_number: 357
issue_title: "Order fulfilment: confirm the payment before granting products"
start_date: 2026-09-26T20:40:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-357.md
status: in_progress
---

# Implementation Progress: ISSUE-357 - Order fulfilment: confirm the payment before granting products

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-357.md`

## Phase Progress

### Phase 1: Payment confirmation in fulfilment

- [x] Started: 2026-09-26T20:40Z
- [x] Completed: 2026-09-26T20:43:24Z
- [x] Automated verification: `proceed.spec.ts` 21/21 (13 new scenarios). Mutation checks: without the confirmation in `fromPaidStatus` its four refusal scenarios fail; without it in the `delivering` branch that branch's refusal scenario fails; accepting a succeeded intent without a paid invoice fails one scenario, and accepting a paid invoice without a succeeded intent fails another. Source restored after each check.

**Notes**: `isPaymentConfirmed` reads the payment intents and invoices already in the extended order, so no query is added. `reportUnconfirmedPayment` keys its instance set by order id and status, so an order meeting the check again in the same status is not reported twice. The `delivering` branch skips to the next subject link with `continue`. The subject README gains "Ecommerce Order Fulfilment" with "Recording an offline payment".

### Verification

- Unit lane (`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/rbac:jest:test --skip-nx-cache`): 82 suites / 393 tests passed.
- Lint (`NODE_OPTIONS=--max-old-space-size=12288 npx nx run @sps/rbac:eslint:lint --skip-nx-cache`): passed, no warnings.
- Types (`npx tsc --noEmit -p libs/modules/rbac/tsconfig.json`): 0 errors.
- Placement (`node tools/agents/code-placement.mjs`): no same-name file and folder pairs.
- HTTP after the change: API from this worktree on port 4357 against a fresh `pg_dump` copy of the development database (351 tables, restore without errors), with the host URLs on a closed port and the Telegram, bug-report and SES credentials blanked. The operator secret stands in for the scheduled calls.
  - Dummy-provider purchase: webhook (intent `succeeded`, invoice `paid`), order check (`paid`), subject check: `pro-subscriber` and a 300 `token` balance granted, order `delivering`.
  - Cart order set to `paid` with no payment record: two subject checks grant nothing and the order stays `paid`.
  - Cart order set to `delivering` with no payment record: the subject check grants no role.
  - Telegram free-subscription route: zero-amount invoice `paid`, intent `succeeded`, order `paid`; the subject check grants `free-subscriber` and a 10 `token` balance, order `delivering`.
  - Offline payment, order without payment records: a `succeeded` intent and a `paid` invoice created and linked through the admin routes (201 each); the next subject check grants `pro-subscriber` and 300 `token`, order `delivering`.
  - Offline payment, order awaiting payment: its invoice set to `paid` and its intent to `succeeded` (200 each); the order check moves it to `paid`, and the subject check grants the same.
  - The API logged exactly two unconfirmed orders, once each, with order id, status and subject id: the `paid` order (checked twice) and the `delivering` order.
  - The order check answered 500 for the order awaiting payment although it moved the order to `paid`: the move from `paying` to `paid` generates a receipt through the host application, which was unreachable by design in this run. The free-subscription order logged the same receipt error. This is outside the change.
- Cleanup: API stopped, the throwaway database dropped, scratch files holding tokens removed. The development database was only read by `pg_dump`.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 1 -->

### Incident 1 — The session restarted and cleared the scratchpad

- **Occurrences**: 1
- **Stage**: Research
- **Symptom**: after a usage-limit interruption the helper scripts from earlier issues were gone.
- **Root Cause**: the scratchpad is tied to the session and was reset when the session restarted.
- **Fix**: recreated the launcher and the proof script from scratch; the proof scripts create fresh subjects on each run, so no state needed recovering.
- **Reusable Pattern**: keep proof scripts self-contained (fixtures created per run) so a lost scratchpad costs only the file.

## Summary

### Changes Made

- `proceed.ts`: `isPaymentConfirmed` and `reportUnconfirmedPayment`; `fromPaidStatus` and the `delivering` branch grant only for an order with a confirmed payment.
- `proceed.spec.ts`: 13 new scenarios; `createService` accepts an extended order and product role ids.
- Subject README: fulfilment and recording an offline payment.

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [ ] All phases completed
- [ ] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-26T20:43:24Z
