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

### Social reads without a role

The public site reads widget composition, links crediting profiles on Blog articles,
and the `/api/social/profiles/authors` projection. The author projection returns
the selected image for a publishable author. Chat participants use avatars
supplied by their Subject-scoped chat reads. The raw profile-to-file relation
list, its count and its detail routes require an assigned role.

An empty role list on the raw Chat collection or count grants no access.
Publishing one demo chat requires a GET permission whose path names that exact
Chat UUID. A template does not publish the other chats. Host route enumeration
can discover exact public grants through the Permission SDK. Private chat
membership is checked on the Subject routes. Administrators and operator
requests use their existing access paths.
