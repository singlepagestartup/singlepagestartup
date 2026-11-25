# Ecommerce Module

## 1. Purpose of the Module

The Ecommerce module manages product catalogs, stores, orders, and shopping cart workflows. It defines product metadata, attributes, categories, and the relations that connect ecommerce data to billing, media, and website-builder content.

## Layering Boundary

- Ecommerce provides reusable domain models/relations and UI primitives for product/order/cart data.
- Purchasing scenarios belong to public RBAC Widget variants; RBAC Subject owns the current session, private cart queries and purchase actions (`rbac > ecommerce`).
- Product data, entity presentation and commercial calculations remain Ecommerce capabilities. Host contains no parallel Ecommerce Product/Order/Widget registries.
- Ecommerce must not import RBAC subject implementation code (no reverse dependency from ecommerce to rbac).

Order constructs its payment service with the reservation operations from
Orders-to-Billing-Module-Payment-Intents. RBAC Subject uses that service for
checkout, provider callbacks and payment checks. The saved allocation links
the verified payment to the order lines and offers whose stock it settles.

The offer catalog reads links through the scoped Offers-to-Offers service.
Link writes validate persisted Offers through the Offer repository under the
existing transaction and locks. A project with a custom Offer visibility
rule can supply a reader to `createOfferLinksBootstrap` and override the
Offers-to-Offers owner in its API assembly. The reader can defer to the
effective Offer service when `find` is called.

### It solves the following tasks:

- Stores product, category, and store metadata.
- Tracks orders and cart state with quantities.
- Defines flexible attributes and attribute keys.
- Connects products and orders to billing currencies and payment intents.
- Attaches files and website-builder widgets to ecommerce content.

### Typical use cases:

- Building product listings and product detail pages.
- Managing cart and order flows.
- Associating prices with currencies.
- Embedding ecommerce widgets in pages.
- Managing store-specific catalogs and attributes.

---

## 2. Models

| Model                                             | Purpose                                    |
| ------------------------------------------------- | ------------------------------------------ |
| [attribute](./models/attribute/README.md)         | Typed attribute values for products/stores |
| [attribute-key](./models/attribute-key/README.md) | Attribute definitions and display metadata |
| [category](./models/category/README.md)           | Product categories with localized content  |
| [order](./models/order/README.md)                 | Orders and cart state                      |
| [product](./models/product/README.md)             | Products with attributes and media         |
| [store](./models/store/README.md)                 | Stores and their catalogs                  |
| [widget](./models/widget/README.md)               | Ecommerce list/overview widgets            |

---

## 3. Relations

| Relation                                                                                                           | Purpose                                |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| [attribute-keys-to-attributes](./relations/attribute-keys-to-attributes/README.md)                                 | Link attribute keys to attributes      |
| [attributes-to-billing-module-currencies](./relations/attributes-to-billing-module-currencies/README.md)           | Link attributes to currencies          |
| [categories-to-file-storage-module-files](./relations/categories-to-file-storage-module-files/README.md)           | Attach files to categories             |
| [categories-to-products](./relations/categories-to-products/README.md)                                             | Assign products to categories          |
| [categories-to-website-builder-module-widgets](./relations/categories-to-website-builder-module-widgets/README.md) | Attach widgets to categories           |
| [orders-to-billing-module-currencies](./relations/orders-to-billing-module-currencies/README.md)                   | Link orders to currencies              |
| [orders-to-billing-module-payment-intents](./relations/orders-to-billing-module-payment-intents/README.md)         | Link orders to payment intents         |
| [orders-to-file-storage-module-files](./relations/orders-to-file-storage-module-files/README.md)                   | Attach files to orders                 |
| [orders-to-products](./relations/orders-to-products/README.md)                                                     | Link orders to products with quantity  |
| [products-to-attributes](./relations/products-to-attributes/README.md)                                             | Link products to attributes            |
| [products-to-file-storage-module-files](./relations/products-to-file-storage-module-files/README.md)               | Attach files to products               |
| [products-to-website-builder-module-widgets](./relations/products-to-website-builder-module-widgets/README.md)     | Attach widgets to products             |
| [stores-to-attributes](./relations/stores-to-attributes/README.md)                                                 | Link stores to attributes              |
| [stores-to-orders](./relations/stores-to-orders/README.md)                                                         | Link stores to orders                  |
| [stores-to-products](./relations/stores-to-products/README.md)                                                     | Link stores to products                |
| [offers-to-offers](./relations/offers-to-offers/README.md)                                                         | Link offers to services and providers  |
| [stores-to-products-to-attributes](./relations/stores-to-products-to-attributes/README.md)                         | Link store-product pairs to attributes |
| [widgets-to-categories](./relations/widgets-to-categories/README.md)                                               | Curate categories inside widgets       |
| [widgets-to-products](./relations/widgets-to-products/README.md)                                                   | Curate products inside widgets         |
| [widgets-to-stores](./relations/widgets-to-stores/README.md)                                                       | Curate stores inside widgets           |

## Legacy order receipts

Before deploying over an installation that generated public receipts, back up
its database and public storage. From `apps/api`, run
`bun src/db/order-receipts.ts --list` to inventory receipt file IDs. Run
`bun src/db/order-receipts.ts <file-id>` to check ownership, size, and SHA-256
without writing. With the old receipt generator disabled, add `--apply` to
save the verified private copy, withdraw the old file, and publish the private
receipt for the confirmed buyer. Retrying a linked receipt uses the same copy.

Review results marked `quarantined` before granting any buyer access. The
command can withdraw local files and old direct URLs from the configured S3
bucket. Retire objects from other providers and purge any external CDN copies
using that deployment's storage and CDN controls. After cutover, check that the
exact prior URL returns 403, 404, or 410 through every configured public origin
and CDN. Verify the buyer can open the protected receipt and a different
account cannot read its GET or HEAD endpoint.
