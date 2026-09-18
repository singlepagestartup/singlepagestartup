---
issue_number: 232
issue_title: "Map PostgreSQL unique violations to HTTP 409 without exposing database details"
repository: singlepagestartup
created_at: 2026-09-17T23:12:39Z
last_updated: 2026-09-17T23:12:39Z
status: active
current_phase: research
---

# Process Log: ISSUE-232 - Map PostgreSQL unique violations to HTTP 409 without exposing database details

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

- Summary: The issue was created directly on GitHub on 2026-09-09 from a didigallery production log audit. No local process or ticket artifact existed before the research phase.
- Outputs: https://github.com/singlepagestartup/singlepagestartup/issues/232
- Notes: Label `size:small`; type bug; priority medium.

### Research

- Summary: Documented the full error path for a PostgreSQL `23505` during create: driver `PostgresError` fields, Drizzle and repository passthrough, `getHttpErrorType` branch order and 500 fallback, identical REST handler catch blocks, exception filter logging and client payload, per-hop re-wrapping through `responsePipe` and per-app `onError` filters, existing module-level duplicate recovery, the unique-field inventory, test coverage and target names, and README documentation drift. Verified every upstream line reference in the issue against `29370bcbf8`.
- Outputs:
  - `thoughts/shared/tickets/singlepagestartup/ISSUE-232.md`
  - `thoughts/shared/research/singlepagestartup/ISSUE-232.md`
- Notes:
  - Research ran in the worktree `.claude/worktrees/issues-2026-09-18` without GitHub status changes or issue comments; the parent session owns those steps.
  - `http-error/index.spec.ts` fails 6 of 65 cases at HEAD (422 block); see Incident 3.
  - The didigallery `service/startup/compose.ts` path named in the issue does not exist upstream, as the issue itself states.

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

### Incident 1 — Editorial-pass contract missing

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: `CLAUDE.md` directs agents to `.agents/contracts/editorial-pass.md` and `.codex/skills/unslop/SKILL.md`; neither path exists in the worktree, and no file matching `*editorial*` or `*unslop*` exists outside `node_modules`.
- **Root Cause**: The contract referenced by the shared instructions has not been added to the repository, or was removed without updating `CLAUDE.md`.
- **Fix**: Applied the editorial goals stated in `CLAUDE.md` directly (preserve meaning, uncertainty, terminology, formatting, and voice; English only) to the ticket, research, and process prose.
- **Preventive Action**: Restore the contract file or update `CLAUDE.md`/`AGENTS.md` to point at the location that exists; until then, treat the `CLAUDE.md` sentence as the contract.
- **References**: `CLAUDE.md` (Key rules section), `.agents/contracts/`

### Incident 2 — Worktree has no `node_modules`

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: `node_modules/postgres` and `npx nx` were unavailable inside the worktree, so driver types and the mapper spec could not be inspected or run the usual way.
- **Root Cause**: Worktrees are created without running `npm install`.
- **Fix**: Read driver, Drizzle, and Hono sources from the main checkout's installed packages by absolute path (read-only), and ran the single spec from inside the worktree with `/Users/rogwild/code/singlepagestartup/sps-lite/node_modules/.bin/jest --config libs/shared/backend/utils/jest.config.ts --rootDir libs/shared/backend/utils <spec>`; Node resolves `ts-jest`, `@nx/jest/preset`, and `hono` from the ancestor `node_modules` directory.
- **Preventive Action**: For read-only verification in a worktree, use the main checkout's jest binary with the worktree's config; run `npm install` in the worktree only when an implementation phase needs Nx targets.
- **References**: `jest.server-preset.js`, `libs/shared/backend/utils/jest.config.ts`

### Incident 3 — Pre-existing failures in the mapper spec

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: `libs/shared/backend/utils/src/lib/http-error/index.spec.ts` reports `6 failed, 59 passed` at `29370bcbf8`; every failure is in the `422 - Unprocessable Entity error` block (`index.spec.ts:100-114`).
- **Root Cause**: Commit `9d60d206df` (2025-10-23) removed the 422 pattern entry from `paterns/index.ts` without updating the spec; the later spec change `d7aa6ea70c` left the block in place. `Invalid body['data']` now maps to 400 through `/invalid (data|body)/i`, the other three messages to 500.
- **Fix**: None in this phase (research is documentation-only). Recorded so later phases do not attribute these failures to new conflict-mapping work.
- **Preventive Action**: When the plan adds scenarios to this spec, state explicitly how the pre-existing 422 block is handled and run the suite through `npx nx run @sps/backend-utils:test` (the project declares `test`, not `jest:test`).
- **References**: `libs/shared/backend/utils/src/lib/http-error/index.spec.ts:100-114`, `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts`, `libs/shared/backend/utils/project.json`, `README.md:451-459`

## Reusable Learnings

- `postgres` 3.4.5 exposes `code`, `constraint_name`, `table_name`, `column_name`, `schema_name`, and `detail` as own properties of `PostgresError`; Drizzle 0.38.4 and the shared repository `insert` pass that object through unchanged, so handler-level code can read the structured fields directly.
- `getHttpErrorType`'s JSON branch (`http-error/index.ts:11-44`) is the only place a downstream HTTP status crosses a server-SDK hop; any status added on an inner hop is preserved there, but the category falls back to `Internal error` unless a prefix or pattern matches.
- Each Hono app level registers its own `ExceptionFilter`; Hono wraps mounted routes with the innermost custom `onError`, so log amplification comes from HTTP hops between model apps, not from nested `app.route` levels within one process.
- `@sps/backend-utils` runs its Jest suite through the Nx target `test` (executor `@nx/jest:jest`), while `@sps/shared-backend-api` uses `jest:test`; neither package is in `package.json` `test:unit:shared` or `test:unit:scoped`.
- The sandbox rejects compound Bash commands that use arithmetic on shell variables or multi-line heredocs in a worktree session; use `awk` ranges or the Write tool instead of `$((...))` and `cat <<EOF`.
