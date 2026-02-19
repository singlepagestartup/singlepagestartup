# RBAC Action Model

## Purpose

Actions represent time-bound authorizations or events associated with a subject.

Typical RBAC usages:

- temporary authentication actions (password reset, OAuth state/exchange),
- subject-scoped system events that must expire or be consumed once.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `expiresAt`: expiration timestamp.
- `payload`: JSON payload for the action (typed by `payload.type`).

Common payload types in authentication flows:

- `oauth-state`: provider/start-flow state before callback.
- `oauth-exchange`: one-time exchange code mapped to `subjectId` after callback.

## Variants

- `default`: placeholder action view.
- `find`: data-fetch wrapper for querying actions.
- `admin-form`: admin create/edit form for action payload and expiry.
- `admin-select-input`: admin select input for choosing an action.
- `admin-table`: admin table listing actions.
- `admin-table-row`: admin row showing action fields.
