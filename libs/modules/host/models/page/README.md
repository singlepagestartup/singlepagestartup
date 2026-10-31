# Host Page Model

Pages own URL masks and compose layouts, widgets and Metadata through explicit
relations. One record serves all configured presentation languages. The database
keeps URL unique. `metadata` is the same JSON container used by other content
models; `metadata.seo.title` and `metadata.seo.description` can hold language maps
referenced by explicit Metadata masks. Legacy text fields remain fallback values.
The old `language` column is retained for compatibility and has no routing,
publication or indexing role. Seed reconciliation uses URL alone.

## Route lookup

`findByUrl({ url })` tries static pages before dynamic masks. The HTTP handler
accepts a bare or locale-prefixed path and removes a supported locale prefix.
The owning service resolves the resulting path independently of language.
It returns `IResolvedPage`: the saved Page and a computed `routeParams` map.
Keys are complete placeholders such as `blog.articles.slug`; values retain
encoded pathname segments. Field lookups target exactly one entity. Hidden
or draft Pages return 404. Dynamic values are resolved through the registered API
source used by the Page URL constructor. Unknown sources/masks are rejected.
The map is not stored. Queries and fragments are not route parameters.

Host leaf compositions use Page `variant="url-segment-values"` callbacks and
pass explicit IDs/slugs to domain components. Keep the complete map in that
callback. The scalar `url-segment-value` API remains compatible. Client lookup
keys include the requested URL; unresolved pages return undefined, static pages
return an empty map. Missing keys remain undefined.

`default` composes the page; `hidden` renders nothing and is unavailable as a
public route. `find`, `find-by-url`, both URL readers and both admin generations
retain their ordinary roles. The hidden view is selected through the ordinary
variant registry; shared readers do not suppress records by their saved variant.

## Visibility and caching

Publication and indexing use the persisted Page.variant:
default and project presentation variants are indexable, noindex keeps the
Page accessible but excludes it from sitemap, and hidden returns 404.
Legacy draft records also return 404. Page.variant is the only publication and
indexing input. Hidden remains publication state rather than an authorization
boundary.

Shared REST reads, counts and ID lookups use the requested filters without
assigning access rules to variant names. Authorization, ownership and output
schemas remain independent of presentation variants. Administrative reads use
the same SDK contracts and the caller's credentials.

The API response cache tracks the actual dependencies of Page operations,
including dynamic URL sources. Public Host routes use on-demand ISR with a one-hour route TTL.
The locale is a `[language]` route parameter; layouts do not read headers or
session cookies. The separately routed admin remains request-rendered.

The `document` Page variant is a server reader for `Page.resolvePageSeo`.
It resolves existence and SEO before rendering saved Page content or a Suspense
boundary. The route supplies only the path and locale. Metadata and document
share one React request cache; this is separate from the persistent ISR cache.
The root loading boundary is omitted so a missing Page returns HTTP 404.
Global errors and unmatched routes have standalone fallback documents.

Anonymous Page/Metadata SDK reads use the shared finite Next cache and consistency
tags. Nested API reads contribute their dependencies to the existing consistency
context. Committed mutations invalidate those tags before notification delivery;
this also covers captured direct database writes. Invalidation is asynchronous,
so public ISR has an eventual propagation window and the TTL is its fallback.
Authorization/Cookie reads and draft previews use no-store. Current-Subject
controls remain in client compositions; personalized data must never be added
to the public document reader. A warm page can serve cached HTML during an API
outage; a cold failed read remains a server error rather than a false 404.

## SEO operations

The Page server SDK owns these operations.

`api.generatePageSeo({ url, language?, page?, metadataDraft? })` returns Next.js
`metadata`, `structuredData` and mask `diagnostics`. Host uses
`api.resolvePageSeo(url)` to share the resolved Page and SEO within one
server render. Public reads use the shared finite Next cache and dependency invalidation.
Pass `options: { cache: "no-store" }` for an uncached read; metadata drafts always
bypass caching. `api.generate` is the compatibility adapter returning
only Next.js metadata. Neither operation writes generated text to the database.

