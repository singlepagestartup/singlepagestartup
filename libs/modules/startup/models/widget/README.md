# Startup Widget Model

## Purpose

Startup widgets provide reusable content blocks for startup-specific UI.

## Fields

- `id`: unique identifier (UUID).
- `className`: optional CSS class name.
- `title`: localized title.
- `subtitle`: localized subtitle.
- `description`: localized description.
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: placeholder widget view.
- `find`: data-fetch wrapper for querying widgets.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing a widget.
- `admin-table`: admin table listing widgets.
- `admin-table-row`: admin row showing widget fields.
