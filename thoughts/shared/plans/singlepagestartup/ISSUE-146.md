# ISSUE-146 Implementation Plan - Rename `admin-panel-draft` to `admin-v2` and enforce admin RBAC access

## Overview

`admin-panel-draft` is the new admin UI and must become the canonical `admin-v2` implementation.  
This plan renames that component surface to `admin-v2`, keeps `/admin*` on the new panel, and adds admin-role access checks using the same RBAC contract currently used in `apps/host/src/components/admin`.

## Current State Analysis

Admin behavior is currently split across two implementations:

- `/admin*` is routed to draft UI in `apps/host/app/[[...url]]/page.tsx` (`:7`, `:55`, `:57`).
- Legacy `Admin` is mounted globally in `apps/host/app/layout.tsx` (`:11`, `:45`).

RBAC access checking exists only in legacy admin:

- `apps/host/src/components/admin/ClientComponent.tsx` loads current subject (`:10`), resolves admin role (`:17`), checks subject-role membership with `variant="find"` and filters (`:30`, `:50`), then renders dashboard only when role relation exists (`:55`).

Draft admin (`admin-panel-draft`) currently has no equivalent RBAC gate:

- Root section with `data-testid="admin-prototype-body"` is always rendered by route path (`apps/host/src/components/admin-panel-draft/Component.tsx:74`).
- Settings/profile links are present (`:81`, `:164`), and settings/account page components exist in folder but are commented in root draft component (`:62`, `:63`, `:197`).

E2E coverage currently validates draft selectors and uses API mocks:

- `apps/host/e2e/singlepage/admin-shell.e2e.ts` and `admin-visibility-guards.e2e.ts` assert `admin-prototype-*`, `settings-page`, and `account-settings-page`.
- Both suites rely on `setupEcommerceApiMocks(page)` instead of RBAC subject lifecycle provisioning.

RBAC lifecycle scripts are incomplete:

- `apps/api/create_rbac_subject.sh` exists and assigns admin role (`:29`, `:34`, `:52`, `:70`, `:92`, `:116`).
- `apps/api/delete_rbac_subject.sh` is missing.

### Key Discoveries

- The target UI to keep is the current draft shell; the required change is naming + RBAC gating, not decommissioning it.
- Legacy `admin` already provides the exact role-check pattern to reuse.
- OpenAPI contracts already expose delete operations for subject, identity, and RBAC relations, enabling safe cleanup script implementation.

## Desired End State

- `admin-panel-draft` is renamed to `admin-v2` in host component paths and imports.
- `/admin*` renders `admin-v2` as the canonical admin interface.
- `admin-v2` visibility is gated by the same admin-role membership logic used by legacy `admin`.
- Legacy global admin mount is removed or reduced so there is no duplicate admin rendering path.
- E2E coverage validates admin behavior with real RBAC lifecycle:
  - create admin subject before tests,
  - authenticate/use that identity in browser context,
  - always delete subject after tests.
- `apps/api/delete_rbac_subject.sh` exists, is idempotent, and safe for local/CI reruns.

## What We're NOT Doing

- Reverting to old `admin` UI as the primary `/admin*` surface.
- New visual redesign outside current admin-v2 scope.
- Broad RBAC architecture refactors unrelated to admin-role gating and test lifecycle.

## Implementation Approach

Perform migration in five phases:

1. Rename and rewire host admin-v2 component ownership.
2. Apply legacy RBAC admin-role check to admin-v2 entrypoint.
3. Remove duplicate legacy global mount and finalize routing ownership.
4. Implement missing RBAC delete lifecycle script.
5. Update e2e to validate final behavior with guaranteed create/cleanup flow.

## Phase 1: Rename `admin-panel-draft` to `admin-v2`

### Overview

Promote draft naming to production naming without changing intended admin-v2 feature ownership.

### Changes Required

#### 1. Rename component directory and entrypoints

