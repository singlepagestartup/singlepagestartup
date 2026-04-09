---
date: 2026-04-09T01:58:27+03:00
researcher: flakecode
git_commit: 194db65db4d7838d0dda175a25c450d7b690e98b
branch: issue-154
repository: singlepagestartup
topic: "Social chat threads: default-thread routing, thread-aware replies, thread switch/create UI, and historical backfill"
tags: [research, codebase, social, rbac, agent, telegram, thread]
status: complete
last_updated: 2026-04-09
last_updated_by: flakecode
---

# Research: Social chat threads: default-thread routing, thread-aware replies, thread switch/create UI, and historical backfill

**Date**: 2026-04-09T01:58:27+03:00
**Researcher**: flakecode
**Git Commit**: 194db65db4d7838d0dda175a25c450d7b690e98b
**Branch**: issue-154
**Repository**: singlepagestartup

## Research Question

Document the current social chat/message/thread implementation for issue #154, including:

- subject-scoped message create/find behavior;
- thread model and relation availability;
- chat create flow and default-thread behavior in current code paths;
- agent/openrouter/telegram reply routing;
- frontend thread selection/thread URL state behavior;
- existing historical context in `thoughts/shared`.

## Summary

The codebase currently exposes thread entities and thread relations in the social module (`thread`, `chats-to-threads`, `threads-to-messages`) through generic social APIs and admin/admin-v2 UI surfaces. In the subject-scoped chat flow, message retrieval and message creation are currently chat-linked through `chats-to-messages`, with authorship through `profiles-to-messages`, and attachments through `messages-to-file-storage-module-files`.

The current subject message and agent/openrouter execution paths are chat-scoped. OpenRouter response generation reads recent chat context from `chats-to-messages` and writes replies back through the same subject message-create endpoint for the chat. Subject-side and agent-side DI surfaces currently expose chat/message relation services but do not expose thread/chats-to-threads/threads-to-messages services.

In frontend subject chat message UI, message list/create calls are scoped by `socialModuleChatId`; no `threadId` handling was found in that subtree. In the subject OpenAPI path definitions for chat messages, path/query definitions for these endpoints currently describe `id`, `socialModuleProfileId`, `socialModuleChatId`, and message body fields; no thread-specific parameter is defined there.

## Detailed Findings

### 1. Subject-Scoped Social Chat And Message Routes

Subject controller route registration includes chat list/find, message list/create/update/delete, action list/create, and openrouter reaction under:
`/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/...`.

- Route bindings: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:281`
- Message handlers wiring: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:546`
- Ownership middleware for these routes: `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-profile-subject-is-owner/index.ts:12`

### 2. Message Retrieval In Subject Flow Is Chat-Linked

Subject message-find handler:

1. validates `id`, `socialModuleProfileId`, `socialModuleChatId`;
2. fetches `chats-to-messages` by `chatId`;
3. fetches message rows by collected message IDs;
4. returns message array.

- Subject handler: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/find.ts:14`
- Chat-to-message relation usage: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/find.ts:47`

A generic social chat endpoint also exposes `GET /social/chats/:id/messages` with parent relation + parsed query merge pattern.

- Generic endpoint registration: `libs/modules/social/models/chat/backend/app/api/src/lib/controller/singlepage/index.ts:16`
- Generic message-find flow: `libs/modules/social/models/chat/backend/app/api/src/lib/controller/singlepage/message/find/index.ts:29`

### 3. Message Create In Subject Flow Writes Chat Link + Profile Link + Files

Subject message-create handler currently:

1. parses multipart `data` JSON and optional `files`;
2. optionally deduplicates by `sourceSystemId` within chat;
3. creates social message;
4. creates `chats-to-messages` relation;
5. uploads attachments and creates `messages-to-file-storage-module-files` rows;
6. triggers `profiles-to-messages.create(...)` and `notifyOtherSubjectsInChat(...)` asynchronously.

- Handler: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:22`
- Source-system dedupe path: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:77`
- Chat relation create: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:114`
- Profile relation create + notify flow: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:227`

### 4. Chat Create Flow In Subject Path

Subject chat-create handler currently:

1. validates subject/profile;
2. parses body `data` JSON;
3. creates social chat;
4. creates `profiles-to-chats` relation;
5. returns created chat payload.

