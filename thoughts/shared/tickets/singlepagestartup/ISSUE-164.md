# Issue: Port draft chat UI into SPS subject social module

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/164
**Status**: Research Needed
**Created**: 2026-04-25
**Priority**: high
**Size**: medium
**Type**: feature

---

## Problem to Solve

The current subject social-module chat UI in the main SPS project is still a draft implementation and does not match the more complete chat experience already designed in `apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx`.

We need to port the draft chat page look-and-feel into the main project and wire it to the real SPS subject/social data flows. The result should replace the current rough UI under `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module` while preserving SPS architecture and composition rules.

The implementation must not be a direct copy of the draft monolith. It should adapt the UX into the existing SPS model/relation/component structure and use the already added chat/thread methods in the main project.

## Key Details

- The visual source of truth is `apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx`, specifically the three-column chat workspace and mobile panel behavior exposed at `http://127.0.0.1:5173/chat` when running `npm run drafts:dev -- singlepagestartup`.
- The target integration surface is `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module`, where the current subject chat list, chat overview, and message list components are still primitive.
- The main project already contains subject-level chat and thread methods that should be reused rather than reinvented:
  - chat create/find
  - chat find-by-id
  - thread create/find for a chat
  - message create/find/update/delete
  - action create/find
- Existing host composition already routes social chat pages through:
  - `/social/chats/[social.chats.id]`
  - `/social/chats/[social.chats.id]/threads/[social.threads.id]`
- The migrated UI must respect SPS data boundaries:
  - use SDK providers for data access
  - use relation `variant="find"` composition where related entities are needed
  - preserve the RBAC subject orchestration layer instead of bypassing it with direct social module wiring from host surfaces

## Implementation Notes

- Follow repository documentation first, especially the SPS root README, `libs/modules/rbac/README.md`, `libs/modules/rbac/models/subject/README.md`, and `libs/modules/social/README.md`.
- Keep Tailwind-only styling; do not introduce ad-hoc CSS files.
- Preserve SPS component splitting by concern:
  - chat list
  - chat item
  - chat overview shell
  - thread list presentation
  - message/thread view
- Reuse the existing subject/social route shape and host wrappers instead of inventing a parallel navigation model.
- The migration should prioritize the existing supported subject chat APIs and should not assume unsupported chat/thread/member management methods exist unless a separate backend/API extension is explicitly planned.
