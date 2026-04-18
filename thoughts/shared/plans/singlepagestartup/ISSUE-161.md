# Fix Website Builder buttons-array admin route showing Button table Implementation Plan

## Overview

Adopt a shared admin-v2 exact model-route matcher based on parsed route segments, use it to fix the current Website Builder `button`/`buttons-array` collision, and audit other admin-v2 model routes for the same prefix-overlap failure mode so confirmed sibling collisions are fixed with the same implementation pattern.

## Current State Analysis

Website Builder admin-v2 renders every model-specific table wrapper for module routes and relies on each wrapper to decide whether it should display. The `button` and `buttons-array` wrappers currently use overlapping `startsWith` checks, so the shorter `button` prefix also matches `/admin/website-builder/buttons-array`.

The same prefix-matching pattern is also used in sidebar item wrappers, which means navigation state can drift from the intended model selection for the same reason as the overview/table rendering.

This is not isolated to Website Builder. A repo scan of admin-v2 wrappers confirmed the same risk pattern in at least `ecommerce` and `social`, where `attribute` and `attribute-key` are matched with the same overlapping `startsWith` logic. The codebase already has a shared admin-route parser that extracts `{ module, model }` from a normalized admin path, but these wrappers are not using that exact-segment information yet.

## Desired End State

Opening `/admin/website-builder/buttons-array` renders only the `Buttons Array` heading, `buttons-array` admin-v2 table, and `buttons-array` sidebar item as active. Opening `/admin/website-builder/button` continues to render only the `Button` heading, `button` admin-v2 table, and `button` sidebar item as active. The same exact-match behavior is applied to other confirmed prefix-collision pairs discovered in the audit, starting with `ecommerce` and `social` `attribute`/`attribute-key`.

After implementation, admin-v2 model wrappers should no longer rely on raw `startsWith("/module/model")` checks when a model slug can be a prefix of another slug. Instead, they should use a shared exact model-route matcher built on parsed admin route segments so future prefix-overlap bugs are prevented by default.

### Key Discoveries

