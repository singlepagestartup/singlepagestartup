# Telegram Blocked Recipient Notification Error Plan

## Overview

Handle Telegram blocked-recipient delivery failures as terminal notification errors instead of repeated provider failures, and perform the requested one-off RBAC/subscription cleanup for the affected restored-production subject.

## Current State Analysis

Direct notification delivery currently propagates grammY `sendMessage` failures from the Telegram provider through `POST /api/notification/notifications/:id/send` and `POST /api/rbac/subjects/:id/notify`. The notification model exposes only `new`, `sent`, and `read` statuses, and `send()` skips all non-`new` notifications, so adding a terminal `error` status is enough to prevent retries without changing the database schema.

The restored API database is `doctorgpt-production` from `apps/api/.env`, and the affected subject has one active `free-subscription` order in `delivering`. Research confirmed that `canceling` is the non-final order status that lets RBAC subject check remove product roles and finalize to `canceled`.

## Desired End State

When Telegram returns the blocked-bot recipient error during notification delivery, the notification row is updated to `status: "error"` and future send attempts return the existing notification without calling the provider again. Other provider errors still propagate. The affected subject's current RBAC role relations are removed, and its active subscription order is moved to `canceling` so the existing RBAC subject check/proceed flow can finish the cancellation.

### Key Discoveries:

- `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:865` is the normal Telegram `sendMessage` dispatch point.
- `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:947` already prevents provider calls for any notification whose status is not `new`.
- `libs/modules/notification/models/notification/sdk/model/src/lib/index.ts:19` is the exported notification status list and currently lacks `error`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/notify.ts:220` directly calls notification send and currently receives the propagated 403.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:347` handles `canceling` orders by removing product roles and later marking the order `canceled`.
- `apps/api/.env:20` points local API/runtime DB work at `doctorgpt-production`, not the container default `sps-lite`.

## What We're NOT Doing

- Not changing Telegram bot credentials, grammY setup, or the host Telegram template generator.
- Not swallowing all Telegram/provider failures; only the blocked-recipient error becomes a terminal notification error.
- Not adding a retry queue or new scheduler behavior.
- Not changing Drizzle table schema or generating migrations; notification `status` is stored as text.
- Not editing repository snapshot data under `backend/repository/database/src/lib/data`.
- Not turning this into a broad user-deactivation workflow beyond the explicitly identified subject/order cleanup.

## Implementation Approach

Keep the runtime change inside the notification model service where provider delivery already happens. Add a small blocked-recipient classifier, catch provider failures at the `send()` boundary, update the notification to `error` only for the Telegram blocked-bot case, and rely on the existing non-`new` guard to prevent future sends. Keep RBAC notify behavior unchanged except that it now receives the non-throwing terminal result for this one provider outcome.

Handle the affected user's data as a separate explicit data-management step against `doctorgpt-production`, with preflight and postflight checks recorded in implementation notes. The cleanup should remove all subject-role relation rows for the subject and update only the active subscription order to `canceling`.

## Phase 1: Terminal Notification Error State

### Overview

Introduce `error` as a valid notification status and make blocked-recipient Telegram delivery persist that terminal state.

### Changes Required:

#### 1. Notification Status Contract

**File**: `libs/modules/notification/models/notification/sdk/model/src/lib/index.ts`  
**Why**: This is the exported status list used by notification consumers and tests.  
**Changes**: Add `error` to the notification statuses list.

#### 2. Notification Send Service

**File**: `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts`  
**Why**: This service owns provider dispatch, status updates, and the non-`new` retry guard.  
**Changes**: Add a focused classifier for the Telegram blocked-bot error message/status. In `send()`, catch provider failures, update the current notification to `status: "error"` for that classifier, and return the updated notification. Preserve current behavior for all other provider errors.

