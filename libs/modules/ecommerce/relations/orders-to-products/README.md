# Ecommerce Orders to Products Relation

## Purpose

Links orders to products, including quantity information.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `quantity`: quantity of the product in the order.
- `className`: optional CSS class name.
- `orderId`: linked order ID.
- `productId`: linked product ID.

## Variants

- `default`: renders the related product using its frontend variant.
- `amount`: placeholder variant for order-product amount views.
- `form-field-default`: writes relation data into a form field.
- `id-total-default`: fetches total amounts for this relation id.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
