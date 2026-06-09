---
date: 2026-04-25T23:15:57+03:00
researcher: flakecode
git_commit: 11f2c07f5841c2ddc5223e5acba26722ef0edf85
branch: main
repository: singlepagestartup
topic: "Port draft chat UI into SPS subject social module"
tags: [research, codebase, rbac, social, chat, thread, frontend]
status: complete
last_updated: 2026-04-25
last_updated_by: flakecode
---

# Research: Port draft chat UI into SPS subject social module

**Date**: 2026-04-25T23:15:57+03:00
**Researcher**: flakecode
**Git Commit**: 11f2c07f5841c2ddc5223e5acba26722ef0edf85
**Branch**: main
**Repository**: singlepagestartup

## Research Question

Document the current draft chat UI, SPS subject social-module frontend surface, host route composition, and supported subject-scoped social chat/thread/message/action data flows for issue #164.

The issue asks to port the visual behavior from `apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx` into `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module` while preserving SPS data boundaries, SDK providers, relation `find` composition, and RBAC subject orchestration.

## Summary

The draft chat page is a single client-side React component with a three-column desktop layout, single-panel mobile layout, local mock state for chats/threads/messages, settings modals, thread search, thread create/edit/pin behavior, member controls, message grouping, unread divider behavior, reactions, emoji picker, and local file attachment previews (`apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:86`, `apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:161`, `apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:239`, `apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:934`, `apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:1385`).

The current SPS integration surface is already split across RBAC subject variants for chat list and chat overview. Host routes resolve `/social/chats/[social.chats.id]` and `/social/chats/[social.chats.id]/threads/[social.threads.id]` through host page composition and then call RBAC subject wrappers (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/social/widget/singlepage/chat/overview/default/Component.tsx:5`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject/singlepage/me/social-module-profile-chat-overview-default/ClientComponent.tsx:8`).

The backend and SDK already expose subject-scoped chat create/find/find-by-id, thread find/create for a chat, thread-scoped message find/create, chat-scoped message update/delete, and action find/create. The current frontend overview fetches threads, selects an active thread from the route or default thread, redirects to the canonical chat/thread route when needed, and renders a thread message/action feed (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/overview/default/ClientComponent.tsx:16`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/client.tsx:10`).

## Detailed Findings

### Draft Chat Page

- `ChatPage.tsx` imports local draft data and client-only dependencies including `react-router`, `date-fns`, `@emoji-mart/react`, `react-dnd`, and the draft `useEscapeStack` hook (`apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:1`).
- `DraggableFileItem` handles local file preview rows and uses `useDrag`/`useDrop` for attachment reordering (`apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:86`).
- `GroupList` renders the left chat/group column with active styling, unread aggregation across threads, and a new-chat button (`apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:161`).
- `ThreadList` renders the middle column with group header, settings modal, general/thread/member tabs, thread search, thread edit/pin controls, member search, and add/remove member controls (`apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:239`, `apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:393`, `apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:801`).
- `ThreadView` renders the right message column, including active thread header, message grouping by author/time gap, unread divider placement, quick reaction tray, textarea composer, emoji picker, and local attachment state (`apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:934`, `apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:1155`, `apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:1267`).
- The draft main component keeps local `groups`, `activeGroupId`, `activeThreadId`, `mobilePanel`, `unreadCounts`, and `openedUnread` state; desktop uses `md:grid md:grid-cols-[256px_300px_1fr]`, while mobile renders one of `groups`, `threads`, or `messages` at a time (`apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:1385`, `apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:1505`, `apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:1537`).

### Host Route Composition