**Files**: `apps/host/src/components/admin-panel-draft/*` -> `apps/host/src/components/admin-v2/*`  
**Why**: Current name no longer reflects intended production role.  
**Changes**: Rename folder/files and preserve exports/interfaces under new `admin-v2` path.

#### 2. Update host route imports

**File**: `apps/host/app/[[...url]]/page.tsx`  
**Why**: `/admin*` route currently imports `admin-panel-draft`.  
**Changes**: Repoint import/render to `admin-v2`.

#### 3. Update impacted references/tests

**Files**: affected host/e2e imports and selectors  
**Why**: Existing tests and references use draft naming and prototype test IDs.  
**Changes**: Rename references to `admin-v2` contracts.

### Success Criteria

#### Automated Verification

- [ ] Build passes: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:next:build`
- [ ] Lint passes: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:eslint:lint`

#### Manual Verification

- [ ] `/admin` still opens the same functional admin-v2 shell after renaming.

---

## Phase 2: Apply RBAC Admin-Role Gate to `admin-v2`

### Overview

Make admin-v2 access conditional on admin-role membership, aligned with legacy admin behavior.

### Changes Required

#### 1. Reuse legacy RBAC check pattern

**Reference**: `apps/host/src/components/admin/ClientComponent.tsx`  
**Why**: This is the existing proven gate logic.  
**Changes**: Port/extract equivalent logic into admin-v2 entry flow:

- fetch current subject via `authentication-me-default`,
- resolve `admin` role from roles `find`,
- query `subjects-to-roles` with `subjectId` + `roleId`,
- render admin-v2 only when relation exists.

#### 2. Guard settings/profile/admin-v2 routes under same access contract

**Files**: `apps/host/src/components/admin-v2/*`  
**Why**: New panel and its subroutes must not bypass admin role checks.  
**Changes**: Ensure all admin-v2 route branches inherit the RBAC gate behavior.

### Success Criteria

#### Automated Verification

- [ ] Targeted admin e2e specs pass with RBAC-enabled visibility expectations.

#### Manual Verification

- [ ] Admin user sees admin-v2.
- [ ] Non-admin/non-authenticated user cannot access admin-v2 content.

---

## Phase 3: Finalize Single Admin Ownership in Host Layout

### Overview

Avoid duplicate admin rendering by consolidating ownership in route-level admin-v2.

### Changes Required

#### 1. Remove/adjust global legacy mount

**File**: `apps/host/app/layout.tsx`  
**Why**: Global `<Admin />` mount currently creates a parallel admin path outside `/admin*`.  
**Changes**: Remove or neutralize global mount after admin-v2 gate is in place.

#### 2. Keep `/admin*` ownership in route file

**File**: `apps/host/app/[[...url]]/page.tsx`  
**Why**: Admin surface should be owned by route-level admin-v2 flow only.  
**Changes**: Ensure `/admin*` branch is the single host entrypoint for admin UI.

### Success Criteria

#### Automated Verification

- [ ] Host build/lint remain green after mount consolidation.

#### Manual Verification

- [ ] Non-admin pages do not show any admin overlay/button.
- [ ] `/admin*` behavior is consistent and non-duplicated.

---

## Phase 4: Add `apps/api/delete_rbac_subject.sh`

### Overview

Implement missing cleanup command required by issue scope and e2e lifecycle.

### Changes Required

#### 1. Implement idempotent delete flow

**File**: `apps/api/delete_rbac_subject.sh`  
**Why**: Cleanup command is explicitly required and currently absent.  
**Changes**: Implement safe cleanup for configured identity/subject:

- locate subject for configured identity (by auth or direct lookup),
- delete `subjects-to-roles` links for subject,
- delete `subjects-to-identities` links for subject,
- delete linked identity record(s),
- delete subject record,
- treat missing records as successful no-op.

#### 2. Keep script contract aligned with existing env setup

