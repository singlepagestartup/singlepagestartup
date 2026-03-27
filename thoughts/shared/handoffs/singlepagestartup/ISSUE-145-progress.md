---
issue_number: 145
issue_title: "Admin Panel V2 - Global rollout across all modules"
start_date: 2026-03-10T00:00:00Z
resumed_date: 2026-03-22T00:00:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-145.md
status: in_progress
current_epoch: 2
current_stage: "Phase 4 - billing module migration rework (relations parity fix implemented, pending manual verification)"
last_updated: 2026-03-27T17:05:00+03:00
---

# Implementation Progress: ISSUE-145 - Admin Panel V2 Global Rollout

**Started**: 2026-03-10  
**Rescoped to global rollout**: 2026-03-22  
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-145.md`

## Epoch-1 (Ecommerce Completed) — Historical Archive

This epoch represents the previous scope (ecommerce-focused migration/fixes) and is preserved as reference context.

### Phase Summary (historical)

- Phase 1: shared panel/settings wiring fixes — completed.
- Phase 2: ecommerce model fixes — completed.
- Phase 3: ecommerce relation fixes — completed.
- Phase 4: host integration fixes — completed.

Historical completion timestamp from previous tracking: `2026-03-10T15:15:00Z`.

### Why this is now archived

- ISSUE-145 was respecified from pilot-fix to full multi-module rollout.
- Therefore, epoch-1 completion does **not** mean full issue completion.
- `ecommerce` remains a completed **reference stage**, not final delivery of ISSUE-145.

## Epoch-2 (Global Rollout) — Active

### Module Board

| Module          | Status    | Notes                                                    |
| --------------- | --------- | -------------------------------------------------------- |
| ecommerce       | completed | Canonical reference implementation for admin-v2 patterns |
| agent           | completed | Awaiting manual verification and stable e2e execution    |
| analytic        | completed | Implemented; awaiting manual verification and full e2e   |
| billing         | completed | Implemented; awaiting manual verification and full e2e   |
| blog            | pending   | Relation-bearing module                                  |
| broadcast       | pending   | Relation-bearing module                                  |
| crm             | pending   | Relation-bearing module                                  |
| file-storage    | pending   | Relation-bearing module                                  |
| host            | pending   | Relation-bearing module                                  |
| notification    | pending   | Relation-bearing module                                  |
| rbac            | pending   | Heavy relation module                                    |
| social          | pending   | Heavy relation module                                    |
| startup         | pending   | Model-only module                                        |
| telegram        | pending   | Relation-bearing module                                  |
| website-builder | pending   | Heavy relation module                                    |

### Current Stage

**Phase 4 - `billing`**

Target outcomes:

- Add full model-level `admin-v2-*` variants for `payment-intent`, `invoice`, `currency`, and `widget`.
- Add relation-level `admin-v2-*` variants for:
  - `payment-intents-to-currencies`;
  - `payment-intents-to-invoices`.
- Add module-level `admin-v2/overview` and `admin-v2/sidebar-module-item`.
- Integrate `billing` in host admin draft shell.
- Add BDD smoke tests + billing API mocks.

## Incident Log (Subagent Knowledge Base)

Use this section as source of truth before starting any subagent task.

### Incident 1

- **Stage**: Ecommerce admin-v2 relation wiring
- **Symptom**: Runtime error `Functions cannot be passed directly to Client Components`.
- **Root Cause**: Callback props defined/forwarded from server components into client-only chains.
- **Action Taken**: Moved callback wiring to `"use client"` components and removed server-side callback forwarding.
- **Reusable Fix Pattern**: Any `adminForm`/relation callback must originate in a client component.
- **Follow-up**: During new module migration, audit all callback origins before wiring relations.

### Incident 2

- **Stage**: Edit -> Relations interaction
- **Symptom**: Frontend freeze and unresponsive UI when opening relation sidebars.
- **Root Cause**: Over-coupled relation-target logic and unstable component wiring loops.
- **Action Taken**: Simplified relation decomposition and aligned row actions with shared admin-v2 row contract.
- **Reusable Fix Pattern**: Keep strict layering (model form mounts table; relation row handles row actions; shared row handles generic UI state).
- **Follow-up**: Avoid introducing ad-hoc resolver chains in module shell unless strictly necessary.

### Incident 3

- **Stage**: Client form wiring
- **Symptom**: Hydration/runtime inconsistencies in forms.
- **Root Cause**: Passing `isServer={props.isServer}` from client components.
- **Action Taken**: In client files, explicitly pass `isServer={false}`.
- **Reusable Fix Pattern**: In `"use client"` context, never propagate dynamic server flag.
- **Follow-up**: Add review checklist item for `isServer` correctness during all module waves.
- **2026-03-23 recurrence**: Agent admin-v2 form wrappers hit strict `isServer` typing and optional callback payload issues; fixed by forcing `isServer={false}` and guarding empty callback `data`.
- **2026-03-24 recurrence**: Analytic overview `adminForm` callbacks hit the same create-flow typing edge (`data` may be empty); fixed by explicit create/edit branches and `isServer={false}` in form wrappers.

### Incident 4

- **Stage**: Shared/admin-v2 contract drift
- **Symptom**: Extra prop drilling and type conflicts (`relatedContext`/legacy fields).
- **Root Cause**: Carrying unused legacy props through relation tables/rows.
- **Action Taken**: Keep legacy only where required by shared interfaces; avoid extending it in new modules.
- **Reusable Fix Pattern**: New migrations should use only props that are actively consumed.
- **Follow-up**: Validate prop usage before introducing new contract extensions.

### Incident 5

- **Stage**: Analytic admin-v2 model variant wiring
- **Symptom**: Type errors in admin-v2 form wrappers (`props.variant`/form contract fields missing).
- **Root Cause**: Copied legacy `admin` form interface pattern (`interface extends ...`) into `admin-v2`, while shared `admin-v2/form` contract expects the type-alias pattern used in reference modules.
- **Action Taken**: Switched analytic `admin-v2/form/interface.ts` to type-alias declarations mirroring `agent`/`ecommerce` (`IComponentProps` + `IComponentPropsExtended`).
- **Reusable Fix Pattern**: For any new `admin-v2/form` in module migrations, copy interface structure from a known-good `admin-v2` module, not from legacy `admin`.
- **Follow-up**: Add migration checklist item to verify `admin-v2/form/interface.ts` shape before running full host build.
- **2026-03-27 recurrence**: Billing relation `admin-v2/form` wrappers hit the same contract mismatch when copied from legacy `admin` interface style; fixed by switching to the `admin-v2` type-alias pattern used in `agent`/`analytic`.

### Incident 6

- **Stage**: Billing relation UI parity
- **Symptom**: Relation tables rendered directly inside details fields in billing forms (`payment-intent`, `invoice`, `currency`), unlike ecommerce behavior.
- **Root Cause**: Overview relation wiring was correct, but model-level admin-v2 forms did not implement `Details/Relations` container contract and rendered relation sections inline in details content.
- **Action Taken**: Implemented `Details/Relations` main tabs + nested relation tabs in relation-bearing billing model forms; relation tables now render only in `Relations`.
- **Reusable Fix Pattern**: Relation-bearing model forms must own tabbed presentation (`Details/Relations`), while overview `admin-v2-form` owns relation wiring only.
- **Follow-up**: Treat `thoughts/shared/research/singlepagestartup/ISSUE-145-admin-v2-playbook.md` as mandatory reference before migrating any next relation-bearing module.

## Stage Log (Epoch-2)

### 2026-03-27 — Phase 4 rework delivered (`billing`, `agent`, `analytic` overview parity)

- Root-cause analysis from screenshots confirmed billing relation UX regression versus ecommerce:
  - relation tables were rendered in details content, not under `Relations` tab.
- Billing fixes implemented:
  - relation-bearing model forms now follow ecommerce contract with `Details/Relations` tabs and nested relation tabs:
    - `payment-intent`: `Invoices`, `Currencies` (badge `2`);
    - `invoice`: `Payment intents` (badge `1`);
    - `currency`: `Payment intents` (badge `1`);
  - relation section rendering in client callbacks standardized to `isServer: false`.
- Structural parity refactor implemented for module overviews:
  - `billing`, `agent`, `analytic` overviews now use model-scoped folders:
    `overview/<model>/{index,interface,variants,admin-v2-card,admin-v2-table,admin-v2-form}`.
  - Removed flat overview layout (`*-card`, `*-table`) for these modules.
- Documentation hardening:
  - Added rollout playbook:
    `thoughts/shared/research/singlepagestartup/ISSUE-145-admin-v2-playbook.md`.
  - Linked playbook and updated migration rules in ISSUE-145 plan/research docs.

### 2026-03-27 — Phase 4 implementation delivered (`billing`)

- Re-ran `core-30-implement` gate for ISSUE-145:
  - status confirmed as `In Dev`;
  - synced issue comments before implementation (no new scope changes).
- Implemented full model-level `admin-v2` variants for `billing` models:
  - `payment-intent`: `admin-v2-table-row`, `admin-v2-table`, `admin-v2-select-input`,
    `admin-v2-form`, `admin-v2-card`, `admin-v2-sidebar-item`;
  - `invoice`: `admin-v2-table-row`, `admin-v2-table`, `admin-v2-select-input`,
    `admin-v2-form`, `admin-v2-card`, `admin-v2-sidebar-item`;
  - `currency`: `admin-v2-table-row`, `admin-v2-table`, `admin-v2-select-input`,
    `admin-v2-form`, `admin-v2-card`, `admin-v2-sidebar-item`;
  - `widget`: `admin-v2-table-row`, `admin-v2-table`, `admin-v2-select-input`,
    `admin-v2-form`, `admin-v2-card`, `admin-v2-sidebar-item`.
- Implemented relation-level `admin-v2` variants for:
  - `payment-intents-to-currencies`: `admin-v2-table-row`, `admin-v2-table`,
    `admin-v2-select-input`, `admin-v2-form`;
  - `payment-intents-to-invoices`: `admin-v2-table-row`, `admin-v2-table`,
    `admin-v2-select-input`, `admin-v2-form`.
- Implemented module-level `admin-v2` shell for `billing`:
  - `libs/modules/billing/frontend/component/src/lib/admin-v2/overview/*`;
  - `libs/modules/billing/frontend/component/src/lib/admin-v2/sidebar-module-item/*`.
- Exported new module-level entrypoints from `@sps/billing/frontend/component`:
  - `AdminV2Overview`;
  - `AdminV2SidebarModuleItem`.
- Integrated `billing` into host admin draft shell:
  - `apps/host/src/components/admin-panel-draft/Component.tsx`.
- Added billing e2e support:
  - API mocks: `apps/host/e2e/support/mock-billing-api.ts`;
  - BDD smoke scenario: `apps/host/e2e/singlepage/billing-admin-v2-smoke.e2e.ts`.
- Automated verification summary:
  - ✅ `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:next:build`
  - ✅ `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:eslint:lint`
  - ✅ `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:e2e -- --project=singlepage --testFiles=apps/host/e2e/singlepage/billing-admin-v2-smoke.e2e.ts --list`
  - ✅ `PW_USE_WEBSERVER=1 NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:e2e -- --project=singlepage --testFiles=apps/host/e2e/singlepage/billing-admin-v2-smoke.e2e.ts`

### 2026-03-24 — Phase 3 implementation delivered (`analytic`)

- Re-ran `core-30-implement` gate for ISSUE-145:
  - status confirmed as `In Dev`;
  - synced issue comments before implementation.
- Implemented full model-level `admin-v2` variants for `analytic` models:
  - `metric`: `admin-v2-table-row`, `admin-v2-table`, `admin-v2-select-input`,
    `admin-v2-form`, `admin-v2-card`, `admin-v2-sidebar-item`;
  - `widget`: `admin-v2-table-row`, `admin-v2-table`, `admin-v2-select-input`,
    `admin-v2-form`, `admin-v2-card`, `admin-v2-sidebar-item`.
- Implemented module-level `admin-v2` shell for `analytic`:
  - `libs/modules/analytic/frontend/component/src/lib/admin-v2/overview/*`;
  - `libs/modules/analytic/frontend/component/src/lib/admin-v2/sidebar-module-item/*`.
- Exported module-level entrypoints from `@sps/analytic/frontend/component`:
  - `AdminV2Overview`;
  - `AdminV2SidebarModuleItem`.
- Integrated `analytic` into host admin draft shell:
  - `apps/host/src/components/admin-panel-draft/Component.tsx`.
- Added analytic e2e support:
  - API mocks: `apps/host/e2e/support/mock-analytic-api.ts`;
  - BDD smoke scenario: `apps/host/e2e/singlepage/analytic-admin-v2-smoke.e2e.ts`.
- Automated verification summary:
  - ✅ `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:next:build`
  - ✅ `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:e2e -- --project=singlepage --testFiles=apps/host/e2e/singlepage/analytic-admin-v2-smoke.e2e.ts --list`
  - ✅ `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:eslint:lint` (warnings exist in unrelated legacy e2e files; no lint errors from analytic rollout changes)

### 2026-03-23 — Phase 2 session resumed (agent implementation)

- Re-ran `core-30-implement` status gate: issue remains `In Dev`.
- Re-read canonical plan/research/progress artifacts and synced issue comments.
- Started active implementation work for:
  - model-level `admin-v2-*` variants for `agent` and `widget`;
  - module-level `admin-v2/overview` and `admin-v2/sidebar-module-item`;
  - host shell integration and agent e2e smoke coverage.

### 2026-03-23 — Phase 2 implementation delivered

- Implemented full model-level `admin-v2` variants for `agent` and `widget`:
  - `admin-v2-table-row`, `admin-v2-table`, `admin-v2-select-input`,
    `admin-v2-form`, `admin-v2-card`, `admin-v2-sidebar-item`.
- Implemented module-level `admin-v2` shell for `agent`:
  - `frontend/component/src/lib/admin-v2/overview/*`;
  - `frontend/component/src/lib/admin-v2/sidebar-module-item/*`.
- Exported new module-level entrypoints from `@sps/agent/frontend/component`:
  - `AdminV2Overview`;
  - `AdminV2SidebarModuleItem`.
- Integrated `agent` into host admin draft shell in
  `apps/host/src/components/admin-panel-draft/Component.tsx`.
- Added agent API mock helper:
  - `apps/host/e2e/support/mock-agent-api.ts`.
- Added BDD smoke scenario:
  - `apps/host/e2e/singlepage/agent-admin-v2-smoke.e2e.ts`.
- Automated verification summary:
  - ✅ `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:next:build`
  - ✅ `PW_SKIP_WEBSERVER=1 NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:e2e -- --project=singlepage --testFiles=apps/host/e2e/singlepage/agent-admin-v2-smoke.e2e.ts --list`
  - ⚠️ Full e2e execution with managed webserver timed out in this environment:
    `Error: Timed out waiting 320000ms from config.webServer.`

### 2026-03-23 — Agent add-new sidebar hotfix

- Investigated regression reported during manual QA:
  `Add new` for `/admin/agent/agent` and `/admin/agent/widget` opened an empty
  right sidebar.
- Root cause:
  module-level `adminForm` callbacks in agent overview tables returned `null`
  when callback `data` was absent; for create flow, shared table controller
  intentionally calls `adminForm({ isServer: false })` without entity data.
- Fix:
  removed `if (!data) return null` guard in:
  - `libs/modules/agent/frontend/component/src/lib/admin-v2/overview/agent-table/ClientComponent.tsx`
  - `libs/modules/agent/frontend/component/src/lib/admin-v2/overview/widget-table/ClientComponent.tsx`
- Verification:
  - ✅ `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:next:build`
  - Manual UI verification pending from requester.

### 2026-03-22 — Rescope + Documentation Realignment

- Reclassified ISSUE-145 as global rollout tracker.
- Updated plan/research/progress docs to:
  - preserve ecommerce as completed reference stage;
  - set `agent` as active stage;
  - define relation migration blueprint for future relation-bearing modules;
  - add subagent-friendly incident format.

## Next Actions

0. Before implementing the next module, read mandatory playbook:
   `thoughts/shared/research/singlepagestartup/ISSUE-145-admin-v2-playbook.md`.
1. Run manual verification for `analytic` routes:
   `/admin/analytic`, `/admin/analytic/metric`, `/admin/analytic/widget`.
2. Run manual verification for `billing` routes:
   `/admin/billing`, `/admin/billing/payment-intent`, `/admin/billing/invoice`,
   `/admin/billing/currency`, `/admin/billing/widget`.
3. After manual approval, proceed to next rollout module in order: `blog`.

## Blocking Risks

1. **Server/client callback boundary regressions**

- Risk: runtime errors on relation/model actions.
- Mitigation: enforce client-only callback wiring review.

2. **Host shell regressions while adding new module blocks**

- Risk: incorrect URL gating or simultaneous render side effects.
- Mitigation: keep module components route-guarded and add smoke checks per route.

3. **Relation modules after agent**

- Risk: repeated re-discovery of known pitfalls.
- Mitigation: require Incident Log review before each new relation-heavy module stage.

---

**Status**: `in_progress`  
**Current owner stage**: `billing rework verification`  
**Last updated**: 2026-03-27
