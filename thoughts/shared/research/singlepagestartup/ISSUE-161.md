---
date: 2026-04-18T02:50:03+0300
researcher: flakecode
git_commit: 3b7a5bc23bcd73d767ba3ee13d5cc90152cdf5eb
branch: main
repository: singlepagestartup
topic: "Fix Website Builder buttons-array admin route showing Button table"
tags: [research, codebase, website-builder, admin-v2, buttons-array, button]
status: complete
last_updated: 2026-04-18
last_updated_by: flakecode
---

# Research: Fix Website Builder buttons-array admin route showing Button table

**Date**: 2026-04-18T02:50:03+0300
**Researcher**: flakecode
**Git Commit**: 3b7a5bc23bcd73d767ba3ee13d5cc90152cdf5eb
**Branch**: main
**Repository**: singlepagestartup

## Research Question

Document how the Website Builder admin-v2 route `/admin/website-builder/buttons-array` is resolved today, which components become active for that URL, and how the `button` and `buttons-array` models differ in their frontend and backend wiring.

## Summary

The admin-v2 host page renders the Website Builder overview with the current `url`, and the Website Builder overview then renders all model-specific table components for that module, leaving each component to decide whether it should display (`apps/host/src/components/admin-v2/Component.tsx:170`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/Component.tsx:36`).

Within the Website Builder overview, the `button` table component treats any URL starting with `/admin/website-builder/button` as active, while the `buttons-array` table component treats URLs starting with `/admin/website-builder/buttons-array` as active (`libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/button/admin-v2-table/ClientComponent.tsx:9`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/buttons-array/admin-v2-table/ClientComponent.tsx:9`). Because the longer route begins with the shorter prefix, the `button` table component also matches `/admin/website-builder/buttons-array`.

The two tables are wired to different model components, SDK providers, and API routes. The `button` admin-v2 table uses the `button` model provider and `/api/website-builder/buttons`, while the `buttons-array` admin-v2 table uses the `buttons-array` model provider and `/api/website-builder/buttons-arrays` (`libs/modules/website-builder/models/button/frontend/component/src/lib/singlepage/admin-v2/table/index.tsx:13`, `libs/modules/website-builder/models/buttons-array/frontend/component/src/lib/singlepage/admin-v2/table/index.tsx:13`, `libs/modules/website-builder/models/button/sdk/model/src/lib/index.ts:16`, `libs/modules/website-builder/models/buttons-array/sdk/model/src/lib/index.ts:16`).

## Detailed Findings

### Admin-v2 host composition

The host admin-v2 shell imports Website Builder’s sidebar module item and overview exports from `@sps/website-builder/frontend/component` and passes the current `url` prop to both (`apps/host/src/components/admin-v2/Component.tsx:58`, `apps/host/src/components/admin-v2/Component.tsx:138`, `apps/host/src/components/admin-v2/Component.tsx:193`).

The Website Builder frontend package re-exports `AdminV2Overview` and `AdminV2SidebarModuleItem` from its local admin-v2 implementation (`libs/modules/website-builder/frontend/component/src/index.ts:4`).

### Website Builder overview routing

The Website Builder admin-v2 overview first checks whether the URL belongs to the module with `props.url.startsWith(ADMIN_BASE_PATH + "/website-builder")`, and it only shows the model card grid on the exact module root route `/admin/website-builder` (`libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/Component.tsx:12`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/Component.tsx:15`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/Component.tsx:24`).

For non-root routes inside the module, the overview still renders every model-specific table component in sequence: `Button`, `ButtonsArray`, `Feature`, `Logotype`, `Slide`, `Slider`, and `Widget` (`libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/Component.tsx:36`).

### Button table activation

The Website Builder `button` overview table component is a client component that computes `isActive` with `props.url.startsWith(ADMIN_BASE_PATH + "/website-builder/button")` and returns `null` only when that prefix check fails (`libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/button/admin-v2-table/ClientComponent.tsx:8`).

When the prefix check succeeds, the component renders the `Button` heading and delegates the actual table UI to the Website Builder `button` model frontend component with variant `admin-v2-table` (`libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/button/admin-v2-table/ClientComponent.tsx:18`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/button/admin-v2-table/ClientComponent.tsx:21`).

The `button` model’s `admin-v2-table` variant uses the shared admin-v2 table component with `module="website-builder"`, `name="button"`, the `button` Provider, and the `button` client/server SDK APIs (`libs/modules/website-builder/models/button/frontend/component/src/lib/singlepage/admin-v2/table/index.tsx:13`).

The `button` SDK model exports `/api/website-builder/buttons` as its route (`libs/modules/website-builder/models/button/sdk/model/src/lib/index.ts:16`).

### Buttons-array table activation

The Website Builder `buttons-array` overview table component is also a client component. It computes `isActive` with `props.url.startsWith(ADMIN_BASE_PATH + "/website-builder/buttons-array")` and otherwise returns `null` (`libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/buttons-array/admin-v2-table/ClientComponent.tsx:8`).

When active, it renders the `Buttons Array` heading and delegates the table UI to the Website Builder `buttons-array` model frontend component with variant `admin-v2-table` (`libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/buttons-array/admin-v2-table/ClientComponent.tsx:17`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/buttons-array/admin-v2-table/ClientComponent.tsx:23`).

The `buttons-array` model’s `admin-v2-table` variant uses the shared admin-v2 table component with `module="website-builder"`, `name="buttons-array"`, the `buttons-array` Provider, and the `buttons-array` client/server SDK APIs (`libs/modules/website-builder/models/buttons-array/frontend/component/src/lib/singlepage/admin-v2/table/index.tsx:13`).

