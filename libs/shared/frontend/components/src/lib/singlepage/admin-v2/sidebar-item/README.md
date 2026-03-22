# admin-v2/sidebar-item

## Purpose

Sidebar action item for admin-v2.
Builds navigation link to `/admin/<module>/<name>` and supports active state.

## Runtime mode

- `index.tsx` chooses server/client branch.
- UI classes and active-state rendering are handled in `Component.tsx`.

## Key props

- `module`, `name`, `type` — used for href and semantic attributes.
- `isActive` — highlights current item.
- `variant` — visual variant.
- `className` — additional styling.

## Minimal example

```tsx
<SidebarItem isServer={false} variant="admin-v2-sidebar-item" module="ecommerce" name="product" type="model" isActive={true} />
```

## Boundaries

- Component does not validate route existence.
- Item list composition remains module responsibility.