- The live host entrypoint is the catch-all App Router page. It strips the optional locale prefix, derives `slashedUrl`, resolves the host page with `HostModulePage` `variant="find-by-url"`, and renders the resolved page variant (`apps/host/app/[[...url]]/page.tsx:38`, `apps/host/app/[[...url]]/page.tsx:45`, `apps/host/app/[[...url]]/page.tsx:60`).
- The host page seed for `/social/chats/[social.chats.id]` is stored in `libs/modules/host/models/page/backend/repository/database/src/lib/data/42e4f5a8-7612-4d28-ad3e-4027835a6d37.json:4`.
- The host page seed for `/social/chats/[social.chats.id]/threads/[social.threads.id]` is stored in `libs/modules/host/models/page/backend/repository/database/src/lib/data/3a3f793c-4a90-4cab-a35d-ec40848c34ed.json:4`.
- The social chat list widget renders the RBAC subject wrapper with `variant="me-social-module-profile-chat-list-default"` (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/social/widget/singlepage/chat/list/default/Component.tsx:4`).
- The social chat overview widget extracts `social.chats.id` and `social.threads.id` URL segment values, then renders `variant="me-social-module-profile-chat-overview-default"` with those IDs (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/social/widget/singlepage/chat/overview/default/Component.tsx:5`).
- The `me-social-module-profile-chat-list-default` host wrapper authenticates the current subject, finds linked social profiles through `subjects-to-social-module-profiles`, resolves profile records, and renders RBAC subject `social-module-profile-chat-list-default` for each linked profile (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject/singlepage/me/social-module-profile-chat-list-default/ClientComponent.tsx:8`).
- The `me-social-module-profile-chat-overview-default` host wrapper follows the same subject/profile resolution path and renders RBAC subject `social-module-profile-chat-overview-default` with the active chat/thread IDs (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject/singlepage/me/social-module-profile-chat-overview-default/ClientComponent.tsx:8`).

### RBAC Subject Frontend Surface

