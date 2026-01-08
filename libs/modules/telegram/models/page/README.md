# Telegram Page Model

## Purpose

Pages define Telegram-related page metadata and routing.

## Fields

- `id`: unique identifier (UUID).
- `title`: page title.
- `url`: page URL path.
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: placeholder page view.
- `admin-form`: admin create/edit form for page fields.
- `admin-select-input`: admin select input for choosing a page.
- `admin-table`: admin table listing pages.
- `admin-table-row`: admin row showing page fields.
