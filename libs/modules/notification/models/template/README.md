# Notification Template Model

## Purpose

Templates define reusable message layouts for notifications.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `title`: template title.
- `content`: editable plain-text notification body for `content-email` and
  `content-telegram`. Other variants render through their existing components.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: placeholder template view.
- `find`: data-fetch wrapper for querying templates.
- `admin-form`: admin create/edit form for template fields.
- `admin-select-input`: admin select input for choosing a template.
- `admin-table`: admin table listing templates.
- `admin-table-row`: admin row showing template fields.

## Editable delivery templates

Create or edit templates in Admin v2 → Notification → Template. Choose
`content-email` or `content-telegram`, set Title (the email subject) and fill in
Notification content. The Settings page includes setup instructions and an
editable example for security summaries; it never seeds records automatically.

Content accepts scalar placeholders such as `{{project}}`, `{{start}}` and
`{{counts.password-failed}}`. The producing service supplies these values in
Notification `data`. Missing values, objects, inherited properties and prototype
paths fail validation. There are no expressions, includes, HTML execution or
network requests in this renderer. Both saved content and substituted data are
escaped; newlines become line breaks in email. Telegram uses escaped text with
HTML parse mode and rejects content over 4000 encoded characters, so one render
is one message. Source content is limited to 32000 characters.

Topic groups delivered notifications; it is linked through
`topics-to-notifications`. Each notification also links to its rendering
Template through `notifications-to-templates`. Topic does not directly own
templates. Producers select the template contract documented for their feature.

Apply the generated Template migration and Consistency Capture migration before
starting the new API. No existing template content is changed by this migration.
