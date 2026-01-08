# Ecommerce Stores to Products to Attributes Relation

## Purpose

Links store-product relations to attribute values for store-specific product attributes.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `className`: optional CSS class name.
- `storesToProductsId`: linked store-product relation ID.
- `attributeId`: linked attribute ID.

## Variants

- `default`: renders the related attribute using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
