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
encoded pathname segments. ID/slug lookups target the exact entity. Hidden Page,
main entity or required nested association means 404. Unknown masks are rejected.
The map is not stored. Queries and fragments are not route parameters.

Host leaf compositions use Page `variant="url-segment-values"` callbacks and
pass explicit IDs/slugs to domain components. Keep the complete map in that
callback. The scalar `url-segment-value` API remains compatible. Client lookup
keys include language and URL; unresolved pages return undefined, static pages
return an empty map. Missing keys remain undefined.

`default` composes the page; `hidden` renders nothing and is unavailable as a
public route. `find`, `find-by-url`, both URL readers and both admin generations
retain their ordinary roles. Admin reads explicitly request `includeHidden=1`.

## Visibility and caching

`indexing="auto"` applies the public/private route policy. `noindex` keeps a page
accessible but removes it from search candidates and emits noindex. `hidden`
takes precedence and returns 404. Hidden optional widgets/files/links suppress
only their element. Hidden is publication state, not a replacement for RBAC.

Shared REST reads exclude hidden before pagination/count. Operator reads may
include it; editor reads use `includeHidden=1` and require the collection's POST
permission. `publicOnly=1` enforces visible data even with privileged credentials.
Administrative reads bypass the legacy anonymous HTTP cache. Public browser
readers request publicOnly and do not reuse admin query keys.

HTTP cache excludes dependent Page operations `find-by-url`, `url-segment-value`
and `urls`. Public Host routes use on-demand ISR with a one-hour route TTL.
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

Anonymous `GET /api/host/pages/urls` lists public candidates with saved Page
language. It excludes hidden/noindex Pages and private routes before expansion.
Supported public masks cover Blog, Ecommerce and Profile ID/slug routes and
pagination. Nested associations must exist and be visible. Values are encoded;
hidden records are removed before pagination. Unknown masks are not enumerated.
Public enumeration sends no admin credential or session. Unauthorized collections
are omitted; temporary failures propagate. The enumeration safety cap is one
million candidates, not the per-file sitemap limit.

Host `/sitemap.xml` uses the standard sitemap namespace, absolute public URLs,
supported saved languages and deterministic deduplication. It emits a urlset or
an index of `/sitemap.xml?part=N` chunks, each within 50,000 URLs and 50 MiB.
Invalid chunk numbers return 404. API failure returns no-store HTTP 503 with
Retry-After; a successful empty collection is a valid empty sitemap. No dates
or hreflang alternatives are inferred from timestamps/configuration alone.

Pagination sizes must be positive safe integers. Page 1 uses the unnumbered
URL; subsequent pages keep separate canonical URLs. Locale redirects use 308.
Robots publishes Yandex Clean-param for known tracking fields. Content selectors
such as segment, intent and offer remain significant; projects whose query
changes indexable content must define its canonical policy. Accessible private
pages stay crawlable so robots can observe noindex.

Before migration, audit saved Page languages and duplicate `(url, language)`
values. A default language value does not prove the content is translated.
