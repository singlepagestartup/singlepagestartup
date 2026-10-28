# Blog Article Model

## Purpose

Articles are the primary content entries in the blog, storing localized text and metadata for rendering lists and detail pages.

## Fields

- `id`: unique identifier (UUID).
- `className`: optional CSS class name.
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.
- `title`: localized title.
- `subtitle`: localized subtitle.
- `description`: localized rich description.

## Variants

- `default`: article card with title, subtitle, attached media, and link to the article page.
- `overview-default`: overview card with description and attached website-builder widgets.
- `overview-with-private-content-default`: wrapper variant for private/child content.
- `find`: data-fetch wrapper for querying articles.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing an article.
- `admin-table`: admin table listing articles.
- `admin-table-row`: admin row showing article fields.

## Social profiles

The Social-owned
[profiles-to-blog-module-articles](../../../social/relations/profiles-to-blog-module-articles/README.md)
relation connects an article to one or more profiles. Social profile admin forms
own management of these links; Blog article forms own article editing and do not
import Social. Admin-v2 relation rows can open the linked article editor.

Profile lists render the existing article `default` card through the profile's
`articles-default` variant. Reading links and articles uses existing RBAC
permissions. Deleting a link preserves the article and profile.

## SEO metadata and publication

`metadata` is a JSONB object, default `{}`. Its optional `seo` section contains
localized `title`, `description` and `keywords`; other named JSON sections are
preserved. Example:

```json
{ "seo": { "title": { "ru": "Заголовок" }, "keywords": { "ru": ["тема", "категория"] } }, "campaign": { "name": "spring" } }
```

Known SEO fields are validated; the full object is limited to 64 KiB and ten
levels of nesting. Arbitrary JSON sections are public model data: do not store
secrets here. Prices, permissions, relations and publication state retain their
own fields. Host masks may read only the allowlisted SEO paths. A missing locale
does not fall back to another language.

Both admin forms provide localized fields and an advanced JSON editor. Updates
send the entire preserved object plus `_expectedMetadata` containing the previous
object. The API performs an atomic compare-and-update and returns 409 if another
editor changed it. Reload before retrying. API/SDK/MCP callers should read the
current object, merge their intended section and supply `_expectedMetadata`;
updates without this guard retain the ordinary full-field replacement behavior.

The `hidden` variant makes a primary public route return 404 and removes the
record from public lists/counts and sitemap. Admin access remains subject to
RBAC. Changing presentation variants does not rename saved values.
