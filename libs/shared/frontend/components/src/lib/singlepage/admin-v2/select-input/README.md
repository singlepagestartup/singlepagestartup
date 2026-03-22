# admin-v2/select-input

## Purpose

Reusable searchable select for admin-v2 forms.
Supports two modes:

- container mode (loads options via API),
- view mode (renders with provided `data`).

## Runtime mode

- `index.tsx` chooses server/client loader branch.
- Main interactive behavior lives in `ClientComponent.tsx`.
- Server branch delegates safely to the shared component.

## Key props

- `form`, `formFieldName` — `react-hook-form` integration.
- `apiProps` — filters/limit for options loading.
- `renderField` — entity field shown as option label.
- `searchField` — API field used for searching.
- `searchById` — optional fallback search by `id`.
- `searchDebounceMs` — debounce delay for search input.

## Minimal example

```tsx
<SelectInput isServer={false} variant="admin-v2-select-input" module="ecommerce" name="attribute" form={form} formFieldName="attributeId" renderField="adminTitle" searchField="adminTitle" apiProps={{ params: { limit: 100 } }} />
```

## Boundaries

- Component does not submit the form.
- Domain relation filters are defined in module/relation wiring, not inside shared select-input.
