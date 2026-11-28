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

For a commissioned service, the seller can choose **After accepting the result** in the offer editor and configure an individual-service CRM funnel for that offer. The offer stores this choice in `settings.requiresResultAcceptance`. The cart opens the order discussion while the work is in progress. Once the buyer accepts a version, checkout uses its agreed price and currency. Other offers keep their usual checkout terms.

An offer with `settings.workTokenPricing` uses a customer-funded individual-service funnel. Its currency and multiplier must match the paid stages. The customer approves the rate in chat and pays from their Token balance as the agent works. Acceptance releases the original. `settings.closedForNewOrders` excludes an older offer from retail selection and keeps it available to existing orders. Set `settings.fullTextDraftPreview` on a retired offer when its existing buyers may read the full text of their generated PDF drafts before acceptance. The original file follows the settlement terms of each order.

In the seller workspace, open **Products → Edit → Details and prices → Store offer**, select the SKU and edit the price for its currency. For a service paid entirely from wallet tokens as work runs, set that offer price to zero in the wallet currency. Enabling usage billing also requires setting `settings.workTokenPricing` on the offer through the Stores to Products SDK or seed. The seller and Admin v2 offer forms currently have no field for this setting. Use the wallet currency ID and the customer multiplier, for example `{"currencyId":"<wallet currency UUID>","multiplier":"2"}`. In the CRM funnel bound to that offer, set the same customer multiplier under each paid stage's **Payment** section. The Framework brief uses a PDF result stage with `resultPricing.kind` set to `work-tokens` and completes when the buyer accepts the result.

The Framework service catalog and purchase page read the rates for the selected store, product and offer through Subject customer-work availability. Each rate uses the stage model's provider price in USD per million tokens, the wallet tokens per USD from the reference top-up pack and the offer's multiplier. Dividing their product by one million gives wallet tokens per model token. Input, output and supported cache operations have separate rates. The same calculation supplies the approval message in the order chat.

The relation service assembles quote and address-suggestion data through injected CRUD readers. The reservation service supplies held quantities. Catalog traversal, attribute grouping and quote rules belong to services; the repository provides ordinary persistence. The bootstrap composes these services without initializing their REST apps.

The offer owns its currency prices through `stores-to-products-to-attributes`. Use the `price` key and link the attribute to exactly one Billing currency. Each Product declares `price_formula` and `formula_version` through `products-to-attributes`. Store attributes supply named tariff coefficients. A basic item uses `unit_price * quantity`. A road delivery can use `dispatch_fee + rate_per_km * distance_km`. An assembly service can charge for `serviced_qty` or a percentage of `serviced_subtotal`.

Delivery and add-on options belong to the Product. The quote reads links attached to any offer for the same Product, including archived source offers, and returns the same contractor choices across sellers. Active service targets remain subject to their stock, currency, provider and region rules. Offers with the same contractor, service configuration and tariff share one option with `compatibleOfferIds`. Distinct contractors, configurations or tariffs give the buyer separate choices. Existing selections keep their exact accepted service offer IDs when the main seller changes.

Service options include `pricePreview` in the requested currency. A fixed preview gives the exact charge. A variable preview gives a starting amount for the current merchandise quantity, package and applicable rate. The server publishes it when the tariff inputs establish a lower bound and a valid selection attains that amount. With insufficient inputs, the cart shows “Calculated” until an exact charge is available. Selecting a service displays its actual server charge beside its name and adds it to the itemized receipt.

A shipping option includes its tariff basis. For a fixed tariff, the quote also gives its charge in the requested currency before an address is entered. A distance tariff uses the verified road distance in the selected delivery charge. Other formulas can depend on product quantity, value or packaging. The offer’s configured regions describe its delivery area. An empty list leaves coverage unspecified.

For store pickup, the buyer collects the order at the store selected for the primary product. Changing the seller changes the collection store. A pickup quote requires no destination address.

Offer settings hold the delivery method, regions, origin, quote lifetime and package list. Each package has a count per unit and outside dimensions in centimetres, with gross weight in kilograms. Missing inputs disable the affected tariff. Set `DELIVERY_ROUTING_PROVIDER` on the API and supply the adapter credential (`GEOAPIFY_API_KEY` for Geoapify). A project can override `resolveDeliveryRouting()` in the relation’s `startup` service. Pass its named adapter map to `deliveryRouting(adapters)` to select a provider from the same environment setting. Each adapter implements `geocode(address)` and `distance(origin, destination, profile)` and returns road distance in metres.

An offer with no `stock_quantity` link has unlimited stock. A present link supplies an integer from zero. Available stock is this quantity minus outstanding reservations. Carts display availability. Preparing an invoice reserves the items, successful settlement consumes them once, and a definitive cancellation releases the hold.

Adapters may also implement `suggestAddresses(query, language, regionIds, signal)`, returning `{ suggestions: string[], attribution?: { label, url }[] }`. The public `POST /api/ecommerce/stores-to-products/:uuid/address-suggestions` operation accepts a search string of 3–500 characters and a two-letter language code for a public shipping service offer. Its client and server SDK operation is `api.addressSuggestions`. An adapter with no autocomplete method returns an empty list and the address field accepts manual entry. The configured offer supplies the region restrictions. Geoapify uses its autocomplete endpoint and returns at most five formatted, distinct matching addresses with provider and data-source attribution.

