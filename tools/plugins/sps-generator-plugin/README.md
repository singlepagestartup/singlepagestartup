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

## Server service dependencies

Add a new module at its approved position in the
[module dependency order](../../../.agents/contracts/engineering/module-dependencies.md)
before running the module generator. Creating or removing a module, model or
relation refreshes the generated service registries. A registry entry calls
the owner's service factory only when a consumer reads it.

Add a project-specific public method to the entity's
`backend/app/api/src/lib/service/startup/index.ts`. A higher module can call
it with its inferred argument and result types. For example, Agent can call
`this.modules.ecommerce.order.findById({ id })` and use methods added to the
same Order startup class. A parent can also use its outgoing relations and
their same-module children through the generated view.

Every entity exports `serviceBootstrap` from
`backend/app/api/src/lib/bootstrap.ts`. For a scoped test, call
`createAppAssembly(({ overrideService }) => overrideService(serviceBootstrap, replacement))`
and pass that assembly to the owner and consumer bootstraps. The service factory
resolves the effective service synchronously. The HTTP controller receives the
same instance when its application starts.
