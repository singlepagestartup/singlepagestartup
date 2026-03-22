# admin-v2/card

## Purpose

Model/relation card for the admin-v2 overview screen.
Shows entity name, route hint, and a navigation action.

## Runtime mode

- `index.tsx` chooses the server/client branch and injects Provider/API.
- UI rendering is handled by `Component.tsx`.
- In current implementation, the card uses metadata props and does not depend on loaded `data`.

## Key props

- `module`, `name`, `type` — semantic attributes and labels.
- `apiRoute` — route helper shown in the card body.
- `href` — destination for the `Open model` action.
- `variant` — visual variant.

## Minimal example

```tsx
<Card isServer={false} variant="admin-v2-card" module="ecommerce" name="product" type="model" apiRoute="/api/ecommerce/products" href="/admin/ecommerce/product" />
```

## Boundaries

- Card does not implement CRUD behavior.
- Model list composition is owned by the module layer, not by shared card.
