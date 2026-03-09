# Admin Panel V2 — Ecommerce Pilot Fix & Complete

## Overview

Fix and complete the ecommerce admin-v2 pilot implementation. The shared admin-v2 infrastructure and ecommerce variant files exist but contain several bugs and incomplete logic that prevent the admin panel from working correctly. This plan addresses all identified issues in the host integration, shared components, and ecommerce-specific variants.

## Current State Analysis

The admin-v2 migration has three layers in place:

1. **Draft reference** (`apps/drafts/incoming/admin-v2/`) — Complete React prototype with mock data for all 15 modules
2. **Shared infrastructure** (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/`) — 54 files providing panel, table, table-row, table-controller, form, select-input, model-header components
3. **Ecommerce pilot** — Product (6 variants), Attribute (6 variants), Products-to-attributes (4 variants) files exist but have bugs

### Key Discoveries:

- `apps/host/src/components/admin-panel-draft/ClientComponent.tsx:23-29`: All three page components (ecommerce, settings, account) render simultaneously with no URL-based visibility guard
- `libs/shared/frontend/components/src/lib/singlepage/admin-v2/panel/ClientComponent.tsx:66-106`: Settings button block is fully commented out
- `libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/admin-v2/module-overview-card/ClientComponent.tsx:31`: Count badge is commented out despite data being fetched
- `libs/modules/ecommerce/models/attribute/frontend/component/src/lib/singlepage/admin-v2/table/index.tsx:17-27`: `defaultAdminForm` passes no relation props, making Relations tab permanently disabled
- `libs/modules/ecommerce/models/attribute/frontend/component/src/lib/singlepage/admin-v2/select-input/interface.ts:6`: Imports from old `admin/select-input/interface` instead of `admin-v2`
- `libs/modules/ecommerce/relations/products-to-attributes/frontend/component/src/lib/singlepage/admin-v2/table/Component.tsx:10`: Uses `index` as React key instead of `entity.id`
- `libs/modules/ecommerce/relations/products-to-attributes/frontend/component/src/lib/singlepage/admin-v2/table-row/Component.tsx:40`: Passes `{ id: props.data.attributeId } as any` — incomplete model type cast

## Desired End State

The admin panel at `/admin` renders correctly with:

- Proper URL-based page routing (ecommerce panel, settings, account settings)
- Collapsible sidebar with settings link
- Ecommerce module dashboard showing product and attribute cards with counts
- Product and attribute tables with working search, pagination, create, edit, delete
- Product form with working Relations tab showing products-to-attributes
- Attribute form with working Relations tab showing its relations
- Relation create form pre-fills foreign key when accessed from parent context

### Verification:

- `npx nx run host:build` succeeds without type errors
- Navigate to `/admin` → see ecommerce module dashboard
- Navigate to `/admin/ecommerce/product` → see product table with working CRUD
- Edit a product → Relations tab shows products-to-attributes with working CRUD
- Navigate to `/admin/settings` → see settings page (not overlapping with ecommerce)
- Navigate to `/admin/settings/account` → see account page

## What We're NOT Doing

- Migrating other 14 modules to admin-v2 (separate issue)
- Implementing the full navigation sidebar with all 15 modules
- Replacing static mock data in AccountSettingsPage with live API calls
- Adding TipTap rich text editor (exists in draft but not in shared infrastructure)
- Implementing the PreviewDialog component from the draft
- Adding dark mode or theme switching

## Implementation Approach

Work bottom-up: fix shared components first, then model-specific components, then host integration, so each layer is correct before the next layer consumes it.

## Phase 1: Fix Shared Panel Component

### Overview

Uncomment and properly wire the settings button in the sidebar so users can navigate to settings.

### Changes Required:

#### 1. Panel ClientComponent — uncomment settings button

**File**: `libs/shared/frontend/components/src/lib/singlepage/admin-v2/panel/ClientComponent.tsx`
**Why**: The settings button (lines 66-106) is fully commented out. The draft shows a settings button at the bottom of the sidebar that navigates to `/admin/settings`.
**Changes**: Uncomment the settings button JSX block. Wire it to use `settingsHref` prop (already in the interface) for navigation via Next.js `Link`.

### Success Criteria:

#### Automated Verification:

- [ ] Type checking passes: `npx nx run shared-frontend-components:typecheck` (or equivalent)

#### Manual Verification:

- [ ] Settings button visible at bottom of admin sidebar
- [ ] Clicking settings navigates to `/admin/settings`

---

## Phase 2: Fix Ecommerce Model Components

### Overview

Fix bugs in product and attribute admin-v2 variants — count badge, relation props, select-input consistency.

### Changes Required:

#### 1. Product module-overview-card — uncomment count badge

**File**: `libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/admin-v2/module-overview-card/ClientComponent.tsx`
**Why**: Line 31 has the count badge commented out (`{/* {isLoading ? "..." : data?.length || 0} */}`) despite `api.find()` being called and data available. The draft shows a count badge on each model card.
**Changes**: Uncomment the count badge rendering to display entity count on the dashboard card.

#### 2. Attribute table — pass relation render props to form

**File**: `libs/modules/ecommerce/models/attribute/frontend/component/src/lib/singlepage/admin-v2/table/index.tsx`
**Why**: Lines 17-27 define `defaultAdminForm` that passes no relation props to `AttributeAdminFormComponent`. This makes the Relations tab permanently disabled for attributes. The product table correctly injects `productsToAttributes` render prop.
**Changes**: Import the relevant relation components and pass them as render props to `AttributeAdminFormComponent` in `defaultAdminForm`. At minimum, wire `attributeKeysToAttributes` and `productsToAttributes` (the two most important attribute relations).

#### 3. Attribute select-input interface — fix import path

**File**: `libs/modules/ecommerce/models/attribute/frontend/component/src/lib/singlepage/admin-v2/select-input/interface.ts`
**Why**: Line 6 imports from `singlepage/admin/select-input/interface` (old V1) while product and products-to-attributes import from `singlepage/admin-v2/select-input/interface`. This inconsistency can cause type mismatches.
**Changes**: Change the import to use `@sps/shared-frontend-components/singlepage/admin-v2/select-input/interface`.

### Success Criteria:

#### Automated Verification:

- [ ] Type checking passes for ecommerce module components

#### Manual Verification:

- [ ] Product dashboard card shows entity count badge
- [ ] Editing an attribute shows Relations tab with available relations
- [ ] Attribute select-input works in relation forms without type errors

---

## Phase 3: Fix Relation Components

### Overview

Fix bugs in products-to-attributes relation variants — React keys, productId pre-fill, type safety.

### Changes Required:

#### 1. Products-to-attributes table — fix React key

**File**: `libs/modules/ecommerce/relations/products-to-attributes/frontend/component/src/lib/singlepage/admin-v2/table/Component.tsx`
**Why**: Line 10 uses `index` as React key instead of `entity.id`. If items are reordered or deleted, React will incorrectly reuse DOM nodes by position.
**Changes**: Change `key={index}` to `key={entity.id}` (or `key={String(entity.id || index)}` for safety).

#### 2. Products-to-attributes table-row — fix type cast

**File**: `libs/modules/ecommerce/relations/products-to-attributes/frontend/component/src/lib/singlepage/admin-v2/table-row/Component.tsx`
**Why**: Line 40 passes `data={{ id: props.data.attributeId } as any}` — an incomplete model object with only `id`. The form/client.tsx will use this id to call `api.findById()`, so only the `id` is needed at the entry point. The `as any` cast can be narrowed.
**Changes**: Keep the `{ id: props.data.attributeId }` pattern (since `form/client.tsx` fetches the full entity by id) but remove the `as any` by using proper typing or a more specific cast.

#### 3. Products-to-attributes create form — pre-fill foreign key from context

**File**: `libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/admin-v2/table/index.tsx`
**Why**: When creating a new products-to-attributes relation from the product's Relations tab, the `adminForm` in `products-to-attributes/table/index.tsx:23-25` renders the form with no `data` prop. The `productId` field starts empty even though the user is already viewing a specific product.
**Changes**: In the product table's `renderProductsToAttributes` function (lines 14-42), pass a custom `adminForm` prop to `ProductsToAttributesComponent` that pre-fills `productId` with the current product's id. This requires adding an `adminForm` prop override to the relation table component call.

### Success Criteria:

#### Automated Verification:

- [ ] Type checking passes for products-to-attributes relation components

#### Manual Verification:

- [ ] Relation table items maintain correct state when items are deleted/reordered
- [ ] Opening "related entity" from a relation row shows the correct attribute form
- [ ] Creating a new relation from a product's Relations tab has productId pre-filled

---

## Phase 4: Fix Host Integration

### Overview

Add URL-based visibility guards so each admin page (ecommerce, settings, account) renders only when its URL is active.

### Changes Required:

#### 1. Admin panel draft ClientComponent — add URL routing

**File**: `apps/host/src/components/admin-panel-draft/ClientComponent.tsx`
**Why**: Lines 23-29 render `EcommerceAdminV2Component`, `SettingsPageClientComponent`, and `AccountSettingsPageClientComponent` simultaneously with no URL guard. All three always render, causing overlapping content.
**Changes**: Read the current pathname and conditionally render the correct component:

- `/admin/settings/account` → render only `AccountSettingsPageClientComponent`
- `/admin/settings` → render only `SettingsPageClientComponent`
- `/admin` or `/admin/ecommerce/**` → render only `EcommerceAdminV2Component`

The `PanelComponent` (sidebar) should wrap all pages so the sidebar is always visible regardless of which page is active.

#### 2. Wire settingsHref to panel

**File**: `apps/host/src/components/admin-panel-draft/ClientComponent.tsx`
**Why**: The `EcommerceAdminV2Component` renders `PanelComponent` internally, but the settings link needs a proper href.
**Changes**: Ensure `settingsHref` is passed through the component chain so the sidebar settings button navigates to `/admin/settings`. The ecommerce `ClientComponent.tsx` already passes `settingsHref` to `PanelComponent` at line 148 — verify this is working correctly after uncommenting the button.

### Success Criteria:

#### Automated Verification:

- [ ] `npx nx run host:build` succeeds
- [ ] Type checking passes: `npx nx run host:typecheck`

#### Manual Verification:

- [ ] `/admin` shows only the ecommerce module dashboard (no settings content visible)
- [ ] `/admin/settings` shows only the settings page with sidebar
- [ ] `/admin/settings/account` shows only the account page with sidebar
- [ ] Sidebar is visible and functional on all admin pages
- [ ] Settings button in sidebar navigates to settings page

---

## Testing Strategy

### Unit Tests:

- No new unit tests needed for this phase — changes are primarily bug fixes to existing components

### Integration Tests:

- Not applicable for this phase

### Manual Testing Steps:

1. Start the host dev server (`npm run host:dev`)
2. Navigate to `/admin` — verify ecommerce dashboard renders with model cards showing counts
3. Click "Product" → verify product table with search/pagination
4. Click "Add new" → verify create form opens in Sheet
5. Edit a product → verify Details tab with form fields
6. Switch to Relations tab → verify products-to-attributes table renders
7. Click "Add new" in relations → verify productId is pre-filled
8. Navigate to `/admin/ecommerce/attribute` → verify attribute table
9. Edit an attribute → verify Relations tab is enabled (not permanently disabled)
10. Click settings in sidebar → verify navigation to `/admin/settings`
11. Verify settings page shows maintenance operations
12. Click user icon → verify account settings page

## Performance Considerations

No performance impact expected — all changes are bug fixes to existing rendering logic, not new data fetching or computation.

## Migration Notes

No data migration needed. All changes are frontend-only.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-145.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-145.md`
- Draft reference: `apps/drafts/incoming/admin-v2/`

<!-- Last synced at: 2026-03-09T16:40:00Z -->