- The public RBAC subject singlepage variant registry exposes `social-module-profile-list-overview-default`, `social-module-profile-chat-list-default`, and `social-module-profile-chat-overview-default` (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/variants.ts:40`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/variants.ts:95`).
- The subject README lists the same social variants: profile list overview, chat list, and chat overview (`libs/modules/rbac/models/subject/README.md:91`).
- The chat list wrapper selects server/client implementation based on `props.isServer`, wraps with the RBAC subject SDK `Provider`, `Suspense`, and `ErrorBoundary`, then fetches chats through `api.socialModuleProfileFindByIdChatFind` on server and client paths (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/list/default/index.tsx:10`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/list/default/server.tsx:8`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/list/default/client.tsx:9`).
- The current chat list UI is client-only, opens a dialog for `social-module-profile-chat-create`, maps each fetched chat to `social-module-profile-chat-default`, and currently prints a module-level render counter into the DOM (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/list/default/ClientComponent.tsx:16`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/list/default/ClientComponent.tsx:31`).
- `social-module-profile-chat-default` fetches a single chat by subject/profile/chat IDs and renders a `Link` to `/social/chats/{chatId}`; it resolves chat participant chips through `profiles-to-chats` and `social/profile` `variant="find"` (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/default/server.tsx:8`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/default/Component.tsx:7`).
- `social-module-profile-chat-overview-default` fetches the active chat by ID, then its client component fetches chat threads ordered by `createdAt asc`, creates threads through `api.socialModuleChatFindByIdThreadCreate`, derives the active thread from route/default/first thread, route-replaces missing thread URLs, and renders `social-module-profile-chat-message-list-default` for the active thread (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/overview/default/client.tsx:9`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/overview/default/ClientComponent.tsx:16`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/overview/default/ClientComponent.tsx:41`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/overview/default/ClientComponent.tsx:74`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/overview/default/ClientComponent.tsx:261`).
- `social-module-profile-chat-message-list-default` fetches thread messages and chat actions, merges them into message/action feed items, renders message authors through `profiles-to-messages`, action authors through `profiles-to-actions`, profile records through `social/profile`, file attachments through `messages-to-file-storage-module-files`, and markdown message bodies through `markdown-to-jsx` (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/client.tsx:10`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:50`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:170`).
- The message-list client initializes mutations for thread-scoped message create, chat-scoped message delete, chat-scoped action create, and chat-scoped message update (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:51`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:58`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:65`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:73`).

### Subject-Scoped Backend And SDK Methods

- `/api/social` is mounted in the API app, and the social backend app expands into social model/relation apps (`apps/api/app.ts:140`, `libs/modules/social/backend/app/api/src/lib/apps.ts:33`).
- The subject-scoped social chat routes live under `/api/rbac/subjects`, whose SDK model route constant is `/api/rbac/subjects` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:286`, `libs/modules/rbac/models/subject/sdk/model/src/lib/index.ts:14`).
- Subject controller routes include profile chat find/find-by-id, subject chat create, chat thread find/create, chat-scoped message find/create, thread-scoped message find/create, message update/delete, action find/create, OpenRouter reaction, profile chat create, and profile chat delete (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:286`).
- The subject SDK exports the corresponding client actions from `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/index.ts:147` and re-exports them in the `api` object at `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/index.ts:361`.
- `POST /api/rbac/subjects/:id/social-module/chats` delegates to chat lifecycle creation. That lifecycle resolves or bootstraps a subject profile, creates a social chat, links it through `profiles-to-chats`, ensures a default thread through `thread` plus `chats-to-threads`, and returns the created chat (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/chat/create.ts:14`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/chat-lifecycle.ts:19`).
- `GET/POST /api/rbac/subjects/:id/social-module/chats/:socialModuleChatId/threads` validate subject ownership of the chat, then read `chats-to-threads` plus thread records or create a new thread and relation (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/chat/find-by-id/thread/find.ts:14`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/chat/find-by-id/thread/create.ts:16`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/chat-lifecycle.ts:71`).
- `GET/POST /api/rbac/subjects/:id/social-module/profiles/:profileId/chats/:chatId/threads/:threadId/messages` are wired to the existing message find/create handlers and use dedicated client/server SDK files under `.../thread/find-by-id/message` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:329`, `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/thread/find-by-id/message/find.ts:26`, `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/thread/find-by-id/message/create.ts:30`).
- Message find starts from `assertProfileCanAccessChat`; for a supplied thread path it validates that the thread belongs to the chat and reads `threads-to-messages`, otherwise it reads `chats-to-messages` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/find.ts:14`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/find.ts:164`).
- Message create parses multipart `data` and files, resolves the target thread, deduplicates by `sourceSystemId` inside the chat/thread, creates the social message, creates `chats-to-messages` and `threads-to-messages`, uploads optional file records and `messages-to-file-storage-module-files`, best-effort creates `profiles-to-messages`, and starts notification fanout (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:23`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:313`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:545`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:635`).
- Message update and delete remain chat-scoped by message ID. Update calls the social message update flow, can attach files, and creates an action payload with `type: "update"`; delete validates the chat/message relation, creates an action payload with `type: "delete"`, then deletes the message (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/update.ts:18`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/delete.ts:16`).
- Action find/create read and write social actions through `chats-to-actions` and best-effort profile/action links through `profiles-to-actions` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/action/find.ts:14`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/action/create.ts:17`).

### Social Model And Relation Layer

- Social module docs define chats as containers for messages and threads, threads as groups of messages inside chats, messages as body/interaction records, and actions as time-bound social events (`libs/modules/social/models/chat/README.md:1`, `libs/modules/social/models/thread/README.md:1`, `libs/modules/social/models/message/README.md:1`, `libs/modules/social/models/action/README.md:1`).
- Direct social model routes are `/api/social/chats`, `/api/social/threads`, `/api/social/messages`, and `/api/social/actions`; their backend apps are `DefaultApp` wrappers and generic CRUD comes from shared REST controller behavior (`libs/modules/social/models/chat/sdk/model/src/lib/index.ts:14`, `libs/modules/social/models/thread/sdk/model/src/lib/index.ts:14`, `libs/modules/social/models/message/sdk/model/src/lib/index.ts:14`, `libs/modules/social/models/action/sdk/model/src/lib/index.ts:14`).
- The relations used by the subject chat UI include `profiles-to-chats`, `chats-to-threads`, `chats-to-messages`, `threads-to-messages`, `profiles-to-messages`, `messages-to-file-storage-module-files`, `chats-to-actions`, and `profiles-to-actions` (`libs/modules/social/README.md:31`).
- Relation `find` composition is already used in the current subject UI for participant chips, message authors, action authors, and attachment lookup (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/overview/default/ClientComponent.tsx:130`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:217`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:288`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:364`).

### Architectural Context

- SPS frontend components use the `interface.ts`, `index.tsx`, `Component.tsx`, optional `ClientComponent.tsx` structure, and data access is expected through SDK `Provider`, `clientApi`, and `serverApi` wrappers (`README.md:118`, `README.md:126`).
- The root README documents relation-component usage with `variant="find"` and `apiProps.params.filters.and`, which matches the current social relation composition in the subject chat UI (`README.md:133`).
- RBAC subject docs describe the subject model as the authenticated orchestration layer and list the supported social chat variants (`libs/modules/rbac/models/subject/README.md:3`, `libs/modules/rbac/models/subject/README.md:91`).
- The current subject social chat stack keeps the authenticated subject/profile boundary in RBAC wrappers, while the social module supplies direct model/relation SDKs and generic UI primitives.

## Code References

- `apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:1385` - draft `ChatPage` local state and desktop/mobile composition.
- `apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:1505` - draft desktop three-column grid.
- `apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:1537` - draft mobile single-panel rendering.
- `apps/host/app/[[...url]]/page.tsx:38` - host catch-all route entrypoint.
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/social/widget/singlepage/chat/overview/default/Component.tsx:5` - host route segment extraction for chat/thread pages.
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject/singlepage/me/social-module-profile-chat-overview-default/ClientComponent.tsx:8` - authenticated subject/profile wrapper for chat overview.
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/variants.ts:95` - registered public RBAC subject chat variants.
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/list/default/ClientComponent.tsx:31` - current chat list dialog and chat-item mapping.
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/default/Component.tsx:9` - current chat row link to `/social/chats/{chatId}`.
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/overview/default/ClientComponent.tsx:16` - current thread find/create and active-thread logic.
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/client.tsx:10` - current thread message/action client fetch.
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:50` - current message/action mutations and feed rendering.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:286` - subject-scoped social chat route registrations.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/chat-lifecycle.ts:19` - chat creation lifecycle with profile/chat/default-thread setup.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:23` - subject-scoped message creation handler.
- `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/index.ts:147` - subject SDK imports for social chat/thread/message/action methods.

