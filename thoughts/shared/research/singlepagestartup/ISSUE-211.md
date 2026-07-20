---
date: 2026-07-20T10:57:19+03:00
researcher: flakecode
git_commit: c63934a4e543e070e3fda0abd81d1509b3c20603
branch: codex/issue-209-telegram-assistant-conversations
repository: singlepagestartup
topic: "Telegram bootstrap race creates duplicate RBAC grants and breaks message processing"
tags: [research, telegram, rbac, concurrency, database, subscriptions]
status: complete
last_updated: 2026-07-20
last_updated_by: flakecode
---

# Research: Telegram bootstrap race creates duplicate RBAC grants and breaks message processing

**Date**: 2026-07-20T10:57:19+03:00
**Researcher**: flakecode
**Git Commit**: c63934a4e543e070e3fda0abd81d1509b3c20603
**Branch**: codex/issue-209-telegram-assistant-conversations
**Repository**: singlepagestartup

## Research Question

Reproduce the Telegram bootstrap failure reported in issue #211 and document the current concurrency, RBAC persistence, migration, subscription-provisioning, and process-local serialization behavior that participates in the failure.

## Summary

The reported RBAC race is reproducible on the current service implementation. Telegram starts `forum_topic_created` and the adjacent user message as independent background tasks; both call the same bootstrap endpoint. `SocialProfileKnowledgeAccessService.ensureEntity()` performs `find`, then `create`, and only re-reads after a rejected create. The role converges because `rbac.role.slug` is unique, but the permission and two RBAC relation schemas have only primary-key uniqueness. Concurrent inserts can therefore both succeed.

A deterministic current-code reproduction ran two `ensure()` calls concurrently with a test double that models the existing database invariants: unique role slug, but no natural-key constraints for permissions or relations. It produced one role, 27 permission rows, 28 role-permission rows, and two subject-role rows. A subsequent `ensure()` failed with `Data integrity error. Multiple rbac.roles-to-permissions relation records match one social.profile Knowledge access grant.` The exact duplicate distribution is scheduling-dependent; the persistent invariant violation is not.

The local restored database is currently clean: read-only queries returned zero duplicate groups for all three natural keys. It still has no natural-key indexes; `pg_indexes` exposes only primary keys for the three public tables. This reproduces the unsafe schema state without claiming that the current local dump still contains the affected production rows.

Free-subscription provisioning has two layers. Bootstrap returns `shouldCheckoutFreeSubscription = registration || isStartCommand`, but the Telegram adapter discards the field and calls checkout after every bootstrap. The API-side free-subscription service already performs sequential active-order and prior-product checks and returns `null` when provisioning is unnecessary. Its current tests cover active and completed existing orders, but neither the adapter flag nor two simultaneous free-subscription provisioning requests is covered.

The repository already contains a keyed promise tail in the Agent-owned Telegram conversation memory store. It serializes process-local conversation state transitions only; bootstrap runs in the Telegram transport/API path and does not use that store. The store itself documents that it is process-local, so it does not establish database invariants or cross-replica exclusion.

## Detailed Findings

### Telegram update dispatch

- The generic `message` handler recognizes `forum_topic_created` and starts bootstrap through `runIncomingMessageInBackground`, then returns immediately (`apps/telegram/src/lib/telegram-bot.ts:545-574`).
- Voice, audio, media-group, and ordinary messages are also launched as independent background tasks (`apps/telegram/src/lib/telegram-bot.ts:584-665`).
- The background wrapper attaches error logging and a safe localized Telegram reply, but it does not serialize tasks (`apps/telegram/src/lib/telegram-bot.ts:269-329`).
- Bootstrap is called with Telegram `fromId`, `chatId`, optional `messageThreadId`, and topic flags (`apps/telegram/src/lib/telegram-bot.ts:730-785`).
- After bootstrap, the adapter synchronizes membership and unconditionally invokes free-subscription checkout (`apps/telegram/src/lib/telegram-bot.ts:787-795`).

### Bootstrap result and profile access provisioning

