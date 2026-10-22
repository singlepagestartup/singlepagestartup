# Website Builder Slide Model

## Purpose

Slides are items inside sliders, combining media, text, and CTAs.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant/style.
- `className`: custom CSS classes.
- `url`: optional link URL for the slide.
- `adminTitle`: title shown in admin interface.
- `slug`: URL-friendly unique identifier.
- `title`: slide title (localized).
- `subtitle`: slide subtitle (localized).
- `description`: slide description (localized).

## Variants

- `default`: renders localized title, subtitle, rich description, ordered media and attached buttons; the title links to `url` if set. CTA links stay independent, avoiding nested anchors.
- `find`: data-fetch wrapper for querying slides.
- `admin-select-input`: admin UI select input for linking slides.
- `admin-table-row`: admin UI row for slide listings.
- `admin-form`: admin UI create/edit form.
- `admin-table`: admin UI table for browsing slides.
