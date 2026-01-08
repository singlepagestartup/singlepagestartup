# Blog Article Model

## Purpose

Articles are the primary content entries in the blog, storing localized text and metadata for rendering lists and detail pages.

## Fields

- `id`: unique identifier (UUID).
- `className`: optional CSS class name.
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.
- `title`: localized title.
- `subtitle`: localized subtitle.
- `description`: localized rich description.

## Variants

- `default`: article card with title, subtitle, attached media, and link to the article page.
- `overview-default`: overview card with description and attached website-builder widgets.
- `overview-with-private-content-default`: wrapper variant for private/child content.
- `find`: data-fetch wrapper for querying articles.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing an article.
- `admin-table`: admin table listing articles.
- `admin-table-row`: admin row showing article fields.
