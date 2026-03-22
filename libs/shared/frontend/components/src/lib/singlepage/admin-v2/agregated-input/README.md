# admin-v2/agregated-input

## Purpose

Proxy component for grouping form fields (`title + children`).
In `admin-v2`, it reuses the implementation from `singlepage/admin/agregated-input` to avoid duplicating UI logic.

## Runtime mode

- Thin wrapper without its own server/client branching.
- Rendering is fully delegated to the parent `admin/agregated-input`.

## Key props

- `title: string` — title of the grouped block.
- `children: ReactNode` — grouped content.

## Minimal example

```tsx
<AgregatedInput title="Details">
  <FieldA />
  <FieldB />
</AgregatedInput>
```

## Boundaries

- No business logic.
- Does not handle data or submit; only groups visual content.
