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

## Local Host memory budget

`npm run api:dev` starts the API and `npm run host:dev` starts Next.js with
Turbopack. Run cold compilation and other project checks sequentially on a
memory-constrained machine. `SPS_HOST_TURBOPACK_MEMORY_MB` supplies Next's target
native bundler memory limit in MiB; it must be a positive integer. The Node heap
has its separate `NODE_OPTIONS=--max-old-space-size=...` limit. The bundler target
is not a hard limit on total process or system memory.

For example, `SPS_HOST_TURBOPACK_MEMORY_MB=1024 NODE_OPTIONS=--max-old-space-size=1536 npm run host:dev`
sets a 1 GiB bundler target and a 1.5 GiB Node heap. An unset bundler variable
preserves the Next.js default. A dev-server Ready message still requires a
successful page request before runtime acceptance.

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

## Framework visual and private content

`framework-widget-links.ts` prepares exact-instance contact and article changes.
Deploy the matching Order schema, fixed-period writer, resource/byte guards,
SDKs and frontend variants before apply. The CLI requires operator credentials,
uses the normal server SDKs with no-store and binds its manifest to one API
origin. Use `--allow-api-origin` for a selected HTTPS deployment as above.

Input sections are optional; at least one is required:

```json
{
  "contact": {
    "hostLinkId": "EXACT_HOST_CRM_ASSOCIATION_ID",
    "crmWidgetId": "d947bcab-0873-40a5-8c91-66ec59c54c3b",
    "crmFormId": "744eb654-aac3-4aac-af93-f9fb5e290b23",
    "crmPresentationLinkId": "2ac1155e-f1b1-421d-9962-7d6e70d3d5e6",
    "sharedHeroWidgetId": "4e55875f-1298-4544-a61d-19af05367bef",
    "anchor": "contact"
  },
  "privateArticles": [
    {
      "articleId": "5ade2625-007e-4c90-86bd-989a33e534fa",
      "articleWidgetLinkIds": ["992b28da-d5a7-4e9a-a0f4-350e0c73cee3"],
      "subscriptionProductId": "EXACT_CONFIGURED_SUBSCRIPTION_PRODUCT_ID"
    }
  ],
  "freezeOrders": [
    {
      "subjectId": "EXACT_LEGACY_ORDER_OWNER_ID",
      "orderId": "EXACT_LEGACY_SUBSCRIPTION_ORDER_ID",
      "expectedUpdatedAt": "EXACT_ORDER_UPDATED_AT_FROM_SDK"
    }
  ]
}
```

The UUIDs describe the researched local demo graph. Supply the actual IDs from
the deployment being maintained, including the Host external association ID,
subscription Product and any legacy Orders. Preparation checks exact ownership
and existing Form links; it does not select a Product by title or variant.

```sh
npx dotenv -e apps/api/.env -- bun run --tsconfig-override ./tsconfig.base.json tools/runtime/framework-widget-links.ts prepare /absolute/input.json /absolute/new-framework-manifest.json
npx dotenv -e apps/api/.env -- bun run --tsconfig-override ./tsconfig.base.json tools/runtime/framework-widget-links.ts apply /absolute/new-framework-manifest.json --exclusive-maintenance
npx dotenv -e apps/api/.env -- bun run --tsconfig-override ./tsconfig.base.json tools/runtime/framework-widget-links.ts verify /absolute/new-framework-manifest.json
npx dotenv -e apps/api/.env -- bun run --tsconfig-override ./tsconfig.base.json tools/runtime/framework-widget-links.ts rollback /absolute/new-framework-manifest.json --exclusive-maintenance
bun test --tsconfig-override ./tsconfig.base.json tools/runtime/framework-widget-links.test.ts
```

Prepare reads the saved graph and writes a protected manifest without API
mutations. Contact receives an independent `content-feature-find-row` frame
using the existing localized Form copy, a functional RBAC Widget and exact
default relations to that frame and the existing CRM Widget. Hero, slides,
Form fields/options and their order remain unchanged. The existing CRM frame
association keeps its ID; the active Host link switches last and an inactive
legacy association preserves its natural key.

