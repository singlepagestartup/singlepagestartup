---
issue_number: 209
issue_title: "Add Telegram assistant profile management conversations"
repository: singlepagestartup
created_at: 2026-07-17T20:25:18Z
last_updated: 2026-07-19T08:30:01Z
status: active
current_phase: complete
---

# Process Log: ISSUE-209 - Add Telegram assistant profile management conversations

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: complete
- Next step: code review / merge

## Phase Notes

### Create

- Summary: Created GitHub issue #209, added it to the configured Project, and transitioned it from Triage to Research Needed.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-209.md`; https://github.com/singlepagestartup/singlepagestartup/issues/209
- Notes: Priority high, size large, type feature; full web-sidebar parity including MCP.

### Research

- Summary: Documented the Agent command/publication contract, Telegram bootstrap and topic routing, current grammY conversation state, the web assistant sidebar, RBAC management guards, Social skill/profile relations, Knowledge document lifecycle, File Storage avatar flow, and reusable BDD patterns. Verified the live code against the thread, Telegram media, Knowledge, and MCP historical artifacts.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-209.md`; https://github.com/singlepagestartup/singlepagestartup/issues/209#issuecomment-5007648656
- Notes: `/assistant` and a serializable conversation identifier are absent; the live bot does not install or enter grammY conversations; the existing web/RBAC surface already covers profile/avatar/MCP, linked-skill create/edit, and Knowledge CRUD/reindex; available-skill discovery, link/unlink, and paginated sidebar reads are not present. Issue moved to Research in Review.

### Plan

- Summary: Produced a five-phase implementation plan that keeps `/assistant`, the conversation definitions/tools, the process-local state engine, dispatch, and rendering in `agent.agent.service`; completes only the missing subject-scoped RBAC list/relation operations; and keeps `apps/telegram` transport-only without a grammY Conversations dependency.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-209.md`; https://github.com/singlepagestartup/singlepagestartup/issues/209#issuecomment-5007990966
- Notes: The user explicitly approved the revised Agent-owned architecture. `Cancel` abandons the current editor/input and returns to its page, while `Close`, `/cancel`, `/exit`, and `/stop` terminate the conversation. Conversation state is intentionally process-local and in-memory, with restart/TTL expiry documented and no schema migration.

### Implement

- Summary: Implemented the Agent-owned command lifecycle, singleton in-memory conversation runtime, sender-scoped RBAC management surface and permission provisioning, Profile/MCP/Avatar/Skills/Knowledge tools, bounded Telegram presentation rendering, stale-callback protection, routing isolation, and operational documentation. All planned automated suites/builds/lints pass; the user elected to perform the end-to-end Telegram checks after delivery.
- Outputs: `thoughts/shared/handoffs/singlepagestartup/ISSUE-209-progress.md`; https://github.com/singlepagestartup/singlepagestartup/pull/210
- Notes: No post-plan scope changes were present in GitHub comments. Existing unrelated OpenRouter/frontend working-tree edits were preserved and excluded from the implementation commit.

### Code Review

- Summary: Completed live Browser verification in the authenticated Telegram Web session for Profile, MCP, Avatar, Skills, Knowledge, cancellation/closure, TTL/restart stale controls, concurrent duplicate callbacks, and topic routing. Restored all profile data and removed temporary linked Skill, Knowledge, and Avatar records after the checks. Review follow-ups now export Knowledge reads as TXT files, provide a dedicated photo-based Avatar page, and route main-flow commands into newly created Telegram topics before Agent conversation dispatch.
- Notes: Telegram Web A occasionally rendered Bot API message edits only after the next incoming update; Bot API, Social action/message, and Notification records all confirmed the correct state before the client caught up. Live access covered one private sender/topic; group, multi-sender, zero/multiple-profile, permission-loss, and record-removal variants remain covered by the committed BDD suites.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 26 -->

### Incident 1 — GitHub API blocked by sandbox network

