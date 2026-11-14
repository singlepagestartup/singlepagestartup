# Ecommerce Orders to Products Relation

## Purpose

Links orders to products, including quantity information.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `quantity`: quantity of the product in the order, a whole number of at least 1. The subject cart routes accept up to 1,000,000 units per line by default. Set `ECOMMERCE_ORDER_LINE_MAX_QUANTITY` in `apps/api/.env` for local development or `tools/deployer/.env` for deployment. Use a whole number from 1 to 2,147,483,647. Restart the API with the updated environment and reload the cart. Its `cartDetails.maxLineQuantity` field supplies the limit to the browser.
- `className`: optional CSS class name.
- `orderId`: linked order ID.
- `productId`: linked product ID.

## Prices and API reads

The CRUD routes return the stored relation, including `orderId`, `productId` and `quantity`. The `getTotal` service calculates prices per currency. Its `IOrderLineTotals` result has `totals` and `unpriced`; neither is a database column. The dedicated `GET /api/ecommerce/orders-to-products/{id}/total` returns `{ data: totals, unpriced }`. The cart reads a different response from the Subject route: each owned line includes `total`, an array of amounts per currency.

## Variants

- `default`: renders the related product using its frontend variant.
- `amount`: placeholder variant for order-product amount views.
- `form-field-default`: writes relation data into a form field. Use `dataSource="props"` for a line already loaded through the Subject.
- `id-total-default`: fetches total amounts for this relation id.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
