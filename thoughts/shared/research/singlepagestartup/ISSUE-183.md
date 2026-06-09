---
date: 2026-05-04T00:40:28+0300
researcher: flakecode
git_commit: d665c77702603f683b3b23fd2b33c571733a2c0d
branch: debug
repository: singlepagestartup
topic: "Telegram/OpenRouter behavior for No valid model response received"
tags: [research, codebase, telegram, openrouter, rbac, agent, social]
status: complete
last_updated: 2026-05-04
last_updated_by: flakecode
---

# Research: Telegram/OpenRouter behavior for No valid model response received

**Date**: 2026-05-04T00:40:28+0300  
**Researcher**: flakecode  
**Git Commit**: d665c77702603f683b3b23fd2b33c571733a2c0d  
**Branch**: debug  
**Repository**: singlepagestartup

## Research Question

Investigate issue #183 using the restored `doctorgpt-production` local database:

- whether a Telegram user receives a message when OpenRouter generation ends with `No valid model response received`, or whether the bot silently stops;
- what code path produces the failing OpenRouter generation behavior;
- what fallback behavior exists today, and when the current code throws or returns an error message.

## Summary

The production database state shows that the user did receive a Telegram-visible error message for the sampled failure. The sampled incoming message `10b234ba-b01a-4434-9e5c-b89ab247ba48` is present in chat `4f34a273-ca06-466b-a217-4303c82841de` and thread `8102286c-995b-4c34-9204-4a1be637285e`. In the same chat/thread, the OpenRouter profile created a progress message with Telegram source id `92529` and then an error message with Telegram source id `92530`. The error message text contains `No valid model response received...`, so this production incident was not silent from the chat user's point of view.

The current checkout no longer contains the production stack path `controller/startup/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`; `controller/startup/index.ts` only extends the singlepage controller. The live implementation is `controller/singlepage/.../react-by-openrouter.ts`.

In the current live code, the `react-by-openrouter` endpoint behaves differently from the production stack trace: when every selected generation model returns an error or invalid output, it settles billing, updates the existing status message with the OpenRouter error text, and returns `c.json(...)` instead of throwing `HTTPException`. The agent service also has an outer recoverable-error fallback for downstream OpenRouter errors, including `No valid model response received`; when that branch is reached, it posts an OpenRouter error message into the same thread and returns without rethrowing.

Current generation fallback is model-candidate fallback. Final generation loops through ordered candidate IDs and continues when `OpenRouter.generate(...)` returns an error or when `getGenerationValidationError(...)` says the result is not valid for the expected modality. There is no final-answer "repair/normalize generated result" step after a semantically bad final generation beyond validating text/image presence and trying the next model candidate.

## Detailed Findings

### Telegram Ingestion And Outbound Ownership

`apps/telegram` is a thin transport adapter. It receives Telegram `message` updates and forwards them into the RBAC subject thread-aware message-create route; domain behavior and OpenRouter replies are owned by the agent/RBAC/social/notification layers, not by the Telegram adapter (`apps/telegram/README.md:1`, `apps/telegram/src/lib/telegram-bot.ts:374`, `apps/telegram/src/lib/telegram-bot.ts:434`, `apps/telegram/src/lib/telegram-bot.ts:868`).

The Telegram adapter strips the bot mention for group messages, signs the Telegram subject JWT, and calls `socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate(...)` for private chats and mentioned group messages (`apps/telegram/src/lib/telegram-bot.ts:856`, `apps/telegram/src/lib/telegram-bot.ts:858`, `apps/telegram/src/lib/telegram-bot.ts:868`, `apps/telegram/src/lib/telegram-bot.ts:885`).

The message-create controller persists the social message, links it to chat/thread/profile, and then asynchronously calls `notifyOtherSubjectsInChat(...)` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:263`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:275`). That notify path calls `api.notify(...)`; if notification send returns a `sourceSystemId`, the social message is updated with that external message id (`create.ts:484`, `create.ts:521`, `create.ts:526`). The notification service's Telegram send path records the Telegram `message_id` as `sourceSystemId` after `bot.api.sendMessage(...)` (`libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:865`, `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:873`).

### Automatic OpenRouter Reply Path

The action logger records successful API writes and forwards the resulting RBAC action to the agent Telegram bot action endpoint (`libs/middlewares/src/lib/actions-logger/index.ts:131`, `libs/middlewares/src/lib/actions-logger/index.ts:164`).

