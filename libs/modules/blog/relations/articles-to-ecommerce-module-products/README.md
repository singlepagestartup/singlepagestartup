# Blog Articles to Ecommerce Module Products Relation

## Purpose

Links blog articles to ecommerce products for cross-promotions and embedded product lists.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `className`: optional CSS class name.
- `articleId`: linked article ID.
- `ecommerceModuleProductId`: linked product ID.

## Variants

- `default`: renders the related product using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.

## Subscription requirement

`variant="subscription"` supplies an explicit required subscription Product for
an Article's private Website Builder roots. A suitable current owned order,
complete fresh Product Roles, confirmed server-owned period and valid current
status establish access. A roleless route permission does not establish this
resource access. Multiple requirement Products are alternatives; private
shared descendants require access to every associated private root.

`default` continues to represent a related public Product without inferring
subscription requirements.
