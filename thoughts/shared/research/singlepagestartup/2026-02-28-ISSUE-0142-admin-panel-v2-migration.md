# Research: Admin Panel v2 Migration (Issue #142)

**Date:** 2026-02-28
**Issue:** #142 — Implement the updated admin panel
**Status:** Research Complete

---

## Summary

Issue #142 calls for migrating the admin panel to its updated v2 design, using `ecommerce.product`, `ecommerce.attribute`, and `ecommerce.products-to-attributes` as a pilot scope. The pilot implementation already exists and is partially functional. This research documents exactly what has been built, what patterns have emerged, what inconsistencies exist, and what remains to be done.

---

## 1. Source of Truth: The HTML Prototype

**Location:** `apps/drafts/incoming/admin-panel-redesign-html/`

The `apps/drafts` directory follows an `incoming → approved → archived` lifecycle. The admin panel redesign (`manifest.json: status: "incoming"`) is a Vanilla JS + Tailwind CDN prototype defining the complete visual and UX contract:

- **Layout:** `flex h-screen` root with collapsible `w-64` sidebar + main content area
- **Sidebar:** Logo, scrollable model list, settings button at bottom
- **Header:** Toggle-sidebar button, horizontal module tabs, help + user icon buttons
- **Main:** Breadcrumb, page title, search+sort+add toolbar, entity list, pagination panel
- **Overlays:** Entity drawer, relation drawer, preview dialog, confirm dialog (fixed-position with z-index stacking)
- **Color scheme:** `background: #eaf0f7`, `card: #ffffff`, `border: #d6dfeb`, `primary: #111827`

The prototype has 15 modules in the sidebar with full mock data.

---

## 2. Current React Migration State

### 2.1 Host-Level Entry Point

**File:** `apps/host/app/[[...url]]/page.tsx:55`

Any URL starting with `/admin` renders `<AdminPanelDraft>`. All other URLs go to `HostModulePage`.

### 2.2 React Shell

**Files:**

- `apps/host/src/components/admin-panel-draft/Component.tsx` — server-side pass-through
- `apps/host/src/components/admin-panel-draft/ClientComponent.tsx` — root `use client` component
- `apps/host/src/components/admin-panel-draft/interface.ts` — all TypeScript types
- `apps/host/src/components/admin-panel-draft/utils.tsx` — state helpers and data mappers
- `apps/host/src/components/admin-panel-draft/settings-page/` — `/admin/settings` implementation
- `apps/host/src/components/admin-panel-draft/account-settings-page/` — `/admin/profile` implementation

**`ClientComponent.tsx`** renders three sections:

1. `<EcommerceAdminV2Component adminBasePath="/admin" isSettingsView={false} />` — owns all `/admin/modules/ecommerce/**` routes
2. `<SettingsPageClientComponent>` — only when pathname matches `/admin/settings/**`
3. `<AccountSettingsPageClientComponent>` — only when pathname matches `/admin/profile` or `/admin/account`

The settings/profile pages wrap their content in `<EcommerceAdminV2Component>` to get the sidebar, which causes the sidebar to be re-instantiated per page.

### 2.3 Ecommerce Module Shell

**Files:** `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/`

- `ClientComponent.tsx` — uses `usePathname()`, parses route, renders sidebar + model content
- `sidebar-module-item/` — navigation links for modules/models
- `module-overview-card/` — card shown on module overview

**Implemented Models:** `["product", "attribute"]` (hardcoded)

**Route logic** (line 54): if `props.children` is NOT provided AND the route's module is NOT `"ecommerce"`, returns `null`. This is how settings/profile pages co-exist — they pass `children` to bypass this guard.

**Content rendering (no children):**

- `/admin` or `/admin/modules/ecommerce` → module overview (2 overview cards)
- `/admin/modules/ecommerce/models/product` → `<ProductComponent variant="admin-v2-table">`
- `/admin/modules/ecommerce/models/attribute` → `<AttributeComponent variant="admin-v2-table">`

---

## 3. Shared Admin-v2 Primitives

**Location:** `libs/shared/frontend/components/src/lib/singlepage/admin-v2/`

These are the reusable building blocks used by every model and relation:

### Panel (`panel/`)

