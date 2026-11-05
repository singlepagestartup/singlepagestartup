# SPS frontend components

Read this contract before changing a production frontend variant or reviewing
its client/server composition. It governs model and relation variants under
`libs/modules` and their composition in Host. Public type, variant, registration
and naming rules also apply to presentation variants in `apps/studio/modules`;
Studio remains independent of production SDKs and database loading.

## Reuse the component template

Inspect a neighboring variant of the same kind and the applicable generator
template under
`tools/plugins/sps-generator-plugin/src/coder/root/libs/modules/[module]/`.
Keep its file roles and reader contract. The shared parent owns SDK selection,
record loading, Provider, Suspense and error handling where that template
provides them. Specialized reads use the local reader structure below.

For ordinary saved-record variants, bind the model SDKs and renderer to
`@sps/shared-frontend-components/singlepage/default`. Use the existing
`subject-default`, `find` or form template when its data contract applies.
Implement the view in `Component.tsx` and its interactive controls in an
optional `ClientComponent.tsx`.

For a custom operation without a record input, such as `authenticationMe`, use
`@sps/shared-frontend-components/singlepage/reader` as the Provider, Suspense and
error boundary. The variant's `index.tsx` selects its local `client.tsx` or
`server.tsx`; those readers own the SDK operation and supply typed loaded data
to `Component.tsx`. Reuse the owning module's session reader for authentication
instead of duplicating JWT/cookie handling in the variant's interactive view.
When a session is initialized in the browser, an absent server Subject keeps
the client reader mounted so it can observe that initialization. Pass explicit
UI inputs into this fallback; server request headers and SDK bindings stay on
the server.

## Variant files and registration

Keep each variant in its own folder in the owning `singlepage` or `startup`
layer. Its files have these roles:

| File                        | Responsibility                                                                                                                                                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `interface.ts`              | Export the literal `variant` name, `IComponentProps` for public inputs and `IComponentPropsExtended` for inputs plus loaded results. Describe request parameters and result types through the applicable SDK types and shared interfaces. |
| `index.tsx`                 | Wire the reader, SDKs, Provider and view through the applicable template. Select client/server execution here when the variant has local readers. An export-only entrypoint can be `index.ts`.                                            |
| `client.tsx`, `server.tsx`  | Optional local readers for specialized SDK requests; follow the rules below.                                                                                                                                                              |
| `Component.tsx`             | Render the view from typed props and loaded results; keep it server-compatible.                                                                                                                                                           |
| `ClientComponent.tsx`       | Optional interactive view with hooks, browser APIs and local UI state. It has a different role from the client reader.                                                                                                                    |
| `Skeleton.tsx`, `Error.tsx` | Loading and error views when the applicable template needs them.                                                                                                                                                                          |

Register the component in `variants.ts` of the layer where it is implemented.
The registry key must match its exported `variant` literal, and the layer's
`interface.ts` must include its public props in the variant union. Keep the
public entrypoint wired to the effective registry and type union: the root
registry merges `singlepage` first and `startup` second so project overrides
win. Follow a nested registry when the applicable template uses one.
A file that exists on disk but cannot be selected through the public
`variant` prop is incomplete.

Group current-Subject compositions under `singlepage/me/`, then the foreign
module, model and operation, for example
`me/ecommerce-module/product/card-default` and
`me/ecommerce-module/order/list/checkout-default`. Keep the public variant
literal independent of the folder path. Moving a variant does not require
renaming saved variant values. A `me` entrypoint owns the current Subject read;
its loaded view passes that Subject explicitly to lower actions. An already
loaded Subject uses `dataSource="props"` to avoid a second reader and Provider.
On cached Host pages, the composing Widget mounts current-user `me` variants
with `isServer={false}`. Public catalog readers can remain server-rendered.
A session server reader requires a request-rendered route: reading cookies
inside an ISR fallback can fail with `DYNAMIC_SERVER_USAGE`. Test the built
Host as well as dev when changing this boundary.

## Public types and import names

Declare public props and any public payload types in the owning `interface.ts`,
including types used by interactive views. A variant discriminator is its exact
literal, not `string`. Export the effective props contract from the public
interface; consumers must not depend on a private singlepage implementation for
its types. A startup override replaces the matching base registry entry and its
props contract. Type-check two variants with different required props and an
override that changes those props.

Name a same-module component after the model, such as `Identity`, and its SDK
`identityApi`. Name a foreign component with
module and model, such as `FileStorageModuleFile`; a foreign SDK alias includes
module and model, such as `fileStorageFileApi`. Relations and their loaded data
use the actual relation name, such as `OrdersToFileStorageModuleFiles` and
`ordersToFileStorageModuleFiles`. In client/server readers, alias the local view
as `ChildComponent`. Registry imports and story compositions use descriptive
names; numeric placeholders do not identify their responsibility.

