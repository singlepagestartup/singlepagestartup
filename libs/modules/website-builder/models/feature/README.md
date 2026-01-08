# Website Builder Feature Model

## Purpose

Features describe highlighted content blocks with text and optional media.

## Fields

- `className`: custom CSS classes.
- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant/style.
- `title`: feature title (localized).
- `subtitle`: feature subtitle (localized).
- `description`: feature description (localized, rich text).
- `adminTitle`: title shown in admin interface.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: renders title/description and linked media files.
- `find`: data-fetch wrapper for querying features.
- `admin-select-input`: admin UI select input for linking features.
- `admin-table-row`: admin UI row for feature listings.
- `admin-form`: admin UI create/edit form.
- `admin-table`: admin UI table for browsing features.
