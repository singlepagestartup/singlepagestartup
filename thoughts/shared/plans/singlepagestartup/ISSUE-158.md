# OpenRouter Two-Phase Token Billing Implementation Plan

## Overview

Implement request-scoped OpenRouter billing that keeps the existing `1`-token precharge, settles to exact usage after the provider calls complete, persists the billing trace on the generated assistant message, and blocks new generations only when the subject starts the request with a negative balance.

## Current State Analysis

The OpenRouter reaction route is still billed entirely before controller execution. Middleware invokes `authenticationBillRoute`, the RBAC bill-route service immediately subtracts the configured route amount, and the request is rejected unless the subject already has enough balance for that full pre-bill amount. Inside the OpenRouter controller, classification, model selection, repair/fallback, and final generation can each trigger provider calls, but the shared OpenRouter wrapper currently returns only parsed `text` and `images`, so exact usage and cost data are discarded before settlement can happen. The final assistant message is written without `metadata`, even though the social message schema already supports it. Agent-side fallback behavior for insufficient balance is already in place and should remain unchanged.

## Desired End State

After implementation:

- the OpenRouter reaction route still precharges exactly `1` internal token through the existing middleware/bill-route entry point;
- a request is allowed when the subject starts with balance `>= 0`, even if the precharge moves the balance below zero;
- any subsequent OpenRouter generation attempt fails immediately while the current balance is already below zero;
- every OpenRouter call made during one request, including classifier/model-selector repair retries, contributes to one request-scoped usage ledger;
- exact settlement uses `exactTokens = ceil(totalUsd / 0.001)` and performs full reconciliation against the initial `1`-token precharge;
- the final assistant message persists `metadata.openRouter.billing` with precharge, exact charge, delta, USD totals, selected model, and per-call usage/cost details;
- the existing “not enough tokens” agent reply path remains the user-facing behavior for missing balance access.

### Key Discoveries

- Billing middleware still precharges before route execution and has no active post-response settlement path ([bill-route/index.ts:47](/Users/rogwild/code/singlepagestartup/sps-lite/libs/middlewares/src/lib/bill-route/index.ts:47), [bill-route/index.ts:75](/Users/rogwild/code/singlepagestartup/sps-lite/libs/middlewares/src/lib/bill-route/index.ts:75)).
- The OpenRouter route permission is already configured to cost `1` token, so the precharge amount does not need a seed change ([b8633f18-26cb-4720-a980-32f4f62f3728.json:8](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/relations/permissions-to-billing-module-currencies/backend/repository/database/src/lib/data/b8633f18-26cb-4720-a980-32f4f62f3728.json:8)).
- The RBAC bill-route service currently requires `balance >= route amount` before debit and immediately updates the subject currency row, which prevents the “first request may move balance negative” rule today ([bill-route.ts:185](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/bill-route.ts:185), [bill-route.ts:224](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/bill-route.ts:224)).
- OpenRouter model metadata already exposes pricing fields (`prompt`, `completion`, `request`, `image`, `web_search`, `internal_reasoning`, `input_cache_read`), but the wrapper strips response usage/cost data down to parsed message text/images only ([interface.ts:35](/Users/rogwild/code/singlepagestartup/sps-lite/libs/shared/third-parties/src/lib/open-router/interface.ts:35), [open-router/index.ts:221](/Users/rogwild/code/singlepagestartup/sps-lite/libs/shared/third-parties/src/lib/open-router/index.ts:221), [open-router/index.ts:264](/Users/rogwild/code/singlepagestartup/sps-lite/libs/shared/third-parties/src/lib/open-router/index.ts:264)).
- The OpenRouter controller makes multiple provider calls in one request before it creates the final assistant message, so settlement must aggregate more than the winning generation call ([react-by-openrouter.ts:756](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:756), [react-by-openrouter.ts:807](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:807), [react-by-openrouter.ts:871](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:871), [react-by-openrouter.ts:956](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:956)).
- The social message layer already supports JSON metadata both in the DB field definition and in the zod insert/select schemas, so metadata persistence should not require a migration ([singlepage.ts:17](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/social/models/message/backend/repository/database/src/lib/fields/singlepage.ts:17), [index.ts:6](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/social/models/message/backend/repository/database/src/lib/index.ts:6)).
- Agent-side OpenRouter fallback already maps billing failures to the existing “not enough tokens” reply flow, so billing internals can change without changing the UX contract ([agent/index.ts:1435](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1435), [agent/index.ts:1453](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1453)).
- Issue-specific backend coverage in this repository already uses BDD scenario files under `apps/api/specs/scenario/singlepagestartup`, which is the right pattern to extend for issue `158` ([backend-social-chat-threads.scenario.spec.ts:1](/Users/rogwild/code/singlepagestartup/sps-lite/apps/api/specs/scenario/singlepagestartup/issue-154/backend-social-chat-threads.scenario.spec.ts:1)).

