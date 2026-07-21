# RBAC Identity Model

## Purpose

Identities store authentication credentials and account identifiers.

## Fields

- `id`: unique identifier (UUID).
- `password`: hashed password.
- `salt`: password salt.
- `account`: external provider account identifier (used for OAuth providers, e.g. Google `sub`).
- `email`: email address.
- `provider`: auth provider (`email_and_password`, `oauth_google`, `ethereum_virtual_machine`, etc.).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `code`: verification/reset code.

## Natural keys

- `telegram` and `oauth_google`: exact non-null `account` per provider.
- `ethereum_virtual_machine`: case-insensitive non-null `account`.
- `email_and_password` and `email`: case-insensitive non-null `email` per
  provider.

These are partial unique indexes, so providers keep their own identifier
semantics and incomplete rows are not incorrectly grouped together.

## Variants

- `default`: renders the identity email for email/password provider.
- `create-by-email`: create identity by email form.
- `form-field-default`: writes identity data into a form field.
- `find`: data-fetch wrapper for querying identities.
- `admin-form`: admin create/edit form for identity fields.
- `admin-select-input`: admin select input for choosing an identity.
- `admin-table`: admin table listing identities.
- `admin-table-row`: admin row showing identity fields.
