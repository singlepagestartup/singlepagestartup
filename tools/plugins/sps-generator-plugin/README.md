# sps-generator-plugin

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx build sps-generator-plugin` to build the library.

## Running unit tests

Run `nx test sps-generator-plugin` to execute the unit tests via [Jest](https://jestjs.io).

## Repository generation and Consistency Capture

Generated model and relation targets run Drizzle in the entity repository.
Run the entity's `repository-generate` target after changing fields and commit
its migration files. On deployment, `api:db:migrate` registers the effective
Table and SDK route with Consistency and verifies the installed triggers.
See [the database provider lifecycle](../../../libs/providers/db/README.md).

## Module applications

New module Apps inherit `ModuleApp` from the shared backend API. Their
bootstraps expose `IModuleApp<Apps>`, which extends `IDefaultApp` with the typed
child registry. Shared initialization, route descriptions, mounting and data
tooling stay in the base; domain configuration stays in the owning module.

The module generator inserts its import and entry into `apps/api/app.ts`'s
`apiModules` registry. The API uses this registry for HTTP mounting and Host
resource discovery. Keep this composition point in owned API entrypoints;
no separate module route registration is generated.
