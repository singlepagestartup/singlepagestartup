# Host Page Model

Pages own localized URL masks and compose layouts, widgets and Metadata through
explicit relations. Fields are `id`, `title`, `description`, `url`, `language`,
`indexing`, `variant`, `className`, `adminTitle`, `createdAt` and `updatedAt`.
The database enforces uniqueness of `(url, language)`.
Seed reconciliation uses the same URL/language identity. Snapshots without a
language use the database column default (`en`), preserving other localized Pages
and the IDs referenced by their relations.

## Route lookup

`findByUrl({ url, language })` selects the exact language (defaulting to the
configured default language), then tries static pages before dynamic masks.
It returns `IResolvedPage`: the saved Page and a computed `routeParams` map.
Keys are complete placeholders such as `blog.articles.slug`; values retain
encoded pathname segments. Field lookups target exactly one entity. Hidden
or draft Pages return 404. Dynamic values are resolved through the registered API
source used by the Page URL constructor. Unknown sources/masks are rejected.
The map is not stored. Queries and fragments are not route parameters.

Host leaf compositions use Page `variant="url-segment-values"` callbacks and
pass explicit IDs/slugs to domain components. Keep the complete map in that
callback. The scalar `url-segment-value` API remains compatible. Client lookup
keys include language and URL; unresolved pages return undefined, static pages
return an empty map. Missing keys remain undefined.

`default` composes the page; `hidden` renders nothing and is unavailable as a
public route. `find`, `find-by-url`, both URL readers and both admin generations
retain their ordinary roles. The hidden view is selected through the ordinary
variant registry; shared readers do not suppress records by their saved variant.

## Visibility and caching

Publication and indexing use the persisted Page.variant:
default and project presentation variants are indexable, noindex keeps the
Page accessible but excludes it from sitemap, and hidden returns 404.
Legacy draft records also return 404. The old indexing column is retained
for schema compatibility and is not a second policy input. Migrate existing
publication choices to Page variants before rollout. Hidden remains publication
state rather than an authorization boundary.

Shared REST reads, counts and ID lookups use the requested filters without
assigning access rules to variant names. Authorization, ownership and output
schemas remain independent of presentation variants. Administrative reads use
the same SDK contracts and the caller's credentials.

The API response cache tracks the actual dependencies of Page operations,
including dynamic URL sources. Public Host routes use on-demand ISR with a one-hour route TTL.
The locale is a `[language]` route parameter; layouts do not read headers or
session cookies. The separately routed admin remains request-rendered.

The `document` Page variant is a server reader for `Metadata.resolvePageSeo`.
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

Existing installations must audit saved Page languages before rollout. A legacy
`en` template used by old `/ru` routes needs an explicit localized Page and copied
Page–Widget/Layout/Metadata links; exact language matching never guesses that
content has been translated. Preserve shared content IDs and keep hreflang absent
until equivalent localized content is verified.

## Sitemap and robots

Anonymous `GET /api/host/pages/urls` lists candidates with saved Page language.
It excludes hidden/draft/noindex Pages before expansion. A generic mask cannot
reintroduce a URL owned by a higher-priority excluded Page in the same language.
Page URL masks expand registered API model fields and pagination. Sources come
from the same module registry used to mount apps/api, so adding a registered
model does not require an SEO allowlist. API data is read anonymously through
its public contract, without operator credentials. Permission errors omit an
unavailable enumeration; temporary failures propagate. The enumeration safety
cap is one million candidates, not the per-file sitemap limit.

Host `/sitemap.xml` uses the standard sitemap namespace, absolute public URLs,
supported saved languages and deterministic deduplication. It emits a urlset or
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

Before migration, audit saved Page languages and duplicate `(url, language)`
values. A default language value does not prove the content is translated.
