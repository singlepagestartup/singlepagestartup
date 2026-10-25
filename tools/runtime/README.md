# Runtime maintenance

Direct `npm run api:dev`, `npm run api:start` and their Nx targets run
`migrate.sh` before opening the HTTP listener. They apply migrations without
seeding application data. A migration failure keeps the listener closed.

API release startup runs `migrate.sh seed` before opening its HTTP listener.
Its final Nx invocation skips task dependencies because the same migration
phase has already completed before seeding.
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
The data command uses a credential-free loopback `API_SERVICE_URL` by default.
For an authorized deployment, select its exact HTTPS origin explicitly with
`--allow-api-origin https://api.example.com` on prepare, apply and rollback.
Set API_SERVICE_URL to that same origin and supply that deployment's server
credentials through the environment. Credentials never enter the manifest.
The command rejects mismatched origins, URL credentials, paths, queries and
fragments; an existing manifest remains bound to its recorded API origin.

Create an input JSON with `targets`. Each target names actual
`hostLinkId`, `rbacWidgetId` and `websiteBuilderWidgetId`. The saved RBAC Widget
variant identifies its scenario; no mode is supplied. Help also names
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
Preparation also rejects a direct Host link to the same presentation beside
the selected domain Widget. This graph renders the frame twice. Review the
reported association IDs, save their original records and mark only obsolete
direct associations with the existing hidden variant through an explicit
content-management flow; retain the Website Builder Widgets and their content.
Keeping a retired association's natural key prevents later seed runs from
recreating it as an active default link. The frontend registers hidden explicitly
and does not render or fetch its target. Independent presentations remain
valid. New manifests repeat this graph check before apply writes, including
when a duplicate appears after preparation.

`apply` rejects stale initial records, persists progress before and after each
mutation, reads back each result, and switches Host roots last. It can resume the
same manifest after interruption; repeating a completed apply creates no
additional records. Rerunning prepare on the configured graph produces no
mutations. A manifest file lock prevents two local processes applying it at once;
FK and owner/target pair uniqueness protect relation writes.
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
schema and checks FK, cascade, unique pairs and multiple ordered default links. It leaves
application records untouched. Run it against the disposable test database.

### Existing AI Chat links

Apply the generated migration removing the screen-specific index before the
transfer. The same prepare command accepts existing linked instances and changes
their relation variant to default without replacing relation IDs, ordering or
class names. Its source Website Builder Widget ID stays explicit. When a shared
authentication frame needs registration, forgot-password or reset-password
presentation, preparation forks its writable fields and outgoing media, feature,
button-array, logotype and slider links. Targets keep their original files and
child content; the shared source and its consumers are unchanged. Each fork has
a deterministic owner-specific slug for recovery and repeat detection.

Review and preserve the before manifest. Apply and repeat the same manifest,
then run prepare with a new manifest path and require zero remaining operations.
A repeat refuses conflicting edits instead of overwriting content. Rollback
restores relation targets and variants and retains additive presentations for
reuse. Deploy the matching application version when restoring old variants.

## Host startup

`npm run host:dev` and `npm run host:start` use host.mjs to run their existing Nx
targets. The launcher disables experimental Node WebStorage during SSR and
preserves inherited NODE_OPTIONS, including the production heap limit.
Browser storage remains available in the browser. Wallet SDKs otherwise detect
Node 24 localStorage and can reject startup with getItem is not a function.

Check with `node --test tools/runtime/host.test.mjs`.

## Social chat Widget links

`social-widget-links.ts` transfers the chat list and overview bindings to RBAC
Widgets. Its input contains explicit `{ hostLinkId, socialWidgetId }` targets.
Preparation copies localized fields, admin title and class names to independent
`content-social-chat-default` Website Builder instances. Standard default RBAC
relations connect each functional Widget to its frame. Source Social Widgets
remain available and inactive Host associations preserve seed lookup keys.

Use the same environment, origin validation and manifest handling as AI Chat
Widget links:

```sh
npx dotenv -e apps/api/.env -- bun run --tsconfig-override ./tsconfig.base.json tools/runtime/social-widget-links.ts prepare /absolute/input.json /absolute/new-before-manifest.json
npx dotenv -e apps/api/.env -- bun run --tsconfig-override ./tsconfig.base.json tools/runtime/social-widget-links.ts apply /absolute/new-before-manifest.json
npx dotenv -e apps/api/.env -- bun run --tsconfig-override ./tsconfig.base.json tools/runtime/social-widget-links.ts rollback /absolute/new-before-manifest.json
bun test --tsconfig-override ./tsconfig.base.json tools/runtime/social-widget-links.test.ts tools/runtime/ecommerce-widget-links.test.ts
```

Ecommerce and Social commands share `module-widget-links.ts` for preparation,
CLI locking and progress persistence; the existing apply/rollback engine stays
in `ai-chat-widget-links.ts`. A prepared manifest is bound to its migration and
API origin. Verify repeat apply, zero-operation prepare and rollback before
removing a compatible application version. Release in stages: make the new
variants available alongside the old composition, transfer bindings, then
remove the Host injection. Rollback after cleanup also restores the compatible
application version. Repository data snapshots are not migration inputs.
