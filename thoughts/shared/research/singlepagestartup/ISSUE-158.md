---
date: 2026-04-14T00:41:30+0300
researcher: flakecode
git_commit: 720185e3929d268e4787b103fe74adae92dfa428
branch: issue-158
repository: singlepagestartup
topic: "Implement Two-Phase Token Billing for OpenRouter with Usage Settlement and Message Metadata"
tags: [research, codebase, openrouter, billing, tokens, social, agent, rbac]
status: complete
last_updated: 2026-04-14
last_updated_by: flakecode
---

# Research: Implement Two-Phase Token Billing for OpenRouter with Usage Settlement and Message Metadata

**Date**: 2026-04-14T00:41:30+0300
**Researcher**: flakecode
**Git Commit**: 720185e3929d268e4787b103fe74adae92dfa428
**Branch**: issue-158
**Repository**: singlepagestartup

## Research Question

Document the current OpenRouter message flow, route billing behavior, and message metadata baseline for issue #158, with emphasis on historical decisions already captured under `thoughts/shared` that relate to:

- OpenRouter message routing and thread continuity;
- billing and balance behavior around the OpenRouter path;
- token-accounting expectations and prior implementation notes;
- any prior thought artifacts that already define settlement, usage capture, or token economics.

## Summary

The historical thought trail that materially overlaps issue #158 is concentrated in the issue-154 ticket, research, plan, and progress artifacts. Those documents established the current OpenRouter runtime shape: replies are thread-scoped, the trigger message thread is resolved from `threads-to-messages`, legacy threadless messages are backfilled into the chat default thread, and agent-side fallback replies also propagate `threadId` ([thoughts/shared/research/singlepagestartup/ISSUE-154.md:128](thoughts/shared/research/singlepagestartup/ISSUE-154.md:128), [thoughts/shared/plans/singlepagestartup/ISSUE-154.md:185](thoughts/shared/plans/singlepagestartup/ISSUE-154.md:185), [thoughts/shared/handoffs/singlepagestartup/ISSUE-154-progress.md:32](thoughts/shared/handoffs/singlepagestartup/ISSUE-154-progress.md:32)).

The current codebase baseline for issue #158 matches that historical direction. The OpenRouter controller now creates status/final messages through the thread-scoped subject route and performs multiple OpenRouter calls in a single request: request classification, model selection, and final generation, with additional repair/fallback calls in classifier and selector helpers ([react-by-openrouter.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:703), [react-by-openrouter.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:756), [react-by-openrouter.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:807), [react-by-openrouter.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:871), [react-by-openrouter.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1245), [react-by-openrouter.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1434)).

Historical thoughts do not contain an earlier implementation note for exact usage-based settlement, USD-to-token conversion, or `metadata.openRouter.billing`. The only token-economics statement found in prior thoughts is the new issue-158 ticket itself, which defines `1 internal token = $0.001`, full reconciliation, and aggregation across all OpenRouter calls in one request ([thoughts/shared/tickets/singlepagestartup/ISSUE-158.md:16](thoughts/shared/tickets/singlepagestartup/ISSUE-158.md:16)).

## Detailed Findings

### 1. Historical OpenRouter Flow Decisions Live In ISSUE-154

Issue-154 research recorded the pre-cutover state: OpenRouter reply generation was chat-scoped, context was built from chat-linked messages, and agent/subject DI did not yet expose thread relations ([thoughts/shared/research/singlepagestartup/ISSUE-154.md:128](thoughts/shared/research/singlepagestartup/ISSUE-154.md:128)).

Issue-154 planning then codified the runtime contract that is now relevant to issue #158:

- resolve the trigger message thread from `threads-to-messages`;
- pass `threadId` through all intermediate status/final message writes;
- if a legacy message lacks a thread link, attach it to the chat default thread first;
- preserve thread identity in agent-side OpenRouter and status/final outputs
  ([thoughts/shared/plans/singlepagestartup/ISSUE-154.md:189](thoughts/shared/plans/singlepagestartup/ISSUE-154.md:189)).

Issue-154 progress confirms those plan items were implemented and names the resulting behavior explicitly: `react-by-openrouter` resolves the trigger message thread, backfills threadless messages into the default thread, builds LLM context from the active thread only, and agent-side OpenRouter replies propagate `threadId` into direct error/subscription replies ([thoughts/shared/handoffs/singlepagestartup/ISSUE-154-progress.md:32](thoughts/shared/handoffs/singlepagestartup/ISSUE-154-progress.md:32)).

### 2. Historical Guardrails From ISSUE-154 Still Apply To OpenRouter Work

The ISSUE-154 research addendum documented controller ownership and transport guardrails that still shape any work inside the OpenRouter path:

