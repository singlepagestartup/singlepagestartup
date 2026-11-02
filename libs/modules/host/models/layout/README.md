# Host Layout Model

## Purpose

Layouts define reusable page structure containers that group widgets and
organize them into slots.

Host Page composes route-aware Layout Widgets from their persisted
`layouts-to-widgets` links and supplies ready `before` and `after` nodes.
Layout receives those slots and page children. It has no current-URL prop.
A standalone Layout loads its ordinary `default` and `additional` relations
when the corresponding slots are omitted. Layout Widgets and Page Widgets
retain their separate database links.

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
