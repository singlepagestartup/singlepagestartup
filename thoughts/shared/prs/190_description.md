# PR Description Template

## Summary

Implements Telegram voice-note ingestion for issue #189. Voice messages now create one traceable `social.message`, persist converted transcription-ready audio, transcribe through the shared OpenAI wrapper, update the same message with transcript text, and trigger normal agent/OpenRouter routing only after successful transcription.

## Changes

- Added `OpenAI.transcribeAudio(...)` in `@sps/shared-third-parties`, with `OPEN_AI_TRANSCRIPTION_MODEL` support and default `gpt-4o-transcribe`.
- Added shared Telegram voice transcription constants in `@sps/shared-utils`.
- Added Telegram voice extraction and processing in `apps/telegram`: download, WebM conversion via `ffmpeg`, 25 MB size guard, processing/completed/failed metadata, duplicate skip, and RBAC create/update orchestration.
- Added RBAC message update action classification so completed voice transcripts emit `telegram_voice_transcription_completed` instead of generic `update`.
- Updated agent Telegram action routing to reuse normal message reply dispatch for completed voice transcripts while keeping generic edits on notification update behavior.
- Documented OpenAI and `ffmpeg` runtime requirements, deployment env propagation, and voice transcription metadata states.

## Verification

- [x] `npx nx run @sps/shared-third-parties:jest:test --testFile=libs/shared/third-parties/src/lib/open-ai/index.spec.ts`
- [x] `npx nx run telegram:jest:test --testFile=apps/telegram/src/lib/telegram-voice-message.spec.ts`
- [x] `npx nx run @sps/agent:jest:test --testFile=libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.spec.ts`
- [x] `npx nx run @sps/agent:jest:test --testFile=libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/open-router-reply.spec.ts`
- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run telegram:build`
- [x] `npx nx run @sps/shared-utils:tsc:build`
- [x] `npx nx run @sps/shared-third-parties:tsc:build`
- [x] `npx nx run @sps/agent:tsc:build`
- [ ] Manual Telegram/OpenAI verification: send a private voice note, confirm one message/file attachment/transcript/metadata/bot reply, replay duplicate update, and simulate failure metadata.

## Notes

- Deployed Telegram containers now need `ffmpeg`; the root Dockerfile installs it.
- `OPEN_AI_API_KEY` is required for voice transcription. `OPEN_AI_TRANSCRIPTION_MODEL` is optional.
- No database schema migration is required; transcription state uses `social.message.metadata`.
