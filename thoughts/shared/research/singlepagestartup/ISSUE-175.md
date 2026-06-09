---
date: 2026-05-03T23:49:29+0300
researcher: flakecode
git_commit: c453678c307426ae7107cd7b9a97fe767149a6de
branch: debug
repository: singlepagestartup
topic: "[log-watch] [LW-fe596862c7a7] api_api Validation error. 'props.<id>.description' is empty."
tags: [research, codebase, agent, telegram, social, rbac, openrouter, doctorgpt-production]
status: complete
last_updated: 2026-05-03
last_updated_by: flakecode
---

# Research: Issue #175 - Telegram OpenRouter empty social message description

**Date**: 2026-05-03T23:49:29+0300
**Researcher**: flakecode
**Git Commit**: c453678c307426ae7107cd7b9a97fe767149a6de
**Branch**: debug
**Repository**: singlepagestartup

## Research Question

Issue #175 is a copied production log-watch report for repeated `400` responses from `POST /api/agent/agents/telegram-bot` with message `Validation error. 'props.socialModuleMessage.description' is empty.` The local workspace is currently configured against the restored production-like database `doctorgpt-production`, so the research includes SELECT-only observations from that database alongside codebase analysis.

## Summary

The logged `telegram-bot` stack frame is the outer agent handler wrapper. The exact validation string is thrown inside `Service.openRouterReplyMessageCreate` before it resolves the social thread or calls the RBAC OpenRouter reaction route. The path is: action logger forwards a successful RBAC social message-create action to `POST /api/agent/agents/telegram-bot`; the agent handler loads the created `social.message`; the chat contains automatic profiles `telegram-bot` and `open-router`; the `open-router` profile branch receives the message and rejects it when `socialModuleMessage.description` is empty.

The current Telegram adapter can create such messages. It derives `description` from `message.text || message.caption || ""`, attaches files for photo/document/video/audio updates, and ingests the data through the RBAC thread-aware message-create SDK. The RBAC message-create handler persists `parsedBody.data` directly into `sl_message`, then creates chat, thread, and profile relations; neither layer requires a non-empty description.

In the restored local `doctorgpt-production` database, `sl_message` contains 45,474 rows, with 695 rows where `description` is null or blank. 598 distinct empty-description messages have attached files, and 694 empty-description messages are authored by Telegram profiles. Recent empty rows are linked to chats that contain both automatic profiles (`open-router` and `telegram-bot`), which is the local data shape needed for the logged agent path.

No mutating reproduction POST was executed during research because calling `POST /api/agent/agents/telegram-bot` for an existing empty message would create an agent error reply in the restored production-copy database before rethrowing the validation error. The local API was confirmed running (`GET /api/agent/agents/count` returned `{"data":3}`), and the API env points to `DATABASE_NAME=doctorgpt-production` on local Postgres.

## Detailed Findings

### Agent Telegram Entry Point

- The API app installs `ActionLoggerMiddleware` before module routing and mounts `/api/agent` in `apps/api/app.ts:157` and `apps/api/app.ts:172`.
- The action logger watches RBAC social action routes, legacy message routes, and thread-aware message routes in `libs/middlewares/src/lib/actions-logger/index.ts:26`.
- For successful logged requests, the action logger creates an `rbac.action`, links it to the subject, and calls `agentModuleAgentApi.telegramBot` with `rbacModuleAction` in `libs/middlewares/src/lib/actions-logger/index.ts:133` and `libs/middlewares/src/lib/actions-logger/index.ts:164`.
- The agent controller registers `POST /telegram-bot` in `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/index.ts:85`.
- The Telegram bot handler parses multipart `data`, calls `onAction` and `onMessage`, and rethrows normalized errors from the catch block in `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:40` and `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:69`.
- `onMessage` matches both `/messages` and `/threads/:threadId/messages` action routes, loads the created social message by `payload.result.data.id`, loads chat/profile/message relations, filters automatic profiles, and calls `agentSocialModuleProfileHandler` in `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:336`, `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:353`, and `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:502`.

### OpenRouter Branch And Exact Validation

