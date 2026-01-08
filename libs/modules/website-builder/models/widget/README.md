# Website Builder Widget Model

## Purpose

Widgets store reusable content blocks (text, media, structured sections) for building UI sections.

## Fields

- `title`: widget title (localized).
- `subtitle`: widget subtitle (localized).
- `description`: widget description/content (localized, rich text).
- `anchor`: HTML anchor for in-page navigation.
- `className`: custom CSS classes.
- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant/style.
- `adminTitle`: title shown in admin interface.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: sample component, for debugging.
- `content-default`: rich content sections (article-like text blocks).
- `footer-default`: site footer layout (links, navigation, legal).
- `navbar-default`: site header/navigation bar (menus, branding).
- `find`: internal data-fetch wrapper for queries; not used directly on pages.
- `admin-select-input`: admin UI select input for linking widgets.
- `admin-table-row`: admin UI row for widget listings.
- `admin-form`: admin UI create/edit form.
- `admin-table`: admin UI table for browsing widgets.