- Website Builder overview renders all model table wrappers for in-module routes, so route safety depends on each child wrapper's local activation logic: `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/Component.tsx:11-70`
- The current Website Builder `button` route gate is an overlapping prefix check and is the immediate cause of the bug: `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/button/admin-v2-table/ClientComponent.tsx:8-15`
- The same Website Builder prefix pattern is duplicated in sidebar item wrappers, so the render bug and active-state bug have the same root cause: `libs/modules/website-builder/frontend/component/src/lib/admin-v2/sidebar-module-item/button/Component.tsx:4-14`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/sidebar-module-item/buttons-array/Component.tsx:4-14`
- Confirmed additional collisions already exist in other modules. `ecommerce` `attribute` and `attribute-key` use the same overlapping route pattern in overview and sidebar wrappers: `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/overview/attribute/admin-v2-table/ClientComponent.tsx:8-15`, `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/overview/attribute-key/admin-v2-table/ClientComponent.tsx:8-15`, `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/sidebar-module-item/attribute/Component.tsx:4-14`, `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/sidebar-module-item/attribute-key/Component.tsx:4-14`
- `social` repeats the same `attribute`/`attribute-key` overlap pattern, confirming this is a reusable admin-v2 routing problem rather than a single-module anomaly: `libs/modules/social/frontend/component/src/lib/admin-v2/overview/attribute/admin-v2-table/ClientComponent.tsx:8-13`, `libs/modules/social/frontend/component/src/lib/admin-v2/overview/attribute-key/admin-v2-table/ClientComponent.tsx:8-15`, `libs/modules/social/frontend/component/src/lib/admin-v2/sidebar-module-item/attribute/Component.tsx:4-12`, `libs/modules/social/frontend/component/src/lib/admin-v2/sidebar-module-item/attribute-key/Component.tsx:4-14`
- The repository already has a shared admin-route parser and spec surface that can be extended into an exact model-route helper instead of inventing another local matcher: `libs/shared/frontend/client/utils/src/lib/admin-route/index.ts:19-35`, `libs/shared/frontend/client/utils/src/lib/admin-route/index.spec.ts:9-49`

## What We're NOT Doing

- No backend or SDK route changes for Website Builder, Ecommerce, or Social models
- No blanket migration of every admin-v2 wrapper in the repository when there is no confirmed prefix-overlap risk
- No redesign of admin-v2 cards, forms, or table presentation
- No changes to model slugs, API paths, or sidebar information architecture beyond fixing exact route selection and active-state behavior

## Implementation Approach

Promote route matching out of ad-hoc `startsWith` checks and into a shared exact matcher built on the existing admin-route parser in `libs/shared/frontend/client/utils`. The matcher should compare the normalized admin route's `module` and `model` segments directly, which solves the current Website Builder bug and future-proofs other modules against the same prefix-overlap class of error.

Run a targeted audit of admin-v2 overview and sidebar wrappers that still use raw model-prefix `startsWith` matching. The current audit has already confirmed Website Builder `button`/`buttons-array` and Ecommerce/Social `attribute`/`attribute-key` as affected pairs, so those should be included in implementation scope rather than deferred. Use shared tests for the matcher itself plus focused component regression coverage to prove the fix works across both the original bug and at least one additional collision family.

## Phase 1: Build Shared Exact Model-Route Matching And Lock In The Audit Scope

### Overview

Extend the existing shared admin-route utilities with an exact model matcher and document the confirmed prefix-collision pairs that must migrate off raw `startsWith` checks.

### Changes Required

#### 1. Shared admin-route utility

**Files**:

- `libs/shared/frontend/client/utils/src/lib/admin-route/index.ts`
- `libs/shared/frontend/client/utils/src/lib/index.ts`
  **Why**: The repository already parses admin routes into `{ module, model }`. Extending that shared utility avoids creating another Website Builder-only matcher and gives future admin-v2 wrappers a standard exact-match primitive.
  **Changes**: Add and export a shared helper such as `isAdminModelRoute(path, module, model)` built on `getAdminRoutePath` and `parseAdminRoute`, with exact segment matching instead of prefix matching.

#### 2. Shared admin-route utility tests

**File**: `libs/shared/frontend/client/utils/src/lib/admin-route/index.spec.ts`
**Why**: The future-proof part of this change depends on proving the shared matcher handles prefix-overlap pairs correctly.
**Changes**: Add test cases that explicitly cover `website-builder/button` vs `website-builder/buttons-array` and `ecommerce/attribute` vs `ecommerce/attribute-key`, including positive and negative matches.

#### 3. Audit notes for affected wrappers

**Files**:

- `libs/modules/website-builder/frontend/component/src/lib/admin-v2/**`
- `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/**`
- `libs/modules/social/frontend/component/src/lib/admin-v2/**`
  **Why**: The implementation should fix all confirmed collision pairs with the same shared matcher, not just the first issue report.
  **Changes**: Enumerate and update all overview/sidebar wrappers in the confirmed collision pairs so the scope is explicit before the migration begins.

### Success Criteria

#### Automated Verification

- [ ] Shared frontend client utils tests pass: `npx nx run @sps/shared-frontend-client-utils:jest:test`
- [ ] Shared frontend client utils lint passes: `npx nx run @sps/shared-frontend-client-utils:eslint:lint`

#### Manual Verification

- [ ] The shared matcher contract is explicit enough that new model wrappers can use it without reintroducing prefix matching
- [ ] Confirmed collision pairs are listed up front before component migrations begin

---

## Phase 2: Migrate All Confirmed Collision Pairs To The Shared Matcher

### Overview

Apply the shared exact-match helper to the current Website Builder bug and the other confirmed prefix-collision pairs so rendered content and sidebar state stay aligned.

### Changes Required

#### 1. Website Builder overview and sidebar wrappers

**Files**:

- `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/button/admin-v2-table/ClientComponent.tsx`
- `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/buttons-array/admin-v2-table/ClientComponent.tsx`
- `libs/modules/website-builder/frontend/component/src/lib/admin-v2/sidebar-module-item/button/Component.tsx`
- `libs/modules/website-builder/frontend/component/src/lib/admin-v2/sidebar-module-item/buttons-array/Component.tsx`
  **Why**: These files are the directly reported bug surface and the current visible regression.
  **Changes**: Replace the local raw `startsWith` checks with the shared exact matcher so `button` no longer captures `buttons-array` in either content rendering or sidebar state.

#### 2. Ecommerce `attribute` and `attribute-key` wrappers

**Files**:

- `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/overview/attribute/admin-v2-table/ClientComponent.tsx`
- `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/overview/attribute-key/admin-v2-table/ClientComponent.tsx`
- `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/sidebar-module-item/attribute/Component.tsx`
- `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/sidebar-module-item/attribute-key/Component.tsx`
  **Why**: The audit already confirms the same prefix-overlap bug class here, so leaving it untouched would knowingly preserve the same defect in another module.
  **Changes**: Move all four wrappers to the shared exact matcher and preserve existing headings, table wiring, and sidebar destinations.

#### 3. Social `attribute` and `attribute-key` wrappers

**Files**:

- `libs/modules/social/frontend/component/src/lib/admin-v2/overview/attribute/admin-v2-table/ClientComponent.tsx`
- `libs/modules/social/frontend/component/src/lib/admin-v2/overview/attribute-key/admin-v2-table/ClientComponent.tsx`
- `libs/modules/social/frontend/component/src/lib/admin-v2/sidebar-module-item/attribute/Component.tsx`
- `libs/modules/social/frontend/component/src/lib/admin-v2/sidebar-module-item/attribute-key/Component.tsx`
  **Why**: This module repeats the same exact route-selection bug class and should adopt the shared matcher in the same implementation pass.
  **Changes**: Replace the raw `startsWith` gates with the shared exact matcher for overview and sidebar wrappers.

### Success Criteria

#### Automated Verification

- [ ] Website Builder tests pass: `npx nx run @sps/website-builder:jest:test`
- [ ] Ecommerce tests pass: `npx nx run @sps/ecommerce:jest:test`
- [ ] Social tests pass: `npx nx run @sps/social:jest:test`
- [ ] Lint passes for changed projects: `npx nx run @sps/website-builder:eslint:lint`, `npx nx run @sps/ecommerce:eslint:lint`, `npx nx run @sps/social:eslint:lint`

#### Manual Verification

- [ ] `/admin/website-builder/button` and `/admin/website-builder/buttons-array` each render only their own table and active sidebar item
- [ ] `/admin/ecommerce/attribute` and `/admin/ecommerce/attribute-key` each render only their own table and active sidebar item
- [ ] `/admin/social/attribute` and `/admin/social/attribute-key` each render only their own table and active sidebar item

---

## Phase 3: Add Regression Coverage For Current And Future Prefix Collisions

### Overview

Protect both the shared matcher and the affected module surfaces so prefix-overlap regressions are caught centrally and at the component level.

### Changes Required

#### 1. Shared matcher regression tests

**File**: `libs/shared/frontend/client/utils/src/lib/admin-route/index.spec.ts`
**Why**: The reusable matcher is the long-term protection against future collisions, so it must explicitly codify the negative cases that prefix matching gets wrong.
**Changes**: Add exact-match and non-match cases for `button`/`buttons-array`, `attribute`/`attribute-key`, and a nested-route case where deeper segments still preserve the correct module/model identity.

#### 2. Website Builder admin-v2 regression spec

**File**: `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/Component.spec.tsx`
**Why**: The originally reported bug should be protected at the module-overview level where all model wrappers are composed together.
**Changes**: Add a jsdom overview spec mirroring the existing ecommerce pattern and assert that `/admin/website-builder/buttons-array` renders only the `buttons-array` table path, not `button`.

#### 3. Additional collision-family regression coverage

**Files**:

- `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/overview/Component.spec.tsx`
- `libs/modules/social/frontend/component/src/lib/admin-v2/overview/Component.spec.tsx`
  **Why**: At least one additional collision family beyond Website Builder should be protected at the module level to prove the shared matcher solves the broader problem, not just the original ticket.
  **Changes**: Extend the existing ecommerce overview spec and add a social overview spec so `attribute-key` routes do not activate `attribute` wrappers.

### Success Criteria

#### Automated Verification

- [ ] Shared matcher tests fail if exact segment matching is replaced by prefix matching
- [ ] Module overview tests fail if `button` captures `buttons-array` or `attribute` captures `attribute-key`

#### Manual Verification

- [ ] Manual admin-v2 smoke check confirms the Website Builder, Ecommerce, and Social overview roots still render normally at their module root routes

## Testing Strategy

### Unit Tests

- Cover shared exact model-route matching for positive and negative prefix-overlap cases
- Cover Website Builder overview behavior for `button` vs `buttons-array`
- Cover Ecommerce and Social overview behavior for `attribute` vs `attribute-key`

### Integration Tests

- No backend integration changes are required because the bug class is confined to frontend route gating and sidebar state

### Manual Testing Steps

1. Open `/admin/website-builder`, `/admin/ecommerce`, and `/admin/social` and confirm each module overview root still renders its cards normally.
2. Verify the exact route pairs `/admin/website-builder/button` vs `/admin/website-builder/buttons-array`.
3. Verify the exact route pairs `/admin/ecommerce/attribute` vs `/admin/ecommerce/attribute-key`.
4. Verify the exact route pairs `/admin/social/attribute` vs `/admin/social/attribute-key`.
5. Confirm the active sidebar item and rendered table stay in sync while switching between each collision pair.

## Performance Considerations

The change replaces repeated string-prefix checks with lightweight shared route parsing and exact segment comparison. That adds no meaningful runtime cost while reducing duplicated logic and making future route-matching behavior more predictable.

## Migration Notes

No data migration or API migration is required. This is a frontend route-selection and navigation-state fix only.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-161.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-161.md`

<!-- Last synced at: 2026-04-18T00:32:00Z -->
