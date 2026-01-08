# CRM Input Model

## Purpose

Inputs describe individual fields used inside CRM forms, including their type and localized labels.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `type`: input type identifier.
- `isRequired`: required flag.
- `title`: localized title.
- `subtitle`: localized subtitle.
- `description`: localized description.
- `className`: optional CSS class name.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.
- `placeholder`: localized placeholder.
- `label`: localized label.

## Variants

- `default`: placeholder input view.
- `text-default`: renders a text input and maps field values into the form state.
- `textarea-default`: renders a textarea input bound to the form state.
- `select-option-default`: renders a select input using option records.
- `find`: data-fetch wrapper for querying inputs.
- `admin-form`: admin create/edit form for input settings.
- `admin-select-input`: admin select input for choosing an input.
- `admin-table`: admin table listing inputs.
- `admin-table-row`: admin row showing input fields.
