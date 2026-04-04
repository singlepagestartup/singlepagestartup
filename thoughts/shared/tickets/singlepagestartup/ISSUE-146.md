# Issue: Protect admin-v2 with RBAC authentication (align with admin)

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/146
**Issue**: #146
**Status**: Research in Review
**Created**: 2026-03-28
**Updated**: 2026-04-04
**Priority**: Medium
**Size**: medium
**Type**: refactoring

---

## Problem to Solve

Protect `apps/host/src/components/admin-v2` with user authentication check, same as done in `apps/host/src/components/admin`. The old `admin-panel-draft` has been renamed to `admin-v2`.

## Key Details

- Reference implementation: `apps/host/src/components/admin` (RBAC 3-step auth guard)
- Target implementation: `apps/host/src/components/admin-v2`
- **Note**: As of 2026-04-04 research, admin-v2 already has an identical auth guard in `ClientComponent.tsx`
- Routing: `/admin` URLs go to admin-v2 via `apps/host/app/[[...url]]/page.tsx:55`

## Implementation Notes

- The RBAC auth guard pattern: `RbacSubject(authentication-me-default)` → `RbacRole(find, slug=admin)` → `RbacSubjectsToRoles(find, subjectId+roleId)`
- Guard runs client-side only (`isServer={false}`)
- Unauthenticated users see nothing (null render, no redirect)
