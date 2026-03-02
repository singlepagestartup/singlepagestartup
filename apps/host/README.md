# Host app

## Guidelines

- **TailwindCSS only**: use Tailwind utility classes. If you need new tokens (colors, spacing, radii, etc.), extend `apps/host/styles/presets/shadcn.ts`; never introduce ad-hoc CSS classes.
- **Variant structure**: each variant follows `interface.ts` → `index.tsx` → `Component.tsx`; add `ClientComponent.tsx` only when browser APIs are required.
- When a component becomes client-only (`"use client"`), pass `isServer={false}` to every downstream relation/model component in that file to avoid React Server Component hydration issues.
- Keep any extra helpers in an `assets/` directory and import them from the main variant file. If you find the place for double usage of utility or component, that is not related to model - add it to `libs/shared/`.
- Data access must go through module SDK providers (`Provider`, `clientApi`, `serverApi`). Relation components should use `variant="find"` with filters supplied via `apiProps.params.filters.and`.
- For advanced fetching/transform logic, mirror the `singlepage/default` pattern: move data-handling into `client.tsx` / `server.tsx` wrappers so `Component.tsx` stays purely presentational.

## Testing

This repository uses a layered test strategy so developers can validate changes quickly without manual UI clicking.

### Test levels and intent

- `Unit` tests validate isolated logic (utilities, adapters, component state helpers).
- `Integration` tests validate module contracts and orchestration (mounting, route/type registry consistency).
- `E2E` tests validate real user flows in the Host admin UI.

### Where tests live

- Unit (shared + ecommerce scope): colocated with source files as `*.spec.ts` / `*.spec.tsx`.
- Integration:
  - `apps/api/specs/integration/*.integration.spec.ts`
  - `libs/modules/ecommerce/**/**/*.integration.spec.ts`
- Host E2E:
  - `apps/host/e2e/singlepage/*.e2e.ts` (framework team owned)
  - `apps/host/e2e/startup/*.e2e.ts` (customer/startup owned)
  - `apps/host/e2e/support/*.ts`
  - config: `apps/host/playwright.config.ts`
  - e2e TypeScript config: `apps/host/tsconfig.spec.json`

### How Host E2E works

- `nx run host:e2e` starts Playwright against the Host app.
- A dedicated mock API process is started on `127.0.0.1:4310` (`apps/host/e2e/support/mock-api-server.mjs`) to serve deterministic backend responses for server-side and client-side calls.
- Host app for e2e is started with `apps/host/.env.testing` (loaded only for e2e command in Playwright config).
- Playwright projects are split by ownership:
  - `singlepage` for framework-maintained business flows
  - `startup` for customer-maintained business flows
- Readiness is checked via `GET /healthz` (`apps/host/app/healthz/route.ts`).
- Current smoke scenarios use reusable API mocks from `apps/host/e2e/support` to verify critical admin flows deterministically.

### Run commands (from repository root)

- `npm run test:unit:scoped`
- `npm run test:integration:scoped`
- `npm run test:e2e:singlepage`
- `npm run test:e2e:startup`
- `npm run test:e2e:scoped` (alias for `singlepage`)
- `npm run test:all:scoped`

### Why this structure

- Fast local feedback with clear test boundaries.
- Modular ownership: each layer has a dedicated purpose and location.
- Lower maintenance cost: reusable e2e fixtures and isolated configs reduce flaky cross-coupling.
- Safer upstream pulls: framework changes stay in `singlepage`, customer scenarios stay in `startup`.

## Patterns

### Variant dispatcher pattern (`index.tsx` + `variants.ts`)

Base pattern:

- `singlepage/variants.ts` stores map `variant -> Component`
- `src/lib/index.tsx` dynamically selects component:
  - `const Comp = variants[props.variant]`
  - `return <Comp {...(props as any)} />`

Examples:

- Product:
  - `.../product/frontend/component/src/lib/singlepage/variants.ts:18`
  - `.../product/frontend/component/src/lib/index.tsx:5`
- Relation:
  - `.../products-to-file-storage-module-files/.../singlepage/variants.ts:9`
  - `.../products-to-file-storage-module-files/.../index.tsx:5`
- File:
  - `.../file/frontend/component/src/lib/singlepage/variants.ts:8`
  - `.../file/frontend/component/src/lib/index.tsx:5`

Scan:

- `frontend/component/src/lib/index.tsx` with dynamic resolver: `146`
- `frontend/component/src/lib/singlepage/variants.ts` map: `145`

### Wrapper pattern via shared frontend components

Often a variant `index.tsx` is built as a thin wrapper:

- imports `Provider`, `clientApi`, `serverApi` from SDK
- imports `ParentComponent` from `@sps/shared-frontend-components/singlepage/...`
- passes `Component={ChildComponent}`

Example (default):

- Product: `.../product/frontend/component/src/lib/singlepage/default/index.tsx:1-19`
- Relation: `.../products-to-file-storage-module-files/.../default/index.tsx:1-19`
- File: `.../file/frontend/component/src/lib/singlepage/default/index.tsx:1-20`

Example (admin form):

- Product: `.../product/frontend/component/src/lib/singlepage/admin/form/index.tsx:1-19`

Scan (heuristic):

- `index.tsx` with `Component as ParentComponent`: `976`
- `index.tsx` with `Provider={Provider}`: `957`

### Composition via relation components and render-props

Recurring approach:

- Parent model component fetches relation via `variant="find"` + `apiProps.params.filters.and`.
- Relation result renders child relation/component.

Product example:

- `.../product/frontend/component/src/lib/singlepage/default/Component.tsx:43-77`
- `.../product/frontend/component/src/lib/singlepage/overview-default/Component.tsx:28-57`

Relation example:

- `.../products-to-file-storage-module-files/.../default/Component.tsx:14-45`
- Relation gets `fileStorageModuleFileId`, then renders file model component.

### Cross-module UI chain `module.model -> module.relation -> module.model`

Ecommerce module product and relation with file storage module file model uses as an example.

#### Product model

- Imports relation component:
  - `.../product/frontend/component/src/lib/singlepage/default/Component.tsx:5`
  - `.../product/frontend/component/src/lib/singlepage/overview-default/Component.tsx:5`

#### Relation component

- Imports file model component:
  - `.../products-to-file-storage-module-files/.../default/Component.tsx:2`
- Finds and renders concrete file entity by `fileStorageModuleFileId`:
  - `.../default/Component.tsx:17-44`

#### File model

- Final renderer (image/video):
  - `.../file/frontend/component/src/lib/singlepage/default/Component.tsx:23-67`

### Admin form pattern (`react-hook-form` + zod + shared admin parent)

Pattern:

- `useForm` + `zodResolver(insertSchema)`
- `useGetAdminFormState` from shared hooks
- `ParentAdminForm` from shared frontend components
- CRUD mutations via SDK client `api.create()/api.update()`

Product:

- `.../product/frontend/component/src/lib/singlepage/admin/form/ClientComponent.tsx:29-31`
- `.../ClientComponent.tsx:55-64`

Relation products-to-file-storage-module-files:

- `.../products-to-file-storage-module-files/.../admin/form/ClientComponent.tsx:27-29`
- `.../ClientComponent.tsx:50-59`
- Inside the form, selectors from model components in different modules are connected:
  - `.../ClientComponent.tsx:89-101` (`Product` + `FileStorageModuleFile`)

### `isServer` propagation pattern

Repeats in relation/model composition:

- Parent passes `isServer` into relation/model children.
- Used in mixed server/client rendering.

Examples:

- Product default: `.../default/Component.tsx:44`, `:70`, `:85`, ...
- Relation default: `.../products-to-file-storage-module-files/.../default/Component.tsx:16`, `:36`

Scan:

- `isServer={false}` appears `336` times in `apps/host + libs/modules`.

### `client.tsx` / `server.tsx` dual-wrapper pattern

Separate server and client wrappers for one variant group.

Example (`rbac subject authentication is-authorized-wrapper-default`):

- client wrapper:
  - `.../client.tsx:9-23` (client API hook + loading/fallback flow)
- server wrapper:
  - `.../server.tsx:10-25` (server API check + fallback component)

Scan:

- `client.tsx` wrappers: `36`
- `server.tsx` wrappers: `36`
- `ClientComponent.tsx`: `193`

### Shared imports in frontend (frequency)

Frontend scan (`apps/host + libs/modules/**/frontend`):

- `@sps/shared-frontend-client-utils`: `262`
- `@sps/shared-frontend-components/singlepage/default/interface`: `223`
- `@sps/shared-frontend-components/singlepage/default`: `217`
- `@sps/shared-frontend-client-hooks`: `150`
- `@sps/shared-ui-shadcn`: `91`
- `@sps/shared-utils`: `86`

## Shared components

- `@sps/shared-frontend-components/singlepage/default`
- `@sps/shared-frontend-components/singlepage/find`
- `@sps/shared-frontend-components/singlepage/admin/select-input*`
- `@sps/shared-frontend-components/singlepage/admin/table*`
- `@sps/shared-frontend-components/singlepage/admin/form*`
