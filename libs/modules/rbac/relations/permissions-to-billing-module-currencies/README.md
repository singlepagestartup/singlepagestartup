# RBAC Permissions to Ecommerce Module Orders Relation

## Purpose

Links permissions to ecommerce orders.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `className`: optional CSS class name.
- `permissionId`: linked permission ID.
- `ecommerceModuleOrderId`: linked order ID.

## Variants

- `default`: renders the related order using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
