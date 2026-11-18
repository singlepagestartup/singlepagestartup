# Ecommerce Product Model

## Purpose

Products represent sellable items with localized content, attributes, and media attachments.

A Product’s `kind` is an extensible text classification. Built-in behavior recognizes `physical`, `digital` and `service`; projects can also store values such as `tax` or `commission` and implement their behavior in the Startup layer. Its `type` selects one-time or subscription billing. Available delivery methods and add-ons come from the selected store offer.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `kind`: nonempty product classification (default: `physical`). Both admin forms accept custom values.
- `type`: product type (default: `one_off`).
- `slug`: URL-friendly unique identifier.
- `title`: localized title.
- `shortDescription`: localized short description.
- `description`: localized long description.
- `adminTitle`: title used in admin UI.

## Variants

- `default`: product card with media, attributes, and short description.
- `overview-default`: detailed product overview with media and attributes.
- `price-default`: reads Product price attributes for `billingModuleCurrencyId`. When `calculatedPrice` is supplied, presents that amount, currency, status and issues exclusively, including unavailable or pending results. Store `product-price-default` supplies this calculated result; Product does not read incoming Store relations.
- `cart-default`: compact product row with the first ordered default media, product link and slots for cart actions. The owning RBAC cart supplies quantities and authorized order totals.
- `currency-toggle-group-default`: currency selector based on price attributes.
- `find`: data-fetch wrapper for querying products.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing a product.
- `admin-table`: admin table listing products.
- `admin-table-row`: admin row showing product fields.

## SEO metadata and publication

`metadata` is a JSONB object, default `{}`. Its optional `seo` section contains
localized `title`, `description` and `keywords`; other named JSON sections are
preserved. Example:

```json
{ "seo": { "title": { "ru": "Заголовок" }, "keywords": { "ru": ["тема", "категория"] } }, "campaign": { "name": "spring" } }
```

Known SEO fields are validated; the full object is limited to 64 KiB and ten
levels of nesting. Arbitrary JSON sections are public model data: do not store
secrets here. Prices, permissions, relations and publication state retain their
own fields. Host masks may read only the allowlisted SEO paths. A missing locale
does not fall back to another language.

Both admin forms provide localized fields and an advanced JSON editor. Updates
send the entire preserved object plus `_expectedMetadata` containing the previous
object. The API performs an atomic compare-and-update and returns 409 if another
editor changed it. Reload before retrying. API/SDK/MCP callers should read the
current object, merge their intended section and supply `_expectedMetadata`;
updates without this guard retain the ordinary full-field replacement behavior.

The `hidden` variant makes a primary public route return 404 and removes the
record from public lists/counts and sitemap. Admin access remains subject to
RBAC. Changing presentation variants does not rename saved values.