The RBAC Subject checkout's `DeliveryAddress` component calls this SDK operation
after the buyer types at least three characters and pauses for 300 ms. It passes
the selected shipping service's `stores-to-products.id`. Selecting a suggestion
updates the checkout's address field; manual entry remains available. The quote
service geocodes the submitted address when the tariff needs regional coverage
or road distance, and checks any configured region restrictions. The suggestion
operation only returns address text and attribution. Checkout saves the buyer's
completed selection through its separate Subject operation.

SPS sends the search text in a POST body. Responses use `Cache-Control: private, no-store`. The client hook forwards cancellation, disables automatic retries and removes its query when the field unmounts. Render the returned attribution links near the suggestions: [Geoapify's terms](https://www.geoapify.com/terms-and-conditions/#attribution) require OpenStreetMap attribution and Geoapify attribution on the Free plan.

Quote and address-suggestion POSTs are read operations. Their JSON bodies keep
addresses out of request URLs and support a quote's service selections. The
handlers set `READ_ONLY_OPERATION_CONTEXT_KEY` so HTTP mutation middleware does
not broadcast changes, invoke observer pipelines or store a mutation action.
Both handlers still validate the request and execute their services. Actual
cart changes belong to the Subject operations; database Consistency continues
to track committed writes independently of this HTTP classification.

`api.quote` on both relation SDKs returns the component charges, amount, selectable services and currencies, availability, expiry and a version for confirmation. A quote with issues has a null amount. An explicitly free tariff returns zero. The private preview accepts quantity, currency, destination and selected service quantities. `selectedServices` returns the authoritative choices even when a missing shipping address prevents a charge. With no explicit fulfillment choice, the server selects the cheapest available method in the requested currency. It compares exact charges when their inputs are available and verified starting amounts while a shipping address is missing. A method without a verified amount ranks after priced choices. An explicit valid choice stays selected.

A configured fulfillment method must be selected, including a sole paid method. A shipping tariff that requires an address stays incomplete until the buyer provides one. A product with no delivery links uses its normal fulfillment without an extra charge. Configured methods that are all out of stock, outside their service area, invalid or unavailable in the selected currency block purchase. A selected out-of-area method remains in the options so the buyer can correct its address.

For a later subscription period, the owning Order verifies the paid source invoice and immutable purchase snapshots, including earlier periods when necessary. A paid first-only fulfillment does not recur. The private `fulfilledLineIds` service option carries this result through totals, quote batches and locked validation. The read-only response field `fulfillmentAlreadySatisfied` tells the client that this period needs no new fulfillment choice. The server derives this field from the order. Ordinary carts require their configured fulfillment.

The primary charge includes `unitAmount`, calculated by the server from the product formula for one unit in the selected currency. Quantity-dependent package inputs are recalculated for one unit. A formula that cannot price one unit returns `null`. Older stored quotes may omit this field. Clients show an older charge's amount as a unit price only when its quantity is one. Receipts use each charge's `amount` and the quote total. Display-only `unitAmount` is excluded from the quote version.

The framework seed includes seller prices for five token packages and the Pro subscription. The historical `website` product’s 510 and 590 amounts lack currency links. Assign a currency-specific price to its offer before selling it.

Each token package and Pro also offers two demo services from Single Page Shop. Accelerated electronic account credit costs 20 RUB or 0.25 USD. AI chat setup costs 50 RUB or 0.60 USD per selected unit. Accelerated credit is the configured fulfillment choice and its charge is included in the complete selection; AI chat setup is optional. These demo services do not perform external fulfillment. Their service Products use one-time billing, their offer links charge only the first subscription cycle, and neither needs a postal address. Both services accept either currency when the main offer supports it.

The demo services use the existing store, currency and attribute-key seeds. Their snapshots contain no Subject ownership records or local account references. Store owners can manage their offers through the catalogue; shared Product metadata remains subject to the Product ownership rules.

## Registration grants

An administrator can set `settings.initialGrant: true` on a Store–Product
association. During authentication the Subject creates one registration Order
per marked Store and Product. If two Stores issue the same Product, the buyer
receives two Orders, each with its own PaymentIntent and Invoice. Multiple
marked SKUs for the same Product in one Store count as one grant.

Registration uses the Product's zero-price attributes and their Billing
currencies. Subscriptions require a supported interval. Product top-up
attributes and role links determine the issued credits and access. Physical
Products need fulfillment and use the ordinary purchase flow. The registration
operation creates no stock reservation or shipping request.

Only an administrator or operator may enable or change this setting, edit a
configured Product's attributes or change its associations. Hidden offers do not
issue new grants. A saved registration Order records which Store issued the
Product. Re-enabling a grant at that Store preserves the original Order.
`initialGrantLegacyHistory: true` opts an internal Product into recognition of
its earlier private, zero-price bootstrap orders. Both flags require an
administrator. The standard Free association includes this migration setting;
leave it unset when ordinary purchases of a Product must remain separate from
registration grants. Recognition checks the single Product, Store, Currency and
zero settlement graph and preserves its saved IDs.

Export these associations with the normal dump and load them with the normal
seed; the relation's seed configuration remaps both endpoint IDs.

## Variants

- `provider` records identify the fulfillment store for a linked service.
- `default`: renders the related product using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
