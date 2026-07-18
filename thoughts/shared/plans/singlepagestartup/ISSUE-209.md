---
date: 2026-07-18T01:10:13+03:00
issue_number: 209
repository: singlepagestartup
topic: "Add Telegram assistant profile management conversations"
status: implemented
---

# Telegram Assistant Profile Management Conversations Implementation Plan

## Overview

Add an Agent-owned `/assistant` conversation runtime that projects the existing subject-scoped profile, MCP, skill, Knowledge, and avatar management capabilities into Telegram. `apps/telegram` remains an ingestion and delivery adapter; `agent.agent.service` owns the command, conversation definitions, transient state, transitions, and rendering decisions.

## Current State Analysis

- `agent.agent.service` already owns the effective Telegram command definitions, startup override merge, publication serialization, command execution, and callback dispatch. `/assistant` is absent (`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:96-124`, `:175-336`, `:511-615`, `:1016-1085`).
- `apps/telegram` publishes the Agent catalog, persists Telegram messages as subject-scoped Social messages, and persists callback clicks as Social actions. It imports grammY Conversations types and registers local exit commands, but it does not install a grammY session or conversation runtime (`apps/telegram/src/lib/telegram-bot.ts:149-187`, `:336-431`, `:536-701`).
- The common Agent dispatch funnel already receives the chat, resolved SPS thread, sender profile, replying profile, and persisted message or action. It chooses between Telegram-bot handling and the OpenRouter AI path (`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:436-569`).
- Agent replies already use subject-scoped RBAC message creation, resolve the originating SPS thread, and propagate Social message updates to Telegram notification updates (`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:952-1014`, `:1087-1152`).
- Telegram bootstrap already resolves sender subject/profile, chat, default or topic-specific thread, the personal AI profile, and the system Telegram-bot profile (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:583-647`, `:1180-1311`, `:1489-1888`).
- Subject-scoped RBAC routes already support target-profile update, avatar upload, linked-skill find/create/update, and linked Knowledge find/create/update/reindex/delete behind the chat-agent-profile management guard (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:499-605`).
- Missing backend contracts are a manageable-AI-profile collection, available-skill discovery, link-existing/unlink, and paginated linked skill/Knowledge reads. No new domain table is required.
- The approved planning clarification supersedes the ticket's tentative grammY runtime placement: `/assistant`, conversation tools, state, dispatch, and rendering belong to `agent.agent.service`. The implementation may model grammY Conversations behavior using an in-memory store, but it must not depend on the grammY Conversations package.

## Desired End State

- `/assistant` is a built-in definition in `agent.agent.service`, is published through the existing effective catalog, and can be overridden or disabled by the startup service.
- A process-local Agent conversation runtime maintains isolated state for each SPS chat, SPS thread, and sender profile. It supports entry, input waits, callback transitions, cancellation, expiry, stale-event rejection, and restart loss semantics without `@grammyjs/conversations`.
- Active assistant input is consumed by the Agent conversation before ordinary AI dispatch, preventing an editor reply or photo from also triggering OpenRouter.
- Zero manageable AI profiles yields an actionable error, one opens directly, and multiple profiles produce a selector.
- Profile, MCP, avatar, skill, and Knowledge tools call subject-scoped RBAC server SDKs using the sender subject's JWT. Authorization remains in RBAC middleware and services.
- The conversation edits one bounded presentation message when possible, uses versioned callbacks, and does not leave an unbounded stream of live menus.
- Back returns to the parent page; Refresh reloads the current page; Cancel abandons the current editor/input and returns to its page; Close, `/cancel`, `/exit`, and `/stop` terminate the conversation.
- Restart or idle expiry deliberately loses only transient conversation state. Persistent profile, skill, Knowledge, avatar, chat, and thread data remains unchanged, and stale controls direct the user to start `/assistant` again.

### Verification

- Agent command tests prove publication, startup override, disable, and conversation-id behavior.
- Agent runtime tests prove state isolation, continuation-message interception, callback revision checks, cancellation, expiry, restart behavior, and OpenRouter suppression.
- RBAC tests prove manageable-profile eligibility, pagination, available-skill filtering, link/unlink authorization, and existing CRUD behavior.
- End-to-end Telegram verification covers private chats, groups, forum topics, zero/one/multiple profiles, all editors, permission loss, stale callbacks, and service failures.

