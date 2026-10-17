# Runtime maintenance

API release startup runs `migrate.sh seed` before opening its HTTP listener.
Consistency infrastructure migrates first, followed by the module migrations
and seed. The deployment health check keeps a new API task in startup while
this work runs; a failed command prevents the API from starting.

Check the startup ordering and failure handling with
`node --test tools/runtime/api-startup.test.mjs`.

`sync-next-static.mjs` maintains deployed Next.js assets. The AI Chat Widget
command below changes persisted content configuration through normal SDKs.
Neither command implements behavior by editing repository data snapshots.

## AI Chat Widget links

First deploy the two additive RBAC relation migrations and the API/SDK code.
The data command requires a credential-free loopback `API_SERVICE_URL`, and
uses server credentials from the environment without writing them to its
manifest. Other deployment origins require their own explicit operational
change; this local command rejects them.

Create an input JSON with `targets`. Each target names actual
`hostLinkId`, `rbacWidgetId`, `websiteBuilderWidgetId` and `mode`:
`project-create`, `authentication`, `registration` or `help`. Help also names
its actual `crmFormId` and may name an existing `crmWidgetId`. Missing CRM Widget
and an unconfigured support Form are prepared as additive records: one Step,
three required Inputs and seven linked topic Options from the existing support
copy. Existing configured Steps are validated, not replaced.

Public CMS configuration reads can be requested explicitly:
`publicReadGrants: ["widgets-to-website-builder-module-widgets", "widgets-to-crm-module-widgets"]`.
This prepares only collection/detail GET permissions. An existing role-bound
permission is rejected; the command never unlinks its roles to make it public.
Alternatively, `readGrants: [{roleId, relation}]` binds these GET permissions to
explicit roles for private configuration. Do not mix both policies for the same
relation. No write permission is granted.

```sh
npx dotenv -e apps/api/.env -- bun run --tsconfig-override ./tsconfig.base.json tools/runtime/ai-chat-widget-links.ts prepare /absolute/input.json /absolute/new-before-manifest.json
npx dotenv -e apps/api/.env -- bun run --tsconfig-override ./tsconfig.base.json tools/runtime/ai-chat-widget-links.ts apply /absolute/new-before-manifest.json
npx dotenv -e apps/api/.env -- bun run --tsconfig-override ./tsconfig.base.json tools/runtime/ai-chat-widget-links.ts rollback /absolute/new-before-manifest.json
```

`prepare` only reads APIs and writes a new manifest, refusing an existing
manifest path. It records original records/versions, exact IDs and all planned
creation reference IDs before any mutation. Standard CRUD assigns actual IDs;
the command records each returned ID, remaps dependent references and persists
the mapping before continuing. An unknown create response is recovered only
through its prepared natural selector; multiple matches abort. Review the six
route bindings and public read
policy before `apply`. No record is chosen by a runtime variant-only search.

`apply` rejects stale initial records, persists progress before and after each
mutation, reads back each result, and switches Host roots last. It can resume the
same manifest after interruption; repeating a completed apply creates no
additional records. Rerunning prepare on the configured graph produces no
mutations. A manifest file lock prevents two local processes applying it at once;
FK, pair uniqueness and the AI Chat content-slot index protect relation writes.
Updates retain the checked record's writable fields, including required foreign
keys, because generic PATCH validation requires them. ID and timestamps remain
server-owned. The command does not provide an atomic transaction across HTTP calls.

`rollback` restores original Host links and changed variants, refusing conflicting
edits. It preserves additive content/Form/Input/Option/permission records so
saved content is not deleted and a future cutover can reuse them. Rollback of a
deployment also restores its matching application version: the new binary does
not retain the old Host lookup branches. Never delete the before manifest or
use a new manifest to resume a partially applied one.

Checks:

```sh
bun test --tsconfig-override ./tsconfig.base.json tools/runtime/ai-chat-widget-links.test.ts
```

The relation's PostgreSQL integration suite applies generated SQL in an isolated
schema and checks FK, cascade, unique pairs and the content slot. It leaves
application records untouched. Run it against the disposable test database.
