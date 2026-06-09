# OpenRouter Final Generation Fallback Implementation Plan

## Overview

Make the Telegram/OpenRouter failure path deterministic: final answer generation should have one primary attempt and one terminal fallback/normalization attempt, and the chat user must receive one visible error/fallback message when both fail.

## Current State Analysis

The restored production database confirms the reported incident was not silent: the user received an OpenRouter error message in the same Telegram thread after the downstream OpenRouter route failed. The current checkout already differs from the production stack trace because the RBAC `react-by-openrouter` handler updates the existing progress/status message with `openRouterError` and returns JSON when all generation candidates fail. However, the final generation path still disables the shared OpenRouter non-text stripping retry, so the production context-overflow shape can fail before the existing one-shot transport fallback is allowed to help. The final answer path also treats model-candidate retries as the fallback mechanism, which makes the terminal error look like a multi-model failure instead of a single primary result plus one explicit fallback/normalization result.

## Desired End State

After implementation:

- Telegram/OpenRouter users are never left with only a progress message and no terminal update.
- Final answer generation has a clearly named terminal fallback contract: one primary generation attempt, then one fallback/normalization attempt if the primary result is not normal.
- A fatal OpenRouter generation failure is reached only after the primary result is not usable and that single fallback cannot produce a valid text/image response.
- The RBAC handler and agent catch path do not produce duplicate user-facing OpenRouter error messages for the same failed reply.
- The production multimodal context-overflow class uses the existing non-text stripping fallback when applicable.

Implementation note: the final RBAC terminal path writes the user-visible OpenRouter error update first, then throws a marked fatal error for observability. The agent service suppresses duplicate fallback chat messages when that marker is present.

### Key Discoveries

- The final generation call currently passes `stripNonTextOnRetry: false`, disabling the shared one-shot retry that strips non-text payloads after provider errors ([react-by-openrouter.ts:1023](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1023), [open-router/index.ts:567](/Users/rogwild/code/singlepagestartup/sps-lite/libs/shared/third-parties/src/lib/open-router/index.ts:567)).
- The current all-candidates-failed branch settles billing, updates the existing status message with `No valid model response received...`, and returns JSON rather than throwing ([react-by-openrouter.ts:1065](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1065)).
- Final response validation only checks expected text/image presence; invalid final output is handled by moving to the next candidate, not by one explicit fallback/normalization step ([react-by-openrouter.ts:1043](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1043), [react-by-openrouter.ts:1941](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1941)).
- After a successful generation, later formatting still has throw paths for missing image URL or empty description; those should be covered by the same terminal fallback contract rather than becoming surprising downstream errors ([react-by-openrouter.ts:1118](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1118), [react-by-openrouter.ts:1156](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1156)).
- The agent service already has a recoverable OpenRouter error path that creates a thread/chat error message and returns for `No valid model response received` and related provider failures ([agent/index.ts:214](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:214), [agent/index.ts:1925](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1925)).
- Current tests cover thread context selection and agent recoverable errors, but no test directly locks the RBAC terminal final-generation failure branch or the shared OpenRouter non-text retry ([react-by-openrouter.spec.ts:1](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts:1), [open-router-reply.spec.ts:1](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/open-router-reply.spec.ts:1)).

## What We're NOT Doing

- No Telegram adapter refactor; Telegram is only the transport and the reply behavior is owned by agent/RBAC/social/notification layers.
- No repository data snapshot edits or database seed changes.
- No model-router redesign beyond the final answer failure/fallback contract.
- No copy rewrite for existing OpenRouter progress/error messages unless needed for a deterministic test assertion.
- No new background job or queue behavior.

## Implementation Approach

Keep classification and model-selection repair behavior separate from final answer generation. In the RBAC OpenRouter handler, introduce one small final-generation result path that records the primary generation result, runs exactly one fallback/normalization attempt when that result is not usable, validates the final normalized result once, and then either creates the assistant reply or performs one terminal user-facing OpenRouter error update. Use the existing shared OpenRouter wrapper for the production multimodal overflow fallback instead of adding another independent retry layer. Keep the agent-level catch as the safety net for thrown downstream failures, but make tests prove it does not create a second message when RBAC already returned a terminal status message.

## Phase 1: Lock The Existing User-Facing Failure Contract

### Overview

