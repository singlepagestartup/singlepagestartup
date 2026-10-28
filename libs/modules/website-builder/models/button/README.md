# Website Builder Button Model

## Purpose

Buttons represent clickable actions and links used in UI sections.

## Fields

- `title`: button title (localized).
- `subtitle`: button subtitle (localized).
- `url`: destination URL.
- `className`: custom CSS classes.
- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant/style.
- `adminTitle`: title shown in admin interface.
- `slug`: URL-friendly unique identifier.

## Variants

- `action`: lime action with an arrow, sized to its label.
- `action-inverse`: dark action for a lime section.
- `repository`: outlined repository action with the GitHub glyph and an external-link arrow.
- `repository-link`: underlined repository link with the GitHub glyph.
- `text-action`: text action with an arrow and no button background.

These variants share their display component and keep saved URLs, localized labels,
analytics and language context. The shared Phosphor adapter provides the
`arrow-right`, `arrow-up-right` and `github-logo` glyphs.

- `default`: standard button style.
- `primary`: main call-to-action emphasis.
- `secondary`: secondary action style.
- `outline`: outlined button style.
- `link`: link-like button style.
- `ghost`: minimal button style.
- `destructive`: destructive action emphasis.
- `children`: wraps custom children in a link container.
- `find`: data-fetch wrapper for querying buttons.
- `admin-select-input`: admin UI select input for linking buttons.
- `admin-table-row`: admin UI row for button listings.
- `admin-form`: admin UI create/edit form.
- `admin-table`: admin UI table for browsing buttons.

`navigation`, `navigation-inverse` and `footer-link` own navigation presentation.
The navigation client view marks an exact localized pathname as the current
page. `action-outline-inverse` supplies an outlined action on a dark surface.
Parent Widgets must not restyle these Buttons through descendant selectors.