Collapsible sidebar shell. Props: `isSettingsView`, `settingsHref?`, `onOpenSettings?`, `children`.

- Collapses to `w-14` when closed
- Settings button at bottom: highlights when `isSettingsView === true`

### TableController (`table-controller/`)

Provides `TableContext` (React context) with: `search`, `debouncedSearch` (300ms), `offset`, `limit`, `searchField`, `selectedField`, `total`.

- Renders: search input + field selector + "Add new" Sheet trigger (via `adminForm` prop) + children + pagination row
- Wraps everything in `TableContext.Provider`

### Table (`table/`)

- `index.tsx`: Composes `TableController` + `ErrorBoundary` + `Suspense` + `Provider`
- `client.tsx`: Calls `api.find()` twice — once for total count, once for filtered+paginated results. Reads context for search/pagination params.

### TableRow (`table-row/`)

- `index.tsx`: `ErrorBoundary` + `Suspense` + `Provider` (NO TableController)
- `client.tsx`: Calls `api.findById({ id })`. Renders Skeleton while loading.
- `ClientComponent.tsx`: Renders entity card with Preview (Dialog), Edit (Sheet), Open Related (Sheet), Delete (AlertDialog) action buttons.

### Form (`form/`)

- `ClientComponent.tsx`: Shows "Update/Create {name}" header, scrollable body (`props.children`), footer with Save button. Color feedback: green on success, red on error.

### ModelHeader (`model-header/`)

Breadcrumb: `ModuleName > ModelName` as links with `ChevronRight` separator.

---

## 4. Pilot Model Implementations

### 4.1 Product (`libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/admin-v2/`)

Sub-components: `module-overview-card/`, `model-header/`, `table/`, `table-row/`, `form/`, `select-input/`

**`table/index.tsx` pattern:**

- Imports `clientApi` + `serverApi` from `@sps/ecommerce/models/product/sdk/client` and `sdk/server`
- Defines `renderProductsToAttributes` (renders filtered relation table)
- Defines `defaultAdminForm` factory
- Passes everything to shared `table/` parent component

**`table-row/`:** Passes only `data={{ id }}` — the row fetches its full entity via `findById` internally.

**`form/interface.ts`:** Extends shared form interface with optional render-prop slots for all related tables:
`productsToAttributes?`, `productsToFileStorageModuleWidgets?`, `productsToWebsiteBuilderModuleWidgets?`, `ordersToProducts?`, `categoriesToProducts?`, `storesToProducts?`, `widgetsToProducts?`

**`form/ClientComponent.tsx`:**

- `react-hook-form` + zod resolver using `insertSchema`
- Default values from `props.data` or `randomWordsGenerator`
- Two tabs: "Details" (all fields) and "Relations" (only `productsToAttributes` is wired)

**Variants used:** `"admin-v2-table"`, `"admin-v2-table-row"`, `"admin-v2-form"`, `"admin-v2-module-overview-card"`, `"admin-v2-model-header"`, `"admin-v2-select-input"`

### 4.2 Attribute (`libs/modules/ecommerce/models/attribute/frontend/component/src/lib/singlepage/admin-v2/`)

Identical structure to product.

Key differences:

- Form fields: `adminTitle`, `string` (i18n), `slug`, `number`, `datetime`, `date`, `boolean`, `variant`
- Relations rendered **inline in form body** (no tabs, unlike product which uses Details/Relations tabs)
- 4 relation slots: `attributeKeysToAttributes?`, `productsToAttributes?`, `storesToAttributes?`, `attributesToBillingModuleCurrencies?`

### 4.3 Products-to-Attributes (`libs/modules/ecommerce/relations/products-to-attributes/frontend/component/src/lib/singlepage/admin-v2/`)

Sub-components: `form/`, `table/`, `table-row/`, `select-input/`

**`form/ClientComponent.tsx`:** Fields: `orderIndex`, `className`, `variant`, `productId` (via `<Product variant="admin-v2-select-input">`), `attributeId` (via `<Attribute variant="admin-v2-select-input">`).

**`table-row/Component.tsx`:** Provides both `adminForm` (edit the relation) and `relatedAdminForm` (edit the linked attribute).

---

