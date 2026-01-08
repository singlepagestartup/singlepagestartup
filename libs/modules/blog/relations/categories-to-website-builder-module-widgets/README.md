# Blog Categories to Website Builder Module Widgets Relation

## Purpose

Links categories to website-builder widgets for embedding content blocks within category views.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `className`: optional CSS class name.
- `categoryId`: linked category ID.
- `websiteBuilderModuleWidgetId`: linked website-builder widget ID.

## Variants

- `default`: renders the related website-builder widget using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