The first linked Metadata wins, sorted by relation `orderIndex`, then
relation ID. Fields from multiple linked records are not merged. For each title
or description the fallback order is: linked Metadata mask/literal
→ meaningful Page field → primary Metadata → environment default. Entity
metadata is read only when an explicit mask requests it; it does not override
the Page's linked Metadata automatically. Pagination receives a page-number
suffix. Hidden or draft Page returns 404; Page.variant alone controls indexing.
Source failures propagate; invalid/missing mask values use fallback and produce
preview diagnostics.

Public rendering uses `GET /api/host/pages/seo?url=...` on apps/api.
A supported prefix such as `/en/about` selects the rendering language; `/about`
uses `internationalization.defaultLanguage.code`. No language query parameter
is sent. The Page service selects the Page, reads
PagesToMetadata, and resolves the selected Metadata through its public SDK.
It uses the same configured RoutingService as URL lookup for mask context.
Metadata retains its ordinary CRUD service and file relations.

`POST /api/host/pages/seo-preview` accepts a concrete URL and unsaved
Metadata values. The Page service checks publication and resolves the draft
without saving. Preview returns no-store/noindex, accepts accessible noindex
Pages and rejects hidden/draft or missing Pages. The middleware excludes this
read-only POST from mutation invalidation.

The Page client SDK exposes `previewSeo`; the Page server SDK exposes
`resolveSeo`, `previewSeo` and the Next adapters above. Next adapters restore
metadataBase as a URL and map HTTP 404 to notFound. Public reads contribute
their actual consistency dependencies to the aggregate API cache and Next tags.
Host has no separate SEO API route.

## Sitemap and robots

Anonymous `GET /api/host/pages/urls` lists language-neutral candidates from Page.
It excludes hidden/draft/noindex Pages before expansion. A generic mask cannot
reintroduce a URL owned by a higher-priority excluded Page in any presentation language.
Page URL masks expand registered API model fields and pagination. Sources come
from the same module registry used to mount apps/api, so adding a registered
model does not require an SEO allowlist. API data is read anonymously through
its public contract, without operator credentials. Permission errors omit an
unavailable enumeration; temporary failures propagate. The enumeration safety
cap is one million candidates, not the per-file sitemap limit.

Host `/sitemap.xml` uses the standard sitemap namespace, absolute public URLs,
configured languages and deterministic deduplication. Each candidate expands to
those configured URL prefixes without creating more Page records. It emits a urlset or
an index of `/sitemap.xml?part=N` chunks, each within 50,000 URLs and 50 MiB.
Invalid chunk numbers return 404. API failure returns no-store HTTP 503 with
Retry-After; a successful empty collection is a valid empty sitemap. No dates
or hreflang alternatives are inferred from timestamps/configuration alone.

Pagination sizes must be positive safe integers. Page 1 uses the unnumbered
URL; subsequent pages keep separate canonical URLs. Locale redirects use 308.
Robots publishes the absolute sitemap URL and allows crawling so a crawler can
read each Page's noindex response. It has no application URL exclusions or
universal query-parameter cleanup policy. Host serializes the candidates supplied
by Page API without applying another URL-prefix filter.

## Migrating language-specific copies

For an installation with the earlier URL/language duplicates, apply the additive
JSON migration first, consolidate data, then restore URL uniqueness. Keep CMS
writers stopped during this maintenance window. See
[Page consolidation](../../../../../tools/runtime/README.md#page-language-consolidation).
The tool retains original Page IDs and before-images, checks equivalent Widget/
Layout associations, preserves translated literal SEO copy in Page JSON, and
keeps dynamic Metadata masks. Conflicting compositions stop preparation.
Legacy Metadata/File records remain available; seed snapshots are not rewritten.

## Route source composition

Host receives serializable resource descriptions through each connected
module's describeRoutes contract. Entity apps delegate to their controllers,
services and repositories; only the owning repository inspects its table.
Descriptions contain column names and foreign-key references, not Table objects
or repository instances. Host connects them to Page through its controller. The API entrypoint only calls hostApp.configureRouting(apiModules).
New module app overrides and generator output must preserve describeRoutes.
