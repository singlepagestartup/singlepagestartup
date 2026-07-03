---
issue_number: 203
issue_title: "Synchronize Figma components with the Storybook module catalog"
repository: singlepagestartup
created_at: 2026-07-02T22:02:56Z
last_updated: 2026-07-03T22:08:04Z
status: active
current_phase: implement
---

# Process Log: ISSUE-203 - Synchronize Figma components with the Storybook module catalog

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: in_progress
- Current phase: implement
- Next step: complete implementation and submit PR.

## Phase Notes

### Create

- Summary: Created GitHub issue #203 for synchronizing the Figma `Single Page Startup` component catalog with `apps/drafts/modules` Storybook module/model variants.
- Outputs: Ticket at `thoughts/shared/tickets/singlepagestartup/ISSUE-203.md`; process log at `thoughts/shared/processes/singlepagestartup/ISSUE-203.md`; GitHub issue at `https://github.com/singlepagestartup/singlepagestartup/issues/203`; Project status set to `Research Needed`.
- Notes: User provided the task statement and asked to use `core-00-create`. Assumed priority `medium`, size `large`, and type `feature` based on the cross-module Figma/code synchronization scope. Initial local scan found 133 Storybook story files, 133 `figma.json` files, and 109 `block.manifest.json` files under `apps/drafts/modules`.

### Research

- Summary: Documented current Storybook module catalog structure, local `block.manifest.json` / `page.manifest.json` / `figma.json` coverage, validation behavior, Figma file page/component inventory, Figma shared plugin metadata, and issue #201 historical context for the deferred remote Figma sync scope.
- Outputs: Research artifact at `thoughts/shared/research/singlepagestartup/ISSUE-203.md`; GitHub research summary comment at `https://github.com/singlepagestartup/singlepagestartup/issues/203#issuecomment-4870932679`; Project status moved to `Research in Review`.
- Notes: Current checkout snapshot has 133 Storybook story files, 109 block manifests, 24 page manifests, and 133 `figma.json` files. Figma read-only inspection found 13 component sets and 45 component variants across `website-builder`, `host`, `blog`, `ecommerce`, `social`, and `rbac`; scanned Figma has no component sets for `crm` or `startup`. Verification passed with `npm run drafts:ds:validate` and `npm run drafts:storybook:build`; fresh Storybook `index.json` contains 154 entries.

### Plan

- Summary: Created and revised the implementation plan for full module-by-module Figma synchronization with the Storybook module catalog. The plan resolves the research open questions by including missing `crm` and `startup` Figma pages, relation-backed blocks, stale remote shared metadata cleanup, schema-status normalization, and the user's added requirement to place Storybook screenshots beside added or updated Figma components for review.
- Outputs: Plan artifact at `thoughts/shared/plans/singlepagestartup/ISSUE-203.md`.
- Notes: User clarified the plan after the scope checkpoint by adding the Storybook screenshot reference requirement; treated that as confirmation of the proposed full-sync phasing with the screenshot addition. Plan revision on 2026-07-03: existing `website-builder` Figma components are read-only for this issue; implementation may create missing `website-builder` components, update components in other modules, and add missing module pages when absent in Figma.

### Implement

- Summary: Started implementation after GitHub Project status entered `Ready for Dev`; Project status moved to `In Dev`. Completed Phase 1 by creating the reconciliation ledger from the current checkout and Figma read-only inventory. Completed Phase 2 by normalizing local Figma metadata and extending draft validation for manifest/`figma.json` consistency. Completed Phase 3 by capturing optimized Storybook screenshots for all create/update ledger rows. Completed Phase 4/5 by synchronizing 110 create/update Figma variants, adding 110 adjacent Storybook reference frames with 129 thumbnails, preserving existing `website-builder` components, and writing final Figma IDs back into local metadata.
- Outputs: Progress artifact at `thoughts/shared/handoffs/singlepagestartup/ISSUE-203-progress.md`; reconciliation ledger at `apps/drafts/inventory/figma-sync.md`; validator extension in `tools/drafts/design-system/validate.ts`; synchronized metadata in `apps/drafts/modules/**/{block,page}.manifest.json` and `figma.json`.
- Notes: GitHub comments after the plan sync marker only contained the already-applied plan revision summary for preserving existing `website-builder` Figma components; no additional scope change blocked implementation. Phase 1 found inventory drift against the research snapshot and rebuilt the ledger from fresh counts: 128 manifest rows, 98 create actions, 12 update actions, and 18 preserve actions. User added a Figma write constraint on 2026-07-03: created/updated components and adjacent Storybook screenshot references must be positioned with deterministic spacing so they do not overlap. Phase 2 normalized 128 metadata pairs, removed legacy `pending` / `synced` sync statuses, and passed `npm run drafts:ds:validate`. Phase 3 captured 129 unique Storybook screenshots for 110 create/update rows. Phase 4 uploaded all 129 screenshots to Figma, removed 129 temporary upload nodes, and passed Figma bounding-box overlap QA after moving the issue-203 review boards on `social` and `website-builder` to free canvas space.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 6 -->