- `agentSocialModuleProfileHandler` resolves the automatic profile's RBAC subject relation, signs a JWT, and branches by automatic profile slug in `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:261` and `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:306`.
- For `open-router`, command messages are skipped; non-command messages resolve the message-origin subject and call `openRouterReplyMessageCreate` in `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:340` and `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:371`.
- `openRouterReplyMessageCreate` throws the logged validation message when `!props.socialModuleMessage.description` in `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1690`.
- The catch block then writes an OpenRouter error reply into the resolved thread when possible, or into the chat fallback path otherwise, before rethrowing non-recoverable errors in `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1925` and `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1973`.
- The downstream RBAC OpenRouter handler also has its own missing-description guard, but that route is reached only after the agent-side `openRouterReplyMessageCreate` guard passes (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:617`).

### Telegram Adapter Message Shape

- `apps/telegram` is documented as the transport adapter, while domain command/agent behavior belongs to modules such as `agent`, `rbac`, and `social` (`apps/telegram/README.md`).
- The Telegram app's message handler ignores forum-topic service messages, buffers media groups, and sends normal messages to `handleIncomingMessage` in `apps/telegram/src/lib/telegram-bot.ts:374` and `apps/telegram/src/lib/telegram-bot.ts:434`.
- `buildTelegramMessageData` sets `description` from `message?.text || message?.caption || ""` and sets `sourceSystemId` from the Telegram `message_id` in `apps/telegram/src/lib/telegram-bot.ts:611`.
- For photo/document/video/audio messages, the adapter builds `files` from Telegram attachments while preserving the same `description` value in `apps/telegram/src/lib/telegram-bot.ts:626` and `apps/telegram/src/lib/telegram-bot.ts:674`.
- Media groups use the first message with `caption` or `text`; if none exists, they also produce `description: ""` with files in `apps/telegram/src/lib/telegram-bot.ts:686` and `apps/telegram/src/lib/telegram-bot.ts:694`.
- `handleIncomingMessage` strips a bot mention, then creates a thread-aware RBAC social message in private chats and mentioned group messages in `apps/telegram/src/lib/telegram-bot.ts:858`, `apps/telegram/src/lib/telegram-bot.ts:868`, and `apps/telegram/src/lib/telegram-bot.ts:886`.

### RBAC Social Message Create Persistence

- The RBAC message-create handler parses multipart `data`, resolves the target thread, and deduplicates by `sourceSystemId` within chat/thread in `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:59`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:86`, and `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:105`.
- The handler passes `parsedBody.data` directly to `socialModuleMessageApi.create`, then creates `chats-to-messages`, `threads-to-messages`, and `profiles-to-messages` rows in `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:127`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:136`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:148`, and `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:263`.
- The social message DB field `description` is nullable text, while `sourceSystemId`, `interaction`, and `metadata` are stored alongside it in `libs/modules/social/models/message/backend/repository/database/src/lib/fields/singlepage.ts:11`.
- The social message README describes `description` as message body text and `sourceSystemId` as an external source id (`libs/modules/social/models/message/README.md`).

### Restored Database Observations

- Docker Postgres is running locally, and `apps/api/.env` points the API at `DATABASE_NAME=doctorgpt-production` on port `5433`. A direct SQL check returned `current_database = doctorgpt-production`.
- `GET http://localhost:4000/api/agent/agents/count` returned `{"data":3}`, confirming the local API process is responding while connected to the current workspace.
- `sl_message` has `total = 45474` and `empty_description = 695` rows where `description is null or btrim(description) = ''`.
- 598 distinct empty-description messages are linked to rows in `sl_ms_to_fe_se_me_fs_3v0`, and 97 empty-description messages have no file relation.
- 694 empty-description messages are linked to Telegram-authored profiles through `sl_ps_to_ms_b03` and `sl_profile`.
- Recent empty-description examples include message IDs `c62dbcfb-e59e-46fe-a2bd-e6ae668ca751`, `0cbab9d9-8aed-410d-a5d8-ecdb6a821b3d`, and `6d1d6267-19a3-423b-b03a-93da6d53a3f1`, each linked to a Telegram profile, chat, and thread.
- The automatic social profiles exist in the restored DB: `open-router` has variant `artificial-intelligence` and subject `22ed7256-9d56-41b2-ad08-320b348332ad`; `telegram-bot` has variant `agent` and subject `ef9f1234-f246-48c8-8053-345452e07dff`.
- `open-router` is linked to 4008 chats and `telegram-bot` to 3853 chats. Recent empty-description messages in the restored DB are linked to chats with both automatic profiles present, so `onMessage` can select both profiles as automatic reply targets.
- The current `rc_action` table has 193 rows, all message/action-route shaped, but no retained action rows directly reference the latest empty-description message IDs inspected during research. The production log samples also did not include request IDs or UUIDs.

## Code References

- `apps/api/app.ts:157` - action logger middleware installation.
- `apps/api/app.ts:172` - agent module mounted at `/api/agent`.
- `libs/middlewares/src/lib/actions-logger/index.ts:26` - logged social action/message route patterns.
- `libs/middlewares/src/lib/actions-logger/index.ts:133` - `rbac.action` creation after successful logged request.
- `libs/middlewares/src/lib/actions-logger/index.ts:164` - action logger calls the agent `telegramBot` SDK.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/index.ts:85` - `POST /telegram-bot` route binding.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:40` - multipart payload parsing and `onAction`/`onMessage` dispatch.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:69` - outer error normalization matching the production stack frame.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:336` - thread-aware and legacy message route matching.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:502` - automatic profile handler call for message actions.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:340` - `open-router` automatic profile branch.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1690` - exact empty-description validation throw.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1925` - catch block writes OpenRouter error reply when a thread id is known.
- `apps/telegram/src/lib/telegram-bot.ts:619` - Telegram description source is text, caption, or empty string.
- `apps/telegram/src/lib/telegram-bot.ts:674` - attachment messages keep the same description and add files.
- `apps/telegram/src/lib/telegram-bot.ts:858` - mention sanitization before RBAC message create.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:127` - social message create receives `parsedBody.data`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:263` - profile-to-message relation is created before response.
- `libs/modules/social/models/message/backend/repository/database/src/lib/fields/singlepage.ts:11` - nullable `description` column.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:622` - downstream OpenRouter route also validates missing description.

## Architecture Documentation

The current behavior spans the expected SPS module boundaries:

- `apps/telegram` is a transport adapter that turns Telegram updates into RBAC subject-scoped social message writes.
- `rbac.subject` owns subject-scoped social message creation and relation persistence.
- `social` stores message content, chat/profile/thread relations, and file links.
- `ActionLoggerMiddleware` observes successful RBAC social writes and forwards action context to the agent module.
- `agent` owns automatic profile handling, Telegram bot command interpretation, and OpenRouter reply orchestration.
- `notification` appears adjacent in the production log samples because social message creation can notify other subjects, but the exact empty-description validation is in the agent OpenRouter branch, not in notification send.

## Historical Context (from thoughts/)

- `thoughts/shared/tickets/singlepagestartup/ISSUE-175.md` is the direct copied production ticket for fingerprint `LW-fe596862c7a7` and records the `telegram/bot.ts:72` stack frame.
- `thoughts/shared/research/singlepagestartup/ISSUE-173.md` documents the same `POST /api/agent/agents/telegram-bot` action-processing surface and the restored `doctorgpt-production` database setup for another production log-watch issue.
- `thoughts/shared/research/singlepagestartup/ISSUE-174.md` confirms the local copied-production research pattern: API env points at `doctorgpt-production`, and notification errors often appear adjacent to Telegram/RBAC errors in log windows.
- `thoughts/shared/research/singlepagestartup/ISSUE-158.md` documents the OpenRouter route shape, thread continuity rules, and billing context around the same OpenRouter reaction path.
- `thoughts/shared/processes/singlepagestartup/ISSUE-175.md` records that create-phase setup preserved the production log context and that the current local DB dump is expected to be used as reproduction context.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-173.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-174.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-158.md`

## Open Questions

- The issue #175 production log samples do not include request IDs or UUIDs, so the exact original `social.message` row was not identified from logs alone.
- Direct `POST /api/agent/agents/telegram-bot` reproduction was not executed during research because the current catch path writes an OpenRouter error message to the restored production-copy database before rethrowing the validation error.
