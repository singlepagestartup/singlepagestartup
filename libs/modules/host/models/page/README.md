# Host Page Model

Pages own localized URL masks and compose layouts, widgets and Metadata through
explicit relations. Fields are `id`, `title`, `description`, `url`, `language`,
`indexing`, `variant`, `className`, `adminTitle`, `createdAt` and `updatedAt`.
The database enforces uniqueness of `(url, language)`.

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
and `urls`. Host currently renders the catch-all per request: its root checks
locale and existence before streaming, and its admin/session compositions read
request state. Production verification exposed DYNAMIC_SERVER_USAGE when an ISR
fallback tried these reads. Page/SEO SDK reads use no-store; ordinary public
API reads keep their existing generation-checked caching and invalidation.
Any future return to ISR must preserve true 404, session isolation and immediate
hidden transitions in a built Host, not just in development.

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
