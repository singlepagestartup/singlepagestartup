# ISSUE-146 Implementation Plan — Add auth redirect and test coverage for admin-v2 RBAC guard

## Overview

Phases 1–3 of the original plan (rename to admin-v2, apply RBAC guard, remove legacy mount) are complete. This updated plan adds two remaining phases: redirect unauthenticated/unauthorized users to the login page, and add unit test coverage for the auth guard component.

## Current State Analysis

- `apps/host/src/components/admin-v2/ClientComponent.tsx` already implements the 3-step RBAC guard: `RbacSubject(authentication-me-default)` → `RbacRole(find, slug=admin)` → `RbacSubjectsToRoles(find, subjectId+roleId)`.
- On any failure (no user, no admin role, no subject-to-role link), the guard returns `null` — a blank screen with no feedback.
- No redirect exists — users who navigate to `/admin` while unauthenticated see nothing.
- No test coverage exists for this guard component. `apps/host/` has no jest config or test target.
- Existing test infrastructure lives in `libs/shared/frontend/components/` with `dom-harness` and `shadcn-mocks` utilities.
- The codebase uses `useRouter` from `next/navigation` with `router.replace()` for auth-related redirects (see `init-default/ClientComponent.tsx:113`, `select-method-default/ClientComponent.tsx:74`).

### Key Discoveries

- `apps/host/src/components/admin-v2/ClientComponent.tsx:12-13` — first `null` return (no user)
- `apps/host/src/components/admin-v2/ClientComponent.tsx:23-24` — second `null` return (no admin role)
- `apps/host/src/components/admin-v2/ClientComponent.tsx:51-52` — third `null` return (no subject-to-role)
- `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/use-model-table-state.spec.ts:9-13` — canonical `next/navigation` mock pattern
- `apps/host/project.json` — no `test` target exists; only `next:dev`, `next:build`, `next:start`, `next:export`, `eslint:lint`
- `libs/shared/frontend/components/jest.config.ts` — uses `jest.client-preset.js` with `ts-jest`

## Desired End State

- Unauthenticated or non-admin users navigating to `/admin*` are redirected to `/rbac/subject/authentication/select-method`.
- The redirect uses `router.replace()` (no history entry for the failed admin page visit).
- Unit tests cover all four branches of the guard: admin access granted, no user, no admin role, no subject-to-role link.
- Tests run via `npx nx test shared-frontend-components` using the existing jest infrastructure.

## What We're NOT Doing

- Adding jest infrastructure to `apps/host/` (tests go in shared lib alongside existing admin-v2 specs)
- Changing the RBAC guard logic (3-step check remains the same)
- E2E test changes (covered separately by phases 4-5 of the original plan)
- Modifying the login page at `/rbac/subject/authentication/select-method`

## Implementation Approach

Two sequential phases: first add the redirect behavior to the production component, then add unit tests that verify all guard branches including the redirect.

---

## Phase 1: Add redirect on auth failure in admin-v2 guard

### Overview

Replace `return null` with `router.replace("/rbac/subject/authentication/select-method")` + `return null` on all three failure branches.

### Changes Required

#### 1. Add `useRouter` and redirect logic to ClientComponent

**File**: `apps/host/src/components/admin-v2/ClientComponent.tsx`
**Why**: Users currently see a blank screen when not authenticated. Redirecting to the login page improves UX.
**Changes**:

- Import `useRouter` from `next/navigation`
- Call `useRouter()` at the component top level (before any render-prop nesting)
- On each of the three failure branches (lines 12, 23, 51), call `router.replace("/rbac/subject/authentication/select-method")` before returning `null`
- Use a `useEffect`-free approach: since the render-prop callbacks run synchronously during render, call `router.replace` inline (same pattern as the existing guard which calls `return null` inline). Alternatively, if React strict-mode double-render causes issues, wrap in a small `RedirectEffect` helper that calls `router.replace` inside a `useEffect`.

**Decision point**: The simplest approach is inline `router.replace()` in the render callback. If this causes issues (router calls during render), extract a tiny `<Redirect to="..." />` component that does the redirect in a `useEffect`. The codebase precedent (`init-default`, `select-method-default`) uses `useEffect` — follow that pattern for safety.

### Success Criteria

#### Automated Verification

- [ ] Type checking passes: `npx nx run host:next:build`
- [ ] Lint passes: `npx nx run host:eslint:lint`

#### Manual Verification

- [ ] Navigate to `/admin` while unauthenticated → browser redirects to `/rbac/subject/authentication/select-method`
- [ ] Navigate to `/admin` as authenticated non-admin user → browser redirects to `/rbac/subject/authentication/select-method`
- [ ] Navigate to `/admin` as authenticated admin user → admin panel renders normally

