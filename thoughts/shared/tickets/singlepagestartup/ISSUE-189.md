# Issue: Telegram bot: transcribe voice messages into social.message text

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/189
**Status**: Research Needed
**Created**: 2026-05-16
**Priority**: medium
**Size**: large
**Type**: feature

---

## Problem to Solve

Telegram voice messages are currently not ingested as usable SPS chat messages. `apps/telegram/src/lib/telegram-bot.ts` handles text/caption plus photo/document/video/audio attachments, but does not extract `message.voice`.

When a Telegram user sends a voice message, SPS must create a user `social.message`, persist the audio in `file-storage`, transcribe the audio through OpenAI, save the transcript into the message text, and then let the message behave like a normal text message for downstream agent/OpenRouter handling.

## Key Details

- Telegram voice notes arrive as `message.voice`, usually OGG/Opus, and must be converted before OpenAI transcription.
- OpenAI Speech-to-text docs currently list supported upload formats as `mp3`, `mp4`, `mpeg`, `mpga`, `m4a`, `wav`, and `webm`, with a 25 MB upload limit: https://platform.openai.com/docs/guides/speech-to-text
- Use the existing `OPEN_AI_API_KEY` and extend the shared OpenAI wrapper instead of creating ad-hoc OpenAI client code inside the Telegram adapter.
- Preferred transcription model default: `gpt-4o-transcribe`; allow override through an env such as `OPEN_AI_TRANSCRIPTION_MODEL`.
- Preserve the existing Telegram adapter boundary: Telegram-specific parsing/download/conversion can stay in `apps/telegram`, reusable OpenAI transcription should live under `libs/shared/third-parties/src/lib/open-ai`.
- Store the converted transcription-ready audio file in `file-storage` and link it through `social.messages-to-file-storage-module-files`.
- Create an empty/processing `social.message` first, attach the converted audio, then update `description` with the transcript.
- After transcription completes, trigger the same downstream agent flow as a normal text message so voice messages can receive normal bot/AI handling.
- Do not edit repository data snapshots under module `backend/repository/database/src/lib/data/*`.

## Implementation Notes

- Extend Telegram message parsing to include `message.voice.file_id`, `file_unique_id`, duration, and mime metadata.
- Download voice audio with `ctx.api.getFile(...)`, convert OGG/Opus to an OpenAI-supported format, preferably `webm` or `mp3`.
- Save voice transcription state in `social.message.metadata`, e.g. processing/completed/failed, so empty messages do not accidentally look complete.
- Update the existing RBAC/social message flow instead of writing directly to social/file-storage repositories.
- Ensure the post-transcription update does not leave downstream agents silent; explicitly handle the current gap where message `PATCH` only emits update actions and does not currently invoke the same agent path as message `POST`.

## Acceptance Criteria

- Sending a Telegram voice message creates exactly one SPS `social.message` for the sender in the correct chat/thread.
- The converted audio file is saved in `file-storage` and attached to that message.
- The message `description` is updated with the OpenAI transcript.
- The completed voice message is processed by downstream agent/OpenRouter behavior like a normal text message.
- Duplicate Telegram updates with the same `sourceSystemId` remain idempotent.
- Failures in conversion/transcription leave the message and file attachment traceable with failure metadata and do not crash the bot process.

## Test Plan

- Add BDD-style tests for voice extraction/conversion orchestration around `apps/telegram/src/lib/telegram-bot.ts` or a small extracted helper.
- Add tests for OpenAI transcription wrapper behavior with mocked SDK calls.
- Add/extend agent/RBAC tests proving a transcribed voice message triggers the same downstream flow as normal text.
- Run targeted tests for changed modules plus `npm run telegram:build`.
