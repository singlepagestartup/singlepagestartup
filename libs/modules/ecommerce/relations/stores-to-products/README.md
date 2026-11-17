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

Service options include `pricePreview` in the requested currency. A fixed preview gives the exact charge. A variable preview gives a starting amount for the current merchandise quantity, package and applicable rate. The server publishes it when the tariff inputs establish a lower bound and a valid selection attains that amount. With insufficient inputs, the cart shows “Calculated” until an exact charge is available. Selecting a service displays its actual server charge beside its name and adds it to the itemized receipt.

A shipping option includes its tariff basis. For a fixed tariff, the quote also gives its charge in the requested currency before an address is entered. A distance tariff uses the verified road distance in the selected delivery charge. Other formulas can depend on product quantity, value or packaging. The offer’s configured regions describe its delivery area. An empty list leaves coverage unspecified.

Offer settings hold the delivery method, regions, pickup point identifiers, origin, quote lifetime and package list. Each package has a count per unit and outside dimensions in centimetres, with gross weight in kilograms. Missing inputs disable the affected tariff. Set `DELIVERY_ROUTING_PROVIDER` on the API and supply the adapter credential (`GEOAPIFY_API_KEY` for Geoapify). A project can override `resolveDeliveryRouting()` in the relation’s `startup` service. Pass its named adapter map to `deliveryRouting(adapters)` to select a provider from the same environment setting. Each adapter implements `geocode(address)` and `distance(origin, destination, profile)` and returns road distance in metres.

An offer with no `stock_quantity` link has unlimited stock. A present link supplies an integer from zero. Available stock is this quantity minus outstanding reservations. Carts display availability. Preparing an invoice reserves the items, successful settlement consumes them once, and a definitive cancellation releases the hold.

Adapters may also implement `suggestAddresses(query, language, regionIds, signal)`, returning `{ suggestions: string[], attribution?: { label, url }[] }`. The public `POST /api/ecommerce/stores-to-products/:uuid/address-suggestions` operation accepts a search string of 3–500 characters and a two-letter language code for a public shipping service offer. Its client and server SDK operation is `api.addressSuggestions`. An adapter with no autocomplete method returns an empty list and the address field accepts manual entry. The configured offer supplies the region restrictions. Geoapify uses its autocomplete endpoint and returns at most five formatted, distinct matching addresses with provider and data-source attribution.

SPS sends the search text in a POST body. Responses use `Cache-Control: private, no-store`. The client hook forwards cancellation, disables automatic retries and removes its query when the field unmounts. Render the returned attribution links near the suggestions: [Geoapify's terms](https://www.geoapify.com/terms-and-conditions/#attribution) require OpenStreetMap attribution and Geoapify attribution on the Free plan.

`api.quote` on both relation SDKs returns the component charges, amount, selectable services and currencies, availability, expiry and a version for confirmation. A quote with issues has a null amount. An explicitly free tariff returns zero. The private preview accepts quantity, currency, destination and selected service quantities.

The primary charge includes `unitAmount`, calculated by the server from the product formula for one unit in the selected currency. Quantity-dependent package inputs are recalculated for one unit. A formula that cannot price one unit returns `null`. Older stored quotes may omit this field. Clients show an older charge's amount as a unit price only when its quantity is one. Receipts use each charge's `amount` and the quote total. Display-only `unitAmount` is excluded from the quote version.

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
