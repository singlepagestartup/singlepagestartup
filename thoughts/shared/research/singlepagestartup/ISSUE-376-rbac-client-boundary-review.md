# ISSUE-376: bounded RBAC client/server source review

Verdict: **no confirmed unsafe client-to-server implementation import in the
reviewed entrypoints**. This is a source review, not acceptance of the compiled
browser bundle or an explanation of measured machine temperature. No source
implementation, API data, build configuration or process was changed by this
reviewer. No compiler, type checker, test or server was run.

Root's production attempt reached Webpack's compiled result in about 88 seconds,
then root stopped the processes during type checking because the computer was
hot. That attempt is **not a completed production build PASS**. Root owns the
process/resource observations appended to this checkpoint.

## Entrypoints

The source review starts at:

- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/account/client.tsx`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/blog-module/article/create-default/client.tsx`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/ecommerce-module/product/card-default/client.tsx`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/ecommerce-module/product/overview-default/client.tsx`
- `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/blog-module/article/create.ts`
- `libs/shared/frontend/client/api/src/lib/provider/index.tsx`

The review follows their public SDK/model exports, authentication reader,
shared reader/default dispatch, current author SDK transport and relevant
shared helpers. A bounded static source walk first reached its 3000-entry
limit. The already-dispatched normalized follow-up completed with 5466 unique
project files, 76 `use server` boundaries and no remaining direct server-only
or Node builtin candidate. No further traversal followed root's stop request.
Those counts describe source reachability, not emitted browser modules or
executed requests. The walker does not resolve external dependency internals,
every dynamic import, bundler condition or TypeScript's complete type graph.

## Established distinctions

The Account/editor client views import SDK hooks and ordinary UI helpers; no
direct `fs`, PostgreSQL connection, `next/headers`, backend service/controller or
server-only implementation was found in these changed views. The editor's
schema import is a shared Zod input validator.

The Article client SDK really imports Subject `sdk/server`, and authentication
and author hooks follow the same pattern. These server SDK modules are plain
HTTP transports using fetch and response helpers; the examined transport
entrypoints have no `use server`, `server-only`, Node filesystem, database
connection or Next headers dependency. Client hooks select `clientHost` and
browser authorization headers. The directory name alone does not make that
import an RSC violation.

SDK model exports lead to Drizzle table/schema constructors. In the reviewed
path they do not import the repository's database connection or migration
configuration. Type-only imports are erased at runtime; mixed model barrels can
still enlarge compiler/type reachability without proving a database client is
in the browser.

The shared Query Provider is a `use client` React Query/consistency provider.
Server composers may wrap already-rendered JSX children with that provider.
That JSX slot does not cause the client to import the server implementation.
Likewise, a neutral `Component.tsx` without a directive inherits the graph of its
importer; its filename is not evidence that a Client Component imported an RSC.

Shared default dispatch imports both readers and selects by `isServer`; props
mode removes SDK/Provider bindings before rendering the loaded view. Shared and
local `server.tsx` readers carry `use server` plus `server-only`. When reachable
from a client graph, that directive defines an action entrypoint rather than
bundling its server body. The examined client call sites use `isServer=false`.
No invocation of those readers as client-side RSC implementations was established.
This does not accept arbitrary function props crossing an RSC boundary.

Shared utility barrels also export server environment symbol names. The new
client operations examined here do not use secret symbols. No literal secret
value or explicit Next configuration copying secrets to the client was found
in this scope. This source observation is not a compiled-asset secret scan.

## Source expansion and remaining limits

`me/ecommerce-module/product/card-default/Component.tsx:1` imports the public
Subject component to dispatch its cart/checkout actions. That public entrypoint
loads the effective variant registry, including account, authoring, admin and
AI Chat variants and their reader indexes. The new editor imports ordinary
public Category/SDK entries; the SDK client registry similarly composes many
operation leaves. These broad registries are an established source expansion
path. They are not evidence of repeated data fetching, Node execution in the
browser, infinite compilation or the cause of this thermal incident.

Root separately corrected the Blog provider/public barrel cycle. This reviewer
made no duplicate fix and did not restart a compiler to measure that change.
The public review found that cycle; root reports replacing the broad dependency
with an existing-tsconfig narrow alias, changing two imports and removing the
new broad reexports. This checkpoint records that correction with attribution;
the static RBAC walk does not establish its compiled impact.
Any narrower-import correction must retain effective startup selection, public
variant dispatch and the existing RSC/JSX contracts; replacing the application
with client-only loading is not supported by this review.

Compiled module/chunk contents, actual tree-shaking, server-action
serialization, browser behavior and measured compiler/type-check memory remain
unverified here. No unsafe-import finding is promoted from the source expansion
alone. Publication remains held by root while the bounded audits are reconciled.
