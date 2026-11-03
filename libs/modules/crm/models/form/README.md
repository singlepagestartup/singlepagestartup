# CRM Form Model

## Purpose

Forms define multi-step CRM data collection flows with localized metadata.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `title`: localized title.
- `subtitle`: localized subtitle.
- `description`: localized rich description.
- `className`: optional CSS class name.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.

## Variants

- `support-ai-chat`: uses the shared SPS `default` wrapper with the CRM SDK Provider and client/server APIs. `isServer` selects the reader, which loads the Form by `data.id` and forwards `apiProps`. The renderer receives the loaded record, applies its `className`, and displays topic, details and desired-result fields with errors and a submit-control slot. RBAC owns values, validation and submission. Website Builder Help owns the surrounding card and heading; Host supplies the RBAC form through its children.

- `default`: wrapper that renders child form content.
- `find`: data-fetch wrapper for querying forms.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing a form.
- `admin-table`: admin table listing forms.
- `admin-table-row`: admin row showing form fields.
