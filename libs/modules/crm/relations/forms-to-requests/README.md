# CRM Forms to Requests Relation

## Purpose

Links form definitions to submitted requests.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `orderIndex`: ordering index for display.
- `variant`: display variant.
- `className`: optional CSS class name.
- `formId`: linked form ID.
- `requestId`: linked request ID.

## Variants

- `default`: renders the related request using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
