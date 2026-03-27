# Issue: Close `admin-panel-draft` and align with `admin` implementation + e2e coverage

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/146
**Issue**: #146
**Status**: Research Needed
**Created**: 2026-03-28
**Priority**: Medium
**Size**: medium
**Type**: refactoring

---

## Problem to Solve

`apps/host/src/components/admin-panel-draft` must be closed/decommissioned and brought to the same implementation behavior as `apps/host/src/components/admin`.

The migration is not complete until behavior parity is verified by an end-to-end test.

## Key Details

- Reference implementation to match: `apps/host/src/components/admin`.
- Draft implementation to close/migrate: `apps/host/src/components/admin-panel-draft`.
- The issue must include e2e validation that confirms the final implementation behavior.
- For e2e execution, an `admin` role user must be created via `apps/api/create_rbac_subject.sh`.
- After e2e execution, the created test user must be removed automatically.
- A dedicated cleanup command/script `apps/api/delete_rbac_subject.sh` for removing that test user is required as part of this scope.

## Implementation Notes

- Do not introduce ad-hoc CSS; Tailwind-only frontend styling rules remain in force.
- Keep all data access through SDK providers, per repository conventions.
- Extend e2e flow to cover:
  - creation of test admin subject,
  - implementation parity checks,
  - guaranteed cleanup/deletion of the created subject.
- The cleanup command `apps/api/delete_rbac_subject.sh` should be reusable and safe for repeated CI/local runs.
