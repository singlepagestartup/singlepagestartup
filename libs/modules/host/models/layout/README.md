# Host Layout Model

## Purpose

Layouts define reusable page structure containers that group widgets and
organize them into slots.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant/style.
- `title`: layout title.
- `className`: custom CSS classes.
- `adminTitle`: title shown in admin interface.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: renders widgets from `layouts-to-widgets` in two slots:
  `default` first, then children, then `additional`.
- `find`: data-fetch wrapper for querying layouts.
- `admin-select-input`: admin UI select input for linking layouts.
- `admin-table-row`: admin UI row for layout listings.
- `admin-form`: admin UI create/edit form.
- `admin-table`: admin UI table for browsing layouts.
