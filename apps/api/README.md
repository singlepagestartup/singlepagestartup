# API app

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
