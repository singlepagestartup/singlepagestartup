# Billing Currency Model

## Purpose

Currencies define symbols, titles, and default settings used across billing flows.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `isDefault`: marks the default currency.
- `symbol`: currency symbol.
- `title`: display title.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.
- `minorUnitDigits`: optional configured decimal precision, from zero to eight.

The public SDK model exports `currencyPrecision(currency)`. It accepts a slug
or a record with `slug` and optional `minorUnitDigits`. Unconfigured currencies
use two decimal places; Telegram Stars use zero. A provider may support fewer
places than the currency configuration and rejects an unrepresentable amount.

## Variants

- `default`: renders the currency symbol in a simple block.
- `symbol`: symbol-only display (same output as default).
- `toggle-group-default`: toggle-group selector for choosing a currency by symbol.
- `find`: data-fetch wrapper for querying currencies.
- `admin-form`: admin create/edit form for currency fields.
- `admin-select-input`: admin select input for choosing a currency.
- `admin-table`: admin table listing currencies.
- `admin-table-row`: admin row showing title, symbol, slug, and variant.
