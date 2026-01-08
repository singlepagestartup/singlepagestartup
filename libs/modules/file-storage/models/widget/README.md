# File Storage Widget Model

## Purpose

Widgets group files for rendering media collections.

## Fields

- `id`: unique identifier (UUID).
- `variant`: display variant.
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `title`: localized title.
- `subtitle`: localized subtitle.
- `description`: localized description.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: renders related files via the widgets-to-files relation.
- `find`: data-fetch wrapper for querying widgets.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing a widget.
- `admin-table`: admin table listing widgets.
- `admin-table-row`: admin row showing widget fields.
