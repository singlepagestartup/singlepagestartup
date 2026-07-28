---
repository: singlepagestartup
issue_number: 211
status: Research Needed
created: 2026-07-20
---

# Issue: Telegram bootstrap race creates duplicate RBAC grants and breaks message processing

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/211
**Status**: Research Needed
**Created**: 2026-07-20
**Priority**: not specified
**Size**: medium
**Areas**: API, database, Telegram

---

## Problem to Solve

Telegram can deliver a `forum_topic_created` service update immediately before the user's `/start` message. Both updates bootstrap the same Telegram subject/chat concurrently. The RBAC Knowledge grant provisioning currently uses find-then-create without database uniqueness for its natural keys, so both inserts can succeed and persist duplicate grants. Later bootstraps then fail the single-row integrity check and Telegram only returns a generic transport error.

The Telegram adapter also performs free-subscription checkout after every bootstrap even though bootstrap returns `shouldCheckoutFreeSubscription`. Existing active subscriptions can therefore make otherwise valid messages fail with `Checking out order has active subscription products`.

## Production Evidence

- Observed on image/revision `0.0.289` / `a177b2c02279b925175cc39def094f2d718b2439`.
- One API replica and one Telegram replica; concurrency occurs within the running services.
- Duplicate groups found: 14 permission groups, 14 role-permission groups, and 2 subject-role groups.
- Permission duplicates exactly match the 14 Knowledge access descriptors.
- Duplicate pairs were created within milliseconds during the same pair of bootstrap requests.

## Reproduction

1. Use a Telegram private chat with topics enabled.
2. Send `/start` in a newly created topic.
3. Process the adjacent `forum_topic_created` and `/start` updates concurrently.
4. Both updates invoke `POST /api/rbac/subjects/telegram/bootstrap` and `SocialProfileKnowledgeAccessService.ensure()`.
5. Without natural-key uniqueness, both inserts can succeed.
6. A later bootstrap fails because `findSingle()` sees more than one matching permission.

## Required Outcome

- Safely merge existing duplicate permissions and relation rows before constraints are applied.
- Enforce uniqueness for permission `(type, method, path)`, role-permission `(roleId, permissionId)`, and subject-role `(subjectId, roleId)`.
- Make concurrent Knowledge grant provisioning result in one logical grant.
- Make concurrent Telegram topic creation and `/start` bootstrap successfully.
- Do not checkout a free subscription after every normal bootstrap.
- Make repeated `/start` successful when the free subscription is already active.
- Cover real concurrency and database constraints with regression tests.
- Preserve useful operational diagnostics without exposing secrets.

## Implementation Constraints

- Fix the shared database/service invariants, not only this Telegram call site.
- Generate Drizzle migrations through the repository targets; do not hand-edit generated migrations.
- An in-memory keyed lock may be defense in depth but cannot replace database constraints across replicas.
- Avoid catching a single validation message in Telegram as the primary idempotency mechanism.
