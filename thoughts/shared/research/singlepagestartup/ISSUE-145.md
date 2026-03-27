---
date: 2026-03-22T10:30:00+03:00
researcher: codex
git_commit: 5b1604a1d08c471e5570c3bcac114a2adc204b08
branch: main
repository: singlepagestartup
topic: "Admin Panel V2 - Global rollout status and migration pattern"
tags: [research, codebase, admin-v2, global-rollout, migration, frontend]
status: complete
last_updated: 2026-03-22
last_updated_by: codex
---

# Research: Admin Panel V2 - Global rollout status and migration pattern

**Date**: 2026-03-22  
**Researcher**: codex  
**Git Commit**: 5b1604a1d08c471e5570c3bcac114a2adc204b08  
**Branch**: main  
**Repository**: singlepagestartup

## Research Question

What is the current real state of `admin-v2` in the repository, and what canonical migration pattern should be used to move all modules (not only ecommerce) to the updated admin-v2 architecture?

## Summary

1. `admin-v2` shared infrastructure is present and actively used (85 files in `libs/shared/frontend/components/src/lib/singlepage/admin-v2`).
2. Full module-level `admin-v2` implementation is currently available only in `ecommerce`.
3. `agent` has no `admin-v2` yet (2 models, 0 relations) and is the next rollout stage.
4. Host runtime admin path `/admin*` is served by `apps/host/app/[[...url]]/page.tsx`, which mounts `apps/host/src/components/admin-panel-draft/Component.tsx`.
5. Current implementation pattern is model-level variants + module-level overview/sidebar composition + host shell integration.
6. Relation-bearing forms must follow ecommerce parity: `Details/Relations` tabs with nested relation tabs (no inline relation tables in `Details`).

## Detailed Findings

### 1. Runtime entrypoint and host shell

- Admin routing entrypoint:
  - `apps/host/app/[[...url]]/page.tsx`
- Active admin-v2 shell component:
  - `apps/host/src/components/admin-panel-draft/Component.tsx`
- Current host shell integrates `ecommerce` admin-v2 overview and module sidebar item.

Important correction versus older docs:

- The active shell file is `Component.tsx` (not legacy `ClientComponent.tsx` references used in earlier notes).

### 2. Shared admin-v2 infrastructure (actual state)

- Path: `libs/shared/frontend/components/src/lib/singlepage/admin-v2`
- File count: **85** (not 54 as in old research).
- Core reusable building blocks include:
  - `panel`, `table`, `table-row`, `table-controller`, `form`, `select-input`,
  - `card`, `sidebar-item`, `agregated-input`.

Shared contracts currently support relation-driven row actions via:

- `leftModelAdminForm`, `rightModelAdminForm`,
- `leftModelAdminFormLabel`, `rightModelAdminFormLabel`.

`relatedAdminForm` exists as legacy-compatible prop in shared interfaces but is not the primary path.

### 3. Ecommerce as reference implementation

`ecommerce` is the reference-stage module for global rollout:

- Module shell:
  - `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/overview/*`
  - `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/sidebar-module-item/*`
- Models:
  - 7 models with `admin-v2-*` variants.
- Relations:
  - 19 relations with `admin-v2` variants and relation-row model-open actions.

This module currently defines the target architecture and reuse conventions for next modules.

### 4. Module inventory and rollout priority

Repository module inventory (`libs/modules/*`):

| Module          | Models | Relations | Admin-v2 status     |
| --------------- | -----: | --------: | ------------------- |
| ecommerce       |      7 |        19 | Completed reference |
| agent           |      2 |         0 | Next target         |
| analytic        |      2 |         0 | Pending             |
| billing         |      4 |         2 | Pending             |
| blog            |      3 |         7 | Pending             |
| broadcast       |      2 |         1 | Pending             |
| crm             |      6 |         7 | Pending             |
| file-storage    |      2 |         1 | Pending             |
| host            |      4 |         5 | Pending             |
| notification    |      4 |         2 | Pending             |
| rbac            |      6 |        13 | Pending             |
| social          |      8 |        14 | Pending             |
| startup         |      1 |         0 | Pending             |
| telegram        |      2 |         2 | Pending             |
| website-builder |      7 |        13 | Pending             |

Rollout order after `agent` should remain alphabetical for predictability and tracking.

### 5. Canonical pattern for model migration (`admin-v2`)

Per model:

1. Add `singlepage/admin-v2/{table,table-row,form,select-input,card,sidebar-item}`.
2. Register variants in model `singlepage/variants.ts`.
3. Extend model union in model `singlepage/interface.ts`.
4. Use shared admin-v2 wrappers (`@sps/shared-frontend-components/singlepage/admin-v2/*`).
5. Keep callbacks (`adminForm`, relation render callbacks) in `"use client"` components only.

Per module shell:

1. Add `frontend/component/src/lib/admin-v2/overview`.
2. Add `frontend/component/src/lib/admin-v2/sidebar-module-item`.
3. Export `AdminV2Overview` and `AdminV2SidebarModuleItem` from module `src/index.ts`.
4. Integrate in host admin shell.

### 6. Relation Migration Blueprint (required for modules with relations)

