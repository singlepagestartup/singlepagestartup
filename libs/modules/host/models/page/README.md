# Host Page Model

## Purpose

Pages represent routable site pages and act as containers for layouts, widgets,
and metadata. The default variant assembles layout structure and in-page widgets
for the page.

## Fields

- `id`: unique identifier (UUID).
- `title`: page title.
- `url`: page URL path.
- `description`: page description.
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant/style.
- `className`: custom CSS classes.
- `language`: language code.
- `adminTitle`: title shown in admin interface.

## Variants

- `default`: renders page layouts and page widgets for the current page.
- `find`: data-fetch wrapper for querying pages.
- `find-by-url`: resolves a page by URL path (routing helper).
- `url-segment-value`: exposes URL segment values for routing.
- `admin-select-input`: admin UI select input for linking pages.
- `admin-table-row`: admin UI row for page listings.
- `admin-form`: admin UI create/edit form.
- `admin-table`: admin UI table for browsing pages.
