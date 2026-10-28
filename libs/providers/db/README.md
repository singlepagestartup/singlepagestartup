# PostgreSQL consistency storage

The `sps_consistency` schema stores resource generations, a transactional outbox,
a delivery journal and temporary query registrations. It is infrastructure;
model CRUD routes and data snapshot seeding do not expose these tables.

Generate and apply infrastructure migrations from the repository root:

```sh
npx nx run @sps/providers-db:repository-generate
npx nx run @sps/providers-db:repository-migrate
npx nx run @sps/providers-db:consistency-check
```

`api:db:migrate` applies infrastructure first. Each model/relation migrator
installs capture after its own table migration. The infrastructure migrator
also discovers the effective project Tables and SDK routes, reconciles their
catalog with deployed tables and removes retired resource registrations.
Startup overrides take effect without copying the upstream catalog's physical
table names. Catalog changes invalidate existing consistency capabilities;
application records and historical generation rows remain intact. The generator
reads effective Tables and SDK routes; no second relation graph is maintained.
A new generator template runs infrastructure generation after model generation.
An existing manually configured repository target must also run the
infrastructure generation command when its Table changes.

Drizzle creates schema migrations and custom migration entries. The capture
extension fills only a newly generated custom migration and records a catalog
fingerprint. Repeating generation without Table/function changes creates no
migration. Coverage checking reads the same effective catalog and fails when a current table lacks its capture
trigger; uncovered reads cannot receive cache capabilities.

## Writes and delivery

Row triggers update generations and append outbox keys in the writer's SQL
transaction. They cover inserts, updates, deletes, raw SQL, upserts and FK
cascades. A statement trigger covers TRUNCATE. UUID equality fingerprints and
collection shard keys enter the journal; complete rows and document contents
do not. Generation rows are retained, including deletion tombstones.

A PostgreSQL transaction advisory lock fences dispatchers. The lock spans
sequence allocation, delivery insertion and processed checkpoint commit; it
has no expiring application lease that an old leader can outlive. A failed
transaction releases the lock and leaves its outbox entries pending. External
Next invalidation occurs before delivery commit and can repeat after failure.
The runtime retries failures with backoff up to 30 seconds.

Events from a short transaction are coalesced within the claimed batch. The
journal sequence is assigned after the outbox commit is visible, so a slow
writer is not skipped behind a faster writer. Each API process reads the
journal independently. LISTEN/NOTIFY wakes it; a one-second control poll
recovers missed notifications.

Delivery retention is seven days. Unprocessed outbox entries are not removed.
Identical query/auth/version registrations reuse one opaque ref. Query capabilities
have five-minute renewable leases; tag registrations remain
for 12 hours 7 minutes to cover the maximum supported Next cache lifetime.
`ConsistencyStore.status()` reports epoch, newest/oldest cursor and outbox lag.
`npx nx run @sps/providers-db:consistency-status` also reports pending writes,
active/retained refs, generations and delivery rows. The operator-only API
`GET /api/consistency/status` adds process memory, subscriptions, delivery and
cache/shadow counters. It returns no descriptors, tokens or entity bodies.

## Maintenance

Redis contains disposable response envelopes. Clearing it causes cache misses;
it does not reset PostgreSQL generations or the replay journal. Never remove
generations while older refs or responses can remain valid. After maintenance that bypasses capture, restore and verify triggers while
traffic is stopped, then run `npx nx run @sps/providers-db:consistency-reset`.
The command invalidates the Next root layout and registered tags, increments
every resource reset generation, changes epoch and expires old capabilities.
It queues a durable reset for the legacy bridge. A failed Next invalidation
keeps the database reset uncommitted; the command can be repeated. It does not
delete user records or generation tombstones. Reopen traffic after success.
