# Social Profile Model

## Purpose

Profiles store localized user-facing information for social features.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `className`: optional CSS class name.
- `variant`: display variant.
- `title`: localized title.
- `subtitle`: localized subtitle.
- `description`: localized description.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: profile card with title.
- `overview-default`: profile hero section with description and widgets.
- `button-default`: compact button for profile.
- `find`: data-fetch wrapper for querying profiles.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing a profile.
- `admin-table`: admin table listing profiles.
- `admin-table-row`: admin row showing profile fields.
