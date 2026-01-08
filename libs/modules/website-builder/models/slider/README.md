# Website Builder Slider Model

## Purpose

Sliders render carousels composed of ordered slides.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant/style.
- `className`: custom CSS classes.
- `adminTitle`: title shown in admin interface.
- `slug`: URL-friendly unique identifier.
- `title`: slider title (localized).
- `subtitle`: slider subtitle (localized).
- `description`: slider description (localized).

## Variants

- `default`: renders a carousel using related slides.
- `find`: data-fetch wrapper for querying sliders.
- `admin-select-input`: admin UI select input for linking sliders.
- `admin-table-row`: admin UI row for slider listings.
- `admin-form`: admin UI create/edit form.
- `admin-table`: admin UI table for browsing sliders.
