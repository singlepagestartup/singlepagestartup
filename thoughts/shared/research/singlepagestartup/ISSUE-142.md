# Research: Admin Panel v2 Migration (Issue #142)

**Date:** 2026-02-28
**Issue:** #142 — Implement the updated admin panel
**Status:** Research Complete

---

## Summary

Issue #142 calls for migrating the admin panel to its updated v2 design, using `ecommerce.product`, `ecommerce.attribute`, and `ecommerce.products-to-attributes` as a pilot scope. The pilot implementation already exists and is partially functional. This research documents exactly what has been built, what patterns have emerged, what inconsistencies exist, and what remains to be done.

For the current phase, `/admin/settings` and account/profile pages are explicitly out of scope, and RBAC permittions to admin changes are not included. The implementation target is to keep model/relation component structure as close as possible to admin v1 while porting functional behavior from the Vanilla JS prototype into reusable admin-v2 shared primitives.

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

The settings/profile routes currently wrap their content in `<EcommerceAdminV2Component>` to get the sidebar. These routes are out of scope for the current implementation phase.

### 2.3 Ecommerce Module Shell

**Files:** `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/`

- `ClientComponent.tsx` — uses `usePathname()`, parses route, renders sidebar + model content
- `sidebar-module-item/` — navigation links for modules/models
- `module-overview-card/` — card shown on module overview

**Implemented Models:** `["product", "attribute"]` (hardcoded)

**Route logic** (line 54): if `props.children` is NOT provided AND the route's module is NOT `"ecommerce"`, returns `null`.

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

### 5.1 Route Parsing Duplication + Missing Hierarchical Contract (Critical)

In the current in-scope implementation, route parsing logic is duplicated in at least:

1. `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/ClientComponent.tsx:22`
2. `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/sidebar-module-item/ClientComponent.tsx:11`

**Risk:** Route changes require multi-file edits and are error-prone.

**Required direction:** Routing should be composed by level. Each level (module, model, relation) receives only its base path and parses only the next mutable URL segment. Lower levels must not assume where they are mounted.

### 5.2 Hardcoded Module/Model Lists

`libs/modules/ecommerce/frontend/component/src/lib/admin-v2/ClientComponent.tsx`:

```javascript
const MODULE = { id: "ecommerce", name: "Ecommerce", icon: "🛍️" };
const MODELS = ["product", "attribute"];
```

And in `utils.tsx`: `modules` and `modelsByModule` are hardcoded. When other modules are added, these must be manually updated in all locations.

### 5.3 `module-overview-card` Has Commented-Out Count

`libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/admin-v2/module-overview-card/ClientComponent.tsx:31`:

```jsx
{
  /* {isLoading ? "..." : data?.length || 0} */
}
```

The entity count badge is disabled/commented out.

### 5.4 Product Form Relations Tab Only Wires `productsToAttributes`

Product form has 7 relation render-prop slots defined in `interface.ts`, but only `productsToAttributes` is wired in `defaultAdminForm` in `table/index.tsx`. The remaining 6 slots are defined but never used in the pilot.

### 5.5 Inconsistent Relation Rendering Style

- Product form uses **Details/Relations tabs** for relation sections
- Attribute form uses **inline rendering** in the form body (no tabs)

Both approaches exist in the pilot scope without a clear decision on which to standardize.

### 5.6 `select-input` Delegates to Old Admin

Both product and `products-to-attributes` `select-input/Component.tsx` delegate to `singlepage/admin/select-input` (admin v1 component), not a new admin-v2 select input. This means select inputs in admin-v2 forms depend on admin-v1 infrastructure.

### 5.7 `use-model-table-state.ts` Not Integrated

`libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/use-model-table-state.ts` defines a URL-driven (`q`, `sort`, `page`, `perPage` query params) table state hook. This hook is NOT used by any current implementation — all tables use the `TableContext` approach instead. It may be dead code or a planned alternative.

---

## 6. Rollout Pattern for Other Modules

When extending admin-v2 to other modules, the pilot establishes this pattern:

1. Create `libs/modules/<module>/frontend/component/src/lib/admin-v2/` with:

   - `ClientComponent.tsx` — module shell (sidebar module item + model content routing) that receives a base path and parses only module-level URL segments
   - `sidebar-module-item/` — module nav item
   - `module-overview-card/` — overview cards per model

2. For each model, create `libs/modules/<module>/models/<model>/frontend/component/src/lib/singlepage/admin-v2/`:

   - `table/index.tsx` — composition layer (binds SDK + default form factory), receiving model-level base path for its route segment
   - `table-row/` — card view of a single entity
   - `form/` — create/edit form with zod resolver
   - `module-overview-card/` — card for module overview page
   - `model-header/` — breadcrumb header
   - `select-input/` — dropdown for relation form selectors

