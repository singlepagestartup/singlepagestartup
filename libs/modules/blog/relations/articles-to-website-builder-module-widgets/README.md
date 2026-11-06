# Blog Articles to Website Builder Module Widgets Relation

## Purpose

Links articles to website-builder widgets for embedding content blocks within articles.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `className`: optional CSS class name.
- `articleId`: linked article ID.
- `websiteBuilderModuleWidgetId`: linked website-builder widget ID.

## Variants

- `default`: renders the related website-builder widget using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.

## Client access example

The private variant renders the related Widget through its ordinary reader.
The RBAC Subject article composition checks the client's permission before
mounting these relation readers and shows the subscription view when denied.
The variant does not classify descendants or restrict their API/file delivery.
