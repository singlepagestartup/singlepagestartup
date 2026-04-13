# Social Chat Threads Implementation Plan

## Overview

Implement thread-scoped subject chat messaging so message create/read use the same chat-thread route, OpenRouter replies stay in the triggering thread, and historical data is normalized without DB migrations.

Update (2026-04-13): thread message routing is hard-cut over to profile-scoped paths:
`/rbac/subjects/{id}/social-module/profiles/{socialModuleProfileId}/chats/{socialModuleChatId}/threads/{socialModuleThreadId}/messages`.
Legacy chat-thread message route/SDK methods are removed.

## Current State Analysis

Subject chat message flow is currently chat-scoped: create/find handlers sit under chat routes and thread support is treated as optional context. OpenRouter reaction flow posts status/final replies through subject message create without guaranteed thread propagation. Frontend chat overview/message components are not aligned to canonical thread-in-path routing.

## Desired End State

After implementation:

- message create/read are thread-scoped via canonical route:
  - `POST /rbac/subjects/{subjectId}/social-module/profiles/{socialModuleProfileId}/chats/{chatId}/threads/{threadId}/messages`
  - `GET /rbac/subjects/{subjectId}/social-module/profiles/{socialModuleProfileId}/chats/{chatId}/threads/{threadId}/messages`
- RBAC subject SDK/server/client use full profile-thread path (`/subjects/<id>/social-module/profiles/<id>/chats/<id>/threads/<id>/...`) instead of optional `threadId` filter contracts;
- chat creation guarantees a single default thread and valid chat-thread ownership checks;
- OpenRouter status/final replies are always created in the same thread as the trigger message;
- frontend thread selector/create/message components are synchronized to path-based chat/thread routing (no conflicting query-driven thread identity);
- historical threadless chat/message data is normalized by idempotent API/service routines executed via agent flow, not via new DB migrations.

### Key Discoveries

- Subject routes currently expose chat/message/action endpoints without canonical thread-scoped message create/read route ([index.ts:294](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:294), [index.ts:330](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:330)).
- Subject message create/find are currently chat-scoped ([message/create.ts:103](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:103), [message/find.ts:47](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/find.ts:47)).
- OpenRouter reaction creates status/final messages via subject message create points that currently do not enforce thread continuity ([react-by-openrouter.ts:421](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:421), [react-by-openrouter.ts:668](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:668), [react-by-openrouter.ts:916](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:916)).
- Frontend chat overview/message components currently do not operate on canonical chat-thread path state ([chat overview Component.tsx:9](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/social/widget/singlepage/chat/overview/default/Component.tsx:9), [message list client.tsx:14](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/client.tsx:14)).
- Subject OpenAPI currently lacks chat-thread-scoped message route contracts ([paths.yaml:1284](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/sdk/model/src/lib/paths.yaml:1284)).

## What We're NOT Doing

- No new DB migrations for this issue.
- No schema-level constraint rollout in this phase.
- No query-only `threadId` API contract as the primary routing mechanism.
- No unrelated refactors in social admin/admin-v2 surfaces outside subject chat flow.

## Implementation Approach

Move to a route-first thread model. The canonical identity of message context is `(subjectId, chatId, threadId)` in the URL path. Backend and SDK contracts are aligned first, then OpenRouter/agent propagation is fixed, then frontend selectors are bound to the same path model. Historical data normalization is executed through idempotent service/API routines triggered from agent flows.

## Phase 1: Contract And Route Realignment

### Overview

Define canonical chat-thread message routes and update subject routing + SDK/OpenAPI so `threadId` is path-bound instead of optional filter/query input.

### Changes Required

#### 1. Subject route registration for thread-scoped messaging

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts`  
**Why**: current route surface is chat-scoped for messages.  
**Changes**:

- register canonical thread-scoped message routes under subject scope:
  - `GET /:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/threads/:socialModuleThreadId/messages`
  - `POST /:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/threads/:socialModuleThreadId/messages`
- keep thread list/create under chat scope:
  - `GET /:id/social-module/chats/:socialModuleChatId/threads`
  - `POST /:id/social-module/chats/:socialModuleChatId/threads`
- align owner middleware and RBAC subject checks to full path identity.

#### 2. Subject controller handlers for thread-scoped message create/find

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/chat/find-by-id/thread/find-by-id/message/find.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/chat/find-by-id/thread/find-by-id/message/create.ts`

**Why**: create/read must share one canonical chat-thread route for behavior + invalidation.
**Changes**:

- implement `find` by thread path params only;
- implement `create` by thread path params only;
- remove optional `threadId` filter dependency from message route contract in this flow.

#### 3. OpenAPI and subject SDK path updates

**Files**:

- `libs/modules/rbac/models/subject/sdk/model/src/lib/paths.yaml`
- `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/**`
- `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/**`

**Why**: callers must consume full path contract (`/subjects/<id>/social-module/chats/<id>/threads/<id>/...`).
**Changes**:

- add thread-scoped message create/find path entries;
- update generated/handwritten SDK wrappers to require `socialModuleThreadId` path param;
- remove/retire optional `threadId` query/body filter as primary mechanism for message find.

### Success Criteria

#### Automated Verification

- [ ] `npx nx run @sps/rbac:tsc:build` passes.
- [ ] Subject SDK build/type checks pass with required thread path params.
- [ ] OpenAPI checks pass for updated `paths.yaml`.

#### Manual Verification

- [ ] API docs show thread-scoped message create/find routes.
- [ ] Subject SDK usage requires full chat-thread path for thread message operations.

---

## Phase 2: Backend Thread Invariants And Message Flow

### Overview

Ensure runtime invariants for default thread creation, chat-thread ownership validation, and thread-scoped message linking in subject backend.

### Changes Required

#### 1. Subject DI extension for thread relations

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/di.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/bootstrap.ts`

**Why**: subject handlers need direct access to `thread`, `chatsToThreads`, `threadsToMessages` services.
**Changes**: register and inject missing services.

#### 2. Chat create default thread bootstrap

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/create.ts`  
**Why**: every chat must have exactly one default thread at creation.  
**Changes**:

- create default thread during chat create flow;
- create chat-thread link with default variant;
- enforce deterministic behavior in repeated/retried requests.

#### 3. Thread-scoped message create/find handler behavior

**Files**:

- thread-scoped message `create.ts`
- thread-scoped message `find.ts`

**Why**: route contract requires explicit chat/thread identity.
**Changes**:

- validate `(chatId, threadId)` ownership before create/find;
- create message and always persist `threads-to-messages` link;
- keep existing dedup (`sourceSystemId`) and attachment behavior;
- ensure GET returns only requested thread messages.

#### 4. Thread list/create handlers under chat scope

**Files**:

- `.../chat/find-by-id/thread/find.ts`
- `.../chat/find-by-id/thread/create.ts`

**Why**: frontend needs thread discovery and thread creation in active chat.
**Changes**:

- return chat-owned threads;
- create user threads with `variant="custom"`;
- keep default thread protected from accidental duplicate creation.

### Success Criteria

#### Automated Verification

- [ ] `npx nx run @sps/rbac:jest:test` passes for updated subject chat/thread/message handlers.
- [ ] `npx nx run @sps/rbac:tsc:build` passes after DI and handler updates.

#### Manual Verification

- [ ] New chat immediately has one default thread.
- [ ] Thread-scoped POST rejects cross-chat thread usage.
- [ ] Thread-scoped GET returns only messages from selected thread.

---

## Phase 3: OpenRouter And Agent Same-Thread Replies

### Overview

Guarantee that OpenRouter-triggered status/final messages are created in the same thread as the triggering message.

### Changes Required

#### 1. Resolve trigger message thread in reaction flow

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`  
**Why**: current reaction flow is effectively chat-scoped for status/final emits.  
**Changes**:

- resolve trigger message thread from `threads-to-messages`;
- pass resolved `threadId` through all intermediate status/final create calls;
- if legacy message has no thread link, bind it to chat default thread first, then continue.

#### 2. Agent service propagation of thread context

**Files**:

- `libs/modules/agent/models/agent/backend/app/api/src/lib/di.ts`
- `libs/modules/agent/models/agent/backend/app/api/src/lib/bootstrap.ts`
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`

**Why**: agent service must preserve thread identity when building context and publishing replies.
**Changes**:

- include thread services in DI;
- add thread context to relevant service method contracts;
- call subject thread-scoped message create route for status/final outputs.

### Success Criteria

#### Automated Verification

- [ ] `npx nx run @sps/agent:jest:test` passes for thread propagation scenarios.
- [ ] `npx nx run @sps/rbac:jest:test` passes for OpenRouter reaction scenarios.

#### Manual Verification

- [ ] Triggering OpenRouter on a thread message creates status + final replies in that same thread.
- [ ] Context reset behavior remains isolated to active thread context.

---

## Phase 4: Frontend Thread Selector, Creation, And Path Sync

### Overview

Align existing chat overview/message components to canonical chat-thread path routing and remove thread identity conflicts between path and query.

### Changes Required

#### 1. Chat overview thread selector and create action

**Files**:

- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/overview/default/ClientComponent.tsx`
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/social/widget/singlepage/chat/overview/default/Component.tsx`

**Why**: UI needs explicit thread selection/creation tied to path identity.
**Changes**:

- load threads for active chat;
- render selector + create-thread action (`variant="custom"`);
- on selection, navigate to canonical chat-thread route segment;
- remove conflicting thread identity handling through query-only state.

#### 2. Message list/send integration with thread-scoped endpoints

**Files**:

- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/client.tsx`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/server.tsx`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx`

**Why**: message fetch/create should use same thread-scoped route for consistency and invalidation.
**Changes**:

- fetch messages via `GET .../chats/:chatId/threads/:threadId/messages`;
- create messages via `POST .../chats/:chatId/threads/:threadId/messages`;
- unify cache keys/invalidation around `(chatId, threadId)` path identity.

### Success Criteria

#### Automated Verification

- [ ] `npx nx run @sps/rbac:jest:test` passes for thread selector/message components.
- [ ] `npx nx run @sps/host:jest:test` passes for host widget path sync updates.

#### Manual Verification

- [ ] Selecting a thread switches URL to thread path and reload keeps same thread.
- [ ] Creating a thread updates selector and routes into new thread.
- [ ] Sending/fetching messages works only through selected thread route.

---

## Phase 5: Data Normalization Via Agent/Service Routine (No Migration)

### Overview

Backfill existing threadless records through idempotent service/API routines invoked by agent flow, with no new database migrations.

### Changes Required

#### 1. Service/API normalization routines

**Files**:

- social/subject service modules responsible for chat/thread/message consistency
- agent-executed maintenance entrypoint (issue-scoped utility)

**Why**: historical chats/messages may miss default thread or thread-message links, but migrations are out of scope.
**Changes**:

- add idempotent routines to:
  - ensure default thread per chat;
  - ensure thread-message link for existing chat messages;
  - skip already-normalized records;
- expose routine through controlled API/service function invoked by agent execution.

#### 2. Regression coverage for normalization and routing

**Files**:

- backend BDD specs near subject/agent chat-thread handlers;
- scenario specs under issue-154 lane.

**Why**: verify safe reruns and non-regression for thread routing.
**Changes**:

- add rerunnable normalization scenario checks;
- add OpenRouter same-thread regression tests;
- add frontend path-sync behavior tests.

### Success Criteria

#### Automated Verification

- [ ] Normalization routine can run repeatedly without duplicate side effects.
- [ ] Added backend/frontend/scenario BDD tests pass in issue-154 scope.

#### Manual Verification

- [ ] Legacy chats/messages appear in expected default/custom threads after routine run.
- [ ] Re-running routine produces no duplicate links and no message loss.

---

## Testing Strategy

### Unit Tests

- Subject thread route handlers:
  - thread-scoped message create/find;
  - cross-chat thread rejection;
  - thread list/create behavior.
- Agent/OpenRouter:
  - trigger-thread resolution;
  - status/final message same-thread publication.
- Frontend:
  - thread selector + create;
  - path synchronization;
  - thread-scoped fetch/create integration.

### Integration/Scenario Tests

- End-to-end flow:
  - create chat -> default thread exists;
  - create custom thread -> send/fetch in selected thread;
  - OpenRouter reply remains in trigger thread.
- Normalization flow:
  - run service/API backfill on threadless legacy data;
  - rerun and assert idempotence.

### Manual Testing Steps

1. Create chat and verify default thread is created.
2. Create custom thread and switch to it.
3. Send message and verify it appears only in active thread path.
4. Trigger OpenRouter and verify status/final replies stay in same thread.
5. Run normalization routine twice and verify no duplicates or data loss.

## Performance Considerations

- Thread-scoped reads should use relation-filtered queries without chat-wide scans.
- OpenRouter thread resolution should be one relation lookup per trigger message.
- Normalization routine should be batched and resumable to avoid long blocking operations.

## Data Sync Notes

- No schema migration is introduced in this issue.
- Normalization is handled at service/API level and must be safe for repeated agent runs.
- Rollback path: stop routine and re-run idempotently after fixing service logic.

## References

- Ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-154.md`
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-154.md`
- Subject route/controller anchors:
  - [index.ts:294](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:294)
  - [message/create.ts:103](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:103)
  - [message/find.ts:47](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/find.ts:47)
  - [chat/create.ts:68](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/create.ts:68)
- OpenRouter anchors:
  - [react-by-openrouter.ts:421](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:421)
  - [react-by-openrouter.ts:668](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:668)
  - [react-by-openrouter.ts:916](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:916)
- Frontend anchors:
  - [chat overview Component.tsx:9](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/social/widget/singlepage/chat/overview/default/Component.tsx:9)
  - [message list client.tsx:14](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/client.tsx:14)

<!-- Last synced at: 2026-04-09T23:49:45Z -->
