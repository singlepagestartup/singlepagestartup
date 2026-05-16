---
date: 2026-05-16T01:55:24+0300
researcher: flakecode
git_commit: 491cb9ed33aaa98bf76db0a8850754c6b5df98e9
branch: main
repository: singlepagestartup
topic: "Telegram bot voice messages to social.message transcription"
tags: [research, codebase, telegram, social, rbac, agent, file-storage, openai]
status: complete
last_updated: 2026-05-16
last_updated_by: flakecode
---

# Research: Telegram bot voice messages to social.message transcription

**Date**: 2026-05-16T01:55:24+0300
**Researcher**: flakecode
**Git Commit**: 491cb9ed33aaa98bf76db0a8850754c6b5df98e9
**Branch**: main
**Repository**: singlepagestartup

## Research Question

Issue #189 asks how the current SPS Telegram ingestion path handles messages and attachments, where voice-note transcription would connect to `social.message`, `file-storage`, OpenAI transcription, and downstream agent/OpenRouter handling, and which existing code paths preserve idempotency and traceability.

## Summary

The live Telegram adapter handles all normal `message` updates through `apps/telegram/src/lib/telegram-bot.ts`. It extracts `description` from text/caption, sets `sourceSystemId` from the Telegram `message_id`, collects photo/document/video/audio attachments, downloads Telegram files through `ctx.api.getFile(...)`, wraps them as `File[]` through `blobifyFiles(...)`, and creates a thread-scoped RBAC social message. `message.voice` is not currently included in either single-message attachment extraction or media-group extraction.

The RBAC subject message-create handler is the central persistence path. It parses multipart `data` plus `files`, resolves the target thread, deduplicates by `sourceSystemId` inside the target chat/thread, creates `social.message`, links it to chat/thread/profile, stores files through `file-storage`, and creates `social.messages-to-file-storage-module-files` rows. The message schema already has nullable `description`, `sourceSystemId`, `interaction`, and `metadata` fields.

Downstream agent/OpenRouter behavior is not invoked directly by the Telegram app. The API-wide action logger observes successful RBAC message `POST` requests and forwards an `rbac.action` to `POST /api/agent/agents/telegram-bot`; that agent handler loads the created message and calls automatic social profiles such as `open-router`. In the current code, message `PATCH` creates a social action with payload type `update`; the agent action path treats that as a notification edit path, not as the same `onMessage` path used by message creation.

The shared OpenAI wrapper currently only exposes `generateText(...)` around `client.responses.create(...)`. It uses `OPEN_AI_API_KEY`, exports as `OpenAI` from `@sps/shared-third-parties`, and has no transcription method or `OPEN_AI_TRANSCRIPTION_MODEL` env. The repository has the `openai` package but no current `ffmpeg`, `fluent-ffmpeg`, `opus`, or transcription-specific dependency in `package.json`.

Official OpenAI speech-to-text documentation referenced by the ticket currently lists `gpt-4o-mini-transcribe`, `gpt-4o-transcribe`, and `gpt-4o-transcribe-diarize`, a 25 MB file-upload limit, and guide-supported upload types `mp3`, `mp4`, `mpeg`, `mpga`, `m4a`, `wav`, and `webm`. The `gpt-4o-transcribe` model page identifies it as a GPT-4o speech-to-text model for `v1/audio/transcriptions`.

## Detailed Findings

### Telegram adapter

