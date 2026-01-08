# Ecommerce Product Model

## Purpose

Products represent sellable items with localized content, attributes, and media attachments.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `type`: product type (default: `one_off`).
- `slug`: URL-friendly unique identifier.
- `title`: localized title.
- `shortDescription`: localized short description.
- `description`: localized long description.
- `adminTitle`: title used in admin UI.

## Variants

- `default`: product card with media, attributes, and short description.
- `overview-default`: detailed product overview with media and attributes.
- `price-default`: renders price attributes for a selected currency.
- `cart-default`: compact product view for cart listings.
- `currency-toggle-group-default`: currency selector based on price attributes.
- `find`: data-fetch wrapper for querying products.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing a product.
- `admin-table`: admin table listing products.
- `admin-table-row`: admin row showing product fields.