Private preparation traverses all thirteen Website Builder relation kinds and
uses registry metadata to check incoming relations across modules, with SDK
pagination. Shared roots/descendants, external media and inline unmanaged media
abort before marking anything private. First create distinct managed records
and byte copies through the supported content/file SDK flow, relink the exact
article association, then prepare again. This command does not clone or import
assets. Backend write guards independently validate the prospective private
graph when the marker is applied. Subscription Product role links must exist;
the backend checks the actual paid ownership, period and grant at read time.

Legacy period freeze uses only the operator Subject SDK
`ecommerceModuleOrderFreezeSubscriptionPeriod` with expectedUpdatedAt. It runs
before content writes, records readback and recovers an unknown outcome from
the fixed start/period fields. The tool never writes period timestamps through
generic Order CRUD. A nonmatching or unaccepted freeze stops apply.

Apply rechecks private topology and original records, recovers unknown create
responses by deterministic selectors, persists server-assigned IDs and resumes
the same manifest. Verify checks managed records, unchanged sources, private
isolation and frozen Orders. Files use mode 0600 and a per-manifest lock; their
before snapshots can contain protected content and must stay out of Git.

Rollback restores contact/Host presentation changes, refuses concurrent edits
and retains additive records. It retains private article classifications,
subscription requirements and fixed legacy periods. Reverting visual changes
does not republish protected data. Prepare a fresh manifest after rollback to
reuse those records; retain the original manifest for recovery.

Apply and rollback require an exclusive CMS maintenance window. Generic PATCH
validates required fields with a full writable record and can overwrite an edit
made between its verification read and write. Stop other CMS writers for this
API origin before passing `--exclusive-maintenance`, and keep them stopped until
verify completes. The API continues accepting requests during the command.
Preflight and readback detect observed changes; each manifest has its own local
process lock. An API with concurrent CMS writers needs conditional writes before
this cutover can run safely.

Before checking Blog, verify the saved public read policy for these exact GETs:

- `/api/blog/widgets-to-categories`
- `/api/blog/categories-to-website-builder-module-widgets`

The new curated views use these relations. Their count routes and the other
Blog relation reads were public in the local demo, but these two list permissions
were absent. For another deployment, create a missing permission only when its
saved Blog configuration requires public category content. Preserve an existing
role-bound policy. The private graph guard still filters Article→Widget reads;
private marking and later writes reject public reuse of protected WB/File graphs.
This configuration repair remains separate from visual rollback.

Run the following in the repository's operator SDK environment with the reviewed
API origin and credentials. It creates only missing exact GET permissions,
refuses ambiguous or role-bound policies, and verifies unauthenticated reads.
Then open Blog and a saved Blog category in the built Host.

```ts
import { api as permissions } from "@sps/rbac/models/permission/sdk/server";
import { api as rolePermissions } from "@sps/rbac/relations/roles-to-permissions/sdk/server";

const host = "http://localhost:4000";
const options = {
  cache: "no-store" as const,
  headers: { "X-RBAC-SECRET-KEY": process.env.RBAC_SECRET_KEY! },
};
for (const path of ["/api/blog/widgets-to-categories", "/api/blog/categories-to-website-builder-module-widgets"]) {
  const existing = await permissions.find({
    host,
    options,
    params: {
      filters: {
        and: [
          { column: "path", method: "eq", value: path },
          { column: "method", method: "eq", value: "GET" },
        ],
      },
    },
  });
  if (existing.length > 1) throw Error("Ambiguous read permissions");
  if (existing.length) {
    const bindings = await rolePermissions.find({
      host,
      options,
      params: { filters: { and: [{ column: "permissionId", method: "eq", value: existing[0].id }] } },
    });
    if (bindings.length) throw Error("Preserve the existing role-bound policy");
  } else {
    await permissions.create({
      host,
      options,
      data: { variant: "default", type: "HTTP", method: "GET", path },
    });
  }
  const response = await fetch(host + path, { cache: "no-store" });
  if (!response.ok) throw Error(`Public relation read failed: ${response.status}`);
}
```

## Curated Blog examples

