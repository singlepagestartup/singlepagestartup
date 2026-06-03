# Profile-Scoped Knowledge RAG In Social Chats Implementation Plan

## Overview

Implement `social.chat.variant="knowledge"` as the explicit switch for profile-scoped Knowledge/RAG replies in ordinary social chats. In Knowledge chats, `/learn` stores the current user message and supported text attachments as indexed Knowledge documents linked only to the replying AI profile, while normal questions generate answers through `KnowledgeService.generate({ profileId })`.

## Current State Analysis

Social chat storage already has a plain text `variant` field, so adding the `knowledge` mode should not require a database schema change. The public chat SDK variants currently expose only `default` and `telegram`, and the current automatic AI reply path is still slug-based through the agent `open-router` branch.

Knowledge already has the hard parts for RAG: profile-scoped document filtering, generation, document indexing, chunking, embeddings, pgvector storage, and profile-document relations. What is missing is the ordinary social chat bridge: no `/react-by/knowledge` RBAC route, no SDK action for it, no `/learn` ingestion method based on a chat message and attachments, no agent dispatch for `chat.variant="knowledge"`, and no Knowledge-specific chat command picker in the frontend composer.

The current social chat UI is a good base and should be reused. The default thread message list owns the composer, file input, textarea, and submit flow; the Knowledge UI should extend that surface with a slash-command picker rather than creating a separate chat experience.

## Desired End State

A user can create or open a `social.chat` whose `variant` is `knowledge`, send `/learn ...` with optional `.txt`, `.md`, or `.markdown` attachments, and have the linked `chat-gpt-*` AI profile store that content as a deterministic Knowledge document, link it to that AI profile, and run embedding indexing. Later normal messages in the same Knowledge chat are answered by the AI profile using only documents linked to that profile, and the social assistant message stores Knowledge citations, model, provider, and usage metadata.

Verification should prove that `default` and `telegram` chats keep their current non-RAG behavior, and that Knowledge linked to one AI profile is not used by another profile.

### Key Discoveries:

- `social.chat` SDK variants are currently `["default", "telegram"]` at `libs/modules/social/models/chat/sdk/model/src/lib/index.ts:17`.
- `social.chat.variant` is already a text column with default `"default"` at `libs/modules/social/models/chat/backend/repository/database/src/lib/fields/singlepage.ts:9`.
- The current RBAC reaction route is only `/react-by/openrouter` at `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:444`.
- The current OpenRouter server SDK posts to `/react-by/openrouter` at `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:56`.
- The current agent dispatch only handles `telegram-bot` and `open-router` profile slugs at `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:314` and `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:348`.
- The agent OpenRouter branch calls the RBAC OpenRouter reaction SDK at `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1861`.
- `KnowledgeService.search(...)` already filters by profile-linked documents at `libs/modules/knowledge/backend/app/api/src/lib/service.ts:62`.
- `KnowledgeService.generate(...)` already uses profile-scoped search output as generation context at `libs/modules/knowledge/backend/app/api/src/lib/service.ts:95`.
- `KnowledgeService.index(...)` delegates to the document indexer at `libs/modules/knowledge/backend/app/api/src/lib/service.ts:268`.
- The existing skill transcript ingestion path is skill-bound, not ordinary chat-message learning, at `libs/modules/knowledge/backend/app/api/src/lib/service.ts:300`.
- The indexer embeds chunks through `embedMany(...)` and writes derived chunks/source metadata at `libs/modules/knowledge/backend/app/api/src/lib/indexer/index.ts:130`.
- `knowledge.chunk.embedding` is already a 768-dimensional pgvector field at `libs/modules/knowledge/models/chunk/backend/repository/database/src/lib/fields/singlepage.ts:22`.
- Profile-document links are stored in `profiles-to-knowledge-module-documents` at `libs/modules/social/relations/profiles-to-knowledge-module-documents/backend/repository/database/src/lib/schema.ts:17`.
- `social.message.metadata` already exists for storing Knowledge citations/model/usage at `libs/modules/social/models/message/backend/repository/database/src/lib/fields/singlepage.ts:17`.
- The default chat composer submit flow is centralized at `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:415`.
- The default chat file input and textarea live at `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:781` and `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:812`.
- Shared shadcn `Command` and `Popover` primitives are available through `libs/shared/ui/shadcn/src/index.ts:31` and `libs/shared/ui/shadcn/src/lib/popover/index.tsx:31`.

