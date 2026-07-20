# RBAC Roles to Permissions Relation

## Purpose

Links roles to permissions.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `className`: optional CSS class name.
- `roleId`: linked role ID.
- `permissionId`: linked permission ID.
- `condition`: optional authorization condition attached to the grant.

## Natural key and startup extension

The database permits exactly one relation for `(roleId, permissionId)`. The
named composite unique index is declared in `constraints/singlepage.ts` and is
retained by the `singlepage -> startup -> index` composition. Startup may add
indexes, but changing this identity requires coordinated service filters,
repair semantics for `condition`, and a generated migration.

## Variants

- `default`: renders the related permission using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