### Incident 1 - GitHub API blocked in sandbox

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: Initial GitHub helper run printed `error connecting to api.github.com` and returned an empty issue URL.
- **Root Cause**: The default sandboxed shell context did not have network access to GitHub.
- **Fix**: Re-ran the same `.claude/helpers/create_issue_with_project.sh` flow with escalated network access, creating issue #203, adding it to Project #2, and moving it to `Research Needed`.
- **Preventive Action**: For `core-00-create`, if `gh` fails with `error connecting to api.github.com`, repeat the same helper-driven `bash -lc` block with network escalation instead of replacing it with ad hoc GitHub commands.
- **References**: `.codex/skills/core-00-create/SKILL.md`; `.claude/commands/core/00-create.md`; `.claude/helpers/create_issue_with_project.sh`.

### Incident 2 - Research sub-agent instruction conflicted with available tool contract

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: The canonical research command asks agents to spawn parallel sub-agents, but the available `multi_agent_v1.spawn_agent` tool contract says not to spawn unless the user explicitly asks for delegation or sub-agents.
- **Root Cause**: The current Codex tool-level instruction is more specific to this session's available tool behavior than the provider-neutral workflow text.
- **Fix**: Performed the required research sequentially and preserved the same artifact/output contract.
- **Preventive Action**: For future Codex research runs, use sub-agents only when the current tool contract permits it; otherwise record the reason and proceed sequentially.
- **References**: `.claude/commands/core/10-research.md`; `thoughts/shared/research/singlepagestartup/ISSUE-203.md`.

### Incident 3 - Figma Code Connect unavailable for current account/tool access

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: Figma Code Connect map calls returned a plan/seat limitation instead of mappings.
- **Root Cause**: The connected Figma account/tool reported that Code Connect requires a Dev or Full seat on an Organization or Enterprise plan.
- **Fix**: Used read-only Figma Plugin API inspection through `use_figma` and `get_metadata` to gather page, component, variant, and shared plugin data inventory.
- **Preventive Action**: Do not rely on Code Connect availability for this issue; start with `use_figma` read-only inventory when inspecting the file.
- **References**: `thoughts/shared/research/singlepagestartup/ISSUE-203.md`.

### Incident 4 - Planning paused for Figma sync scope confirmation

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: The issue asks for module-by-module Figma synchronization, but the research surfaced unresolved choices about whether to create missing `crm` and `startup` Figma groups, whether relation-backed blocks should become components, whether remote old-style shared metadata paths should be rewritten, and how to normalize `pending` / `synced` sync statuses.
- **Root Cause**: The requested Figma sync spans both remote design structure and local metadata contracts, while the current Figma file is only partially aligned with the Storybook catalog.
- **Fix**: Paused before writing the full plan, summarized the intended scope and phased outline, then proceeded after the user added the Storybook screenshot reference requirement, confirming the full-sync direction with an extra deliverable.
- **Preventive Action**: For broad Figma/catalog sync issues, perform an explicit scope checkpoint after research before committing to a plan artifact.
- **References**: `.claude/commands/core/20-plan.md`; `thoughts/shared/research/singlepagestartup/ISSUE-203.md`.

### Incident 5 - Research inventory drifted before implementation

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: The research snapshot reported 109 block manifests, 133 `figma.json` files, and 154 Storybook index entries, but the current checkout produced 104 block manifests, 128 `figma.json` files, and 149 Storybook index entries after a fresh build.
- **Root Cause**: The workspace changed after research; the implementation checkout includes draft catalog edits and untracked draft module metadata that were not present in the research snapshot.
- **Fix**: Rebuilt the reconciliation ledger from the current checkout and a fresh `npm run drafts:storybook:build` result instead of reusing stale research counts.
- **Preventive Action**: At the start of broad catalog sync implementation, refresh local manifest counts, Storybook index counts, and Figma inventory before writing synchronization artifacts.
- **References**: `apps/drafts/inventory/figma-sync.md`; `thoughts/shared/research/singlepagestartup/ISSUE-203.md`.

### Incident 6 - Figma image import APIs differed from browser/runtime expectations

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: Direct Storybook screenshot import through Figma plugin code was unreliable: `fetch`, `XMLHttpRequest`, `TextDecoder`, and `figma.createImageAsync` were unavailable, and an initial manual base64 path was fragile. A later attempt to use `figma.loadAllPagesAsync()` for multi-page ID reading failed because that API is unsupported in the current MCP runtime.
- **Root Cause**: The Figma MCP `use_figma` runtime exposes a narrower Plugin API surface than the full documented/browser-like environment.
- **Fix**: Used the Figma `upload_assets` tool for JPEG upload, POSTed files to the returned upload URLs, used returned `imageHash` values as image fills, removed the temporary upload nodes, and used `PageNode.loadAsync()` for consolidated read-only ID inventory.
- **Preventive Action**: For future Figma screenshot placement, prefer `upload_assets` for raster assets and avoid relying on browser APIs inside `use_figma`; for read-only multi-page inventory, use `PageNode.loadAsync()` rather than `loadAllPagesAsync()`.
- **References**: `apps/drafts/inventory/figma-sync.md`; `thoughts/shared/handoffs/singlepagestartup/ISSUE-203-progress.md`.

## Reusable Learnings

- For Figma/Storybook sync work, start from the Storybook module catalog and local metadata inventory before creating new Figma nodes, because existing `figma.json` and `block.manifest.json` coverage can differ.
- The target Figma file already stores SPS shared plugin metadata on many component nodes, but sampled values can use older path conventions; compare remote shared metadata against local `figma.json` before updating nodes.
- For issue-203-style Figma screenshot placement, keep review frames in auto-layout rows and run bounding-box QA after placement; enlarged screenshot boards can overlap existing top-level component sets unless moved to free canvas space.
