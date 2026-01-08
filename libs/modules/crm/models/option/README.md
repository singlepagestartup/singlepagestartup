# CRM Option Model

## Purpose

Options define selectable values for select-type inputs, optionally with file-based icons.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `className`: optional CSS class name.
- `variant`: display variant.
- `adminTitle`: title used in admin UI.
- `title`: localized title.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: renders option title with optional attached file preview.
- `find`: data-fetch wrapper for querying options.
- `admin-form`: admin create/edit form for option fields.
- `admin-select-input`: admin select input for choosing an option.
- `admin-table`: admin table listing options.
- `admin-table-row`: admin row showing option fields.