## 5. Identified Inconsistencies and Issues

### 5.1 Route Parsing Duplication (Critical)

The admin route parsing logic is copy-pasted in at least 5 locations:

1. `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/ClientComponent.tsx:22`
2. `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/sidebar-module-item/ClientComponent.tsx:11`
3. `apps/host/src/components/admin-panel-draft/settings-page/ClientComponent.tsx:63`
4. `apps/host/src/components/admin-panel-draft/account-settings-page/ClientComponent.tsx:113`
5. `apps/host/src/components/admin-panel-draft/utils.tsx:199`

**Risk:** Any change to route structure must be replicated in all 5 locations. Should be extracted to a shared utility.

### 5.2 Sidebar Re-instantiation

`ClientComponent.tsx` renders `<EcommerceAdminV2Component>` three separate times (once as primary, twice as a layout wrapper for settings/profile). This means:

- Sidebar state (open/closed) resets on navigation between sections
- No shared layout state across settings/profile/main sections

**Fix:** Should use a shared layout component wrapping all admin routes, not re-instantiating `EcommerceAdminV2Component` per page.

### 5.3 No RBAC Gating

Admin v1 checked `rbac/subject → rbac/role → subjects-to-roles` for `admin` role before rendering. Admin v2 has no access control at all. Any authenticated or unauthenticated user can access `/admin/**`.

### 5.4 Hardcoded Module/Model Lists

`libs/modules/ecommerce/frontend/component/src/lib/admin-v2/ClientComponent.tsx`:

```javascript
const MODULE = { id: "ecommerce", name: "Ecommerce", icon: "🛍️" };
const MODELS = ["product", "attribute"];
```

And in `utils.tsx`: `modules` and `modelsByModule` are hardcoded. When other modules are added, these must be manually updated in all locations.

### 5.5 Account Settings Page Uses Mock Data

`apps/host/src/components/admin-panel-draft/account-settings-page/ClientComponent.tsx` renders hardcoded mock data (`subject`, identities, social profiles). Not wired to live SDK calls.

### 5.6 `module-overview-card` Has Commented-Out Count

`libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/admin-v2/module-overview-card/ClientComponent.tsx:31`:

```jsx
{
  /* {isLoading ? "..." : data?.length || 0} */
}
```

The entity count badge is disabled/commented out.

### 5.7 Product Form Relations Tab Only Wires `productsToAttributes`

Product form has 7 relation render-prop slots defined in `interface.ts`, but only `productsToAttributes` is wired in `defaultAdminForm` in `table/index.tsx`. The remaining 6 slots are defined but never used in the pilot.

### 5.8 Inconsistent Relation Rendering Style

- Product form uses **Details/Relations tabs** for relation sections
- Attribute form uses **inline rendering** in the form body (no tabs)

Both approaches exist in the pilot scope without a clear decision on which to standardize.

### 5.9 `select-input` Delegates to Old Admin

Both product and `products-to-attributes` `select-input/Component.tsx` delegate to `singlepage/admin/select-input` (admin v1 component), not a new admin-v2 select input. This means select inputs in admin-v2 forms depend on admin-v1 infrastructure.

### 5.10 `use-model-table-state.ts` Not Integrated

`libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/use-model-table-state.ts` defines a URL-driven (`q`, `sort`, `page`, `perPage` query params) table state hook. This hook is NOT used by any current implementation — all tables use the `TableContext` approach instead. It may be dead code or a planned alternative.

### 5.11 `utils.tsx` State Machine Unused in Current Implementation

`apps/host/src/components/admin-panel-draft/utils.tsx` contains `applyRoute()`, `createInitialState()`, `mapProductToEntity()`, etc. — a full client-side state machine ported from the JS prototype. But `ClientComponent.tsx` does NOT use this state machine; it delegates entirely to `EcommerceAdminV2Component` which has its own URL-based routing. The `utils.tsx` file appears to be legacy/unused.

---

## 6. Rollout Pattern for Other Modules

When extending admin-v2 to other modules, the pilot establishes this pattern:

1. Create `libs/modules/<module>/frontend/component/src/lib/admin-v2/` with:

   - `ClientComponent.tsx` — module shell (sidebar module item + model content routing)
   - `sidebar-module-item/` — module nav item
   - `module-overview-card/` — overview cards per model

