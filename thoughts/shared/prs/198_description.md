## Summary

Implements the corrected Issue #193 OpenRouter skill behavior: profile-linked `social.skill` records are invoked from chat with slash syntax and attached to the triggering user message as text instructions. The replying AI profile remains the system/persona context, and `@knowledge` continues to opt into profile-scoped RAG.

## Changes

- Changed `react-by/openrouter` so selected profile skills are expanded into a message-prefix instruction block on the latest user message instead of being injected as system messages.
- Added a profile persona system block from the replying `social.profile` title/subtitle/description.
- Kept Knowledge fragments in system grounding context only when `@knowledge` is requested, and kept `/learn` reserved.
- Updated composer slash handling so `/` shows `/learn` plus active skills linked to the replying profile; `@` now remains scoped to `@knowledge`.
- Updated `social.skill` chat display variants to show slash invocation (`/skill-slug`) where skills are used as chat commands.
- Added BDD coverage for slash parsing, linked-profile scoping, message prefix placement, profile persona context, frontend picker behavior, and stale skill badge clearing.

## Verification

- [x] `npx nx run @sps/rbac:jest:test --testFile=libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts`
- [x] `npx nx run @sps/rbac:jest:test --testFile=libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.spec.tsx`
- [x] `npx nx run @sps/rbac:tsc:build`
- [x] Browser verification with `npm run api:dev`: opened an authenticated AI chat, confirmed `/` and `@knowledge /` show `/learn` plus linked `/youtube-description`, ArrowDown+Tab inserts `/youtube-description`, a single selected skill badge appears, and keyboard deletion clears it.

## Notes

- No migrations or schema changes.
- The planned `npm run test:file -- <path>` helper currently fails before Jest because it calls `nx run` without a project; equivalent direct `npx nx run @sps/rbac:jest:test --testFile=...` commands were used.