Resource ID and slug props use the receiving component's module as their naming
context. Same-module resources omit the module prefix: an RBAC Widget accepts
`subjectSlug`. Foreign resources include `<module>Module<Model><Id|Slug>`:
`socialModuleProfileId`, `socialModuleChatId`, `socialModuleThreadId`,
`ecommerceModuleProductSlug`, `ecommerceModuleCategorySlug` and
`ecommerceModuleStoreSlug` in RBAC. Keep that name through public interfaces and
client/server forwarding within the module. Host's leaf Page render-reader selects
these explicit resource props, as described below.
Existing SDK payload and database field names retain their own contracts.

The same convention applies to whole foreign records: RBAC props use
`ecommerceModuleProduct`, `ecommerceModuleStore` and `ecommerceModuleOrder`.
The owning Subject's loaded result remains `data`.

## Specialized client/server readers

Local `client.tsx` and `server.tsx` are allowed when the variant needs data
interactions that the shared reader cannot express, such as additional SDK
requests, dependent reads or a custom SDK operation. Keep the same variant
folder and file roles; this does not require a different component layout.
A visual or interaction change alone continues to use the shared reader.

Before adding local readers, compare the needed requests with the shared
reader and a neighboring specialized variant. Record the SDK operations and
why the shared reader is insufficient in the change description. In
`interface.ts`, identify those operations through the request/result types or
an explanatory comment where their names are not apparent. Use exported SDK
`IProps`, `IResult` or existing model types; declare public request inputs and
the loaded fields passed to the view. Do not repeat SDK request/response shapes
as untyped objects.

- `client.tsx` uses the client SDK hooks and their loading/error states.
  `server.tsx` awaits the server SDK. Implement both paths when the variant
  supports both runtimes, and give the view the same typed result contract.
- Keep data requests in readers and SDKs. Interactive mutations use the client
  SDK in the interactive component or its established hook. Do not add raw
  fetches or a second data-fetching system in the visual component.
- Keep index wiring in the applicable template; do not introduce another
  Reader dispatcher between it and the local readers. When a template or
  generator conflicts with this contract, correct that source too.
- Preserve one owner for Provider and loading/error composition. Local readers
  replace the relevant shared reading behavior; do not wrap an unchanged shared
  reader in another copy of its Provider or duplicate its requests. A visual
  component must not repeat a reader query or use a constant query function
  that prevents subsequent refetch from loading current data.
- Preserve the module dependency order, explicit client-boundary props, query
  subscriptions and mutation cache handling. Specialization changes which SDK
  operations run, not those contracts.

An existing local-reader example is the RBAC Subject variant at
`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/overview/default/`.
Its structure illustrates reader placement; apply the boundary and cache rules
in this contract when changing it or using it as a reference.

## Already loaded SDK results

When a parent reader already owns the current SDK result, use the shared
reader's `dataSource="props"` mode for a child presentation. Pass the loaded
record or collection through its typed public props. This mode performs no
second request and adds no Provider; the parent retains the React Query cache,
loading, error and subscription ownership. A refetch supplies the updated props.
Do not simulate a query with a constant query function or use this mode to
replace production SDK data with static fixtures. Reader bindings remain
inside the template and are removed before props reach the visual component.

## Explicit props at the client boundary

Keep `Component.tsx` server-compatible. Hooks, browser APIs and mutable UI state
belong in `ClientComponent.tsx`. At the JSX boundary between them, select public
UI props explicitly:

```tsx
export function Component(props: IComponentPropsExtended) {
  return <ClientComponent isServer={props.isServer} variant={props.variant} data={props.data} className={props.className} children={props.children} />;
}
```

The example's `children` is a rendered React node. Select only fields required
by the actual view; omit props that its interface does not declare.

Do not forward `{...props}`, a spread alias or a rest object from a shared
reader into a Client Component. Runtime props can include `api`, `clientApi`,
`serverApi`, `Provider`, `Component` and `Skeleton` constructors even when the
view's TypeScript interface does not list them. Destructuring these fields into
another object or casting that object does not make its functions serializable.
SDK bindings and reader implementation props stay inside their owning template.

Public event handlers are passed between components already executing in the
client subtree. Ordinary callbacks created on the server cannot cross into a
Client Component. Existing explicit Server Actions follow their own contract;
they do not make SDK objects or render callbacks valid boundary props.

## JSX slots for composition

A server parent can compose a server-rendered element and pass the resulting
React node into a Client Component:

```tsx
<ClientPanel toolbar={<ServerToolbar data={data} />} />
```

