# Studio Chat, Thread and Subject ownership

Status: complete

## Structure

Profile owns the project frame. Chat `ai-chat-overview` displays Thread
`ai-chat-overview`. Thread's Conversation maps records to Social Message views.
RBAC Subject `ai-chat-message-create` owns the sending form. Host Page supplies
that view through a `messageCreate` slot; Social imports no RBAC component.

Products is the Knowledge Source example's title. Chat and Thread variants and
state providers use domain names. Thread's identity and document title derive
from its Source. The local Thread provider retains drafts and history across
preview page navigation; it performs no SDK requests or relation lookups.

## Work

- [x] Rename Chat and Thread variants and public props to overview; update their
      stories, metadata, registries, manifests and generated inventory.
- [x] Replace ProductsThreadProvider with a reusable ThreadProvider that uses
      Source data and reuses an existing scope. Keep one effective state provider.
- [x] Move Composer to RBAC Subject message-create and compose its slot at Host.
- [x] Make thread labels and message context use the displayed knowledge title.
- [x] Verify model boundaries, a differently named Source, message sending,
      attachments, Working On, draft/history persistence and responsive layout.
- [x] Publish the scoped changes to PR #371 and record the implementation IDs.

## Verification

287 tests in 40 files pass, including Strategy source titles and reuse of an
existing Thread scope. TypeScript, metadata, inventory, content freshness, code
placement and Storybook production build pass. Browser checks cover text and
file-only sending, attachment removal, Working On, draft preservation through
project settings, history through New thread/Cancel, and sending at 320px with
no horizontal overflow. Browser error logs are empty.

Evidence: `/private/tmp/studio-thread-ownership.png`,
`/private/tmp/studio-thread-narrow.png`. Logs:
`/private/tmp/studio-thread-tests.log`, `/private/tmp/studio-thread-build.log`.

## Publication

Local implementation: `196774ccddac5207a2c639bf44d81496c8dd3214`.
Published implementation: `74c12d0af92deac16fda76b6f64b49926e1dea4a`.
[PR #371](https://github.com/singlepagestartup/singlepagestartup/pull/371) head
and description match the scoped publication. All affected files match the
isolated PR checkout; unrelated production history and dirty files are excluded.

## Continuation

See `thoughts/shared/handoffs/singlepagestartup/studio-chat-thread-ownership-2026-10-10.md`.
