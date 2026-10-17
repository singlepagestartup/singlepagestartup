# Repository read dependencies

`createConsistencyRuntime` collects actual repository reads in an
`AsyncLocalStorage` operation. `find`, `count`, `findByField` and
`findFirstByField` record their candidate scope before reading rows. Empty
results and missing IDs retain a dependency. A literal empty `inArray` has no
changing candidates.

The resource name comes from the effective Drizzle Table. UUID `eq` and
`inArray` filters use the physical column name and the SHA-256 of PostgreSQL's
normalized UUID. Within an AND, one bounding equality scope is sufficient.
Other types, range predicates and unbounded queries use the table's 16
collection generations. The SQL filter builder currently accepts AND only.
Do not infer support for another SQL predicate from dependency tracking.

A descriptor contains at most 256 keys. Large descriptors collapse to collection
versions observed before that resource's first read. If the bounded descriptor
cannot represent every source, the response receives no consistency capability
and is excluded from the new response cache.

## Custom reads and transactions

Call `trackRepositoryRead(Table, database, filters)` before a custom SQL read.
For a join, call it for each source Table and its candidate scope. Track count,
ordering and top-K candidates, including records outside the returned page.
Custom row locks also register their Table scope. Advisory locks and schema
maintenance queries contain no reusable entity result.

Run `node tools/dev/audit-consistency-reads.mjs` to inventory runtime SQL reads
and reject a custom reader without an adapter in its owning function. This
static guard does not prove the scope of an arbitrary SQL join; review the
actual Table sources and predicates.

`withConsistencyDatabase(tx, operation)` passes an operation's transaction to
effective repositories without mutating singleton services. Explicit repository
transaction clones retain their own handle. `withConsistencySnapshot(operation)`
provides a repeatable-read, read-only transaction for service-only aggregates.
Nested HTTP requests have separate SQL snapshots; their dependency descriptors
are merged through the shared `responsePipe` transport observer.

The shared memory cache retains read descriptors. `getAsync` checks authoritative
versions before reusing authorization decisions. Synchronous caches still
propagate dependencies and are invalidated by each API process's journal reader.
A missing descriptor cannot prove a reusable authorization result.

## API composition

The API app creates one infrastructure runtime, starts read tracking before
RBAC, and registers response caching after authorization, billing and query
parsing. Business services use ordinary transactions. Knowledge and CRM do not
require publisher setters in the API host or CLI.

PostgreSQL capture, dispatcher fencing, retention and migration commands are
documented in [providers-db](../../../providers/db/README.md). The
[transport contract](../../../middlewares/src/lib/revalidation/README.md)
describes private query refs, replay and browser recovery.