The agent Telegram controller recognizes both legacy chat message routes and thread-aware message routes, loads the created `social.message`, finds automatic profiles in the chat, and calls `agentSocialModuleProfileHandler(...)` for profiles with variants `artificial-intelligence` or `agent` (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:334`, `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:482`, `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:502`).

For the `open-router` social profile, the agent service skips Telegram bot command messages and calls `openRouterReplyMessageCreate(...)` for normal user messages (`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:340`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:342`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:371`).

`openRouterReplyMessageCreate(...)` resolves the trigger message's thread, verifies subscription/payable-role state, signs a JWT for the sender subject, and calls the RBAC `react-by/openrouter` route via the generated subject SDK (`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1696`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1801`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1841`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1851`).

### Current `react-by-openrouter` Generation Fallback

The RBAC route is registered at `/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/messages/:socialModuleMessageId/react-by/openrouter` and is backed by `controller/singlepage/.../react-by-openrouter.ts` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:431`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:783`).

The handler creates a thread-scoped OpenRouter status message, updates it through model-fetching/classification/selection/generation phases, and prepares the final generation context from the resolved thread (`react-by-openrouter.ts:858`, `react-by-openrouter.ts:876`, `react-by-openrouter.ts:928`, `react-by-openrouter.ts:979`).

Before final generation, the handler classifies the request and adapts unsupported endpoint output modalities (`file`, `audio`) back to image or text (`react-by-openrouter.ts:911`, `react-by-openrouter.ts:918`, `react-by-openrouter.ts:2087`). Classification has a JSON parse/repair fallback: direct parse first, then a repair model call, and if all classifier/fallback models fail, heuristic classification is used (`react-by-openrouter.ts:1678`, `react-by-openrouter.ts:1962`, `react-by-openrouter.ts:1984`, `react-by-openrouter.ts:1840`).

Model selection also has a direct parse/repair fallback. If selector models fail or produce invalid JSON, selection falls back to default priority ordering (`react-by-openrouter.ts:1462`, `react-by-openrouter.ts:1530`, `react-by-openrouter.ts:1550`, `react-by-openrouter.ts:1573`, `react-by-openrouter.ts:1580`, `react-by-openrouter.ts:1628`).

Final generation loops over `modelSelection.orderedCandidateIds`. For each model, `generateWithBillingLedger(...)` calls OpenRouter. If the result has `error`, the handler records `model=<id>: generation error` and continues to the next candidate. If the result exists but does not match the expected modality, `getGenerationValidationError(...)` records the validation reason and continues to the next candidate (`react-by-openrouter.ts:1003`, `react-by-openrouter.ts:1023`, `react-by-openrouter.ts:1032`, `react-by-openrouter.ts:1043`, `react-by-openrouter.ts:1941`).

If no candidate produced a valid result, the current handler settles OpenRouter billing, updates the existing status message to `openRouterError` plus `No valid model response received. ...`, and returns JSON containing that updated message (`react-by-openrouter.ts:1065`, `react-by-openrouter.ts:1075`, `react-by-openrouter.ts:1078`, `react-by-openrouter.ts:1097`). This branch does not throw in the current checkout.

The lower-level OpenRouter wrapper has one retry mechanism for non-text content: when a request with non-text content returns an OpenRouter error and `stripNonTextOnRetry` is true, it retries once with non-text parts removed (`libs/shared/third-parties/src/lib/open-router/index.ts:537`, `libs/shared/third-parties/src/lib/open-router/index.ts:562`, `libs/shared/third-parties/src/lib/open-router/index.ts:568`). The final generation call explicitly passes `stripNonTextOnRetry: false`, so that lower-level non-text stripping retry is disabled for final answer generation (`react-by-openrouter.ts:1023`, `react-by-openrouter.ts:1029`).

### Agent-Level Error Message Fallback

The agent service marks `No valid model response received` as a recoverable OpenRouter reply error (`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:214`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:220`).

If the downstream RBAC OpenRouter route throws, the agent catch block first writes an OpenRouter error message into the resolved thread or chat (`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1925`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1933`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1947`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1953`). If `isRecoverableOpenRouterReplyError(...)` matches, it logs and returns without rethrowing (`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1968`).

That means there are two current user-facing protections:

- current RBAC handler all-generation-failed branch: update existing OpenRouter status message and return success JSON;
- agent outer catch branch: create an OpenRouter error message if the downstream route throws a recoverable OpenRouter error.

The production database sample came from the second shape: the progress message remained, and a separate error message was created after the downstream 500.

### Restored Database Observations

The local API environment points at `DATABASE_NAME=doctorgpt-production`, so the production sample IDs can be queried directly from the restored database (`apps/api/.env:13`, `apps/api/.env:20`).

The sampled production request path references:

- subject `35f9688e-151d-44a0-bad4-6893bf0e650e`;
- Telegram profile `a228b67d-f409-4b58-8366-75badb09ce1e`;
- chat `4f34a273-ca06-466b-a217-4303c82841de`;
- message `10b234ba-b01a-4434-9e5c-b89ab247ba48`.

