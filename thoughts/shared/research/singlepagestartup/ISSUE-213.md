---
date: 2026-07-21T22:00:53+03:00
researcher: flakecode
git_commit: 254fb0b67620ab6c4fd6b57c0f57ce2838bc84a7
branch: main
repository: singlepagestartup
topic: "Make cross-module operations concurrency-safe and idempotent"
tags: [research, concurrency, idempotency, ecommerce, billing, agent, notification, knowledge, social, oauth, file-storage, crm]
status: complete
last_updated: 2026-07-21
last_updated_by: flakecode
---

# Research: Make cross-module operations concurrency-safe and idempotent

**Date**: 2026-07-21T22:00:53+03:00
**Researcher**: flakecode
**Git Commit**: 254fb0b67620ab6c4fd6b57c0f57ce2838bc84a7
**Branch**: main
**Repository**: singlepagestartup

## Research Question

Document the current transaction, identity, state-transition, and external-side-effect boundaries for issue #213 across ecommerce cart/checkout, Billing providers and balances, Agent/OpenRouter/Telegram work, notifications, cron, audio transcription, Knowledge indexing, Social ingestion/thread/avatar lifecycle, OAuth, File Storage, and CRM. Distinguish the concurrency work already delivered by issue #211 from the broader behavior that still exists today, and preserve the repository's current dependency direction.

## Summary

Issue #211 already established three durable concurrency mechanisms in the live repository: PostgreSQL natural-key constraints for RBAC grants, transactionally checked duplicate repair, and namespaced PostgreSQL advisory locks for Telegram bootstrap and free-subscription provisioning. The Telegram adapter now respects `shouldCheckoutFreeSubscription`, and real PostgreSQL tests cover equal-key lock serialization and concurrent Knowledge-grant convergence (`libs/shared/backend/database/config/src/lib/advisory-lock.ts:30-54`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:1726-1734`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/checkout-free-subscription.ts:131-145`).

The remaining issue-213 scope has a different runtime shape. Cart creation and direct product checkout build order graphs with separate SDK writes; checkout replaces payment-intent relations, invokes the Billing provider, and only then publishes `paying`; order lifecycle processing uses a process-local `Set`; and balance top-up, reset, precharge, and settlement read a stored amount, calculate a replacement value in application code, and issue a generic update. These paths do not open one database transaction or use conditional state transitions in the inspected entry points (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.ts:157-351`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:408-804`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:129-441`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/billing/route.ts:269-392`).

Provider and background-work flows persist useful status, action, message, and Broadcast records, but the inspected paths do not claim a stable operation before the external effect. Payment providers, OpenRouter automatic replies, notification delivery, cron, and audio transcription all perform provider or background work between independently persisted reads/writes. The targeted repository search found no `Idempotency-Key` use and no operation-attempt, inbox, outbox, or lease table in these flows.

Knowledge indexing uses content hashes, a unique source `originalPath`, and skip behavior for already indexed content. When work proceeds, embeddings are requested before the source/chunk graph is replaced through separate operations. Social source-message dedupe, fallback-thread creation, avatar replacement, OAuth consumption, File Storage lifecycle, and CRM submissions likewise use sequential checks and SDK/controller calls rather than one aggregate transaction or atomic claim.

The post-implementation audit appended to issue #211 is still a valid baseline for issue #213. Commit `92a7ab65af`, which recorded that audit and created issue #213, is an ancestor of the current `HEAD`; `git diff --stat 92a7ab65af..HEAD` is empty. Live-code spot checks and parallel focused traces verified the audit's load-bearing claims. The only superseded audit items are the older pre-implementation statements about Telegram ignoring `shouldCheckoutFreeSubscription` and free-subscription provisioning lacking cross-process serialization; PR #212/merge #214 now cover those paths.

## Detailed Findings

### Research baseline and already-delivered issue #211 boundary