## What We're NOT Doing

- Installing or registering `@grammyjs/conversations`, or keeping a second conversation registry in `apps/telegram`.
- Persisting conversation state in a new SQL table, Redis, Social metadata, or Telegram-specific domain records in this issue.
- Adding Telegram-owned copies of `social.profile`, `social.skill`, Knowledge documents, or avatar files.
- Moving authorization or repository access into `apps/telegram` or bypassing subject-scoped RBAC SDKs.
- Adding arbitrary MCP connection creation; only supported stable identifiers in `allowedMcpServerIds` are toggled.
- Deleting global skills when a profile unlinks one.
- Reintroducing `react-by/knowledge`; `react-by/openrouter` remains the only AI reaction path.
- Redesigning the web profile sidebar or changing unrelated Telegram message/media behavior.
- Adding a schema migration or editing repository data snapshots.

## Implementation Approach

Keep the existing event path intact: Telegram persists an inbound message or callback through RBAC, the Agent webhook resolves its Social context, and `agent.agent.service` decides whether the event starts or advances a conversation. Add a small Agent-local state-machine runtime with a singleton in-memory store behind an interface, then register the assistant profile-management conversation and its tools with that runtime.

The runtime key is the canonical SPS tuple `socialModuleChat.id + socialModuleThread.id/default + messageFromSocialModuleProfile.id`; raw Telegram identifiers are transport facts and are not required in the state key. Each state record holds a conversation id, session nonce, revision, current screen/editor, selected target profile, pagination offsets, draft input, active presentation message identity, and expiry time. State transitions for one key must be serialized so double clicks cannot apply the same mutation twice.

Callbacks use a compact versioned Agent prefix plus opaque session/action tokens that fit Telegram's callback limit. Each click re-resolves sender/chat/thread, checks the current nonce and revision, re-runs RBAC authorization, and reloads mutable records. Missing sessions, stale revisions, missing records, or lost permissions never trust the old message state.

## Phase 1: Move The Complete Command Lifecycle Into Agent

### Overview

Register `/assistant` and the termination commands in the effective Agent catalog, preserve startup overrides, and remove the non-functional grammY conversation ownership from the Telegram adapter.

### Changes Required

#### 1. Agent command definitions and overrides

**Files**:

- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/startup/index.ts`
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-command-registry.spec.ts`

**Why**: This service is the existing single source of truth for built-in definitions, child-project overrides, publication, message execution, and callback execution.

**Changes**:

- Extend the Agent command definition with an optional serializable conversation identifier that participates in startup override merging but is not treated as executable input from Telegram.
- Add `/assistant` to the SinglePage base definitions with the assistant profile-management conversation id and an Agent-owned entry handler.
- Add `/cancel`, `/exit`, and `/stop` as Agent-owned conversation termination definitions so all lifecycle behavior passes through the same registry and service.
- Keep `telegramPublishedCommandsFind()` limited to Telegram's command/description publication shape; do not expose handlers or internal state through `GET /telegram/commands`.
- Preserve command validation, lowercase merge keys, new-command requirements, and `enabled: false` behavior.
- Extend BDD scenarios for base publication, startup replacement of conversation metadata/handlers, disabling `/assistant`, and disabling or overriding termination commands.

#### 2. Telegram adapter cleanup

**Files**:

- `apps/telegram/src/lib/telegram-bot.ts`
- `apps/telegram/src/lib/telegram-bot.spec.ts`
- `apps/telegram/package.json`

**Why**: The adapter currently imports grammY Conversations types and intercepts termination commands even though no grammY runtime is installed.

**Changes**:

- Remove the `Conversation`/`ConversationFlavor` typing, unused local conversation registry, and `ctx.conversation.exit()` command interception.
- Allow `/assistant`, `/cancel`, `/exit`, and `/stop` to follow the same persisted message ingestion path as other Telegram commands.
- Keep callback acknowledgement, topic metadata capture, media normalization, Agent catalog publication, and webhook startup unchanged.
- Remove the grammY Conversations package only if no other live import remains after the change.
- Extend transport BDD tests to prove the commands are published before webhook installation and are forwarded rather than consumed locally.

