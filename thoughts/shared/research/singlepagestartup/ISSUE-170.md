---
date: 2026-05-03T22:57:40+03:00
researcher: flakecode
git_commit: 0e30ea072ddc631c2a4822b94967a0dfb6ba7ff0
branch: debug
repository: singlepagestartup
topic: "Issue 170 duplicate billing payment-intent table migration"
tags: [research, codebase, database, drizzle, billing, payment-intent]
status: complete
last_updated: 2026-05-03
last_updated_by: flakecode
---

# Research: Issue 170 duplicate billing payment-intent table migration

**Date**: 2026-05-03T22:57:40+03:00
**Researcher**: flakecode
**Git Commit**: 0e30ea072ddc631c2a4822b94967a0dfb6ba7ff0
**Branch**: debug
**Repository**: singlepagestartup

## Research Question

What current code path and database state produce `PostgresError: relation "sps_bg_pt_it" already exists` for issue 170, using the restored local database that matches the production server where the log-watch error was observed?

## Summary

- The error is locally reproducible against the restored production database by running `npx nx run @sps/billing:models:payment-intent:repository-migrate`.
- `sps_bg_pt_it` is the billing `payment-intent` model table. It is derived from `moduleName = "sps_bg"` and `table = "pt_it"` in the payment-intent repository schema.
- The payment-intent runtime migration uses `drizzle.sps_bg_pt_it` as its per-repository migration tracking table and `public.sps_bg_pt_it` as the application table created by the first migration SQL file.
- In the restored local database, `public.sps_bg_pt_it` exists and contains 539 rows, while `drizzle.sps_bg_pt_it` exists with 0 migration rows. Drizzle therefore sees no recorded payment-intent migration and executes `CREATE TABLE "sps_bg_pt_it"`, which surfaces PostgreSQL error `42P07`.
- The same database metadata check showed `public.sps_bg_invoice` exists with 539 rows while `drizzle.sps_bg_invoice` also has 0 migration rows. The observed issue 170 failure stops first at payment-intent because billing model migrations run `currency`, `payment-intent`, `invoice`, then `widget`.
- Issue 172 is the companion log-watch symptom for the same local target: it records `NX Running target models:payment-intent:repository-migrate for project @sps/billing failed`.

## Detailed Findings

### Ticket And Production Log Context

- The ticket records this as a copied production log-watch bug and explicitly says the current local workspace uses a restored database dump from the affected project (`thoughts/shared/tickets/singlepagestartup/ISSUE-170.md:17`, `thoughts/shared/tickets/singlepagestartup/ISSUE-170.md:38`).
- The production watchdog fingerprint is `LW-af9b64380f19`, service `api_api`, with 10 occurrences in the one-hour window (`thoughts/shared/tickets/singlepagestartup/ISSUE-170.md:54`).
- The captured error is `PostgresError: relation "sps_bg_pt_it" already exists`; sample 2 includes PostgreSQL routine `heap_create_with_catalog` and code `42P07` (`thoughts/shared/tickets/singlepagestartup/ISSUE-170.md:64`, `thoughts/shared/tickets/singlepagestartup/ISSUE-170.md:132`).
- Issue 172 records the surrounding Nx-level failure for the same target, including `@sps/billing:models:payment-intent:repository-migrate` (`thoughts/shared/tickets/singlepagestartup/ISSUE-172.md:64`, `thoughts/shared/tickets/singlepagestartup/ISSUE-172.md:98`).

### Production And Local Startup Path

- Production API deployment starts with `./start.sh api`; the deployer template runs that command for the API service (`tools/deployer/api/docker-compose.api.yaml.j2:12`).
- `start.sh` runs `./migrate.sh seed &` in the background before `npm run api:start` when called with `api` (`start.sh:9`).
- The root `migrate.sh` runs repository migrations sequentially and includes `npx nx run @sps/billing:repository-migrate` as the billing step (`migrate.sh:4`, `migrate.sh:9`).
- Local bootstrap also runs `npx nx run api:db:migrate` after starting Postgres and Redis (`up.sh:5`).
- The API `db:migrate` target fans out sequentially across module `repository-migrate` targets and reaches billing at `npx nx run @sps/billing:repository-migrate` (`apps/api/project.json:73`, `apps/api/project.json:96`).

### Billing Migration Chain

- Billing `repository-migrate` runs `models:repository-migrate` first, then `relations:repository-migrate` (`libs/modules/billing/project.json:38`).
- Billing model migrations run in this order: `currency`, `payment-intent`, `invoice`, `widget` (`libs/modules/billing/project.json:88`).
- The payment-intent target uses `apps/api/.env`, sets cwd to `libs/modules/billing/models/payment-intent/backend/repository/database`, and runs `bun run ./src/lib/migrate.ts` (`libs/modules/billing/project.json:255`).
- The payment-intent migration entry point only imports `migrate` from `./config` and calls `migrate.migrate()` (`libs/modules/billing/models/payment-intent/backend/repository/database/src/lib/migrate.ts:1`).

