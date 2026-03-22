# admin-v2/table

## Purpose

Base list table for admin-v2 with support for:

- search by selectable fields,
- pagination,
- `Add new` action through `adminForm`,
- row rendering via children.

## Runtime mode

- `index.tsx` is framework wrapper (Provider/API + `TableController`).
- `client.tsx` builds query params and loads page + total.
- `server.tsx` is server-side fallback loader.
- `Component.tsx` is a presentation container for `children`.

## Key props

- `apiProps` — list filters/query params.
- `adminForm` — create form callback.
- `leftModelAdminForm`, `rightModelAdminForm` — relation row navigation callbacks.
- `leftModelAdminFormLabel`, `rightModelAdminFormLabel` — labels for relation action buttons.
- `children` — rendered row list.

### Legacy prop

- `relatedAdminForm` is preserved for compatibility, but not the primary wiring path in current admin-v2.

## Minimal example

```tsx
<RelationTable
  isServer={false}
  variant="admin-v2-table"
  apiProps={{
    params: {
      filters: {
        and: [{ column: "productId", method: "eq", value: productId }],
      },
    },
  }}
  leftModelAdminFormLabel="Product"
  rightModelAdminFormLabel="Attribute"
  leftModelAdminForm={openProductForm}
  rightModelAdminForm={openAttributeForm}
/>
```

## Boundaries

- Shared table does not define domain ownership rules for relations.
- Domain FK filters are provided by module/relation wiring.