### Success Criteria

#### Automated Verification

- [x] `npx nx run @sps/agent:jest:test --testFile=libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-command-registry.spec.ts` passes.
- [x] `npx nx run telegram:jest:test --testFile=apps/telegram/src/lib/telegram-bot.spec.ts` passes.
- [x] `npx nx run @sps/agent:jest:test` and `npx nx run telegram:jest:test` pass.
- [x] Registry tests prove one effective Agent definition controls publication and execution after startup overrides.
- [x] Repository search finds no live grammY Conversations import or `ctx.conversation` call in `apps/telegram`.

#### Manual Verification

- [ ] Telegram's command menu includes the enabled Agent definitions and omits `/assistant` when the startup service disables it.
- [ ] Sending any termination command reaches Agent rather than producing the old local `Leaving.` shortcut.

---

## Phase 2: Add The Agent-Owned Conversation Runtime

### Overview

Create a process-local state machine modeled after grammY Conversations and connect it to the existing Agent message/callback dispatch and reply paths.

### Changes Required

#### 1. Conversation contracts, store, and DI lifetime

**Files**:

- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-conversation.ts` (new)
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-conversation-store.ts` (new)
- `libs/modules/agent/models/agent/backend/app/api/src/lib/di.ts`
- `libs/modules/agent/models/agent/backend/app/api/src/lib/bootstrap.ts`
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-conversation.spec.ts` (new)

**Why**: The Agent `Service` binding is not currently guaranteed to be singleton-scoped, so a private service field is not a safe process-wide session store.

**Changes**:

- Define transport-independent conversation event, state, definition, transition, render, and tool-result contracts in the Agent backend API layer.
- Implement an in-memory store behind an Agent-local interface and bind it explicitly in singleton scope.
- Key records by resolved SPS chat, SPS thread, and sender profile; never key only by Telegram chat or only by subject.
- Store a session nonce and monotonically increasing revision, expire records after a bounded idle TTL, and perform lazy/periodic cleanup without blocking request handling.
- Serialize transitions per state key and make repeated callback revisions no-ops with an actionable stale result.
- Make store replacement possible through DI so a shared backend can be introduced later without changing conversation definitions.
- Add BDD coverage for private/group/topic isolation, distinct senders, replacement on `/assistant`, TTL expiry, clean restart via a new store instance, and concurrent/repeated transition handling.

#### 2. Common Agent dispatch integration

**Files**:

- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts`
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.spec.ts`

**Why**: Multi-step editor inputs arrive as ordinary persisted Social messages, not as command callbacks, so command-only handlers cannot continue a conversation.

**Changes**:

- Resolve the canonical SPS thread and sender identity before building the conversation key for both messages and actions.
- At the shared `agentSocialModuleProfileHandler(...)` choke point, check whether the event starts, terminates, or advances an active assistant conversation before ordinary Telegram-bot or OpenRouter dispatch.
- Consume active conversation text/photo input exactly once and suppress the parallel artificial-intelligence/OpenRouter reaction for that event.
- Route versioned assistant callback prefixes from `telegramBotCallbackQueryHandler(...)` into the same runtime; retain the existing command, ecommerce, and checkout branches.
- Treat `/assistant` re-entry as replacement of the session for only the same chat/thread/sender key.
- Treat `/cancel`, `/exit`, and `/stop` as idempotent termination. If no session exists, return a concise actionable message rather than creating one.
- Add BDD coverage proving an active editor consumes ordinary text/media, another topic or sender is unaffected, and OpenRouter is not triggered for consumed events.

#### 3. Bounded conversation rendering

**Files**:

- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-conversation.ts` (new)
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-conversation.spec.ts` (new)

**Why**: The current command path creates replies, while this feature needs repeatable page rendering without accumulating live keyboard messages.

**Changes**:

- Create one presentation Social message on entry and retain its identity in session state.
- On navigation and refresh, update that message through the canonical Social/RBAC message mutation so existing Agent notification-update handling edits the Telegram message.
- Fall back to one replacement message only when the original cannot be edited; advance the session nonce/revision so buttons on older messages become stale.
- Encode compact version/action/session tokens within Telegram callback limits and resolve entity/page choices against current server-side state instead of trusting callback-carried domain state.
- Keep every reply/update in the originating SPS thread and therefore the originating Telegram topic.

### Success Criteria

#### Automated Verification

- [x] New conversation runtime and controller BDD suites pass through `npx nx run @sps/agent:jest:test`.
- [x] Tests prove chat + thread + sender isolation, transition serialization, TTL, restart loss, re-entry replacement, and idempotent termination.
- [x] Tests prove active assistant input suppresses OpenRouter while unrelated messages retain existing AI behavior.
- [x] Tests prove navigation updates one presentation record and stale callback revisions cannot repeat a mutation.

#### Manual Verification

- [ ] Two users in one group and one user in two topics can operate independent assistant conversations.
- [ ] Repeated navigation leaves one current menu, and old buttons return an expired/stale instruction.
- [ ] Restarting the API loses only transient UI state; running `/assistant` creates a clean new session.

---

## Phase 3: Complete The Subject-Scoped RBAC Management Surface

### Overview

Add the missing collection, pagination, and profile-skill relation operations required by the Agent tools while keeping eligibility and authorization in RBAC.

### Changes Required

#### 1. Manageable AI profile discovery

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find.ts` (new)
- `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-can-manage-chat-agent-profile/index.ts`
- matching handler BDD spec (new)
- matching client/server actions and exports under `libs/modules/rbac/models/subject/sdk/{client,server}/src/lib/singlepage/`

