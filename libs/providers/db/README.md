# PostgreSQL consistency storage

The `sps_consistency` schema stores resource generations, a transactional outbox,
a delivery journal and temporary query registrations. It is infrastructure;
model CRUD routes and data snapshot seeding do not expose these tables.

## Model and relation changes

Every existing model/relation `repository-generate` target runs Drizzle followed
by `@sps/providers-db:repository-generate`. New model and relation generators
create the same sequence. Generation targets run uncached because they write
migration files and the capture catalog.

For example, after changing Startup Widget fields, run from the repository root:

```sh
npx nx run @sps/startup:models:widget:repository-generate
npx nx run api:db:migrate
npx nx run @sps/providers-db:consistency-check
```

Use the matching model or relation target for other entities. Capture generation
scans every module's effective `schema.ts` Table and SDK route, including new
Startup models, relations and fields inherited through `fields/startup.ts`.
Commit the generated entity migrations, infrastructure migration, Drizzle
metadata and `capture.json` together. Never add tables to capture SQL or edit
the catalog by hand. Repeating generation without schema or capture changes
creates no new capture migration.

`api:db:migrate` applies infrastructure first. Each model/relation migrator
installs capture after its own table migration, so newly created tables receive
triggers. The infrastructure migrator also reconciles the generated catalog
with deployed tables. `consistency-check` checks both catalog freshness and
installed database triggers; run it after applying the complete migration set.

Client-owned or manually added generation targets must preserve the same
uncached, sequential Drizzle-then-capture contract. Run the infrastructure
command from the workspace root when introducing a custom migration workflow.
Models and relations in the standard module layout need no manual capture list
or second relation graph.

## Infrastructure changes

When changing the consistency schema or capture generator itself, run:

```sh
npx nx run @sps/providers-db:repository-generate
npx nx run api:db:migrate
npx nx run @sps/providers-db:consistency-check
```

Drizzle creates schema migrations and custom migration entries. The capture
extension fills only a newly generated custom migration and records a catalog
fingerprint. Repeating generation without Table/function changes creates no
migration. Coverage checking fails when a catalog table lacks its capture
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
