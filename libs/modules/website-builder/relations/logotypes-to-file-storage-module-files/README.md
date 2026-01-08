# Website Builder Logotypes To File Storage Module Files Relation

## Purpose

Attaches file storage assets to logotypes.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant/style.
- `orderIndex`: ordering index for the relation.
- `className`: custom CSS classes.
- `logotypeId`: related model reference.
- `fileStorageModuleFileId`: related model reference.

## Variants

- `default`: renders the related target model for this link.
- `find`: data-fetch wrapper for querying relations.
- `admin-select-input`: admin UI select input for linking relations.
- `admin-table-row`: admin UI row for relation listings.
- `admin-form`: admin UI create/edit form.
- `admin-table`: admin UI table for browsing relations.
