# Admin Panel V2 — Global Rollout Master Plan (All Modules)

## Overview

ISSUE-145 is no longer treated as an ecommerce-only pilot fix.  
It is now the master rollout plan for migrating the full SPS module set to `admin-v2`.

Current strategy:

- Keep `ecommerce` as the completed reference implementation.
- Migrate `agent` next.
- Continue module-by-module in alphabetical order.
- Preserve reuse-first architecture (`shared/admin-v2` + model/relations variants + module shell wiring).

## Current State Analysis

The codebase currently has 15 modules in `libs/modules/*`:

- `agent`, `analytic`, `billing`, `blog`, `broadcast`, `crm`, `ecommerce`, `file-storage`, `host`, `notification`, `rbac`, `social`, `startup`, `telegram`, `website-builder`.

Admin-v2 status today:

- Shared infrastructure exists in `libs/shared/frontend/components/src/lib/singlepage/admin-v2` (85 files).
- Full module-level `admin-v2` implementation currently exists only for `ecommerce`.
- `agent` currently has:
  - models: 2 (`agent`, `widget`);
  - relations: 0.
- Host admin-v2 shell entrypoint is `apps/host/src/components/admin-panel-draft/Component.tsx`, routed from `apps/host/app/[[...url]]/page.tsx`.

Module inventory (models / relations):

| Module          | Models | Relations | Current Admin-v2 Status     |
| --------------- | -----: | --------: | --------------------------- |
| ecommerce       |      7 |        19 | Completed (reference stage) |
| agent           |      2 |         0 | Next in progress            |
| analytic        |      2 |         0 | Pending                     |
| billing         |      4 |         2 | Pending                     |
| blog            |      3 |         7 | Pending                     |
| broadcast       |      2 |         1 | Pending                     |
| crm             |      6 |         7 | Pending                     |
| file-storage    |      2 |         1 | Pending                     |
| host            |      4 |         5 | Pending                     |
| notification    |      4 |         2 | Pending                     |
| rbac            |      6 |        13 | Pending                     |
| social          |      8 |        14 | Pending                     |
| startup         |      1 |         0 | Pending                     |
| telegram        |      2 |         2 | Pending                     |
| website-builder |      7 |        13 | Pending                     |

### Key Discoveries

- `ecommerce` is the only module with end-to-end `admin-v2` shell + model + relation wiring.
- The stable runtime pattern is now:
  - model-level `singlepage/admin-v2/*` variants;
  - module-level `admin-v2/overview/*` and `admin-v2/sidebar-module-item/*`;
  - host-level composition in `admin-panel-draft`.
- The previous pilot assumptions and file paths in this plan were outdated (for example, references to old `ClientComponent.tsx` paths and old pilot-only scope).

## Desired End State

All modules have `admin-v2` parity with existing admin behavior at model/relation CRUD level, using consistent reusable architecture.

Target state requirements:

- Every model has `admin-v2` variants:
  - `admin-v2-table-row`, `admin-v2-table`, `admin-v2-select-input`, `admin-v2-form`, `admin-v2-card`, `admin-v2-sidebar-item`.
- Every relation (where present) has `admin-v2` variants:
  - `admin-v2-table-row`, `admin-v2-table`, `admin-v2-select-input`, `admin-v2-form`.
- Every module has module shell components:
  - `admin-v2/overview`;
  - `admin-v2/sidebar-module-item`.
- Host draft integrates modules in rollout order without breaking existing `ecommerce`.

### Verification

- `ecommerce` remains working and serves as reference.
- `agent` becomes first non-ecommerce module fully migrated.
- Remaining modules progress in alphabetical waves with repeatable DoD and test matrix.

## What We're NOT Doing

- Rewriting `admin` v1 runtime behavior or removing v1 in this issue.
- Backend schema refactors unrelated to admin-v2 migration.
- Visual redesign beyond existing admin-v2 style system.
- One-shot migration of all modules in a single change set.

## Implementation Approach

Use wave-based migration with strict reuse and parity rules.

### Wave Strategy

- Wave 0: Baseline rules and reusable migration template (global).
- Wave 1: `ecommerce` (completed; reference stage).
- Wave 2: `agent` (current active stage).
- Wave 3+: alphabetical module rollout:
  - `analytic`, `billing`, `blog`, `broadcast`, `crm`, `file-storage`, `host`, `notification`, `rbac`, `social`, `startup`, `telegram`, `website-builder`.

### Definition of Done (per module)

Each migrated module must satisfy all points:

1. All models have model-level `admin-v2-*` variants.
2. All module relations (if any) have relation-level `admin-v2-*` variants.
3. Module has working `admin-v2/overview` and `admin-v2/sidebar-module-item`.
4. Host draft routing/navigation includes module without regressions to existing modules.
5. BDD tests (unit + e2e smoke) exist and pass for module-level critical flows.