**Why**: Existing middleware validates one supplied target profile; `/assistant` needs the authorized set before a target is selected.

**Changes**:

- Add a subject-owned chat collection route for manageable AI profiles under the existing requesting-profile/chat subtree.
- Return only profiles connected to the chat, with `variant="artificial-intelligence"`, and linked to an Agent RBAC subject; reuse the selected-target eligibility rules rather than inventing Telegram rules.
- Require the requesting profile to belong to the authenticated subject and the chat to be owned/manageable under the existing contract.
- Return a stable plain profile array so Agent can implement zero/one/multiple behavior without exposing authorization metadata.
- Add client/server SDK actions and exports, with BDD coverage for foreign subject/profile/chat, non-AI profiles, disconnected profiles, missing Agent subjects, and deterministic ordering.

#### 2. Paginated linked and available skills

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/skill/find.ts`
- new sibling handlers for available find, link-existing, and unlink
- `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-can-manage-chat-agent-profile/index.ts`
- matching client/server actions and exports under `libs/modules/rbac/models/subject/sdk/{client,server}/src/lib/singlepage/`
- matching BDD specs

**Why**: The current route can list linked skills, create-and-link a new skill, or edit a linked skill, but cannot browse/link existing skills or unlink without deleting the skill.

**Changes**:

- Add optional bounded `limit`/`offset` query support to linked-skill find while preserving current response compatibility when pagination is omitted.
- Preserve relation order (`orderIndex`, then creation order), and let Agent request one extra item to determine whether a next page exists without introducing an incompatible response envelope.
- Add an available-skill route with optional search plus `limit`/`offset`, stable ordering, and exclusion of skills already linked to the target profile.
- Add explicit link-existing and unlink operations on the profile/skill relation. Link is idempotent; unlink removes only the relation and never deletes `social.skill`.
- Split middleware validation so available/link verifies the manageable target profile without requiring an existing relation, while update/unlink continues to require the requested skill to be linked.
- Preserve existing create-and-link and linked-skill update behavior.
- Add SDK contracts and BDD coverage for duplicate links, unlinking, foreign target profiles, stale skills, page boundaries, ordering, and concurrent relation requests.

#### 3. Paginated linked Knowledge documents

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/knowledge/document/find.ts`
- matching client/server SDK find actions
- matching BDD specs

**Why**: The existing route hydrates every linked document and has no bounded page contract.

**Changes**:

