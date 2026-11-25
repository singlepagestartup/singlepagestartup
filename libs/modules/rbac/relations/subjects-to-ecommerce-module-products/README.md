# RBAC Subjects to Ecommerce Module Products Relation

## Purpose

Links subjects to ecommerce products.

`variant="owner"` identifies the Subject that can edit the shared Product
description and versioned price formula after the route permission check. Each
Product has one owner grant; an administrator can edit any Product. The seller’s Subject operation assigns a new Product to its authenticated creator.
Creating another store’s offer for the Product does not create an owner grant.
Existing `default` associations retain their presentation and purchase behavior.
The admin form writes this relation through its own SDK. The API checks the
caller’s permission for the requested method and relation route.

The `store-expert` variant assigns a product to an AI Subject. Customer work selects the assigned Subject among the employees of the store that published the offer. Its Social profile supplies the employee’s description and knowledge.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `className`: optional CSS class name.
- `subjectId`: linked subject ID.
- `ecommerceModuleProductId`: linked product ID.

## Variants

- `default`: renders the related product using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