### Relation Migration Blueprint (Required for modules with relations)

For any module with relations, relation migration follows this single pattern:

1. Add `singlepage/admin-v2/{table,table-row,form,select-input}` in each relation component.
2. Add `admin-v2-*` entries in relation `singlepage/variants.ts` and `singlepage/interface.ts`.
3. In relation `table`, pass to row:
   - `leftModelAdminForm`, `rightModelAdminForm`;
   - `leftModelAdminFormLabel`, `rightModelAdminFormLabel`;
   - `apiProps` filters.
4. In relation `table-row` client component:
   - set `type="relation"`;
   - wire `adminForm` for relation edit/create flow;
   - wire `onDelete` using relation SDK delete;
   - expose left/right model actions through shared admin-v2 row.
5. In owner model form, include relation table with `apiProps.params.filters.and` by owner FK (v1 parity).
6. Use target form policy:
   - internal SPS entity: `admin-v2-form`;
   - external module fallback: `admin-form`.
7. For nested opens, pass minimal `{ id }` payload; rely on hydration in form/table-row data loaders.
8. Never pass callback functions through server boundaries; all callback wiring must live in `"use client"` components.

## Mandatory Validation Commands (Verified Only)

Use verified repository commands/targets for migration work:

- `npm run host:dev` (manual start; long-lived process for reuse)
- `npm run test:e2e:singlepage` (reuse mode; does not auto-start host)
- `npx nx run host:e2e -- --project=singlepage --list`
- `npx nx run host:next:build`
- `npx nx run host:eslint:lint`
- `npx nx run @sps/shared-frontend-components:jest:test`
- `npx nx run @sps/ecommerce:jest:test`

## Phases

### Phase 0: Baseline Rules + Migration Template

- Lock reusable module migration template (model-level, relation-level, module shell, host integration, tests).
- Lock incident checklist for server/client boundaries and callback wiring.

### Phase 1: Ecommerce (Completed Reference Stage)

- Keep as canonical implementation baseline for the remaining modules.
- Use it as source of truth for `admin-v2` component composition and relation wiring pattern.

### Phase 2: Agent (Current In Progress Stage)

Scope:

- Migrate `agent` module models (`agent`, `widget`) to full `admin-v2` model variants.
- Add module-level `admin-v2/overview` and `admin-v2/sidebar-module-item`.
- Integrate in host draft shell.
- Add BDD smoke tests and API mocks for `agent` module.

Expected outcome:

- Working routes: `/admin/agent`, `/admin/agent/agent`, `/admin/agent/widget`.

### Phase 3+: Remaining Modules (Alphabetical Waves)

- Migrate modules in this exact order:
  - `analytic`, `billing`, `blog`, `broadcast`, `crm`, `file-storage`, `host`, `notification`, `rbac`, `social`, `startup`, `telegram`, `website-builder`.
- For relation-heavy modules, apply Relation Migration Blueprint unchanged.

## Testing Strategy

### Unit Tests (Reusable Matrix)

- Module overview smoke:
  - overview route renders cards;
  - model route renders only active model table;
  - out-of-module route returns null.
- Sidebar module item smoke:
  - active/inactive branches;
  - module/model href composition;
  - required data attributes.

### Integration/E2E Tests (Reusable Matrix)

- Per module smoke:
  - navigation to module root and each model route;
  - opening create/edit sheets;
  - create/delete sanity for at least one model.
- Relation e2e (only modules with relations):
  - owner-side relation visibility;
  - relation create/delete;
  - left/right model open actions;
  - fallback behavior for external targets.

### Manual Testing Steps

1. Start host once (`npm run host:dev`) and keep it running.
2. Run targeted e2e suites in reuse mode.
3. Validate routes, table render, forms, relation tabs/actions per migrated module.
4. Confirm previously migrated modules still work before moving to next wave.

## Performance Considerations

- Reuse long-running host process to avoid repeated startup cost.
- Prefer targeted suites per active module wave over full-matrix reruns on every small change.

## Migration Notes

- This issue now tracks a long-running multi-module migration.
- `ecommerce` historical completion is retained as reference, not as final completion of ISSUE-145.
- Every stage must update handoff progress with incidents and reusable fixes for subagent continuity.

## References

- Ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-145.md`
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-145.md`
- Progress log: `thoughts/shared/handoffs/singlepagestartup/ISSUE-145-progress.md`
- Host entrypoint: `apps/host/app/[[...url]]/page.tsx`
- Host admin-v2 shell: `apps/host/src/components/admin-panel-draft/Component.tsx`

## Open Questions (Blocking)

- None currently.  
  If a module-specific ambiguity appears during a wave, it must be recorded in `ISSUE-145-progress.md` before implementation continues.