- The current branch is `main` at merge commit `254fb0b67620ab6c4fd6b57c0f57ce2838bc84a7`. That merge includes the issue-211 implementation and the follow-up audit that produced issue #213.
- `withPostgresAdvisoryLock` reserves one PostgreSQL connection, locks `hashtextextended(namespace:key, 0)`, executes the callback, unlocks, and releases the connection (`libs/shared/backend/database/config/src/lib/advisory-lock.ts:4-55`).
- Telegram bootstrap executes its multi-repository initialization under namespace `rbac:telegram-bootstrap`, keyed by Telegram `fromId` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:1719-1734`).
- Free-subscription provisioning executes its active/prior-order recheck and checkout decision under namespace `rbac:telegram-free-subscription`, keyed by subject id (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/checkout-free-subscription.ts:116-145`).
- PostgreSQL enforces RBAC permission `(type, method, path)`, role-permission `(roleId, permissionId)`, and subject-role `(subjectId, roleId)` identities (`libs/modules/rbac/models/permission/backend/repository/database/src/lib/constraints/singlepage.ts:8-18`, `libs/modules/rbac/relations/roles-to-permissions/backend/repository/database/src/lib/constraints/singlepage.ts:8-17`, `libs/modules/rbac/relations/subjects-to-roles/backend/repository/database/src/lib/constraints/singlepage.ts:8-17`).
- The RBAC repair operation locks the three grant tables, rewrites duplicate references, removes equivalent duplicates, and verifies the result inside one PostgreSQL transaction (`libs/modules/rbac/backend/repository/database/src/lib/natural-key-repair.ts:238-400`).
- `SocialProfileKnowledgeAccessService.ensureEntity()` retains find/create/re-read conflict recovery, and the integration suite runs two real concurrent `ensure()` calls against PostgreSQL-backed repositories (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/access.ts:69-120`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/access.integration.spec.ts:68-192`).
- The Telegram adapter now calls free-subscription checkout only when bootstrap returns `shouldCheckoutFreeSubscription=true` (`apps/telegram/src/lib/telegram-bot.ts:860-889`).

### Ecommerce cart aggregate and owner-facing mutations

- Cart creation resolves product, store, and currency data, then reads order-product, subject-order, `new` order, store-order, and order-currency relations to detect an existing cart (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.ts:30-269`).
- The store portion of that lookup filters `storesToOrders.storeId` with the subject path variable `id`, not the resolved `storeId` variable (`order/create.ts:223-244`).
- A successful create performs five sequential SDK writes: order, subject-order relation, order-product relation, store-order relation, and order-currency relation (`order/create.ts:276-351`).
- The current ticket baseline records an existing `new` cart with subject/product/store relations but no currency relation. The research phase reused that read-only database observation from issue #211 and did not mutate the cart.
- Direct product checkout creates the same five-record order graph on every invocation before delegating to shared order checkout (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/product/id/checkout.ts:153-220`).
- Order update authenticates the subject path, loads the order, checks `status === "new"`, and forwards the payload to the generic order update (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/update.ts:44-90`).
- Order delete performs the same status check, deletes order-product relations, and deletes the order (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/delete.ts:52-113`).
- Those update/delete handlers do not query the subject-order relation while processing the supplied order id.

### Checkout, payment-intent assembly, and provider ordering

- Existing-order checkout patches each order comment and then delegates to `ecommerceOrderCheckout` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/checkout.ts:46-123`).
- The checkout service loads the order/product/attribute/currency graph, deletes existing order-payment-intent relations, evaluates subscription conflicts, groups payment intents, and creates or updates payment intents and their relations (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:81-707`).
- Provider dispatch occurs before order state publication. After `billingModulePaymentIntentApi.provider(...)` returns, checkout reloads each order, updates it to `paying`, and enqueues follow-up observer messages (`checkout.ts:709-804`).
- Billing provider dispatch creates the payment-intent-to-currency relation before it validates the provider branch (`libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/provider/index.ts:42-91`).
- Telegram Star creates an `open` local invoice, calls `bot.api.sendInvoice(...)`, then creates the payment-intent-to-invoice relation (`libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/telegram-star.ts:51-87`).
- CloudPayments creates an `open` local invoice, calls the external orders endpoint, updates the invoice with provider data, then creates the payment-intent-to-invoice relation (`libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/cloudpayments.ts:81-187`).
- Telegram Star webhook handling returns success without repeating its callback when the invoice is already paid with the same Telegram charge (`telegram-star.ts:89-159`). CloudPayments verifies HMAC, resolves `invoiceId`, updates a completed invoice, and invokes the shared callback (`cloudpayments.ts:188-261`).
- `updatePaymentIntentStatus()` loads payment intents related to the invoice and updates enough eligible rows to `succeeded` until the invoice amount is exhausted (`libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/index.ts:64-140`).
- The inspected order-currency, order-payment-intent, payment-intent-currency, payment-intent-invoice, subject-order, and subject-currency relation schemas expose primary-key identity without pairwise unique constraints in their schema definitions.

