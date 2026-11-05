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

## Variants

- `default`: placeholder permission view.
- `find`: data-fetch wrapper for querying permissions.
- `admin-form`: admin create/edit form for permission fields.
- `admin-select-input`: admin select input for choosing a permission.
- `admin-table`: admin table listing permissions.
- `admin-table-row`: admin row showing permission fields.

## Exact public resource discovery

`GET /api/rbac/permissions/public-resource-ids?resource=/api/<module>/<collection>`
and the server SDK `publicResourceIds({ params: { resource } })` return UUIDs
from exact HTTP GET Permissions without Role bindings. The owning Permission
Service applies its effective `isSensitiveRoute` policy. Bracket templates,
collection/count paths, nested operations and permissions for other resources
do not supply IDs. Both Permission rows and Role bindings are read in batches.

This operation discovers explicit grants; it does not create permissions or
make a private collection public. Consumers still read each candidate through
its anonymous resource API, so deleted records and additional access guards
remain effective. Host Page uses it to expand private collections in saved URL
masks without importing authorization rules or embedding resource names.

Permission Service now receives RolesToPermissions Service through
`PermissionDI.IRolesToPermissionsService`. Owned factories must provide this
third constructor dependency; ordinary CRUD methods retain their contracts.
