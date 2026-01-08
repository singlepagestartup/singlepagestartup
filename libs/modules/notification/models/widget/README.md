# Notification Widget Model

## Purpose

Notification widgets provide reusable content blocks for notification-related UI.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `title`: localized title.
- `subtitle`: localized subtitle.
- `description`: localized description.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: placeholder widget view.
- `find`: data-fetch wrapper for querying widgets.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing a widget.
- `admin-table`: admin table listing widgets.
- `admin-table-row`: admin row showing widget fields.