## What We're NOT Doing

- No billing schema or currency-schema migration.
- No subscription/product-role refactor outside the OpenRouter reaction permission.
- No UI/copy change for Premium upsell or “not enough tokens” messages.
- No metadata backfill for previously generated assistant messages.
- No generalized settlement rollout for unrelated paid routes in this issue.

## Implementation Approach

Keep the current middleware entry point for the `1`-token precharge, but move exact reconciliation into the OpenRouter request flow where real provider usage is available. The shared OpenRouter wrapper should surface normalized usage and pricing inputs for each call attempt that actually reaches OpenRouter. The RBAC billing service should own both precharge and settlement balance mutations so the negative-balance guard, refund, and additional-charge logic use one consistent subject-currency update path. The OpenRouter controller should accumulate a per-request billing ledger across classification, selection, repair, and generation steps, settle it once, and persist the normalized billing trace onto the final assistant message.

## Phase 1: Expose Billable OpenRouter Usage

### Overview

Extend the OpenRouter integration so the controller can accumulate exact billable inputs for every provider call made during one request.

### Changes Required

#### 1. Shared OpenRouter response contract

**Files**:

- `libs/shared/third-parties/src/lib/open-router/index.ts`
- `libs/shared/third-parties/src/lib/open-router/interface.ts`

**Why**: the current wrapper discards the provider usage/cost payload that exact settlement depends on.
**Changes**:

- return structured generation results that keep parsed content plus normalized usage/billing fields from the OpenRouter response;
- preserve the billing data for retry/repair calls, not only the final parsed message body;
- expose enough pricing context to compute USD totals from usage, including token-based and request/image charges.

#### 2. Request-scoped usage ledger in the OpenRouter controller

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`

**Why**: the controller executes classification, model selection, repair, and generation calls in one request, so it is the only place that can aggregate them into one settlement.
**Changes**:

- record each OpenRouter call attempt that actually runs, including classifier/model-selector retries and fallback generation attempts;
- normalize successful calls into one request ledger with model id, call purpose, usage, USD subtotal, and error/fallback annotations where relevant;
- compute `totalUsd`, `exactTokens`, and the settlement delta against the initial `1`-token precharge using the approved interpretation that all OpenRouter calls in the request count toward settlement.

### Success Criteria

#### Automated Verification

- [ ] `npx nx run @sps/shared-third-parties:tsc:build` passes.
- [ ] `npx nx run @sps/rbac:tsc:build` passes with the updated OpenRouter response types.

#### Manual Verification

- [ ] A single OpenRouter request produces one in-memory billing ledger that includes classifier, selector, retry/repair, and winning generation calls.
- [ ] Exact token calculation is derived from aggregated USD totals rather than fixed route pricing.

---

## Phase 2: Precharge Guard And Exact Settlement

### Overview

Refactor balance enforcement so the first request can cross below zero, later requests are blocked while negative, and post-response settlement can refund or add the remaining delta.

### Changes Required

#### 1. Scope the negative-balance guard to the OpenRouter route

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/bill-route.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/bill-route/index.ts`

**Why**: current bill-route behavior rejects the request unless the subject already has enough balance for the whole route amount.
**Changes**:

- keep the existing permission/currency matching logic and the configured `1`-token precharge amount;
- change OpenRouter precharge eligibility from “balance must cover the full route amount” to “balance must not already be below zero”;
- preserve the current validation failures for subjects with no matching billing currency relation.