Add focused tests that document the current Telegram-visible behavior and prevent silent or duplicate OpenRouter failures.

### Changes Required

#### 1. RBAC terminal failure coverage

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts`

**Why**: the current non-throwing all-generation-failed branch is the main protection against silent Telegram failures, but it has no direct test coverage.

**Changes**:

- add a BDD scenario where final generation cannot produce a valid response;
- assert the existing status/progress message is updated with `openRouterError` and the route returns the updated message payload;
- assert no successful assistant reply is created after the terminal error update.

#### 2. Agent recoverable failure coverage

**File**: `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/open-router-reply.spec.ts`

**Why**: if RBAC throws before returning a terminal message, the agent fallback is the last user-facing protection.

**Changes**:

- keep the existing recoverable error coverage;
- add/adjust assertions for `No valid model response received` specifically;
- assert the fallback creates one thread/chat error message and resolves without failing the Telegram webhook.

### Success Criteria

#### Automated Verification

- [x] `npx nx run @sps/rbac:jest:test --testFile=libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts` passes.
- [x] `npx nx run @sps/agent:jest:test --testFile=libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/open-router-reply.spec.ts` passes.

#### Manual Verification

- [ ] The production database observation remains true for the sampled incident shape: the user sees a terminal OpenRouter error message, not only the initial progress message.

---

## Phase 2: Implement One Terminal Final-Generation Fallback

### Overview

Replace the ambiguous final-generation candidate fallback behavior with a single terminal fallback/normalization contract around the selected final answer result.

### Changes Required

#### 1. Final generation helper in RBAC handler

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`

**Why**: final response validation, fallback reason collection, billing ledger annotation, and terminal error handling are currently split across the candidate loop and later response formatting.

**Changes**:

- introduce a focused final-generation helper or equivalent local flow that owns primary result, fallback result, validation, and terminal failure reason composition;
- make the primary attempt use the selected final model rather than treating every configured candidate as an implicit fallback chain;
- run one fallback/normalization attempt when the primary result is an OpenRouter error or is not valid for the expected output modality;
- validate image URL/text description before deleting the status message so missing image/empty text cannot bypass the terminal fallback contract.

#### 2. Enable the existing OpenRouter multimodal retry where it belongs

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`
- `libs/shared/third-parties/src/lib/open-router/index.ts`

**Why**: the production log shows a multimodal context length overflow, and the shared wrapper already has one retry that strips non-text content after provider errors.

**Changes**:

- stop disabling `stripNonTextOnRetry` for final answer generation when the fallback contract allows the retry;
- keep the retry one-shot and observable through the existing billing ledger/fallback reason fields;
- avoid adding another retry layer that could make the final answer path exceed the one-fallback contract.

#### 3. Terminal failure response

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`

**Why**: the fatal condition must happen only after primary and fallback both fail, while Telegram still receives a clear terminal state.

**Changes**:

- centralize the terminal `No valid model response received...` message construction;
- update the existing status message once with the terminal OpenRouter error text when the failure is recoverable/user-facing;
- reserve thrown `HTTPException` behavior for the post-fallback fatal path and unexpected infrastructure failures, with billing settlement preserved.

### Success Criteria

#### Automated Verification

- [x] RBAC tests prove final generation makes one fallback attempt after a primary non-normal result.
- [x] RBAC tests prove fatal generation failure is reached only after the fallback result is also invalid or errored.
- [x] Shared OpenRouter tests prove non-text content is stripped once after a provider error when retry is enabled.

#### Manual Verification

- [ ] A multimodal request that exceeds provider context because of attached images can fall back to text-only context once.
- [ ] A failed fallback updates the user-visible OpenRouter status/error message exactly once.

---

## Phase 3: Deduplicate RBAC And Agent Error Messaging

### Overview

Ensure only one layer owns the user-facing error message for each failed OpenRouter reply attempt.

### Changes Required

#### 1. RBAC-returned terminal failure path

**File**: `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`

**Why**: when the RBAC route returns a terminal OpenRouter message, the agent should not treat that as a thrown downstream failure and create another error message.

**Changes**:

- keep successful RBAC terminal message returns as final outcomes for `openRouterReplyMessageCreate`;
- ensure agent catch only creates an error message when the RBAC route actually throws before returning a terminal message;
- keep `No valid model response received` in recoverable markers for compatibility with thrown downstream failures.

