# Host Widget Model

## Purpose

Host widgets are placement containers that render external content connected
via `widgets-to-external-widgets`.

## Fields

- `title`: widget title (localized).
- `subtitle`: widget subtitle (localized).
- `description`: widget description (localized).
- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant/style.
- `className`: custom CSS classes.
- `adminTitle`: title shown in admin interface.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: resolves linked external widgets and renders their content.
- `find`: data-fetch wrapper for querying widgets.
- `admin-select-input`: admin UI select input for linking widgets.
- `admin-table-row`: admin UI row for widget listings.
- `admin-form`: admin UI create/edit form.
- `admin-table`: admin UI table for browsing widgets.