#### 2. Add settlement balance mutation after provider usage is known

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/bill-route.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`

**Why**: exact settlement must happen after the request has consumed provider usage, not in middleware.
**Changes**:

- add an explicit settlement path that can refund or apply an additional debit without re-running the “already negative” gate;
- invoke settlement from the OpenRouter controller once the request ledger is complete, including the case where usage was consumed but final message persistence fails;
- keep the balance error shape aligned with the existing agent fallback behavior so downstream UX remains unchanged.

### Success Criteria

#### Automated Verification

- [ ] `npx nx run @sps/rbac:jest:test` passes with updated billing service coverage.
- [ ] `npx nx run @sps/agent:jest:test` passes with unchanged insufficient-balance UX behavior.

#### Manual Verification

- [ ] A subject starting at `0` balance can run one OpenRouter request and end with a negative balance after precharge/settlement.
- [ ] A subject starting with a negative balance is rejected before a new OpenRouter request begins.
- [ ] Settlement refunds when exact usage is below `1` token and applies an extra debit when exact usage exceeds `1` token.

---

## Phase 3: Persist Billing Metadata And Add BDD Coverage

### Overview

Persist the final billing trace on the assistant message and add focused automated coverage for the conversion, guard, settlement, and metadata behaviors.

### Changes Required

#### 1. Write `metadata.openRouter.billing` on the generated assistant message

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`
- `libs/modules/social/models/message/backend/repository/database/src/lib/fields/singlepage.ts`
- `libs/modules/social/models/message/backend/repository/database/src/lib/index.ts`

**Why**: the issue requires message-level usage persistence, and the schema already supports JSON metadata.
**Changes**:

- attach normalized billing metadata to the final assistant message payload;
- include at minimum the precharge amount, exact token amount, delta, USD totals, selected model id, and per-call usage entries;
- keep schema/type handling aligned so the metadata payload passes existing message repository validation without a migration.

#### 2. Add issue-specific BDD coverage

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/*.spec.ts`
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.spec.ts`
- `apps/api/specs/scenario/singlepagestartup/issue-158/*.spec.ts`

**Why**: the issue defines concrete billing invariants that should be locked down with repository-standard BDD tests.
**Changes**:

- add unit coverage for USD-to-token conversion and settlement delta calculation;
- add service/controller coverage for “first request may go negative” and “subsequent request while negative is blocked”;
- add scenario coverage that verifies the final assistant message persists the expected `metadata.openRouter.billing` shape.

### Success Criteria

#### Automated Verification

- [ ] `npx nx run @sps/rbac:jest:test` passes with new settlement coverage.
- [ ] `npx nx run @sps/agent:jest:test` passes with updated fallback assertions.
- [ ] `npx nx run api:jest:test --testPathPattern=issue-158` passes for the new scenario spec.

#### Manual Verification

- [ ] The final generated assistant message contains the expected `metadata.openRouter.billing` payload.
- [ ] Metadata reflects the same exact token totals used for balance settlement.
- [ ] Existing user-facing “not enough tokens” replies still appear when a new request is attempted from a negative balance.

## Testing Strategy

### Unit Tests

- Validate `totalUsd -> exactTokens` conversion with rounding-up behavior at boundary values.
- Validate settlement deltas for refund, no-op, and additional-debit cases.
- Validate the negative-balance guard only blocks requests that start below zero.

### Integration Tests

- Exercise the OpenRouter reaction path through the RBAC subject controller with a request-scoped billing ledger and exact settlement.
- Verify agent fallback behavior still emits the existing insufficient-balance reply for blocked follow-up requests.

### Manual Testing Steps

1. Seed or select a subject with a small non-negative token balance and trigger one OpenRouter generation.
2. Confirm the request succeeds, the balance reflects precharge plus exact settlement, and the final assistant message includes `metadata.openRouter.billing`.
3. Trigger another generation after the balance is negative and confirm the request is rejected with the existing “not enough tokens” UX path.
4. Repeat with a low-usage request to confirm settlement can refund part of the `1`-token precharge.

## Performance Considerations

- Avoid fetching or recomputing model pricing separately for every OpenRouter sub-call; keep pricing lookup cached per request or reuse shared model metadata.
- Keep settlement writes limited to the single subject currency row touched by the request.
- Avoid duplicating large raw provider payloads in message metadata; persist only the normalized billing trace needed for audit/debugging.

## Migration Notes

- No DB migration is required for this issue.
- The OpenRouter permission seed should remain at `amount: "1"` so precharge behavior stays consistent.
- Existing subjects that are already negative will be blocked from new OpenRouter generations until their balance is restored; this is expected behavior after the guard change.
- Existing assistant messages will remain without billing metadata unless they are generated after this implementation lands.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-158.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-158.md`
- Related prior implementation context: `thoughts/shared/plans/singlepagestartup/ISSUE-154.md`
