# Subject–Store ownership

`variant="owner"` grants a Subject permission to edit the Store, its offers,
prices, rates, service links and stock. One Store has one owner grant.
Administrators can manage any Store. The server creates the grant from the
authenticated caller when creating a Store; request data cannot choose its owner.

The relation contains `subjectId` and `ecommerceModuleStoreId`, plus the standard
relation ID, timestamps and presentation fields. Its API, client/server SDKs,
`find` renderer and admin forms follow the neighboring RBAC relation contracts.
Ownership records are installation data and have repository dump/seed disabled.

Raw ownership writes require an administrator or the trusted operator credential.
An ordinary seller cannot transfer a Store by changing the Subject or Store end.
The `default` and `hidden` variants remain presentation associations and grant no
new catalogue ownership.

Creating an offer for another seller’s Product does not transfer Product
ownership. The [Subject seller API](../../models/subject/README.md) checks the
Store grant independently of the Product grant and writes the complete offer
graph in one transaction.
