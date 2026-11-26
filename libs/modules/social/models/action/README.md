# Social Action Model

## Purpose

Actions represent time-bound social events or permissions.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `expiresAt`: expiration timestamp.
- `payload`: JSON payload.

## Variants

- `default`: placeholder action view.
- `ai-execution` records skill, Knowledge, and MCP tool activity, as well as
  the status of a customer’s reply in an order chat. RBAC validates the payload
  and links the action to the chat, thread, and replying profile. A
  `reply_generation` action stays visible during preparation retries. Delivery
  removes it. A terminal failure updates the same action and prompts the
  customer to send their message again.
- `find`: data-fetch wrapper for querying actions.
- `admin-form`: admin create/edit form for action payload and expiry.
- `admin-select-input`: admin select input for choosing an action.
- `admin-table`: admin table listing actions.
- `admin-table-row`: admin row showing action fields.
