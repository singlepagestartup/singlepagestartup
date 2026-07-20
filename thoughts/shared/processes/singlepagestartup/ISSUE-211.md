---
issue_number: 211
issue_title: "Telegram bootstrap race creates duplicate RBAC grants and breaks message processing"
repository: singlepagestartup
created_at: 2026-07-20T07:43:57Z
last_updated: 2026-07-20T20:42:20Z
status: active
current_phase: complete
---

# Process Log: ISSUE-211 - Telegram bootstrap race creates duplicate RBAC grants and breaks message processing

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: complete
- Next step: human live Telegram verification and code review in PR #212

## Phase Notes

### Create

- Summary: Onboarded the existing, fully specified GitHub issue into the repository workflow.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-211.md`, GitHub Project item for issue #211.
- Notes: The issue existed outside GitHub Project #2, so it had no status gate until this onboarding step.

### Research

- Summary: Reproduced concurrent RBAC grant corruption against the current service semantics and verified that the Telegram adapter ignores the bootstrap checkout decision. Confirmed the local restored database is clean but still lacks all three natural-key constraints.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-211.md`.
- Notes: Existing free-subscription service checks are sequentially idempotent; simultaneous provisioning is not covered. The existing Agent conversation lock is process-local and outside bootstrap.

### Plan

- Summary: Defined database natural keys as the RBAC correctness boundary, a transactionally checked data repair before generated migrations, and a reusable PostgreSQL advisory lock for the cross-repository free-subscription side effect. Added correlated, sanitized Telegram diagnostics and true concurrency verification.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-211.md`.
- Notes: The phase outline was explicitly approved before the full plan was written. A Telegram-local queue is intentionally out of scope because it cannot protect shared state across processes.

### Implement

- Summary: Implemented database-enforced RBAC grant identity, transactional repair, repository-backed concurrency convergence, cross-process subscription locking, Telegram checkout routing, and correlated safe diagnostics.
- Outputs: `thoughts/shared/handoffs/singlepagestartup/ISSUE-211-progress.md`, `thoughts/shared/prs/212_description.md`, PR #212.
- Notes: All automated unit, integration, typecheck, build, lint, migration, and database verification passed. Live Telegram acceptance remains for the human Code Review gate as requested.

## Incident Log

<!-- incident-count: 3 -->

### Incident 1 — Existing issue was not attached to the configured Project

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: `get_issue_status.sh 211` could not find the issue in GitHub Project #2.
- **Root Cause**: Issue #211 was created in the target repository but had not been added to the configured Project.
- **Fix**: Added it through `.claude/helpers/add_issue_to_project.sh` and initialized the local ticket/process artifacts.
- **Preventive Action**: Create or onboard issues through the shared Project helper before dispatching `core-next`.
- **References**: `.claude/helpers/add_issue_to_project.sh`, `.claude/commands/core/00-create.md`.

### Incident 2 — Existing OpenRouter attachment test depends on local API URL

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: Full RBAC unit verification had one unrelated URL assertion failure under the configured `apps/api/.env` origin.
- **Root Cause**: The test hard-codes `http://localhost:4000` while production code uses the configured public API service URL.
- **Fix**: Made the fixture derive the expected public origin from `NEXT_PUBLIC_API_SERVICE_URL`; the final 66-suite RBAC unit run passed.
- **Preventive Action**: URL tests must use the same service-origin configuration as the code under test.
- **References**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts`.

### Incident 3 — Drizzle metadata upgrades must run sequentially

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: The three scoped migration generators all stopped at `drizzle-kit up` when launched concurrently and emitted no actionable diagnostic.
- **Root Cause**: The metadata upgrade step has shared process/workspace behavior and is not concurrency-safe in this setup.
- **Fix**: Run the required Nx repository generators sequentially; all three generated only the expected composite unique index.
- **Preventive Action**: Do not parallelize repository-generate targets that include `drizzle-kit up`.
- **References**: `libs/modules/rbac/project.json`.

## Reusable Learnings

- An existing GitHub issue without a Project item must be onboarded before status-gated workflow phases can run.
