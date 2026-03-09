---
date: 2026-03-04T12:00:00+00:00
researcher: flakecode
git_commit: 0250022fcd930d0a67d43c76d77b37f4c35a7dba
branch: main
repository: singlepagestartup
topic: "Admin Panel V2 - Migrate redesigned admin panel from drafts"
tags: [research, codebase, admin-v2, ecommerce, migration, frontend]
status: complete
last_updated: 2026-03-04
last_updated_by: flakecode
---

# Research: Admin Panel V2 - Migrate redesigned admin panel from drafts

**Date**: 2026-03-04
**Researcher**: flakecode
**Git Commit**: 0250022fcd930d0a67d43c76d77b37f4c35a7dba
**Branch**: main
**Repository**: singlepagestartup

## Research Question

What exists in the codebase for the admin panel V2 migration? This research documents the current state of:

1. The draft implementation in `apps/drafts/incoming/admin-v2`
2. The work-in-progress migration code in production
3. The shared admin-v2 component infrastructure
4. The SDK data fetching patterns used by admin components

## Summary

The admin panel V2 migration has significant infrastructure already in place:

1. **Draft Implementation**: A complete React prototype in `apps/drafts/incoming/admin-v2` with 80+ files including sidebar navigation, module dashboards, model lists, forms, and settings pages. Uses mock data in `data.ts` with schema definitions for all 15 SPS modules.

2. **Shared Admin-V2 Infrastructure**: 54 files in `libs/shared/frontend/components/src/lib/singlepage/admin-v2/` providing reusable components: `panel`, `form`, `table`, `table-row`, `table-controller`, `select-input`, `model-header`. Uses Sheet-based forms (side panel) instead of Dialog-based forms from V1.

3. **Ecommerce Pilot Implementation (partially implemented, needs verification and fixes)**: The ecommerce module has admin-v2 variant files created for:

   - Product model: 6 variants (`table`, `table-row`, `form`, `select-input`, `model-header`, `module-overview-card`)
   - Attribute model: 6 variants (same as Product)
   - Products-to-attributes relation: 4 variants (`table`, `table-row`, `form`, `select-input`)

   These files exist but correctness and functionality have not been verified. The implementation may contain bugs or incomplete logic.

4. **WIP Host Integration**: `apps/host/src/components/admin-panel-draft/ClientComponent.tsx` integrates ecommerce admin-v2 with settings pages.

## Detailed Findings

### 1. Draft Implementation (`apps/drafts/incoming/admin-v2`)

**Location**: `/Users/rogwild/code/singlepagestartup/sps-lite/apps/drafts/incoming/admin-v2/`

**Key Files**:

- `src/app/layouts/AdminLayout.tsx:1-246` - Main admin layout with:

  - Collapsible sidebar (264px open / 0px collapsed)
  - Module list with expand/collapse
  - Model sub-items navigation
  - Settings button in footer
  - Header with "Open site" link and user button

- `src/app/components/ModuleDashboard.tsx:1-60` - Module overview page showing model cards with:

  - Model count badge
  - API route display (`/api/{module}/{model}`)
  - "Open model" button

- `src/app/components/ModelList.tsx:1-366` - Entity listing with:

  - Breadcrumb navigation
  - Search input with field selector
  - Sort dropdown (ID/Title/Slug)
  - Entity cards with slug, description, variant, ID
  - Preview, Edit, Delete buttons
  - Pagination with configurable items per page
  - Delete confirmation dialog

- `src/app/data.ts:1-1159` - Mock data with:
  - Schema definitions for all 15 modules
  - Field types: text, number, boolean, datetime, richtext, localized-text
  - Relation definitions with joinModelSlug
  - Mock records for products, attributes, articles, categories, orders
  - Account settings data (identities, social profiles)

**UI Components Used**:

- All shadcn/ui components from `src/app/components/ui/`
- Lucide icons
- TailwindCSS for styling

**Styling Patterns**:

- Main background: `bg-[#F1F5F9]`
- Cards: `border-slate-300 bg-white`
- Buttons: `border-slate-400 bg-slate-900 text-white`
- Hover states: `hover:border-slate-400`, `hover:bg-slate-100`

### 2. Shared Admin-V2 Infrastructure

**Location**: `/Users/rogwild/code/singlepagestartup/sps-lite/libs/shared/frontend/components/src/lib/singlepage/admin-v2/`

**Component Structure Pattern**:

```
component-name/
  index.tsx          - Entry with ErrorBoundary + Suspense + Provider
  server.tsx         - Server-side data fetching via SDK api.findById()
  client.tsx         - Client-side data fetching via SDK api.find()
  Component.tsx      - Base component wrapper
  ClientComponent.tsx - Client-side UI implementation
  interface.ts       - TypeScript interfaces
  Error.tsx          - Error fallback
  Skeleton.tsx       - Loading skeleton
```

