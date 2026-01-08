# Host Layouts To Widgets Relation

## Purpose

Connects layouts to widgets and defines their order.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant/style.
- `orderIndex`: ordering index for the relation.
- `className`: custom CSS classes.
- `layoutId`: related reference.
- `widgetId`: related reference.

## Variants

- `default`: renders the related target for this link.
- `additional`: alternate slot, rendered like `default`.
- `find`: data-fetch wrapper for querying relations.
- `admin-select-input`: admin UI select input for linking relations.
- `admin-table-row`: admin UI row for relation listings.
- `admin-form`: admin UI create/edit form.
- `admin-table`: admin UI table for browsing relations.