## What We're NOT Doing

- Do not add startup-specific routes, UI, or data behavior.
- Do not hand-edit Drizzle SQL, migration snapshots, or `_journal.json`.
- Do not replace the existing OpenRouter flow for `default` chats.
- Do not support arbitrary attachment types in V1; only `.txt`, `.md`, and `.markdown` attachments are in scope.
- Do not build a separate Knowledge chat page; extend the existing default chat surface.
- Do not make direct OpenAI/provider calls from RBAC; use the existing `apps/llm` gateway through Knowledge clients.
- Do not make profile-global Knowledge available across AI profiles.

## Implementation Approach

Use the existing SPS module boundaries. Social owns the chat variant and message/profile relations. RBAC owns authenticated subject/profile/chat orchestration and the new reaction endpoint. Knowledge owns document creation/update, profile document linking, indexing, search, and generation. Agent owns automatic dispatch from ordinary message creation to the correct reaction endpoint. Frontend changes stay inside the existing subject social chat message-list composer and are gated by `socialModuleChat.variant === "knowledge"`.

The backend should model the new handler after the shape of the existing OpenRouter reaction route, but the generation path should be much smaller: validate access and chat mode, resolve the replying AI profile, handle `/learn` or call `KnowledgeService.generate`, then create/update the assistant social message with Knowledge metadata.

## Phase 1: Social Variant And RBAC SDK Surface

### Overview

Expose `knowledge` as a valid chat variant and create the SDK/controller route surface for the new Knowledge reaction endpoint.

### Changes Required:

#### 1. Social Chat SDK Variant

**File**: `libs/modules/social/models/chat/sdk/model/src/lib/index.ts`
**Why**: Admin forms and client code read the public `variants` array, and the requested switch is `social.chat.variant`.
**Changes**: Add `knowledge` to the exported variants array. Because the database field is already text, do not generate migrations unless implementation discovers a schema constraint not shown in research.

#### 2. RBAC Subject Controller Route

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts`
**Why**: The controller currently registers only `/react-by/openrouter`; Knowledge needs the requested RBAC endpoint.
**Changes**: Import/register a new handler for `POST /:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/messages/:socialModuleMessageId/react-by/knowledge` with the same subject/profile ownership middleware pattern as the OpenRouter route.

#### 3. RBAC Subject Server SDK

**Files**:

- `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.ts`
- `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/index.ts`

**Why**: Agent dispatch and any future UI calls should use generated-style SDK functions, not ad hoc fetches.
**Changes**: Add a server action mirroring the OpenRouter action shape, posting multipart `data` to `/react-by/knowledge`, then export its props/result types from the singlepage SDK index.

#### 4. RBAC Subject Client SDK

**Files**:

- `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.ts`
- `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/index.ts`

**Why**: The SDK surface should be complete even if automatic replies are triggered by the backend agent path.
**Changes**: Add a React Query mutation wrapper with `globalActionsStore` logging, using the same header saturation and route naming conventions as the OpenRouter wrapper.

### Success Criteria:

#### Automated Verification:

- [x] `knowledge` is present in the `social.chat` SDK variants array.
- [x] RBAC server SDK route string includes `/react-by/knowledge`.
- [x] RBAC client SDK exports props/result/action names for the Knowledge reaction.
- [x] Type checking passes for affected SDK/controller packages.

#### Manual Verification:

- [ ] Admin/social chat forms can select or persist `variant="knowledge"` without a schema migration.

---

## Phase 2: Knowledge Chat Learning API

### Overview

Add a Knowledge service/repository path for ordinary social chat learning that creates deterministic documents from message text and supported attachments, links them to the replying AI profile, and indexes them.

### Changes Required:

#### 1. Knowledge Service Ingestion Method

**File**: `libs/modules/knowledge/backend/app/api/src/lib/service.ts`
**Why**: Existing ingestion is tied to skill transcripts and includes `skillId`; `/learn` needs chat-message scoped ingestion.
**Changes**: Add a service method for chat message learning that accepts profile id, chat id, thread id, message id, optional file id, content, title, and metadata. It should validate non-empty content, call a repository upsert, then run `index({ documentId })`.

#### 2. Knowledge Repository Deterministic Upsert

**File**: `libs/modules/knowledge/backend/app/api/src/lib/repository.ts`
**Why**: The issue requires deterministic slugs based on `profileId`, `messageId`, `fileId`, and `contentHash`.
**Changes**: Add a repository method similar to `upsertTranscriptDocumentForProfile(...)`, but with `sourceSystem: "social-chat-learn"`, deterministic slug components for profile/message/file/hash, document metadata for traceability, and `ensureProfileDocumentRelation(...)` for the AI profile.

#### 3. Content Hash And Metadata Contract

**Files**:

- `libs/modules/knowledge/backend/app/api/src/lib/service.ts`
- `libs/modules/knowledge/backend/app/api/src/lib/repository.ts`

**Why**: Indexing skips unchanged content based on document/source hashes, and later debugging needs to show where learned content came from.
**Changes**: Store source metadata including `profileId`, `chatId`, `threadId`, `messageId`, `fileId`, attachment name/path when present, `contentHash`, and `sourceKind`. Leave `lastIndexedAt` and final `contentHash` updates to the existing indexer.

#### 4. Unit Tests For Learn Ingestion

**File**: `libs/modules/knowledge/backend/app/api/src/lib/service.spec.ts`
**Why**: The critical behavior is that `/learn` always indexes and stays profile scoped.
**Changes**: Add BDD scenarios that verify blank learn content is rejected, chat learn upsert is called with deterministic metadata, and `index({ documentId })` runs for the returned document.

### Success Criteria:

#### Automated Verification:

- [x] Chat learning creates or updates a `knowledge.document`.
- [x] The document links to the requested AI profile through `profiles-to-knowledge-module-documents`.
- [x] `KnowledgeService.index({ documentId })` runs after each successful learn upsert.
- [x] Existing profile-scoped search tests still pass.

#### Manual Verification:

- [ ] A learned document appears under Knowledge documents with metadata pointing back to the source chat message/file.

---

## Phase 3: RBAC Knowledge Reaction Handler

### Overview

Implement the backend endpoint that decides between `/learn` ingestion and normal Knowledge generation for a chat message.

### Changes Required:

#### 1. New Reaction Handler

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.ts`
**Why**: The requested API behavior belongs in the subject-scoped RBAC orchestration layer.
**Changes**: Add a handler that validates required params/body, subject/profile/chat/message access, `chat.variant === "knowledge"`, replying profile `variant === "artificial-intelligence"`, and replying profile membership in the chat. It should also resolve the triggering message thread.

