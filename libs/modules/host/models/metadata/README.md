# Host Metadata Model

Metadata stores editable SEO fields in the database. Pages select it through
`pages-to-metadata`; covers use `metadata-to-file-storage-module-files`.

## Resolving a page

`api.generatePageSeo({ url, language?, page?, metadataDraft? })` returns Next.js
`metadata`, `structuredData` and mask `diagnostics`. Host uses `api.resolvePageSeo(url, language)` to share the resolved Page and
SEO within one server render. Public reads use the shared finite Next cache and dependency invalidation.
Pass `options: { cache: "no-store" }` for an uncached read; metadata drafts always
bypass caching. `api.generate` is the compatibility adapter returning
only Next.js metadata. Neither operation writes generated text to the database.

The first visible linked Metadata wins, sorted by relation `orderIndex`, then
relation ID. Fields from multiple linked records are not merged. For each title
or description the fallback order is: selected Metadata mask/literal → entity
`metadata.seo` → localized entity content → meaningful Page field → primary
Metadata → environment default. `Page` and `Description` are ignored as defaults.
A literal title intentionally overrides the entity title. Pagination receives a
page-number suffix. API failures propagate; only missing data/mask errors use
fallbacks. Hidden Page or main entity returns 404.

## Masks

Use the URL constructor's collection names inside square brackets:

```text
[blog.articles.title] — Example
[ecommerce.products.shortDescription]
[social.profiles.metadata.seo.keywords]
[blog.articles>blog.articles-to-file-storage-module-files>file-storage.files.file]
```

Roots must resolve from the current route's exact ID or slug. Related values
require an explicit supported relation chain, with at most four hops. There is
no unfiltered global model lookup. Only allowlisted public fields and
`metadata.seo.title`, `.description`, `.keywords` are readable. Localized values
use only the requested language; rich text becomes plain text. Missing values,
unknown fields and invalid syntax invalidate the whole field and appear in
preview diagnostics; unresolved masks never reach HTML. Plain literals remain
valid. Old `{title}` / `{description}` syntax is not supported.

Supported roots are Blog Article/Category, Ecommerce Product/Category, Social
Profile and File Storage File. Relations currently cover article/product/profile
files, Metadata files, Profile–Article, Blog Category–Article and Ecommerce
Category–Product. Required nested route associations must be visible. An absent
optional file falls back without hiding the article.

## Covers, author and structured data

`opengraphImage` and `twitterImage` are text fields accepting a mask or URL.
Open Graph uses the explicit image, then the first visible image linked to the
selected Metadata, then the primary Metadata's cover. Twitter falls back to
Open Graph. Files and links marked `hidden` are skipped; MIME must be an image.
Dimensions and alt accompany linked images. URLs become absolute public URLs.
No cover means no image tag. Favicon is never used as a cover.

`author` accepts a real author name or mask. A Profile–Article link does not
establish authorship. HTML may contain an explicit author; JSON-LD omits an
unverified Person/Organization type. BlogPosting, Product and CollectionPage
use actual localized entity content and entity images, not site-wide fallback
covers. Dates, offers, ratings, reviews and breadcrumbs are not invented.
Basic Product markup alone does not establish eligibility for rich results.
Host escapes JSON-LD before serializing it into a script.

Canonical uses the public Host origin and localized pathname, omitting tracking
queries/fragments. Content-changing query parameters require a project-specific
canonical policy. Hreflang is omitted until equivalent translations are known.
Private/unsupported routes get noindex without loading entity SEO content.
They still use their linked Metadata and cover. On private routes, masks may
read only the current Page, selected Metadata and its cover relation; masks
for personal entities use the ordinary field fallback and report a diagnostic.

## Editing and compatibility

Both admin form generations expose mask fields, cover links and read-only draft
preview for a concrete public URL and language. The preview calls Host
`POST /api/seo-preview` through the Metadata client SDK; it never saves the draft,
returns no-store/noindex, and rejects hidden/private pages. Studio has a fixture
preview and localized JSON editors for Article, Product and Profile.

All existing text fields remain stored: title, description, keywords, author,
viewport, Open Graph title/description/URL/type/site name/locale and Twitter
card/site/creator/title/description/URL/domain/app-country. Image fields are new.
`default`, `primary` and `hidden` are record variants. Admin variants remain
available for managing these records.

Legacy `viewport` remains in the database but is deprecated; Next.js supplies
one responsive viewport with zoom enabled. Legacy Twitter URL/domain/app-country
and unsupported card/type values do not create head tags. Check existing custom
viewport values before rollout. Author and keywords are omitted when absent.