#### 3. RBAC Notify Compatibility

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/notify.ts`  
**Why**: Direct RBAC notify currently receives notification send results and pushes non-null results into the response.  
**Changes**: No primary logic change expected. Verify that an `error` notification returned from notification send is included in the response and no longer causes the RBAC notify route to throw the blocked-bot 403.

### Success Criteria:

#### Automated Verification:

- [ ] `npm run test:file -- libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.spec.ts`
- [ ] `npm run test:file -- libs/modules/notification/models/notification/backend/app/api/src/lib/controller/singlepage/send/index.spec.ts`
- [ ] `npx nx run @sps/notification:jest:test`

#### Manual Verification:

- [ ] A notification with `status: "error"` is skipped by future `send()` calls because it is not `new`.
- [ ] A non-blocked provider failure still propagates as an error.

---

## Phase 2: Regression Tests

### Overview

Add focused BDD coverage for the blocked-recipient case and the non-blocked error path.

### Changes Required:

#### 1. Notification Send Service Tests

**File**: `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.spec.ts`  
**Why**: Existing tests already cover missing, expired, and valid notification send behavior.  
**Changes**: Add BDD scenarios for:

- A new ready notification whose provider throws Telegram blocked-bot 403 is updated to `error` and returned.
- A notification already in `error` status returns without provider delivery.
- A different provider error still rejects and does not mark the notification as `error`.

#### 2. Optional Controller Assertion

**File**: `libs/modules/notification/models/notification/backend/app/api/src/lib/controller/singlepage/send/index.spec.ts`  
**Why**: The controller already verifies nullable no-op responses.  
**Changes**: Add or adjust a narrow assertion only if the service return shape needs controller-level coverage for `status: "error"`.

### Success Criteria:

#### Automated Verification:

- [ ] BDD Suite and BDD Scenario headers remain present in all modified test files.
- [ ] Focused notification tests pass through `npm run test:file`.

#### Manual Verification:

- [ ] Test names describe behavior rather than implementation internals.

---

## Phase 3: Affected Subject Data Cleanup

### Overview

Apply the one-off cleanup requested for the restored-production subject after the runtime behavior is ready.

### Changes Required:

#### 1. Preflight Data Check

**Target DB**: `doctorgpt-production`  
**Why**: Research found the production-copy rows only in this database, not the default `sps-lite` database.  
**Changes**: Before mutating, verify subject `2bd15ae9-8d22-4c70-a878-a4ca1b152fdf`, its subject-role relation rows, and active order `bd8fa452-ed0e-4f87-8d4e-52bb4643d8a8` still match the research state.

#### 2. Subject Role Cleanup

**DB table/relation**: `sps_rc_ss_to_rs_3nw` / RBAC `subjects-to-roles`  
**Why**: The user requested removing all `rbac.role` assignments for this user.  
**Changes**: Delete all subject-role relation rows for subject `2bd15ae9-8d22-4c70-a878-a4ca1b152fdf`. Research identified five rows at planning time:

- `db869ba2-6158-4af6-8e8c-d360d15b92fd`
- `33faeb5b-e721-43ce-9e54-d5e9e7dbecd3`
- `a6b789aa-4c1e-49e6-9d89-4b816e0ea982`
- `43e846bd-b47e-4200-a7ba-724e374cc626`
- `a0cf9e63-65da-44ca-96e4-4ca8a2d2fd00`

#### 3. Active Subscription Cancellation Handoff

**DB table/model**: `sps_ee_order` / ecommerce order  
**Why**: The active subscription order grants the `Free Subscriber` product role and should be handed to RBAC proceed for final cleanup.  
**Changes**: Update order `bd8fa452-ed0e-4f87-8d4e-52bb4643d8a8` from `delivering` to `canceling`. Do not update already `canceled` or `completed` historical orders.

#### 4. Postflight Agent Check

**Endpoint/flow**: RBAC subject check/proceed  
**Why**: Existing proceed logic is responsible for final `canceling` -> `canceled` handling.  
**Changes**: Run the scoped RBAC subject check for subject `2bd15ae9-8d22-4c70-a878-a4ca1b152fdf` if available, or run the normal RBAC subject check agent endpoint. Verify the active order becomes `canceled` and product-granted roles remain absent.

### Success Criteria:

#### Automated Verification:

- [ ] Preflight query confirms the target subject and active order before mutation.
- [ ] Postflight query confirms zero subject-role relation rows for the target subject.
- [ ] Postflight query confirms order `bd8fa452-ed0e-4f87-8d4e-52bb4643d8a8` is `canceled` after RBAC subject check runs.

#### Manual Verification:

- [ ] No repository snapshot files were edited for the cleanup.
- [ ] The data cleanup transcript records target database, rows changed, and postflight state.

---

## Testing Strategy

### Unit Tests:

- Notification send service blocked-recipient classification.
- Terminal `error` status skip behavior.
- Non-blocked provider error propagation.

### Integration/Runtime Checks:

- If local API services are running, call a controlled notification send path with a mocked or test-double provider where practical. Do not send real Telegram messages to production recipients during implementation verification.
- Run the scoped RBAC subject check after the data cleanup and verify final order/role state in `doctorgpt-production`.

### Manual Testing Steps:

1. Confirm `apps/api/.env` still points at `DATABASE_NAME=doctorgpt-production`.
2. Run preflight checks for the affected subject, subject-role rows, and active order.
3. Apply the data cleanup.
4. Run RBAC subject check/proceed.
5. Verify no subject-role rows remain and the active order is final `canceled`.

## Performance Considerations

The notification runtime change only adds one error classification and one update on a terminal provider failure. Normal successful sends and unrelated provider failures should stay on their current path. Data cleanup targets one subject and one active order.

## Migration Notes

No Drizzle migration is expected because notification `status` is a text column. If implementation discovers generated API schema artifacts that enumerate notification statuses, update those generated/source contract files consistently with the SDK status list.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-185.md`
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-185.md`
- Process log: `thoughts/shared/processes/singlepagestartup/ISSUE-185.md`

<!-- Last synced at: 2026-05-03T22:22:54Z -->
