# Studio Chat and Thread continuation

Status: verified locally; publication pending

## Current work

Chat and Thread become `ai-chat-overview`; the sending form moves from Social
Thread Composer to RBAC Subject `ai-chat-message-create`. Host injects the form
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
PR #371 branch: `codex/ai-chat-ui-review`; last verified head:
`d866962dac2ae4efe880fe044c95707ce67fde04`.
Publish only explicit scoped commits through an isolated checkout at the current
PR head. The local branch includes unrelated production history. Preserve all
foreign dirty workspace, workflow and production files.
