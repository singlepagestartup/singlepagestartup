# Ecommerce Offers to Offers

A directed delivery or add-on link configures a contractor service for the source Product. Quotes reuse these links across every store offer for that Product, including links whose source offer is archived. The service can belong to a different store. A fulfilled-by link delegates a service to its provider offer for the same Product. A service offer's store fulfills it directly when it has no provider link.

The source and target are stores-to-products IDs. A source service has at most one fulfiller. The recurrence of a delivery or add-on is first or each, indicating which shipments include its charge.

A reused service offer has one role and recurrence across the source Product's links. Relation writes serialize by target service and reject conflicting definitions. Quotes also reject conflicting legacy links, so their charge cannot depend on which seller's link was read first.

The relation service validates create, update, find-or-create insertions and seed writes through injected offer and Product readers. The repository owns the transaction, target-service advisory lock, ordered shared offer and Product row locks, and the update row lock. Validation and the write run inside that same transaction.
