---
issue_number: 209
issue_title: "Add Telegram assistant profile management conversations"
start_date: 2026-07-17T22:47:04Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-209.md
status: complete
completed_date: 2026-07-18T00:09:31Z
---

# Implementation Progress: ISSUE-209 - Add Telegram assistant profile management conversations

**Started**: 2026-07-17
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-209.md`

## Phase Progress

### Phase 1: Move The Complete Command Lifecycle Into Agent

- [x] Started: 2026-07-17T22:47:41Z
- [x] Completed: 2026-07-17T22:55:39Z
- [x] Automated verification: PASSED 2026-07-17T22:54:32Z

**Notes**: Added Agent-owned `/assistant`, `/cancel`, `/exit`, and `/stop` definitions plus serializable conversation metadata; removed the unused grammY Conversations imports/registry/local exits from `apps/telegram`; added publication/override/forwarding BDD coverage. Focused tests, full Agent/Telegram Jest suites, both lint targets, Prettier, Agent TypeScript build, Telegram build, and live-reference search passed. Awaiting manual verification.

### Phase 2: Add The Agent-Owned Conversation Runtime

- [x] Started: 2026-07-17T22:55:39Z
- [x] Completed: 2026-07-17T23:00:00Z
- [x] Automated verification: PASSED 2026-07-17T23:00:00Z

**Notes**: Added the singleton replaceable memory store, chat/thread/sender isolation, 30-minute TTL, keyed serialization, revision reservation, compact callback codec, presentation edit/replacement path, ordinary text/image interception, and OpenRouter suppression. Runtime/controller/full Agent tests pass. User requested uninterrupted execution and will perform manual verification after delivery.

### Phase 3: Complete The Subject-Scoped RBAC Management Surface

- [x] Started: 2026-07-17T23:00:00Z
- [x] Completed: 2026-07-17T23:20:00Z
- [x] Automated verification: PASSED 2026-07-17T23:20:00Z

**Notes**: Added manageable AI-profile discovery, linked/available Skill pagination, idempotent link and relation-only unlink, Knowledge pagination, client/server SDK actions, split middleware validation, sender-scoped MCP update support, and exact dynamic permission provisioning for every connected AI profile. Full RBAC unit/integration tests and TypeScript build pass.

### Phase 4: Implement Assistant Profile Management Tools

- [x] Started: 2026-07-17T23:20:00Z
- [x] Completed: 2026-07-17T23:35:00Z
- [x] Automated verification: PASSED 2026-07-17T23:35:00Z

**Notes**: Implemented selector/home/Profile/MCP/Avatar/Skills/Knowledge pages and editors in `agent.agent.service`, sender-JWT mutations, fresh authorization checks, opaque UUID callback tokens, pagination, recoverable validation/service errors, confirmations, cancellation, closure, permission-loss shutdown, and stale controls. The focused tool suite covers all planned paths.

### Phase 5: Harden Lifecycle, Verify Routing, And Document Operations

- [x] Started: 2026-07-17T23:35:00Z
- [x] Completed: 2026-07-17T23:58:00Z
- [x] Automated verification: PASSED 2026-07-17T23:58:00Z

**Notes**: Documented Agent/Telegram/RBAC ownership and restart recovery; verified production-length callback limits, photo-only dispatch, presentation fallback, permission loss, duplicate destructive clicks, and existing OpenRouter routing. Agent (77), RBAC (265), Telegram (21), Agent/RBAC/API integration suites, Telegram build, Agent/RBAC/Social/Knowledge/API/Telegram lint/build checks, formatting, schema/snapshot search, and live grammY reference search pass. Live Telegram Browser verification was completed during code review.

## Live Browser Verification

- [x] `/assistant` publishes one complete menu with no loading placeholder.
- [x] Profile draft cancel/save, locale preservation, MCP toggle, Avatar upload/read projection, Skills create/edit/link/unlink, and Knowledge create/edit/reindex/cancel/delete work end to end.
- [x] `/cancel`, `/exit`, `/stop`, Close, TTL expiry, API restart, stale callbacks, and concurrent duplicate callbacks are safe and idempotent.
- [x] All live operations remained inside Telegram topic `112981`; the active one-profile baseline was restored to RU/EN title, MCP enabled, no Avatar, zero linked Skills, and one original Knowledge document.
- [x] Reopening the original 15.5 KB Knowledge document in topic `113050` produced a bounded interactive menu and a separate `.txt` attachment with the complete 15,832-byte UTF-8 content; no `MESSAGE_TOO_LONG` occurred.
- [x] Avatar opens a dedicated photo page with the effective custom/default image, Replace/Delete/Open/Back controls, and safe text-to-photo presentation replacement; the live custom avatar was preserved during verification.
- [x] `/assistant` from All Messages created Telegram topic `113080` and delivered its menu there; `/assistant` and ordinary conversation text sent inside `113080` remained in that topic without creating another thread.
- [x] Bot-authored `forum_topic_created` updates no longer provision personal assistants; the stale bot-owned automatic link was removed and a fresh `/assistant` in topic `113095` opened the single human-owned profile directly.
- [x] Knowledge create/edit now resolves persisted text attachments instead of relying on an empty Telegram document caption; the real 15,770-byte `content.txt` is reachable from the live API, and Agent BDD covers the complete file-to-Knowledge mutation beyond 4,000 characters.
- [x] Telegram commands, management replies, and active assistant-editor inputs now persist `systemMessage.excludeFromOpenRouter: true`; Agent and RBAC independently reject marked generation triggers, and RBAC omits them from later thread context.
- [x] Subscription, token-limit, channel-requirement, and OpenRouter-error replies now use the same system marker even on direct SDK creation paths; existing topic `113124` messages `5423`–`5427` were backfilled and verified.
- [x] Group/multi-sender, zero/multiple-profile, permission-loss, and missing-record variants remain covered by BDD because the authenticated Browser session exposed only one private sender and one manageable profile.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 20 -->

### Incident 1 — Generic test:file script cannot resolve an Nx project

- **Occurrences**: 1
- **Stage**: Phase 1 - Move The Complete Command Lifecycle Into Agent
- **Symptom**: Both plan-listed `npm run test:file -- <path>` commands failed with `parsedArgs[PROJECT_TARGET_CONFIG]?.lastIndexOf is not a function` before Jest started.
- **Root Cause**: The root `test:file` script invokes `nx run --target=jest:test` without a project, which the current Nx CLI cannot resolve from the file argument.
- **Fix**: Ran the focused tests through explicit targets: `npx nx run @sps/agent:jest:test --testFile=...` and `npx nx run telegram:jest:test --testFile=...`.
- **Reusable Pattern**: Use an explicit Nx project and target for focused tests until the root `test:file` wrapper is repaired.

### Incident 2 — Telegram forwarding test lacked JWT configuration

- **Occurrences**: 1
- **Stage**: Phase 1 - Move The Complete Command Lifecycle Into Agent
- **Symptom**: The new command-forwarding scenarios failed before ingestion with `RBAC_JWT_SECRET is not set`.
- **Root Cause**: Existing Telegram unit tests never exercised `handleIncomingMessage(...)`, so their shared-utils mock omitted JWT secret and lifetime values required by that path.
- **Fix**: Added non-sensitive JWT secret and lifetime fixtures to the test mock; all forwarding scenarios then passed.
- **Reusable Pattern**: Transport tests that cross the RBAC ingestion boundary must provide the complete JWT configuration fixture even when signing is stubbed later.

### Incident 3 — Profile management routes lacked Telegram owner permissions

- **Occurrences**: 1
- **Stage**: Phase 3 - Complete The Subject-Scoped RBAC Management Surface
- **Symptom**: Handler tests passed, but ordinary Telegram owners had no non-admin permission records for Profile/MCP/Avatar/Skills routes.
- **Root Cause**: Bootstrap provisioned only the five existing Knowledge routes.
- **Fix**: Extended the idempotent exact-target grant to fourteen routes and provisioned it for every connected AI profile during Telegram bootstrap.
- **Reusable Pattern**: Verify dynamic role/permission provisioning in addition to route middleware for every new protected subject route.

### Incident 4 — Domain UUIDs overflowed Telegram callback data

- **Occurrences**: 1
- **Stage**: Phase 4 - Implement Assistant Profile Management Tools
- **Symptom**: Short fixture ids fit, but real UUIDs violated the callback token bound and could exceed Telegram's 64-byte payload limit.
- **Root Cause**: Domain ids were initially embedded directly in callback data.
- **Fix**: Replaced them with compact deterministic opaque tokens resolved against freshly loaded scoped data; added production UUID coverage.
- **Reusable Pattern**: Test transport codecs with production-shaped identifiers and keep domain state server-side.

### Incident 5 — RBAC unit suite inherited a deployed API origin

- **Occurrences**: 1
- **Stage**: Phase 5 - Harden Lifecycle, Verify Routing, And Document Operations
- **Symptom**: An unrelated SDK URL assertion expected localhost but the development shell exported the deployed API origin.
- **Root Cause**: Unit modules read API URL environment variables during initialization.
- **Fix**: Pinned both API origin variables to localhost for the RBAC unit/integration verification commands.
- **Reusable Pattern**: Pin API origin fixtures when running URL-sensitive SDK tests from a deployment-configured shell.

### Incident 6 — Social lint referenced an unavailable Next.js rule

- **Occurrences**: 1
- **Stage**: Phase 5 - Harden Lifecycle, Verify Routing, And Document Operations
- **Symptom**: Social lint failed in an unchanged avatar test on an unknown `@next/next/no-img-element` disable.
- **Root Cause**: The owning lint target no longer registers that rule.
- **Fix**: Removed the obsolete suppression without changing the test mock; Social lint passes.
- **Reusable Pattern**: Rule-specific suppressions must match the plugin set of the owning Nx target.

### Incident 7 — Telegram delivery restored stale placeholder content

- **Occurrences**: 1
- **Stage**: Manual review follow-up
- **Symptom**: `/assistant` remained on “Готовлю меню управления ассистентом…” even though Agent had generated the complete menu and callback keyboard.
- **Root Cause**: The asynchronous message-create notification persisted Telegram's `sourceSystemId` by spreading its stale create-time message snapshot, overwriting a newer menu update.
- **Fix**: Changed the delivery completion write to patch only `sourceSystemId` and added a BDD race-regression scenario.
- **Reusable Pattern**: Asynchronous delivery acknowledgements must patch transport identifiers only; they must never write an earlier full entity snapshot over concurrent content updates.

### Incident 8 — Initial presentation unnecessarily used a loading placeholder

- **Occurrences**: 1
- **Stage**: Manual review follow-up
- **Symptom**: After the stale-write fix, manual verification still exposed the loading message before any usable controls.
- **Root Cause**: The initial implementation created a placeholder solely to obtain a Social message id, then rendered and updated the real menu even though callback encoding does not require that id.
- **Fix**: Agent now resolves all server data and creates the complete menu in one operation; edit failure also creates a complete replacement instead of a recovery placeholder.
- **Reusable Pattern**: Build server-backed interactive presentations before publication whenever their callback identity is independent of the transport message id.

### Incident 9 — Profile editor omitted draft controls and locale preservation

- **Occurrences**: 1
- **Stage**: Manual review follow-up
- **Symptom**: The live editor exposed only Cancel, hid current values, auto-saved on the fourth message, and could replace all localized content with Russian-only objects.
- **Root Cause**: The reducer modeled field collection but not the plan's prefilled draft and explicit-save boundary.
- **Fix**: Added current-value rendering, Skip, optional Clear, review/Save, fresh authorization recheck, and locale-preserving merge semantics with BDD coverage.
- **Reusable Pattern**: Test editor draft state separately from its mutation boundary and include unrelated localized values in fixtures.

### Incident 10 — MCP toggle contradicted its legacy-ID preservation copy

- **Occurrences**: 1
- **Stage**: Manual review follow-up
- **Symptom**: Toggling SinglePageStartup MCP removed an unknown stored ID even though the menu said it would remain unchanged.
- **Root Cause**: The shared normalizer intentionally filters unsupported IDs, but this management flow requires lossless legacy preservation.
- **Fix**: Agent now toggles only the chosen supported identifier and leaves all other values untouched; the BDD expectation includes the legacy ID.
- **Reusable Pattern**: Collection mutation tests must include legacy/unknown members whenever UI semantics promise preservation.

### Incident 11 — Telegram home omitted the persisted avatar projection

- **Occurrences**: 1
- **Stage**: Manual review follow-up
- **Symptom**: Avatar upload used the canonical RBAC/File Storage action, but home did not report or expose the currently selected avatar.
- **Root Cause**: Agent had no profile-to-file read service in its transport-independent DI surface.
- **Fix**: Added latest-relation resolution matching the web sidebar and rendered avatar status plus a current-image link on Telegram home.
- **Reusable Pattern**: Cross-surface media parity requires read-after-write projection coverage, not only mutation coverage.

### Incident 12 — Telegram Web authorization blocked the remaining live QA

- **Occurrences**: 1
- **Stage**: Manual review follow-up
- **Symptom**: New `/assistant` messages stayed pending in Web A and never reached the webhook, while a previously received command had already produced the complete one-message menu.
- **Root Cause**: Telegram Web displayed its own authorization error and required logout followed by phone-number login.
- **Fix**: Kept the current account data intact because Telegram warns that logout removes Secret Chats; remaining Browser scenarios require the user to sign in again first.
- **Reusable Pattern**: Correlate client send indicators with webhook, persistence, and transport logs before attributing a missing response to server code.

### Incident 13 — Partial profile updates reset sibling configuration

- **Occurrences**: 1
- **Stage**: Manual review follow-up
- **Symptom**: A localized Profile save cleared the enabled MCP server because the route forwarded only requested fields to a generic update path that normalized omitted JSON fields to defaults.
- **Root Cause**: The chat-local profile update handler did not merge the current mutable profile before calling the Social SDK.
- **Fix**: Reload and merge all mutable fields before applying the requested partial update; added MCP-only and profile-text-only BDD regressions and verified the real API preserves RU/EN title and MCP together.
- **Reusable Pattern**: Partial management endpoints must explicitly preserve omitted sibling fields when their downstream update primitive applies defaults.

### Incident 14 — Knowledge detail rendering exceeded Telegram limits

- **Occurrences**: 1
- **Stage**: Manual review follow-up
- **Symptom**: Clicking the original Knowledge item raised Telegram `MESSAGE_TOO_LONG` because its full body was passed to `editMessageText`.
- **Root Cause**: Knowledge detail rendering had no large-content boundary, while Notification admitted only image attachments and used media groups even for a single file.
- **Fix**: Agent exports the complete Knowledge body as a UTF-8 TXT through the existing Social message/File Storage pipeline and renders only a bounded summary. Notification now accepts reachable documents and uses `sendDocument` for one TXT attachment.
- **Reusable Pattern**: Keep interactive Telegram text bounded and send large read results as canonical file attachments; test the provider method as well as the conversation payload.

### Incident 15 — Avatar was an upload editor instead of a media-management page

- **Occurrences**: 1
- **Stage**: Manual review follow-up
- **Symptom**: Clicking Avatar entered upload mode directly and did not present the current/default image or a delete-to-default action.
- **Root Cause**: The first workflow implemented only the Avatar write path and rendered every assistant presentation as text.
- **Fix**: Added custom/default avatar resolution, a photo-based page with Replace/Delete/Open/Back controls, relation-only reset through the existing subject-scoped endpoint, and transport support for safe text/photo transitions and photo-caption edits.
- **Reusable Pattern**: File tools should expose the effective asset before mutation, reuse canonical relations for reset semantics, and test transport media-mode changes as part of the conversation contract.

### Incident 16 — Slash commands bypassed Telegram topic creation

- **Occurrences**: 1
- **Stage**: Manual review follow-up
- **Symptom**: `/assistant` launched from All Messages stored its session in the default thread, so editor input could trigger Telegram's unrelated ordinary-message topic creation instead of updating the profile draft.
- **Root Cause**: Telegram's client-side topic creation applies to ordinary messages but not native commands, and the adapter did not provision a topic before persisting commands.
- **Fix**: The adapter now creates a topic through the canonical subject-scoped RBAC thread action when a command has no `message_thread_id`, persists the command into that returned Social thread, and reuses the existing thread when a command already belongs to a topic.
- **Reusable Pattern**: Stateful command routing must determine the final transport thread before command persistence and Agent dispatch.

### Incident 17 — Bot-created topic updates added a second private-chat assistant

- **Occurrences**: 1
- **Stage**: Manual review follow-up
- **Symptom**: The private-chat assistant selector showed the human's personal AI profile plus a second profile whose owner identity was the Telegram bot itself.
- **Root Cause**: Telegram delivered the bot-created topic service message with `from.is_bot=true`; the generic message path bootstrapped that sender and created/connected a personal AI profile for it.
- **Fix**: Reject bot-authored messages before bootstrap, reconcile private-chat automatic personal-agent relations to the current sender, remove the one erroneous runtime relation, and retain manually connected AI profiles plus group multi-profile behavior.
- **Reusable Pattern**: Service updates authored by the bot are transport lifecycle signals, not user identities; filter them before persistence and self-heal private-chat automatic membership.

### Incident 18 — Knowledge file input was treated as empty text

- **Occurrences**: 1
- **Stage**: Manual review follow-up
- **Symptom**: Uploading `content.txt` on the Knowledge content step left `social.message.description` empty, so Agent rejected the input even though Telegram ingestion had stored the file successfully.
- **Root Cause**: Only the Avatar editor resolved message-to-File Storage attachments; every textual editor read `message.description` and shared a 4,000-character bound.
- **Fix**: Added a reusable persisted editor-file resolver in Agent transport, read supported text files for Knowledge content, preserved normal typed content, added a separate large-content bound, and covered both the File Storage resolution and full Knowledge create mutation with BDD.
- **Reusable Pattern**: An attachment-bearing Social message and a text-bearing Social message are distinct input shapes; editor validation must normalize both before checking emptiness or length.

### Incident 19 — Transient conversation suppression did not protect later OpenRouter history

- **Occurrences**: 1
- **Stage**: Manual review follow-up
- **Symptom**: Command menus and Avatar/editor traffic could become ordinary OpenRouter history after the in-memory conversation closed, even though immediate generation was suppressed while it was active.
- **Root Cause**: The system had no durable Social-message metadata contract for internal control-plane traffic; context eligibility relied on active session state and selected text-value filters.
- **Fix**: Added the shared `systemMessage.excludeFromOpenRouter` marker, set it centrally for Telegram commands, active editor inputs, and system replies, and enforced it in both Agent dispatch and RBAC trigger/history processing while retaining `/new` reset behavior.
- **Reusable Pattern**: Visible system traffic needs a persisted exclusion contract; session-local routing guards alone cannot keep it out of future model context.

### Incident 20 — Direct OpenRouter status writes missed the system marker

- **Occurrences**: 1
- **Stage**: Manual review follow-up
- **Symptom**: The five subscription/token messages visible in Telegram topic `113124` had empty metadata even after the durable exclusion contract was introduced.
- **Root Cause**: Several OpenRouter status branches write Social messages directly instead of using the central Telegram reply helper, and the visible records predated the complete rollout.
- **Fix**: Wrapped every direct required-subscription, missing-subscription, insufficient-token, and OpenRouter-error write with `systemMessage.excludeFromOpenRouter: true`, added BDD assertions, and backfilled source message IDs `5423`–`5427` in the local runtime database.
- **Reusable Pattern**: Audit direct SDK message creates whenever introducing cross-cutting message metadata; central helper coverage alone is insufficient.

## Summary

### Changes Made

- Agent is the single owner of `/assistant`, termination commands, transient sessions, callbacks, tool state, and menu rendering.
- Telegram remains a transport-only ingestion/publication adapter with no grammY Conversations runtime.
- Subject-scoped RBAC now exposes manageable profiles and bounded Skill/Knowledge management, including relation-only unlink and dynamic non-admin grants.
- Profile, MCP, avatar, Skill, and Knowledge workflows use the Telegram sender subject JWT and fresh RBAC revalidation.
- Profile drafts now expose current values, Skip/Clear, and explicit Save while preserving non-Russian locales; MCP toggles preserve unknown stored IDs.
- Avatar management now resolves the same latest image as the web sidebar, falls back to the canonical File Storage default, and provides a dedicated photo page with replace/reset controls.
- Chat-local profile updates preserve omitted localized content and MCP configuration.
- Knowledge reads return complete UTF-8 TXT attachments while keeping the interactive Telegram page below message limits.
- Knowledge create/edit content accepts persisted UTF-8 text attachments through the canonical Social/File Storage relation, including bodies larger than Telegram text messages.
- Main-flow Telegram commands now create a topic-backed Social thread before Agent dispatch, while commands and editor input inside an existing topic remain scoped to that topic.
- Bot-authored topic service updates are ignored before RBAC bootstrap, and private chats self-heal stale automatic personal-agent links without removing manually connected AI profiles.
- Telegram command, assistant-management, and Avatar/editor messages carry a durable system marker and are excluded from OpenRouter triggers and thread history.
- Subscription and OpenRouter status replies, including direct fallback writes, carry the same durable exclusion marker; the five reported runtime records were backfilled.
- Regression coverage and operational documentation include expiry/restart loss, stale controls, duplicate clicks, topic/sender isolation, and OpenRouter suppression.

### Pull Request

- [x] PR created: https://github.com/singlepagestartup/singlepagestartup/pull/210
- [x] PR number: 210

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [x] Live Telegram Browser verification completed for the available private topic/sender
- [ ] Issue marked as Done

---

**Last updated**: 2026-07-18T23:20:49Z
