# Metric Model

## Purpose

Metrics store analytic measurements with a title and numeric value.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant/style.
- `title`: metric title.
- `value`: numeric metric value.

## Variants

- `default`: placeholder runtime variant (no rendering logic yet).
- `find`: data-fetch wrapper for querying metrics.
- `admin-select-input`: admin UI select input for linking metrics.
- `admin-table-row`: admin UI row for metric listings.
- `admin-form`: admin UI create/edit form.
- `admin-table`: admin UI table for browsing metrics.