- Handler: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/create.ts:16`
- Chat create call: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/create.ts:68`
- Profiles-to-chats link create: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/create.ts:77`

Telegram bootstrap also uses chat find/create patterns for social chat bootstrap in Telegram flow.

- Telegram bootstrap flow (chat creation branch): `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:634`

### 5. Thread Model And Thread Relations Exist In Social Module

Thread and thread relations are present as standalone social model/relation packages:

- Thread model table/schema
- Chats-to-threads relation table/schema
- Threads-to-messages relation table/schema

- Thread fields: `libs/modules/social/models/thread/backend/repository/database/src/lib/fields/singlepage.ts:4`
- Chats-to-threads schema: `libs/modules/social/relations/chats-to-threads/backend/repository/database/src/lib/schema.ts:10`
- Threads-to-messages schema: `libs/modules/social/relations/threads-to-messages/backend/repository/database/src/lib/schema.ts:10`
- Social app route mounting for thread + relations: `libs/modules/social/backend/app/api/src/lib/apps.ts:109`

### 6. Subject And Agent DI Surfaces For Social Services

Current subject-side social DI interface includes profile/chat/message/action + chat/message/profile relations + file relation, but does not include thread/chats-to-threads/threads-to-messages members.

- Subject DI interface: `libs/modules/rbac/models/subject/backend/app/api/src/lib/di.ts:23`
- Subject DI binding object: `libs/modules/rbac/models/subject/backend/app/api/src/lib/bootstrap.ts:155`

Current agent-side social DI interface and binding expose profile/chat/message/action + profile/chat/message relations, without thread/chats-to-threads/threads-to-messages members.

- Agent DI interface: `libs/modules/agent/models/agent/backend/app/api/src/lib/di.ts:10`
- Agent DI binding object: `libs/modules/agent/models/agent/backend/app/api/src/lib/bootstrap.ts:97`

### 7. Agent/OpenRouter/Telegram Reply Flow Is Chat-Scoped

Agent Telegram controller receives subject action routes and dispatches `onAction`/`onMessage`.
For message POSTs, it resolves chat via `chats-to-messages`, resolves chat profiles via `profiles-to-chats`, and then dispatches to responder profiles.

- Telegram agent controller: `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:16`
- Message dispatch flow: `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:336`

OpenRouter reply path in agent service calls subject endpoint `.../messages/:socialModuleMessageId/react-by/openrouter`.

- Agent responder branching: `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:106`
- Openrouter reply creation: `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1244`
- Openrouter endpoint call: `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1414`

In `react-by-openrouter` handler, conversation context is built from recent `chats-to-messages` rows for the chat; result message is posted back through subject message-create in the same chat.

- Context source from chats-to-messages: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:420`
- Status/reply message create calls: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:667`
- Final reply create: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:916`

### 8. Frontend Subject Chat Message UI Uses Chat Scope

Subject frontend message list component loads messages and actions by `socialModuleChatId` and merges them by `createdAt` in UI state.
Message create/update/delete mutations are also invoked with `socialModuleChatId`.

- Client query wrapper: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/client.tsx:14`
- Message/action rendering and create/update/delete usage: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:51`
- Server query wrapper: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/server.tsx:9`

No `threadId` references were found under `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/...` in this current state.

### 9. OpenAPI/SDK Contracts In Subject Paths

Subject SDK model path document currently includes:

- chat list/create and chat by-id;
- chat messages get/post;
- chat message react route;
- chat actions get/post.

- Subject paths file chat/messages section: `libs/modules/rbac/models/subject/sdk/model/src/lib/paths.yaml:1284`
- Subject paths file react section: `libs/modules/rbac/models/subject/sdk/model/src/lib/paths.yaml:1361`

Subject client/server SDK wrappers for chat message find/create and react-by-openrouter are located under:

- Client wrappers: `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/find.ts:25`
- Server wrappers: `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:29`
- Openrouter wrapper route string: `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:57`

## Code References

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:293` - subject chat message route registrations
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/find.ts:47` - message lookup through chats-to-messages
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:103` - message create + chats-to-messages link
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/create.ts:68` - subject chat create flow
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:420` - openrouter context build from chat messages
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:336` - agent handling of inbound chat message events
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1414` - agent call into subject openrouter reaction endpoint
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/di.ts:23` - subject social DI members
- `libs/modules/agent/models/agent/backend/app/api/src/lib/di.ts:10` - agent social DI members
- `libs/modules/social/models/thread/backend/repository/database/src/lib/fields/singlepage.ts:4` - thread model fields including `variant`
- `libs/modules/social/relations/chats-to-threads/backend/repository/database/src/lib/schema.ts:10` - chats-to-threads relation schema
- `libs/modules/social/relations/threads-to-messages/backend/repository/database/src/lib/schema.ts:10` - threads-to-messages relation schema
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/client.tsx:14` - frontend chat-scoped message query
- `libs/modules/rbac/models/subject/sdk/model/src/lib/paths.yaml:1284` - subject OpenAPI messages endpoint definition

## Architecture Documentation

Current social chat runtime flow in subject/agent paths is centered on these associations:

- Subject ownership of profile: `subjects-to-social-module-profiles`
- Profile membership in chat: `profiles-to-chats`
- Message containment in chat: `chats-to-messages`
- Message authorship/profile relation: `profiles-to-messages`
- Message file attachments: `messages-to-file-storage-module-files`

Thread entities and relations are available in social module architecture and admin/admin-v2 social surfaces, but subject chat/message controllers and agent/openrouter runtime paths currently operate through chat-message/profile-message relations.

## Historical Context (from thoughts/)

- `thoughts/shared/tickets/singlepagestartup/ISSUE-154.md` is the direct issue document defining desired thread routing/backfill behavior and API/UI scope.
- `thoughts/shared/research/singlepagestartup/ISSUE-145.md`, `thoughts/shared/plans/singlepagestartup/ISSUE-145.md`, and `thoughts/shared/handoffs/singlepagestartup/ISSUE-145-progress.md` provide earlier admin-v2 migration context for social/telegram modules.
- `thoughts/shared/research/singlepagestartup/ISSUE-150.md` and issue-152 artifacts provide related testing/matrix context.
- No prior `ISSUE-154` research artifact existed before this document.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-145.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-145-admin-v2-playbook.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-150.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-152.md`

## Open Questions

- The issue ticket references new subject thread list/create endpoints under chat scope; these endpoint paths are not present in current subject controller or subject paths.yaml route definitions.
- The ticket references `threadId` in subject message create/find contracts; this parameter is not present in current subject message handler parsing or subject paths.yaml parameter definitions.
- Existing repository migration patterns include idempotent SQL and rerunnable cleanup scripts; no dedicated issue-154 backfill script was located in current code paths.