- **Phase**: Create, Research
- **Occurrences**: 2
- **Symptom**: A workflow helper could not connect to `api.github.com`; during research the initial status check also produced incomplete Project metadata.
- **Root Cause**: The initial helper invocation ran with sandboxed network access.
- **Fix**: Re-ran the identical fail-fast helper block with escalated network access.
- **Preventive Action**: Preserve the helper sequence and retry it with network escalation when the canonical connectivity marker appears.
- **References**: `.claude/helpers/create_issue_with_project.sh`; `.claude/helpers/get_issue_status.sh`; GitHub issue #209.

### Incident 2 — Close and Cancel have overlapping Telegram wording

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: The ticket requires both inline `Cancel` and `Close` controls plus slash cancellation commands without defining whether the two inline actions have identical lifecycle effects.
- **Root Cause**: The Telegram conversation vocabulary combines an editor-abort action with a presentation-dismissal action.
- **Fix**: The user confirmed that `Cancel` abandons the current editor/input and returns to its page, while `Close`, `/cancel`, `/exit`, and `/stop` terminate the conversation.
- **Preventive Action**: Record the distinct editor-cancel and conversation-close scopes explicitly in the plan and cover both with BDD scenarios.
- **References**: `thoughts/shared/tickets/singlepagestartup/ISSUE-209.md`; `apps/telegram/src/lib/telegram-bot.ts`; `libs/modules/social/models/profile/frontend/component/src/lib/singlepage/chat-profile-sidebar/ClientComponent.tsx`.

### Incident 3 — Initial outline placed the conversation runtime in Telegram

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: The initial outline treated grammY session/conversation middleware in `apps/telegram` as the owner of the assistant conversation lifecycle.
- **Root Cause**: The research documented the imported grammY Conversations types and missing middleware, which made transport-owned runtime wiring appear to be the intended seam.
- **Fix**: The user clarified that `/assistant`, conversation tools/definitions, and runtime state belong to `agent.agent.service`; `apps/telegram` remains the ingestion/delivery adapter. Implement a service-owned in-memory conversation store and transition engine modeled after grammY Conversations behavior without requiring that package.
- **Preventive Action**: Keep executable Telegram command and conversation ownership together in the Agent service; expose only serializable command publication data to the Telegram app.
- **References**: `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`; `libs/modules/agent/models/agent/backend/app/api/src/lib/service/startup/index.ts`; `apps/telegram/src/lib/telegram-bot.ts`.

### Incident 4 — Generic test:file script cannot resolve an Nx project

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: The plan-listed `npm run test:file -- <path>` commands failed before Jest with an Nx project-target parsing error.
- **Root Cause**: The root script invokes `nx run --target=jest:test` without a project, which the current Nx CLI cannot resolve from a file argument.
- **Fix**: Used explicit project targets with `--testFile`: `@sps/agent:jest:test` and `telegram:jest:test`.
- **Preventive Action**: Use explicit Nx project targets for focused tests until the repository wrapper is repaired.
- **References**: `package.json`; Phase 1 verification for issue #209.

### Incident 5 — Telegram forwarding test lacked JWT configuration

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: New forwarding scenarios failed with `RBAC_JWT_SECRET is not set` before reaching the mocked RBAC mutation.
- **Root Cause**: The existing Telegram unit-test environment did not exercise the guarded ingestion method and omitted JWT secret/lifetime fixtures.
- **Fix**: Added non-sensitive JWT configuration fixtures to `telegram-bot.spec.ts`.
- **Preventive Action**: Tests crossing Telegram's RBAC ingestion boundary must provide the full JWT configuration fixture.
- **References**: `apps/telegram/src/lib/telegram-bot.spec.ts`; `apps/telegram/src/lib/telegram-bot.ts`.

