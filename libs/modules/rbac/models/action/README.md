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
- `consumedAt`: single-use mark. A column rather than a payload key, so a conditional update can claim the row in one write.

## Consume API

- `POST /rbac/actions/{id}/consume`: claim a row in a single conditional write. The body carries the patch and the predicate, for example `{"data":{"consumedAt":"…"},"filters":{"and":[{"column":"consumedAt","method":"isNull"}]}}`. The row is updated only while it still matches, so a caller that must act once cannot be raced into acting twice. It answers `data: null` when nothing matched, which is the caller's signal that the row was already consumed.
- The route is reached with `X-RBAC-SECRET-KEY`, like every other action call, and is not on the no-auth allow-list.

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