Canonical relation migration flow:

1. Create relation `singlepage/admin-v2/{table,table-row,form,select-input}`.
2. Register relation `admin-v2-*` variants in relation `singlepage/variants.ts`.
3. Extend relation unions in relation `singlepage/interface.ts`.
4. In relation `table`, pass to rows:
   - `leftModelAdminForm`, `rightModelAdminForm`;
   - `leftModelAdminFormLabel`, `rightModelAdminFormLabel`;
   - `apiProps` filters.
5. In relation `table-row` (client):
   - set `type="relation"`;
   - provide `adminForm` and `onDelete`;
   - render left/right model action buttons via shared admin-v2 row.
6. In owner model form, mount relation tables with `apiProps.params.filters.and` by owner FK (v1 parity rule).
7. Target form policy:
   - internal targets -> `admin-v2-form`;
   - external targets -> `admin-form` fallback.
8. Pass minimal nested payload (`{ id }`) and rely on hydration in row/form loaders.
9. Do not pass callback functions through server boundaries; wire callbacks in `"use client"` layer.

### 7. Known pitfalls from migration history

1. **Server/client boundary violations**

- Symptom: runtime error `Functions cannot be passed directly to Client Components`.
- Root cause: callback props defined in server file and forwarded into client chain.
- Fix: keep callback wiring only in `"use client"` components.

2. **Incorrect `isServer` usage**

- Symptom: hydration/runtime mismatches in form/row flows.
- Root cause: using `isServer={props.isServer}` inside `"use client"` form/relations path.
- Fix: in client files always pass `isServer={false}`.

3. **Over-custom relation target logic in wrong layer**

- Symptom: unstable relation open behavior and frozen UI in edit->relations flows.
- Root cause: mixed responsibilities between module wiring and relation row internals.
- Fix: keep strict decomposition:
  - model form mounts filtered relation tables;
  - relation row handles relation row actions;
  - shared row remains reusable UI layer.

4. **Legacy prop drift**

- Symptom: unnecessary prop drilling and type noise.
- Root cause: carrying unused `relatedContext`-style patterns.
- Fix: avoid introducing unused props in new module migrations unless required by shared contract.

### 8. Testing implications for global rollout

Required reusable checks for every migrated module:

- Unit smoke: overview/sidebar behavior by URL and active states.
- E2E smoke: model routes + table render + create/edit/delete sheet flow.
- Relation modules only: relation-table visibility + relation CRUD + left/right model opens.
- Relation-bearing forms: `Details/Relations` tabs, relation-count badge, nested relation tabs.

For runtime speed and determinism:

- keep host dev server running once;
- run e2e in reuse mode.

### 9. Billing relation UI parity regression (2026-03-27)

Observed mismatch after the initial billing migration:

- `payment-intent`, `invoice`, and `currency` forms rendered relation tables directly in details content.
- This diverged from canonical ecommerce UX where relation content is rendered under
  `Details/Relations` main tabs with nested relation tabs.

Canonical fix pattern for all next relation-bearing modules:

1. Keep relation wiring in `overview/<model>/admin-v2-form/ClientComponent.tsx`.
2. Keep relation presentation in model form `singlepage/admin-v2/form/ClientComponent.tsx`.
3. Render relation tables only in `Relations` tab; keep fields only in `Details`.
4. Pass `isServer: false` in all client-side relation render callbacks.

## Code References

- Host admin routing: `apps/host/app/[[...url]]/page.tsx`
- Host admin-v2 shell: `apps/host/src/components/admin-panel-draft/Component.tsx`
- Shared admin-v2 root: `libs/shared/frontend/components/src/lib/singlepage/admin-v2`
- Ecommerce module shell:
  - `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/overview/Component.tsx`
  - `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/sidebar-module-item/Component.tsx`
- Reference relation row:
  - `libs/modules/ecommerce/relations/products-to-attributes/frontend/component/src/lib/singlepage/admin-v2/table-row/ClientComponent.tsx`

## Architecture Documentation

### Component Layering Pattern

```
Module Model Component (variant="admin-v2-*")
  -> Shared admin-v2 wrapper
  -> SDK Provider (client/server)
  -> Data loader (find/findById)
  -> API route (/api/<module>/<entity>)
```

### Module Shell Pattern

```
Host admin shell
  -> Module Sidebar Item (route-aware)
  -> Module Overview (route-aware)
      -> Model Card(s) on module root
      -> Model Table on model route
```

### Relation Pattern

```
Model Form (owner)
  -> Relation Table (apiProps FK filter)
      -> Relation Row (type="relation")
          -> Edit/Delete + Left/Right Model actions
```

## Historical Context (from thoughts/)

- Earlier ISSUE-145 artifacts documented a pilot-fix scope for ecommerce only.
- The current direction has been expanded to global module rollout while retaining ecommerce as the canonical reference stage.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-142.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-145-admin-v2-playbook.md`
- `thoughts/shared/plans/singlepagestartup/ISSUE-145.md`

## Open Questions

1. Should host admin draft integrate each module immediately after migration, or in batched waves?
2. Should a lightweight registry convention be standardized for non-ecommerce module shells to reduce repetitive wiring?