#### 2. Status/progress message lifecycle

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`

**Why**: the production sample had both a progress message and a separate error message; current code prefers updating the progress message for the all-generation-failed branch. The implementation should make one behavior intentional.

**Changes**:

- document through tests whether terminal RBAC failures update the progress message or create a separate error message;
- keep only that one user-facing terminal message for the RBAC-owned failure path;
- leave the agent-created separate error message as fallback only for thrown downstream failures.

### Success Criteria

#### Automated Verification

- [x] Agent tests show no duplicate message is created when the RBAC route resolves with a terminal OpenRouter message.
- [x] Agent tests show a thrown recoverable `No valid model response received` still creates one OpenRouter error message and returns.

#### Manual Verification

- [ ] For a failed final generation, the chat contains a single terminal OpenRouter error/update after the progress state.

---

## Phase 4: Targeted Regression Verification

### Overview

Run the smallest useful test set around the changed behavior and document the local verification path for the restored production database.

### Changes Required

#### 1. Shared OpenRouter retry coverage

**File**: `libs/shared/third-parties/src/lib/open-router/index.spec.ts`

**Why**: the production fix depends on the wrapper retry staying one-shot and only stripping non-text content when configured.

**Changes**:

- add BDD coverage for provider error followed by one stripped-context retry;
- assert the wrapper returns the retry success result when the stripped request succeeds;
- assert the wrapper returns a structured error result when the retry also fails.

#### 2. Verification notes in implementation progress

**File**: `thoughts/shared/handoffs/singlepagestartup/ISSUE-183-progress.md`

**Why**: implementation should preserve the production DB finding and avoid rediscovering the same reproduction path.

**Changes**:

- record the sampled production chat/message/thread IDs from research;
- record which targeted specs were run and whether direct project-scoped Nx commands were needed.

### Success Criteria

#### Automated Verification

- [x] `npx nx run @sps/shared-third-parties:jest:test --testFile=libs/shared/third-parties/src/lib/open-router/index.spec.ts` passes.
- [x] `npx nx run @sps/rbac:jest:test --testFile=libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts` passes.
- [x] `npx nx run @sps/agent:jest:test --testFile=libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/open-router-reply.spec.ts` passes.

#### Manual Verification

- [x] Restored DB sample still shows the historical user-facing Telegram error message for `10b234ba-b01a-4434-9e5c-b89ab247ba48`.
- [ ] A local simulated final-generation failure produces exactly one terminal user-facing error/update.

## Testing Strategy

### Unit Tests

- Shared OpenRouter wrapper: one non-text stripping retry after provider error, retry success, retry error.
- RBAC OpenRouter handler: primary result success, primary error plus fallback success, primary invalid plus fallback success, primary invalid plus fallback invalid terminal failure.
- Agent service: returned RBAC terminal message does not create an extra error message; thrown recoverable OpenRouter failure creates one error message and resolves.

### Integration Tests

- Keep integration scope focused on the RBAC handler and agent service seams. Do not add an end-to-end Telegram adapter test unless unit coverage cannot prove the message ownership contract.

### Manual Testing Steps

1. Query the restored `doctorgpt-production` local DB sample from research and confirm the historical Telegram-visible error message remains present.
2. Trigger or simulate the RBAC final generation path with multimodal context that causes provider context overflow.
3. Confirm the final generation path uses one fallback/normalization attempt.
4. Confirm the chat has one terminal OpenRouter error/update after fallback failure, or one assistant reply after fallback success.

## Performance Considerations

- The fix should reduce repeated provider calls by avoiding an indistinct multi-candidate terminal fallback chain.
- The one fallback attempt may still make one additional OpenRouter request when primary output is unusable; keep it bounded and testable.
- Do not persist large raw provider payloads or full prompt context in fallback diagnostics.

## Migration Notes

- No DB migration is required.
- No snapshot or seed data should be edited.
- Existing production rows remain historical evidence only; the runtime fix belongs in RBAC/agent/OpenRouter code and tests.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-183.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-183.md`
- Process log: `thoughts/shared/processes/singlepagestartup/ISSUE-183.md`
- Source issue: `https://github.com/flakecode/doctorgpt/issues/19`

<!-- Last synced at: 2026-05-03T22:34:58Z -->
