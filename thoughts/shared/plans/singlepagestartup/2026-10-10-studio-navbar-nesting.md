# Studio AI Chat navbar folders

Status: complete

Website Builder Widget navbar samples live in sibling folders:
`singlepage/navbar/ai-chat` and `singlepage/navbar/ai-chat-landing`.
Each folder owns its Component, index, story and block/Figma metadata.
The public variant `navbar-ai-chat-landing` and its Storybook ID remain stable.

The registry, relative model imports, Storybook group, Figma code paths/sync key
and generated inventory use `navbar/ai-chat-landing`. Host Layout composition,
slots, routes and visuals are unchanged.

## Verification

- [x] 292 tests across 41 files; TypeScript, metadata/inventory, copy freshness, code placement and diff checks.
- [x] Storybook production build at `/private/tmp/studio-navbar-nesting-storybook`.
- [x] Browser: sibling navbar groups, both samples, one Host landing navbar/footer and Try anchor; empty error logs. Temporary tabs are closed.
- [x] Scoped implementation and PR #371 publication; GitHub head and description verified.

Browser evidence: `/private/tmp/studio-navbar-nesting.png`. Check logs use `/private/tmp/studio-navbar-nesting-*.log`.

## Publication

- Local implementation: `2304b04d83ad34b927e04599d7ea932d06b10918`.
- Published implementation: `073da491ad353b60ad000c4fa00587cde927e283` on `codex/ai-chat-ui-review`.
- PR: https://github.com/singlepagestartup/singlepagestartup/pull/371.
- All 15 changed paths/deletions match the checked implementation. The clean publication checkout excludes unrelated production commit `94f63c6a75`.
