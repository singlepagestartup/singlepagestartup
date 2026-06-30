---
issue_number: 201
issue_title: "Migrate remaining runnable drafts into the Storybook module catalog"
repository: singlepagestartup
created_at: 2026-06-29T22:24:46Z
last_updated: 2026-06-30T23:22:41Z
status: active
current_phase: implement
---

# Process Log: ISSUE-201 - Migrate remaining runnable drafts into the Storybook module catalog

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: implement
- Next step: Create PR, move issue to Code Review, and let the user review the running Storybook catalog before any Figma work.

## Phase Notes

### Create

- Summary: Created GitHub issue #201 for completing the `apps/drafts/runnable` to Storybook module catalog migration and auditing model/module ownership against `libs/modules`.
- Outputs: Ticket at `thoughts/shared/tickets/singlepagestartup/ISSUE-201.md`; process log at `thoughts/shared/processes/singlepagestartup/ISSUE-201.md`; GitHub issue at `https://github.com/singlepagestartup/singlepagestartup/issues/201`; Project status set to `Research Needed`.
- Notes: User provided the problem statement and asked to use `core-00-create`. Assumed priority `medium`, size `large`, and type `refactoring` based on scope. The issue was created with size label `size:large`.

### Research

- Summary: Documented the current `apps/drafts` Storybook/runnable split, runnable manifests and route surfaces, Storybook catalog counts, design-system inventory/validation contracts, and model ownership map against `libs/modules`.
- Outputs: Research artifact at `thoughts/shared/research/singlepagestartup/ISSUE-201.md`; verification commands `npm run drafts:validate`, `npm run drafts:ds:validate`, and `npm run drafts:storybook:build` all passed.
- Notes: Current Storybook catalog has 100 discoverable `Component.stories.tsx` files (plus 2 non-discoverable `*.draft-story.tsx`), 85 block manifests, 17 page manifests, and no relation draft directories. Current runnable area has four valid manifests, including duplicated React/Vite app trees for `singlepage/admin-v2` and `startup/singlepagestartup`.
- Post-research verification (2026-06-30): re-checked every file:line citation and count against live code. Corrected the story-file count (was stated as 102; actually 100 `Component.stories.tsx`) and several off-by-one/section-anchor line numbers (`.storybook/main.ts:5`, `block.schema.json:51`, block manifests `:8`, root `README.md:9`, drafts `README.md:90`, `content-default/Component.tsx:75`, `discovery.ts:43-57`). Module ownership READMEs, variant anchors, inventory totals, and verification-command results all verified accurate. GitHub research comment updated to match.

### Plan

- Summary: Created the implementation plan after user confirmation of the inventory-first migration interpretation. The plan phases cover runnable inventory and ownership mapping, Storybook discoverability fixes, reusable public block/page migration, an explicit admin/admin-v2 Storybook migration lane, runnable cleanup/retention, and final Storybook verification.
- Outputs: Plan artifact at `thoughts/shared/plans/singlepagestartup/ISSUE-201.md`.
- Notes: The plan treats runnable React apps as source material, not target architecture. Reusable surfaces move to module-owned Storybook blocks/pages; retained runnable entries require documented standalone reasons. Reviewer clarification on 2026-07-01 confirmed that the admin panel/admin-v2 runnable surface is in Storybook migration scope, so the plan was revised to make admin a dedicated phase. A later 2026-07-01 clarification explicitly deferred all remote Figma transfer/sync/create/update work until after user Storybook review and approval; current implementation scope is only repository code in runnable and Storybook-backed drafts.

### Implement