- chat creation owns default-thread initialization;
- thread/message routes remain strict ownership checks;
- legacy data repair happens through API/service logic, not SQL migration side effects;
- thread-targeted writes must use the canonical profile-thread message SDK route instead of passing `threadId` through profile-message payloads
  ([thoughts/shared/research/singlepagestartup/ISSUE-154.md:286](thoughts/shared/research/singlepagestartup/ISSUE-154.md:286)).

The same addendum also documented two implementation patterns that are already reflected in adjacent code:

- guard `RBAC_SECRET_KEY` before building headers;
- keep internal writes on generated SDK clients instead of raw `fetch`
  ([thoughts/shared/research/singlepagestartup/ISSUE-154.md:226](thoughts/shared/research/singlepagestartup/ISSUE-154.md:226), [thoughts/shared/research/singlepagestartup/ISSUE-154.md:258](thoughts/shared/research/singlepagestartup/ISSUE-154.md:258), [thoughts/shared/handoffs/singlepagestartup/ISSUE-154-progress.md:72](thoughts/shared/handoffs/singlepagestartup/ISSUE-154-progress.md:72), [thoughts/shared/handoffs/singlepagestartup/ISSUE-154-progress.md:90](thoughts/shared/handoffs/singlepagestartup/ISSUE-154-progress.md:90)).

### 3. Current OpenRouter Request Flow Contains Multiple Billable Calls

The current `react-by-openrouter` controller instantiates `OpenRouter`, emits a thread-scoped status message, classifies the request, selects a model, iterates candidate generation, deletes the status message, and creates the final assistant message in the resolved thread
([react-by-openrouter.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:703), [react-by-openrouter.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:706), [react-by-openrouter.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:756), [react-by-openrouter.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:807), [react-by-openrouter.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:851), [react-by-openrouter.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:956)).

Within that flow, the current controller performs OpenRouter calls in these buckets:

- classification calls through `classifyRequest(...)` over the enabled classifier set and chat-model fallback set ([react-by-openrouter.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1434));
- model selection calls through `selectModelCandidatesForRequest(...)` over classifier models ([react-by-openrouter.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1227));
- generation calls for each candidate model in priority/LLM-selected order until one response passes validation ([react-by-openrouter.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:851)).

Both classifier and selector helpers also contain repair or fallback calls when strict JSON parsing fails, so the live request path can include more than the three top-level call sites named in the ticket ([react-by-openrouter.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1382), [react-by-openrouter.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1509)).

### 4. Current Billing Behavior Is Still Pure Pre-Debit

The request middleware bills before route execution by calling `authenticationBillRoute(...)` and then proceeds into the handler. The post-response billing block remains commented out ([libs/middlewares/src/lib/bill-route/index.ts](../../../../libs/middlewares/src/lib/bill-route/index.ts:47)).

The RBAC `bill-route` service resolves the permission, loads the subject currency relation, requires a current balance that is already greater than or equal to the route price, and immediately subtracts `permissionToBillingModuleCurrency.amount` from the stored amount ([bill-route.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/bill-route.ts:73), [bill-route.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/bill-route.ts:185), [bill-route.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/bill-route.ts:224)).

In the current implementation there is no code path in the OpenRouter controller or the billing middleware that computes actual usage, converts USD to internal tokens, or performs a post-response refund/additional charge reconciliation.

### 5. Current Agent Behavior Maps Billing Failures To User-Facing OpenRouter Replies

The agent service resolves the trigger message thread before attempting the OpenRouter reaction path. If the downstream route fails with the existing bill-route balance errors, the agent writes the `openRouterNotEnoughTokens` message into the same resolved thread and then follows with the premium keyboard flow ([agent service](../../../../libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1247), [agent service](../../../../libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1280), [agent service](../../../../libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1435), [agent service](../../../../libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1453)).

That agent behavior aligns with the issue-158 ticket note to preserve the existing user-facing “not enough tokens” behavior while changing billing internals ([thoughts/shared/tickets/singlepagestartup/ISSUE-158.md:49](thoughts/shared/tickets/singlepagestartup/ISSUE-158.md:49)).

### 6. Message Metadata Storage Exists But OpenRouter Billing Metadata Is Not Persisted

The social message schema already includes a JSONB `metadata` field alongside `interaction` ([singlepage.ts](../../../../libs/modules/social/models/message/backend/repository/database/src/lib/fields/singlepage.ts:3)).

In the current OpenRouter controller, the final assistant message payload is assembled from `description` and optional generated files, then created through the thread-scoped message route. No metadata object is attached there today ([react-by-openrouter.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:907), [react-by-openrouter.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:938), [react-by-openrouter.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:956)).

### 7. Prior Thoughts Do Not Contain An Earlier Token-Economics Design

Searches across `thoughts/shared/research`, `thoughts/shared/plans`, and `thoughts/shared/handoffs` located historical OpenRouter flow work under issue 154, but did not surface an older thought artifact that already defines:

- exact usage settlement;
- USD-to-token conversion;
- two-phase billing around OpenRouter;
- `metadata.openRouter.billing` structure;
- negative-balance allowance for one in-flight generation followed by subsequent-block behavior.

Billing references found in issue-145 and issue-150 artifacts are about module/admin migration and test coverage, not runtime token accounting or OpenRouter settlement ([thoughts/shared/research/singlepagestartup/ISSUE-145.md:184](thoughts/shared/research/singlepagestartup/ISSUE-145.md:184), [thoughts/shared/handoffs/singlepagestartup/ISSUE-150-progress.md:30](thoughts/shared/handoffs/singlepagestartup/ISSUE-150-progress.md:30)).

## Code References

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:703` - OpenRouter controller initializes the request and status message flow.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:756` - request classification call.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:807` - model selection call.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:871` - candidate generation call.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:956` - final reply message create.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1382` - selector repair call.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1509` - classifier fallback call.
- `libs/middlewares/src/lib/bill-route/index.ts:47` - middleware bills before route execution.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/bill-route.ts:185` - bill-route requires current balance to cover the route amount.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/bill-route.ts:224` - bill-route subtracts the configured permission amount immediately.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1280` - agent resolves thread for the triggering message.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1453` - agent maps balance failures into the not-enough-tokens reply.
- `libs/modules/social/models/message/backend/repository/database/src/lib/fields/singlepage.ts:17` - social message `metadata` JSONB field.

## Architecture Documentation

The current runtime for OpenRouter generation spans three layers:

- Hono middleware pre-bills the route through `authenticationBillRoute(...)` before handler execution ([libs/middlewares/src/lib/bill-route/index.ts](../../../../libs/middlewares/src/lib/bill-route/index.ts:47)).
- The RBAC subject controller owns OpenRouter request orchestration, active-thread context assembly, status message lifecycle, and final assistant message creation ([react-by-openrouter.ts](../../../../libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:703)).
- The agent service owns subject lookup, payable-role/subscription gating, downstream route invocation, and thread-scoped user-facing fallback messages for subscription or balance failures ([agent service](../../../../libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1247)).

Historically, the thread identity and message-routing rules for that runtime were established in issue 154 and are now part of the live shape of the OpenRouter path. Billing still remains route-priced and pre-debited, while usage accounting is absent from both the OpenRouter response payload and social message persistence.

## Historical Context (from thoughts/)

- [thoughts/shared/research/singlepagestartup/ISSUE-154.md](thoughts/shared/research/singlepagestartup/ISSUE-154.md:128) documented the earlier chat-scoped OpenRouter flow and later added controller ownership and SDK/header guardrails that remain relevant to the current path.
- [thoughts/shared/plans/singlepagestartup/ISSUE-154.md](thoughts/shared/plans/singlepagestartup/ISSUE-154.md:185) defined the exact thread-resolution and propagation steps that now shape OpenRouter status/final message routing.
- [thoughts/shared/handoffs/singlepagestartup/ISSUE-154-progress.md](thoughts/shared/handoffs/singlepagestartup/ISSUE-154-progress.md:32) recorded the delivered runtime behavior: same-thread OpenRouter replies, default-thread backfill for legacy data, and agent-side propagation of `threadId` into fallback replies.
- [thoughts/shared/tickets/singlepagestartup/ISSUE-158.md](thoughts/shared/tickets/singlepagestartup/ISSUE-158.md:16) is the first thought artifact in this repository that defines exact settlement, the USD-to-token conversion target, and metadata persistence requirements for OpenRouter billing.
- [thoughts/shared/research/singlepagestartup/ISSUE-145.md](thoughts/shared/research/singlepagestartup/ISSUE-145.md:184) and [thoughts/shared/handoffs/singlepagestartup/ISSUE-150-progress.md](thoughts/shared/handoffs/singlepagestartup/ISSUE-150-progress.md:30) mention billing as module/admin or test-matrix context, not as OpenRouter runtime billing behavior.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-154.md`
- `thoughts/shared/plans/singlepagestartup/ISSUE-154.md`
- `thoughts/shared/handoffs/singlepagestartup/ISSUE-154-progress.md`
- `thoughts/shared/tickets/singlepagestartup/ISSUE-154.md`

## Open Questions

- No prior thought artifact was found that fixes or standardizes the shape of usage/pricing data returned by `@sps/shared-third-parties` OpenRouter calls.
- No prior thought artifact was found that defines an existing settlement ledger or refund/additional-charge flow for `subjects-to-billing-module-currencies`.
- The issue-158 ticket defines `classification`, `model selection`, and `generation` as the settlement basis, while the live controller also includes repair/fallback OpenRouter calls when classifier or selector output is invalid.