- Add optional bounded `limit`/`offset` support at the ordered profile-document relation boundary before hydrating Knowledge documents.
- Preserve relation order and current plain-array response compatibility; Agent requests one extra item to determine next-page availability.
- Leave create, update, reindex, confirmed delete, Knowledge indexing, and derived-data deletion contracts unchanged.
- Add BDD coverage for first/middle/last/empty pages, removed documents, stable order, and permission loss.

### Success Criteria

#### Automated Verification

- [x] `npx nx run @sps/rbac:jest:test` passes with the new route, middleware, and SDK scenarios.
- [x] `npx nx run @sps/rbac:jest:integration` passes for authorized and denied relation operations.
- [x] Existing web sidebar tests remain green when pagination parameters are omitted.
- [x] Tests prove manageable-profile results and every skill/Knowledge page remain subject/chat/target scoped.
- [x] Tests prove unlink never deletes a global skill and available results exclude already-linked skills.

#### Manual Verification

- [ ] An owner can resolve zero, one, and multiple manageable AI profiles for the current chat.
- [ ] Linked/available skill and Knowledge lists paginate consistently without duplicates or skipped rows.
- [ ] Revoking management permission causes the next call to fail even when a conversation state still exists.

---

## Phase 4: Implement Assistant Profile Management Tools

### Overview

Register the assistant home, profile, MCP, skill, Knowledge, and avatar tools in the Agent conversation and connect every mutation to the subject-scoped RBAC surface.

### Changes Required

#### 1. Conversation definition, page registry, and requester authorization

**Files**:

- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-conversation.ts` (new)
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-conversation.spec.ts` (new)

**Why**: The approved architecture requires the management tools and navigation state to be owned by `agent.agent.service`, not by Telegram handlers.

**Changes**:

- Register one assistant profile-management conversation definition and explicit tools/pages for selector, home, Profile, MCP, Skills, and Knowledge.
- Resolve the sender's RBAC subject with the existing profile-to-subject helper, sign that subject's JWT, and call RBAC as the requester rather than as the Telegram-bot Agent subject.
- Resolve manageable profiles on every entry and selection. Open one directly, show a paginated/refreshable selector for multiple, and return an actionable message for zero.
- Revalidate the selected profile before every mutation and destructive confirmation; clear invalid selections and return to selector/exit safely.
- Render the selected profile's current name, description, and avatar on home with Profile, MCP, Skills, Knowledge, Refresh, and Close controls.
- Implement Back, Refresh, Cancel, and Close according to the approved semantics, including removal/disablement of the live keyboard on close.

#### 2. Profile, MCP, and avatar tools

**Files**:

- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-conversation.ts` (new)
- `libs/modules/agent/models/agent/backend/app/api/src/lib/di.ts`
- `libs/modules/agent/models/agent/backend/app/api/src/lib/bootstrap.ts`
- existing RBAC subject server SDK profile update/avatar actions
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-conversation.spec.ts` (new)

**Why**: The persistent operations already exist, but Agent needs validated sequential editors and access to the incoming persisted photo attachment.

**Changes**:

- Add sequential editors for `adminTitle`, localized `title`, `subtitle`, and `description`, with clear current values, skip/cancel controls, length/type validation, and explicit save.
- Keep profile updates limited to the existing handler allowlist; do not expose slug, variant, ownership, ids, or timestamps.
- Render the supported MCP descriptor catalog and toggle only stable supported identifiers in `allowedMcpServerIds`; preserve unknown/stale stored identifiers without enabling arbitrary creation.
- Resolve Telegram photo/image input from the persisted Social message and File Storage relation, then submit it through the existing RBAC avatar action. Expand Agent read-service DI only for the relation/file lookups required to reuse that canonical path.
- Keep avatar behavior append-only with latest linked image winning; do not add deletion or replacement migrations.
- Handle invalid text, missing files, unsupported media, oversized/failed uploads, stale profiles, and RBAC denial without corrupting the draft or session.

#### 3. Skill tools

**Files**:

- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-conversation.ts` (new)
- existing and new RBAC subject server SDK skill actions
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-conversation.spec.ts` (new)

**Changes**:

