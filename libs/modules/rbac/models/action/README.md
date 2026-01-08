# RBAC Action Model

## Purpose

Actions represent time-bound authorizations or events associated with a subject.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `expiresAt`: expiration timestamp.
- `payload`: JSON payload for the action.

## Variants

- `default`: placeholder action view.
- `find`: data-fetch wrapper for querying actions.
- `admin-form`: admin create/edit form for action payload and expiry.
- `admin-select-input`: admin select input for choosing an action.
- `admin-table`: admin table listing actions.
- `admin-table-row`: admin row showing action fields.
