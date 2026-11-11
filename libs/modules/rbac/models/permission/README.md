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
unless `isSensitiveRoute` closes its route. The framework lists reviewed routes
as `METHOD path` in `roleless-permissions/singlepage.ts`. A project adds its own
routes in `startup.ts`. A GET permission naming one exact Chat UUID already
expresses the decision to publish that chat and needs no second entry.

The subject is-authorized service compares the table with that list.
`findUnlistedRolelessPermissions()` returns the role-less rows that are not
listed; the rbac unit lane runs it against the seed and fails on any result, and
the API logs the same result from the live table once per process.

A route that needs a role gets it through a `roles-to-permissions` row in the
seed. Seed rows are changed on a database that holds the snapshot ids and
written with `npx nx run api:db:dump`; a database seeded from the snapshots gets
new ids and cannot produce them.

## Website Builder and File Storage reads

Run `npx nx run api:db:seed` to load the shipped read permissions from the
Permission dump. It covers GET for the list, count and records by UUID on 23
collections, plus GET and HEAD for file content. Running migrations alone leaves
these defaults out of a new database.

The seed matches each permission by type, method and path, preserving its local
ID and role bindings. To restrict a route, assign a role in **RBAC → Permissions**.
To keep a permission deleted on future seeds, export the change to the project's
dump. Custom routes need their own permissions.

For example, `GET /api/website-builder/widgets/:uuid` matches a widget UUID.
The resolver checks the exact path and project bracket templates first. The
`:uuid` segment matches a full UUID, so `/widgets/dump` needs its own permission.
A collection permission also covers filtered and unfiltered reads. To restrict
discovery of records, review collection access alongside individual record permissions.

## Variants

- `default`: placeholder permission view.
- `find`: data-fetch wrapper for querying permissions.
- `admin-form`: admin create/edit form for permission fields.
- `admin-select-input`: admin select input for choosing a permission.
- `admin-table`: admin table listing permissions.
- `admin-table-row`: admin row showing permission fields.

## Public resource discovery

[Role](../role/README.md#exact-public-resource-discovery) owns discovery across
Permissions and RolesToPermissions. Permission supplies route resolution and
its effective `isSensitiveRoute` policy; it does not import incoming role links.
Its constructor takes its repository and PermissionsToBillingModuleCurrencies.

### Social reads without a role

The public site reads widget composition, links crediting profiles on Blog articles,
and the `/api/social/profiles/authors` projection. The author projection returns
the selected image for a publishable author. Chat participants use avatars
supplied by their Subject-scoped chat reads. The raw profile-to-file relation
list, its count and its detail routes require an assigned role.

An empty role list on the raw Chat collection or count grants no access.
Publishing one demo chat requires a GET permission whose path names that exact
Chat UUID. A template does not publish the other chats. Host route enumeration
can discover exact public grants through the Role SDK. Private chat
membership is checked on the Subject routes. Administrators and operator
requests use their existing access paths.
