# Telegram Voice Message Transcription Implementation Plan

## Overview

Implement Telegram voice-note ingestion so a voice update creates one traceable `social.message`, stores the transcription-ready audio in `file-storage`, writes the OpenAI transcript into `description`, and then triggers the same downstream agent/OpenRouter behavior as a normal text message.

## Current State Analysis

`apps/telegram` is intentionally a thin transport adapter, and its current message ingestion path forwards text/caption plus photo/document/video/audio files into RBAC. Voice notes are not extracted, OpenAI transcription is not exposed through the shared wrapper, and the agent flow only treats message `POST` actions as normal incoming messages.

## Desired End State

A private Telegram voice message, or a qualifying group voice message, creates exactly one user-authored social message in the correct chat/thread. The message starts with voice transcription metadata in a processing state, has the converted audio attached through `messages-to-file-storage-module-files`, is updated with the transcript on success, records failure metadata on conversion/transcription failure, and invokes automatic agent/OpenRouter handling only after a successful transcript exists.

### Key Discoveries

- Telegram ordinary messages enter `handleIncomingMessage` from the grammY `"message"` handler after `buildTelegramMessageData(...)` runs (`apps/telegram/src/lib/telegram-bot.ts:374`, `apps/telegram/src/lib/telegram-bot.ts:434`, `apps/telegram/src/lib/telegram-bot.ts:439`).
- Current Telegram message data uses `text` or `caption` for `description`, and only extracts photo/document/video/audio attachments; there is no `message.voice` branch (`apps/telegram/src/lib/telegram-bot.ts:619`, `apps/telegram/src/lib/telegram-bot.ts:628`, `apps/telegram/src/lib/telegram-bot.ts:637`, `apps/telegram/src/lib/telegram-bot.ts:648`, `apps/telegram/src/lib/telegram-bot.ts:659`).
- Telegram files already download through `ctx.api.getFile(...)`, become `File[]` via `blobifyFiles(...)`, and are sent through the existing thread-scoped RBAC message create SDK (`apps/telegram/src/lib/telegram-bot.ts:789`, `apps/telegram/src/lib/telegram-bot.ts:792`, `apps/telegram/src/lib/telegram-bot.ts:868`).
- RBAC message create already deduplicates by `sourceSystemId` scoped to chat/thread, creates the `social.message`, stores files, and links message-file relations (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:100`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:112`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:127`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:160`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:177`).
- `social.message.metadata` already exists as JSONB, so transcription state does not need a schema migration (`libs/modules/social/models/message/backend/repository/database/src/lib/fields/singlepage.ts:17`).
- Message update currently creates a social action with payload type `update`; the agent handler treats this as a notification edit path, not the message-create reply path (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/update.ts:171`, `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:183`, `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:192`).
- The normal agent path is driven by action-logged message `POST` requests and ignores empty prompts before OpenRouter generation (`libs/middlewares/src/lib/actions-logger/index.ts:26`, `libs/middlewares/src/lib/actions-logger/index.ts:37`, `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:336`, `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:347`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:360`).
- The shared OpenAI wrapper only exposes `generateText(...)` today and centralizes `OPEN_AI_API_KEY` (`libs/shared/third-parties/src/lib/open-ai/index.ts:1`, `libs/shared/third-parties/src/lib/open-ai/index.ts:17`).
- The installed OpenAI SDK supports `client.audio.transcriptions.create(...)`, `gpt-4o-transcribe`, and uploadable audio files (`node_modules/openai/resources/audio/transcriptions.d.ts:15`, `node_modules/openai/resources/audio/transcriptions.d.ts:358`, `node_modules/openai/resources/audio/transcriptions.d.ts:363`).

## What We're NOT Doing

- No `social.message` table schema change or handwritten Drizzle migration; metadata is enough for transcription state.
- No edits to repository data snapshots under module `backend/repository/database/src/lib/data/*`.
- No UI rendering changes for chat attachments in this issue.
- No diarization, streaming transcription, translation, or multi-speaker support.
- No direct OpenAI SDK calls inside the Telegram adapter; OpenAI access stays in `libs/shared/third-parties`.
- No broad rewrite of Telegram media groups, billing, notification delivery, or OpenRouter generation.

## Implementation Approach

Keep Telegram-specific parsing/download/conversion in `apps/telegram`, keep OpenAI transcription reusable in the shared third-party wrapper, keep persistence through existing RBAC SDKs, and add a narrow transcription-completed signal so the agent handler can reuse the existing normal-message reply logic without treating every message edit as a new user prompt.

Use a stable transcription-ready audio format such as WebM for persisted/transcribed voice audio. The OpenAI SDK type surface also lists OGG as uploadable, but the ticket explicitly requests conversion and the public guide/API reference are not perfectly aligned, so the implementation should normalize Telegram OGG/Opus voice notes before calling transcription.

## Phase 1: Shared OpenAI Transcription Foundation

### Overview

Add the reusable transcription API surface and environment model override before wiring Telegram behavior.

### Changes Required

#### 1. OpenAI environment constants

**File**: `libs/shared/utils/src/lib/envs/artificial-intelligence.ts`

**Why**: The ticket requires a default transcription model with an override, and current shared envs only export `OPEN_AI_API_KEY`.

**Changes**: Export `OPEN_AI_TRANSCRIPTION_MODEL`, defaulting at wrapper call time to `gpt-4o-transcribe` when unset. Keep `OPEN_AI_API_KEY` validation unchanged.

#### 2. OpenAI transcription wrapper

**File**: `libs/shared/third-parties/src/lib/open-ai/index.ts`

**Why**: The Telegram adapter must not create ad-hoc OpenAI client code, and this file already owns the `OpenAI` SDK client.

**Changes**: Add a `transcribeAudio(...)` method that accepts an uploadable `File`, optional model/language/prompt fields if useful, calls `client.audio.transcriptions.create(...)`, returns normalized transcript text plus useful response metadata, and validates that the returned text is non-empty before callers mark a message complete.

#### 3. OpenAI wrapper tests

**File**: `libs/shared/third-parties/src/lib/open-ai/index.spec.ts`

**Why**: There is no current test coverage for OpenAI transcription behavior.

**Changes**: Add BDD-style Jest tests with the `openai` SDK mocked, covering default model selection, env/model override, transcript text extraction, and failure on empty transcription output.

### Success Criteria

#### Automated Verification

- [x] OpenAI wrapper tests pass: `npm run test:file -- libs/shared/third-parties/src/lib/open-ai/index.spec.ts`
- [x] Shared third-party library build passes: `npx nx run @sps/shared-third-parties:tsc:build`

#### Manual Verification

- [x] `OPEN_AI_TRANSCRIPTION_MODEL` is optional and defaults to `gpt-4o-transcribe`.
- [x] No OpenAI SDK client is instantiated outside `libs/shared/third-parties/src/lib/open-ai`.

---

## Phase 2: Telegram Voice Ingestion and Persistence

### Overview

Create a voice-message path that stores a processing social message first, attaches transcription-ready audio, then updates the same message after transcription.

### Changes Required

#### 1. Voice data extraction and orchestration helper

**Files**: `apps/telegram/src/lib/telegram-bot.ts`, new helper under `apps/telegram/src/lib/*`

**Why**: `telegram-bot.ts` currently combines update parsing, file extraction, and RBAC message creation. Voice handling needs enough orchestration that a small helper keeps the adapter readable while staying inside the Telegram transport boundary.

**Changes**: Detect `message.voice`, capture `file_id`, `file_unique_id`, duration, mime metadata, and source message id, and route voice updates through a voice-specific helper instead of the generic attachment path. Preserve existing photo/document/video/audio behavior.

#### 2. Telegram voice download and conversion

**Files**: `apps/telegram/src/lib/*`, `package.json`, `package-lock.json`

**Why**: Telegram voice notes are typically OGG/Opus and the approved plan assumption is to persist/transcribe a normalized format such as WebM.

**Changes**: Download the Telegram voice file with `ctx.api.getFile(...)`, convert it to the chosen supported format using a bundled or explicitly documented ffmpeg runtime dependency, produce a `File` with correct name/type, enforce OpenAI's 25 MB transcription upload limit before calling OpenAI, and clean up temporary files/buffers after conversion.

#### 3. Processing message creation

**File**: `apps/telegram/src/lib/telegram-bot.ts`

**Why**: The issue requires creating the message before transcription, attaching the converted audio, and keeping failures traceable.

**Changes**: Reuse the existing thread-scoped RBAC message create SDK to create a single message with `sourceSystemId`, empty `description`, the converted audio `files`, and `metadata.telegramVoiceTranscription.status = "processing"` plus Telegram file/duration/model details. Continue to rely on RBAC `sourceSystemId` dedupe for duplicate Telegram updates.

#### 4. Transcription completion and failure updates

**File**: `apps/telegram/src/lib/telegram-bot.ts`

**Why**: The transcript must be saved into the existing social message, while failures must not crash the bot process.

**Changes**: After the processing message is created, call the shared OpenAI wrapper, then update the same message through the existing RBAC message update SDK with transcript `description` and completed metadata. On conversion/transcription failure, update the same message metadata to failed with a concise error category/message and keep the audio attachment intact.

### Success Criteria

#### Automated Verification

- [x] Telegram voice helper tests pass with BDD headers and mocked Telegram/OpenAI/RBAC boundaries.
- [x] Telegram build passes: `npm run telegram:build`

#### Manual Verification

- [ ] A Telegram private voice note creates one user-authored message in the correct chat/thread.
- [ ] Replaying the same Telegram update returns/keeps the same `sourceSystemId` message instead of creating a duplicate.
- [ ] The converted audio is visible in file-storage and linked through `social.messages-to-file-storage-module-files`.
- [ ] Conversion/transcription failure records failed metadata and does not terminate the Telegram worker.

---

## Phase 3: Completed Transcript Agent Routing

### Overview

Make the transcript update trigger normal agent/OpenRouter behavior without turning every message edit into a prompt.

### Changes Required

#### 1. RBAC message update action signal

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/update.ts`

**Why**: The update handler currently emits only generic `update` actions, and the agent treats those as notification edits.

**Changes**: When the updated message metadata marks `telegramVoiceTranscription.status = "completed"` and includes an explicit trigger marker from the Telegram voice flow, emit a distinct action payload type for transcription completion. Keep normal edits as `type: "update"`.

#### 2. Agent message-reply reuse

**File**: `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts`

**Why**: Normal incoming text messages already resolve chat/profile/message relations and call automatic reply profiles; completed voice transcripts should use the same behavior.

**Changes**: Extract the shared relation-resolution and automatic-profile dispatch currently inside `onMessage(...)` into a helper, then call it from both message `POST` handling and the new transcription-completed action handling. Keep generic update actions routed to `notificationMessageUpdate(...)` only.

#### 3. Agent/OpenRouter guard tests

**File**: `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.spec.ts`

**Why**: The critical regression risk is accidentally triggering agents on all message edits or failing to trigger them after voice transcription.

**Changes**: Add BDD scenarios proving a transcription-completed action invokes `agentSocialModuleProfileHandler(...)`, a generic update action still only performs notification update behavior, and empty/failed voice transcription states do not invoke OpenRouter.

### Success Criteria

#### Automated Verification

- [x] Agent controller tests pass: `npm run test:file -- libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.spec.ts`
- [x] Existing OpenRouter empty-description guard tests still pass: `npm run test:file -- libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/open-router-reply.spec.ts`

#### Manual Verification

- [ ] A successful Telegram voice transcript produces the same class of bot/OpenRouter reply as a normal text message.
- [ ] Editing a message or marking transcription failed does not trigger a new agent reply.

---

## Phase 4: Documentation and End-to-End Verification

### Overview

Document the new env/voice behavior and verify the changed integration path with targeted commands.

### Changes Required

#### 1. Telegram documentation and env examples

**Files**: `apps/telegram/README.md`, `apps/telegram/.env.example`, `tools/deployer/.env.example` if deployment env examples are expected to carry OpenAI runtime settings

**Why**: Operators need to know the bot now depends on OpenAI transcription configuration and an audio conversion runtime.

**Changes**: Document `OPEN_AI_API_KEY`, optional `OPEN_AI_TRANSCRIPTION_MODEL`, the conversion dependency/runtime expectation, and the high-level processing/completed/failed metadata states.

#### 2. Targeted verification commands

**Files**: changed test files and project configs only as needed

**Why**: This feature crosses app, shared wrapper, RBAC, and agent boundaries.

**Changes**: Ensure all added/changed tests use the repository BDD header format. Run targeted wrapper/agent/Telegram tests, `npm run telegram:build`, and any focused Nx build/test target that covers changed shared/RBAC files.

### Success Criteria

#### Automated Verification

- [x] `npm run test:file -- libs/shared/third-parties/src/lib/open-ai/index.spec.ts`
- [x] `npm run test:file -- libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.spec.ts`
- [x] Telegram voice helper test command passes once the helper test path exists.
- [x] `npm run telegram:build`
- [x] Relevant changed-library builds or lint targets pass.

#### Manual Verification

1. Send a Telegram private voice note.
2. Confirm exactly one user message exists for the source Telegram `message_id`.
3. Confirm the attached file-storage record is the converted transcription-ready audio.
4. Confirm `description` changes from empty/processing to the transcript.
5. Confirm metadata changes from processing to completed.
6. Confirm the bot/OpenRouter reply arrives in the same social thread.
7. Replay the same Telegram update and confirm no duplicate message is created.
8. Simulate conversion/transcription failure and confirm metadata is failed, audio remains attached, and the bot process stays alive.

## Testing Strategy

### Unit Tests

- OpenAI transcription wrapper with mocked SDK calls.
- Telegram voice extraction/conversion orchestration with mocked Telegram file API, converter, RBAC SDK, and OpenAI wrapper.
- Agent handler routing for transcription-completed action vs generic update action.

### Integration Tests

- A focused RBAC/agent-style test around message update action payload classification if practical within existing module test patterns.
- Existing OpenRouter prompt gating tests to ensure empty processing messages remain silent.

### Manual Testing Steps

1. Run the Telegram service locally with valid Telegram, RBAC, and OpenAI envs.
2. Send a voice note to the bot in a private chat.
3. Inspect the social message, metadata, file-storage record, and thread relation.
4. Verify that the OpenRouter reply appears only after transcript completion.
5. Replay or re-deliver the same Telegram update and confirm idempotency.

## Performance Considerations

- Check converted audio size before transcription and fail traceably when it exceeds OpenAI's documented 25 MB upload limit.
- Keep conversion/transcription in the existing background task style so the Telegram webhook handler does not block longer than necessary.
- Clean up temporary conversion artifacts promptly.
- Avoid loading or converting non-voice attachments through the new path.
- Record enough metadata for operational debugging without storing large transcripts or binary data in metadata.

## Migration Notes

No database migration is expected. Existing voice-less messages remain unchanged. New voice processing state lives in `social.message.metadata`, and new audio persists through the existing file-storage and message-file relation flows.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-189.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-189.md`
- Process log: `thoughts/shared/processes/singlepagestartup/ISSUE-189.md`
- GitHub issue: https://github.com/singlepagestartup/singlepagestartup/issues/189
- OpenAI speech-to-text guide: https://developers.openai.com/api/docs/guides/speech-to-text
- OpenAI transcription API reference: https://developers.openai.com/api/docs/api-reference/audio/createTranscription
- OpenAI `gpt-4o-transcribe` model page: https://developers.openai.com/api/docs/models/gpt-4o-transcribe