- Summary: Implementation completed after the user confirmed continuing through all phases without separate phase pauses. Runnable source material is classified in the migration matrix; reusable public, chat/profile, and admin/admin-v2 surfaces are represented by Storybook host page recipes or module-owned blocks; retained runnable scope is documented.
- Outputs: Progress artifact at `thoughts/shared/handoffs/singlepagestartup/ISSUE-201-progress.md`; migration matrix at `apps/drafts/inventory/runnable-migration.md`; runnable contract at `apps/drafts/runnable/README.md`; updated `apps/drafts/README.md`; new/updated Storybook module entries under `apps/drafts/modules`; regenerated inventory at `apps/drafts/inventory/modules.generated.json`.
- Notes: Storybook migration stayed inside repository code only. No Figma file/plugin/sync work was performed. The only retained standalone runnable entry is `singlepage/examples/basic-html`; imported React/admin source trees remain only as traceability/source material until user Storybook review. Verification passed with `npm run drafts:validate`, `npm run drafts:ds:inventory`, `npm run drafts:ds:validate`, and `npm run drafts:storybook:build`. Browser verification confirmed the running Storybook index and representative preview iframe stories for host admin dashboard, chat page, admin model edit, and startup override.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 2 -->

### Incident 1 - GitHub API blocked in sandbox

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: Initial GitHub config/label check printed `error connecting to api.github.com`.
- **Root Cause**: The default sandboxed shell context did not have network access to GitHub.
- **Fix**: Re-ran the same GitHub helper/config flow with escalated network access, then used `.claude/helpers/create_issue_with_project.sh` to create issue #201, add it to Project #2, and transition it to `Research Needed`.
- **Preventive Action**: For `core-00-create`, if `gh` fails with `error connecting to api.github.com`, repeat the same helper-driven block with network escalation instead of replacing it with ad hoc GitHub commands.
- **References**: `.codex/skills/core-00-create/SKILL.md`; `.claude/commands/core/00-create.md`; `.claude/helpers/create_issue_with_project.sh`.

### Incident 2 - Planning paused for migration scope confirmation

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: The ticket uses broad migration wording: remaining runnable components can mean full deletion/move of all runnable code, selective promotion into Storybook, or explicit retention of runnable-only prototypes.
- **Root Cause**: `core-20-plan` requires explicit intent confirmation before writing a new plan when ticket language includes ambiguous migration/classification scope.
- **Fix**: Paused before creating `thoughts/shared/plans/singlepagestartup/ISSUE-201.md` and requested confirmation of the intended interpretation and phase outline.
- **Preventive Action**: Treat issue #201 as inventory-first classification, then migrate only reusable Storybook blocks/pages, document intentional runnable retention, and avoid deleting runnable prototypes unless the plan explicitly calls it out.
- **References**: `.claude/commands/core/20-plan.md`; `thoughts/shared/tickets/singlepagestartup/ISSUE-201.md`; `thoughts/shared/research/singlepagestartup/ISSUE-201.md`.

## Reusable Learnings

- Use `apps/drafts/README.md` as the draft workspace contract before moving runnable code: module first, then `models` or `relations`, then entity, then `singlepage` or `startup`.
- `npm run drafts:ds:validate` verifies current draft manifests, but production source membership is enforced only for block manifests with `state: "ready"`; draft-state blocks still require manual ownership review against `libs/modules`.
- `npm run drafts:storybook:build` is a reliable smoke check for the Storybook catalog after drafts changes; the generated preview index is `dist/drafts/storybook/index.json`.
- A block manifest can pass `drafts:ds:validate` yet still be invisible to Storybook: the validator only checks that the `files.story` target exists, while Storybook discovers stories via the glob `apps/drafts/modules/**/*.stories.@(ts|tsx|mdx)` (`apps/drafts/.storybook/main.ts:5`). The two startup-module widget drafts use `*.draft-story.tsx`, which the glob does not match, so manifest counts overstate the live catalog by 2. Count `*.stories.tsx` for discoverable stories, not block/page manifests.
- For issue #201 implementation, keep remote Figma transfer blocked until the user confirms Storybook is correct. Local `figma.json` edits are metadata maintenance only and are not evidence of remote Figma work.
- Storybook route parity should be checked through `http://127.0.0.1:4320/index.json` and representative `iframe.html` previews, because a successful static build alone does not prove that all host page route stories are exposed under the expected IDs.