### Order lifecycle and balance storage

- The scheduled order check scans bounded `paying`, `delivering`, and `requested_cancelation` orders and invokes the ecommerce order check endpoint for each (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/check.ts:8-65`).
- The ecommerce check controller reads current order/payment/invoice state and updates order statuses through generic SDK calls (`libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/find-by-id/check/index.ts:97-398`).
- RBAC `proceed` scans `paid`, `delivering`, `delivered`, and `canceling` orders and uses `processingOrderIds`, a process-local `Set`, to skip re-entry within that service instance (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:52-92`, `proceed.ts:129`, `proceed.ts:265-270`, `proceed.ts:440-441`).
- Paid-order processing grants roles, derives top-up currencies, creates or updates subject-currency rows, changes the order status, and creates notifications through sequential SDK calls (`proceed.ts:446-784`).
- Top-up reads the current subject-currency relation, parses its string amount, calculates a new value, and writes the replacement amount; it creates the relation when none exists (`proceed.ts:686-746`).
- Delivered and canceling paths zero subject-currency balances with generic updates. Delivered subscriptions may create a successor Telegram Star checkout after completing the current order (`proceed.ts:354-430`, `proceed.ts:786-1016`).
- Route billing's `applyBillingDelta()` also reads a relation amount, parses it, calculates `currentAmount - deltaAmount`, and sends a generic update (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/billing/route.ts:269-290`). `execute()` uses that helper for precharge and `settle()` reuses it for refund or additional debit (`route.ts:292-392`).
- The billing controller keeps a request-local usage ledger and persists its summary in final-message metadata, but the balance mutation itself is application-level read/modify/write rather than an SQL arithmetic expression (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:541-624`, `react-by-openrouter.ts:1656-1796`).

### Agent, OpenRouter, Telegram event dispatch, and audio transcription

- Actions Logger creates an RBAC action after a successful request, links it to the subject, and calls the Agent Telegram handler from an asynchronous fire-and-forget block (`libs/middlewares/src/lib/actions-logger/index.ts:110-199`).
- The Agent handler reloads persisted message/action data and dispatches automatic replies; completed audio-transcription actions re-enter the same message-dispatch path (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:84-158`, `telegram/bot.ts:358-462`).
- Agent signs a JWT for the subject behind the triggering message and calls the RBAC `react-by/openrouter` endpoint with the trigger message, chat, source profile, and replying profile identifiers (`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:2426-2455`).
- The OpenRouter controller validates the persisted graph, creates a status message, updates it through execution phases, performs model/tool/provider work, settles the request-local billing ledger, and creates the final assistant message (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:990-1044`, `react-by-openrouter.ts:1309-1796`).
- AI tool execution has a durable Social action reporter that creates one action for that invocation and updates it through lifecycle stages (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/ai/execution-action.ts:150-216`). The inspected automatic-reply entry path does not look up or claim an existing operation keyed by trigger message and replying profile before starting the invocation.
- The Agent conversation store serializes assistant-editor state in a process-local `Map`; it is not used as the automatic-reply claim boundary (`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-conversation-store.ts:8-55`).
- Audio transcription checks message metadata, writes `audioTranscription.status = "processing"`, and starts an unawaited `transcribeMessage()` task (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/audio-transcription.ts:81-136`).
- The background task calls OpenAI transcription, updates the message to `completed`, optionally renames the fallback thread, and creates a completion action (`audio-transcription.ts:139-250`).

### Notification and cron work records

- Notification creation callers create a notification row, template relation, topic relation, and then optionally call send. RBAC notify and CRM form submission are current examples (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/notify.ts:180-220`, `libs/modules/crm/models/form/backend/app/api/src/lib/controller/singlepage/request/create.ts:132-180`).
- Notification `send()` reloads the row, skips expired/future/non-`new` rows, loads templates, and invokes the email or Telegram provider (`libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:1037-1157`).
- Provider delivery occurs before the notification is updated with provider `sourceSystemId` and `status: "sent"` (`notification service/index.ts:660-1007`). The notification schema stores `sourceSystemId` without a unique constraint (`libs/modules/notification/models/notification/backend/repository/database/src/lib/fields/singlepage.ts:4-24`).
- Topic-wide sending reloads related notifications, checks `status === "new"`, and calls the send endpoint one row at a time (`libs/modules/notification/models/topic/backend/app/api/src/lib/controller/singlepage/send-all/index.ts:21-54`).
- Agent cron stores execution markers as Broadcast messages on channel `cron`. It reads and sorts prior messages, skips a recent marker without `result`, deletes older markers best-effort, publishes a new running marker, calls the agent endpoint, and then publishes a result marker (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/cron.ts:27-226`).
- The Broadcast marker check and the later running-marker write are separate operations.

### Knowledge indexing and revision state

- Reindex enters through generic or RBAC-scoped routes and delegates to `KnowledgeService.reindexDocument()` and the same `KnowledgeIndexer` (`libs/modules/knowledge/backend/app/api/src/lib/app.ts:101-117`, `libs/modules/knowledge/backend/app/api/src/lib/service.ts:252-264`).
- A document-derived source uses `originalPath = knowledge-document:<documentId>`. The source table declares `originalPath` unique (`libs/modules/knowledge/backend/app/api/src/lib/repository.ts:309-310`, `libs/modules/knowledge/models/source/backend/repository/database/src/lib/fields/singlepage.ts:24-26`).
- The indexer hashes normalized content and skips embedding when both the source and document already have the same indexed hash (`libs/modules/knowledge/backend/app/api/src/lib/indexer/index.ts:81-125`).
- When work proceeds, the ordering is external `embedMany`, source upsert, optional source-file relation, deletion of current source-chunk relations/orphans, insertion of replacement chunks/relations, then document metadata update (`indexer/index.ts:140-184`).
- `upsertSource()` is a find-by-`originalPath` followed by either update or insert (`libs/modules/knowledge/backend/app/api/src/lib/repository.ts:313-349`). Document import elsewhere uses `INSERT ... ON CONFLICT (slug) DO UPDATE` (`repository.ts:917-960`).
- The source/chunk replacement methods are separate database operations in the inspected repository, and the indexer does not persist a document revision claim before the embedding call.

### Social ingestion, thread, and avatar lifecycle

- Social message creation treats `sourceSystemId` as an optional dedupe input, searches within the current chat/thread route, and returns the existing row with action logging skipped when it finds one (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:122-140`, `message/create.ts:608-733`).
- A new message is created before chat-message, thread-message, profile-message, file, and notification work is completed (`message/create.ts:149-345`). The Social message table stores `sourceSystemId` as a nullable text field without a unique constraint (`libs/modules/social/models/message/backend/repository/database/src/lib/fields/singlepage.ts:3-18`).
- `ensureDefaultThreadForChat()` reads linked threads, returns the deterministically earliest relation when present, or creates a thread and then a chat-thread relation (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/chat/lifecycle.ts:209-327`).
- Avatar replacement reads current profile-file relations, reuses an existing target relation when found, otherwise creates the new relation and then deletes the previously loaded stale relations (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/avatar/update.ts:41-203`).
- The generic profile-file relation has no avatar discriminator in the inspected relation schema; the avatar route assigns avatar meaning through this orchestration path.