3. Keep model/relation component composition as close as possible to admin v1 (structure and integration style), while adding functional behavior from the Vanilla JS prototype.

4. Extract repeated UI/behavioral logic into `libs/shared/frontend/components/src/lib/singlepage/admin-v2/` primitives instead of copying into each model/relation.

5. Register variants in the model's main `Component.tsx` variant dispatcher.

6. Add the module to the module/model registry (currently hardcoded in the pilot) and register the module admin component in `apps/host/src/components/admin-panel-draft/ClientComponent.tsx`.

---

## 7. Technical Decisions and Constraints for Current Phase

- **URL-based routing** (not overlay/modal state): admin panel lives at `/admin/**`
- **Hierarchical routing by level**: each layer (module/model/relation) handles only its own mutable path segment and receives a base path from the parent
- **Admin v1 structural parity**: model/relation component architecture should stay as close as possible to admin v1 to reduce migration risk
- **Vanilla prototype behavior parity**: functional UX behavior should be ported from the HTML/Vanilla JS prototype
- **Shared-first extraction**: repeating logic must be moved into shared admin-v2 primitives
- **Variant-based dispatch**: all admin-v2 views are variants of the model's main component
- **Row-fetches-own-data**: table passes only `{ id }` to row; row calls `findById` itself
- **`adminForm` render-prop**: table/row components accept an `adminForm` factory for decoupling forms
- **`TableContext`** for search + pagination state within a table
- **`Sheet`** for create/edit drawers (Radix UI slide-in from right)
- **`AlertDialog`** for delete confirmation
- **`react-hook-form` + zod** for all forms
- **Out of scope (this phase)**: settings/account/profile pages and RBAC permissions to admin changes

---

## 8. Open Questions / Validation Criteria for Pilot

1. Should route parsing be extracted now into a shared utility with a strict `basePath` contract for module/model/relation levels?
2. Which relation rendering style should be standardized: tabs (product) or inline (attribute)?
3. Which repeated patterns must be mandatory shared primitives before rollout (table controls, relation sections, select inputs)?
4. Is `use-model-table-state.ts` planned for use or should it be removed?
5. Should the module/model lists be driven by a config object (vs hardcoded)?

---

## 9. Files Involved in Pilot Scope

| Path                                                                                                      | Purpose                                                                               |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `apps/drafts/incoming/admin-panel-redesign-html/`                                                         | HTML prototype (source of truth for design)                                           |
| `apps/host/app/[[...url]]/page.tsx`                                                                       | Route entry: redirects `/admin/**` to AdminPanelDraft                                 |
| `apps/host/src/components/admin-panel-draft/`                                                             | React migration shell + types (settings/profile subpages excluded from current phase) |
| `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/`                                             | Ecommerce module shell                                                                |
| `libs/shared/frontend/components/src/lib/singlepage/admin-v2/`                                            | Shared primitives: Panel, Table, TableRow, Form, TableController                      |
| `libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/admin-v2/`                   | Product admin-v2 variants                                                             |
| `libs/modules/ecommerce/models/attribute/frontend/component/src/lib/singlepage/admin-v2/`                 | Attribute admin-v2 variants                                                           |
| `libs/modules/ecommerce/relations/products-to-attributes/frontend/component/src/lib/singlepage/admin-v2/` | ProductsToAttributes admin-v2 variants                                                |

---

## 10. Recommended Next Steps (Implementation Plan Candidates)

1. **Introduce shared route parsing utility** — extract parsing into `libs/shared/frontend/components/src/lib/singlepage/admin-v2/utils/parse-admin-route.ts` with parent `basePath` input
2. **Enforce hierarchical route composition** — module/model/relation layers parse only their own mutable segment and stay mount-location agnostic
3. **Align component architecture with admin v1** — keep model/relation component structure and integration style consistent with v1
4. **Port functional behavior from Vanilla JS prototype** — move reusable behavior into shared admin-v2 primitives, not per-model copies
5. **Standardize relation rendering** — pick one pattern (tabs vs inline) and apply consistently
6. **Fix `select-input` to use admin-v2 primitives** — remove dependency on admin-v1 select
7. **Validate pilot** — test create/read/update/delete for product, attribute, products-to-attributes
8. **Remove or adopt unused table state hook** — decide the fate of `use-model-table-state.ts`
9. **Define rollout gate criteria** — formalize what "pilot validated" means before scaling to other modules
10. **Scale to remaining modules** — apply the established pattern to all other business modules