- Add paginated Linked and Available pages with stable Prev/Next, Refresh, Back, and row-selection actions.
- Add create-and-link and linked-skill edit editors for `title`, `slug`, and `description`, preserving server validation and showing field-specific recovery.
- Link an available existing skill idempotently and unlink only the profile relation after confirmation; never expose global skill deletion.
- Re-read each selected skill before showing or applying an action and reject stale callback tokens or permission loss.

#### 4. Knowledge tools

**Files**:

- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-conversation.ts` (new)
- existing RBAC subject server SDK Knowledge actions
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-conversation.spec.ts` (new)

**Changes**:

- Add a paginated linked-document page and create/edit editors for title and content using the existing create/update contracts.
- Keep reindex explicit after content changes and show success/failure without silently treating update as reindex.
- Require a fresh explicit confirmation state for document deletion; re-read and reauthorize before calling delete.
- Return to a refreshed page after create, update, reindex, or delete and handle a document disappearing between render and action.

### Success Criteria

#### Automated Verification

- [x] Agent assistant-conversation BDD tests cover zero/one/multiple profiles and every Profile/MCP/Avatar/Skills/Knowledge editor path.
- [x] Tests prove all mutations use the sender subject JWT and subject-scoped RBAC server SDKs.
- [x] Tests prove invalid input and service errors preserve or safely cancel draft state without partial unintended writes.
- [x] Tests prove stale callbacks, missing records, and permission loss do not execute a mutation.
- [x] Tests prove skill unlink is relation-only and Knowledge delete requires a current confirmation revision.

#### Manual Verification

- [ ] A Telegram owner can match the existing web sidebar's Profile, MCP, Skills, and Knowledge capabilities from `/assistant`.
- [ ] A Telegram photo becomes the selected AI profile's avatar through File Storage and appears in both Telegram management home and the web sidebar.
- [ ] All pages and edits remain in the originating group topic.

---

## Phase 5: Harden Lifecycle, Verify Routing, And Document Operations

### Overview

Exercise the complete flow across Agent, RBAC, Social, Knowledge, File Storage, Notification, and Telegram, then document the intentional in-memory lifecycle and recovery behavior.

### Changes Required

#### 1. Cross-layer BDD and regression matrix

**Files**:

- `apps/telegram/src/lib/telegram-bot.spec.ts`
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-command-registry.spec.ts`
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-conversation.spec.ts` (new)
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-conversation.spec.ts` (new)
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.spec.ts`
- relevant RBAC route/middleware specs from Phase 3

**Changes**:

- Ensure every modified/new test follows the repository BDD Suite/Scenario JSDoc contract with Given/When/Then headers.
- Cover command publication/override/disable, zero/one/multiple profile selection, every editor, relation-only unlink, confirmed Knowledge deletion, RBAC denial, stale callback, expiry, restart, cancellation, and duplicate-click behavior.
- Cover private chat, group default thread, forum topic, multiple senders in one chat, and one sender in multiple topics.
- Cover consumed conversation input versus unaffected ordinary OpenRouter messages and existing `/learn`, thread, referral, premium, and ecommerce callbacks.
- Cover edit failure fallback, service errors, Telegram callback acknowledgement, and actionable recovery text.

#### 2. Documentation

**Files**:

- `libs/modules/agent/README.md`
- `libs/modules/agent/models/agent/README.md`
- `apps/telegram/README.md`
- `libs/modules/rbac/models/subject/README.md`
- relevant Social skill/profile and Knowledge README sections if their subject-scoped contracts are documented there

**Changes**:

- Document Agent ownership of Telegram commands, conversation registry/tools, state transitions, callbacks, and rendering.
- Document `apps/telegram` as transport-only ingestion/publication and the removal of grammY Conversations runtime assumptions.
- Document the in-memory store key, singleton lifetime, TTL, deliberate restart expiry, stale-control recovery, and current single-process limitation.
- Document manageable-profile eligibility, available/link/unlink skill semantics, pagination behavior, MCP scope, and confirmed Knowledge deletion.
- Document the extension seam for a future shared store without changing conversation definitions.

### Success Criteria

#### Automated Verification