`blog-example-content.ts` publishes an explicit six-article, three-category local
example set through server SDKs. Its `sps.blog-example-content-input.v1` input
names existing Category IDs, five new Article slugs, the preserved private
Article ID/slug, seven uploaded File IDs, the `sps-editorial` author, exact Blog
Widget curation, eight Article ID/slug pairs to retire and the two selected
public Social author-relation GET paths. Localized descriptions contain saved
TipTap JSON strings. Supply complete EN/RU copy; files must already exist.

```sh
API_SERVICE_URL=http://localhost:4000 npx dotenv -e apps/api/.env -- bun run --tsconfig-override ./tsconfig.base.json tools/runtime/blog-example-content.ts prepare /absolute/input.json /absolute/new-blog-manifest.json
API_SERVICE_URL=http://localhost:4000 npx dotenv -e apps/api/.env -- bun run --tsconfig-override ./tsconfig.base.json tools/runtime/blog-example-content.ts apply /absolute/new-blog-manifest.json --exclusive-maintenance
API_SERVICE_URL=http://localhost:4000 npx dotenv -e apps/api/.env -- bun run --tsconfig-override ./tsconfig.base.json tools/runtime/blog-example-content.ts verify /absolute/new-blog-manifest.json
bun test --tsconfig-override ./tsconfig.base.json tools/runtime/blog-example-content.test.ts
```

Prepare is read-only and refuses an existing manifest. Review its exact
retirement list and FK relation snapshots before apply. Keep other CMS writers
stopped through verify. The mode-0600 manifest records original versions,
server-assigned IDs and progress before each mutation; resume the same manifest
following an interrupted or unknown response. Repeat apply and a fresh prepare
must require zero writes.

The command checks the protected Article's subscription associations and full
Website Builder/File closure before writes and before retirement. Those records
remain unchanged. It creates real cover, author, avatar, category and Widget
relations and reads them back before deleting the eight explicit Articles.
Retirement refuses saved Website Builder/File associations that would leave
content orphaned. Product cross-promotion relations may cascade while their
Products remain. It never deletes Profiles, Files, Products or Website Builder
records. Existing role-bound GET permissions abort; missing selected author GET
permissions are additive and their anonymous reads are verified. Article
retirement has no automatic rollback; retain the before manifest and inventory.

For the researched local dataset, old Article
`abd1a6da-b3e0-4051-92b4-403829dfd81b` has public WB association
`8264f0d8-e472-42e6-aa17-0300c0b56553` to Widget
`802f309b-cd1e-43f7-a844-b03e95b67ba5`. Back up and inspect that root's incoming
and outgoing relations through SDKs. Resolve it through a separate explicit
content operation before prepare; delete the old root only when it is owned
exclusively by the retired example. Keep shared roots and descendants. The
publication command does not perform this cleanup. Its selected protected-graph
snapshot complements the deployed resource and media write guards; those guards
also reject public reuse of any other protected graph or byte-path alias.

## Platform example content

`platform-example-content.ts` applies an explicit saved-content graph for the
Framework shell, About, Authors, article form and curated catalog. It uses the
same SDK adapter and resumable operation engine as the Widget cutovers.

The `sps.platform-example-input.v1` input contains ordered `targets` with a unique
`key`, an entity, an exact selector and writable `data`. Existing targets may
also name their exact `id`. A `{"$ref":"earlier-key"}` value selects the actual
ID of an earlier target. The command records server-assigned IDs before writing
child relations. Mark an existing consumer with `switch: true` to update it
only after the additive records and links have read back. One record may have
only one target. Mark security configuration `retainOnRollback: true` when its
protection must survive a visual rollback.

`protectedSelections` is required. Each entry names an entity and exact equality
filters; an empty selector observes the whole collection. Preparation records
all matching rows, including an empty result. Apply verifies these collections
before writes, before switching existing consumers and after publication.
Observe the relevant Orders, Invoices, grants, balances, subscription references
and protected content graph. A protected record cannot also be a write target.
The private manifest can contain operational data; keep it out of Git and issue
attachments.

