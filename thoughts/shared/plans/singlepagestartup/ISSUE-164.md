# Port Draft Chat UI into SPS Subject Social Module Implementation Plan

## Overview

Port the draft chat workspace into the existing RBAC subject social-module chat surface while preserving SPS routing, SDK-provider data access, relation composition, and supported subject chat/thread/message/action APIs.

## Current State Analysis

The draft chat UI is a local-state monolith with a left chat column, middle thread column, right message column, and mobile single-panel switching (`apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:161`, `apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:239`, `apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:934`, `apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:1505`, `apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:1537`). The SPS target already has split RBAC subject variants for chat list, chat item, chat overview, and message list, but the current UI still exposes debug and primitive admin-like surfaces (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/list/default/ClientComponent.tsx:16`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/overview/default/ClientComponent.tsx:111`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:170`).

Host composition is already route-first and should remain unchanged. The host resolves `/social/chats/[social.chats.id]` and `/social/chats/[social.chats.id]/threads/[social.threads.id]`, extracts route segment values, and delegates through authenticated RBAC subject wrappers (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/social/widget/singlepage/chat/overview/default/Component.tsx:5`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject/singlepage/me/social-module-profile-chat-overview-default/ClientComponent.tsx:8`).

The subject SDK/backend already supports chat find/create/find-by-id, thread find/create, thread-scoped message find/create, chat-scoped message update/delete, and action find/create (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:286`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/overview/default/ClientComponent.tsx:16`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:51`). Related profile, author, action, and attachment data is already resolved through relation `variant="find"` composition (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/default/Component.tsx:21`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:217`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:288`).

## Desired End State

The subject social chat pages should feel like the draft chat workspace while remaining decomposed into SPS variants:

- `/social/chats` presents a polished chat list with create-chat affordance and participant summaries.
- `/social/chats/{chatId}` redirects or falls through to the default/first thread without breaking the existing route model.
- `/social/chats/{chatId}/threads/{threadId}` renders a responsive chat workspace: chat context, thread navigation, active message timeline, and composer.
- Message create/edit/delete, action display, participant chips, author links, and attachment display continue to use existing SDK and relation paths.

Verification should confirm that the implementation does not introduce direct host-to-social wiring, direct fetch bypasses, ad-hoc CSS, or unsupported persisted features.

### Key Discoveries:

- The draft page defines the target layout and interaction feel, but keeps all chat/thread/member/unread/reaction state locally (`apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx:1385`).
- The current overview component already contains canonical active-thread selection and URL replacement logic that must be preserved (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/overview/default/ClientComponent.tsx:41`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/overview/default/ClientComponent.tsx:65`).
- The message list already merges thread-scoped messages and chat-scoped actions, then renders author and attachment relations through existing SPS relation components (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/client.tsx:10`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:217`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:288`).
- Issue 154 established the route-bound thread model and default-thread behavior that issue 164 must not regress (`thoughts/shared/plans/singlepagestartup/ISSUE-154.md`).

## What We're NOT Doing

- Not copying `ChatPage.tsx` as a monolith into the RBAC subject module.
- Not changing host page seeds, route shape, or route segment extraction.
- Not adding new backend APIs for member add/remove, chat settings persistence, thread title edits, pinned threads, unread counters, or persisted reactions.
- Not replacing SDK providers with direct `fetch` calls or social-module-only wiring from host components.
- Not introducing ad-hoc CSS files or non-Tailwind styling.
- Not changing message/thread database schema or adding migrations.

## Implementation Approach

Implement the visual migration inside the existing RBAC subject social-module component tree. Keep the current wrappers and SDK provider structure, but replace the rough UI fragments with draft-inspired Tailwind layouts. Treat unsupported draft-only behaviors as omitted, disabled, or explicitly non-persistent visual affordances where they improve orientation without implying backend support.

## Phase 1: Chat Workspace Shell

### Overview

Build the responsive workspace structure in the RBAC subject chat surfaces while keeping the host route chain and variant contracts unchanged.

### Changes Required:

#### 1. Chat list wrapper and row presentation

