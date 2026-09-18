---
issue_number: 230
issue_title: "Validate PayKeeper webhook identifiers before relation lookup"
repository: singlepagestartup
created_at: 2026-09-17T23:13:12Z
last_updated: 2026-09-17T23:13:12Z
status: active
current_phase: research
---

# Process Log: ISSUE-230 - Validate PayKeeper webhook identifiers before relation lookup

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

- Summary: The GitHub issue was created directly from a production log-watch audit; no local ticket or process artifact existed before the research phase.
- Outputs: https://github.com/singlepagestartup/singlepagestartup/issues/230
- Notes: Ticket file created during research from the issue body.

### Research

- Summary: Documented the PayKeeper creation and webhook branches, the provider-webhook controller, the shared REST find path, the error-normalization chain, request-id plumbing, sibling provider validation, and existing BDD specs. Verified the issue's location claims and found that the shared query builder rewrites non-UUID `eq` filters on UUID columns to a text `LIKE`, which contradicts the issue's failure mechanism; the origin of the literal `undefined` in the signature was not identified from code.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-230.md`, `thoughts/shared/research/singlepagestartup/ISSUE-230.md`
- Notes: Research was performed in a read-only worktree session without GitHub status or comment changes; the parent agent relays the summary. Live Postgres (`sps-lite-db-1`) was queried read-only to confirm UUID cast versus `LIKE` behavior.

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

### Incident 1 — Issue mechanism contradicted by shared query builder

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: The issue states that a non-canonical `orderid` fails inside the shared REST find handler against the UUID column.
- **Root Cause**: `libs/shared/backend/api/src/lib/query-builder/filters.ts:114-128` (commit `053ff12df0d`, 2025-10-31) replaces `eq` with `LIKE '%value%'` on `CAST(column AS TEXT)` when `isUuid(value)` is false, so Postgres never receives the invalid UUID literal. The issue compared only the PayKeeper service, the webhook controller, and the find handler between local and upstream, not the query builder.
- **Fix**: Recorded the contradiction in the research document with a read-only Postgres check showing `22P02` for direct equality and success for the `LIKE` form; left the origin of the literal `undefined` as an open question.
- **Preventive Action**: When an issue cites a stack frame in a shared handler, trace the full path below the handler (service, repository, query builder) before accepting the stated mechanism.
- **References**: `thoughts/shared/research/singlepagestartup/ISSUE-230.md` (Detailed Findings, Relation lookup path; Issue claims table)

### Incident 2 — Editorial-pass contract missing in the worktree

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: `CLAUDE.md` requires `.agents/contracts/editorial-pass.md` and `.codex/skills/unslop/SKILL.md`; neither exists at commit `29370bcbf8`.
- **Root Cause**: The worktree is checked out at a commit that predates those files or the reference was added without the files.
- **Fix**: Applied a plain editorial pass (concise prose, preserved meaning and uncertainty, English only) without the contract.
- **Preventive Action**: Verify referenced contract paths exist before relying on them; if absent, note it and proceed with the general rule.
- **References**: `CLAUDE.md`, `.agents/contracts/`

### Incident 3 — Worktree harness rejects compound and heredoc shell commands

- **Phase**: Research
- **Occurrences**: 3
- **Symptom**: Bash calls combining `git` with other commands, using a shell variable in a path, or writing files through a heredoc were refused by the worktree-isolation check.
- **Root Cause**: The isolation guard cannot prove that compound or variable-driven commands stay inside the worktree.
- **Fix**: Split `git` calls into single plain commands, spelled out absolute paths instead of variables, and used the Write tool for artifact creation.
- **Preventive Action**: In worktree sessions, keep each `git` invocation in its own plain command and write artifacts with the Write tool.
- **References**: This session's Bash refusals

## Reusable Learnings

- The shared query builder guards UUID `eq` filters with `isUuid` and falls back to text `LIKE`; a non-UUID value therefore returns an empty array or substring matches rather than a database error.
- Nested server SDK calls do not forward `x-request-id`; each nested API request receives a new id, and `getHttpErrorType` drops the nested `requestId` captured by `response-pipe`.
- Provider webhook secret verification is per provider: CloudPayments, TipTopPay, and Telegram Star check a secret before acting; PayKeeper requires `PAYKEEPER_WEBHOOK_SECRET` to exist but never reads it.