**Files**: `apps/api/create_env.sh`, `apps/api/create_rbac_subject.sh` (only if needed for alignment)  
**Why**: lifecycle scripts should share same env keys and execution assumptions.  
**Changes**: ensure same `RBAC_SUBJECT_IDENTITY_EMAIL`, `RBAC_SUBJECT_IDENTITY_PASSWORD`, and `RBAC_SECRET_KEY` contract.

### Success Criteria

#### Automated Verification

- [ ] `bash apps/api/create_rbac_subject.sh` succeeds.
- [ ] `bash apps/api/delete_rbac_subject.sh` succeeds.
- [ ] repeated `delete_rbac_subject.sh` execution remains non-fatal.

#### Manual Verification

- [ ] Created admin test subject is removed after cleanup run.

---

## Phase 5: Update E2E to Use RBAC Lifecycle + Admin-v2 Contracts

### Overview

Replace draft-only assumptions with tests that validate final admin-v2 + RBAC behavior.

### Changes Required

#### 1. Add lifecycle orchestration helper

**Files**: `apps/host/e2e/support/*` (new helper)  
**Why**: current e2e layer has no setup/teardown for shell scripts.  
**Changes**: add helper(s) for:

- running `create_rbac_subject.sh` in setup,
- obtaining auth token/cookie context for browser session,
- always running `delete_rbac_subject.sh` in teardown (`finally`/`afterAll`).

#### 2. Update admin suites

**Files**: `apps/host/e2e/singlepage/admin-shell.e2e.ts`, `apps/host/e2e/singlepage/admin-visibility-guards.e2e.ts` (or replacement suites)  
**Why**: current suites are tied to draft/prototype naming and mock-only assumptions.  
**Changes**: validate final admin-v2 selectors/routes and RBAC-gated visibility semantics.

#### 3. Keep deterministic module data mocking where needed

**File**: `apps/host/e2e/support/mock-ecommerce-api.ts`  
**Why**: RBAC lifecycle should be real while module-table datasets can remain deterministic and fast.  
**Changes**: continue targeted API mocks for non-RBAC data dependencies.

### Success Criteria

#### Automated Verification

- [ ] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:e2e -- --project=singlepage --testFiles=apps/host/e2e/singlepage/<admin-spec>.e2e.ts --list`
- [ ] `PW_USE_WEBSERVER=1 NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:e2e -- --project=singlepage --testFiles=apps/host/e2e/singlepage/<admin-spec>.e2e.ts`

#### Manual Verification

- [ ] test run logs show create step and guaranteed cleanup step.
- [ ] rerun does not fail due to stale subject state.

---

## Testing Strategy

### Automated

- Host build + lint after routing/component ownership changes.
- Targeted singlepage admin e2e suites with lifecycle orchestration.

### Manual

1. Start infra/services (`./up.sh`, `npm run api:dev`, `npm run host:dev`).
2. Verify `/admin*` opens `admin-v2` only for admin-role user.
3. Verify non-admin state does not render admin-v2 content.
4. Run updated admin e2e twice to validate idempotent cleanup.

## Performance Considerations

- Execute create/delete lifecycle once per relevant suite (`beforeAll`/`afterAll`) instead of per test.
- Keep high-volume module API responses mocked for speed and determinism.

## Migration Notes

- Rename is semantic promotion (`draft` -> `v2`), not feature rollback.
- RBAC gate behavior must stay equivalent to legacy admin role check.
- Cleanup script must be CI-safe and non-interactive.

## References

- Ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-146.md`
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-146.md`
- Route entrypoint: `apps/host/app/[[...url]]/page.tsx`
- Legacy admin RBAC gate: `apps/host/src/components/admin/ClientComponent.tsx`
- Current draft shell: `apps/host/src/components/admin-panel-draft/Component.tsx`
- Admin e2e suites:
  - `apps/host/e2e/singlepage/admin-shell.e2e.ts`
  - `apps/host/e2e/singlepage/admin-visibility-guards.e2e.ts`
- RBAC create script: `apps/api/create_rbac_subject.sh`

## Open Questions

None. Scope and implementation direction are clear with current codebase contracts.