### OAuth, File Storage, and CRM

- OAuth start creates an RBAC action with `type: "oauth-state"` and `consumedAt: null`, optionally links it to the source subject, and returns the action id as provider state (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/authentication/oauth/start.ts:64-145`).
- Callback loads the state action, checks payload type, expiry, and `consumedAt`, then issues a generic action update that writes the timestamp before continuing (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/authentication/oauth/callback.ts:78-140`).
- Exchange performs the same read/check/generic-update sequence for `oauth-exchange` before loading the subject and signing tokens (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/authentication/oauth/exchange.ts:50-148`).
- These consumption updates do not include an expected-unconsumed predicate in the inspected SDK call; `consumedAt` is persisted state, not a conditional database claim in this path.
- File create uploads the object before creating the file row. File update uploads the replacement, updates the row, and then deletes the old object. File delete removes the object before deleting the row (`libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/create/index.ts:17-129`, `update/index.ts:17-142`, `delete/index.ts:15-37`).
- File Storage's model service is a generic CRUD service wrapper (`libs/modules/file-storage/models/file/backend/app/api/src/lib/service/index.ts:1-26`).
- CRM form submission creates the request row, creates the form-request relation, then creates and sends admin notifications through independent SDK calls (`libs/modules/crm/models/form/backend/app/api/src/lib/controller/singlepage/request/create.ts:19-180`).
- The CRM request model contains the submitted payload but no caller-supplied submission/idempotency identifier in its documented fields (`libs/modules/crm/models/request/README.md:5-14`).

### Existing test coverage

- Real concurrency coverage exists for PostgreSQL advisory locks, RBAC natural-key repair, RBAC Knowledge grant convergence, and serialized Telegram free-subscription provisioning (`libs/shared/backend/database/config/src/lib/advisory-lock.integration.spec.ts:1-151`, `libs/modules/rbac/backend/repository/database/src/lib/natural-key-repair.integration.spec.ts:1-199`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/access.integration.spec.ts:68-192`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/checkout-free-subscription.spec.ts:271-322`).
- Checkout tests cover subscription validation, provider failure propagation, payment-intent grouping, observer scheduling, and later `paying` publication (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.spec.ts:320-524`).
- Proceed tests cover bounded/scoped queries, the process-local in-progress skip, and delivered-subscription behavior (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.spec.ts:115-429`).
- Billing route tests cover precharge and settlement calculations through the current read/update service contract (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/billing/route.spec.ts:77-216`).
- Notification tests cover missing, expired, valid, blocked-recipient, and attachment-delivery paths (`libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.spec.ts:85-454`).
- Knowledge tests cover hash skips, metadata healing, indexing, and repository upserts; no concurrency-specific reindex spec was located (`libs/modules/knowledge/backend/app/api/src/lib/indexer/index.spec.ts:11-132`, `libs/modules/knowledge/backend/app/api/src/lib/repository.spec.ts:108-220`).
- No concurrent cart/create, order checkout/provider dispatch, order proceed, OpenRouter duplicate-dispatch, notification send, cron, audio-transcription, Social message/default-thread/avatar, OAuth consumption, File Storage lifecycle, or CRM submission test was located by the targeted test search.

