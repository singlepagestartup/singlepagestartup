# Ecommerce Order Model

## Purpose

Orders store cart and checkout information, including status and metadata.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `status`: order status (default: `new`).
- `type`: order type (default: `cart`).
- `receipt`: receipt reference string.
- `comment`: optional comment.

## Variants

- `default`: order card wrapper with header and child content.
- `cart-default`: cart layout showing products, quantities, and totals.
- `orders-to-products-quantity-default`: renders quantities from order-product relations.
- `purchase-ai-chat`: purchase history row. The shared record reader loads the
  Order; local `client.tsx`/`server.tsx` readers load SDK totals and pass typed
  results to the view. A failed total read leaves the Order visible.
- `form-field-default`: writes order data into a form field.
- `create`: client action to create a cart/order.
- `delete`: client action to delete an order.
- `find`: data-fetch wrapper for querying orders.
- `admin-form`: admin create/edit form for order fields.
- `admin-select-input`: admin select input for choosing an order.
- `admin-table`: admin table listing orders.
- `admin-table-row`: admin row showing order fields.

## Total cache and realtime

`GET /api/ecommerce/orders/:id/total` calculates totals from order-product
quantities, product price attributes and billing currencies. Its SDK query
subscribes to the contributing collection topics. The shared topic rule in
`libs/shared/utils/src/lib/topics/singlepage.ts` uses the same dependencies for
HTTP-cache generations, so a refetch after a quantity, price, relation or
currency mutation reads a fresh aggregate response. Additional aggregate
inputs must be covered in both the query and the backend topic rule.
