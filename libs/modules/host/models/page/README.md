# Host Page Model

## Purpose

Pages represent routable site pages and act as containers for layouts, widgets,
and metadata. The default variant assembles layout structure and in-page widgets
for the page. Page resolves the Layout's default and additional Widget links,
composes their Host Widgets with the current route, and supplies ready nodes to
the Layout. The Layout and its relation presenters receive no URL. External
Widget adapters in Host resolve model IDs and presentation flags before rendering
other modules.

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

## URL lookup cache

The client `findByUrl` query key includes the URL and query parameters, so
different destinations have separate entries. Both URL lookup readers subscribe
to Page changes through `host.pages`.

HTTP response caching excludes `find-by-url`, `url-segment-value` and `urls`.
These operations expand Page masks against other modules' records; a fixed
Page-only cache topic cannot describe all changes to dynamic route values.
The exclusions are defined in
`libs/middlewares/src/lib/http-cache/routes/singlepage.ts`.