- The bootstrap result type contains `registration`, `isStartCommand`, and `shouldCheckoutFreeSubscription` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:41-51`).
- The returned flag is computed from `registration || isStartCommand` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:2105-2115`).
- Bootstrap provisions the personal AI agent and then synchronizes automatic profiles. For applicable AI profiles it calls `ensureProfileManagementAccess()` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:2084-2095`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:1692-1705`).
- Subject service wires this callback to `SocialProfileKnowledgeAccessService.ensure()` through injected RBAC services (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts:383-425`).

### Natural-key provisioning behavior

- Fourteen permission descriptors are generated for a concrete owner subject/profile pair (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/access.ts:23-53`).
- `findSingle()` deliberately loads at most two rows and throws when a natural key matches more than one row (`access.ts:69-92`).
- `ensureEntity()` is find-then-create. Its concurrency recovery is entered only when `create()` rejects; if both inserts succeed, no re-read occurs (`access.ts:94-120`).
- Role lookup uses `slug`; the role schema already marks `slug` unique (`libs/modules/rbac/models/role/backend/repository/database/src/lib/fields/singlepage.ts:4-5`).
- Permission lookup uses `(type, method, path)` (`access.ts:150-167`). Role-permission lookup uses `(roleId, permissionId)` (`access.ts:171-187`). Subject-role lookup uses `(subjectId, roleId)` (`access.ts:190-206`).

### Current database schemas

- `sps_rc_permission` declares only the shared fields and no composite unique index (`libs/modules/rbac/models/permission/backend/repository/database/src/lib/schema.ts:1-11`).
- `sps_rc_rs_to_ps_mz2` declares a primary key plus role/permission foreign keys and optional `condition`, with no pair uniqueness (`libs/modules/rbac/relations/roles-to-permissions/backend/repository/database/src/lib/schema.ts:1-26`).
- `sps_rc_ss_to_rs_3nw` declares a primary key plus subject/role foreign keys, with no pair uniqueness (`libs/modules/rbac/relations/subjects-to-roles/backend/repository/database/src/lib/schema.ts:1-25`).
- Read-only local SQL on 2026-07-20 found zero duplicate groups and zero extra rows for the three stated natural keys. The three public tables exposed only their primary-key indexes.

### Existing test coverage and reproduction

- The access provisioning unit suite calls `ensure()` twice sequentially and asserts 14 permissions/relations and one subject-role relation (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/access.spec.ts:1-83`).
- Its in-memory service does not model unique conflicts and has no concurrent test (`access.spec.ts:14-38`).
- A one-off Bun reproduction against the current `SocialProfileKnowledgeAccessService` aligned the two initial reads with microtask yields and modeled only the role's existing unique slug. Two concurrent calls produced duplicate permission/relation state; the next call raised the service's integrity error.
- The current local database cannot reproduce the persisted production duplicates because the loaded dump is already clean. The schema precondition for recurrence remains present.

### Free-subscription provisioning

- Telegram receives `shouldCheckoutFreeSubscription` in the SDK response type (`libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/telegram/bootstrap.ts:30-45`) but the adapter return type omits it and the adapter does not branch on it (`apps/telegram/src/lib/telegram-bot.ts:737-744`, `apps/telegram/src/lib/telegram-bot.ts:787-804`).
- The API free-subscription service first loads all subject-order links, returns `null` for a non-terminal subscription, and later returns `null` when any prior order already contains the free product (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/checkout-free-subscription.ts:31-69`, `checkout-free-subscription.ts:122-145`, `checkout-free-subscription.ts:306-315`).
- Only after both checks does it call product checkout with provider `telegram-star` (`checkout-free-subscription.ts:317-333`).
- Existing BDD tests cover an active subscription, no orders, and a completed prior free-subscription order; they are sequential (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/checkout-free-subscription.spec.ts:1-287`).
- Earlier research for issue #173 documents the shared order-checkout validation and production active-order states (`thoughts/shared/research/singlepagestartup/ISSUE-173.md`).

### Other bootstrap duplicate handling

- Telegram bootstrap already contains explicit repair logic for duplicate identities and subject-identity links (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:1321-1469`).
- It also removes duplicate Telegram profiles and duplicate automatic profile-chat relations during later bootstraps (`bootstrap.ts:1847-1900`, `bootstrap.ts:1586-1655`).
- These routines detect and repair existing rows after they have been persisted. They do not supply uniqueness for the Knowledge permission and RBAC relation tables used by `SocialProfileKnowledgeAccessService`.