### Payment Intent Table Ownership

- The payment-intent schema defines `moduleName = "sps_bg"` and `table = "pt_it"` (`libs/modules/billing/models/payment-intent/backend/repository/database/src/lib/schema.ts:4`).
- Its `pgTableCreator` prefixes names as `${moduleName}_${name}`, so the repository table becomes `public.sps_bg_pt_it` (`libs/modules/billing/models/payment-intent/backend/repository/database/src/lib/schema.ts:7`).
- Its migration config passes `migrationsTable: `${moduleName}_${table}``, so the migration history table is also named `sps_bg_pt_it`, but Drizzle stores it in the `drizzle` schema (`libs/modules/billing/models/payment-intent/backend/repository/database/src/lib/config.ts:10`).
- The generated payment-intent migration SQL starts with `CREATE TABLE "sps_bg_pt_it"` and defines columns `id`, `created_at`, `updated_at`, `variant`, `amount`, `status`, `interval`, and `type` (`libs/modules/billing/models/payment-intent/backend/repository/database/src/lib/migrations/0000_salty_sway.sql:1`).

### Shared Migration Behavior

- `MigrateConfig.migrate()` creates a Drizzle DB handle, tries to read `drizzle.<migrationsTable>`, ignores only missing-history-table errors, and then invokes Drizzle's migrator with `migrationsFolder` and `migrationsTable` (`libs/shared/backend/database/config/src/lib/migrate/index.ts:46`, `libs/shared/backend/database/config/src/lib/migrate/index.ts:58`, `libs/shared/backend/database/config/src/lib/migrate/index.ts:68`).
- It reads `drizzle.<migrationsTable>` again after migration and logs `NEW_MIGRATIONS=true` when the row count changes (`libs/shared/backend/database/config/src/lib/migrate/index.ts:73`).
- Any thrown migration error is logged and exits the process with code `1` (`libs/shared/backend/database/config/src/lib/migrate/index.ts:88`).
- Drizzle's PostgreSQL dialect creates the migration schema/table with `CREATE SCHEMA IF NOT EXISTS` and `CREATE TABLE IF NOT EXISTS`, reads the latest row from the migration table, executes migration SQL when there is no latest row or the latest `created_at` is older, and then inserts the migration hash and timestamp (`node_modules/drizzle-orm/pg-core/dialect.js:44`).
- Drizzle reads SQL files from `migrationsFolder/meta/_journal.json`, splits SQL by `--> statement-breakpoint`, and hashes the raw migration file (`node_modules/drizzle-orm/migrator.js:3`).

### Relation References To Payment Intent

- The billing `payment-intents-to-invoices` relation imports `PaymentIntent` and defines `paymentIntentId` as database column `pt_it_id`, referencing `PaymentIntent.id` with cascade delete (`libs/modules/billing/relations/payment-intents-to-invoices/backend/repository/database/src/lib/schema.ts:2`, `libs/modules/billing/relations/payment-intents-to-invoices/backend/repository/database/src/lib/schema.ts:17`).
- Its generated SQL creates `sps_bg_pt_is_to_is_lbb` and adds a foreign key from `pt_it_id` to `public.sps_bg_pt_it(id)` (`libs/modules/billing/relations/payment-intents-to-invoices/backend/repository/database/src/lib/migrations/0000_previous_kinsey_walden.sql:1`, `libs/modules/billing/relations/payment-intents-to-invoices/backend/repository/database/src/lib/migrations/0000_previous_kinsey_walden.sql:12`).
- The billing `payment-intents-to-currencies` relation uses the same pattern with table `sps_bg_pt_is_to_cs_cg0` and foreign key `pt_it_id -> public.sps_bg_pt_it(id)` (`libs/modules/billing/relations/payment-intents-to-currencies/backend/repository/database/src/lib/schema.ts:17`, `libs/modules/billing/relations/payment-intents-to-currencies/backend/repository/database/src/lib/migrations/0000_lively_vapor.sql:12`).

### Restored Local Database State

Observed via local `psql` against the current `apps/api/.env` database on 2026-05-03:

```text
current_database: doctorgpt-production
to_regclass('public.sps_bg_pt_it'): sps_bg_pt_it
to_regclass('drizzle.sps_bg_pt_it'): drizzle.sps_bg_pt_it
```

Billing public and migration-tracking tables for the affected area:

```text
drizzle.sps_bg_currency        migration rows: 1
drizzle.sps_bg_invoice         migration rows: 0
drizzle.sps_bg_pt_is_to_cs_cg0 migration rows: 1
drizzle.sps_bg_pt_is_to_is_lbb migration rows: 1
drizzle.sps_bg_pt_it           migration rows: 0
drizzle.sps_bg_widget          migration rows: 2
```

