# CRM Widget Model

## Purpose

CRM widgets render form-related UI blocks and wrap form content lists.

## Fields

- `id`: unique identifier (UUID).
- `title`: localized title.
- `subtitle`: localized subtitle.
- `description`: localized description.
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `className`: optional CSS class name.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: placeholder widget view.
- `form-list-default`: card layout wrapper with title/description for embedded forms.
- `find`: data-fetch wrapper for querying widgets.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing a widget.
- `admin-table`: admin table listing widgets.
- `admin-table-row`: admin row showing widget fields.
