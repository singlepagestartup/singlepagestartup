---
date: 2026-07-18T00:28:05+03:00
researcher: flakecode
git_commit: cacfb1bc9bf58cd44ed400c5b82c6e1c3bf094d0
branch: main
repository: singlepagestartup
topic: "Add Telegram assistant profile management conversations"
tags: [research, codebase, telegram, agent, rbac, social, knowledge, file-storage, grammY]
status: complete
last_updated: 2026-07-18
last_updated_by: flakecode
---

# Research: Add Telegram Assistant Profile Management Conversations

**Date**: 2026-07-18T00:28:05+03:00
**Researcher**: flakecode
**Git Commit**: cacfb1bc9bf58cd44ed400c5b82c6e1c3bf094d0
**Branch**: main
**Repository**: singlepagestartup

## Research Question

Document the current codebase state for adding Telegram-native assistant profile
management with an `/assistant` command, including:

- Agent-owned command definitions, startup overrides, and Telegram publication;
- the grammY transport, conversation/session state, callback handling, and topic
  routing;
- subject, chat, thread, requester-profile, and manageable AI-profile resolution;
- the existing web chat profile sidebar and its Profile, MCP, Skills, and
  Knowledge operations;
- subject-scoped authorization, Social relations, Knowledge operations, File
  Storage avatar handling, and reusable BDD patterns;
- which issue requirements already have live runtime surfaces and which do not.

## Summary

The current system already has most of the domain operations needed by a
Telegram assistant editor. The web chat profile sidebar edits an
`artificial-intelligence` profile's allowed fields and avatar, toggles its
supported MCP identifiers, creates and edits linked skills, and performs linked
Knowledge document create/update/reindex/delete through chat-scoped RBAC routes.
Social, Knowledge, and File Storage remain the persistent sources of truth.

Agent is already the source of truth for Telegram commands. Its startup service
merges child-project overrides into the SinglePage definitions, its controller
serializes the effective catalog, and `apps/telegram` publishes the result with
`setMyCommands` before installing the webhook. `/assistant` is not present in
the current catalog, and command definitions do not contain a serializable
conversation identifier.

The Telegram adapter already resolves the sender's RBAC subject, Telegram
profile, chat, personal AI profile, and SPS thread. It preserves Telegram forum
topics through `message_thread_id` and already uses the tuple of chat, thread,
and sender for its split-`/learn` buffer. The live bot imports grammY
conversation types and registers `/cancel`, `/exit`, and `/stop`, but it does
not install grammY session/conversation middleware, register named
conversations, or enter a conversation from a command.

The current skill sidebar API exposes linked-skill find, create-and-link, and
update. It does not expose available-skill discovery, link-existing, or unlink
operations, and its current read is not paginated. The Knowledge sidebar API
already exposes linked document find/create/update/reindex/delete, but its
current read is also not paginated.

The current profile-management routes are guarded by subject ownership plus a
middleware that verifies the requester profile belongs to the subject and the
target is an AI profile linked to both the chat and an agent subject. There is
no dedicated subject-scoped route that returns the set of all manageable AI
profiles for the current chat; the web UI opens the sidebar from profile data
already present in the chat timeline.

## Detailed Findings

### 1. Agent Owns The Effective Telegram Command Registry

`ITelegramCommandDefinition` currently contains a command, description, target,
optional message/callback handlers, and enabled state. Targets are either
`telegram-bot` or `artificial-intelligence`
(`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:96-124`).

The SinglePage definitions currently include `/start`, `/help`, `/referral`,
`/premium`, `/new`, four thread commands, `/knowledge`, and `/learn`. There is no
`/assistant` entry
(`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:175-256`).

The registry merge uses the lowercase command as its key. An override can
replace individual fields on an existing definition, a new command must supply
both description and target, and `enabled: false` removes the command from the
effective list
(`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:259-288`).
The startup service applies
`getStartupTelegramCommandDefinitions()` after the SinglePage list
(`libs/modules/agent/models/agent/backend/app/api/src/lib/service/startup/index.ts:10-18`).

Publication strips the leading slash and validates Telegram's command and
description constraints
(`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:290-312`).
The Agent controller exposes the resulting list through its Telegram commands
route
(`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/index.ts:91-94`,
`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/index.ts:158-160`).