Billing public table row counts:

```text
public.sps_bg_currency        rows: 3
public.sps_bg_invoice         rows: 539
public.sps_bg_pt_is_to_cs_cg0 rows: 539
public.sps_bg_pt_is_to_is_lbb rows: 539
public.sps_bg_pt_it           rows: 539
public.sps_bg_widget          rows: 0
```

Local reproduction command and observed result:

```bash
npx nx run @sps/billing:models:payment-intent:repository-migrate
```

Result:

```text
PostgresError: relation "sps_bg_pt_it" already exists
routine: "heap_create_with_catalog"
code: "42P07"

NX   Running target models:payment-intent:repository-migrate for project @sps/billing failed
```

## Code References

- `start.sh:9` - API container startup branch runs migrations in the background before starting the API server.
- `migrate.sh:4` - Root migration script runs repository migrations sequentially.
- `migrate.sh:9` - Billing repository migrations are one step in the root migration sequence.
- `apps/api/project.json:73` - `api:db:migrate` target starts the repository migration fan-out.
- `apps/api/project.json:96` - `api:db:migrate` calls `@sps/billing:repository-migrate`.
- `libs/modules/billing/project.json:88` - Billing model repository migrations run before relation repository migrations.
- `libs/modules/billing/project.json:98` - Billing payment-intent migration runs before invoice and widget migrations.
- `libs/modules/billing/project.json:255` - Payment-intent repository-migrate target runs `bun run ./src/lib/migrate.ts`.
- `libs/modules/billing/models/payment-intent/backend/repository/database/src/lib/schema.ts:4` - Payment-intent table naming tokens.
- `libs/modules/billing/models/payment-intent/backend/repository/database/src/lib/config.ts:10` - Payment-intent `MigrateConfig` construction.
- `libs/modules/billing/models/payment-intent/backend/repository/database/src/lib/migrations/0000_salty_sway.sql:1` - SQL statement that creates `sps_bg_pt_it`.
- `libs/shared/backend/database/config/src/lib/migrate/index.ts:58` - Shared runner pre-reads the `drizzle.<migrationsTable>` history table.
- `libs/shared/backend/database/config/src/lib/migrate/index.ts:68` - Shared runner invokes Drizzle's migrator.
- `node_modules/drizzle-orm/pg-core/dialect.js:60` - Drizzle executes migrations when there is no latest migration row or the latest timestamp is older.

## Architecture Documentation

- SPS uses per-module and per-repository Drizzle migrations. Each model/relation repository owns a `backend/repository/database/src/lib/config.ts`, `migrate.ts`, `schema.ts`, and generated `migrations/` folder.
- Repository migration history is per repository, not global: `MigrateConfig` passes a repository-specific `migrationsTable` such as `sps_bg_pt_it`.
- Drizzle's migration history table lives in schema `drizzle`, while application data tables live in schema `public`. For this issue, both names are `sps_bg_pt_it`, but they are separate relations: `drizzle.sps_bg_pt_it` and `public.sps_bg_pt_it`.
- Billing relations depend on the payment-intent table through generated foreign keys, but the duplicate-table error occurs before relation migrations because the payment-intent model migration runs during billing model migrations.
- Production API startup runs the root migration script in the background and then starts the API process; the log-watch service captured both the low-level Postgres error and the Nx target failure.

## Historical Context (from thoughts/)

- `thoughts/shared/tickets/singlepagestartup/ISSUE-170.md` is the primary ticket and includes the production fingerprint, restored local DB reproduction context, and PostgreSQL error samples.
- `thoughts/shared/tickets/singlepagestartup/ISSUE-172.md` is the companion ticket for the Nx-level failure around the same payment-intent migration target.
- `thoughts/shared/processes/singlepagestartup/ISSUE-170.md` records that issue 170 was normalized from a copied production log-watch issue and should be treated as locally reproducible with the restored affected-project database dump.
- `thoughts/shared/handoffs/singlepagestartup/ISSUE-145-progress.md:204` records prior billing admin-v2 work around `payment-intent`, `invoice`, `currency`, and billing relations, but it is UI-oriented historical context rather than migration orchestration context.
- `thoughts/shared/research/singlepagestartup/ISSUE-152.md:20` records the existing scenario-test convention of using live infrastructure and Drizzle-backed DB access for DB-backed verification.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-152.md` - DB-backed scenario testing and `@sps/providers-db` context.
- `thoughts/shared/research/singlepagestartup/ISSUE-145.md` - Admin-v2 billing module history and relation structure.

## Open Questions

- Whether issue 170 and issue 172 should be planned as the same implementation surface, since both reproduce through the same payment-intent migration target.
- Whether the implementation phase should treat other restored billing tables with empty migration rows, especially `drizzle.sps_bg_invoice`, as part of the same database-state compatibility surface.
