---
issue_number: 227
issue_title: "Coerce JSON date values in generic MCP content mutations"
repository: singlepagestartup
created_at: 2026-08-04T19:24:08Z
last_updated: 2026-09-17T23:12:51Z
status: active
current_phase: research
---

# Process Log: ISSUE-227 - Coerce JSON date values in generic MCP content mutations

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: not_started
- Implement: not_started
- Current phase: research
- Next step: human review, then core/20-plan

## Phase Notes

### Create

- Summary: Confirmed the MCP JSON-date validation mismatch in the current `sps-lite` checkout, created GitHub issue #227, added it to organization Project 2, and transitioned it from `Triage` to `Research Needed`.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-227.md`, `thoughts/shared/processes/singlepagestartup/ISSUE-227.md`, and https://github.com/singlepagestartup/singlepagestartup/issues/227.
- Notes: Issue type `bug`, priority `medium`, and size `small` were inferred from the reproduced, bounded adapter defect. Related foundation work is issue #187. The shared helper completed issue creation, Project assignment, and both status transitions without incident.

### Research

- Summary: Documented the live MCP mutation path at `29370bcbf8`. The coercion the issue proposes already exists: commit `29fa75fec7` (merged through PR #228 on 2026-08-04, about one hour after the issue was opened) added `coerceJsonDateFields` to `apps/mcp/lib/content-management/operations.ts:173-210` and wired it into `parseCreateData` and `parseUpdateData`, with five BDD date scenarios in `operations.spec.ts`. Verified the remaining issue claims (input schemas, descriptor `type: "date"` derivation, Drizzle-Zod `z.date()` mapping, backend repository string-to-Date conversion) and recorded the three claims HEAD contradicts. Items not found in live code: ISO-8601 caller guidance, `date`-typed schema examples, `.default()`/`ZodEffects` spec coverage, and a serialized-envelope assertion. `npx jest -c apps/mcp/jest.config.ts` on `operations.spec.ts` and `schemas.spec.ts` passes 23 tests.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-227.md`.
- Notes: Research ran in the `issues-2026-09-18` worktree without GitHub status changes or issue comments; the issue has no comments, so the ticket needed no update. Read-only `gh issue view` confirmed the ticket matches the issue body.

### Plan

- Summary:
- Outputs:
- Notes:

### Implement

- Summary:
- Outputs:
- Notes:

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 2 -->

### Incident 1 — Issue root cause already fixed on main before research started

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: The ticket and issue describe `parseCreateData` and `parseUpdateData` as passing raw JSON to `insertSchema`, but live `operations.ts:212-240` already calls `coerceJsonDateFields`, and `operations.spec.ts` already contains date scenarios the ticket says do not exist.
- **Root Cause**: Commit `29fa75fec7` was authored and merged (PR #228, branch `codex/review-issue-227-and-suggest-fixes`) within about 25 minutes on 2026-08-04, one hour after issue creation, while the GitHub Project status stayed at `Research Needed` and no issue comment or `thoughts/shared/prs/228_description.md` linked the PR to the issue.
- **Fix**: Treated live code as the source of truth, recorded the contradiction table in the research document, and reframed the research around what the merged change covers and what remains absent.
- **Preventive Action**: Before decomposing a research question, run `git log --oneline -- <paths named in the issue>` and compare the latest commit dates against the issue creation date; check `git branch -a --contains` and merge history for branches named after the issue number.
- **References**: `git show 29fa75fec7`, `git log -1 961fe1bc37`, `thoughts/shared/research/singlepagestartup/ISSUE-227.md` ("Git history of the coercion change", "Issue claims versus live code").

### Incident 2 — Editorial-pass contract path referenced by CLAUDE.md does not exist

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: `CLAUDE.md` instructs agents to apply `.agents/contracts/editorial-pass.md` (and Codex to load `.codex/skills/unslop/SKILL.md`), but neither file exists in the worktree; `find` over `.agents` and `.codex` returns no `editorial` or `unslop` match.
- **Root Cause**: The instruction references a contract that was never added or was removed without updating `CLAUDE.md` and `AGENTS.md`.
- **Fix**: Applied a plain editorial pass (remove filler, keep meaning, terminology, and uncertainty) to the research prose without a canonical checklist.
- **Preventive Action**: Add the contract file or remove the reference from `CLAUDE.md` and `AGENTS.md`; until then, agents should note the missing file rather than skip the pass.
- **References**: `CLAUDE.md` ("final editorial pass" paragraph), `.agents/contracts/`, `.codex/skills/`.

## Reusable Learnings

- Generic MCP write adapters must normalize JSON transport representations before validating against runtime schemas that require non-JSON JavaScript types such as `Date`.
- When an issue names concrete functions, check the git history of their files against the issue creation date before researching; a fix may already be merged under a differently named branch or PR without an issue link.
- Three zod-unwrapping helpers with different wrapper coverage exist (`apps/mcp/lib/content-management/registry.ts:188-214`, `apps/mcp/lib/content-management/operations.ts:118-159`, `libs/shared/backend/api/src/lib/repository/database/index.ts:20-30`); any plan touching date handling should state which one it extends.