#### 2. `/learn` Flow

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.ts`
**Why**: Chat learning must be explicit and profile-bound.
**Changes**: Detect `/learn`, strip the prefix, collect current message text plus supported `.txt`, `.md`, and `.markdown` attachments, read attachment content from file storage, call the new Knowledge chat-learning service method for each content item, and create or update an assistant social message summarizing the learned documents and index result.

#### 3. Normal Question Flow

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.ts`
**Why**: Knowledge chat replies must be grounded in the replying AI profile's linked documents.
**Changes**: For non-`/learn` messages, call `KnowledgeService.generate({ query, profileId: assistantProfileId })`, then save an assistant `social.message` in the same chat/thread with `metadata.knowledge` containing citations, sources, generation model/provider/model slug, usage, profile id, and triggering message id.

#### 4. Social Message Persistence Helper

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.ts`
- Optionally a small local helper module beside the handler if duplication becomes high.

**Why**: The skill run endpoint already shows the required pattern for creating social messages and chat/thread/profile relations.
**Changes**: Reuse the existing social message SDK relation pattern from the skill run handler, not the Knowledge module's internal chat helper, because the output must be a normal `social.message` in the existing chat thread.

#### 5. RBAC Handler Tests

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.spec.ts`
**Why**: This is the highest-risk orchestration layer.
**Changes**: Add BDD scenarios for `/learn` in a Knowledge chat, `/learn` in a default chat, non-AI replying profile rejection, non-member replying profile rejection, normal question generation with profile id, and assistant message `metadata.knowledge`.

### Success Criteria:

#### Automated Verification:

- [x] `/learn` in `chat.variant="knowledge"` calls chat learning and indexing.
- [x] `/learn` in `chat.variant="default"` is rejected or ignored by the Knowledge endpoint and does not index.
- [x] Normal question generation calls `KnowledgeService.generate` with the replying AI profile id.
- [x] Assistant social messages are linked to the same chat/thread and replying AI profile.
- [x] `message.metadata.knowledge` contains citations/source/model/usage data.

#### Manual Verification:

