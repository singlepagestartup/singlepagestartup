---
repository: singlepagestartup
issue_number: 226
status: Research Needed
created: 2026-08-04
---

# Issue: Remove legacy pre-development files after downstream project migration

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/226
**Issue**: #226
**Status**: Research Needed
**Created**: 2026-08-04
**Priority**: low
**Size**: small
**Type**: refactoring

---

## Problem to Solve

Two migration-era documents remain available for compatibility while projects
derived from SinglePageStartup move to the new client pre-development
architecture. They become misleading duplicate knowledge after every maintained
downstream project has adopted shared agent resources under `.agents/**` and
project-specific layered knowledge under `apps/studio/workspace/**`.

## Key Details

- Do not delete either file until the operator confirms that all maintained
  downstream projects have been updated.
- Deferred files:
  - `apps/studio/workspace/legacy/role-contract-evaluation.md`
  - `apps/studio/workspace/legacy/legacy-agency.md`
- Remove their entries, exports, imports, references, and compatibility prose
  together with the files.
- Preserve the consolidated flat role contracts, `.agents/roles/SOURCES.md`,
  `.agents/templates/**`, and the artifact-first singlepage/startup Studio
  knowledge sources.

## Implementation Notes

First inventory downstream repositories and confirm their migration state.
Then remove the two legacy files and all references in one bounded cleanup.
Verify that repository search returns no stale references and run
`npm run singlepagestartup:agents:validate` plus `npm run studio:validate`.

## Acceptance Criteria

- Every maintained downstream project is confirmed on the new architecture.
- Both deferred files are removed.
- Workspace indexes and agent documentation contain no references to them.
- Agent and Studio validation pass after cleanup.
