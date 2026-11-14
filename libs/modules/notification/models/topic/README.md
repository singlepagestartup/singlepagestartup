# Notification Topic Model

## Purpose

Topics group notifications and define delivery types.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `title`: topic title.
- `type`: topic type (default: `info`).
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: placeholder topic view.
- `find`: data-fetch wrapper for querying topics.
- `admin-form`: admin create/edit form for topic fields.
- `admin-select-input`: admin select input for choosing a topic.
- `admin-table`: admin table listing topics.
- `admin-table-row`: admin row showing topic fields.

## Bounded delivery

`topic.sendBounded` creates or resumes a notification, ensures its Topic and
Template links exist, and delegates provider delivery to Notification. A failed
link prevents the provider call and leaves the notification retryable. Retries
share a stable ID and a three-attempt budget; an already sent notification is
not sent again. The caller retains its Broadcast lease throughout the operation.

Topic owns association orchestration. Notification owns its record updates,
provider limits and delivery. Templates store content; Host components render it.
