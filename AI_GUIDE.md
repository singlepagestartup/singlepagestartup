# AI Project Guide (Start Here)

This file is the **entry point for any AI assistant** working in this repository. If you are an AI, read this file first, then follow the references below.

## 1. What this repo is

SinglePageStartup (SPS) is an Nx monorepo with:

- API app: `apps/api` (Bun + Hono).
- Host app: `apps/host` (Next.js App Router).
- MCP server: `apps/mcp` (tools/resources for AI).
- Business modules: `libs/modules/<module>`.

Each module contains:

- `models/<model>` and `relations/<relation>` with backend and frontend layers.
- Module-level docs: `libs/modules/<module>/README.md`.
- Per-model docs: `libs/modules/<module>/models/<model>/README.md`.
- Per-relation docs: `libs/modules/<module>/relations/<relation>/README.md`.

## 2. How to get documentation

### If MCP tools are available

Use the MCP tools exposed by `apps/mcp`:

- `get-project-doc` → reads root `README.md`.
- `get-module-doc` → reads module README (use **kebab-case** module name).
- `get-entity-doc` → reads per-model/per-relation README.

Start with `get-project-doc`, then drill into modules and entities.

### If MCP tools are NOT available

Read files directly in this order:

1. `README.md` (root overview).
2. `libs/modules/<module>/README.md` (module summary).
3. `libs/modules/<module>/models/<model>/README.md` or
   `libs/modules/<module>/relations/<relation>/README.md` (entity details).

## 3. Architecture rules (must follow)

### Frontend

- **TailwindCSS only**. No ad-hoc CSS; extend tokens in `apps/host/styles/presets/shadcn.ts` if needed.
- Variant structure: `interface.ts` → `index.tsx` → `Component.tsx`.
- Use `ClientComponent.tsx` only for browser APIs (`"use client"`).
- Data access **only via SDK providers** (`Provider`, `clientApi`, `serverApi`).
- Relations must use `variant="find"` with filters in `apiProps.params.filters.and`.
- If a component is client-only, pass `isServer={false}` to all downstream model/relation components.

### Backend

- Only `apps/api/app.ts` hosts Hono. Modules must not run their own servers.
- Layers: Repository → Service → Controller → App.
- Repository schemas in `backend/repository/database`.
- Controllers extend `RESTController`, services extend `CRUDService`.
- Middlewares only in `apps/api`, never imported by modules directly.

## 4. How to add or change content (critical workflow)

**Publishing content widgets to a page requires multiple modules.**
Typical flow:

1. Create a widget in `website-builder` (content model).
2. Create a widget in `host` (page composition container).
3. Link the page and host widget via `host` relation `pages-to-widgets`.
4. Link the host widget to the content widget via `host` relation `widgets-to-external-widgets`.

If an AI only creates a `host` widget without the `website-builder` widget, the page will not show content.

## 5. Where to look for variants

Frontend variants live here:
`libs/modules/<module>/<models|relations>/<name>/frontend/component/src/lib/singlepage/<variant>/Component.tsx`

Sometimes variants are nested (e.g. `admin/form`, `article/overview/default`). Always inspect the `Component.tsx` and `ClientComponent.tsx` to understand behavior.

## 6. MCP tools and resources

The MCP server (`apps/mcp`) exposes tools/resources for models and relations. Use those instead of inventing data or direct DB access.

## 7. Nx usage

Prefer running tasks via Nx (`nx run`, `nx run-many`, `nx affected`).

## 8. If you are unsure

Do not guess. Read the relevant README file or inspect the actual component code.
