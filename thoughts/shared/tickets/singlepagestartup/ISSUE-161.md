# Issue: Fix Website Builder buttons-array admin route showing Button table

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/161
**Status**: Research Needed
**Created**: 2026-04-18
**Priority**: medium
**Size**: small
**Type**: bug

---

## Problem to Solve

Opening the Website Builder admin route for button arrays at `/admin/website-builder/buttons-array` currently renders the `Button` overview table and page title instead of the `Buttons Array` table.

This makes the `buttons-array` entity inaccessible from the admin overview even though the module defines a dedicated `buttons-array` model, admin table variant, and API route for button arrays.

## Key Details

- Reproduction:
  - Open the admin panel.
  - Navigate to `Website Builder`.
  - Click `buttons-array` in the sidebar.
  - Observe that the page title becomes `Button` and the list shows button records instead of button-array records.
- Expected behavior:
  - `/admin/website-builder/buttons-array` should render the `Buttons Array` overview/table and load button-array records.
- The Website Builder module explicitly documents `buttons-array` as a separate model for ordered button groups in [libs/modules/website-builder/README.md](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/website-builder/README.md) and [libs/modules/website-builder/models/buttons-array/README.md](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/website-builder/models/buttons-array/README.md).
- The backend/OpenAPI route for this entity is `/website-builder/buttons-arrays`, which is distinct from `/website-builder/buttons`.
- Likely cause:
  - [libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/button/admin-v2-table/ClientComponent.tsx](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/button/admin-v2-table/ClientComponent.tsx) activates on `props.url.startsWith(ADMIN_BASE_PATH + "/website-builder/button")`.
  - Because `/admin/website-builder/buttons-array` starts with `/admin/website-builder/button`, the `Button` overview table is incorrectly matched before or alongside the `Buttons Array` route.
  - The intended `Buttons Array` overview is implemented separately in [libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/buttons-array/admin-v2-table/ClientComponent.tsx](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/buttons-array/admin-v2-table/ClientComponent.tsx).

## Implementation Notes

- Tighten admin-v2 route matching so `button` does not capture `buttons-array` routes.
- Confirm the fix preserves existing behavior for the dedicated `button` route at `/admin/website-builder/button`.
- Verify that the `Buttons Array` overview continues to use the correct model component and data source from `@sps/website-builder/models/buttons-array`.
- Add regression coverage for route matching if there is an existing test surface for admin-v2 overview routing.
