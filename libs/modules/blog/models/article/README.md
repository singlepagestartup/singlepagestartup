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

- `card`: module/guide card with exact saved media. `layout="guide"` selects the `guide-cover` association and falls back to the default cover. Links retain the current language.
- `default`: article card with localized rich subtitle, ordered media, linked categories, creation date and an optional author JSX slot. One stretched link covers the card; category and rich-text links keep their own destinations.
- `overview-default`: light article introduction with actual category links, creation date and optional author JSX; all ordered media sit with the rich body. A client view builds its contents from the rendered public-body headings and moves keyboard focus to the chosen heading. Public fallback reads only `default` Article→Widget associations and includes their headings in the contents. A supplied scoped stream stays outside that public heading observer.
- `overview-with-private-content-default`: the public article introduction with a higher-module scoped content stream. Save this variant on Articles that require the scoped stream; the shared Blog detail Widget selects it from the loaded Article without probing protected relation metadata.
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

Host supplies author presentation through Blog Widget `renderAuthor` slots after
Article loading. Cards and detail receive the rendered `author` node. The
callback stays in the composing runtime; Blog does not import Social or resolve
profiles. `TRenderAuthor` and `IAuthorSlotProps` are exported by the public
Article frontend entrypoint. An article without linked authors has no invented
byline. Category labels use the current Category records linked through
`categories-to-articles`, preserving relation order.

The overview keeps SDK selection and relation readers in its server-compatible
`Component.tsx`. Its `ClientComponent.tsx` receives explicit display strings and
rendered nodes for media, body, author and ordered content. `authorCard`,
`navigation` and `commentsContent` are JSX slots for higher consumers. The contents observer
only watches the public description; protected child widgets retain their
existing access and cache owner. No reading-time value is invented: Article
has no reading-time field.

The comments slot carries a supplied Social composition; Blog does not own a
comment model or invent persisted discussions. An absent slot stays empty.
