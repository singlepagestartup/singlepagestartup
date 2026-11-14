# PostgreSQL consistency storage

The `sps_consistency` schema stores resource generations, a transactional outbox,
a delivery journal and temporary query registrations. It is infrastructure;
model CRUD routes and data snapshot seeding do not expose these tables.

## Model and relation changes

Define framework fields in `fields/singlepage.ts` and project extensions in
`fields/startup.ts`. Capture reads the resulting Drizzle Table and the entity's
SDK route. This also applies to new models and relations in the Startup module.
For example, after adding a column to Startup Widget, run:

```sh
npx nx run @sps/startup:models:widget:repository-generate
npx nx run api:db:migrate
npx nx run @sps/providers-db:consistency-check
```

Commit the Widget field definition and the migrations in the Widget repository.
Other entities keep their own histories. If upstream and a project both change
the same entity, reconcile that entity's Drizzle migrations during the merge.

During deployment the provider installs the shared PostgreSQL functions first.
Each entity then applies its DDL and registers its table, effective column names
and SDK topic. The migrator repairs missing or outdated triggers. A changed
migration revision, registration or repaired trigger invalidates cached reads
of that table. The revision and invalidation are committed together. The first
deployment of revision tracking invalidates each migrated table once.

After the entity migrations, `consistency-finalize` verifies coverage and
invalidates old registrations for tables removed from both PostgreSQL and the
project. Custom deploy scripts should use the same order as `migrate.sh`.
API startup and the read-only `consistency-check` discover the project catalog
from the source tree shipped in the API image. Both verify the topic, column
mapping, row and truncate triggers, and captured UUID columns.

## Infrastructure changes

For changes to the provider schema or to the shared trigger functions, run:

```sh
npx nx run @sps/providers-db:repository-generate
npx nx run api:db:migrate
npx nx run @sps/providers-db:consistency-check
```

A change to the functions generates a provider migration and resets the global
epoch. Earlier releases included full table catalogs in those SQL migrations.
Leave applied migrations intact. If a fork already applied a locally generated
provider migration, retain its SQL and journal entry when merging. Before
accepting deletion of a locally modified `capture.json`, check that each
project-owned entry has its Drizzle Table and SDK route in the source tree.
New entity changes use the entity journal only.

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
