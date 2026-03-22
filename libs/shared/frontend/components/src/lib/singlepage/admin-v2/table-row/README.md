# admin-v2/table-row

## Purpose

Admin-v2 table row for model/relation entities:

- edit/delete actions,
- preview action (models),
- left/right related model opening actions (relations).

## Runtime mode

- Input row payload is minimal (`data.id`).
- `client.tsx` / `server.tsx` hydrate full row via `findById`.
- `ClientComponent.tsx` owns interactive sheet/dialog state.

## Key props

- `data: { id }` — minimal entity reference.
- `adminForm` — edit form callback for current row.
- `leftModelAdminForm`, `rightModelAdminForm` — related model callbacks.
- `leftModelAdminFormLabel`, `rightModelAdminFormLabel` — action button labels.
- `module`, `name`, `type` — semantic attributes and rendering mode.

### Legacy prop

- `relatedAdminForm` is kept for compatibility, but current primary flow uses left/right model forms.

## Minimal example

```tsx
<Row isServer={false} variant="admin-v2-table-row" module="ecommerce" name="products-to-attributes" type="relation" data={{ id: relationId }} adminForm={openRelationForm} leftModelAdminForm={openProductForm} rightModelAdminForm={openAttributeForm} leftModelAdminFormLabel="Product" rightModelAdminFormLabel="Attribute" />
```

## Boundaries

- Row does not decide which domain form should be passed into left/right callbacks.
- That decision is owned by module/relation wiring.