### Incident 6 — Profile management routes lacked Telegram owner permissions

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: New profile and skill routes passed handler/middleware tests but would be rejected for ordinary Telegram owners because bootstrap provisioned only five Knowledge permissions; only the global admin wildcard covered the other routes.
- **Root Cause**: Existing profile-management handlers predated the Telegram management conversation and were not part of the profile-specific dynamic RBAC grant.
- **Fix**: Extended the idempotent profile access grant to fourteen exact requester/chat/target routes and made Telegram bootstrap provision the grant for every connected AI profile.
- **Preventive Action**: For every new protected subject route, verify both route middleware and the role/permission provisioning path used by the intended non-admin actor.
- **References**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/access.ts`; `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts`.

### Incident 7 — Domain UUIDs overflowed Telegram callback data

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: The first implementation encoded profile, skill, and document ids in callback tokens, but production UUIDs exceed the codec's 24-character token bound and can push Telegram callback data beyond 64 bytes.
- **Root Cause**: Early tests used short fixture ids and did not exercise the transport's real callback size limit.
- **Fix**: Buttons now carry compact deterministic opaque tokens; each click reloads current subject-scoped data and resolves the token back to exactly one domain entity. Added production-length UUID and pagination coverage.
- **Preventive Action**: Use production-shaped identifiers in callback tests and keep transport payloads as opaque references to server-side state.
- **References**: `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-conversation.ts`; `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-conversation.spec.ts`.

### Incident 8 — RBAC unit suite inherited a deployed API origin

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: The first full RBAC run failed an unrelated OpenRouter SDK URL assertion because the shell exported `NEXT_PUBLIC_API_SERVICE_URL=https://sps-api.ru.tuna.am` while the test expects localhost.
- **Root Cause**: The unit test reads the process environment during module initialization.
- **Fix**: Ran the suite with explicit localhost `NEXT_PUBLIC_API_SERVICE_URL` and `API_SERVICE_URL`; all 64 suites passed.
- **Preventive Action**: Pin API origin variables when running SDK URL unit suites from a development shell with deployment environment variables.
- **References**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/openrouter/models.spec.ts`.

### Incident 9 — Social lint referenced an unavailable Next.js rule

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: The affected-module lint matrix stopped in an unchanged avatar test because an inline disable referenced `@next/next/no-img-element`, which is not registered in the current Social ESLint target.
- **Root Cause**: The test's `next/image` mock retained a rule-specific disable after the lint configuration stopped loading that plugin rule.
- **Fix**: Removed the obsolete disable directive; the mock and test behavior are unchanged and the Social lint target passes.
- **Preventive Action**: Avoid rule-specific suppressions in test mocks unless the owning Nx lint target loads the corresponding plugin.
- **References**: `libs/modules/social/models/profile/frontend/component/src/lib/singlepage/chat-profile-avatar/Component.spec.tsx`.

### Incident 10 — Telegram delivery restored stale placeholder content

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: Manual Telegram verification showed `/assistant` permanently displaying the initial loading placeholder without buttons.
- **Root Cause**: After Agent updated the Social message with the complete menu, the slower create-notification path saved Telegram's message id by spreading `extendedSocialModuleMessage`, restoring the stale placeholder description and empty interaction object.
- **Fix**: The notification completion path now patches only `sourceSystemId`; a BDD regression test verifies that late delivery cannot overwrite newer message content.
- **Preventive Action**: Persist asynchronous transport acknowledgements as minimal partial updates rather than full entity snapshots captured before I/O.
- **References**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts`; `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.spec.ts`.

### Incident 11 — Initial presentation unnecessarily used a loading placeholder

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: A new `/assistant` invocation visibly published “Готовлю меню управления ассистентом…” before any usable menu controls.
- **Root Cause**: Agent created a placeholder to obtain the presentation message id, attached that id to runtime state, and only then rendered the menu. Callback identity uses the session nonce/revision and does not depend on the Telegram or Social message id.
- **Fix**: Initial render now builds the complete server-backed menu against the post-attach callback revision and creates it once. Edit fallback similarly builds and creates one complete replacement.
- **Preventive Action**: Do not expose loading entities for fast server-local reads when the final transport payload can be assembled before the create operation.
- **References**: `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-conversation.ts`; `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-conversation.spec.ts`.