- `apps/telegram` is documented as a thin transport adapter that parses Telegram updates and forwards authenticated facts into SPS modules; domain behavior belongs to `rbac`, `social`, `agent`, `billing`, and `notification` (`apps/telegram/README.md:3`, `apps/telegram/README.md:7`, `apps/telegram/README.md:61`).
- The grammY message handler ignores Telegram forum-topic service messages, buffers media groups, and sends ordinary non-media-group messages to `handleIncomingMessage` with data from `buildTelegramMessageData(...)` (`apps/telegram/src/lib/telegram-bot.ts:374`, `apps/telegram/src/lib/telegram-bot.ts:400`, `apps/telegram/src/lib/telegram-bot.ts:408`, `apps/telegram/src/lib/telegram-bot.ts:434`).
- `rbacModuleSubjectWithSocialModuleProfileAndChatFindOrCreate(...)` passes `fromId`, `chatId`, optional text/caption, message thread id, and topic flag to `rbacModuleSubjectApi.telegramBootstrap(...)` (`apps/telegram/src/lib/telegram-bot.ts:477`, `apps/telegram/src/lib/telegram-bot.ts:502`, `apps/telegram/src/lib/telegram-bot.ts:512`).
- `buildTelegramMessageData(...)` sets `description` from `message?.text || message?.caption || ""` and `sourceSystemId` from `message.message_id` (`apps/telegram/src/lib/telegram-bot.ts:618`).
- Single-message attachment extraction currently handles `photo`, `document`, `video`, and `audio`; no branch reads `message.voice` (`apps/telegram/src/lib/telegram-bot.ts:628`, `apps/telegram/src/lib/telegram-bot.ts:637`, `apps/telegram/src/lib/telegram-bot.ts:648`, `apps/telegram/src/lib/telegram-bot.ts:659`).
- Media-group extraction uses the first caption/text for description, uses media group id as `sourceSystemId` when present, and delegates attachment extraction to `extractTelegramAttachments(...)` (`apps/telegram/src/lib/telegram-bot.ts:686`, `apps/telegram/src/lib/telegram-bot.ts:694`, `apps/telegram/src/lib/telegram-bot.ts:700`, `apps/telegram/src/lib/telegram-bot.ts:705`).
- `extractTelegramAttachments(...)` has the same photo/document/video/audio branches and no voice branch (`apps/telegram/src/lib/telegram-bot.ts:725`, `apps/telegram/src/lib/telegram-bot.ts:730`, `apps/telegram/src/lib/telegram-bot.ts:739`, `apps/telegram/src/lib/telegram-bot.ts:750`, `apps/telegram/src/lib/telegram-bot.ts:761`).
- `buildTelegramFiles(...)` deduplicates by Telegram `fileId`, calls `ctx.api.getFile(...)`, constructs a Telegram file download URL, then calls `blobifyFiles(...)` to return `File[]` (`apps/telegram/src/lib/telegram-bot.ts:775`, `apps/telegram/src/lib/telegram-bot.ts:785`, `apps/telegram/src/lib/telegram-bot.ts:789`, `apps/telegram/src/lib/telegram-bot.ts:792`, `apps/telegram/src/lib/telegram-bot.ts:806`).
- `handleIncomingMessage(...)` signs the Telegram subject JWT and sends private-chat messages, or group messages that start with the bot username in `message.text`, through the thread-scoped RBAC message create SDK (`apps/telegram/src/lib/telegram-bot.ts:847`, `apps/telegram/src/lib/telegram-bot.ts:856`, `apps/telegram/src/lib/telegram-bot.ts:863`, `apps/telegram/src/lib/telegram-bot.ts:868`, `apps/telegram/src/lib/telegram-bot.ts:885`).

### Telegram bootstrap and threads

