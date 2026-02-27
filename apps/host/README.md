# Host app

## Frontend Guidelines

- **TailwindCSS only**: use Tailwind utility classes. If you need new tokens (colors, spacing, radii, etc.), extend `apps/host/styles/presets/shadcn.ts`; never introduce ad-hoc CSS classes.
- **Variant structure**: each variant follows `interface.ts` → `index.tsx` → `Component.tsx`; add `ClientComponent.tsx` only when browser APIs are required.
- When a component becomes client-only (`"use client"`), pass `isServer={false}` to every downstream relation/model component in that file to avoid React Server Component hydration issues.
- Keep any extra helpers in an `assets/` directory and import them from the main variant file. If you find the place for double usage of utility or component, that is not related to model - add it to `libs/shared/`.
- Data access must go through module SDK providers (`Provider`, `clientApi`, `serverApi`). Relation components should use `variant="find"` with filters supplied via `apiProps.params.filters.and`.
- For advanced fetching/transform logic, mirror the `singlepage/default` pattern: move data-handling into `client.tsx` / `server.tsx` wrappers so `Component.tsx` stays purely presentational.
