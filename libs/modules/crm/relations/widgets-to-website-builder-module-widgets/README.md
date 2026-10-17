# CRM Widgets to Website Builder Widgets Relation

## Purpose

Links an exact CRM Widget to an exact Website Builder Widget for reusable presentation. The CRM owner reads links by widgetId and loads the target by websiteBuilderModuleWidgetId; variant selects its renderer.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `orderIndex`: ordering index for display.
- `variant`: display variant.
- `className`: optional CSS class name.
- `widgetId`: linked widget ID.
- `websiteBuilderModuleWidgetId`: linked Website Builder Widget ID.

## Variants

- `default`: renders the linked Website Builder Widget using its saved frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
