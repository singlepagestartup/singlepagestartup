# AGENTS.md

## Overview

- SinglePageStartup (SPS) is an Nx monorepo composed of a Bun + Hono API (`apps/api`) and a Next.js App Router host (`apps/host`).
- Backend logic lives in `libs/modules/<module>/backend`; frontend variants live in `libs/modules/<module>/frontend`.
- Global operational scripts (e.g., database, Redis) are orchestrated from the repository root via shell helpers and Nx targets.

## AI Entry Point

- Start with `AI_GUIDE.md` for AI-specific onboarding, workflows, and MCP usage.

## Environment & Requirements

- Node.js 20+, npm 10+ (as per package engines).
- Bun runtime installed (used by `apps/api`).
- Docker & Docker Compose **required** for Postgres and Redis (the `./up.sh` script expects Docker to be available on the agent machine).

## Setup & Execution

- Install dependencies: `npm install`
- Bootstrap infrastructure & migrations (requires Docker): `./up.sh`
  - Creates environment files, starts Postgres (`apps/db`) and Redis (`apps/redis`), then runs `npx nx run api:db:migrate`.
- Start API server: `npm run api:dev`
- Start host (Next.js) server: `npm run host:dev`
- Additional Nx database targets: see `apps/api/project.json` (`repository-generate`, `repository-migrate`, `db:seed`, etc.).

## Frontend Guidelines

- **TailwindCSS only**: use Tailwind utility classes. If you need new tokens (colors, spacing, radii, etc.), extend `apps/host/styles/presets/shadcn.ts`; never introduce ad-hoc CSS classes.
- **Variant structure**: each variant follows `interface.ts` → `index.tsx` → `Component.tsx`; add `ClientComponent.tsx` only when browser APIs are required.
- When a component becomes client-only (`"use client"`), pass `isServer={false}` to every downstream relation/model component to avoid React Server Component hydration issues.
- Keep any extra helpers in an `assets/` directory and import them from the main variant file.
- Data access must go through module SDK providers (`Provider`, `clientApi`, `serverApi`). Relation components should use `variant="find"` with filters supplied via `apiProps.params.filters.and`.
- For advanced fetching/transform logic, mirror the `singlepage/default` pattern: move data-handling into `client.tsx` / `server.tsx` wrappers so `Component.tsx` stays purely presentational.

## Backend Guidelines

- `apps/api/app.ts` is the **only** host: mount every module backend app via `app.route("/api/<module>", moduleApp.hono)`; modules must not expose their own servers.
- Module structure:
  - `backend/repository/database`: Drizzle schema (`fields/`, `schema.ts`), migration config, optional seed/dump data, exported via `index.ts`.
  - `backend/app/api`: Inversify bootstrap binding `Repository`, `Service`, `Controller`, `Configuration`, `App`; controllers extend `RESTController`, services extend `CRUDService`, repositories extend `DatabaseRepository`.
- Middlewares reside in `libs/middlewares` and are instantiated **only** inside `apps/api` (order: request id → observer → CORS → session → authorization → cache → revalidation, etc.). Modules must never import them directly.
- When adding a model/relation:
  1. Implement repository schema/migrations.
  2. Implement backend app (bootstrap + DI bindings).
  3. Export bootstrapped `app` (`const { app } = await bootstrap();`).
  4. Register the app in the module’s `apps.ts` aggregator and mount it in `apps/api/app.ts`.
  5. Update Nx targets (`repository-generate`, `repository-migrate`, seeds/dumps) if necessary.

## Code Review Checklist

- Enforce TypeScript interface-first style, PascalCase components, and consistent export order.
- Confirm frontend changes obey the Tailwind/shadcn preset rules, variant structure, and SDK-based data fetching.
- Confirm backend changes preserve the layered architecture (repository/service/controller) and never bypass shared utilities (logging, caching, RBAC, revalidation).
- Ensure migrations/seeds or Nx targets are updated when schema changes.

## References

- Detailed rule files (auto-applied by Cursor) remain in `.cursor/rules/`:
  - `project/frontend.mdc`
  - `project/backend.mdc`
  - `project/code-review.mdc`
  - `expert.mdc`
- Realtime revalidation and invalidation flow:
  - `libs/middlewares/src/lib/revalidation/README.md`
  - `libs/shared/frontend/client/api/README.md`
  - `libs/shared/frontend/client/store/README.md`
  - `libs/shared/frontend/client/store/src/lib/README.md`

Use this AGENTS.md as the entry point; the linked rule files contain the authoritative, granular instructions for SPS development.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->
