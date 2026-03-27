# Issue: Admin Panel V2 - Migrate redesigned admin panel from drafts

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/145
**Issue**: #145
**Status**: Code Review
**Created**: 2026-03-04
**Priority**: Medium
**Size**: medium
**Type**: refactoring

---

## Problem to Solve

Migrate the redesigned admin panel (V2) from drafts to the production codebase. The drafts contain an updated version of the admin panel (HTML+CSS and React versions), but these need to be integrated with the existing SDK-based data fetching and model infrastructure.

## Key Details

- Draft sources located in `apps/drafts/incoming/admin-v2` (HTML+CSS and React versions)
- Partial migration already started based on `admin-panel-redesign-html` variant
- Work-in-progress code exists in `apps/host/src/components/admin-panel-draft`
- Rollout completion: all modules migrated to `admin-v2` (2026-03-28)
- Canonical reference module: `ecommerce`
- Updates are primarily visual and minor display functionality; core business logic remains unchanged

## Implementation Notes

- Must use the shared SDK providers for data access (`libs/modules/<module>/models/<model>/sdk/<client|server>`)
- Visual appearance should match `apps/drafts/incoming/admin-v2`
- Functionality should match `apps/drafts/incoming/admin-v2`
- Shared admin components: `libs/shared/frontend/components/src/lib/singlepage/admin`
- Shared frontend API: `libs/shared/frontend/api`
- TailwindCSS only, no ad-hoc CSS
