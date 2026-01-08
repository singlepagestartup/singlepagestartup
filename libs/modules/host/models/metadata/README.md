# Host Metadata Model

## Purpose

Metadata stores SEO and social preview fields that are attached to pages via
`pages-to-metadata`.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant/style.
- `title`: metadata title (required).
- `description`: description for SEO.
- `keywords`: SEO keywords.
- `author`: content author.
- `viewport`: viewport settings.
- `opengraphTitle`: Open Graph title.
- `opengraphDescription`: Open Graph description.
- `opengraphUrl`: Open Graph URL.
- `opengraphType`: Open Graph type.
- `opengraphSiteName`: Open Graph site name.
- `opengraphLocale`: Open Graph locale.
- `twitterCard`: Twitter card type.
- `twitterSite`: Twitter site handle.
- `twitterCreator`: Twitter creator handle.
- `twitterTitle`: Twitter title.
- `twitterDescription`: Twitter description.
- `twitterUrl`: Twitter URL.
- `twitterDomain`: Twitter domain.
- `twitterAppCountry`: Twitter app country.

## Variants

- `default`: placeholder frontend variant for metadata entries.
- `find`: data-fetch wrapper for querying metadata.
- `admin-select-input`: admin UI select input for linking metadata.
- `admin-table-row`: admin UI row for metadata listings.
- `admin-form`: admin UI create/edit form.
- `admin-table`: admin UI table for browsing metadata.
