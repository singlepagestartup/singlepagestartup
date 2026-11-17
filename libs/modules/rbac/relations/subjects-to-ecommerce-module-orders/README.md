# RBAC Subjects to Ecommerce Module Orders Relation

## Purpose

Links subjects to ecommerce orders. Human admin form saves and deletions use
the current Subject catalogue API, whose service requires administrator access
for ownership changes. Raw infrastructure writes require the operator
credential, including when a user holds an administrator role or explicit raw write grant.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `className`: optional CSS class name.
- `subjectId`: linked subject ID.
- `ecommerceModuleOrderId`: linked order ID.

## Variants

- `default`: renders the related order using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