The client renders `toolbar` as a node. It does not import or invoke
`ServerToolbar`, call a server component as an ordinary function, or receive
`renderToolbar={() => <ServerToolbar data={data} />}` from the server.

Render callbacks such as the shared `find` variant's children are valid when
the producer and consumer execute on the same side of the boundary. Resolve a
server callback there before passing JSX to a client view; create client render
callbacks inside the client subtree.

Inside a file marked `"use client"`, nested SPS model and relation components
declared in that file use `isServer={false}`. A server composer must cross into
that client view through JSX first. Setting `isServer={false}` on a model
wrapper from a server composer does not by itself establish a safe boundary.

## Functional Widgets and presentation Widgets

A domain Widget owns the operation: principal and permission scope, SDK readers,
forms, mutations, loading and business state. A Website Builder Widget owns its
presentation: layout, editable copy, imagery and JSX slots. The higher domain
Widget composes its functional content into the lower presentation Widget's
`children` or another explicitly typed ReactNode slot. Website Builder does not
import the domain consumer. Forms, fields and domain entity rows may retain
their own UI inside those slots; the separation concerns Widget composition,
not moving every JSX element into Website Builder.

Static blocks may link directly from Host to Website Builder; presentation-only
interaction does not require a domain Widget. For blocks with domain behavior,
Host resolves the saved external module and Widget ID. The owning domain
Widget reads its explicit `widgets-to-website-builder-module-widgets` relation
with `variant="find"` and a `widgetId` filter, then uses the relation's `default`
renderer. That renderer loads the exact linked Website Builder record, renders
its saved variant with `dataSource="props"`, and forwards the locale and rendered
children. Relation identity, ordering and references stay in the relation.
Authentication, registration, project creation and support decisions stay in
Widget variants. A relation renderer must not switch on those screen names,
accept a business `mode`, select their forms or inject their copy and imagery.
Screen-specific unique indexes are not a substitute for Widget composition.
Authenticated chat list and overview pages target RBAC Widgets. Host forwards
their saved instance and explicit resource IDs; RBAC composes the
Subject operation into the linked Website Builder frame. Social model views
receive explicit resources or rendered children. Do not pass route-derived IDs
from Host down to a lower Widget only to return them through a render callback.
A render callback remains appropriate when the lower reader actually supplies
newly loaded data, provided it stays within one execution runtime.

Different operations use distinct domain Widget variants. Distinct layouts use
presentation variants; changing only stored copy or photographs does not require
a new domain variant. Several domain/presentation pairs may share a stateless
layout within the presentation model without a new relation variant. Public
registries, literal interfaces and singlepage/startup overrides apply to both
parts. Studio compositions expose the same ownership through public model
entries while retaining their independent fixtures and no production SDKs.

A specialized relation variant needs a documented behavior intrinsic to the
association that `default` cannot express. A page's appearance or business
scenario alone is insufficient. When changing existing composition, preserve
content and record IDs through a resumable SDK data flow, fork shared content
before giving scenarios independent variants, and verify repeat/rollback and
both client/server rendering. Never repair the graph through seed snapshots or
runtime global variant/slug searches.

## Resolved Page parameters

Host Page resolves a URL against its persisted mask once. Its find-by-url SDK
result includes computed `routeParams` keyed by full placeholder names such as
`social.chats.id`. The neutral `IRouteParams` type lives with the route utilities
in `@sps/shared-utils`: it is a readonly map whose missing keys are undefined.
This map is routing context, not a Page database field, entity data or
authentication state. The Host entrypoint removes locale before resolution and
forwards the locale separately.

The Host module adapter or navigation leaf reads the complete map with Page
`variant="url-segment-values"` and its render callback. Its client and server
paths call Page.findByUrl through the owning SDK; client readers share the URL
query and subscriptions. Keep the map inside that callback. Select full keys
there and pass explicit IDs or slugs directly to domain components. Page,
Widget, Layout and relation props do not carry `routeParams`.

Domain Widgets pass explicit resource props or loaded data to Content, client
views, models, forms and relation renderers. Check required values before issuing
reads; a missing ID or slug must not trigger an unfiltered query. Client views
retain explicit serializable props. Entity SDK arguments, query keys and mutation
payloads contain only that operation's actual resource/filter inputs.

Lower modules import the neutral route type and never Host Page components,
SDKs or private types. Host dispatches by external module and exact saved Widget
ID, renders the loaded record through the module's public variant registry and
`dataSource="props"`, and keeps no second registry of business screens. Where a
lower module needs a higher module's operation, expose a typed render slot or
ReactNode slot. Resolve render callbacks on the same side of the client/server
boundary before passing rendered JSX into a client view. Host may compose a
non-Widget Subject control directly with explicit inputs; presentation Widgets
receive rendered controls, not routing maps or authenticated SDK bindings.
Domain session wrappers and authenticated operations belong in RBAC, including
cart/checkout controls passed into Ecommerce presentation slots.