2. For each model, create `libs/modules/<module>/models/<model>/frontend/component/src/lib/singlepage/admin-v2/`:

   - `table/index.tsx` — composition layer (binds SDK + default form factory)
   - `table-row/` — card view of a single entity
   - `form/` — create/edit form with zod resolver
   - `module-overview-card/` — card for module overview page
   - `model-header/` — breadcrumb header
   - `select-input/` — dropdown for relation form selectors

3. Register variants in the model's main `Component.tsx` variant dispatcher.

4. Add the module to `EcommerceAdminV2Component`'s `MODELS` list (currently hardcoded).

5. Register the module's admin component in `apps/host/src/components/admin-panel-draft/ClientComponent.tsx`.

---

## 7. Technical Decisions Already Made

- **URL-based routing** (not overlay/modal state): admin panel lives at `/admin/**`
- **Variant-based dispatch**: all admin-v2 views are variants of the model's main component
- **Row-fetches-own-data**: table passes only `{ id }` to row; row calls `findById` itself
- **`adminForm` render-prop**: table/row components accept an `adminForm` factory for decoupling forms
- **`TableContext`** for search + pagination state within a table
- **`Sheet`** for create/edit drawers (Radix UI slide-in from right)
- **`AlertDialog`** for delete confirmation
- **`react-hook-form` + zod** for all forms

---

## 8. Open Questions / Validation Criteria for Pilot

1. Is the sidebar re-instantiation (issue 5.2) a problem in practice? Does it cause visible flicker or state loss?
2. Should the route parsing be extracted to a shared utility before rollout?
3. Should RBAC gating be added to `/admin/**` routes?
4. Which relation rendering style should be standardized: tabs (product) or inline (attribute)?
5. Is `use-model-table-state.ts` planned for use or should it be removed?
6. Should `utils.tsx` (the unused state machine) be removed?
7. Should the module/model lists be driven by a config object (vs hardcoded)?
8. When should account settings be wired to live SDK?

---

## 9. Files Involved in Pilot Scope

| Path                                                                                                      | Purpose                                                          |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `apps/drafts/incoming/admin-panel-redesign-html/`                                                         | HTML prototype (source of truth for design)                      |
| `apps/host/app/[[...url]]/page.tsx`                                                                       | Route entry: redirects `/admin/**` to AdminPanelDraft            |
| `apps/host/src/components/admin-panel-draft/`                                                             | React migration shell + types + settings/profile pages           |
| `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/`                                             | Ecommerce module shell                                           |
| `libs/shared/frontend/components/src/lib/singlepage/admin-v2/`                                            | Shared primitives: Panel, Table, TableRow, Form, TableController |
| `libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/admin-v2/`                   | Product admin-v2 variants                                        |
| `libs/modules/ecommerce/models/attribute/frontend/component/src/lib/singlepage/admin-v2/`                 | Attribute admin-v2 variants                                      |
| `libs/modules/ecommerce/relations/products-to-attributes/frontend/component/src/lib/singlepage/admin-v2/` | ProductsToAttributes admin-v2 variants                           |

---

## 10. Recommended Next Steps (Implementation Plan Candidates)

1. **Fix route parsing duplication** — extract to `libs/shared/frontend/components/src/lib/singlepage/admin-v2/utils/parse-admin-route.ts`
2. **Fix sidebar re-instantiation** — create a shared admin layout component that wraps all `/admin/**` routes
3. **Standardize relation rendering** — pick one pattern (tabs vs inline) and apply consistently
4. **Wire account settings to live SDK** — remove mock data, use RBAC/social SDK hooks
5. **Add RBAC gating** — protect `/admin/**` routes with role check
6. **Fix `select-input` to use admin-v2 primitives** — remove dependency on admin-v1 select
7. **Validate pilot** — test create/read/update/delete for product, attribute, products-to-attributes
8. **Remove dead code** — `utils.tsx` state machine, `use-model-table-state.ts` if not planned
9. **Define rollout gate criteria** — formalize what "pilot validated" means before scaling to other modules
10. **Scale to remaining modules** — apply the established pattern to all other business modules