**File**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/list/default/ClientComponent.tsx`
**Why**: This is the current `/social/chats` list UI and still renders a module-level debug counter plus a primitive create/list layout.
**Changes**: Remove debug render output, restyle the list as the draft left column, keep the existing create-chat dialog, add empty/loading-friendly layout states, and continue rendering each chat through `social-module-profile-chat-default`.

**File**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/default/Component.tsx`
**Why**: This is the per-chat row used by the list and currently displays only the chat ID and participant chips.
**Changes**: Restyle as a compact chat row with active/hover-friendly visual treatment, participant summary, stable fallback title based on profile slugs or chat metadata, and link to `/social/chats/{chatId}`.

#### 2. Overview workspace container

**File**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/overview/default/ClientComponent.tsx`
**Why**: This is the active chat page and owns thread fetch/create, active-thread resolution, canonical route replacement, participant relation lookups, and message-list mounting.
**Changes**: Replace the current debug chips/select layout with a draft-inspired workspace shell: chat/header area, middle thread navigation, right message panel, and mobile single-panel state. Preserve active-thread selection and `router.replace` behavior.

### Success Criteria:

#### Automated Verification:

- [ ] Type checking passes for affected packages.
- [ ] Linting passes for affected packages.
- [ ] Existing scoped scenario coverage for issue routes remains green.

#### Manual Verification:

- [ ] `/social/chats` no longer shows debug counters and presents chat rows as a polished chat list.
- [ ] `/social/chats/{chatId}` still routes to the default or first thread.
- [ ] Desktop chat view presents chat/thread/message areas without overlapping content.
- [ ] Mobile chat view presents one logical panel at a time.

---

## Phase 2: Chat And Thread Navigation

### Overview

Adapt the draft thread-list behavior to the existing subject thread APIs and route model.

### Changes Required:

#### 1. Thread list presentation

**File**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/overview/default/ClientComponent.tsx`
**Why**: The overview component currently renders a native select for thread switching, while the draft uses a navigable middle thread column with search, empty state, and create-thread affordance.
**Changes**: Replace the select with a thread list surface using existing `socialModuleThreads` data, route navigation, default-thread labeling, current-thread highlight, search/filter state, and existing thread-create mutation.

#### 2. Participant display

**File**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/overview/default/ClientComponent.tsx`
**Why**: Participant data is already fetched through `profiles-to-chats` and `social/profile` relation composition, but the presentation is a raw chip row.
**Changes**: Preserve relation `variant="find"` lookups and render participants as compact profile chips in chat/thread headers. Do not add member-management controls unless a supported API exists.

### Success Criteria:

#### Automated Verification:

- [ ] Type checking confirms no prop or variant contract regressions.
- [ ] Linting confirms no unused branch from removed select/debug UI.

#### Manual Verification:

- [ ] Thread search filters visible threads client-side without changing server filters.
- [ ] Creating a thread still navigates to `/social/chats/{chatId}/threads/{newThreadId}`.
- [ ] Selecting a thread updates the URL and message pane.
- [ ] Participant chips remain sourced through relation components.

---

## Phase 3: Message Timeline And Composer

### Overview

Restyle the existing message/action feed and composer into the draft-like thread view while preserving the current supported mutations and relation lookups.

### Changes Required:

#### 1. Message and action timeline

**File**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/client.tsx`
**Why**: This file builds the combined message/action feed from thread messages and chat actions.
**Changes**: Keep the current thread-scoped message fetch, chat-scoped action fetch, and chronological merge. If needed, normalize feed metadata in this layer for cleaner presentation without changing API contracts.

**File**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx`
**Why**: This file renders the current card-based message/action list, author links, attachment lookups, edit/delete controls, action collapsibles, and composer.
**Changes**: Replace card-heavy message rendering with draft-style message rows grouped visually by author/time where possible, keep markdown rendering, keep relation lookups for authors/actions/attachments, move edit/delete into compact row actions, and render actions as timeline events instead of raw debug cards.

#### 2. Composer and attachments

**File**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx`
**Why**: The current composer uses a large markdown editor and file field, while the draft uses a compact chat composer with attach/send affordances.
**Changes**: Restyle the composer to a chat input area using the existing message create mutation and file form data support. Keep edit dialog behavior for message updates. Keep attachment display through `messages-to-file-storage-module-files`; do not implement drag-reorder persistence.

