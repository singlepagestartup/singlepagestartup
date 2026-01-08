# CRM Steps to Inputs Relation

## Purpose

Links form steps to input fields and controls their order.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `orderIndex`: ordering index for display.
- `variant`: display variant.
- `className`: optional CSS class name.
- `stepId`: linked step ID.
- `inputId`: linked input ID.

## Variants

- `default`: renders the related input using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
