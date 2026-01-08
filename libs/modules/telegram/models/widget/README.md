# Telegram Widget Model

## Purpose

Widgets represent Telegram-specific content blocks.

## Fields

- `id`: unique identifier (UUID).
- `title`: widget title.
- `description`: widget description.
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: placeholder widget view.
- `admin-form`: admin create/edit form for widget fields.
- `admin-select-input`: admin select input for choosing a widget.
- `admin-table`: admin table listing widgets.
- `admin-table-row`: admin row showing widget fields.
