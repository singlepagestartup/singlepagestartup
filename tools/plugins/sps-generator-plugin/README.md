# sps-generator-plugin

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx build sps-generator-plugin` to build the library.

## Running unit tests

Run `nx test sps-generator-plugin` to execute the unit tests via [Jest](https://jestjs.io).

## Repository generation and Consistency Capture

Generated model and relation targets run Drizzle migration generation first,
then `npx nx run @sps/providers-db:repository-generate`. Both steps run
sequentially and generation is uncached. Keep this sequence when changing
repository target templates or adding client-owned Startup targets.

Creating source files alone does not generate migrations. Run the new entity's
`repository-generate` target after defining its fields, commit the generated
entity/capture artifacts, apply `api:db:migrate`, and run
`@sps/providers-db:consistency-check`. The capture generator discovers the
entity from its effective Table and SDK route. See
[the database provider lifecycle](../../../libs/providers/db/README.md).

## Module applications

New module Apps inherit `ModuleApp` from the shared backend API. Their
bootstraps expose `IModuleApp<Apps>`, which extends `IDefaultApp` with the typed
child registry. Shared initialization, route descriptions, mounting and data
tooling stay in the base; domain configuration stays in the owning module.

The module generator inserts its import and entry into `apps/api/app.ts`'s
`apiModules` registry. The API uses this registry for HTTP mounting and Host
resource discovery. Keep this composition point in owned API entrypoints;
no separate module route registration is generated.