- [x] `npx nx run telegram:jest:test` passes.
- [x] `npx nx run @sps/agent:jest:test` passes.
- [x] `npx nx run @sps/rbac:jest:test` and `npx nx run @sps/rbac:jest:integration` pass.
- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run telegram:build` passes.
- [x] Affected Agent, RBAC, Social, Knowledge, and API build/lint targets pass through Nx.
- [x] Repository checks confirm no new schema/migration/data-snapshot changes and no live grammY Conversations dependency remains.

#### Manual Verification

- [ ] Start API and Telegram services, confirm command publication, and complete all management flows in a private chat.
- [ ] Repeat selection/navigation/editing in a group default thread and two forum topics; replies and message edits stay in the originating thread.
- [ ] Restart the API during an editor, click an old button, verify the expiry message, then restart cleanly with `/assistant`.
- [ ] Revoke management permission during a session and verify the next read/mutation is denied without leaking profile data.
- [ ] Rapidly double-click link, unlink, reindex, and delete controls and verify at-most-once effective mutation behavior.

## Testing Strategy

### Unit Tests

- Command definition serialization, override merging, and disable behavior.
- In-memory store keys, TTL, cleanup, session nonce/revision, per-key serialization, and restart loss.
- Callback codec length/version validation and stale-token rejection.
- Page reducers/transitions, editor validation, pagination boundaries, and Back/Refresh/Cancel/Close behavior.
- Tool adapters for profile/MCP/avatar, skill, and Knowledge RBAC operations.

### Integration Tests

- Persisted Social message/action to Agent dispatch, including canonical thread and sender resolution.
- Active conversation interception before OpenRouter and normal dispatch after close/expiry.
- Subject-scoped manageable-profile, skill relation, and Knowledge pagination routes with RBAC middleware.
- Social message create/update to Notification/Telegram rendering, including edit failure fallback.
- File Storage-backed incoming photo to profile avatar relation.

### Manual Testing Steps

1. Run `/assistant` with zero, one, and multiple manageable AI profiles.
2. Navigate each page, refresh it, cancel an editor, go back, close, and exercise all three termination commands.
3. Edit all profile fields, toggle the supported MCP server, upload an avatar, and confirm the web sidebar reflects the same records.
4. Create/edit/link/unlink skills across page boundaries and confirm the global skill survives unlink.
5. Create/edit/reindex/delete Knowledge documents, including a rejected unconfirmed delete.
6. Repeat in private, group, and topic contexts with two senders and verify isolation.
7. Test stale buttons after navigation, permission revocation, record deletion, TTL expiry, and API restart.

## Performance Considerations

- Keep state compact and store only identifiers/drafts needed to resume a screen; reload mutable domain records through RBAC instead of caching full models.
- Bound list page sizes, query one extra row for Next detection, and avoid hydrating every linked skill/document.
- Expire idle sessions and clean old records to prevent unbounded process memory growth.
- Serialize work only per conversation key so unrelated chats/topics/senders remain concurrent.
- The approved in-memory design assumes the current request reaches the process holding its state. The store interface and documentation must make horizontal multi-process limitations explicit and preserve a future shared-store seam.

## Migration Notes

- No Drizzle schema or migration generation is expected.
- Existing Social, Knowledge, File Storage, RBAC, and Notification data remains authoritative and compatible.
- Deploying the new API intentionally invalidates any old transient assistant menus; their callbacks return the restart instruction.
- Removing the grammY Conversations dependency is safe only after repository-wide verification shows no remaining live imports.
- Rollback removes the Agent command/runtime and new RBAC routes; persistent domain mutations completed before rollback remain valid ordinary records.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-209.md`
- Primary research: `thoughts/shared/research/singlepagestartup/ISSUE-209.md`
- Process log and approved clarification: `thoughts/shared/processes/singlepagestartup/ISSUE-209.md`
- Agent/OpenRouter/MCP precedent: `thoughts/shared/plans/singlepagestartup/ISSUE-199.md`
- Telegram thread-routing research: `thoughts/shared/research/singlepagestartup/ISSUE-154.md`
- Telegram media/File Storage research: `thoughts/shared/research/singlepagestartup/ISSUE-189.md`

<!-- Last synced at: 2026-07-17T22:10:13Z -->
