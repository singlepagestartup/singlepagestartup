# Ecommerce Offers to Offers

An offer is a store’s Product listing with its SKU, prices, stock and delivery settings. Both `sourceOfferId` and `targetOfferId` reference `stores-to-products.id`. Deleting either offer deletes the link. The relation is available at `/api/ecommerce/offers-to-offers`.

The `delivery` and `add-on` variants attach a contractor’s service to the source Product. Quotes share these links across all stores that sell the Product, including links from an archived offer. The recurrence (`first` or `each`) determines which shipments include the charge.

The `fulfilled-by` variant identifies an offer for the same service Product at the store that performs the work. A service offer has at most one such link. Without one, its own store performs the service.

A reused service offer has one role and recurrence across the source Product's links. Relation writes serialize by target service and reject conflicting definitions. Quotes also reject conflicting legacy links, so their charge cannot depend on which seller's link was read first.

The relation service validates create, update, find-or-create insertions and seed writes through injected offer and Product readers. The repository owns the transaction, target-service advisory lock, ordered shared offer and Product row locks, and the update row lock. Validation and the write run inside that same transaction.