## Architecture Documentation

The current implementation separates the chat experience across three levels:

- Host page routing resolves URL-driven social chat pages and delegates to host widget wrappers.
- Host RBAC subject wrappers authenticate the current subject, resolve linked social profiles, and call RBAC subject model variants.
- RBAC subject social-module components fetch subject-scoped chats, threads, messages, and actions through `@sps/rbac/models/subject/sdk/<client|server>` and use social relation/model components for related entity lookups.

The data model relationships in use are:

- `subjects-to-social-module-profiles` for authenticated subject to social profile linkage.
- `profiles-to-chats` for profile membership in chats.
- `chats-to-threads` for threads inside chats.
- `chats-to-messages` and `threads-to-messages` for message containment.
- `profiles-to-messages` for message authorship/profile lookup.
- `messages-to-file-storage-module-files` for message attachments.
- `chats-to-actions` and `profiles-to-actions` for chat action feed events and profile attribution.

## Historical Context (from thoughts/)

- `thoughts/shared/tickets/singlepagestartup/ISSUE-154.md` defines the prior social chat thread work: default-thread routing, thread-aware replies, thread switching/creation, and historical backfill.
- `thoughts/shared/research/singlepagestartup/ISSUE-154.md` documented the pre-implementation state where subject chat message flow was still chat-scoped and thread support was present in social models/relations but not yet fully present in the subject runtime.
- `thoughts/shared/plans/singlepagestartup/ISSUE-154.md` describes the intended route-first thread model and canonical profile/chat/thread message path that now exists in the subject controller route table.
- `thoughts/shared/tickets/singlepagestartup/ISSUE-164.md` is the current issue artifact and names the draft `ChatPage.tsx`, the RBAC subject social-module target path, and the required SDK/relation/data-boundary constraints.
- `thoughts/shared/processes/singlepagestartup/ISSUE-164.md` records issue creation status and workflow notes for this issue.
- `thoughts/shared/retrospectives/singlepagestartup/ISSUE-164/2026-04-25_19-57-04.md` records the issue-164 creation session retrospective.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-154.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-161.md`

## Open Questions

- Which draft-only interaction details should be represented by existing persisted entities and which should remain local UI state needs confirmation during planning. Examples include unread count snapshots, quick reactions, member settings, and attachment reorder previews.
- The current subject-scoped APIs support thread creation and message/action flows, while the draft also includes chat/member management UI behaviors. The exact supported backend mapping for member add/remove and chat settings edits needs confirmation during planning.
- The current message update/delete endpoints are chat-scoped by message ID, while message find/create are available on the profile/chat/thread path. Planning should account for that existing method shape when mapping draft edit/delete behavior.