Targets marked `requiresCommercialConfirmation` require an explicit source,
Pro period and positive price, token-rate and pack values in
`commercialConfirmation`. Supply confirmed terms rather than placeholder prices.
The tool records this input; it does not infer a subscription period or invoke
checkout, fulfillment or token grants.

```sh
API_SERVICE_URL=http://localhost:4000 npx dotenv -e apps/api/.env -- bun run --tsconfig-override ./tsconfig.base.json tools/runtime/platform-example-content.ts prepare /absolute/input.json /absolute/new-before-manifest.json
API_SERVICE_URL=http://localhost:4000 npx dotenv -e apps/api/.env -- bun run --tsconfig-override ./tsconfig.base.json tools/runtime/platform-example-content.ts apply /absolute/new-before-manifest.json --exclusive-maintenance
API_SERVICE_URL=http://localhost:4000 npx dotenv -e apps/api/.env -- bun run --tsconfig-override ./tsconfig.base.json tools/runtime/platform-example-content.ts verify /absolute/new-before-manifest.json
API_SERVICE_URL=http://localhost:4000 npx dotenv -e apps/api/.env -- bun run --tsconfig-override ./tsconfig.base.json tools/runtime/platform-example-content.ts rollback /absolute/new-before-manifest.json --exclusive-maintenance
bun test --tsconfig-override ./tsconfig.base.json tools/runtime/platform-example-content.test.ts
```

Stop other CMS writers, billing jobs, webhook callbacks and authentication writes
for this local origin before exclusive maintenance, through final verify. The
flag acknowledges this window; it does not disable API jobs or provide a
transaction across HTTP calls. A running API without watch can still process
cron and webhook calls. Changes observed during the window abort publication.

Prepare reads APIs and creates a new mode-0600 manifest. Apply persists progress
around every mutation and refuses stale versions or ambiguous create recovery.
Resume the same manifest after an unknown response. Repeat apply and a fresh
prepare require zero writes. Rollback restores only changed existing records;
additive records and retained security configuration remain. Keep the original
manifest and deploy matching application code when restoring old variants.

## Page SEO publication

`page-seo.ts` fills existing Host Pages through their owning SDKs. An explicit
`sps.page-seo-input.v1` input defines each URL/language, editable Metadata fields
and a cover asset key. Every saved Page must have a definition; extra definitions
allow the same input to cover installations with different optional templates.
Static Metadata may contain literal localized copy; dynamic Metadata uses square
masks. An optional `page` object changes only that Page's title/description.

Assets name WebP files relative to the input, their SHA-256 and alt text. The
command verifies bytes before mutation, uploads Files with a stable content-based
slug, links Metadata→File and then Page→Metadata with explicit ordering. Existing
editorial Metadata and relations remain available. A matching selected Metadata
is reused; unchanged repeat publication creates no records. Private Pages retain
their indexing/access policy. No permissions, content entities or seed snapshots
are changed.

```sh
API_SERVICE_URL=http://localhost:4000 bun --env-file=apps/api/.env --tsconfig-override tsconfig.base.json tools/runtime/page-seo.ts prepare /absolute/input.json /private/tmp/page-seo-local.json
API_SERVICE_URL=http://localhost:4000 bun --env-file=apps/api/.env --tsconfig-override tsconfig.base.json tools/runtime/page-seo.ts apply /private/tmp/page-seo-local.json
API_SERVICE_URL=http://localhost:4000 bun --env-file=apps/api/.env --tsconfig-override tsconfig.base.json tools/runtime/page-seo.ts verify /private/tmp/page-seo-local.json
```

Remote use requires HTTPS and `--allow-api-origin` equal to `API_SERVICE_URL`.
Prepare records originals in a mode-0600 manifest. Keep this private manifest
outside Git. Apply persists each create before and after the request; resume the
same manifest after interruption. An unknown Metadata/link create is recovered
only when exactly one new matching record exists; otherwise the command stops
for inspection. Avoid concurrent CMS edits during publication. Rollback restores
changed Page fields and removes only its new Page links after checking for edits;
additive Metadata and Files remain stored. Deploy first, then prepare/apply/verify
against the target database so startup seeding is included in the inventory.
