# admin-v2/table-controller

## Purpose

Top-level table controller for admin-v2:

- search input + debounce,
- searchable field selector,
- pagination (offset/limit),
- `Add new` action when `adminForm` is provided.

## Runtime mode

- Behavior is client-driven (local UI state + context).
- Server wrapper delegates to the same UI implementation.
- State is exposed to table content through `TableContext`.

## Key props

- `searchField` — default search field.
- `searchableFields` — extra searchable fields.
- `baseSearchableFields` — base field list.
- `baseCount` — available page-size options.
- `adminForm` — create form callback.
- `children` — content consuming `TableContext`.

## Minimal example

```tsx
<TableController isServer={false} module="ecommerce" name="product" variant="admin-v2-table" searchableFields={["type", "slug"]} adminForm={openCreateForm}>
  <TableRows />
</TableController>
```

## Boundaries

- Controller does not load entities directly; it manages state consumed by `table/client.tsx`.
- Controller does not own module domain rules.