Use one map reader instead of nesting scalar readers for individual keys.
The scalar API remains a compatibility entrypoint using
the shared extraction logic. Preserve encoded path values, exact new map keys,
static-page empty maps and pagination defaults; only a pagination token may
default to the first page. URL parameters never establish the current Subject,
resource ownership or parent/child membership. Those checks remain in the
session reader and scoped backend operations. A change to Page lookup or its
cache dependencies requires its own route/404/cache verification.

## Client state, cache and realtime

Client data has separate owners:

- The model/relation SDK uses the shared React Query cache for API results.
  The standard API Provider keeps this cache in memory; it does not restore
  entity data from `sessionStorage`.
- `globalActionsStore` in `@sps/shared-frontend-client-store` is the Zustand
  runtime event log used by the query subscription pipeline. Its compact
  `sessionStorage` snapshot is for debugging, can omit large payloads and is
  not read back to hydrate the store. Do not render business entities from it
  or rely on it to restore a page after reload.
- Temporary controls, draft inputs and per-item pending state stay in the
  lowest owning client component or an established feature-state mechanism.
  A new persistent draft requirement needs an explicit storage/lifetime
  contract; the global event log does not provide that persistence.

The main realtime path is database capture → durable delivery journal → Host's
shared WebSocket → query consistency lifecycle → React Query invalidation and
authorized refetch. Query refs belong to the current principal and API host;
replay, renewable leases and batch version checks recover missed events.
Host records compact notification diagnostics in `globalActionsStore`; entity
data stays in React Query. The registry holds query metadata, not another
entity store.

Legacy events pass through `globalActionsStore` and SDK `subscription(...)`
using `meta.topics` or route fallback. Suppress them only for that query's
accepted, unexpired consistency ref. Keep legacy subscriptions and option
merging for uncovered or old servers. A variant uses this shared pipeline;
it does not open another revalidation WebSocket or add its own entity poll.

Factory SDKs provide mutation cache handling. Hand-written mutations retain
shared cache patching and internal success handling before consumer callbacks.
A local patch updates the acting client; journal reconciliation reaches other
clients and covers derived changes. Additional reads in specialized variants
follow the same contract. Query keys include every filter/page parameter and
principal; changing identity must not show the previous principal's data.

Keep existing data mounted during background fetching and transient errors.
An explicit 401/403 clears inaccessible entity data. Stable ID keys, memoized
rows and callbacks preserve drafts and focus. The chat scroll controller owns
the actual scroll container, retains a visible anchor while reading history,
and follows new content only when already at the end or explicitly requested.

Read `libs/shared/frontend/client/api/README.md` for query/mutation contracts,
`libs/shared/frontend/client/store/README.md` for event storage, and
`libs/middlewares/src/lib/revalidation/README.md` for backend broadcasts and
cache ordering.

## Implementation and review checks

- Check the required file roles, literal variant name, owning layer registry,
  public props union and public component route. Exercise the variant through
  that entrypoint so a missing registration cannot pass as a working view.
- Compare the wrapper with its applicable template. For local readers, verify
  the reason for specialization, SDK input/result types and supported runtime
  paths; check whether Provider, loading ownership or requests are duplicated.
- For current-Subject variants, check the `me/<module>/<model>/<operation>`
  folder grouping and trace the loaded Subject from its reader to the view.
  A pure foreign-model wrapper without a Subject read does not belong in a
  Subject `me` variant. Check module-qualified props for foreign records.
- Trace API data through React Query, realtime events through the shared store
  and SDK subscriptions, and persistent UI state through its explicit storage
  contract. Check cache patching and cross-client reconciliation for affected
  queries, including additional reads in specialized variants.
- Trace the runtime props reaching each Client Component, including objects
  added by a parent reader. Check every ordinary function prop's producer and
  consumer, and verify that slots carry nodes rather than server render callbacks.
- For a boundary regression, exercise the public component through its real
  shared reader. Verify loaded data and the absence of SDK bindings in the
  client view props. A test that calls only the visual component skips that path.
- Run the relevant type checks and tests, then open the affected Host route and
  exercise its controls. Inspect browser and server errors for serialization,
  hydration and server/client import failures. Dev-server `Ready`, HTTP 200 or
  a TypeScript pass alone does not establish successful RSC rendering.

Record the verified route and behavior, or the concrete runtime verification
gap. A reviewer reports a violation with its triggering path and consequence
under the review workflow's evidence rules.
