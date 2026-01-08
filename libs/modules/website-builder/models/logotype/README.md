# Website Builder Logotype Model

## Purpose

Logotype represents a brand mark, typically linked to a URL.

## Fields

- `className`: custom CSS classes.
- `url`: destination URL.
- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant/style.
- `title`: logotype title (localized).
- `adminTitle`: title shown in admin interface.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: renders linked logotype media and wraps it with a link.
- `find`: data-fetch wrapper for querying logotypes.
- `admin-select-input`: admin UI select input for linking logotypes.
- `admin-table-row`: admin UI row for logotype listings.
- `admin-form`: admin UI create/edit form.
- `admin-table`: admin UI table for browsing logotypes.
