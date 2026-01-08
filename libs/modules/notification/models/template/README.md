# Notification Template Model

## Purpose

Templates define reusable message layouts for notifications.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `title`: template title.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: placeholder template view.
- `find`: data-fetch wrapper for querying templates.
- `admin-form`: admin create/edit form for template fields.
- `admin-select-input`: admin select input for choosing a template.
- `admin-table`: admin table listing templates.
- `admin-table-row`: admin row showing template fields.
