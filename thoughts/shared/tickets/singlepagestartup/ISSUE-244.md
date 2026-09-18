---
repository: singlepagestartup
issue_number: 244
status: Research Needed
created: 2026-09-18
---

# Issue: Thread create route assigns the default relation variant to every non-Telegram thread and violates sl_chat_default_thread_unique

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/244
**Status**: Research Needed
**Created**: 2026-09-18
**Priority**: medium
**Size**: small
**Type**: bug

---

## Problem to Solve

Creating a second thread in a social chat through the subject-scoped route fails with HTTP 500 because the route stores every non-Telegram chat-to-thread relation with `variant: "default"`, and the natural-key index `sl_chat_default_thread_unique` allows only one default relation per chat. The issue-154 scenario in the repository reproduces it on `main` at `29370bcbf8`.

## Key Details

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/chat/find-by-id/thread/create.ts:140` writes the relation with `variant: telegramTopic ? "telegram" : data.variant || "default"`, so a request body without `variant` always produces a `default` relation.
- `libs/modules/social/relations/chats-to-threads/backend/repository/database/src/lib/constraints/singlepage.ts:17-20` declares `uniqueIndex("sl_chat_default_thread_unique").on(table.chatId).where(variant = 'default')`, introduced with the natural-key rollout (#211, PR #212).
- Running the scenario lane with credentials (`SCENARIO_REUSE_API=0 SCENARIO_API_PORT=4010 npm run test:scenario:issue -- singlepagestartup 154`) fails `When: messages are created in different threads Then: thread routes return isolated message sets` with `duplicate key value violates unique constraint "sl_chat_default_thread_unique"` (HTTP 500, see #232 for the status mapping). The scenario's `createCustomThread` sends only `title` (`apps/api/specs/scenario/singlepagestartup/issue-154/backend-social-chat-threads.scenario.spec.ts:150-172`), which matched the API contract when the scenario was written (#154) and before the constraint existed.
- The other two issue-154 scenario cases pass, so chat creation still provisions exactly one default thread.
- Impact: any client that creates additional threads without an explicit relation `variant` (web chat "create thread" flow, MCP or SDK callers) receives a 500 instead of a new thread; the scenario lane for #154 is red on `main`.

## Implementation Notes

Additional threads created through the route should get a non-default relation variant (or an explicit, documented `variant` contract), and the default-thread invariant must stay enforced without turning ordinary thread creation into a 500. Keep the repository BDD test format.

## Acceptance Criteria

- [ ] Creating a second thread without `variant` succeeds and does not become the chat's default thread.
- [ ] The default-thread invariant (`sl_chat_default_thread_unique`) stays enforced.
- [ ] `npm run test:scenario:issue -- singlepagestartup 154` passes with the credentials from `apps/api/create_env.sh`.
- [ ] BDD unit coverage for the route's variant assignment.

## References

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/chat/find-by-id/thread/create.ts`
- `libs/modules/social/relations/chats-to-threads/backend/repository/database/src/lib/constraints/singlepage.ts`
- `apps/api/specs/scenario/singlepagestartup/issue-154/backend-social-chat-threads.scenario.spec.ts`
- Related: #154, #211, #212, #232, #240

## Comments

None at creation time.