### Existing serialization and migration behavior

- `TelegramConversationMemoryStore.runExclusive()` maintains a promise tail per key and serializes operations inside one process (`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-conversation-store.ts:15-55`).
- The store documentation explicitly scopes it to process-local interactive conversation persistence (`telegram-conversation-store.ts:8-14`).
- The shared migration wrapper runs Drizzle migrations and currently exposes no data-repair/pre-migration callback (`libs/shared/backend/database/config/src/lib/migrate/index.ts:8-103`).
- RBAC repository migration order runs permission migrations before role-permission and subject-role relation migrations (`libs/modules/rbac/project.json:128-179`).
- Repository generation targets exist independently for permission, roles-to-permissions, and subjects-to-roles (`libs/modules/rbac/project.json:390-477`).

## Code References

- `apps/telegram/src/lib/telegram-bot.ts:545-665` — independent background dispatch for Telegram service and user messages.
- `apps/telegram/src/lib/telegram-bot.ts:730-805` — bootstrap adapter and unconditional free-subscription call.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:2105-2115` — checkout decision returned by bootstrap.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/access.ts:69-120` — find-single and create/re-read behavior.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/access.ts:135-206` — role, permission, and relation natural keys.
- `libs/modules/rbac/models/permission/backend/repository/database/src/lib/schema.ts:1-11` — permission schema without composite uniqueness.
- `libs/modules/rbac/relations/roles-to-permissions/backend/repository/database/src/lib/schema.ts:1-26` — role-permission schema without pair uniqueness.
- `libs/modules/rbac/relations/subjects-to-roles/backend/repository/database/src/lib/schema.ts:1-25` — subject-role schema without pair uniqueness.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/checkout-free-subscription.ts:31-69` — active subscription detection.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/checkout-free-subscription.ts:306-333` — prior-product check and checkout call.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-conversation-store.ts:35-55` — existing process-local keyed serialization.
- `libs/shared/backend/database/config/src/lib/migrate/index.ts:46-103` — current migration execution path.

## Architecture Documentation

The current bootstrap architecture spans the Telegram transport, the RBAC subject bootstrap service, generated SDK HTTP calls, injected RBAC services, and PostgreSQL repositories. Telegram acknowledges webhooks while work continues in background promises. The RBAC service performs semantic idempotency through reads and selective cleanup. Database uniqueness exists for the generated Knowledge-owner role slug but not for the permission/relation keys used immediately after that role is resolved.

Interactive assistant conversations have their own Agent-owned process-local state and serialization. That mechanism is downstream from bootstrap and is keyed by social chat/thread/sender profile after the subject/profile/chat graph exists.

Repository migrations are per model/relation and generated from Drizzle schemas. The shared migrator observes migration count changes and exits the process after each target. It does not currently execute a repository-specific data-repair phase.

## Historical Context

- `thoughts/shared/research/singlepagestartup/ISSUE-173.md` traces the active-subscription validation through product/order checkout and records affected order states from a restored production dump.
- `thoughts/shared/processes/singlepagestartup/ISSUE-199.md` Incident 32 records the introduction of profile-specific Knowledge owner roles and the original sequential idempotency expectation.
- `thoughts/shared/research/singlepagestartup/ISSUE-209.md` documents Agent-owned Telegram conversation state and command routing added after the original Telegram bootstrap implementation.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-173.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-199.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-209.md`

## Open Questions

- The current local dump no longer contains the affected duplicate rows, so the exact production duplicate distribution can only be taken from issue #211 evidence unless another production snapshot is restored.
- Current tests do not determine the observable result of two simultaneous free-subscription provisioning requests after both pass the initial no-order read.
- The repository has no existing convention for running a cross-table data repair immediately before generated unique-index migrations.
