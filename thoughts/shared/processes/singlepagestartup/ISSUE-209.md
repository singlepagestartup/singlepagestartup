---
issue_number: 209
issue_title: "Add Telegram assistant profile management conversations"
repository: singlepagestartup
created_at: 2026-07-17T20:25:18Z
last_updated: 2026-07-17T23:58:00Z
status: active
current_phase: implement
---

# Process Log: ISSUE-209 - Add Telegram assistant profile management conversations

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: in_progress
- Current phase: implement
- Next step: Complete implementation and submit a pull request for code review.

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
- Outputs: `thoughts/shared/handoffs/singlepagestartup/ISSUE-209-progress.md`
- Notes: No post-plan scope changes were present in GitHub comments. Existing unrelated OpenRouter/frontend working-tree edits were preserved and excluded from the implementation commit.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 9 -->

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

## Reusable Learnings

- GitHub helper connectivity failures must be retried unchanged with escalated network access rather than replaced by raw `gh` commands.
- Protected route work is incomplete until the intended non-admin actor's dynamic permission provisioning is tested.
- Telegram callback tests must use production-length UUIDs even when callback payloads ultimately carry opaque tokens.