### Success Criteria:

#### Automated Verification:

- [ ] Existing message create/update/delete TypeScript contracts remain valid.
- [ ] Linting passes after removing or moving primitive controls.
- [ ] BDD-formatted tests cover supported message actions if new tests are added.

#### Manual Verification:

- [ ] Sending a text message creates it in the active thread.
- [ ] Attaching files still sends through the supported form path.
- [ ] Editing and deleting a message still use the current chat-scoped message APIs.
- [ ] Action events remain visible but no longer dominate the message UI as raw cards.

---

## Phase 4: State Boundaries And Verification

### Overview

Lock down unsupported draft-only behavior, add focused regression coverage where practical, and verify the result through repository commands and manual responsive checks.

### Changes Required:

#### 1. Unsupported draft behavior boundaries

**File**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/overview/default/ClientComponent.tsx`
**Why**: The draft has local settings/member/thread-edit/pin behavior, but the ticket explicitly forbids assuming unsupported APIs.
**Changes**: Do not render enabled controls for unsupported persisted behavior. If settings or member UI is retained for orientation, make it read-only or omit controls that imply persistence.

**File**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx`
**Why**: The draft has local unread snapshots and reactions; SPS currently has action records and message interactions but no confirmed reaction/unread persistence for this issue.
**Changes**: Avoid implementing persisted unread or reaction features. Keep existing action display and message interaction rendering as supported data only.

#### 2. Tests and validation

**Files**: affected tests under the RBAC subject/social chat surface, if existing nearby tests cover these variants.
**Why**: The change is UI-focused but touches route/thread/message workflows that issue 154 established.
**Changes**: Add or update focused BDD-format tests only where existing test infrastructure can verify route/thread selection, message feed rendering, or composer behavior without brittle visual assertions.

### Success Criteria:

#### Automated Verification:

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test:unit:scoped`
- [ ] `npm run test:integration:scoped`
- [ ] `npm run test:scenario:issue -- singlepagestartup 164`

#### Manual Verification:

- [ ] Start API and host with the standard repo commands.
- [ ] Visit `/social/chats` and confirm chat list/create affordance.
- [ ] Visit `/social/chats/{chatId}` and confirm default-thread navigation.
- [ ] Visit `/social/chats/{chatId}/threads/{threadId}` on desktop and mobile widths.
- [ ] Create, edit, and delete a message in the active thread.
- [ ] Confirm unsupported draft-only controls are absent, disabled, or clearly non-persistent.

---

## Testing Strategy

### Unit Tests:

- Prefer targeted tests around helper functions or extracted presentation utilities if implementation introduces any.
- Preserve the repository BDD header format for every new or edited test.

### Integration Tests:

- Cover route-driven active-thread selection if existing frontend integration coverage can mount the RBAC subject component tree with mocked SDK data.
- Cover message/action feed ordering if normalization logic is changed in the message-list client/server layer.

### Manual Testing Steps:

1. Open `/social/chats` and inspect the chat list, create-chat dialog, and row navigation.
2. Open a chat without a thread ID and verify canonical thread URL replacement.
3. Switch threads and create a new thread from the thread list.
4. Send a message with and without attachments.
5. Edit and delete an existing message.
6. Check desktop and mobile layouts for overflow, panel switching, and text fit.

## Performance Considerations

Keep existing server/client data-fetch boundaries and avoid adding new broad relation queries. The UI may add client-side filtering for already-loaded threads, but should not introduce repeated profile/message lookups beyond the existing relation `find` composition unless a local memoized presentation layer is needed.

## Migration Notes

No schema migration is planned. Existing chats, threads, messages, actions, and relations should continue to render through their current APIs. Any future persisted member-management, unread, or reaction behavior should be handled as a separate issue with explicit backend/API scope.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-164.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-164.md`
- Process artifact: `thoughts/shared/processes/singlepagestartup/ISSUE-164.md`
- Thread precedent: `thoughts/shared/plans/singlepagestartup/ISSUE-154.md`
- Draft UI source: `apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx`

<!-- Last synced at: 2026-04-25T20:49:51Z -->
