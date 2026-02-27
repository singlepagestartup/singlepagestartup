# Api app

## Guidelines

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

## Patterns

### Unified API host and module-mount pattern

- `apps/api/app.ts` imports module apps and mounts them via `app.route("/api/<module>", moduleApp.hono)`.
- Example module imports:
  - `apps/api/app.ts:27` — `ecommerceApp`
  - `apps/api/app.ts:33` — `fileStorageApp`
- Example mounts:
  - `apps/api/app.ts:131` — `/api/ecommerce`
  - `apps/api/app.ts:138` — `/api/file-storage`

This repeats across all modules and forms a single backend entry point.

### Modular App aggregator inside each backend module

Pattern:

- Root module app contains an `Apps` class with an `apps[]` list.
- Each entry describes `type`, `route`, `app`.
- Mounting is done via `this.hono.route(app.route, app.app.hono)`.

Examples:

- `libs/modules/ecommerce/backend/app/api/src/lib/apps.ts`
  - `:55` — route `/products`
  - `:135` — route `/products-to-file-storage-module-files`
- `libs/modules/file-storage/backend/app/api/src/lib/apps.ts`
  - `:17` — route `/files`
- `libs/modules/ecommerce/backend/app/api/src/lib/app.ts:65`
- `libs/modules/file-storage/backend/app/api/src/lib/app.ts:65`

### Standard backend scaffold for model/relation (shared inheritance)

Base template in most models/relations:

1. `App extends DefaultApp`
2. `Controller (singlepage) extends RESTController`
3. `Service (singlepage) extends CRUDService`
4. `Repository extends DatabaseRepository`
5. `Configuration extends ParentConfiguration`
6. `bootstrap.ts` with Inversify `ContainerModule` and DI bindings

Examples:

- Product model:
  - `.../product/backend/app/api/src/lib/app.ts:7`
  - `.../product/backend/app/api/src/lib/controller/singlepage/index.ts:7`
  - `.../product/backend/app/api/src/lib/service/singlepage/index.ts:7`
  - `.../product/backend/app/api/src/lib/repository.ts:7`
  - `.../product/backend/app/api/src/lib/configuration.ts:11`
  - `.../product/backend/app/api/src/lib/bootstrap.ts:13`
- Products-to-file-storage relation:
  - `.../products-to-file-storage-module-files/backend/app/api/src/lib/app.ts:7`
  - `.../controller/singlepage/index.ts:7`
  - `.../service/singlepage/index.ts:7`
  - `.../repository.ts:7`
  - `.../configuration.ts:11`
  - `.../bootstrap.ts:13`
- File model:
  - `.../file/backend/app/api/src/lib/app.ts:7`
  - `.../repository.ts:7`
  - `.../configuration.ts:11`
  - `.../bootstrap.ts:13`

Repository scan (`rg`):

- `extends DefaultApp`: `146` files
- `extends RESTController`: `146` occurrences (primary singlepage pattern)
- `extends CRUDService`: `146` occurrences
- `extends DatabaseRepository`: `146` occurrences
- `Configuration as ParentConfiguration`: `146` files
- `new ContainerModule` in backend bootstrap: `161` files

### Startup -> Singlepage proxying

Common pattern:

- `controller/index.ts` exports startup controller.
- `service/index.ts` exports startup service.
- Startup class inherits from singlepage class.

Examples:

- `.../product/backend/app/api/src/lib/controller/index.ts:1`
- `.../product/backend/app/api/src/lib/controller/startup/index.ts:8`
- `.../product/backend/app/api/src/lib/service/index.ts:1`
- `.../product/backend/app/api/src/lib/service/startup/index.ts:6`

Same pattern in relation/file.

### Repository database pattern (Drizzle + zod + migrate config)

#### Model schema pattern

- `schema.ts` defines `moduleName`, `table`, `pgTableCreator`.
- Fields are moved to `fields`.

Examples:

- Product:
  - `.../product/backend/repository/database/src/lib/schema.ts:4`
  - `.../product/backend/repository/database/src/lib/fields/singlepage.ts:4`
- File:
  - `.../file/backend/repository/database/src/lib/schema.ts:4`
  - `.../file/backend/repository/database/src/lib/fields/singlepage.ts`

#### Relation schema pattern (inline fields + cross-module FK)

