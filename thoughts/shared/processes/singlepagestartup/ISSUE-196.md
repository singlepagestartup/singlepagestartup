---
issue_number: 196
issue_title: "feat: add universal admin visual editor overlay for frontend components"
repository: singlepagestartup
created_at: 2026-06-12T21:07:05Z
last_updated: 2026-06-13T19:24:25Z
status: active
current_phase: plan
---

# Process Log: ISSUE-196 - feat: add universal admin visual editor overlay for frontend components

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: in_progress
- Implement: not_started
- Current phase: plan
- Next step: Await explicit approval of the proposed plan outline, then write `thoughts/shared/plans/singlepagestartup/ISSUE-196.md`.

## Phase Notes

### Create

- Summary: Created GitHub issue #196 for a universal admin visual editor overlay visible to authenticated `admin` users and moved it to Research Needed.
- Outputs: Ticket `thoughts/shared/tickets/singlepagestartup/ISSUE-196.md`; process log `thoughts/shared/processes/singlepagestartup/ISSUE-196.md`; GitHub issue https://github.com/singlepagestartup/singlepagestartup/issues/196.
- Notes: The task came from a screenshot showing an orange component outline with module/model labels and `Edit` / `Delete` controls. Missing workflow fields were inferred as `priority: medium`, `size: medium`, and `type: feature`. The helper-based create sequence added the issue to GitHub Project #2 and moved status from `Triage` to `Research Needed`.

### Research

- Summary: Researched current host admin/admin-v2 RBAC gating, shared admin-v2 primitives, Website Builder widget wrapper conventions, public widget rendering path, widget admin-v2 create/edit/delete flows, shared shadcn Sheet/Dialog availability, and existing MCP content-management host graph behavior.
- Outputs: Research artifact `thoughts/shared/research/singlepagestartup/ISSUE-196.md`.
- Notes: Live code shows `/admin...` routing to `AdminV2` through the host catch-all page, while non-admin routes still mount the legacy `Admin` component alongside the resolved public page. The Website Builder widget path was traced from host page composition through `pages-to-widgets`, host widgets, `widgets-to-external-widgets`, and Website Builder widget variants. Shared admin-v2 row/controller overlays currently use `Dialog`, `Sheet`, and `AlertDialog` from `@sps/shared-ui-shadcn`. Public wrappers already expose `data-module`, `data-model`/`data-relation`, `data-id`, and `data-variant`; current code does not expose a shared admin-only visual-editor wrapper that outlines arbitrary public components and opens edit/delete surfaces inline.

### Plan

- Summary: Started planning and moved issue 196 to Plan in Progress. Read workflow instructions, ticket, process log, research artifact, and GitHub issue comments; verified load-bearing code paths for admin RBAC gating, shared admin-v2 action surfaces, and Website Builder widget rendering.
- Outputs: Pending plan outline approval; no plan artifact written yet.
- Notes: Proposed planning interpretation is that the first implementation uses always-visible overlays for authenticated admins on opted-in components, without a global visual-edit mode toggle in this issue. The visible outline should be applied at the source-module component wrapper level for the initial website-builder/widget integration, while Host graph metadata remains contextual rather than owning the first visible outline. Shared code should remain metadata/callback-driven and must not import website-builder-specific forms.

### Implement

- Summary:
- Outputs:
- Notes:

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 3 -->

### Incident 1 — GitHub network blocked by sandbox during config preflight

- **Phase**: Create
- **Occurrences**: 2
- **Symptom**: The initial `load_config.sh` preflight during create and the first GitHub helper call during research both printed `error connecting to api.github.com` messages in sandboxed execution.
- **Root Cause**: GitHub network access is restricted in the default sandbox.
- **Fix**: Reran the same helper-driven GitHub status/user commands with escalated network access; helper-based workflow operations then completed normally.
- **Preventive Action**: When the SPS create workflow sees GitHub connectivity errors in sandboxed execution, rerun the unchanged helper block with network escalation instead of rewriting the helper sequence.
- **References**: `.codex/skills/core-00-create/SKILL.md`; `.claude/commands/core/00-create.md`; `.claude/helpers/create_issue_with_project.sh`.

### Incident 2 — Shell glob expansion on Next catch-all route path

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: Reading `apps/host/app/[[...url]]/page.tsx` without quoting the path failed with `zsh: no matches found`.
- **Root Cause**: zsh interpreted the square brackets in the Next.js catch-all route segment as a glob pattern.
- **Fix**: Reran the file-read command with the path wrapped in single quotes.
- **Preventive Action**: Quote App Router paths that contain square brackets when reading them from zsh.
- **References**: `apps/host/app/[[...url]]/page.tsx`; `.claude/commands/core/10-research.md`.

### Incident 3 — Planning ambiguity and locator timeout before plan write

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: Research left open questions about global visual-edit mode, nested wrapper outline ownership, and browser-side form callback versus host-graph content editing. One codebase-locator sub-task also timed out before returning.
- **Root Cause**: The ticket intentionally asks to consider overlay behavior choices, and the workflow requires explicit approval of the plan outline before writing the plan file.
- **Fix**: Paused before creating `thoughts/shared/plans/singlepagestartup/ISSUE-196.md`, proposed concrete planning assumptions and phase structure to the user, and closed the timed-out locator after local spot-checks plus other sub-task results supplied enough context.
- **Preventive Action**: For ambiguous visual editor work, state the overlay visibility, outline ownership, and editor callback assumptions in the outline approval checkpoint before writing the full plan.
- **References**: `.claude/commands/core/20-plan.md`; `thoughts/shared/research/singlepagestartup/ISSUE-196.md`.

## Reusable Learnings

- Use `.claude/helpers/create_issue_with_project.sh` for new SPS issues so GitHub issue creation, project assignment, and status transition fail fast in one helper-driven sequence.
- Quote Next.js App Router catch-all paths such as `apps/host/app/[[...url]]/page.tsx` in zsh commands to avoid bracket glob expansion.
