---
issue_number: 192
issue_title: "feat: enable profile-scoped Knowledge RAG in social chats"
start_date: 2026-05-25T21:31:51Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-192.md
status: in_progress
---

# Implementation Progress: ISSUE-192 - feat: enable profile-scoped Knowledge RAG in social chats

**Started**: 2026-05-25
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-192.md`

## Phase Progress

### Phase 1: Social Variant And RBAC SDK Surface

- [x] Started: 2026-05-25T21:36:43Z
- [x] Completed: 2026-05-25T21:54:54Z
- [x] Automated verification: `npx nx run @sps/social:tsc:build`; `npx nx run @sps/rbac:tsc:build`; `npx nx run @sps/rbac:jest:test`

**Notes**: Added the `knowledge` chat variant plus RBAC controller route and server/client SDK action surface.

### Phase 2: Knowledge Chat Learning API

- [x] Started: 2026-05-25T21:36:43Z
- [x] Completed: 2026-05-25T21:54:54Z
- [x] Automated verification: `npx nx run @sps/knowledge:tsc:build`; `npx nx run @sps/knowledge:jest:test`

**Notes**: Added deterministic chat-learn document upsert, profile-document linking, and service-level indexing through `KnowledgeService.index({ documentId })`.

### Phase 3: RBAC Knowledge Reaction Handler

- [x] Started: 2026-05-25T21:36:43Z
- [x] Completed: 2026-05-25T21:54:54Z
- [x] Automated verification: `npx nx run @sps/rbac:tsc:build`; `npx nx run @sps/rbac:jest:test`

**Notes**: Added `/react-by/knowledge` handler with chat/profile/message validation, `/learn` ingestion, text/markdown attachment collection, Knowledge generation, and social assistant message persistence.

### Phase 4: Agent Dispatch Integration

- [x] Started: 2026-05-25T21:36:43Z
- [x] Completed: 2026-05-25T21:54:54Z
- [x] Automated verification: `npx nx run @sps/agent:tsc:build`; `npx nx run @sps/agent:jest:test`

**Notes**: Added Knowledge dispatch for `chat.variant="knowledge"` plus `chat-gpt-*` artificial-intelligence profiles while preserving existing OpenRouter and Telegram paths.

### Phase 5: Knowledge Chat Frontend

- [x] Started: 2026-05-25T21:36:43Z
- [x] Completed: 2026-05-25T21:54:54Z
- [x] Automated verification: `npx nx run @sps/rbac:jest:test`

**Notes**: Extended the current default chat composer with a Knowledge-only upward `/learn` command picker, command description, focus behavior, and submit/attachment regression coverage.

### Phase 6: End-To-End Verification And Documentation

- [x] Started: 2026-05-25T21:36:43Z
- [x] Completed: 2026-05-25T21:54:54Z
- [x] Automated verification: all targeted module tsc/jest checks passed; `git diff --check` passed.

**Notes**: Updated Knowledge and Social READMEs. Manual browser/DB/LLM smoke from the plan was not run in this session.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 1 -->

### Incident 1 — Frontend command test environment gaps

- **Occurrences**: 3
- **Stage**: Phase 5 - Knowledge Chat Frontend
- **Symptom**: The new command picker spec failed on missing `ResizeObserver`, missing `scrollIntoView`, and unavailable jest-dom matchers such as `toBeDisabled`.
- **Root Cause**: The RBAC frontend Jest environment is jsdom without browser-only APIs and without jest-dom matcher setup, while shadcn/cmdk command primitives expect those APIs during layout effects.
- **Fix**: Added test-local jsdom polyfills for `ResizeObserver`, `scrollTo`, and `scrollIntoView`; used plain DOM property assertions instead of jest-dom-only matchers.
- **Reusable Pattern**: For RBAC frontend specs around command/popover primitives, add local browser API polyfills in `beforeEach` and assert native DOM properties unless the package explicitly configures jest-dom.

## Summary

### Changes Made

- Added profile-scoped Knowledge/RAG chat reaction route and SDKs under RBAC.
- Added Knowledge chat-learning upsert/indexing API for deterministic documents linked to AI profiles.
- Routed Knowledge chats from Agent through `/react-by/knowledge` for `chat-gpt-*` AI profiles.
- Added Knowledge-only `/learn` command picker to the existing default social chat composer.
- Added BDD tests for Knowledge service ingestion, RBAC reaction validation/generation, Agent dispatch, and frontend command picker/submission behavior.
- Documented Knowledge chat learning in module READMEs.

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-05-25T21:54:54Z