### Incident 12 — Profile editor did not implement the approved draft controls

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: Live Telegram verification showed a blank sequential Profile editor with only Cancel; it did not show current values, support skip/clear, or require an explicit final save.
- **Root Cause**: The initial reducer stored only newly submitted strings and executed the RBAC mutation as soon as the fourth message arrived. The update also replaced localized objects with `{ ru }`, discarding other locales.
- **Fix**: Profile drafts are now prefilled, show the active current value, support Skip and optional-field Clear, render a bounded review step, save only after explicit confirmation, and merge Russian values into freshly reloaded localized records.
- **Preventive Action**: Conversation editor tests must assert both the intermediate draft controls and the exact mutation boundary, including preservation of data outside the edited locale.
- **References**: `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-conversation.ts`; `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-conversation.spec.ts`.

### Incident 13 — MCP toggle removed unknown stored identifiers

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: The MCP page stated that unknown saved IDs would remain unchanged, but toggling a supported server submitted only supported IDs and silently removed stale entries.
- **Root Cause**: Agent reused the shared MCP normalization helper, whose contract intentionally filters unsupported identifiers, despite the conversation plan requiring lossless preservation of existing configuration.
- **Fix**: The conversation now adds or removes only the selected catalogued ID while retaining every other configured identifier; the existing BDD scenario now asserts the stale ID survives.
- **Preventive Action**: When UI copy promises preservation, mutation tests must include unknown legacy values and assert the complete submitted collection.
- **References**: `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-conversation.ts`; `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-conversation.spec.ts`.

### Incident 14 — Assistant home omitted the current avatar

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: The Avatar editor persisted images correctly, but the Telegram home page did not show whether an avatar existed or expose the current image as required by the approved plan.
- **Root Cause**: Agent DI contained the message-to-file relation needed for incoming uploads but not the profile-to-file relation needed to project the selected profile's current avatar.
- **Fix**: Added the profile/File Storage read service to Agent DI, resolved the latest image using the web sidebar's ordering, and rendered avatar status plus an inline link on home.
- **Preventive Action**: Avatar workflow tests must cover both the write path and the subsequent read projection in every supported management surface.
- **References**: `libs/modules/agent/models/agent/backend/app/api/src/lib/di.ts`; `libs/modules/agent/models/agent/backend/app/api/src/lib/bootstrap.ts`; `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-avatar.spec.ts`.

### Incident 15 — Telegram Web session stopped delivering outgoing updates

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: The Browser retained older placeholder bubbles and showed later `/assistant` messages as pending even though the server had already delivered a complete one-message menu for the latest received command.
- **Root Cause**: Telegram Web A reported an explicit authorization error and requested logout plus phone-number login; the pending commands never reached the webhook or database.
- **Fix**: Verified the webhook and server independently, preserved the user's session instead of logging out automatically because Telegram warns that logout removes Secret Chats, and requested a fresh user login in the selected Browser before continuing live QA.
- **Preventive Action**: Distinguish server presentation defects from client delivery failures by correlating Browser send status, webhook updates, persisted source message ids, and server transport logs before changing application code.
- **References**: Browser evidence for the issue 209 manual verification session; `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-conversation.spec.ts`.

