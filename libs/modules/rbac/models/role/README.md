# RBAC Role Model

## Purpose

Roles group permissions and can be assigned to subjects.

## Fields

- `id`: unique identifier (UUID).
- `title`: role title.
- `slug`: role slug.
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `availableOnRegistration`: flag for default registration roles.

## Variants

- `default`: placeholder role view.
- `find`: data-fetch wrapper for querying roles.
- `admin-form`: admin create/edit form for role fields.
- `admin-select-input`: admin select input for choosing a role.
- `admin-table`: admin table listing roles.
- `admin-table-row`: admin row showing role fields.

## Exact public resource discovery

`GET /api/rbac/roles/public-resource-ids?resource=/api/<module>/<collection>`
and the Role server SDK `publicResourceIds({ params: { resource } })` return UUIDs
from exact HTTP GET Permissions without Role bindings. Role delegates to the effective Permission Service for its `isSensitiveRoute` policy. Bracket templates,
collection/count paths, nested operations and permissions for other resources
do not supply IDs. Both Permission rows and Role bindings are read in batches.

This operation discovers explicit grants; it does not create permissions or
make a private collection public. Consumers still read each candidate through
its anonymous resource API, so deleted records and additional access guards
remain effective. Host Page uses it to expand private collections in saved URL
masks without importing authorization rules or embedding resource names.

Host makes this discovery call with its server credential and rejects redirects.
Candidate records are still read anonymously. The old Permission discovery
endpoint and SDK operation are removed; downstream callers use the Role SDK.
Role receives Permission and RolesToPermissions through DI.
