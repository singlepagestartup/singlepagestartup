# admin-v2/form

## Purpose

Base form layout for admin-v2 (header, body, footer, submit button).
Shared layer separates infrastructure (server/client data loading) from pure UI rendering.

## Runtime mode

- `index.tsx` chooses server/client branch, wires Provider/API, and fallback.
- `client.tsx` / `server.tsx` hydrate entity by `data.id`.
- `ClientComponent.tsx` renders UI only.

## Key props

- `variant`, `module`, `name`, `type` — form metadata.
- `data` — entity payload (for edit flows it can start with `{ id }`).
- `form` — `react-hook-form` instance.
- `status` — visual submit state.
- `children` — form fields and relation blocks.

### `isServer` + `onSubmit` contract

- If `onSubmit` is provided, `isServer` must be `false`.
- If `onSubmit` is omitted, `isServer` can be either runtime mode.

## Minimal example

```tsx
<Form isServer={false} variant="admin-v2-form" module="ecommerce" name="product" type="model" form={form} status="idle" onSubmit={handleSubmit}>
  <Fields />
</Form>
```

## Boundaries

- Shared form does not decide which relation tables to render.
- Shared form does not run mutations by itself; it only invokes provided `onSubmit`.