### Incident 16 — Partial profile updates reset sibling configuration

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: Saving localized Profile text through the real RBAC route cleared `allowedMcpServerIds`; earlier MCP-only saves could likewise clear localized profile fields.
- **Root Cause**: The chat-local profile handler forwarded only requested fields to the generic Social update SDK, whose normalized update payload applied defaults to omitted JSON fields.
- **Fix**: The handler now reloads the current authorized profile and submits a complete mutable-field snapshot with only requested values replaced. Added BDD coverage for both MCP-only and localized-text-only updates, then verified the real partial PATCH preserves RU/EN title and the enabled MCP server together.
- **Preventive Action**: Partial management routes built on generic model updates must hydrate and merge the current mutable record when omission is supposed to mean preservation.
- **References**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/update.ts`; `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/update.spec.ts`.

### Incident 17 — Knowledge reads exceeded Telegram's message limit

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: Opening the original Knowledge document failed with Telegram `400 Bad Request: MESSAGE_TOO_LONG`, leaving its inline button apparently unresponsive.
- **Root Cause**: The document page embedded the complete Knowledge description in `editMessageText`; the delivery path also filtered attachments to images and routed every non-empty set through `sendMediaGroup`, which is invalid for one TXT document.
- **Fix**: Agent now keeps the interactive page bounded and creates a canonical Social/File Storage message containing the full UTF-8 Knowledge text as a `.txt` file. Notification accepts reachable non-image attachments, recognizes TXT, and uses `sendDocument` for a single document while preserving topic options and upload fallback.
- **Preventive Action**: Treat large server content as an attachment at the Agent presentation boundary, and cover both the bounded menu payload and the final Telegram attachment method with BDD plus live Browser verification.
- **References**: `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-conversation.ts`; `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts`; Telegram topic `113050` live verification.

### Incident 18 — Avatar action lacked a dedicated media page and reset semantics

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: The Avatar button opened the upload editor immediately, while the current image was exposed only as a home-page link; there was no page-level preview, replace action, or delete-to-default action.
- **Root Cause**: The initial conversation modeled Avatar only as an upload mutation and treated absence of a profile/File relation as “not configured”; it had no canonical default variant or media-aware presentation transition.
- **Fix**: Added `default-social-module-personal-assistant` to File Storage variants, resolved the latest custom image or that default, rendered the Avatar page as a Telegram photo with Replace/Delete/Open/Back controls, and extended the existing subject-scoped Avatar endpoint with relation-only reset. Notification now falls back from text editing to caption editing for photo menus, while Agent recreates the presentation when switching between text and photo modes.
- **Preventive Action**: Model media-management tools as read-first pages with explicit replace/reset operations, and test both custom/default resolution plus text-to-photo presentation transitions.
- **References**: `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-conversation.ts`; `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/avatar/update.ts`; `libs/modules/file-storage/models/file/sdk/model/src/lib/index.ts`; `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts`.

### Incident 19 — Main-flow commands started conversations outside Telegram topics

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: `/assistant` sent from All Messages opened its Agent conversation against the default Social thread; subsequent editor text had no Telegram `message_thread_id` and was interpreted by the normal main-flow behavior as a request to create an unrelated AI topic.
- **Root Cause**: Telegram creates topics automatically for ordinary main-flow messages but not for native slash commands, while the adapter persisted every command to the bootstrap default thread before Agent dispatch.
- **Fix**: Telegram ingestion now detects a slash command without `message_thread_id`, creates a topic-backed Social thread through the existing subject-scoped RBAC thread endpoint, and persists the original command directly into that new thread. Commands already carrying `message_thread_id` reuse the bootstrap-resolved thread unchanged.
- **Preventive Action**: Establish the transport thread before persisting any command that starts a stateful interaction; cover both main-flow creation and existing-topic reuse at the adapter boundary.
- **References**: `apps/telegram/src/lib/telegram-bot.ts`; `apps/telegram/src/lib/telegram-bot.spec.ts`; Telegram topic `113080` live verification.

### Incident 20 — Bot-created topic service messages provisioned a second personal assistant

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: The `/assistant` selector in a private chat displayed both the human sender's personal AI profile and `Telegram personal AI agent for steady-magenta-urial-4603`.
- **Root Cause**: Telegram emitted `forum_topic_created` with `from.is_bot=true` after the bot created a command topic. The generic message handler sent that service update through RBAC bootstrap, which provisioned a personal AI profile for the bot identity and connected it to the same chat; automatic participant synchronization deduplicated relations per profile but preserved the second distinct personal profile.
- **Fix**: Telegram now rejects bot-authored messages before bootstrap. Private-chat bootstrap also reconciles automatic `telegram-personal-ai-agent` relations to the current human sender while preserving manually connected AI profiles and group-chat multi-profile behavior. Removed the single erroneous runtime relation and verified a fresh `/assistant` in topic `113095` opens the one-profile home directly.
- **Preventive Action**: Filter bot-authored service updates before identity/bootstrap work, and make private-chat automatic participant reconciliation self-heal stale personal-agent links.
- **References**: `apps/telegram/src/lib/telegram-bot.ts`; `apps/telegram/src/lib/telegram-bot.spec.ts`; `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts`; Telegram topic `113095` live verification.

### Incident 21 — Knowledge content editor ignored persisted text attachments

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: During Knowledge creation, a 15.4 KB `content.txt` reached Telegram and File Storage, but the editor reported that the value was empty and remained on the content step.
- **Root Cause**: The generic editor consumed only `social.message.description`; Telegram documents without captions intentionally persist an empty description, while their content lives behind the Social message-to-File Storage relation. The shared 4,000-character editor guard would also have rejected the file body after resolution.
- **Fix**: Agent's conversation transport now resolves the persisted editor attachment through the canonical Social/File Storage services. Knowledge create/edit content accepts UTF-8 TXT, Markdown, CSV, JSON, XML, YAML, and other `text/*` files, strips an optional BOM, preserves inline input, and applies a separate one-million-character content bound. Avatar input reuses the same resolver while retaining its image-only validation.
- **Preventive Action**: Every editor that accepts media must test the persisted attachment path with an empty message description and production-sized content beyond Telegram's text-message limit.
- **References**: `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`; `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-conversation.ts`; `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-editor-file.spec.ts`; Telegram topic `113101`.

### Incident 22 — Telegram management traffic remained eligible for later AI context

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: Telegram command messages, assistant-management menus, and editor inputs such as Avatar uploads were suppressed only while a conversation session was active; after the session closed, those persisted Social messages could still be collected as history for a later OpenRouter response.
- **Root Cause**: Suppression depended on transient Agent conversation state and brittle text comparisons. Social message metadata had no shared internal-message contract, and the OpenRouter history collector did not have a durable exclusion marker.
- **Fix**: Added the shared `systemMessage` metadata envelope with `excludeFromOpenRouter: true`. Agent marks Telegram-bot command inputs, active assistant editor inputs, and every system reply through its central service paths. Agent rejects marked triggers before calling RBAC, while RBAC independently rejects marked triggers and removes marked history messages without breaking `/new` context-reset semantics.
- **Preventive Action**: Any persisted UI/control-plane message that must remain visible but is not model conversation must carry a durable metadata exclusion marker; generation gates must enforce it both at dispatch and during historical context assembly.
- **References**: `libs/modules/social/models/message/sdk/model/src/lib/system-message-metadata.ts`; `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`; `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`.

### Incident 23 — Direct OpenRouter status replies bypassed the central system marker

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: Five subscription/token status messages selected in Telegram topic `113124` still had empty `{}` metadata, so the persisted exclusion contract could not guarantee that they would stay out of later model context.
- **Root Cause**: Premium and checkout replies are protected by the central Telegram reply path after Incident 22, but required-subscription, missing-subscription, insufficient-token, and OpenRouter-error branches create Social messages directly inside `openRouterReplyMessageCreate`. Those direct writes bypassed `telegramBotReplyMessageCreate`; the five already persisted messages also predated the complete marker rollout.
- **Fix**: Added one reusable Agent metadata wrapper and applied it to every direct OpenRouter status write, including threaded and non-threaded fallbacks. Added BDD coverage for the missing-subscription response and updated all existing OpenRouter fallback assertions. Backfilled exactly Social source message IDs `5423`–`5427` in the local topic and verified that all five now store `systemMessage.excludeFromOpenRouter: true`.
- **Preventive Action**: Any direct Social message creation path that represents UI, billing, access, or transport status must use the same persisted system-message wrapper as command replies; live verification must inspect stored metadata rather than infer it from visible text.
- **References**: `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`; `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/open-router-reply.spec.ts`; Telegram topic `113124`.

### Incident 24 — Telegram tool execution had no ordered, durable projection

- **Phase**: Code Review
- **Occurrences**: 3
- **Symptom**: The web chat rendered the canonical `ai-execution` action, but Telegram showed only the final answer. The first Telegram projection arrived after the final answer, and its metadata was later replaced with `{}` when the transport saved `sourceSystemId`.
- **Root Cause**: Tool lifecycle data existed only as a frontend action projection. Telegram notification dispatch was fire-and-forget, so a dependent final reply could overtake it. Social message insert validation also injected empty `interaction` and `metadata` defaults into source-system-id-only updates, erasing the system marker.
- **Fix**: Project the completed canonical action into one bounded Telegram message with a heading and safe tool list, mark it with `systemMessage.excludeFromOpenRouter`, and request awaited notification delivery before creating the final AI reply. Leave JSON defaults to Postgres so partial transport updates cannot erase existing metadata. A clean live run delivered the tool card before the separate answer, persisted `actionId/runId/toolCount`, and recorded one real MCP call in the final trace.
- **Preventive Action**: Reuse canonical execution telemetry for transport projections, await any message that must precede a dependent reply, and test partial update schemas for injected defaults that can clobber durable metadata.
- **References**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/ai/execution-action.ts`; `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts`; `libs/modules/social/models/message/backend/repository/database/src/lib/index.ts`; Telegram topic `113101` live verification.

### Incident 25 — Read-only assistant menus swallowed ordinary AI prompts

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: An ordinary question sent while the `/assistant` Knowledge detail page remained open was persisted but received no AI response; an unrelated web `model-favorites` request also logged a profile/chat 401 at the same time.
- **Root Cause**: Agent treated any active assistant conversation as an input editor, marked the prompt as `agent.telegram.assistant-conversation`, and blocked every connected AI profile even when the conversation state had no editor. Separately, subject-scoped model favorites required the requester's owned profile to be a chat participant even though favorites are keyed only by subject.
- **Fix**: Assistant conversations now consume and mark messages only while an editor is active; read-only menus leave ordinary prompts eligible for AI dispatch. The favorites handler relies on the existing subject/profile ownership middleware and no longer requires the unrelated profile/chat relation. Removed the single incorrect marker from source message `5461`. A live question in topic `113162` invoked two MCP tools and received a five-article answer while the Knowledge menu remained open; the exact favorites URL now returns `200`.
- **Preventive Action**: Conversation presence and editor-input capture are distinct states; generation suppression must be tied to the latter. Subject-scoped settings endpoints must not add resource-membership checks for path context they do not read or expose.
- **References**: `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`; `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/telegram-assistant-conversation.ts`; `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/openrouter/model-favorites.ts`; Telegram topic `113162` live verification.

### Incident 26 — A canceled Telegram Stars invoice remained payable

- **Phase**: Code Review
- **Occurrences**: 1 incident with 3 provider charges
- **Symptom**: An invoice created roughly eleven hours earlier was paid after its related order had already reached `canceled`. Telegram emitted three distinct `successful_payment` updates for the same invoice; Billing accepted the first charge, rejected the other two as duplicates, the canceled order was never fulfilled, and Telegram sent no payment-result message.
- **Root Cause**: The Telegram adapter approved every `pre_checkout_query` without loading current SPS state. Billing correctly made invoice settlement idempotent but could only reject a second charge after Telegram had already debited it. The successful-payment background task also called Billing without replying to the user, and a succeeded payment intent could not move an already-canceled order through the normal fulfillment statuses.
- **Fix**: Telegram now validates the complete live `invoice → payment intent → order` chain before approving checkout, accepts only open Telegram Star invoices attached to `new` or `paying` orders, treats redelivery of the original charge idempotently, refunds a distinct charge for a paid or invalid invoice, and sends explicit success/refund/delayed-processing messages. Production recovery kept the first charge, refunded the two duplicate charges through `refundStarPayment`, restored the single canceled paid order, verified it reached `delivering` with its product role assigned, and sent a confirmation message.
- **Preventive Action**: Provider pre-checkout approval must be an authorization decision over current domain state, not a transport-only acknowledgement. Every post-debit failure needs an explicit refund or recoverable status message, and duplicate-provider protection must include compensation because rejection after `successful_payment` is too late to prevent a debit.
- **References**: `apps/telegram/src/lib/telegram-bot.ts`; `apps/telegram/src/lib/telegram-bot.spec.ts`; production invoice `2f6d76e7-1ffd-4e77-9beb-1fc9c5fffb15`.

## Reusable Learnings

- GitHub helper connectivity failures must be retried unchanged with escalated network access rather than replaced by raw `gh` commands.
- Protected route work is incomplete until the intended non-admin actor's dynamic permission provisioning is tested.
- Telegram callback tests must use production-length UUIDs even when callback payloads ultimately carry opaque tokens.
- Late delivery acknowledgements must patch only transport-owned identifiers so they cannot overwrite concurrent message edits.
- Initial and replacement conversation presentations should be fully rendered before publication when callbacks do not depend on the transport message id.
- Prefilled localized editors must merge the edited locale into freshly loaded records and expose an explicit save boundary.
- Configuration toggles must not reuse normalizers that discard legacy values when the product contract promises to preserve them.
- Cross-surface file workflows require verification of the read projection after the mutation, not only the upload call.
- A pending Telegram Web send must be correlated with webhook and persistence evidence before it is treated as a bot response failure.
- Partial management routes must merge the current mutable record before calling generic update SDKs when omitted fields are contractually preserved.
- Telegram presentation text must remain bounded; complete Knowledge bodies belong in TXT attachments delivered through the canonical Social/File Storage/Notification path.
- Media-management conversations should resolve and show the effective asset first, represent deletion as a relation reset to the canonical default, and explicitly handle text/photo presentation mode changes.
- Telegram command ingestion must resolve or create the final topic-backed Social thread before the command message reaches Agent; conversation state cannot be moved safely after dispatch.
- Bot-authored Telegram service messages must be rejected before RBAC bootstrap, and private-chat automatic personal-agent links must reconcile to the current human sender without deleting manually connected AI profiles.
- Telegram document messages normally have no description; text-capable editors must resolve their canonical File Storage attachment before treating the input as empty or enforcing inline-message limits.
- Conversation-state suppression is not a durable history policy; internal control-plane messages need persisted metadata and defense-in-depth filtering at both generation dispatch and context collection.
- Central reply helpers do not protect direct SDK writes automatically; every status-message creation branch must apply the shared system metadata contract explicitly.
- Transport-visible tool telemetry should be projected from the canonical execution action, delivered before its dependent answer, and protected from partial-update default clobbering.
- Read-only conversation menus must not capture ordinary prompts; only active editor state should mark input as system traffic or suppress AI dispatch.
- Subject-scoped preferences should rely on subject ownership and must not require incidental chat membership when their storage and response are chat-independent.
- Telegram Stars checkout must validate current invoice, payment-intent, and order state before accepting pre-checkout; duplicate debits detected after `successful_payment` require provider compensation rather than a bare application error.
