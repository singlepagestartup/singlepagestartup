# Billing Widget Model

## Purpose

Billing widgets provide reusable content blocks for embedding billing UI and related data.

## Fields

- `id`: unique identifier (UUID).
- `title`: localized widget title.
- `subtitle`: localized widget subtitle.
- `description`: localized rich description.
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: placeholder widget view for billing content.
- `find`: data-fetch wrapper for querying widgets.
- `admin-form`: admin create/edit form for localized content and metadata.
- `admin-select-input`: admin select input for choosing a widget.
- `admin-table`: admin table listing widgets.
- `admin-table-row`: admin row showing title and variant.