All four IDs exist in the restored database. The incoming message text is the book-summary request from the production log window, created at `2026-05-02 02:44:11.144526`, with Telegram `source_system_id=92527`.

For the same chat/thread between `2026-05-02 02:40:00` and `2026-05-02 03:15:00`, the restored DB contains:

- `10b234ba-b01a-4434-9e5c-b89ab247ba48` from the Telegram profile, `source_system_id=92527`;
- `0cb7cc62-5b1e-4fa2-8482-e542a976a421` from `open-router`, `source_system_id=92529`, description `🏥 Генерирую ответ. Пожалуйста, подождите.`;
- `bd2f454b-2d9e-4e02-9340-65b9b1eb4ee6` from `open-router`, `source_system_id=92530`, description `🪦 Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.` followed by the serialized `No valid model response received...` error.

All three messages are linked to thread `8102286c-995b-4c34-9204-4a1be637285e`, whose title is `Книга: Саммари 📚`. The error message has an external Telegram source id, which is the field the message-create/notification path writes after successful outbound Telegram send.

## Code References

- `apps/telegram/src/lib/telegram-bot.ts:374` - Telegram message update handler.
- `apps/telegram/src/lib/telegram-bot.ts:868` - incoming Telegram private messages are written to the thread-aware RBAC message-create route.
- `libs/middlewares/src/lib/actions-logger/index.ts:164` - successful writes are forwarded to the agent Telegram bot handler.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:334` - agent controller detects social message create actions.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:371` - `open-router` automatic profile branch calls OpenRouter reply creation.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:214` - recoverable OpenRouter error marker list includes `No valid model response received`.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1925` - agent writes a user-facing OpenRouter error message on downstream failure.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1003` - final generation iterates candidate models.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1032` - model generation errors are treated as candidate fallback reasons.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1043` - invalid output modality/text/image result is treated as a candidate fallback reason.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1065` - all-generation-candidates-failed branch.
- `libs/shared/third-parties/src/lib/open-router/index.ts:568` - lower-level non-text stripping retry, disabled by the final generation call.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:521` - outbound notification source id is copied back into `social.message.sourceSystemId`.
- `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:865` - Telegram notification send uses `bot.api.sendMessage(...)`.

## Architecture Documentation

Telegram message processing crosses these layers:

1. `apps/telegram` ingests Telegram updates and creates `social.message` rows through the RBAC subject SDK.
2. `actions-logger` records successful message create actions and forwards them to `agent.telegramBot`.
3. `agent` decides whether automatic social profiles should reply and calls the OpenRouter RBAC subject route.
4. `rbac.subject` owns the OpenRouter generation workflow, status message lifecycle, billing settlement, and final/error reply message creation.
5. `notification` owns outbound Telegram delivery for created/updated social messages and returns Telegram message ids as `sourceSystemId`.

The current code has separate fallback categories:

- classification fallback: parse repair, fallback classifier models, then heuristic classification;
- model selection fallback: parse repair, selector model fallback, then priority ordering;
- final generation fallback: next candidate model if a model errors or returns an invalid result;
- transport wrapper fallback: optional single retry stripping non-text content, but final generation disables it;
- agent outer fallback: create a user-facing error message if the downstream route throws a recoverable OpenRouter failure.

## Historical Context (from thoughts/)

- `thoughts/shared/handoffs/singlepagestartup/ISSUE-154-progress.md` records that OpenRouter replies were moved to same-thread behavior and that the agent propagates thread ids into error/subscription replies.
- `thoughts/shared/research/singlepagestartup/ISSUE-158.md` documents the OpenRouter flow after billing work: classification, model selection, final generation, and repair/fallback calls are all part of one route execution.

## Verification

- Queried local Postgres database `doctorgpt-production` on port `5433` for the production subject/profile/chat/message IDs and adjacent chat messages.
- `npm run test:file -- libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/open-router-reply.spec.ts` did not reach Jest because the shared script failed in Nx argument parsing with `parsedArgs[PROJECT_TARGET_CONFIG]?.lastIndexOf is not a function`.
- `npm run test:file -- libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts` failed with the same Nx parser issue.
- `npx nx run @sps/agent:jest:test --testFile=libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/open-router-reply.spec.ts` passed: 2 tests.
- `npx nx run @sps/rbac:jest:test --testFile=libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts` passed: 1 test.

## Open Questions

- No current unit test directly exercises the RBAC `react-by-openrouter` all-generation-candidates-failed branch that now updates the status message and returns JSON.
- No current final-generation repair step was found that normalizes a non-normal final generation output into a valid text/image response before moving to the next model candidate; the current final-generation fallback is candidate selection plus validation.