**Panel Component** (`panel/ClientComponent.tsx:10-109`):

- Collapsible sidebar (320px open / 56px closed)
- Logo badge with "A" icon
- Settings button (link or callback)
- Uses `ScrollArea` for content
- Props: `showSettingsButton`, `settingsHref`, `onOpenSettings`, `isSettingsView`

**Form Component** (`form/ClientComponent.tsx:16-89`):

- Full-height layout with sticky header/footer
- Auto-generated title from `name` prop ("Update/Create X")
- ID displayed in header if present
- Save button with status-based styling
- Props: `form`, `onSubmit`, `status`, `panelDepth`, `isTop`

**Table Component** (`table/`):

- Uses `use-model-table-state.ts` hook for URL-based state
- State: `search`, `sortBy`, `currentPage`, `itemsPerPage`
- Default items per page: 4
- Client-side filtering/sorting/pagination via `getAdminV2ModelTablePage()`

**Table-Row Component** (`table-row/ClientComponent.tsx:27-225`):

- Card layout with default fields (`adminTitle`, `slug`, `variant`)
- Preview button (Dialog) - only for models
- Edit button (Sheet from right side)
- Related entity button (Sheet) - only for relations
- Delete button (AlertDialog)

**Table-Controller Component** (`table-controller/ClientComponent.tsx:39-252`):

- Three sections: search bar, content, pagination
- Search with field selector and "Add new" button
- Uses `Sheet` for "Add new" form (not Dialog)
- Default page sizes: `["2", "5", "10", "25", "50", "100"]`

**Select-Input Component** (`select-input/`):

- Same implementation as V1
- Props: `formFieldName`, `form`, `renderField`, `renderFunction`
- Debounced search (default 300ms)
- UUID detection for direct ID search

**Model-Header Component** (`model-header/Component.tsx:6-29`):

- Breadcrumb with two links: module -> model
- Uses Next.js `Link` and `ChevronRight` icon

### 3. Ecommerce Module Admin-V2 Implementation

**Module Root** (`libs/modules/ecommerce/frontend/component/src/lib/admin-v2/`):

`ClientComponent.tsx:1-152`:

- Defines `MODULE` constant with `id: "ecommerce"`, `name: "Ecommerce"`, `icon: "🛍️"`
- Defines `MODELS` array as `["product", "attribute"]`
- Uses `useAdminRoute(pathname)` hook for URL parsing
- Conditionally renders:
  - Module overview cards when no model selected
  - Model-specific tables when model selected
- Wraps content in `PanelComponent` from shared admin-v2

**Product Model Variants** (`libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/admin-v2/`):

| Variant                         | File                                            | Description                                     |
| ------------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| `admin-v2-table`                | `table/index.tsx:1-71`                          | Wraps shared ParentComponent with SDK providers |
| `admin-v2-table-row`            | `table-row/Component.tsx:1-60`                  | Card with product fields, edit sheet, delete    |
| `admin-v2-form`                 | `form/ClientComponent.tsx:1-306`                | Tabbed form with Details/Relations tabs         |
| `admin-v2-select-input`         | `select-input/Component.tsx:1-24`               | Searchable dropdown with custom render          |
| `admin-v2-model-header`         | `model-header/Component.tsx:1-16`               | Breadcrumb navigation                           |
| `admin-v2-module-overview-card` | `module-overview-card/ClientComponent.tsx:1-61` | Dashboard card with count and route             |

**Attribute Model Variants** - Same structure as Product with attribute-specific fields.

**Products-to-Attributes Relation Variants** - Same structure with `type: "relation"` and `relatedAdminForm` support.

### 4. SDK Data Fetching Patterns

**SDK Layer Structure**:

```
libs/modules/ecommerce/models/product/sdk/
  model/src/lib/index.ts    - Types, schemas, route, host, options
  client/src/lib/singlepage/index.ts - React Query factory
  server/src/lib/singlepage/index.ts - Async fetch factory
```

**Model Layer Exports** (`sdk/model/src/lib/index.ts:1-24`):

- `IModel` - Type alias for `ISelectSchema`
- `insertSchema`, `selectSchema` - Zod schemas
- `serverHost` - `API_SERVICE_URL` env var
- `clientHost` - `NEXT_PUBLIC_API_SERVICE_URL` env var
- `route` - `/api/ecommerce/products`
- `variants`, `types` - Entity variants/types
- `options` - Next.js revalidation options

**Client SDK Factory** (`@sps/shared-frontend-client-api`):

- `api.findById(props)` - `useQuery()` hook
- `api.find(props)` - `useQuery()` hook
- `api.create(props)` - `useMutation()` hook
- `api.update(props)` - `useMutation()` hook
- `api.delete(props)` - `useMutation()` hook

**Server SDK Factory** (`@sps/shared-frontend-server-api`):

- Same methods but as async functions (not hooks)

**API Call Flow**:

1. Component calls `api.find()` from SDK client
2. Factory returns `useQuery()` hook with queryKey `[route, QS.stringify(params)]`
3. Query executes via `actions.find()` in `@sps/shared/frontend/api`
4. HTTP GET to `${host}${route}?${QS.stringify(params)}`
5. Response piped through `responsePipe()` and `transformResponseItem()`

**Form Integration Pattern** (`product/form/ClientComponent.tsx`):

```typescript
const updateEntity = api.update();
const createEntity = api.create();
const form = useForm<z.infer<typeof insertSchema>>({
  resolver: zodResolver(insertSchema),
  defaultValues: { ... }
});

async function onSubmit(data) {
  if (props.data?.id) {
    updateEntity.mutate({ id: props.data.id, data });
  } else {
    createEntity.mutate({ data });
  }
}
```

### 5. V1 vs V2 Key Differences

| Feature          | V1 (`admin/`)          | V2 (`admin-v2/`)          |
| ---------------- | ---------------------- | ------------------------- |
| Form container   | Dialog                 | Sheet (side panel)        |
| Panel            | Model selector sidebar | Collapsible admin sidebar |
| Table row        | Dialog for edit        | Sheet for edit            |
| Page sizes       | 100-1000               | 2-100                     |
| Model header     | None                   | Breadcrumb component      |
| State management | Context only           | Context + URL params hook |
| Styling          | Generic border-input   | Slate-specific colors     |

### 6. Current Migration Status

**Completed**:

- Shared admin-v2 component infrastructure (54 files)

**Partially Implemented — Needs Verification and Fixes**:

- Ecommerce module admin-v2 component files exist (product, attribute, products-to-attributes) but have not been tested or confirmed to work correctly
- Host integration for ecommerce admin panel (`apps/host/src/components/admin-panel-draft/`) exists but needs verification
- Settings and account settings pages exist but need verification

**Not Started** (based on draft having 15 modules):

- Other 14 modules need admin-v2 variants
- Full navigation with all modules in sidebar
- Relations management for non-pilot relations

## Code References

- `apps/drafts/incoming/admin-v2/src/app/layouts/AdminLayout.tsx:1-246` - Draft admin layout
- `apps/drafts/incoming/admin-v2/src/app/data.ts:1-1159` - Mock data and schema
- `libs/shared/frontend/components/src/lib/singlepage/admin-v2/` - Shared components (54 files)
- `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/ClientComponent.tsx:1-152` - Ecommerce layout
- `libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/admin-v2/` - Product variants
- `libs/modules/ecommerce/models/attribute/frontend/component/src/lib/singlepage/admin-v2/` - Attribute variants
- `libs/modules/ecommerce/relations/products-to-attributes/frontend/component/src/lib/singlepage/admin-v2/` - Relation variants
- `apps/host/src/components/admin-panel-draft/ClientComponent.tsx:1-32` - Host integration

## Architecture Documentation

### Component Layering Pattern

```
Module Component (e.g., ProductComponent with variant="admin-v2-table")
    |
    v
Shared ParentComponent (from @sps/shared-frontend-components/singlepage/admin-v2/table)
    |
    v
SDK Provider (from @sps/ecommerce/models/product/sdk/client)
    |
    v
Data Fetching (React Query via factory)
    |
    v
HTTP API (fetch to ${host}${route})
```

### Variant Registry Pattern

Each model's `variants.ts` exports a mapping:

```typescript
export const variants = {
  "admin-v2-table": AdminV2Table,
  "admin-v2-table-row": AdminV2TableRow,
  "admin-v2-form": AdminV2Form,
  "admin-v2-select-input": AdminV2SelectInput,
  "admin-v2-model-header": AdminV2ModelHeader,
  "admin-v2-module-overview-card": AdminV2ModuleOverviewCard,
};
```

### Interface Extension Pattern

All admin-v2 interfaces extend shared interfaces with model type:

```typescript
export interface IComponentProps extends IParentComponentProps<IModel, typeof variant> {}
```

## Historical Context (from thoughts/)

Related research exists at:

- `thoughts/shared/research/singlepagestartup/2026-02-28-ISSUE-142-admin-panel-v2-migration.md` - Previous research on this topic

## Related Research

- ISSUE-142 research document contains additional context on the admin panel redesign

## Open Questions

1. **Multi-module Navigation**: How should the sidebar handle navigation across all 15 modules? Currently only ecommerce is implemented.

2. **Module Registration**: Should modules self-register their admin-v2 components, or should there be a central registry?

3. **Relation Depth**: How deep should nested relation editing go? Current implementation supports one level of `relatedAdminForm`.

4. **Settings Pages**: The draft includes settings and account-settings pages - these appear to be implemented in the WIP code but may need verification.

5. **Form Fields**: The draft uses field definitions from `data.ts` schema, but production forms have hardcoded fields. Should forms be dynamically generated from schema?