- Relation can define fields directly in `schema.ts` and reference tables from other modules.
- Example:
  - `.../products-to-file-storage-module-files/backend/repository/database/src/lib/schema.ts:2` import `Product`
  - `.../schema.ts:3` import `FileStorageModuleFile`
  - `.../schema.ts:17-24` FK `productId -> Product.id`, `fileStorageModuleFileId -> FileStorageModuleFile.id`

#### `index.ts` pattern in database

- `createInsertSchema` / `createSelectSchema` + export `IInsertSchema` / `ISelectSchema`.

Examples:

- Product: `.../product/backend/repository/database/src/lib/index.ts:6`
- Relation: `.../products-to-file-storage-module-files/backend/repository/database/src/lib/index.ts:5`
- File: `.../file/backend/repository/database/src/lib/index.ts:6`

Scan:

- `createInsertSchema` in `backend/repository/database/src/lib/index.ts`: `146` files

#### `config.ts` migrate pattern

- `MigrateConfig` from `@sps/shared-backend-database-config`.
- Defines `schemaPaths`, `migrationsFolder`, `migrationsTable`.

Examples:

- Product: `.../product/backend/repository/database/src/lib/config.ts:1`
- Relation: `.../products-to-file-storage-module-files/.../config.ts:1`
- File: `.../file/backend/repository/database/src/lib/config.ts:1`

### Seed orchestration pattern and cross-module transformers

#### Global seed orchestration (`apps/api`)

- `apps/api/src/db/seed.ts` imports module apps and runs seeding in phases:
  - first `type: "model"`
  - then `type: "relation"`

Examples:

- `apps/api/src/db/seed.ts:7` — `ecommerceApp`
- `apps/api/src/db/seed.ts:8` — `fileStorageApp`
- `apps/api/src/db/seed.ts:138` — `ecommerceApp.seed({ type: "model" ... })`
- `apps/api/src/db/seed.ts:174` — `fileStorageApp.seed({ type: "model" ... })`
- `apps/api/src/db/seed.ts:308` — `ecommerceApp.seed({ type: "relation" ... })`

#### Relation seed linkage to models from another module

- `products-to-file-storage-module-files` configuration uses `transformers` and `filters` to resolve new IDs from seed outputs of `product` and `file`.

Example:

- `.../products-to-file-storage-module-files/backend/app/api/src/lib/configuration.ts:34-46`
- `.../configuration.ts:52-67`
- `.../configuration.ts:73-105`

### SDK

#### SDK model pattern

- Unified shape:
  - `IModel` comes from backend repository database type
  - `serverHost`, `clientHost`, `route`, `options`

Examples:

- Product: `.../product/sdk/model/src/lib/index.ts:14-20`
- Relation: `.../products-to-file-storage-module-files/sdk/model/src/lib/index.ts:14-20`
- File: `.../file/sdk/model/src/lib/index.ts:14-26`

#### SDK client pattern

- `"use client"`
- `factory` + `queryClient`
- re-export `{ Provider, queryClient }` from shared frontend client api

Examples:

- Product: `.../product/sdk/client/src/lib/singlepage/index.ts:1-23`
- Relation: `.../products-to-file-storage-module-files/sdk/client/src/lib/singlepage/index.ts:1-21`
- File: `.../file/sdk/client/src/lib/singlepage/index.ts:1-23`

#### SDK server pattern

- `factory` from `@sps/shared-frontend-server-api`

Examples:

- Product: `.../product/sdk/server/src/lib/singlepage/index.ts:1-19`
- Relation: `.../products-to-file-storage-module-files/sdk/server/src/lib/singlepage/index.ts:1-17`

Variation:

- File server SDK extends base `factory` with custom actions:
  - `createFromUrl`, `generate`
  - `.../file/sdk/server/src/lib/singlepage/index.ts:10-41`

Scan:

- `sdk/client/singlepage` with `@sps/shared-frontend-client-api`: `146`
- `sdk/server/singlepage` with `@sps/shared-frontend-server-api`: `146`

### Backend variation pattern: extended controller on top of RESTController

Most singlepage controllers are "empty" and only inherit `RESTController`.
But some models (example: `file`) extend routes with additional handlers.

File example:

- `.../file/backend/app/api/src/lib/controller/singlepage/index.ts:20-56` (added `/generate`, `/create-from-url`)
- Custom handlers:
  - `.../singlepage/create/index.ts`
  - `.../singlepage/update/index.ts`
  - `.../singlepage/delete/index.ts`
  - `.../singlepage/create-from-url/index.ts`
  - `.../singlepage/generate/index.ts`
