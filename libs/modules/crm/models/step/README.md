# CRM Step Model

## Purpose

Steps represent sections in multi-step forms and group input fields.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `className`: optional CSS class name.
- `variant`: display variant.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.
- `title`: localized title.
- `subtitle`: localized subtitle.
- `description`: localized description.

## Variants

- `default`: renders inputs linked through steps-to-inputs relation.
- `find`: data-fetch wrapper for querying steps.
- `admin-form`: admin create/edit form for step fields.
- `admin-select-input`: admin select input for choosing a step.
- `admin-table`: admin table listing steps.
- `admin-table-row`: admin row showing step fields.
