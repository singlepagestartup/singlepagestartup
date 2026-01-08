# Website Builder Buttons Array Model

## Purpose

ButtonsArray groups multiple buttons into a single ordered set.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant/style.
- `className`: custom CSS classes.
- `title`: array title (localized).
- `description`: array description (localized).
- `adminTitle`: title shown in admin interface.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: renders buttons via `buttons-arrays-to-buttons` relation.
- `find`: data-fetch wrapper for querying arrays.
- `admin-select-input`: admin UI select input for linking arrays.
- `admin-table-row`: admin UI row for array listings.
- `admin-form`: admin UI create/edit form.
- `admin-table`: admin UI table for browsing arrays.
