# Ecommerce Stores to Products Relation

## Purpose

Each record is a seller’s offer for one Product. The generated `sku` identifies the offer. `configurationKey` groups comparable offers for the same product configuration.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `className`: optional CSS class name.
- `storeId`: linked store ID.
- `productId`: linked product ID.

## Price, delivery and inventory

The offer owns its currency prices through `stores-to-products-to-attributes`. Use the `price` key and link the attribute to exactly one Billing currency. Each Product declares `price_formula` and `formula_version` through `products-to-attributes`. Store attributes supply named tariff coefficients. A basic item uses `unit_price * quantity`. A road delivery can use `dispatch_fee + rate_per_km * distance_km`. An assembly service can charge for `serviced_qty` or a percentage of `serviced_subtotal`.

Offer settings hold the delivery method, regions, pickup point identifiers, origin, quote lifetime and package list. Each package has a count per unit and outside dimensions in centimetres, with gross weight in kilograms. Missing inputs disable the affected tariff. Set `DELIVERY_ROUTING_PROVIDER` on the API and supply the adapter credential (`GEOAPIFY_API_KEY` for Geoapify). A project can override `resolveDeliveryRouting()` in the relation’s `startup` service. Pass its named adapter map to `deliveryRouting(adapters)` to select a provider from the same environment setting. Each adapter implements `geocode(address)` and `distance(origin, destination, profile)` and returns road distance in metres.

An offer with no `stock_quantity` link has unlimited stock. A present link supplies an integer from zero. Available stock is this quantity minus outstanding reservations. Carts display availability. Preparing an invoice reserves the items, successful settlement consumes them once, and a definitive cancellation releases the hold.

`api.quote` on both relation SDKs returns the component charges, amount, selectable services and currencies, availability, expiry and a version for confirmation. A quote with issues has a null amount. An explicitly free tariff returns zero. The private preview accepts quantity, currency, destination and selected service quantities.

The framework seed includes seller prices for five token packages and the Pro subscription. The historical `website` product’s 510 and 590 amounts lack currency links. Assign a currency-specific price to its offer before selling it.

Each token package and Pro also offers two optional demo services from Single Page Shop: accelerated electronic account credit for 20 RUB or 0.25 USD, and AI chat setup for 50 RUB or 0.60 USD per selected unit. Standard token credit remains included in the product price. These demo services do not perform external fulfillment. Their service Products use one-time billing, their offer links charge only the first subscription cycle, and neither needs a postal address. Both prices are available for each service; the main offer still determines which currencies the complete selection supports.

The demo services use the existing store, currency and attribute-key seeds. Their snapshots contain no Subject ownership records or local account references. Store owners can manage their offers through the catalogue; shared Product metadata remains subject to the Product ownership rules.

## Variants

- `provider` records identify the fulfillment store for a linked service.
- `default`: renders the related product using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
