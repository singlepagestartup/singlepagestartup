# Studio variant naming continuation

Status: complete

The complete map and checklist are in
`thoughts/shared/plans/singlepagestartup/2026-10-10-studio-variant-naming.md`.
Follow Overview/List ownership, semantic folder groups and final ai-chat suffix.
Message List replaces Thread Conversation. Subject still creates messages.
Retain mounted providers, navigation, snapshots, attachments and fixture knowledge.

Starting local HEAD: `ef94d94e61f0ea5c4fd877229527c45351502999`.
Verified PR #371 head: `874d5d2c62b3e85dff7cd4c2f321cb7c05c1231c`.
Publish only explicit commits through an isolated PR checkout. Preserve foreign
workspace, workflow and production changes; root contains unrelated history.

## Result

The 45 display variants use purpose-first keys and nested folders, ending in
ai-chat. Message owns List and Overview; Thread composes the List. Project
Select Item names its selector context. Agent and Skill defaults describe
knowledge editing. Products remains the fixture knowledge title.

Local implementation: `b6f4107a415507fbd33f57712901d0227d9a744f`.
Published implementation: `cf954f2f6e9823cfe685df691cb7e4f27ca8eccd`.
PR: https://github.com/singlepagestartup/singlepagestartup/pull/371.

All 558 changed paths match between the tested local tree and the isolated PR
checkout. GitHub confirms the implementation head and saved description.
Foreign workspace, workflow, uploaded-file and production edits are excluded.

291 tests across 41 files, Studio TypeScript, metadata/inventory/content checks,
code placement and Storybook build pass. Browser checks cover Message List
story discovery, Working on and sending, New thread name/agent selection,
Cancel preserving history, login redirect and landing composition. At 320px,
width and scroll width match and Send is visible. Browser error logs are empty;
temporary tabs and viewport overrides are cleared. Storybook runs on 4321.

Screenshot: `/private/tmp/studio-variant-naming.png`.
Build: `/private/tmp/studio-naming-storybook` (temporary verification output).
