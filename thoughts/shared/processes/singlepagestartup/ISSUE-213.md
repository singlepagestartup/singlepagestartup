---
issue_number: 213
issue_title: "Make cross-module operations concurrency-safe and idempotent"
repository: singlepagestartup
created_at: 2026-07-20T23:32:10Z
last_updated: 2026-07-21T19:08:53Z
status: active
current_phase: research
---

# Process Log: ISSUE-213 - Make cross-module operations concurrency-safe and idempotent

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: in_progress
- Plan: not_started
- Implement: not_started
- Current phase: research
- Next step: obtain explicit approval to send the corrected research summary to GitHub, then post it and move to Research in Review

## Phase Notes

### Create

- Summary: Created umbrella issue #213 for the cross-module concurrency risks discovered during the issue #211 follow-up audit and moved it through Triage to Research Needed.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-213.md`, `thoughts/shared/processes/singlepagestartup/ISSUE-213.md`, and https://github.com/singlepagestartup/singlepagestartup/issues/213.
- Notes: Issue #211 is already in Code Review, so the new implementation scope was kept in a separate gated issue. A read-only Browser baseline confirmed authenticated Telegram/Admin access, one rapid `/start` error, duplicated Help replies, and the rendered incomplete cart. Import inspection confirmed the allowed dependency direction shared → domain → RBAC orchestration → Agent/transport. GitHub creation required escalated network access; the shared helper then added the issue to Project #2 and completed both status transitions successfully.

### Research

- Summary: Reused and live-verified the issue #211 follow-up audit, separating the delivered RBAC/Telegram concurrency boundary from the remaining cross-module transaction, state, and external-side-effect behavior.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-213.md`.
- Notes: Current durable primitives are scoped to RBAC natural keys/repair, Telegram bootstrap/free-subscription advisory locks, and selected upsert/hash identities. Remaining balance mutations are application-level read/modify/write, OAuth consumption is read/check/update rather than a conditional claim, and no operation-attempt, inbox, outbox, lease model, or `Idempotency-Key` use was found in the inspected paths. The authoritative artifact is locally complete; its corrected GitHub checkpoint is awaiting explicit user approval for the external data transfer.

### Plan

- Summary:
- Outputs:
- Notes:

### Implement

- Summary:
- Outputs:
- Notes:

## Incident Log

<!-- incident-count: 3 -->

### Incident 1 — GitHub API unavailable in the restricted sandbox

- **Phase**: Create / Research
- **Occurrences**: 2
- **Symptom**: Repository-context preflight and the research status gate could not connect to `api.github.com` from the restricted command environment.
- **Root Cause**: Network access is restricted for ordinary workspace commands.
- **Fix**: Re-ran the same shared helper workflows with escalated network access; issue creation/Project assignment and the later research status read completed successfully.
- **Preventive Action**: Preserve the helper sequence and escalate its network access when the documented GitHub connectivity error occurs; do not replace it with raw or partial `gh` calls.
- **References**: `.codex/skills/core-00-create/SKILL.md`, `.codex/skills/core-10-research/SKILL.md`, `.claude/helpers/create_issue_with_project.sh`, `.claude/helpers/get_issue_status.sh`

### Incident 2 — Read-only research delegate closed the workflow prematurely

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: A pattern-finding delegate wrote the research/process artifacts, posted a GitHub summary, and moved the issue to `Research in Review` before the other research tasks completed. Its draft also described application-level balance read/modify/write as atomic arithmetic and OAuth read/check/update as compare-and-set. A later process edit added unsupported live-log/database claims about a `telegram-bot` system actor.
- **Root Cause**: Parallel delegates inherited the surrounding primary-workflow context and acted beyond their explicitly assigned read-only documentary scopes.
- **Fix**: Restored the Project status to `Research in Progress`, waited for all replacement/focused research results, replaced the draft with a full synthesis, and removed unsupported claims that no delegate could substantiate.
- **Preventive Action**: Research delegates return evidence only; the primary workflow agent alone writes canonical artifacts, posts checkpoints, and changes Project status after synthesis and validation.
- **References**: `.codex/agents/codebase-pattern-finder.toml`, `.codex/agents/codebase-locator.toml`, `.claude/commands/core/10-research.md`, `thoughts/shared/research/singlepagestartup/ISSUE-213.md`

### Incident 3 — Corrected GitHub checkpoint required explicit transfer approval

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: The attempt to post the fully synthesized correction to issue #213 was denied because the comment would transfer repository research details to GitHub.
- **Root Cause**: External-data policy requires explicit user approval after disclosure of this risk; invoking the workflow skill did not satisfy the approval reviewer for this specific transfer.
- **Fix**: Kept the Project status at `Research in Progress`, preserved the completed local artifact, and requested explicit approval before retrying the documented issue-comment helper.
- **Preventive Action**: When a research checkpoint contains workspace-derived details, surface the transfer destination and obtain explicit approval if the policy reviewer requires it before closing the phase.
- **References**: `.claude/helpers/gh_issue_comment.sh`, `.claude/commands/core/10-research.md`, `thoughts/shared/research/singlepagestartup/ISSUE-213.md`

## Reusable Learnings

- Cross-module concurrency fixes must distinguish database identity, aggregate atomicity, state claims, and external-side-effect idempotency; one advisory-lock pattern is not sufficient for every class.
- Parallel research agents must not mutate workflow artifacts or GitHub state; phase closure remains a primary-agent responsibility after synthesis.
