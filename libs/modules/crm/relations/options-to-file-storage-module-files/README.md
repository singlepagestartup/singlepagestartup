# CRM Options to File Storage Module Files Relation

## Purpose

Links options to uploaded files (icons or media previews).

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `orderIndex`: ordering index for display.
- `variant`: display variant.
- `className`: optional CSS class name.
- `optionId`: linked option ID.
- `fileStorageModuleFileId`: linked file ID.

## Variants

- `default`: renders the related file using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
