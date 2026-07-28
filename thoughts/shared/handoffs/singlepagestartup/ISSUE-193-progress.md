---
date: 2026-06-15T00:00:00Z
issue_number: 193
repository: singlepagestartup
branch: codex/issue-193-openrouter-skill-prefix
status: complete
completed_date: 2026-06-15T00:00:00Z
pr_number: 198
pr_url: https://github.com/singlepagestartup/singlepagestartup/pull/198
---

# ISSUE-193 Implementation Progress

## Current Objective

Implement OpenRouter-compatible SPS skills as text instructions attached to the beginning of the triggering user message, with slash invocation scoped to active skills linked to the replying profile.

## Progress

- Created implementation branch `codex/issue-193-openrouter-skill-prefix`.
- Synchronized GitHub issue comments through `2026-06-14T23:10:50Z`.
- Updated process log to mark corrected implementation in progress.
- Updated `react-by/openrouter` so slash-invoked linked profile skills are expanded into the triggering user message prefix instead of system context.
- Added profile persona system context from the replying `social.profile`.
- Kept `@knowledge` as the RAG switch and `/learn` as a reserved command.
- Updated composer command handling so `/` shows `/learn` plus linked active profile skills; `@` remains scoped to `@knowledge`.
- Updated `social.skill` chat display variants to show slash invocation (`/skill-slug`) where the skill is used as a chat command.

## Verification

- Passed: `npx nx run @sps/rbac:jest:test --testFile=libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts`.
- Passed: `npx nx run @sps/rbac:jest:test --testFile=libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.spec.tsx`.
- Passed: `npx nx run @sps/rbac:tsc:build`.
- Passed Browser check on `http://localhost:3000/en/social/chats/55eea53b-d6d8-44ef-9fb5-14ad0d79031d`: `/` and `@knowledge /` list `/learn` and `/youtube-description`; ArrowDown+Tab inserts `/youtube-description`; deleting the slash skill clears the badge.

## Notes

- `npm run api:dev` was started for Browser verification and stopped after checks.
- Opening the older user-provided `bdbd3330.../42e59...` URL produced a host page 404 because that page URL is no longer present in local data; verification used the available `RAG` AI chat instead.
- The `npm run test:file -- <path>` helper script currently fails before running Jest because it calls `nx run` without a project. Direct `npx nx run @sps/rbac:jest:test --testFile=...` was used.

## Summary

- Implementation complete.
- PR: https://github.com/singlepagestartup/singlepagestartup/pull/198.
- Awaiting code review.
