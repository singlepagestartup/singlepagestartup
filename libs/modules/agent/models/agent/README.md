# Agent Model

## Purpose

Agents define automated jobs (cron-like tasks) with a title, interval, and
configuration metadata used by the automation layer.

## Fields

- `title`: agent title.
- `adminTitle`: title shown in admin interface.
- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant/style.
- `slug`: URL-friendly unique identifier.
- `interval`: execution interval string for scheduled runs.

## Variants

- `default`: placeholder runtime variant (no rendering logic yet).
- `find`: data-fetch wrapper for querying agents.
- `admin-select-input`: admin UI select input for linking agents.
- `admin-table-row`: admin UI row for agent listings.
- `admin-form`: admin UI create/edit form.
- `admin-table`: admin UI table for browsing agents.