- [ ] A user can send `/learn` and see a normal assistant confirmation message in the same thread.
- [ ] A later question receives an answer grounded in the learned document.

---

## Phase 4: Agent Dispatch Integration

### Overview

Make the automatic reply path choose Knowledge for Knowledge chats and `chat-gpt-*` AI profiles while preserving existing Telegram and OpenRouter behavior.

### Changes Required:

#### 1. Agent Branching

**File**: `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`
**Why**: The current automatic reply path is slug-based and only calls OpenRouter for `open-router`.
**Changes**: Add Knowledge dispatch when the chat variant is `knowledge`, the candidate reply profile has `variant="artificial-intelligence"`, and its slug matches `chat-gpt-*`. Skip Telegram bot commands and empty messages consistently with the OpenRouter branch.

#### 2. Knowledge Reply SDK Call

**File**: `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`
**Why**: Agent must call the RBAC subject endpoint as the original message author, using the existing subject/profile access model.
**Changes**: Add a helper parallel to `openRouterReplyMessageCreate(...)` that calls the new RBAC server SDK `react-by/knowledge` action with `shouldReplySocialModuleProfile` in the payload and the author subject JWT.

#### 3. Agent Tests

**Files**:

- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/open-router-reply.spec.ts`
- New or existing agent dispatch spec near `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/`

**Why**: The routing switch must not regress existing `open-router` and `telegram-bot` behavior.
**Changes**: Add BDD scenarios verifying Knowledge chats call the Knowledge reaction SDK, default chats still call OpenRouter for the `open-router` profile, and non-`chat-gpt-*` profiles do not use Knowledge.

### Success Criteria:

#### Automated Verification:

- [x] `chat.variant="knowledge"` routes `chat-gpt-*` AI profiles to `/react-by/knowledge`.
- [x] `chat.variant="default"` keeps the existing `open-router` branch.
- [x] Telegram bot behavior is unchanged.

#### Manual Verification:

- [ ] Sending a normal message in a Knowledge chat triggers exactly one AI profile reply path.

---

## Phase 5: Knowledge Chat Frontend

### Overview

Extend the current default social chat UI with a Knowledge command picker instead of building a separate chat UI.

### Changes Required:

#### 1. Command Definitions

**File**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx`
**Why**: V1 only needs `/learn`, but the UI should be structured as a command list so more commands can be added later.
**Changes**: Add a small command metadata list gated by `props.socialModuleChat.variant === "knowledge"`, with `/learn` label and a short description explaining that it adds current text and supported attachments to the AI profile knowledge base.

#### 2. Upward Command Picker

**File**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx`
**Why**: The user requested a dropdown above the composer, matching the screenshot pattern.
**Changes**: Use existing shared shadcn `Command` and `Popover` primitives to show a compact list above the input when the textarea value starts with `/` or matches a slash-command prefix. The item layout should include command name and description, be keyboard selectable, and not resize the composer.

#### 3. Command Selection Behavior

**File**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx`
**Why**: Selecting `/learn` must be fast and predictable.
**Changes**: When `/learn` is selected, insert `/learn ` into the textarea, focus the textarea, and keep the existing submit and attachment behavior intact. The actual backend action remains the normal message creation plus automatic agent reaction.

#### 4. Styling And Responsiveness

