# CRM Request Model

## Purpose

Requests store submitted form payloads for CRM processing.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `payload`: submitted request payload (JSON).

## Variants

- `default`: placeholder request view.
- `find`: data-fetch wrapper for querying requests.
- `admin-form`: admin create/edit form for request payload.
- `admin-select-input`: admin select input for choosing a request.
- `admin-table`: admin table listing requests.
- `admin-table-row`: admin row showing request fields.
