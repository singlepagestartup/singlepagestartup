# Studio responsive layout continuation

Status: verified locally; publication pending

## Current work

Replace width-driven rendering in Social Profile project overview with one
responsive sidebar. Remove the Sidebar `mobile` prop and fix stretched
registration fields. Source files belong to `apps/studio/modules`; no production
imports, relations or SDK calls are required.

## Verification

285 tests across 40 files pass, as do TypeScript, metadata, content, inventory,
code placement and diff checks. Storybook builds. Browser checks pass for sidebar
controls, backdrop, Escape/focus, list state through resizing, project settings
and thread navigation. Widths 320, 799, 800 and 1200 px have no horizontal
scrolling. The 760px container boundary uses CSS alone. Registration keeps a
20px gap at 320, 767, 1000 and 1192 px; empty-submit validation focuses Email.
Browser error logs are empty. Temporary tabs are closed and viewport overrides
are reset. Screenshot: `/private/tmp/studio-registration-responsive.png`.

Working code has no `isMobile`, `isDesktop`, media-query hooks or width observers
in `apps/studio/modules`. Imported runnable prototypes' unused shadcn copies
remain outside this Storybook change. ArtifactFrame's export scaling and the
editor's explicit preview-width selector remain intact.

## Publication

Local branch: `codex/studio-host-models`; starting HEAD: `7663fde33e`.
PR #371: `codex/ai-chat-ui-review`; starting head:
`d36864ab397b7302e4ffcc3c1c5b719ac8c52cfe`.
Publish explicit scoped commits through an isolated worktree at the verified PR
head. Do not push the local branch: it includes unrelated production history.
Preserve all existing dirty files outside this task. The previous account
settings plan and handoff contain that completed task's verification.
