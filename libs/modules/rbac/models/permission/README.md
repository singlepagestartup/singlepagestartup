# RBAC Permission Model

## Purpose

Permissions define allowed operations for resources (method/path pairs).

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `type`: permission type (default: `HTTP`).
- `method`: HTTP method.
- `path`: resource path.

## Natural key and startup extension

The database permits exactly one permission for `(type, method, path)`. The
named composite unique index is declared in `constraints/singlepage.ts` and is
retained by the `singlepage -> startup -> index` composition. Startup may add
indexes in `constraints/startup.ts`; replacing this natural key also requires
coordinated service filters, repair behavior, and a generated migration.

Column declarations follow the parallel `fields/singlepage.ts ->
fields/startup.ts -> fields/index.ts` composition. `schema.ts` consumes the
composed fields and constraints; startup-specific overrides stay in their
respective startup files.

## Role-less permissions

A permission row with no `roles-to-permissions` attachment answers every caller
unless `isSensitiveRoute` closes its route. Every such row is listed as
`METHOD path` in `roleless-permissions/`, composed like `fields` and
`constraints`: `singlepage.ts` holds the framework rows, a project adds its own
in `startup.ts`, and `index.ts` exports the startup result.

The subject is-authorized service compares the table with that list.
`findUnlistedRolelessPermissions()` returns the role-less rows that are not
listed; the rbac unit lane runs it against the seed and fails on any result, and
the API logs the same result from the live table once per process.

A route that needs a role gets it through a `roles-to-permissions` row in the
seed. Seed rows are changed on a database that holds the snapshot ids and
written with `npx nx run api:db:dump`; a database seeded from the snapshots gets
new ids and cannot produce them.

## Variants

- `default`: placeholder permission view.
- `find`: data-fetch wrapper for querying permissions.
- `admin-form`: admin create/edit form for permission fields.
- `admin-select-input`: admin select input for choosing a permission.
- `admin-table`: admin table listing permissions.
- `admin-table-row`: admin row showing permission fields.