Incoming messages and callback actions are resolved through the same registry.
Agent executes definitions targeted at `telegram-bot`; AI-targeted commands are
left for the automatic AI profile path
(`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:511-615`,
`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1016-1085`).

### 2. Telegram Startup, Updates, And Current Conversation State

At startup, `apps/telegram` fetches the effective command catalog with the Agent
server SDK and internal service credential. It publishes the same catalog to
the default, private-chat, group-chat, and chat-administrator scopes, then
installs the webhook
(`apps/telegram/src/lib/telegram-bot.ts:655-701`). Startup retry and credential
redaction are owned by the wrapper in `apps/telegram/src/lib/startup.ts:68-117`.

The live bot uses direct grammY handlers for callback queries and messages.
Callbacks are acknowledged immediately and then persisted as a subject-scoped
`social.action`; callback message topic metadata is forwarded into bootstrap
and the resulting SPS thread id is stored in the action payload
(`apps/telegram/src/lib/telegram-bot.ts:336-431`). Incoming messages pass through
forum-service filtering, media-group buffering, split-`/learn` buffering, media
normalization, and RBAC message ingestion
(`apps/telegram/src/lib/telegram-bot.ts:536-652`).

The bot imports `Conversation` and `ConversationFlavor`, types its context with
the conversation flavor, and declares a `conversations` array
(`apps/telegram/src/lib/telegram-bot.ts:15-23`,
`apps/telegram/src/lib/telegram-bot.ts:149-166`). It registers `/cancel`,
`/exit`, and `/stop` to call `ctx.conversation.exit()`
(`apps/telegram/src/lib/telegram-bot.ts:182-187`). No `session()`,
`conversations()`, `createConversation(...)`, or `ctx.conversation.enter(...)`
call exists in the live Telegram app.

A separate Telegram module page controller contains a basic `/pages/create`
conversation prompt
(`libs/modules/telegram/models/page/backend/app/api/src/lib/controller/singlepage/index.ts:58-64`,
`libs/modules/telegram/models/page/backend/app/api/src/lib/controller/singlepage/index.ts:107-123`).
The Telegram app's module binder is empty, so that module controller is not
mounted by the live Telegram service (`apps/telegram/src/lib/apps.ts:3-11`).

### 3. Telegram Identity, Chat, AI Profile, And Thread Resolution

The RBAC Telegram bootstrap controller extracts the Telegram sender, chat,
message text, and optional topic id, then delegates to the subject service
(`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/telegram/bootstrap.ts:53-63`).

The service resolves or creates the Telegram identity and owner subject, then
resolves or creates the sender's `social.profile.variant="telegram"` and its
subject relation
(`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:1680-1888`).
It resolves or creates the Telegram `social.chat` by source-system chat id and
ensures the sender profile is linked to it
(`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:583-647`).

The personal AI lifecycle resolves or creates an `rbac.subject.variant="agent"`,
an `artificial-intelligence` profile, profile-specific Knowledge permissions,
and the profile-to-chat relation
(`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/personal-ai-agent.ts:323-360`).
New personal AI profiles start with the built-in MCP identifier enabled
(`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/personal-ai-agent.ts:187-204`).
Bootstrap also ensures the system `telegram-bot` agent profile is connected when
available
(`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:1489-1652`).

Messages without a Telegram topic resolve to the chat's default SPS thread.
Topic messages resolve or create `social.thread.variant="telegram"` records by
the Telegram `message_thread_id`
(`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:1180-1311`).
The transport keeps replies in a topic by forwarding `message_thread_id`
(`apps/telegram/src/lib/telegram-bot.ts:189-197`,
`apps/telegram/src/lib/telegram-bot.ts:298-305`). Its split-`/learn` buffer key
contains Telegram chat id, topic/thread id, and sender id
(`apps/telegram/src/lib/telegram-bot.ts:1220-1237`).

### 4. The Web Chat Already Provides The Target Management Surface

The current RBAC chat shell mounts a profile sidebar and the skill, Knowledge,
MCP, and profile-edit dialogs
(`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:157-294`).
Timeline rows call `openProfile(...)` with profile data already loaded by the
chat UI
(`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:209-218`,
`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/hooks/use-profile-sidebar.ts:294-317`).

Management controls are enabled only when the selected profile has
`variant="artificial-intelligence"`
(`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/hooks/use-profile-sidebar.ts:75-78`).
The Social `chat-profile-sidebar` variant renders the selected profile and the
Profile, MCP, Skills, and Knowledge sections
(`libs/modules/social/models/profile/frontend/component/src/lib/singlepage/chat-profile-sidebar/ClientComponent.tsx:42-320`).

