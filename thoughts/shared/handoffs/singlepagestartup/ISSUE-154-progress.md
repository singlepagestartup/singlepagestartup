---
issue_number: 154
issue_title: "Social chat threads: default-thread routing, thread-aware replies, thread switch/create UI, and historical backfill"
start_date: 2026-04-10T20:56:14Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-154.md
status: in_progress
---

# Implementation Progress: ISSUE-154 - Social chat threads: default-thread routing, thread-aware replies, thread switch/create UI, and historical backfill

**Started**: 2026-04-10
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-154.md`

## Phase Progress

### Phase 1: Contract And Route Realignment

- [x] Started: 2026-04-10T20:56:45Z
- [x] Completed: 2026-04-10T21:35:00Z
- [ ] Automated verification: FAILED (`npx nx run @sps/rbac:tsc:build`) - blocked by pre-existing workspace dependency failure in `@sps/blog:tsc:build`.

**Notes**: Plan comments synced through 2026-04-10T20:22:11Z; latest review feedback is already reflected in current plan content. Implemented canonical profile-thread route/controller + SDK/OpenAPI surface (`/profiles/:profileId/chats/:chatId/threads/:threadId/messages`). Added strict RBAC secret-key guard pattern to avoid `string | undefined` header type errors.

### Phase 2: Backend Thread Invariants And Message Flow

- [x] Started: 2026-04-10T21:36:00Z
- [x] Completed: 2026-04-10T21:44:00Z
- [ ] Automated verification: FAILED (`npx nx run @sps/rbac:tsc:build --excludeTaskDependencies`) - blocked by broad pre-existing workspace/module-resolution failures not specific to phase changes.

**Notes**: Subject DI/bootstrap extended with `thread`, `chatsToThreads`, `threadsToMessages`; chat create now guarantees default thread bootstrap; profile chat message create flow now resolves/creates target thread and always links `threads-to-messages`; thread ownership checks are enforced through profile-thread handlers with profile-to-chat access validation. Added explicit `RBAC_SECRET_KEY` guard in `assertThreadBelongsToChat` and documented the reusable guard pattern in ISSUE-154 thoughts research/progress artifacts.

### Phase 3: OpenRouter And Agent Same-Thread Replies

- [x] Started: 2026-04-10T21:44:30Z
- [x] Completed: 2026-04-10T21:58:00Z
- [ ] Automated verification: FAILED (`npx nx run @sps/agent:tsc:build --excludeTaskDependencies`) - blocked by broad pre-existing workspace/module-resolution failures not specific to phase changes.

**Notes**: `react-by-openrouter` now resolves trigger message thread via `threads-to-messages`, backfills legacy threadless messages into chat default thread, builds LLM context from the active thread only, and sends status/final reply into same thread. Agent service OpenRouter branch now resolves thread from trigger message and propagates `threadId` into direct OpenRouter error/subscription replies.

### Phase 4: Frontend Thread Selector, Creation, And Path Sync

- [x] Started: 2026-04-10T22:00:00Z
- [x] Completed: 2026-04-10T22:12:00Z
- [ ] Automated verification: PARTIAL (`git diff --name-only -- '*.ts' '*.tsx' | xargs -r npx eslint` passed; `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/rbac:tsc:build --excludeTaskDependencies` still blocked by broad pre-existing module-resolution failures).

**Notes**: Host social chat overview widget now resolves both `social.chats.id` and `social.threads.id` URL segments and forwards them to RBAC subject chat overview. Subject chat overview UI now loads chat threads, supports custom thread creation, keeps selected thread in canonical route (`/social/chats/:chatId/threads/:threadId`), and redirects from legacy chat-only route to a resolved default thread. Message list read/create switched to thread-scoped subject SDK routes. Added a new host page seed for canonical thread route plus matching page-to-layout/page-to-widget relations to avoid `findByUrl` length mismatch 404 on nested thread URLs.

### Phase 5: Data Normalization Via Agent/Service Routine (No Migration)

- [x] Started: 2026-04-10T22:16:00Z
- [x] Completed: 2026-04-11T11:29:04Z
- [ ] Automated verification: PARTIAL (`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/agent:jest:test`, `@sps/host:jest:test`, `@sps/rbac:jest:test` passed; `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/agent:tsc:build --excludeTaskDependencies` and `@sps/rbac:tsc:build --excludeTaskDependencies` still fail with broad pre-existing TS2307/module-resolution issues outside ISSUE-154 scope).

**Notes**: Added idempotent agent-side normalization routine `normalizeChatThreadsAndMessageLinks(...)` in `agent/service/singlepage/index.ts`. Routine ensures default thread per chat and backfills missing `threads-to-messages` links for threadless chat messages before resolving OpenRouter reply thread context. Added BDD behavior coverage in `agent/service/singlepage/index.spec.ts` (normalization idempotence). Added scenario suite under `apps/api/specs/scenario/singlepagestartup/issue-154` with real API/DB behavior checks for: default-thread bootstrap, thread-scoped message isolation, cross-chat thread rejection, and rerunnable thread-link backfill in reaction flow. Added runner wrapper `tools/testing/test-scenario-issue-154.sh` and npm script `test:scenario:issue-154`.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 4 -->

### Incident 1 — Workspace tsc dependency failure blocks phase verification

- **Occurrences**: 1
- **Stage**: Phase 1 - Contract And Route Realignment
- **Symptom**: `npx nx run @sps/rbac:tsc:build` failed before target completion because dependency task `@sps/blog:tsc:build` fails with unresolved import/type issues.
- **Root Cause**: Pre-existing repository-wide TypeScript health issue in dependency projects, not caused by phase-1 social-thread changes.
- **Fix**: No local phase-1 code rollback; recorded blocker and isolated verification attempts (`--excludeTaskDependencies`) to confirm failure source.
- **Reusable Pattern**: When phase checks run through dependency graph, capture first failing dependency task and classify as external blocker before attempting phase-local refactors.

### Incident 2 — Header typing failure with optional RBAC secret key

- **Occurrences**: 1
- **Stage**: Phase 1 - Contract And Route Realignment
- **Symptom**: TypeScript error on API calls using `headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY }` because value is inferred as `string | undefined`.
- **Root Cause**: `RBAC_SECRET_KEY` is optional at type level; direct header assignment violates `HeadersInit` expectations in strict checks.
- **Fix**: Added explicit guard (`if (!RBAC_SECRET_KEY) throw ...`) before header construction and reused the narrowed `RBAC_SECRET_KEY` string for SDK header usage.
- **Reusable Pattern**: For env-backed auth headers, never pass optional env vars directly; always guard once and propagate a strict local string.

### Incident 3 — Nested thread URL not resolved by host page lookup

- **Occurrences**: 1
- **Stage**: Phase 4 - Frontend Thread Selector, Creation, And Path Sync
- **Symptom**: Canonical URL `/social/chats/:chatId/threads/:threadId` could 404 because host page resolution requires equal URL part count and only `/social/chats/[social.chats.id]` page existed.
- **Root Cause**: `host/page` `findByUrl` pre-filter compares URL segment lengths before expanding dynamic masks; without a page mask that includes `threads/[social.threads.id]`, nested route cannot be matched.
- **Fix**: Added dedicated host page seed `/social/chats/[social.chats.id]/threads/[social.threads.id]` and duplicated required `pages-to-layouts` + `pages-to-widgets` links for chat list/overview widgets.
- **Reusable Pattern**: Whenever introducing deeper canonical routes, create a matching host page mask and required relation rows, otherwise dynamic segment extraction can fail before widget rendering.

### Incident 4 — Raw fetch used where SPS SDK is required

- **Occurrences**: 1
- **Stage**: Phase 2/3 follow-up hardening
- **Symptom**: Helper methods for default-thread bootstrap used raw `fetch` calls to `/api/social/threads` and `/api/social/chats-to-threads`.
- **Root Cause**: Temporary workaround to force same-origin runtime routing bypassed the repository rule to use SDK for model/relation access.
- **Fix**: Replaced raw `fetch` with `serverApiFactory` + model SDK metadata (`route/query/options`) and passed runtime `apiBaseUrl` as SDK `host`.
- **Reusable Pattern**: For internal model/relation writes, use SDK clients only; if dynamic port/origin is required, inject it via SDK `host` instead of switching to raw HTTP calls.

## Summary

### Changes Made

- Added canonical subject profile-thread message route/SDK contract: `GET|POST /rbac/subjects/{id}/social-module/profiles/{socialModuleProfileId}/chats/{socialModuleChatId}/threads/{socialModuleThreadId}/messages`.
- Added backend thread invariants: default-thread bootstrap on chat create, chat-thread ownership checks, and thread-message linking.
- Aligned OpenRouter + agent reply flow to trigger-message thread with legacy threadless backfill into default thread.
- Added frontend thread selector/create + canonical path sync in chat overview and switched message list create/find to thread-scoped endpoints.
- Added host seed route mask for `/social/chats/[social.chats.id]/threads/[social.threads.id]` with required relations for widget rendering.
- Added explicit guard pattern for optional `RBAC_SECRET_KEY` before env-backed header usage and documented the pattern in ISSUE-154 thoughts research/progress artifacts.
- Removed raw `fetch` in thread-bootstrap helpers and restored SDK-based writes with dynamic host binding to the active API origin.
- Migrated ISSUE-154 scenario test-utils to SDK-based API access (subject/social SDK) and removed raw request helper usage.
- Added ISSUE-154 behavior tests for normalization idempotence and scenario-level routing/thread invariants.
- Removed temporary file-inspection regression test from `agent/backend/app/api` to keep committed tests behavior-focused.

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [x] All phases completed
- [ ] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-04-12T11:20:00Z
