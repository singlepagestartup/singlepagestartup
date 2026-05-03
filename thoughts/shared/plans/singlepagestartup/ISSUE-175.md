# Issue 175 Plan: Skip Empty Telegram Prompts and Validate Empty OpenRouter Replies

## Summary

Fix the production log-watch 400 by separating two cases that are currently conflated:

- an incoming Telegram/social message with `description === ""` is valid persisted data when the user sent an attachment without text or caption, but it must not be passed to OpenRouter generation;
- an AI model text reply that is empty is an invalid generation result and must fail so the bot writes the existing OpenRouter error message into the chat.

The fix should be small and runtime-focused: no schema changes, no migration, no historical data rewrite, and no repository snapshot edits.

## Current State Analysis

The restored `doctorgpt-production` database already contains many Telegram-origin `sl_message` rows with empty descriptions, and research confirmed that most recent empty-description rows are attachment/media messages linked to chats with automatic `open-router` and `telegram-bot` profiles. This makes empty `description` a valid social-message storage state, not a data-integrity violation.

The failing runtime path is:

1. Telegram adapter stores `message.text || message.caption || ""` through the RBAC social message create route.
2. The action logger forwards that created message to `POST /api/agent/agents/telegram-bot`.
3. The agent automatic profile handler routes non-command messages to the `open-router` profile.
4. `Service.openRouterReplyMessageCreate` throws `Validation error. 'props.socialModuleMessage.description' is empty.`
5. The agent controller surfaces the error as a 400, matching the production log-watch fingerprint.

The output side has a related guard gap: the OpenRouter reaction controller appends the selected model footer to `generatedMessageDescription` before checking whether `replyMessageData.description == ""`. That final check cannot catch an empty text generation after the footer has been appended. The candidate validation helper already rejects empty text for text output in the main fallback loop, but the final message construction still needs a direct raw-output invariant so an empty AI text reply cannot be persisted as a successful assistant message.

## Desired End State

After implementation:

- Telegram attachment-only messages with `description === ""` remain valid social messages and keep their file relations.
- The `open-router` automatic profile no-ops for blank or whitespace-only incoming prompts before calling the RBAC OpenRouter reaction route.
- Blank incoming prompts do not create an OpenRouter status message, do not call OpenRouter, do not create an error reply, and do not produce the issue's 400.
- Telegram bot commands and normal non-empty prompts keep their existing behavior.
- Empty AI text generation results are treated as generation failures before a successful assistant reply is persisted.
- The failure path writes the existing `openRouterError` chat message through the agent catch path and still throws the error for observability.
- No schema, migration, seed, data snapshot, or historical row change is required.

## Phase 1: Guard Empty Incoming Prompts Before Generation

### Overview

Change the agent OpenRouter branch so persisted empty social-message descriptions are accepted as input events but skipped as generation prompts.

### Changes Required

#### 1. Add an OpenRouter prompt guard in the agent service

**File**:

- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`

**Why**: the decision not to generate belongs in the agent's `open-router` branch, not in Telegram ingestion or the generic RBAC message-create route.

**Changes**:

- In the `props.shouldReplySocialModuleProfile.slug === "open-router"` branch, check `props.socialModuleMessage.description?.trim()` before resolving the sender RBAC subject or calling `openRouterReplyMessageCreate`.
- Return early when the prompt text is empty or whitespace-only.
- Keep the existing command skip behavior for `telegramBotCommands`.
- Remove or neutralize the current throwing validation in `openRouterReplyMessageCreate` for empty incoming descriptions so direct callers also no-op instead of entering the error-reply catch path.
- Keep validation for missing chat/profile/thread configuration as real errors.

### Success Criteria

- An empty incoming Telegram/social message with files can be stored and routed through the action logger without causing `POST /api/agent/agents/telegram-bot` to return 400.
- The RBAC `socialModuleProfileFindByIdChatFindByIdMessageFindByIdReactByOpenrouter` SDK action is not called for empty prompts.
- No OpenRouter error message is written for the user's attachment-only message.

## Phase 2: Enforce Empty AI Output as a Generation Error

### Overview

Make the OpenRouter reaction controller validate raw generated text before adding metadata/footer text or creating the assistant reply.

### Changes Required

#### 1. Tighten final output validation

**File**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`

**Why**: a model footer is not a model answer. The success reply must only be created when the model produced a non-empty text response for text output, or a valid image response for image output.

**Changes**:

- Keep or extend `getGenerationValidationError` so text output with `generationResult.text?.trim() === ""` is invalid.
- During final message construction, validate the raw trimmed generated text before appending `__${selectModelForRequest}__`.
- Throw a clear error such as `Generated message is empty` if a selected text-output model reaches final construction with empty text.
- Preserve the existing image-output behavior: image replies require an image URL, and a missing text caption may still use the existing generated-image fallback description.
- Preserve billing settlement behavior for provider calls that already consumed usage.

#### 2. Preserve user-facing bot error behavior

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`

**Why**: the user should see that generation failed, while observability should still receive an error instead of a false successful reply.

**Changes**:

- Let the empty-output error propagate from the RBAC OpenRouter reaction route.
- Rely on the existing `openRouterReplyMessageCreate` catch path to create an `openRouterError` message in the same chat/thread.
- Keep the error non-recoverable unless implementation finds an existing recoverable class that intentionally covers empty provider output.

### Success Criteria

- Empty AI text output cannot be persisted as an assistant reply containing only a model footer.
- The bot writes the configured OpenRouter error text into the chat when generation produces an empty text response.
- The original error is still thrown after the bot error message is written.

## Phase 3: Add Focused BDD Regression Coverage

### Overview

Lock the input and output behavior with narrow unit tests using the repository BDD format.

### Changes Required

#### 1. Agent no-op coverage for empty incoming prompts

**Primary test file**:

- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/open-router-reply.spec.ts`

**Scenarios**:

- Given an incoming social message has `description: ""`, when `openRouterReplyMessageCreate` is called, then it resolves without calling the RBAC OpenRouter reaction SDK and without creating an error reply.
- Given the downstream OpenRouter reaction route throws `Generated message is empty`, when the agent handles that failure, then it writes the existing `openRouterError` chat message and rethrows.

If the implementation moves the main input guard into `agentSocialModuleProfileHandler`, add a direct service-level test for that branch as well, or extend an existing agent handler test without over-mocking the Telegram controller.

#### 2. RBAC OpenRouter output validation coverage

**Primary test file**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts`

**Scenarios**:

- Given a text-output model result has empty text, when generation validation runs, then the candidate is rejected with an empty-output validation error.
- Given final text message construction sees empty raw generated text, when the handler tries to build a success reply, then it throws `Generated message is empty` before creating the assistant message.
- Given an image-output result has a valid image URL and no text, when the handler builds the reply, then the existing image fallback description remains valid.

### Success Criteria

- Tests follow the repo BDD header requirements: top-level `BDD Suite`, scenario-level `BDD Scenario`, and explicit `Given`, `When`, `Then` lines.
- Coverage proves the production 400 path is fixed without loosening validation for empty AI outputs.

## Verification Commands

- `npm run test:file -- libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/open-router-reply.spec.ts`
- `npm run test:file -- libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts`
- `npx nx run @sps/agent:jest:test`
- `npx nx run @sps/rbac:jest:test`
- `npx nx run @sps/agent:tsc:build`
- `npx nx run @sps/rbac:tsc:build`

## Manual / Database Verification

- Use the restored production-copy database only for SELECT-based confirmation of existing empty-description Telegram messages and their file relations.
- Do not run a direct mutating replay `POST /api/agent/agents/telegram-bot` against the restored production-copy database unless the tester intentionally accepts new chat/error-message rows.
- A safe manual check is to inspect logs or mock the service path and confirm that an empty-description message ID no longer reaches the OpenRouter reaction SDK.

## What We're NOT Doing

- No change to `apps/telegram` message normalization just to fabricate placeholder text for attachments.
- No requirement that `sl_message.description` be non-empty.
- No DB migration, seed update, data snapshot edit, or cleanup/backfill of historical empty-description rows.
- No new multimodal behavior for attachment-only messages without a user prompt.
- No refactor of billing, model routing, or Telegram thread behavior outside the empty-input and empty-output paths.

## Assumptions

- Attachment-only Telegram messages without caption are not actionable prompts for the current OpenRouter branch.
- If future product behavior wants AI to analyze attachments without text, that should be a separate feature with an explicit prompt/default instruction contract.
- Existing `telegramBotServiceMessages.openRouterError.ru` copy is acceptable for empty generation failures.

## References

- Ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-175.md`
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-175.md`
- Agent OpenRouter branch: `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`
- RBAC OpenRouter reaction handler: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`
