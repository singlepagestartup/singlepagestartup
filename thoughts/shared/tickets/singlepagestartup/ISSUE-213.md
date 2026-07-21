---
repository: singlepagestartup
issue_number: 213
status: Research Needed
created: 2026-07-21
---

# Issue: Make cross-module operations concurrency-safe and idempotent

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/213
**Status**: Research Needed
**Created**: 2026-07-21
**Priority**: high
**Size**: large
**Type**: refactoring/bug

---

## Problem to Solve

Several long-running SPS workflows coordinate multiple modules through independent SDK calls and then perform external side effects. They rely on read-then-create, read-modify-write, process-local guards, or status updates that happen only after provider calls. Concurrent requests, webhook retries, duplicate Telegram updates, overlapping cron runs, and multiple API replicas can therefore create duplicate entities, lose balance changes, repeat payments or notifications, and leave partially persisted graphs.

The highest-risk path is ecommerce cart and checkout. Cart creation writes the order and four relations without one transaction; the current database already contains a `new` cart missing its currency relation. Checkout can create multiple payment intents/provider invoices before order status changes, and order lifecycle processing is guarded only by a process-local `Set`.

The same class of issue exists in OpenRouter billing and message dispatch, notification delivery, cron, audio transcription, Knowledge indexing, social message ingestion and avatar replacement, OAuth one-time actions, generic file storage, and CRM submissions.

## Key Details

- Fix ecommerce cart creation, update/delete, checkout, payment-provider dispatch, webhook processing, and order lifecycle transitions.
- Make balance precharge, settlement, top-up, and reset atomic and auditable.
- Introduce durable idempotency/inbox/outbox or operation-attempt records for Telegram/OpenRouter/provider/notification/cron work.
- Make Knowledge indexing revision-aware and safe under concurrent reindex.
- Make social source-message ingestion, fallback-thread creation, avatar replacement, OAuth consumption, file lifecycle, and CRM submissions safe under retries and overlap.
- Retain database natural-key constraints as defense in depth, but do not treat constraints as a substitute for transactions, compare-and-set transitions, or provider idempotency.
- Preserve the monorepo dependency direction and avoid new circular dependencies between shared, domain, RBAC orchestration, Agent, and provider packages.
- Verify migrations and automated tests, then exercise Telegram and administrator flows in the authenticated in-app Browser.
- Do not commit or push until the human operator reviews the resulting worktree.

## Implementation Notes

- Start with a dependency graph and place generic primitives in existing shared backend packages only when they have no domain imports.
- Keep domain state transitions and transactional commands in the owning backend repository/service layer. Controllers should only compose middleware and handlers.
- Generated HTTP SDK calls cannot share a PostgreSQL transaction. Multi-table aggregate writes must use an owning repository transaction or a durable saga/outbox boundary.
- Use unique/partial unique constraints for natural identities, conditional `UPDATE ... WHERE ... RETURNING` for claims and state transitions, and atomic SQL arithmetic for balances.
- Do not hold advisory locks or database transactions over payment-provider, OpenRouter, Telegram, email, file-storage, or embedding network calls.
- Use stable client/provider idempotency keys and durable operation attempts for external side effects.

## Dependency Direction Baseline

The implementation must preserve this direction:

1. Shared backend API/database utilities import no business module.
2. Domain repositories and services own their own invariants. Ecommerce may depend on Billing model/repository contracts because its existing order aggregate already references Billing currencies and payment intents.
3. RBAC subject orchestration may depend on ecommerce, billing, social, notification, knowledge, CRM, and file-storage; those domain modules must not import RBAC back.
4. Agent may consume RBAC and domain SDKs, but RBAC/domain packages must not import Agent.
5. `apps/api`, `apps/telegram`, and `apps/host` remain composition/transport roots.

Generic claim/idempotency helpers may therefore live in shared backend packages only when they contain no domain table imports. Domain SQL commands stay in the owning repository package. Cross-domain subject/order commands stay below the RBAC subject app service in an RBAC-owned repository package that may import lower-level domain tables but is never imported by those domains.

## Browser Baseline

- The authenticated Telegram Browser tab opens `SPS Dev Bot` and currently shows a rapid `/start` failure with correlation code `QcR1IIDkjHc1f4NTMJk3V`.
- The same Telegram topic contains five duplicate copies of the Help response, confirming duplicate event/action processing remains observable in the deployed version.
- The authenticated SPS Browser tab exposes the `Admin` control and Ecommerce page. The rendered cart currently shows the Website product with Update/Delete controls, consistent with the database row audited as an incomplete `new` cart.
- These tabs are retained as the live acceptance surfaces for post-implementation verification.
