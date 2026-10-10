# Studio Chat and Thread continuation

Status: complete

## Current work

Chat and Thread use `ai-chat-overview`; RBAC Subject `ai-chat-message-create`
owns the sending form. Host injects the form
through the Chat/Thread `messageCreate` slot. Conversation remains the Thread's
message list, composed from Social Message views.

ThreadProvider derives its initial identity/title from the Source and retains
state under Profile's mounted local preview scope. Thread overview reuses that
scope; Chat has no provider or profileId prop. Products is fixture content.

## Verification

Registries, story/block/Figma metadata, page manifests and inventory match the
model ownership. 287 tests in 40 files pass, including Strategy source titles
and nested provider reuse. Types, metadata, inventory, content freshness, code
placement and Storybook production build pass.

Browser checks pass for text and file-only sending, removing a pending file,
Working On, draft preservation through project settings, history through New
thread/Cancel, and 320px sending without horizontal overflow. Error logs are
empty. Temporary tabs are closed and viewport controls reset; the user's tab
and Storybook server remain open.

Evidence: `/private/tmp/studio-thread-ownership.png`,
`/private/tmp/studio-thread-narrow.png`. Test/build logs:
`/private/tmp/studio-thread-tests.log`, `/private/tmp/studio-thread-build.log`.

## Publication

Local starting HEAD: `a4203c840a38304206442b09e432733e3c0417f7`.
Local implementation: `196774ccddac5207a2c639bf44d81496c8dd3214`.
Published implementation: `74c12d0af92deac16fda76b6f64b49926e1dea4a`.
PR #371 branch: `codex/ai-chat-ui-review`. The published head and updated
description are verified. All affected files match the isolated PR checkout;
unrelated production commit `94f63c6a75` is excluded.

Future publication must use explicit scoped commits through an isolated checkout
at the current PR head. The local branch includes unrelated production history.
Preserve foreign dirty workspace, workflow and production files. The saved PR
description is `thoughts/shared/prs/371_description.md`; its historical checks
remain distinct from the current 287-test verification.