---

## Phase 2: Add unit tests for admin-v2 RBAC auth guard

### Overview

Create a spec file that tests the `ClientComponent` auth guard from `apps/host/src/components/admin-v2/`. Since `apps/host/` has no jest infrastructure, the test will live in `libs/shared/frontend/components/` alongside other admin-v2 specs, importing the component via the `@sps/*` path alias or by creating a thin wrapper that replicates the guard pattern.

**Practical approach**: Since the component under test lives in `apps/host/` (not a lib with a jest target), and adding jest to `apps/host/` is out of scope, the test will mock all three RBAC components and `next/navigation`, then import the `ClientComponent` directly using the TypeScript path resolution (the `tsconfig.spec.json` chain resolves `@sps/*` paths, and the component file can be imported by relative path from within the monorepo since ts-jest handles the resolution).

### Changes Required

#### 1. Create spec file for admin-v2 auth guard

**File**: `libs/shared/frontend/components/src/lib/singlepage/admin-v2/auth-guard/ClientComponent.spec.tsx`
**Why**: No test coverage exists for the RBAC auth guard. This is the core security behavior of issue-146.
**Changes**: Create a new spec file following the BDD + dom-harness pattern with these test scenarios:

**Mocks needed**:

- `@sps/rbac/models/subject/frontend/component` — mock `Component` to call `props.children({ data })` with controlled subject data
- `@sps/rbac/models/role/frontend/component` — mock `Component` to call `props.children({ data })` with controlled role data
- `@sps/rbac/relations/subjects-to-roles/frontend/component` — mock `Component` to call `props.children({ data })` with controlled relation data
- `next/navigation` — mock `useRouter` returning `{ replace: jest.fn() }` to capture redirect calls

**Test scenarios**:

1. **WHEN user is authenticated and has admin role THEN children are rendered** — all three RBAC steps return valid data → `props.children` renders
2. **WHEN user is not authenticated THEN redirect to select-method** — `RbacSubject` returns `{ data: undefined }` → `router.replace("/rbac/subject/authentication/select-method")` is called, children are NOT rendered
3. **WHEN user is authenticated but no admin role exists THEN redirect to select-method** — `RbacSubject` returns valid user, `RbacRole` returns roles without `slug: "admin"` → redirect
4. **WHEN user is authenticated and admin role exists but user lacks the role THEN redirect to select-method** — `RbacSubject` returns valid user, `RbacRole` returns admin role, `RbacSubjectsToRoles` returns empty array → redirect

#### 2. Create the re-export or wrapper for testability (if needed)

**File**: `libs/shared/frontend/components/src/lib/singlepage/admin-v2/auth-guard/ClientComponent.tsx` (optional)
**Why**: If importing directly from `apps/host/` proves problematic for the jest runner, create a thin file that re-exports or copies the guard component pattern. This keeps tests colocated with the existing admin-v2 test infrastructure.
**Changes**: Re-export or replicate the guard component so it's testable within the lib's jest scope.

### Success Criteria

#### Automated Verification

- [ ] Tests pass: `npx nx test shared-frontend-components -- --testPathPattern="auth-guard"`
- [ ] All four scenarios (admin access, no user, no admin role, no subject-to-role) are covered
- [ ] `router.replace` is called with exact path `"/rbac/subject/authentication/select-method"` in all three failure scenarios

#### Manual Verification

- [ ] Test output shows 4 passing test cases with BDD naming

---

## Testing Strategy

### Unit Tests (Phase 2)

- Mock all external RBAC components to isolate the guard logic
- Verify `router.replace` is called with the correct redirect URL on every failure path
- Verify children render only when all three checks pass
- Use `dom-harness` pattern consistent with existing admin-v2 specs

### Manual Testing (Phase 1)

1. Start services: `npm run api:dev`, `npm run host:dev`
2. Open `/admin` in incognito → should redirect to login page
3. Log in as non-admin user → navigate to `/admin` → should redirect
4. Log in as admin user → navigate to `/admin` → should see admin panel

## References

- Ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-146.md`
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-146.md`
- Auth guard component: `apps/host/src/components/admin-v2/ClientComponent.tsx`
- Redirect target page seed: `libs/modules/host/models/page/backend/repository/database/src/lib/data/67a7e8d8-5e05-4c25-b578-f0fb62ed6964.json`
- Existing `next/navigation` mock pattern: `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/use-model-table-state.spec.ts:9-13`
- Existing dom-harness: `libs/shared/frontend/components/src/lib/singlepage/admin-v2/test-utils/dom-harness.tsx`
- RBAC redirect precedent: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/init-default/ClientComponent.tsx:109-115`

<!-- Last synced at: 2026-04-05T12:00:00Z -->
