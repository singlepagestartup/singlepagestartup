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
- `subscriptionPeriodStartsAt`, `subscriptionPeriodEndsAt`: nullable fixed
  subscription delivery interval.
- `subscriptionPeriodInvoiceId`: nullable accepted paid Invoice anchor.
- `subscriptionRevokedAt`: nullable server time of explicit Role revocation;
  ordinary updates cannot set or clear it.

## Subscription delivery period

RBAC order proceed calls the internal `acceptSubscriptionPeriod` capability
after checking the current Subject's ownership and product Role grants. The
Order service reads the configured interval and its own paid Invoices. It
accepts the latest Invoice by immutable `createdAt`, then ID, using one
conditional write for the complete period. A replay or competing retry cannot
extend the same Invoice twice. The first period starts at confirmation;
renewal extends the end by one interval from the later of confirmation and
the previous end. An early renewal preserves the start of continuous paid
coverage; a late renewal starts a new covered span at confirmation.

Generic create/update cannot change period fields. Unchanged fields in existing
full-record update payloads are removed before writing. An OPEN Invoice and an
unrelated Order update do not change the deadline. Access expires at
`now >= subscriptionPeriodEndsAt`; requested cancellation keeps the original
deadline. Explicit Role deletion stamps `subscriptionRevokedAt` on affected
owned subscription Orders. Proceed, repeated paid transitions, recreated Roles
and automatic renewal cannot restore those Orders.

Extended Order reads preserve existing payment terms when a Product's prices
or offered currencies change. The read uses the Order's matching-currency paid
Invoice amount and its Payment Intent's saved subscription interval. Commerce
Product type still selects delivery: a Telegram `one_off` payment transport can
settle a subscription while retaining its saved interval. The latest
paid Invoice wins by creation time, then ID; an accepted period anchor must
still belong to that paid context. The read never rewrites the accepted period.
A sole unpaid Invoice remains visible with its saved amount and interval, while
its unpaid status and missing entitlement stay unchanged. Missing anchors,
conflicting payment currencies and ambiguous Invoice contexts require
reconciliation rather than an arbitrary fallback.

An unbilled new cart uses current Product prices. If its previously selected
currency is no longer offered, its extended read can show the saved
Order-to-Currency amount. This keeps an old cart inspectable; the checkout
attributes command still requires a current Product price in that currency.
The internal initial-Free zero one-off settlement retains its Product's
subscription delivery contract. No retired price is added to the public catalog
or new checkout through this read compatibility.

Natural recurring expiry removes its grant through the internal fulfillment
operation and sets `status=expired`, retaining its paid Invoice anchor. A later
newer paid Invoice can reactivate that same unrevoked Order for a full interval.
Role changes, credits and period acceptance share one transaction with Subject
and Order locks; failure leaves the paid Order retryable. Notifications and
automatic follow-up checkout run after commit. Urgent paid/cleanup work precedes
the bounded recurring scan, which rotates by ID without changing delivery dates.

Legacy delivering orders require the operator-only Subject freeze operation.
It checks exact ownership, current product Roles and the expected previous
`updatedAt`, then calls `freezeSubscriptionPeriod`. The server preserves the
old delivery start and calendar interval; it does not accept caller-supplied
period timestamps. Missing grants, unpaid or ambiguous invoice context and
concurrent changes require data reconciliation. Repeating a completed freeze
does not change the period.

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

## Cart detail capability

The backend Service exposes findByIdCartDetails for a caller that has already
established Order access. It loads the Order's lines, only their referenced
Products and totals through existing services. It does not establish a Subject
or bypass caller authorization. The RBAC Subject order-list endpoint supplies
ownership scope and a consistent read snapshot before invoking this capability.
The SDK model exports ICartDetails; no database field or migration is needed.

## Payment success extension

The payment check handler calls protected `onPaymentSucceeded({ order })` before persisting `paid`. The default hook does nothing. Projects extend the Startup handler for domain effects, using idempotent SDK operations: a failed hook leaves the order retryable. Keep payment confirmation independent of notification delivery.

Runtime SDK create calls generate IDs. For partial retries, find an existing side effect by a stable unique key, such as a slug, and use the returned ID in relations. Include all required relation fields when updating a link.