- The Telegram bootstrap controller accepts `fromId`, `chatId`, `messageText`, `messageThreadId`, and `isTopicMessage`, stringifies numeric identifiers, and calls the service bootstrap (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/telegram/bootstrap.ts:23`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/telegram/bootstrap.ts:53`).
- The bootstrap service resolves or creates Telegram identity/subject/profile records from `fromId` and provider `telegram` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:1169`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:1184`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:1247`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:1271`).
- It resolves or creates a Telegram chat with `variant: "telegram"` and `sourceSystemId: props.chatId` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:1547`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:1564`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:1597`).
- It links automatic `agent` and `artificial-intelligence` profiles into the chat when they are not already linked (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:1621`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:1636`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:1653`).
- `resolveThreadForTelegramMessage(...)` returns a default thread when no Telegram `messageThreadId` is present; otherwise it looks up or creates a `variant: "telegram"` thread with `sourceSystemId` equal to that Telegram thread id (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:909`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:916`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:918`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:946`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:988`).

### Message persistence and file attachment

- The subject routes expose legacy chat message create and thread-scoped message create, both wired to the same message-create handler; the message update route remains chat-scoped by message id (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:386`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:399`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:407`).
- The thread-scoped server SDK builds multipart form data with `prepareFormDataToSend(...)` and posts to `/threads/:socialModuleThreadId/messages` (`libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/thread/find-by-id/message/create.ts:23`, `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/thread/find-by-id/message/create.ts:42`, `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/thread/find-by-id/message/create.ts:58`).
- `prepareFormDataToSend(...)` removes `File` and `File[]` values from the JSON `data` part, appends the JSON body as `"data"`, then appends file fields under their original key (`libs/shared/utils/src/lib/preapare-form-data-to-send.ts:6`, `libs/shared/utils/src/lib/preapare-form-data-to-send.ts:9`, `libs/shared/utils/src/lib/preapare-form-data-to-send.ts:19`, `libs/shared/utils/src/lib/preapare-form-data-to-send.ts:21`).
- The RBAC message-create handler parses `body["data"]`, resolves the target thread id, deletes `threadId` from payload data, and deduplicates on `sourceSystemId` scoped by chat and thread (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:59`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:86`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:96`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:100`).
- Duplicate detection finds messages by `sourceSystemId`, intersects with `chats-to-messages`, then intersects with `threads-to-messages` before returning an existing message (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:550`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:575`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:607`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:637`).
- On non-duplicate creation, the handler creates `social.message`, then `chats-to-messages`, `threads-to-messages`, file records, `messages-to-file-storage-module-files`, and `profiles-to-messages` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:127`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:136`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:148`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:160`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:177`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:263`).
- File records are created through `fileStorageModuleFileApi.create(...)` with `adminTitle` set to the social message id and `file` set to the uploaded `File` object (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:165`).
- The file-storage create controller determines file type from bytes, records size/extension/mime/dimensions, uploads via the configured file-storage provider, and stores the returned URL in the model data (`libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/create/index.ts:79`, `libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/create/index.ts:89`, `libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/create/index.ts:92`, `libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/create/index.ts:106`, `libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/create/index.ts:111`, `libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/create/index.ts:117`).
- The default local file-storage provider writes the file under `public/<FILE_STORAGE_FOLDER>` and returns a URL under that folder; `FILE_STORAGE_PROVIDER` defaults to `local` and `FILE_STORAGE_FOLDER` defaults to `file-storage/static` (`libs/providers/file-storage/src/lib/local/index.ts:11`, `libs/providers/file-storage/src/lib/local/index.ts:37`, `libs/providers/file-storage/src/lib/local/index.ts:50`, `libs/shared/utils/src/lib/envs/file-storage.ts:1`, `libs/shared/utils/src/lib/envs/file-storage.ts:16`).
- `social.message` has nullable `description`, nullable `sourceSystemId`, default JSON `interaction`, and default JSON `metadata` fields (`libs/modules/social/models/message/backend/repository/database/src/lib/fields/singlepage.ts:11`, `libs/modules/social/models/message/backend/repository/database/src/lib/fields/singlepage.ts:12`, `libs/modules/social/models/message/backend/repository/database/src/lib/fields/singlepage.ts:13`, `libs/modules/social/models/message/backend/repository/database/src/lib/fields/singlepage.ts:17`).
- The Drizzle/Zod layer extends insert and select schemas so `interaction` and `metadata` default to records (`libs/modules/social/models/message/backend/repository/database/src/lib/index.ts:6`).

### Message update and action side effects

- The message update SDK sends multipart `PATCH` to the chat-scoped message update endpoint (`libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/update.ts:23`, `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/update.ts:42`, `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/update.ts:58`).
- The update handler updates `social.message`, can attach files through the same file-storage and relation APIs, then creates a social action with payload `{ type: "update", message }` through `socialModuleProfileFindByIdChatFindByIdActionCreate(...)` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/update.ts:52`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/update.ts:86`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/update.ts:100`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/update.ts:171`).
- The action-create handler creates `social.action`, links it to chat, optionally resolves/links it to a thread from explicit thread id or payload message id, and best-effort links it to profile (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/action/create.ts:143`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/action/create.ts:155`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/action/create.ts:173`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/action/create.ts:182`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/action/create.ts:194`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/action/create.ts:208`).

### Downstream agent and OpenRouter path

- `apps/api/app.ts` installs `ActionLoggerMiddleware` before mounting `/api/agent` and `/api/rbac` (`apps/api/app.ts:157`, `apps/api/app.ts:172`, `apps/api/app.ts:174`).
- The action logger observes successful RBAC subject social action routes, legacy message routes, and thread-aware message routes; message logging only covers `POST` (`libs/middlewares/src/lib/actions-logger/index.ts:26`, `libs/middlewares/src/lib/actions-logger/index.ts:32`, `libs/middlewares/src/lib/actions-logger/index.ts:37`).
- For successful logged non-GET requests with a subject JWT, it creates `rbac.action`, links it to the subject, and calls `agentModuleAgentApi.telegramBot(...)` with the created action (`libs/middlewares/src/lib/actions-logger/index.ts:84`, `libs/middlewares/src/lib/actions-logger/index.ts:128`, `libs/middlewares/src/lib/actions-logger/index.ts:133`, `libs/middlewares/src/lib/actions-logger/index.ts:152`, `libs/middlewares/src/lib/actions-logger/index.ts:164`).
- The agent module exposes `POST /telegram-bot`; the handler parses action payload data and calls both `onAction(...)` and `onMessage(...)` (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/index.ts:85`, `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:40`, `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:63`).
- `onMessage(...)` matches both legacy and thread-aware message-create routes, requires method `POST`, loads the created social message, resolves chat/profile/message relations, ignores messages authored by automatic profiles, and calls automatic `artificial-intelligence` or `agent` profiles (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:336`, `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:347`, `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:353`, `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:471`, `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:482`, `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:502`).
- `onAction(...)` handles actions route logs. For payload type `update`, it calls `notificationMessageUpdate(...)` and returns, so that path does not call `agentSocialModuleProfileHandler(...)` (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:76`, `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:183`, `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:192`, `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:197`).
- In `agentSocialModuleProfileHandler(...)`, the `open-router` branch skips Telegram bot commands and returns before OpenRouter generation when `socialModuleMessage.description?.trim()` is empty (`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:348`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:350`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:360`).
- `openRouterReplyMessageCreate(...)` repeats the empty-description guard, resolves the triggering message thread, checks subscription/payable role context, signs a JWT for the sender subject, and calls the RBAC `react-by/openrouter` route (`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1702`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1706`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1721`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1851`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1861`).
- The RBAC OpenRouter route is registered at `/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/messages/:socialModuleMessageId/react-by/openrouter` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:431`).

### OpenAI and audio dependencies

- The shared OpenAI wrapper lives at `libs/shared/third-parties/src/lib/open-ai/index.ts`, constructs an `OpenAI` SDK client from `OPEN_AI_API_KEY`, and currently exposes only `generateText(...)` over `client.responses.create(...)` (`libs/shared/third-parties/src/lib/open-ai/index.ts:1`, `libs/shared/third-parties/src/lib/open-ai/index.ts:5`, `libs/shared/third-parties/src/lib/open-ai/index.ts:8`, `libs/shared/third-parties/src/lib/open-ai/index.ts:17`).
- `@sps/shared-third-parties` exports that wrapper as `OpenAI` (`libs/shared/third-parties/src/lib/index.ts:3`).
- The only OpenAI env in shared artificial-intelligence envs is `OPEN_AI_API_KEY`; no `OPEN_AI_TRANSCRIPTION_MODEL` env is defined in current shared utils (`libs/shared/utils/src/lib/envs/artificial-intelligence.ts:3`).
- `package.json` includes `openai` `^5.23.2`, but searches found no current transcription wrapper usage and no `ffmpeg`, `fluent-ffmpeg`, `opus`, `ogg`, or `webm` conversion dependency in the root dependency list (`package.json:131`).
- The official OpenAI speech-to-text guide says file uploads are limited to 25 MB and lists guide-supported input file types as `mp3`, `mp4`, `mpeg`, `mpga`, `m4a`, `wav`, and `webm`; it also names `gpt-4o-transcribe` and `gpt-4o-mini-transcribe` as transcription models with `json` or plain-text outputs ([OpenAI speech-to-text guide](https://developers.openai.com/api/docs/guides/speech-to-text)).
- The official `gpt-4o-transcribe` model page describes it as a GPT-4o speech-to-text model and lists `v1/audio/transcriptions` as a supported endpoint ([OpenAI gpt-4o-transcribe model page](https://developers.openai.com/api/docs/models/gpt-4o-transcribe)).

## Code References

- `apps/telegram/src/lib/telegram-bot.ts:619` - Telegram description source is text, caption, or empty string.
- `apps/telegram/src/lib/telegram-bot.ts:659` - existing single-message `audio` attachment branch; no adjacent `voice` branch exists.
- `apps/telegram/src/lib/telegram-bot.ts:761` - existing media-group `audio` attachment branch; no adjacent `voice` branch exists.
- `apps/telegram/src/lib/telegram-bot.ts:789` - Telegram file candidates become `File[]` through `blobifyFiles(...)`.
- `apps/telegram/src/lib/telegram-bot.ts:868` - private chats use thread-scoped RBAC message creation.
- `libs/shared/backend/utils/src/lib/blobify-files/index.ts:10` - helper fetches remote attachment URL and returns a `File`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:100` - create handler reads `sourceSystemId` before dedupe.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:127` - social message creation receives parsed payload data.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:160` - uploaded `files` are processed for the message.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:177` - message/file relation is created.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/update.ts:171` - message update creates a social action payload with `type: "update"`.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:336` - agent `onMessage` matches message-create routes.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:183` - agent `onAction` handles update actions separately.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:360` - `open-router` automatic profile skips empty message descriptions.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1861` - agent calls RBAC OpenRouter reaction route.
- `libs/shared/third-parties/src/lib/open-ai/index.ts:17` - current OpenAI wrapper method is text generation only.
- `libs/modules/social/models/message/backend/repository/database/src/lib/fields/singlepage.ts:17` - `social.message.metadata` exists as JSONB defaulting to `{}`.
- `libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/create/index.ts:111` - file-storage upload provider persists the file and returns URL metadata.

