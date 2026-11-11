# Notification Template Model

## Purpose

Templates define reusable message layouts for notifications.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `title`: template title.
- `content`: optional editable plain text with scalar placeholders. Host components
  receive the resolved text separately from the original notification data.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: placeholder template view.
- `find`: data-fetch wrapper for querying templates.
- `admin-form`: admin create/edit form for template fields.
- `admin-select-input`: admin select input for choosing a template.
- `admin-table`: admin table listing templates.
- `admin-table-row`: admin row showing template fields.

## Content, rendering and delivery

Template stores Title, optional Content and the selected Variant. Template service
substitutes scalar values in Content, then passes `{ variant, template: { title,
content }, data }` to Host. `data` keeps the original notification payload.
Notification receives the rendered result and handles delivery, rate limits and
retries. No HTML or Telegram markup is assembled by Template service.

Host renders email with React Email at `POST /api/email-generator/index.html`
and Telegram responses at `POST /api/telegram-generator`. Both routes require the
server's `X-RBAC-SECRET-KEY`; credentials stay on the server. POST keeps message
content out of query strings and avoids URL-length limits. Unknown variants and
invalid request payloads fail before transport. There is no GET fallback.

Create or edit templates in Admin v2 → Notification → Template. The default
`content-email` Host component displays Title and Content in a styled email;
`content-telegram` returns one escaped text message. Both require nonempty
Content. The Settings page supplies editable starter copy for security summaries
and never seeds records automatically.

Content accepts scalar placeholders such as `{{project}}`, `{{start}}` and
`{{counts.password-failed}}`. The producer supplies values in Notification `data`.
Missing values, objects, inherited properties and prototype paths fail validation.
There are no expressions, includes or executable code. Substitution produces plain
text: React escapes it when rendering email; the Telegram renderer escapes it for
HTML parse mode. Do not insert it with `dangerouslySetInnerHTML`. Source and
resolved content are limited to 32000 characters; the default Telegram variant
allows at most 4000 encoded characters.

## Project-specific presentation

Add an email component under
`apps/host/app/api/email-generator/index.html/component/startup/` and register it
in that layer's `variants.ts` and props union in `interface.ts`. Telegram variants
follow the existing `apps/host/app/api/telegram-generator/response/startup/` pattern.
Startup registrations override singlepage registrations with the same name.
A custom name must identify its channel with `email` or `telegram`, but not both.
`reset-password` retains its email channel.

Use the exported `IRenderRequest` type from Template SDK model for the rendering
input. `props.template.content` is resolved text, `props.template.title` is saved
Title and `props.data` is the event payload. Components can use Content, compose
React Email blocks from typed `data`, or combine both. Content remains optional
for component-driven templates. Add new variant names to the Template SDK model's
`variants` list to make them selectable in the admin form. A project can override
`content-email` to restyle all default content emails without changing saved rows.
Use React Email's Tailwind wrapper to compile email styles; browser page styles
are not automatically included in an email.

Topic groups delivered notifications through `topics-to-notifications`. Each
notification links to its Template through `notifications-to-templates`. Topic
does not directly own templates. Producers select the template slug and payload
contract documented for their feature. Bounded delivery accepts custom component
variants too, preserving the same attempt budget and one-message restriction.

Existing component variants keep their `data` contract. No additional schema
migration is needed for this rendering change. Installations must already have
the generated Template Content and Consistency Capture migrations applied.

Deploy API and Host together for the POST rendering contract. The local Host
setup and deployer forward `RBAC_SECRET_KEY` to Host's server-only `.env.local`.
For an existing local checkout, copy the API value into that file and restart
Host. Never use a `NEXT_PUBLIC_` variable for this key. API and Host must use the
same value; a missing or mismatched key refuses rendering before reading input.