**File**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx`
**Why**: The picker must feel native to the current chat, not like a new page.
**Changes**: Reuse Tailwind/shadcn styling, keep the list constrained to the composer width, open upward, support mobile widths, and avoid overlapping the message list or send controls.

#### 5. Frontend Tests

**File**: create or update a BDD spec near the message-list component.
**Why**: The command picker is a visible workflow requirement.
**Changes**: Add tests for showing the picker only in Knowledge chats, hiding it in default chats, inserting `/learn ` on selection, and preserving normal submit behavior.

### Success Criteria:

#### Automated Verification:

- [x] The command picker renders for `chat.variant="knowledge"` when typing `/`.
- [x] The command picker does not render for `chat.variant="default"` or `telegram`.
- [x] Selecting `/learn` updates the form description to `/learn ` and focuses the textarea.
- [x] Existing message submit and file attachment flows still work.

#### Manual Verification:

- [ ] The command list opens upward above the composer and matches the screenshot interaction pattern.
- [ ] The UI remains usable on desktop and mobile widths.

---

## Phase 6: End-To-End Verification And Documentation

### Overview

Validate the backend, agent dispatch, frontend command picker, and module contracts together.

### Changes Required:

#### 1. Scenario Coverage

**Files**:

- `apps/api/specs/scenario/singlepagestartup/` if an API-level scenario is needed.
- Targeted module specs under `libs/modules/rbac`, `libs/modules/agent`, `libs/modules/knowledge`, and `libs/modules/social`.

**Why**: The acceptance tests cross module boundaries and should be represented by focused BDD tests.
**Changes**: Add or update tests that cover learn/index, normal question generation, default-chat non-RAG behavior, and profile isolation.

#### 2. README Notes

**Files**:

- `libs/modules/knowledge/README.md`
- `libs/modules/social/README.md`

**Why**: The Knowledge module and Social chat variant behavior should be discoverable for later merge work.
**Changes**: Document that `social.chat.variant="knowledge"` enables profile-scoped Knowledge/RAG through the RBAC reaction endpoint and `/learn` command.

### Success Criteria:

#### Automated Verification:

- [x] `npx nx run @sps/social:tsc:build`
- [x] `npx nx run @sps/rbac:tsc:build`
- [x] `npx nx run @sps/knowledge:tsc:build`
- [x] `npx nx run @sps/agent:tsc:build`
- [x] `npx nx run @sps/social:jest:test`
- [x] `npx nx run @sps/rbac:jest:test`
- [x] `npx nx run @sps/knowledge:jest:test`
- [x] `npx nx run @sps/agent:jest:test`

#### Manual Verification:

- [ ] Create a Knowledge chat with a user profile and `chat-gpt-*` AI profile.
- [ ] Type `/`, choose `/learn` from the upward command picker, attach a `.md` or `.txt` file, and send.
- [ ] Confirm a Knowledge document is created/updated, linked to the AI profile, indexed into chunks, and acknowledged in chat.
- [ ] Ask a follow-up question and confirm the assistant answer cites profile-linked Knowledge sources.
- [ ] Repeat from another AI profile and confirm the first profile's knowledge is not used.

## Testing Strategy

### Unit Tests:

- Knowledge service: blank learn content rejection, deterministic chat learn upsert call, `index({ documentId })` execution, profile-scoped search retention.
- RBAC Knowledge handler: chat variant validation, AI profile validation, profile/chat/message access, `/learn` ingestion, attachment filtering, normal question generation, `metadata.knowledge`.
- Agent service: dispatch by `chat.variant`, `chat-gpt-*` profile routing, existing OpenRouter/Telegram behavior preserved.
- Frontend composer: Knowledge-only command picker, `/learn` insertion, normal submit compatibility.

### Integration Tests:

- RBAC endpoint route registration and SDK route string.
- End-to-end handler test with mocked Knowledge service and social SDKs that verifies social message and relation creation.
- Optional API scenario if existing module tests do not cover cross-module dispatch well enough.

### Manual Testing Steps:

1. Start API, host, database, and LLM gateway with existing project scripts.
2. Create or update a chat to `variant="knowledge"` and connect a user profile plus an AI profile with slug `chat-gpt-*`.
3. Open the existing subject social chat UI.
4. Type `/` and select `/learn` from the upward command picker.
5. Send learn content with a supported text/markdown attachment.
6. Verify Knowledge document/source/chunk rows and profile-document relation.
7. Ask a question that requires the learned content.
8. Confirm the assistant message contains answer text and Knowledge metadata.
9. Switch to a default chat and confirm `/learn` does not trigger RAG indexing.

## Performance Considerations

- `/learn` can run embeddings synchronously in V1 because scope is limited to current message text and text/markdown attachments, but handler tests should keep the implementation easy to move to background jobs later.
- Attachment filtering should reject unsupported file types before reading content or calling embeddings.
- Reusing deterministic slugs and content hashes prevents duplicate documents for repeated `/learn` submissions.
- `KnowledgeService.search` already caps `topK` at 20, which limits generation context size.

## Migration Notes

- Adding `knowledge` to the SDK variants array should not require a Drizzle migration because `social.chat.variant` is a text field.
- If implementation changes any schema or fields, run the matching `repository-generate` target and keep generated SQL/snapshots/journal as generated output only.
- Do not edit repository data snapshots to create demo chats, profiles, or documents.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-192.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-192.md`
- Process log: `thoughts/shared/processes/singlepagestartup/ISSUE-192.md`
- GitHub issue: `https://github.com/singlepagestartup/singlepagestartup/issues/192`