## Code References

- `libs/shared/backend/database/config/src/lib/advisory-lock.ts:30-54` - existing cross-process advisory-lock helper.
- `libs/modules/rbac/backend/repository/database/src/lib/natural-key-repair.ts:238-400` - existing transactional RBAC repair.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.ts:157-351` - cart duplicate reads and five independent writes.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:408-804` - payment-intent replacement, provider call, and later order status update.
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/provider/index.ts:42-169` - provider dispatch and zero-amount branch.
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/telegram-star.ts:51-159` - Telegram invoice creation and webhook handling.
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/cloudpayments.ts:81-261` - CloudPayments invoice/external-order lifecycle.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:129-1016` - process-local guard, balance/order/renewal side effects.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/billing/route.ts:167-392` - balance lookup, precharge, and settlement.
- `libs/middlewares/src/lib/actions-logger/index.ts:110-199` - persisted action plus fire-and-forget Agent dispatch.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:990-1796` - OpenRouter status, provider, settlement, and final-message flow.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/audio-transcription.ts:81-250` - transcription check, status update, provider call, and completion action.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/cron.ts:27-226` - Broadcast-backed cron state.
- `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:660-1157` - provider delivery and notification state.
- `libs/modules/knowledge/backend/app/api/src/lib/indexer/index.ts:81-184` - hash check, embedding, derived graph replacement.
- `libs/modules/knowledge/backend/app/api/src/lib/repository.ts:313-365` - source upsert and chunk relation cleanup.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:122-345` - source-message dedupe and graph creation.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/chat/lifecycle.ts:209-327` - fallback-thread resolution/creation.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/avatar/update.ts:41-203` - avatar relation replacement.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/authentication/oauth/callback.ts:78-140` - OAuth state consumption.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/authentication/oauth/exchange.ts:50-148` - exchange-code consumption.
- `libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/create/index.ts:17-129` - storage-before-row create.
- `libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/update/index.ts:17-142` - upload/update/old-object delete ordering.
- `libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/delete/index.ts:15-37` - object-before-row delete.
- `libs/modules/crm/models/form/backend/app/api/src/lib/controller/singlepage/request/create.ts:19-180` - request/relation/notification sequence.

## Architecture Documentation

The root and module documentation place authenticated cart/product behavior in RBAC subject orchestration while ecommerce owns the reusable domain models and relations (`README.md:285-289`, `libs/modules/ecommerce/README.md:5-12`, `libs/modules/rbac/models/subject/README.md:5-11`). RBAC subject services/controllers therefore compose ecommerce, Billing, Social, Notification, Knowledge, CRM, and File Storage SDKs. Agent consumes RBAC/domain SDKs, and app packages remain transport/composition roots. The existing shared advisory-lock helper imports database configuration, not business-module tables (`libs/shared/backend/database/config/src/lib/advisory-lock.ts:1-55`).

The live concurrency mechanisms divide into these current categories:

| Current mechanism                                   | Current use                                             | Current boundary                                  |
| --------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| Composite uniqueness + conflict recovery            | RBAC permission and grant identity                      | One natural-key row/relation                      |
| PostgreSQL advisory lock                            | Telegram bootstrap and free-subscription provisioning   | One namespaced key while the callback runs        |
| Transactional repair                                | Existing RBAC grant duplicates                          | Three RBAC grant tables during maintenance        |
| Content hash + unique source path                   | Knowledge skip/source identity                          | Source identity and already-indexed detection     |
| Persisted status/timestamp/action/Broadcast records | OAuth, notifications, AI execution, cron, transcription | Recorded state read and updated by separate calls |
| Process-local `Set`/`Map`                           | Order proceed and Agent editor conversations            | One running process/service instance              |
| Sequential SDK/controller orchestration             | Cart, checkout, providers, Social, File Storage, CRM    | Each individual HTTP/repository mutation          |

No operation-attempt, inbox, outbox, or lease model and no explicit `Idempotency-Key` header was found in the inspected issue-213 paths.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-211.md` contains the original Telegram/RBAC race research and the post-implementation cross-module audit that produced issue #213. Its pre-implementation free-subscription statements are superseded; its appended cross-module findings match current live code.
- `thoughts/shared/plans/singlepagestartup/ISSUE-211.md` and `thoughts/shared/handoffs/singlepagestartup/ISSUE-211-progress.md` record the delivered natural keys, repair operation, advisory locks, Telegram routing, diagnostics, and real concurrency tests.
- `thoughts/shared/research/singlepagestartup/ISSUE-173.md` traces product checkout, active-subscription validation, and order proceed history.
- `thoughts/shared/research/singlepagestartup/ISSUE-158.md` records the earlier OpenRouter billing baseline; the current code now includes request-local usage settlement, while its shared balance update remains read/modify/write.
- `thoughts/shared/research/singlepagestartup/ISSUE-199.md` records the single canonical OpenRouter/MCP execution path, requester/reply-subject identity split, and profile-scoped durable action presentation.
- `thoughts/shared/research/singlepagestartup/ISSUE-209.md` records Agent ownership of Telegram commands and assistant-management conversations, with `apps/telegram` retained as the transport adapter.
- `thoughts/shared/research/singlepagestartup/ISSUE-174.md` documents notification create/relation/send ordering and CRM notification callers.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-211.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-173.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-158.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-199.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-209.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-189.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-192.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-174.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-185.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-154.md`

## Open Questions

- The research did not inspect external payment, OpenRouter, Telegram, email, embedding, or storage provider documentation, so provider-side support for stable idempotency keys is not established here.
- Social message `sourceSystemId` is scoped by controller lookups that also know chat/thread/transport context, while the database field itself is nullable and unconstrained; the codebase does not currently define one persisted composite natural key for all transports.
- The existing AI execution action describes work after an invocation starts. The repository has no separately named durable trigger-claim record for the `(trigger message, replying profile)` pair in the inspected path.
- The issue-213 browser/database observations remain the acceptance baseline; this research phase did not repeat live Telegram/provider sends or mutate the incomplete cart.