The `buttons-array` SDK model exports `/api/website-builder/buttons-arrays` as its route (`libs/modules/website-builder/models/buttons-array/sdk/model/src/lib/index.ts:16`).

### Sidebar activation uses the same prefix pattern

The Website Builder sidebar module item renders all Website Builder child items when the current route is inside the module (`libs/modules/website-builder/frontend/component/src/lib/admin-v2/sidebar-module-item/Component.tsx:15`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/sidebar-module-item/Component.tsx:54`).

Inside that list, the `button` sidebar item uses the same `startsWith("/website-builder/button")` prefix check used by the overview table, while the `buttons-array` sidebar item uses `startsWith("/website-builder/buttons-array")` (`libs/modules/website-builder/frontend/component/src/lib/admin-v2/sidebar-module-item/button/Component.tsx:5`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/sidebar-module-item/buttons-array/Component.tsx:5`).

### Module and backend model separation

The Website Builder module README documents `button` and `buttons-array` as separate models, with `buttons-array` described as an ordered button-group model (`libs/modules/website-builder/README.md:29`, `libs/modules/website-builder/README.md:30`).

The `buttons-array` model README describes `ButtonsArray` as a grouped, ordered set of buttons and lists dedicated admin variants including `admin-table` and `admin-form` (`libs/modules/website-builder/models/buttons-array/README.md:5`, `libs/modules/website-builder/models/buttons-array/README.md:21`).

On the backend API side, Website Builder registers separate model apps for `/buttons-arrays` and `/buttons`, and also registers the `buttons-arrays-to-buttons` relation as its own route (`libs/modules/website-builder/backend/app/api/src/lib/apps.ts:37`, `libs/modules/website-builder/backend/app/api/src/lib/apps.ts:42`, `libs/modules/website-builder/backend/app/api/src/lib/apps.ts:67`).

## Code References

- `apps/host/src/components/admin-v2/Component.tsx:138` - Host admin-v2 shell renders Website Builder sidebar item with the current URL.
- `apps/host/src/components/admin-v2/Component.tsx:193` - Host admin-v2 shell renders Website Builder overview with the current URL.
- `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/Component.tsx:12` - Website Builder overview checks whether the current route belongs to the module.
- `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/Component.tsx:36` - Website Builder overview renders all model-specific admin-v2 table components.
- `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/button/admin-v2-table/ClientComponent.tsx:9` - `button` overview table activates from the `/website-builder/button` prefix.
- `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/buttons-array/admin-v2-table/ClientComponent.tsx:9` - `buttons-array` overview table activates from the `/website-builder/buttons-array` prefix.
- `libs/modules/website-builder/frontend/component/src/lib/admin-v2/sidebar-module-item/button/Component.tsx:5` - `button` sidebar item uses the same prefix-based activation pattern.
- `libs/modules/website-builder/frontend/component/src/lib/admin-v2/sidebar-module-item/buttons-array/Component.tsx:5` - `buttons-array` sidebar item uses its own longer prefix.
- `libs/modules/website-builder/models/button/frontend/component/src/lib/singlepage/admin-v2/table/index.tsx:13` - `button` admin-v2 table binds the shared table wrapper to the `button` model Provider and APIs.
- `libs/modules/website-builder/models/buttons-array/frontend/component/src/lib/singlepage/admin-v2/table/index.tsx:13` - `buttons-array` admin-v2 table binds the shared table wrapper to the `buttons-array` model Provider and APIs.
- `libs/modules/website-builder/models/button/sdk/model/src/lib/index.ts:16` - `button` SDK route is `/api/website-builder/buttons`.
- `libs/modules/website-builder/models/buttons-array/sdk/model/src/lib/index.ts:16` - `buttons-array` SDK route is `/api/website-builder/buttons-arrays`.
- `libs/modules/website-builder/backend/app/api/src/lib/apps.ts:37` - Website Builder backend registers the `/buttons-arrays` model route.
- `libs/modules/website-builder/backend/app/api/src/lib/apps.ts:42` - Website Builder backend registers the `/buttons` model route.

## Architecture Documentation

Website Builder follows the same admin-v2 composition pattern used by other SPS modules: the host admin-v2 shell renders every module overview, each module overview returns `null` unless the current URL belongs to that module, and each module overview then renders all of its model-specific table components, which perform their own URL-based visibility checks (`apps/host/src/components/admin-v2/Component.tsx:170`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/Component.tsx:17`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/Component.tsx:36`).

Within Website Builder, the model-specific admin-v2 overview wrappers do not fetch data directly. They delegate to the corresponding model frontend component variant, and those model variants are what connect the shared admin-v2 table implementation to model-specific SDK providers and API routes (`libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/button/admin-v2-table/ClientComponent.tsx:21`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/buttons-array/admin-v2-table/ClientComponent.tsx:23`, `libs/modules/website-builder/models/button/frontend/component/src/lib/singlepage/admin-v2/table/index.tsx:13`, `libs/modules/website-builder/models/buttons-array/frontend/component/src/lib/singlepage/admin-v2/table/index.tsx:13`).

## Historical Context (from thoughts/)

No route-specific prior research or planning documents for Website Builder `buttons-array` admin-v2 routing were found in `thoughts/shared/`. Search hits for `buttons-array` outside the current ticket were limited to broader module inventory and migration documents such as `thoughts/shared/plans/singlepagestartup/ISSUE-145.md:18`, `thoughts/shared/research/singlepagestartup/ISSUE-145.md:98`, and `thoughts/shared/research/singlepagestartup/ISSUE-150.md:95`.

## Related Research

No directly related route-specific research documents were found for this topic.

## Open Questions

- No dedicated Website Builder admin-v2 overview or route-matching spec files were found under `apps/` or `libs/` from the repository test search performed during this research.