The sidebar loads linked skills and linked Knowledge documents with chat-scoped
RBAC SDK hooks. Neither call passes page, limit, or offset parameters
(`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/hooks/use-profile-sidebar.ts:99-150`).

### 5. Subject-Scoped Profile Management Authorization

The chat-local profile, avatar, skill, and Knowledge routes all live under:

`/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/profiles/:targetSocialModuleProfileId/...`

The route block pairs subject ownership with
`RequestSubjectCanManageChatAgentProfile`
(`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:499-605`).

That middleware currently verifies:

- the subject owns the chat;
- the requesting profile belongs to the subject;
- the target profile exists and has `variant="artificial-intelligence"`;
- the target profile is connected to the chat;
- the target profile is linked to at least one `rbac.subject.variant="agent"`;
- when a skill or document id is in the path, that record is linked to the
  target profile.

These checks are implemented in
`libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-can-manage-chat-agent-profile/index.ts:67-110`,
`libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-can-manage-chat-agent-profile/index.ts:119-247`,
and
`libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-can-manage-chat-agent-profile/index.ts:249-317`.

The controller exposes target-profile mutations and child-resource reads, but
does not expose a collection route that returns all manageable AI profiles for
a chat (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:499-605`).
The generic Social layer can find profiles and profile/chat relations, while
the existing web UI selects profiles from its already-loaded chat participants
(`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/default/Component.tsx:43-117`).

### 6. Profile Fields, MCP Configuration, And Avatar Storage

The Social profile schema contains localized `title`, `subtitle`, and
`description`, `adminTitle`, `slug`, and `allowedMcpServerIds`
(`libs/modules/social/models/profile/backend/repository/database/src/lib/fields/singlepage.ts:10-41`).

The chat-local profile update handler accepts only `adminTitle`, the three
localized fields, and `allowedMcpServerIds`. It rejects identity, variant, slug,
and timestamp fields, validates localized object values, deduplicates MCP ids,
and updates the Social profile through its server SDK
(`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/update.ts:37-87`,
`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/update.ts:112-178`).

The supported MCP descriptor catalog currently contains only
`singlepagestartup`
(`libs/modules/social/models/profile/sdk/model/src/lib/mcp-servers.ts:19-25`).
The web MCP dialog toggles identifiers from that descriptor list and sends the
result through the profile update route
(`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/components/McpServersDialog.tsx:65-99`,
`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:271-283`).

The avatar handler accepts a multipart image, creates a File Storage record,
and creates `profiles-to-file-storage-module-files` at `orderIndex: 0`
(`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/avatar/update.ts:21-75`).
The avatar component reads the latest linked relation, then the linked file,
and falls back to profile initials if no usable image is available
(`libs/modules/social/models/profile/frontend/component/src/lib/singlepage/chat-profile-avatar/Component.tsx:54-162`).

### 7. Current Skill Operations

The sidebar's linked-skill handler first resolves profile-to-skill relations,
then loads the linked `social.skill` rows and restores relation order
(`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/skill/find.ts:14-50`).

Create accepts `title`, `slug`, and `description`, creates a `social.skill`, and
immediately creates the `profiles-to-skills` relation
(`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/skill/create.ts:19-55`).
Update changes the existing skill's title, slug, admin title, and description
(`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/skill/update.ts:18-43`).

The current route block contains linked find (`GET`), create-and-link (`POST`),
and update (`PATCH`) only
(`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:520-550`).
No subject-scoped available-skill list, link-existing, or unlink route exists in
that block. Generic `social.skill` and `profiles-to-skills` model/relation CRUD
services exist outside the chat-local surface
(`libs/modules/social/models/skill/backend/app/api/src/lib/controller/singlepage/index.ts:1-8`,
`libs/modules/social/relations/profiles-to-skills/backend/app/api/src/lib/controller/singlepage/index.ts:1-8`).

### 8. Current Knowledge Document Operations

The chat-local route block exposes linked document `GET`, create `POST`, update
`PATCH`, explicit reindex `POST`, and delete `DELETE`
(`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:552-605`).

Find resolves `profiles-to-knowledge-module-documents` and passes the linked ids
to `KnowledgeService.listDocuments(...)`
(`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/knowledge/document/find.ts:20-39`).
Create calls `KnowledgeService.learnContent(...)` and then creates the Social
profile-document relation
(`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/knowledge/document/create.ts:24-82`).
`learnContent(...)` upserts and indexes the document
(`libs/modules/knowledge/backend/app/api/src/lib/service.ts:268-323`).

Update persists title and description but does not reindex in the same call;
the UI tracks that document as needing reindex
(`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/hooks/use-profile-sidebar.ts:383-459`).
Reindex and delete are separate subject-scoped calls
(`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/hooks/use-profile-sidebar.ts:462-524`).
`KnowledgeService.reindexDocument(...)` indexes one reloaded document, while
`deleteDocument(...)` removes the document and derived Knowledge data
(`libs/modules/knowledge/backend/app/api/src/lib/service.ts:111-118`,
`libs/modules/knowledge/backend/app/api/src/lib/service.ts:252-266`,
`libs/modules/knowledge/backend/app/api/src/lib/repository.ts:237-264`).

The document dialog exposes delete behind an explicit confirmation state
(`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/components/KnowledgeDocumentDialog.tsx:31-149`).

### 9. Existing Interaction, Pagination, And Test Patterns

The Agent callback handler validates callback data and dispatches registry
payloads with the `command_` prefix
(`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1016-1085`).
The Telegram adapter answers callbacks before executing the background RBAC
action path (`apps/telegram/src/lib/telegram-bot.ts:336-355`).

The shared frontend has reusable page/limit/offset table contracts and a
pagination-number helper
(`libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/interface.ts:46-60`,
`libs/shared/utils/src/lib/get-pagination/index.ts:1-39`). The current
chat-profile sidebar does not use those contracts for skills or Knowledge.

Existing BDD suites cover:

- command publication and publication-before-webhook behavior
  (`apps/telegram/src/lib/telegram-bot.spec.ts:45-105`);
- startup retries and credential redaction
  (`apps/telegram/src/lib/startup.spec.ts:18-98`);
- Agent command overrides, additions, publication, and disabling
  (`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-command-registry.spec.ts:33-167`);
- thread command routing
  (`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-thread-commands.spec.ts:111-359`);
- profile sidebar sections, errors, MCP toggles, avatar selection, and Knowledge
  actions
  (`libs/modules/social/models/profile/frontend/component/src/lib/singlepage/chat-profile-sidebar/Component.spec.tsx:38-229`,
  `libs/modules/social/models/profile/frontend/component/src/lib/singlepage/chat-profile-avatar/Component.spec.tsx:70-226`,
  `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.spec.tsx:1760-1845`).

No BDD suite for a named grammY assistant conversation exists in the inspected
Telegram app because that runtime surface is not currently registered.

## Code References

- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:96-124` - current Telegram command definition contract.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:175-312` - base definitions, merge, and publication serialization.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/startup/index.ts:10-18` - startup override extension point.
- `apps/telegram/src/lib/telegram-bot.ts:149-187` - live grammY bot state and cancellation commands.
- `apps/telegram/src/lib/telegram-bot.ts:336-431` - callback-to-RBAC-action transport flow.
- `apps/telegram/src/lib/telegram-bot.ts:655-701` - Agent catalog publication and webhook setup.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:583-647` - Telegram chat resolution.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:1180-1311` - default/topic thread resolution.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/personal-ai-agent.ts:323-360` - personal assistant profile lifecycle.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:499-605` - chat-local assistant management routes.
- `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-can-manage-chat-agent-profile/index.ts:67-247` - assistant management target checks.
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:157-294` - web sidebar and dialog composition.
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/hooks/use-profile-sidebar.ts:55-597` - profile, skill, and Knowledge sidebar state/actions.
- `libs/modules/social/models/profile/frontend/component/src/lib/singlepage/chat-profile-sidebar/ClientComponent.tsx:42-320` - Profile/MCP/Skills/Knowledge panel.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/update.ts:37-178` - allowed profile and MCP updates.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/avatar/update.ts:21-75` - File Storage avatar persistence.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/skill/find.ts:14-50` - linked skill list.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/skill/create.ts:19-55` - skill create-and-link.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/skill/update.ts:18-43` - linked skill edit.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/knowledge/document/create.ts:24-82` - document create-and-link.
- `libs/modules/knowledge/backend/app/api/src/lib/service.ts:111-118` - Knowledge delete service.
- `libs/modules/knowledge/backend/app/api/src/lib/service.ts:252-323` - Knowledge reindex and learn/index services.

## Architecture Documentation

The current ownership chain is:

1. Agent defines, merges, publishes, and executes the effective Telegram command
   catalog.
2. `apps/telegram` owns Telegram transport facts: webhook updates, callback
   acknowledgement, media download, sender/chat/topic identifiers, and message
   placement in the originating Telegram topic.
3. `rbac.subject` resolves the authenticated subject and exposes the
   subject-scoped assistant-management routes.
4. Social owns profiles, skills, chats, threads, and the profile-to-chat,
   profile-to-skill, profile-to-file, and profile-to-Knowledge relations.
5. Knowledge owns document content, indexing, reindexing, and deletion of
   derived Knowledge records.
6. File Storage owns uploaded avatar bytes and metadata.

The existing web sidebar follows the same chain: UI components call RBAC client
SDKs; RBAC handlers validate context and call Social/Knowledge/File Storage
services or server SDKs; Telegram-specific state is not stored in duplicate
domain models.

The live AI reaction architecture uses the unified
`react-by/openrouter` endpoint. A live-code search found no
`react-by/knowledge` route under RBAC, Agent, or Telegram. Knowledge management
is a separate subject-scoped document surface, while AI Knowledge use remains
part of the OpenRouter reaction flow
(`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:471-476`).

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-154.md:292-316`
  records the later thread-routing invariant: default threads are chat-scoped,
  thread routes validate `chatId + threadId`, and thread-targeted writes use the
  thread route. Its earlier chat-scoped findings are pre-rollout history.
- `thoughts/shared/research/singlepagestartup/ISSUE-189.md:42-71`
  documents the Telegram adapter boundary and the thread-scoped RBAC/File
  Storage ingestion chain that remains visible in live code.
- `thoughts/shared/research/singlepagestartup/ISSUE-192.md` documents the earlier
  dedicated Knowledge-reaction design. Issue 199 superseded that part of the
  architecture.
- `thoughts/shared/plans/singlepagestartup/ISSUE-199.md:337-445` and
  `thoughts/shared/processes/singlepagestartup/ISSUE-199.md:120-128` record the
  move to the single `react-by/openrouter` AI reaction path.
- `thoughts/shared/plans/singlepagestartup/ISSUE-199.md:493-534` and
  `thoughts/shared/processes/singlepagestartup/ISSUE-199.md:171-186` record the
  profile sidebar MCP surface and chat-local persistence of
  `allowedMcpServerIds`; both were verified in live code.
- `thoughts/shared/processes/singlepagestartup/ISSUE-199.md:675-710` records the
  personal Telegram AI profile's Knowledge access lifecycle; the corresponding
  live lifecycle is in `telegram/personal-ai-agent.ts`.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-154.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-183.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-189.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-192.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-193.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-199.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-145-admin-v2-playbook.md`

## Known Pitfalls (from implementation)

- GitHub workflow helpers can fail when sandboxed network access blocks
  `api.github.com`. Preserve the canonical helper invocation and retry the same
  fail-fast helper block with approved network access; do not replace the
  project/status helpers with ad-hoc `gh` mutations. This recurred during the
  Create and Research phases for issue #209.

## Open Questions

- The current Agent command definition has no serializable conversation id, and
  the Telegram app has no named conversation registry. The exact identifier
  format and registry ownership are not represented in current code.
- The live bot has no grammY session key function. Existing `/learn` buffering
  uses chat, topic, and sender, but no persisted or middleware-managed
  conversation restart/expiry contract exists.
- No subject-scoped collection route currently returns all manageable AI
  profiles for a chat. The current middleware validates one supplied target;
  the web UI starts from profile data already loaded in the chat timeline.
- Current skill routes do not define available-skill discovery,
  link-existing, or unlink response contracts.
- Current sidebar skill and Knowledge reads do not define page size, ordering
  metadata, or next/previous page response shapes.
- Existing Agent callback payloads use command prefixes, but the codebase does
  not define assistant-page callback versioning, expiry, or stale-button
  identity semantics.
- Avatar updates add another profile-file relation and avatar rendering selects
  the latest linked file. The codebase does not define a separate avatar
  replacement/deletion lifecycle for the Telegram conversation surface.
