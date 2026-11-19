# Subject–Store ownership

`variant="owner"` identifies the Subject that can edit the Store, its offers,
prices, rates, service links and stock after the route permission check. One Store has one owner grant.
Administrators can manage any Store. The seller’s Subject operation creates the grant from the
authenticated caller when creating a Store; request data cannot choose its owner.

The relation contains `subjectId` and `ecommerceModuleStoreId`, plus the standard
relation ID, timestamps and presentation fields. Its API, client/server SDKs,
`find` renderer and admin forms follow the neighboring RBAC relation contracts.
Ownership records are installation data and have repository dump/seed disabled.

The admin form writes this relation through its own SDK. The API checks the
caller’s permission for the requested method and relation route.

An ordinary seller cannot transfer a Store by changing the Subject or Store end.
The `default` and `hidden` variants remain presentation associations and grant no
new catalogue ownership.

Creating an offer for another seller’s Product does not transfer Product
ownership. The [Subject seller API](../../models/subject/README.md) checks the
Store grant independently of the Product grant and writes the complete offer
graph in one transaction.

`crm-manager` grants access to the selected Store’s CRM workspace. A
`crm-manager-finance` grant includes permission to read task costs. `owner`
includes both permissions. Use `crm-worker` or `crm-agent` to make a Subject
available for stage assignment. Those grants alone provide no CRM workspace
access. The existing catalogue ownership controls still apply to relation writes.
