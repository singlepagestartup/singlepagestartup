---
date: 2026-06-15T01:01:43+0300
issue_number: 193
repository: singlepagestartup
topic: "OpenRouter message-attached social skill instructions"
status: in_review
---

# OpenRouter Message-Attached Social Skill Instructions Implementation Plan

## Overview

Update `react-by/openrouter` so `social.skill` records linked to the replying profile work as SPS-managed text instructions attached to the beginning of the triggering user message. Skills are invoked in chat with slash syntax using the linked skill slug, for example `/youtube-description`; the replying AI profile description becomes the system/persona context, and `@knowledge` continues to add profile-scoped RAG fragments.

## Current State Analysis

Issue #193 originally requested provider-native OpenAI/Anthropic Skills, but the corrected research and operator clarification supersede that scope for OpenRouter. OpenRouter skills are now planned as text instructions, not native provider skill mounts.

Current backend behavior already resolves linked active skills and `@knowledge`, but places selected skills into system messages:

- `react-by-openrouter.ts` detects selected skill ids, `@knowledge`, mentioned skills, and computes the sanitized trigger query before loading the reply profile (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:884`).
- The thread context builder already substitutes the persisted trigger message with `sanitizedTriggerDescription`, so the generated payload can differ from the saved `social.message.description` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:971`).
- String and multipart OpenRouter context messages are pushed in one place, which is the correct surface for attaching a skill prefix to the trigger user message (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1080`).
- `resolveOpenRouterKnowledgeContext(...)` currently returns `systemMessages` that include selected skills and RAG fragments (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1618`).
- `toSkillSystemPrompt(...)` formats selected skills for system-message injection today, which conflicts with the clarified requirement (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1853`).
- `buildGenerationContext(...)` prepends system messages before the thread context, so profile persona and RAG can remain system context while skill instructions move into the user message (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:2483`).
- Current skill mention parsing uses `@slug` syntax and strips `@...` tokens (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:2215`); this must move to slash skill tokens while preserving reserved slash commands such as `/learn`.
- `social.profile` already has localized `title`, `subtitle`, and `description` JSONB fields suitable for specialist/persona context (`libs/modules/social/models/profile/backend/repository/database/src/lib/fields/singlepage.ts:10`).
- Legacy `react-by/knowledge` already treats the reply profile as persona by passing profile title and description into generation (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.ts:673`), and Knowledge generation places persona context before skill/history/query sections (`libs/modules/knowledge/backend/app/api/src/lib/generation/index.ts:214`).

## Desired End State

When a user sends a message with `/skill-slug`, selected `skillIds`, or both, `react-by/openrouter` resolves only active skills linked to the replying AI profile and prefixes their instructions to the triggering user message in the OpenRouter request payload. A skill cannot be invoked if it is not already linked to that replying profile through `profiles-to-skills`. The saved user message remains unchanged. Reply profile description is added as system/persona context. `@knowledge` still controls whether profile-scoped RAG search runs and RAG fragments are added as grounding context. The current thread context continues to be included in the generation payload.

Verification should prove the exact OpenRouter `messages` payload has:

- System context for language/output rules.
- System context for the replying AI profile/persona.
- System context for RAG fragments only when `@knowledge` is present.
- A user message whose content starts with selected skill instructions followed by the sanitized user request.
- Current thread history before the trigger message, preserving the existing context behavior.
- No selected skill instructions in system/developer messages.

### Key Discoveries

