# Issue: Social chat threads: default-thread routing, thread-aware replies, thread switch/create UI, and historical backfill

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/154
**Status**: Research Needed
**Created**: 2026-04-06
**Priority**: high
**Size**: large

---

## Problem to Solve

In the current user chat flow, threads (`social.thread`) already exist in the `social` module but are not actually used for message routing or retrieval. Messages are only linked to chats (`chats-to-messages`), which prevents proper thread-based behavior:

- users cannot choose a thread when sending a message;
- users cannot switch message view by thread;
- automatic replies are not guaranteed to stay in the same thread;
- default-thread behavior is not enforced for existing and new data.

## Key Details

- A `default` thread must be created when a chat is created, with a fallback creation path on the first message if it is still missing.
- If no thread is selected in UI:
  - show all messages in the chat;
  - send messages to the default thread.
- If a thread is selected:
  - show only messages from that thread;
  - send messages to that selected thread.
- UI must support:
  - thread switching;
  - creating a new thread in the current chat.
- Thread variants:
  - `thread.variant = "default"` is reserved for the system default thread only;
  - user-created threads must be `thread.variant = "custom"`.
- Cardinality invariant:
  - one `thread` belongs to exactly one `chat`.
- Historical data backfill is required:
  - each existing chat must have a default thread;
  - messages without thread links must be connected to the default thread;
  - the backfill process must be idempotent.
- Automatic replies in `agent/openrouter/telegram` must always publish to the same thread as the source message.

### Key Code Anchors

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx`
- `libs/modules/social/models/thread/backend/repository/database/src/lib/fields/singlepage.ts`
- `libs/modules/social/relations/chats-to-threads/backend/repository/database/src/lib/schema.ts`

## Public/API Changes

- Extend subject message create endpoint with optional `threadId` in `data`.
- Extend subject message find endpoint with optional query `threadId` for filtering.
- Add subject endpoints for chat threads:
  - `GET /api/rbac/subjects/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/threads`
  - `POST /api/rbac/subjects/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/threads`
- Update SDK client/server and OpenAPI `paths.yaml` to reflect the new contracts.

## Acceptance Criteria

- Each chat has exactly one default thread.
- A message sent without `threadId` always ends up in the default thread.
- A message sent with `threadId` is stored in that specific thread when thread/chat ownership is valid.
- UI supports all-threads view, thread-specific view, thread creation, and thread switching.
- Selected thread is synchronized with URL query (`threadId`) and survives reload/share.
- `agent/openrouter/telegram` automatic replies are posted to the same thread.
- Historical messages remain available after backfill with no data loss.
- BDD tests cover create/find/filter/backfill and the key frontend scenario.

## Implementation Notes

### Backend Scope

- Add thread linking to subject-flow message create/find controllers.
- Add subject-flow thread list/create controllers.
- Extend DI in `rbac` and `agent` to include `thread`, `chatsToThreads`, and `threadsToMessages`.

### Agent/OpenRouter Scope

- Determine thread context for incoming message/action.
- Propagate thread context to status/reply message creation.

### Frontend Scope

- Load thread list for the active chat.
- Support `all` and `selected thread` modes.
- Sync selected thread with `threadId` query param.
- Create new `custom` thread from chat UI.
- Send messages to selected thread, or default-thread fallback when no thread is selected.

### Migration Scope

- Implement idempotent backfill for existing chats/messages.
- Normalize thread variants to enforce `default/custom` invariants.
