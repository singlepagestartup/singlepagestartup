# Issue #142: Implement the updated admin panel

**URL:** https://github.com/singlepagestartup/singlepagestartup/issues/142
**Status:** area:host (label)
**Created:** 2026-02-27

## Problem to solve

The admin panel needs to be migrated to its updated version for a unified admin experience.
Currently, ecommerce.product, ecommerce.attribute, and ecommerce.products-to-attributes act as pilot platforms to debug and resolve integration issues.
The migration and stabilization in this pilot scope are required before rolling out to the rest of the components and modules.

## Key details

- Updated admin panel source is located in `apps/drafts`.
- Portions are already migrated to `apps/host/src/components/admin-panel-draft`.
- Additional implementation exists in:
  - `libs/modules/ecommerce/frontend/component/src/lib/admin-v2`
  - `libs/shared/frontend/components/src/lib/singlepage/admin-v2`
- Models involved:
  - `libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/admin-v2`
  - `libs/modules/ecommerce/models/attribute/frontend/component/src/lib/singlepage/admin-v2`
- Relations involved:
  - `libs/modules/ecommerce/relations/products-to-attributes/frontend/component/src/lib/singlepage/admin-v2`
- Pilot scope note:
  - `ecommerce.product`, `ecommerce.attribute`, and `ecommerce.products-to-attributes` are used as a pilot platform to identify and fix migration/integration issues first.
  - Only after the pilot scope is stabilized and validated should the migration approach be rolled out to the remaining components/modules.

## Implementation notes

1. Review the updated admin panel implementation across all listed locations.
2. Consolidate logic and shared UI components; remove duplicated code paths.
3. Ensure consistent typing and integration between models and relations in the pilot scope.
4. Fix discovered migration issues in pilot modules (architecture, data flow, UX behavior).
5. Finalize pilot validation criteria and document rollout gates.
6. After pilot stabilization, scale migration to remaining components/modules.

## References

- apps/drafts
- apps/host/src/components/admin-panel-draft
- libs/modules/ecommerce/frontend/component/src/lib/admin-v2
- libs/shared/frontend/components/src/lib/singlepage/admin-v2
- libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/admin-v2
- libs/modules/ecommerce/models/attribute/frontend/component/src/lib/singlepage/admin-v2
- libs/modules/ecommerce/relations/products-to-attributes/frontend/component/src/lib/singlepage/admin-v2

## Comments

### Comment by flakecode (2026-02-27T22:06:51Z)

Research complete: `thoughts/shared/research/2026-02-28-ISSUE-0142-admin-panel-v2-migration.md`

Key findings:

- **Pilot is partially functional but has structural issues**: The admin-v2 shell exists at `/admin/**` with product, attribute, and products-to-attributes wired up. Core flows (list, create, edit, delete) are implemented via URL-based routing + variant dispatch pattern.
- **Route parsing logic is duplicated in 5 places**: The regex that parses `/admin/modules/:module/models/:model` is copy-pasted across `ecommerce/frontend/component`, `sidebar-module-item`, `settings-page`, `account-settings-page`, and `utils.tsx`. Must be extracted before rollout.
- **Sidebar re-instantiation bug**: `ClientComponent.tsx` renders `<EcommerceAdminV2Component>` three times (once as primary, twice as layout wrapper for settings/profile), causing sidebar state to reset on navigation.
- **No RBAC gating**: Admin v1 checked `admin` role before rendering; admin-v2 has no access control — any user can access `/admin/**`.
- **Account settings uses hardcoded mock data**: Not wired to live SDK calls.
- **`utils.tsx` state machine appears unused**: The full client-side state machine in `apps/host/src/components/admin-panel-draft/utils.tsx` is not called by `ClientComponent.tsx` — it delegates entirely to `EcommerceAdminV2Component`.
- **Inconsistent relation rendering styles**: Product form uses Details/Relations tabs; attribute form uses inline sections. No standardized approach.
- **`select-input` delegates to admin-v1**: Both product and products-to-attributes `select-input` components delegate to old admin-v1 select input, creating a cross-version dependency.

Potential approaches:

- **Pilot stabilization first**: Fix the 8 identified inconsistencies/bugs (route duplication, sidebar re-instantiation, RBAC, mock data, dead code) before scaling to other modules.
- **Architectural cleanup then rollout**: Extract shared route parsing utility, create a proper admin layout component, standardize relation rendering style — then use the clean pattern as the template for all module migrations.
- **Incremental rollout with gates**: Define explicit validation criteria for the pilot (CRUD for all 3 entities works, no console errors, RBAC gating passes) before adding new modules.
