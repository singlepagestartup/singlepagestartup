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

- `default`: article card with localized rich subtitle, all ordered media and the article link.
- `overview-default`: article header, rich body, all ordered media and an optional ordered content JSX slot. Public fallback reads only `default` Article→Widget associations.
- `overview-with-private-content-default`: the same public article view with a higher-module content slot.
- `private-content-default`: presentation for guest, locked, expired, checking, error and granted states; children mount only for granted access.
- `loading`: one article skeleton; collection Widgets compose the grid.
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
