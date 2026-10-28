---
confirmation: { confirmed: false }
slug: "nx-bun-docker-and-generated-migrations"
createdAt: "2026-10-23"
category: "devops"
title: "Running SPS locally: Nx, Bun, Docker and generated migrations"
excerpt: "Start the actual API and Host, find the target that owns a schema change and separate runtime content from repository snapshots."
cover: "nx-bun-docker"
coverAlt: "A team preparing a development environment around a shared table."
author: "SinglePageStartup editorial"
authorRole: "Architecture and implementation notes"
---

SinglePageStartup is an Nx monorepo with separate running applications. The Host is Next.js; the API is Hono on Bun. PostgreSQL and Redis belong to the local infrastructure started through Docker Compose. A working Storybook proves a visual composition can render, but it does not establish that the API, database, session or payment operations are running. Begin a runtime investigation by identifying which process owns the failing request and which local configuration it uses.

## Read the commands through Nx

The root package scripts are the normal entrypoints. npm run api:dev invokes the API dev target. In apps/api/project.json that target runs Bun in the API directory, whose package script watches server.ts. npm run host:dev invokes tools/runtime/host.mjs, which launches the Host Nx target with the appropriate environment. This gives a concrete chain to inspect when a terminal command behaves differently from a direct framework invocation.

```sh
npm install
./up.sh
npm run api:dev
npm run host:dev
```

The API and Host commands are separate long-running processes. Run each in its own terminal or managed process. The repository requires Node.js 24 or later, npm 11 or later, Bun and Docker. Check the checkout's actual configuration when choosing ports. A browser tab still open at an old local URL does not show which branch, build or process currently answers it.

## Follow the infrastructure bootstrap

The root up.sh creates environment files, starts the database stack, starts Redis and runs api:db:migrate. The database Compose file also includes Adminer. Optional LLM startup depends on START_LLM; it is not part of every local API check. Treat those scripts as executable configuration: a migration failure should be investigated before a later endpoint error is attributed to the frontend.

The shared database configuration maintains a PostgreSQL client and a shared Drizzle instance. Repositories use that infrastructure rather than opening a connection in each service. Tests that need a disposable fixture can use the existing ambient transaction support and verify rollback. A script that connects successfully to PostgreSQL but writes outside its intended transaction has not established safe fixture isolation.

## Change the schema at its owner

Model fields and relation schemas live with their repositories. After changing a Drizzle field or table, use the owning repository-generate target. SPS requires generated migration SQL and metadata; hand-editing the journal or snapshot can break the history used to compute the next change. The [Drizzle generate guide](https://orm.drizzle.team/docs/drizzle-kit-generate) explains the comparison between the declared schema and previous snapshots.

```sh
npx nx run @sps/ecommerce:models:order:repository-generate
npx nx run api:db:migrate
```

The first command is an owning-model example. Use the corresponding model or relation target for the actual change. api:db:generate intentionally regenerates across modules and should be chosen only for that scope. Review the generated diff, including the field name, nullability, defaults and migration history. A new nullable server-owned period field still needs application write rules; its database presence alone does not define who may change it.

## Keep runtime records out of schema repair

The data directories under backend/repository/database/src/lib/data contain repository snapshots. Editing those JSON files does not update the running CMS and should not implement a visual or behavior fix. Runtime Articles, categories, Widget links and media are managed through their owning SDK flows. Schema evolution, code changes and a local content cutover are different operations with different verification evidence.

Before a content cutover, read the current records and their incoming associations. A shared hero frame can also present a contact form; changing that saved record affects both consumers. An explicit SDK fork and relink preserves the intended owner. Record returned IDs and read back the exact associations after each operation. A successful create response without a linked consumer can leave valid data that no page displays.

## Diagnose one boundary at a time

Check infrastructure readiness, applied schema, API response and Host rendering separately. The Host wrapper disables Node's experimental web storage for its child process because browser SDK detection during server rendering must reflect the intended runtime. Keep that environment behavior when comparing dev and production start. Finish a schema or configuration change with an owning test and a built-page check. Report which database, process and route were exercised so another developer can reproduce the result without guessing from a screenshot.

## Separate generation and application

A generated migration is an artifact to review; an applied migration is database state. Keep both observations in the verification record. A TypeScript field visible in the checkout does not prove that the running local database has its column, and a migrated database does not prove that the API process loaded the new service implementation.

## Source code

- [AGENTS.md](https://github.com/singlepagestartup/singlepagestartup/blob/main/AGENTS.md)
- [package.json](https://github.com/singlepagestartup/singlepagestartup/blob/main/package.json)
- [up.sh](https://github.com/singlepagestartup/singlepagestartup/blob/main/up.sh)
- [apps/api/project.json](https://github.com/singlepagestartup/singlepagestartup/blob/main/apps/api/project.json)
- [apps/api/package.json](https://github.com/singlepagestartup/singlepagestartup/blob/main/apps/api/package.json)
- [tools/runtime/host.mjs](https://github.com/singlepagestartup/singlepagestartup/blob/main/tools/runtime/host.mjs)
- [apps/db/docker-compose.yaml](https://github.com/singlepagestartup/singlepagestartup/blob/main/apps/db/docker-compose.yaml)
- [apps/redis/docker-compose.yaml](https://github.com/singlepagestartup/singlepagestartup/blob/main/apps/redis/docker-compose.yaml)
- [libs/shared/backend/database/config/src/lib/postgres.ts](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/shared/backend/database/config/src/lib/postgres.ts)