## Architecture Documentation

Current boundaries match the module docs:

- `apps/telegram` owns Telegram transport parsing, file download details, topic metadata, and forwarding data into RBAC.
- `rbac.subject` owns Telegram bootstrap, subject/profile/chat/thread resolution, authenticated message creation/update, and subject-scoped SDK routes.
- `social` owns message, chat, thread, action, profile, and relation records including `messages-to-file-storage-module-files`.
- `file-storage` owns actual uploaded file metadata and file provider persistence.
- `agent` owns automatic profile behavior, Telegram bot command handling, and OpenRouter reply orchestration.
- `libs/shared/third-parties/src/lib/open-ai` is the existing OpenAI wrapper location that already centralizes the `OPEN_AI_API_KEY` client.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-175.md` documented that Telegram attachment-only messages can create blank `social.message.description` values, and that current agent/OpenRouter code now skips empty incoming prompts before OpenRouter generation.
- `thoughts/shared/research/singlepagestartup/ISSUE-164.md` documented the thread-aware subject chat surface: thread-scoped message create/find, chat-scoped message update/delete, action find/create, and attachment rendering through `messages-to-file-storage-module-files`.
- `thoughts/shared/research/singlepagestartup/ISSUE-183.md` documented the current OpenRouter reaction path and terminal error behavior after earlier Telegram/OpenRouter failure work.
- `thoughts/shared/plans/singlepagestartup/ISSUE-175.md` planned the current empty-description no-op behavior in the agent `open-router` branch, which is visible in the current code.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-154.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-158.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-164.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-175.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-183.md`

## Open Questions

- The current codebase does not contain a voice-message fixture or Telegram voice payload test, so the exact grammY runtime shape for `message.voice` is not represented locally.
- The current shared OpenAI wrapper has no transcription method, so there is no existing local API contract for transcription response shape, model override naming, or failure metadata.
- The current repository has no local conversion dependency, so conversion behavior is not represented in existing code.
- The official OpenAI guide page and model page were checked during research; no local project artifact currently records an upload-format contract for transcription.
