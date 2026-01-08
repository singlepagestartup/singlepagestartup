# Telegram Widgets to External Widgets Relation

## Purpose

Links Telegram widgets to widgets from external modules (e.g., website-builder).

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `widgetId`: linked Telegram widget ID.
- `externalModule`: external module name.
- `externalWidgetId`: external widget ID.

## Variants

- `default`: renders the linked external widget using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
