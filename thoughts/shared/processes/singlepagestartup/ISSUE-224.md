---
issue_number: 224
issue_title: "Prevent server API function objects from crossing shared Server/Client component boundaries"
repository: singlepagestartup
created_at: 2026-08-03T21:21:37Z
last_updated: 2026-09-17T23:22:41Z
status: active
current_phase: research
---

# Process Log: ISSUE-224 - Prevent server API function objects from crossing shared Server/Client component boundaries

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

- Summary: Created production bug issue #224 from a proven shared Server-to-Client serialization defect and moved it through Triage to Research Needed.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-224.md`, `thoughts/shared/processes/singlepagestartup/ISSUE-224.md`, https://github.com/singlepagestartup/singlepagestartup/issues/224.
- Notes: Type `bug`, priority `medium`, size `medium`; Project #2 status verified as Research Needed.

### Research

- Summary: Verified all eight dispatcher line ranges and the server factory fingerprint against commit `29370bcbf8`; documented the identical pattern in `subject-default` and the four admin-v1 dispatchers, the `"use client"` / `"use server"` placement in every branch file, the adapter prop order (`Component`, `Provider`, `clientApi`, `serverApi`, `{...props}`), the `isServer` contract (required boolean, no default, literal `false` in admin-v2 table/row/controller), the host render roots (`isServer={true}` everywhere except `layout.tsx:42`), the admin-v2 path (sidebar/cards in Server mode; overview tables switched to Client mode inside `"use client"` wrappers, 61/61), and the test setup (14 leaf-level Jest specs, no RSC boundary rendering anywhere). No static Server Component call site rendering a `serverApi`-carrying dispatcher with `isServer={false}` was found; the ticket's line references are all still accurate.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-224.md`.
- Notes: Issue has no comments; ticket unchanged. Research ran in a worktree without GitHub status or comment side effects; the orchestrating session owns the issue comment and status transition.

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

<!-- incident-count: 3 -->

### Incident 1 — Project item was not immediately visible to the status helper

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: `create_issue_with_project.sh` created issue #224 and reported a successful Project add, but its immediate Triage update failed because the item lookup did not yet find issue #224 in Project #2.
- **Root Cause**: The newly added GitHub Project item was not visible to the lookup helper immediately after `gh project item-add`; visibility completed after a short propagation delay.
- **Fix**: Waited five seconds, then reran the canonical status helper for `Triage` and `Research Needed`; both updates succeeded and `get_issue_status.sh` verified `Research Needed`.
- **Preventive Action**: If item creation succeeds but the immediate lookup fails, do not recreate the issue or use a different Project path; retry the canonical status helper after a short bounded delay.
- **References**: `.claude/helpers/create_issue_with_project.sh`, `.claude/helpers/add_issue_to_project.sh`, `.claude/helpers/update_issue_status.sh`, `.claude/helpers/get_issue_status.sh`.

### Incident 2 — Editorial-pass contract referenced by CLAUDE.md does not exist

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: `CLAUDE.md` instructs agents to run the editorial pass defined in `.agents/contracts/editorial-pass.md` (Codex: `.codex/skills/unslop/SKILL.md`); neither file exists in the repository, and no file under `.agents`, `.codex`, or `.claude` matches `editorial` or `unslop`.
- **Root Cause**: Documentation references a contract that was never added (or was removed) from the checked-in tree.
- **Fix**: Applied a plain editorial pass (clear prose, preserved meaning, uncertainty, terminology, and formatting) to the research artifact and this log without a canonical checklist.
- **Preventive Action**: Treat the missing contract as a known gap; do not block a phase on it. Flag for `utilities/post_commit_retro.md` so the contract is either added or the CLAUDE.md / AGENTS.md references are corrected.
- **References**: `CLAUDE.md` ("Before storing, publishing, or returning prose ..."), `.agents/contracts/`, `.codex/`.

### Incident 3 — Worktree Bash guard refuses compound shell commands

- **Phase**: Research
- **Occurrences**: 2
- **Symptom**: Two batched Bash commands were refused with "this command is too complex to verify that it stays inside the worktree" even though every path was relative to the worktree.
- **Root Cause**: The worktree isolation guard rejects compound constructs such as `[ -f "$f" ] && { ...; }` and multi-file `for` loops mixing tests and braces; plain `for f in ...; do cat -n "$f"; done` loops, `cat ... 2>&1`, and single `git log` / `git show` invocations pass.
- **Fix**: Split the batches into simpler commands (one `git` command per call; `cat -n path 2>&1` instead of existence tests).
- **Preventive Action**: In worktree sessions, avoid `[ -f ] &&`, `{ }` groups, and `| cat` after `git` commands; issue one plain command per file group.
- **References**: This session's Bash calls for `libs/modules/blog/models/article/...` and `libs/shared/frontend/components/**/*.spec.*` listings.

## Reusable Learnings

- Next.js serialization errors that expose the full generated server API method set can be mapped safely to `libs/shared/frontend/server/api/src/lib/factory/index.ts` without retaining request data.
- A successful Project item add can precede lookup visibility by a few seconds; a bounded helper retry preserves workflow correctness without duplicate creation.
- Whether a shared dispatcher's `{...props}` spread crosses an RSC boundary depends on the importing module, not on the dispatcher file: adapters imported from a `"use client"` file (all 61 admin-v2 overview table wrappers) are client-bundled end to end, while adapters reached from a Server Component must serialize every prop. When auditing boundary bugs, classify each call site by its nearest `"use client"` ancestor first.
- `grep -L '"use client"' $(grep -rl 'isServer={false}' ...)` is a cheap first filter for boundary audits; in this repository it yields 113 files, of which only four render `find` variants and only two of those have static callers (both `"use client"`).
- `.agents/contracts/engineering/knowledge-first.md:40` links to `process-artifact-contract.md`; the actual file is `.agents/contracts/engineering/process-artifact.md`.
