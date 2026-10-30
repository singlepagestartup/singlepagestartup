# Host Metadata Model

Metadata stores editable SEO fields in the database. Pages select it through
`pages-to-metadata`; covers use `metadata-to-file-storage-module-files`.

## Resolving a page

`api.generatePageSeo({ url, language?, page?, metadataDraft? })` returns Next.js
`metadata`, `structuredData` and mask `diagnostics`. Host uses
`api.resolvePageSeo(url, language)` to share the resolved Page and SEO within one
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

## Masks

Use the URL constructor's collection names inside square brackets:

```text
[blog.articles.title] — Example
[ecommerce.products.shortDescription]
[social.profiles.metadata.seo.keywords]
[blog.articles>blog.articles-to-file-storage-module-files>file-storage.files.file]
```

Roots must resolve from an exact field value in the current route. Related values
require an explicit supported relation chain, with at most four hops. There is
no unfiltered global model lookup. Fields must be present in the anonymous API
response; inherited properties and prototype paths are rejected. Localized values
use only the requested language; rich text becomes plain text. Missing values,
unknown fields and invalid syntax invalidate the whole field and appear in
preview diagnostics; unresolved masks never reach HTML. Plain literals remain
valid. Old `{title}` / `{description}` syntax is not supported.

Roots resolve from the current Page's URL values, current Page or selected
Metadata. Registered API model contracts supply public fields. Relation keys
come from the registered database foreign keys, rather than an SEO-specific
relation list. Ambiguous associations produce a diagnostic. Related data and
publication state do not define an independent SEO policy.

## Covers, author and structured data

`opengraphImage` and `twitterImage` are text fields accepting a mask or URL.
Open Graph uses the explicit image, then the first visible image linked to the
selected Metadata, then the primary Metadata's cover. Twitter falls back to
Open Graph. MIME must be an image. Record and relation variants do not implicitly
filter the API result; selection constraints use ordinary query filters.
Dimensions and alt accompany linked images. URLs become absolute public URLs.
No cover means no image tag. Favicon is never used as a cover.

`author` accepts a real author name or mask. A Profile–Article link does not
establish authorship. HTML may contain an explicit author; JSON-LD omits an
unverified Person/Organization type. The generic WebPage JSON-LD uses the calculated
Page title, description, canonical and cover. The resolver does not infer BlogPosting, Product or authorship
from a model name. Host escapes JSON-LD before serializing it into a script.

Canonical uses the public Host origin and localized pathname, omitting tracking
queries/fragments. Content-changing query parameters require a project-specific
canonical policy. Hreflang is omitted until equivalent translations are known.
Page variants govern inclusion in sitemap and robots metadata. Metadata masks
read public API data without carrying the visitor's credentials. An unavailable
public mask value produces a diagnostic and fallback; it does not change the
Page's publication state.

## Editing and compatibility

Both admin form generations expose mask fields, cover links and read-only draft
preview for a concrete public URL and language. The Metadata client SDK calls
`POST /api/host/metadata/preview` on apps/api. The Metadata service validates
the public Page, resolves masks and returns a serializable SEO result without
saving the draft. Preview returns no-store/noindex and rejects hidden/draft
Pages. It can preview an accessible noindex Page. It is a read operation and does
not broadcast mutation invalidations.

Public rendering uses `GET /api/host/metadata/seo?url=...&language=...`. This
operation receives an already unlocalized pathname and returns the resolved
Page with the same SEO result used by preview. Internal reads use public SDK
surfaces without caller credentials. Their consistency descriptors propagate
to the aggregate. The API cache validates captured dependency versions;
Next keeps its finite dependency-tagged cache for public SEO reads. The server
SDK adapts the serializable result to Next Metadata, restores metadataBase as
a URL, maps HTTP 404 to notFound and shares the result within one render.
There is no Host preview route. Studio has a fixture
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
