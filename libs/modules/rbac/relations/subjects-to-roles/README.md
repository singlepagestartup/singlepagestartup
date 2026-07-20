# RBAC Subjects to Roles Relation

## Purpose

Links subjects to roles.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `className`: optional CSS class name.
- `subjectId`: linked subject ID.
- `roleId`: linked role ID.

## Natural key and startup extension

The database permits exactly one relation for `(subjectId, roleId)`. The named
composite unique index is declared in `constraints/singlepage.ts` and is
retained by the `singlepage -> startup -> index` composition. Startup may add
indexes; replacing the pair requires coordinated service filters, repair, and
a generated migration.

Repository columns use the same extension boundary: SPS defaults live in
`fields/singlepage.ts`, `fields/startup.ts` inherits them and may add or
override startup-specific columns, and `fields/index.ts` exposes the composed
set to `schema.ts`. Constraints never own column declarations.

## Variants

- `default`: renders the related role using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
