# Blog Articles to Website Builder Module Widgets Relation

## Purpose

Links articles to website-builder widgets for embedding content blocks within articles.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `className`: optional CSS class name.
- `articleId`: linked article ID.
- `websiteBuilderModuleWidgetId`: linked website-builder widget ID.

## Variants

- `default`: renders the related website-builder widget using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.

## Protected content

`variant="private"` marks a protected Website Builder root. Its Article uses
`articles-to-ecommerce-module-products` links with `variant="subscription"` for
required subscription Products. Missing requirements deny access. `default`
retains public content semantics.

The API host composes the RBAC resource guard before metadata response caches
and static media delivery. It protects each reachable Website Builder record,
relation and File, including aliases of the same managed bytes. Creating or
relinking private content requires isolated records and bytes; ordinary unlink,
public reuse and multipart byte replacement fail closed. Embedded media uses
protected File components rather than raw URLs in rich text.

The Subject-scoped content SDK returns ordered public entries and private
placeholders. A denied placeholder has no protected record IDs or body. A
successful private entry includes the earliest effective expiry across the
reachable private scopes. This association's frontend `private` compatibility
view performs no independent protected read.
