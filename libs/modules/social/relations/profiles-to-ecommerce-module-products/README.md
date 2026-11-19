# Social Profiles to Ecommerce Module Products Relation

## Purpose

Links profiles to ecommerce products.

The `store-expert` variant assigns an AI profile to customer work in one
store. In Admin, choose the store and one offer, product, or category. An
offer assignment takes precedence over a product assignment, which takes
precedence over a category assignment. If two profiles match at the same
priority, a manager receives the request in the CRM queue.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `className`: optional CSS class name.
- `profileId`: linked profile ID.
- `ecommerceModuleProductId`: linked product ID.
- `storeId`, `offerId`, and `categoryId` identify the scope of an expert assignment.

## Variants

- `default`: renders the related product using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