- The current trigger message can already be sanitized without mutating persisted message data (`react-by-openrouter.ts:971`).
- Selected skills are already scoped through `profiles-to-skills`, ordered, deduplicated, and filtered for `status !== "archived"` (`react-by-openrouter.ts:1731`).
- The current skill insertion point is wrong because `toSkillSystemPrompt(...)` returns a system prompt (`react-by-openrouter.ts:1853`).
- The current `@skill` parser and stripper must be changed to slash skill syntax, while `/learn` remains a reserved command and not a skill slug.
- RAG scoping already uses profile-linked Knowledge document ids before search (`react-by-openrouter.ts:1606`).
- Frontend already submits selected `skillIds`, `useKnowledgeSearch`, OpenRouter `model`, and `reasoning` through the reaction request (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/hooks/use-chat-composer.ts:152`).

## What We're NOT Doing

- Not implementing provider-native OpenAI `skill_reference` or Anthropic `container.skills` through OpenRouter.
- Not changing `social.skill`, `social.profile`, or relation database schemas.
- Not changing the user-visible saved message content by storing injected skill instructions in `social.message.description`.
- Not moving skill instructions into `system` or `developer` messages.
- Not replacing `@knowledge` RAG behavior or `/learn` semantics.
- Not adding a new OpenRouter tool-calling loop for skill activation in this pass.
- Not allowing a message to invoke skills linked to another profile.
- Not changing model or Thinking controls.

## Implementation Approach

Make the smallest backend change that separates three instruction layers:

1. Profile/persona system context from the replying `social.profile`.
2. Optional RAG system context from `@knowledge`.
3. Optional selected skill prefix attached to the triggering user message.

Keep the existing RBAC/frontend contract intact: the composer continues to pass `skillIds`, `useKnowledgeSearch`, `model`, and `reasoning`; the backend decides how those controls shape the OpenRouter payload.

The frontend mention/command contract changes only for skills: skill invocation is slash-based (`/skill-slug`) and must be populated from the replying profile's linked active skills. `@knowledge` remains the Knowledge/RAG control mention.

## Phase 1: Backend Context Contract

### Overview

Refactor `react-by/openrouter` context assembly so selected skills no longer become system messages and instead become a prefix on the trigger user message sent to OpenRouter.

### Changes Required

#### 1. OpenRouter Knowledge/Skill Resolution

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`

**Why**: `resolveOpenRouterKnowledgeContext(...)` currently mixes selected skill instructions and RAG fragments into one `systemMessages` array, which prevents enforcing distinct placement.

**Changes**:

- Split or reshape the resolved context so it exposes selected skills separately from RAG system messages.
- Replace `toSkillSystemPrompt(...)` with a helper such as `toSkillMessagePrefix(...)`.
- Resolve slash skill tokens such as `/youtube-description` against active skills linked to the replying profile.
- Preserve linked-profile authorization, slug lookup, id lookup, archived filtering, and stable relation ordering.
- Reject or ignore unlinked slash skill slugs clearly; do not fall back to global `social.skill` lookup.
- Keep `/learn` reserved for Knowledge ingestion and exclude it from skill slug resolution.
- Keep `requestedSkillIds`, `promptSkills`, and existing metadata inputs available for the assistant message metadata.

### Success Criteria

#### Automated Verification

- [ ] Backend unit tests prove selected linked skills are still resolved and unlinked skill ids still fail.
- [ ] Backend unit tests prove slash skill slugs resolve only through the replying profile's `profiles-to-skills` relations.
- [ ] Backend unit tests prove archived skills are excluded.
- [ ] Backend unit tests prove `/learn` is treated as a command, not a skill.

#### Manual Verification

- [ ] Code review confirms no selected skill content is returned inside `systemMessages`.

---

## Phase 2: Trigger Message Prefixing

### Overview

Attach selected skill instructions to the beginning of the triggering user message in the OpenRouter payload while leaving persisted chat message text unchanged.

### Changes Required

#### 1. Thread Context Builder

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`

**Why**: The message loop already knows when it is processing the trigger message and already substitutes the raw message with `sanitizedTriggerDescription`.

**Changes**:

- Apply the skill prefix only when `socialModuleMessage.id === socialModuleMessageId`.
- For string content, prefix the sanitized trigger text.
- For multipart content with attachments, prefix only the first text part while preserving image/file parts.
- Strip slash skill tokens from the sanitized trigger text after resolving them, so the model receives the expanded skill instructions plus the user's actual request.
- Do not prefix assistant messages, prior user messages, status messages, or `/new` reset markers.
- Preserve the existing current-thread context that is already sent to OpenRouter; do not reduce generation to only the trigger message.
- Keep `social.message.description` unchanged in creation/update paths.

### Success Criteria

#### Automated Verification

- [ ] Backend test asserts generated OpenRouter context includes selected skill instructions at the start of the trigger user message.
- [ ] Backend test asserts generated OpenRouter context does not include selected skill instructions in any system message.
- [ ] Backend test asserts current thread history remains present in the OpenRouter payload.
- [ ] Backend test covers trigger messages with file/image parts.

#### Manual Verification

- [ ] In the UI, the sent user message still displays the original `/skill-slug` request text, not the expanded instruction block.

---

## Phase 3: Profile Persona And RAG System Context

### Overview

Add the replying AI profile description as system/persona context and keep RAG fragments as separate system grounding only when `@knowledge` is requested.

### Changes Required

#### 1. Profile Persona Prompt

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`

**Why**: The user clarified that the profile itself represents the specialist. Its description belongs in system context, not in the user message.

**Changes**:

- Add a profile/persona system helper based on reply profile `adminTitle`, `slug`, localized `title`, and localized `description`.
- Prefer the request language where it maps to profile text keys; otherwise fall back to available `ru`, `en`, or first non-empty localized value.
- Add the persona system message to `buildGenerationContext(...)` before RAG fragments and before thread context.
- Avoid duplicating skill descriptions in profile persona context; linked skills remain user-message prefix only when selected.

#### 2. RAG Context Preservation

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`

**Why**: `@knowledge` must continue to pass profile-scoped search results into generation, and must still combine with selected skill instructions.

**Changes**:

- Keep Knowledge document lookup scoped to `profiles-to-knowledge-module-documents`.
- Keep search disabled unless `@knowledge` or `useKnowledgeSearch` explicitly requests it.
- Keep `/learn` requiring `@knowledge /learn`.
- Keep RAG fragments in system context because they are grounding data, not user-request instructions.

### Success Criteria

#### Automated Verification

- [ ] Backend test asserts reply profile description appears in system context.
- [ ] Backend test asserts `@knowledge` still searches only linked document ids.
- [ ] Backend test asserts no RAG search runs without `@knowledge`.
- [ ] Backend test asserts selected skill prefix and RAG fragments can both appear in one request payload in their separate layers.

#### Manual Verification

- [ ] In an AI chat with a profile description, responses follow the profile persona even when no skill is selected.
- [ ] In the same chat, adding `@knowledge` grounds the response in linked Knowledge documents.

---

## Phase 4: Metadata And Frontend Contract Preservation

### Overview

Keep the current frontend interaction model and make assistant metadata accurately describe applied skills as message-prefix instructions.

### Changes Required

#### 1. Assistant Message Metadata

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`

**Why**: Current metadata records selected skills as prompt instructions. After this change the placement is specifically the trigger user message prefix.

**Changes**:

- Store applied skill ids/slugs/titles in `message.metadata.knowledge.skills`.
- Use a mode label such as `message-prefix-instruction`.
- Preserve existing `useKnowledgeSearch`, `documentIds`, `sources`, selected model, and reasoning metadata.

#### 2. Composer Request Contract

**Files**:

- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/hooks/use-chat-composer.ts`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/components/Composer.tsx`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/components/SkillMentionPicker.tsx`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/hooks/use-profile-skills.ts`

**Why**: The frontend already passes `skillIds`, `@knowledge`, model, and Thinking controls. It must switch skill insertion from `@skill` to `/skill-slug` while keeping skill options scoped to the replying profile.

**Changes**:

- Preserve current request body and query params.
- Keep selected skill badges and selected skill id synchronization, but derive selected skills from slash skill tokens.
- Show linked active profile skills in the slash picker; do not show global or other-profile skills.
- Keep `/learn` in the command list and avoid collision with skills whose slug would conflict with reserved commands.
- Keep `@knowledge` as the Knowledge/RAG control mention.
- Confirm no code expands skill instructions into the visible textarea or saved message body.

### Success Criteria

#### Automated Verification

- [ ] Frontend tests still prove selected skill ids are sent to `react-by/openrouter`.
- [ ] Frontend tests still prove removing a skill mention clears stale `skillIds`.
- [ ] Frontend tests still prove `@knowledge` sets `useKnowledgeSearch`.
- [ ] Frontend tests prove `/skill-slug` selects a linked profile skill and no unlinked profile skill appears in the picker.
- [ ] Frontend tests prove `/learn` remains available as a command and is not treated as a skill.

#### Manual Verification

- [ ] Selecting a skill through `/skill-slug` leaves the visible message compact but affects the model response.

---

## Testing Strategy

### Unit Tests

- Update `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts`.
- Add BDD coverage for skill prefix placement on string user messages.
- Add BDD coverage for skill prefix placement on multipart user messages with attachments.
- Add BDD coverage for profile persona system prompt.
- Add BDD coverage for `/skill-slug` resolution from linked active profile skills.
- Add BDD coverage for rejecting or clearly ignoring unlinked slash skill slugs.
- Add BDD coverage for current thread context preservation.
- Add BDD coverage for `@knowledge + /skill-slug` composition.
- Keep existing manual model/reasoning tests unchanged unless payload setup changes.

### Frontend Tests

- Update `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.spec.tsx` only if request assertions need wording changes.
- Preserve tests around selected skill badges, stale skill removal, `@knowledge`, `/learn`, model dropdown, and Thinking dropdown.
- Update picker tests so slash input can show both reserved commands and linked profile skills, with `/learn` remaining a command and `/skill-slug` selecting a skill.

### Automated Commands

- [ ] `npm run test:file -- libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts`
- [ ] `npm run test:file -- libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.spec.tsx`
- [ ] `npx nx run @sps/rbac:models:subject:backend-app-api:typescript:build`
- [ ] `npx nx run @sps/rbac:models:subject:frontend-component:typescript:build`

### Manual Testing Steps

1. Start the backend yourself with `npm run api:dev` and keep the terminal open to inspect API logs during the test.
2. Start the host with `npm run host:dev` if it is not already running.
3. Use the Browser plugin against the already-authenticated in-app browser session.
4. Open an AI chat where the reply profile has a description and at least one linked active skill.
5. Type `/` and verify the picker shows `/learn` plus skills linked to the replying profile, and does not show skills from other profiles.
6. Send `/skill-slug` with a normal text request and verify the answer follows the skill while the saved user message remains compact.
7. Send `@knowledge /skill-slug` with a question covered by linked Knowledge documents and verify the answer uses both the skill behavior and profile-scoped RAG facts.
8. Send the same question without `@knowledge` and verify RAG is not invoked.
9. Send `@knowledge /learn ...` and verify learning still indexes/links Knowledge without OpenRouter generation.

## Performance Considerations

- Skill prefixing increases prompt size only for explicitly selected or mentioned skills.
- RAG search remains disabled unless `@knowledge` is present, so non-RAG OpenRouter messages do not pay search cost.
- Profile persona context is small and should be normalized/trimmed to avoid large localized JSON blobs in every request.

## Migration Notes

No database migration is required. Existing `social.skill`, `profiles-to-skills`, `social.profile.description`, and Knowledge relation data are reused. Existing provider-native sync metadata can remain in place but is not used by the OpenRouter text-skill path.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-193.md`
- Corrected research: `thoughts/shared/research/singlepagestartup/ISSUE-193.md`
- Process log: `thoughts/shared/processes/singlepagestartup/ISSUE-193.md`
- Related baseline research: `thoughts/shared/research/singlepagestartup/ISSUE-192.md`

<!-- Last synced at: 2026-06-14T23:10:50Z -->
