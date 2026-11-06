# Host Pages To Layouts Relation

## Purpose

Connects pages to layouts and defines their order.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant/style.
- `orderIndex`: ordering index for the relation.
- `className`: custom CSS classes.
- `pageId`: related reference.
- `layoutId`: related reference.

## Variants

- `default`: resolves the related Layout and forwards prepared `before`,
  children and `after` slots supplied by Host Page. It receives no current URL.
- `find`: data-fetch wrapper for querying relations.
- `admin-select-input`: admin UI select input for linking relations.
- `admin-table-row`: admin UI row for relation listings.
- `admin-form`: admin UI create/edit form.
- `admin-table`: admin UI table for browsing relations.
