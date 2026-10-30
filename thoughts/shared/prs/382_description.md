## Summary

Public pages need their own editable Metadata, localized masks and covers, while hidden content must return 404 consistently. Administrative server reads also lost the client session and failed with 403. Public HTML now uses ISR with model-owned SEO resolution; authenticated administration mounts inside the client guard, with backend RBAC preserved.

Resolves #380. Work stays on `codex/studio-linear-workflow`; unrelated local Studio/workflow edits are not included in these commits.

## Changes

- Square masks with allowlisted fields, exact ID/slug roots, explicit relation chains, locale-specific text and whole-field fallbacks. The first visible linked Metadata wins by orderIndex/ID.
- Validated JSONB `metadata.seo` on Article/Product/Profile; both admin generations and Studio editors; atomic `_expectedMetadata` conflict checks through API/SDK/MCP. Public Profile SEO uses the Author DTO and UUID routes, exposing only metadata.seo from JSON.
- Metadata image fields and a generated Metadata→File relation, ordered covers, alt/dimensions and draft preview. Metadata-only File PATCH now updates the existing upload.
- `hidden` across 61 models and 98 relations, generator support, filtering before count/pagination, true 404 for primary content and separate authorized admin reads.
- Partial-schema repository updates preserve omitted localized/JSON fields and unchanged relation keys, while explicit empty objects still clear the requested field.
- Language-aware Page uniqueness/lookup/seed reconciliation (including legacy snapshots), `indexing`, canonical, robots, factual JSON-LD and bounded sitemap chunks with 503 on upstream failure.
- Server-rendered rich text and H1 for article/product content. Product cart/checkout remain session-owned client actions. Public HTML now uses dependency-invalidated ISR. Locale comes from `[language]` route params, the admin route stays dynamic, and a Page document reader resolves existence/SEO before streaming.

## Verification

Current application release: [0.0.331](https://github.com/singlepagestartup/singlepagestartup/releases/tag/0.0.331), app commit `55ed9ad9b2`. Subsequent operator CLI optimizations run during data publication and do not change the deployed Host/API application.

- [x] Both admin generations: client session/role guard, filtered relation counts, Page→Metadata→File editing, alt, preview and configured language default.
- [x] 102 local and 104 production Pages have selected Metadata and individual cover Files. Seven Living Focus illustrations retain landscape/square originals; all 104 production images pass public HTTP, SHA-256, MIME, dimension and alt checks. Fresh publication creates no duplicate Metadata, links or File IDs.
- [x] 60 focused tests; production build/TypeScript; scoped ESLint on 24 TS/TSX files; module dependencies: 15,495 files, 0 violations.
- [x] Production Metadata title invalidation/HIT, hidden/restore Page/Article/Product/required relation, preserved fields, cookie-isolated public HIT, real missing page/file 404 and anonymous administrative 403.
- [x] Production sitemap: 136 URLs, all 200 with canonical/lang/description/OG and exactly one H1; no noindex or invalid JSON-LD. No duplicate titles within either locale.
- [x] Lighthouse 13.6.0 mobile: SEO 100 on seven URLs; Performance 80/50/30/22/31/32/51. Remaining JS/LCP/CLS and content work are documented with evidence.
- [x] Yandex live checks confirm 404 and 200; all 136 URLs accepted into the recrawl queue. Global diagnostic refresh is disabled by Yandex's service outage.

[Current review](https://github.com/singlepagestartup/singlepagestartup/blob/codex/studio-linear-workflow/thoughts/shared/research/singlepagestartup/ISSUE-380-completion-review.md). Public reports are attached to release 0.0.331; private before-manifests are excluded.

Previous verification:

Previous revision: `8324e42e97`, deployed as [0.0.330](https://github.com/singlepagestartup/singlepagestartup/releases/tag/0.0.330).

- [x] Production build and TypeScript; public catch-all is SSG/ISR and admin is dynamic. CI/CodeQL and release workflow passed.
- [x] 281 tests passed, one pre-existing skipped: Host 59, Host module 112, URL utilities 28, shared backend API 82 passed. Scoped ESLint: 36 files, 0 errors/warnings; module dependencies: 15,494 files, 0 violations.
- [x] Original test database: partial-update and localized-seed scenarios in rolled-back transactions; 51 ru Page templates preserved and 51 en templates matched.
- [x] Local and production HIT → title update → updated HIT → hidden 404 → restore 200. Page, populated Article/Product and required relation preserve all unrelated fields. A public cookie retains the shared HTML/HIT.
- [x] Local encoded-slash and locale-name paths; warm public 200 HIT during API outage, cold 500 no-store, sitemap 503 no-store with Retry-After.
- [x] Production crawl: 138 URLs, all 200; canonical/locale/description/OG image and exactly one H1 on every URL; no noindex URLs or invalid JSON-LD in sitemap.
- [x] Production data: 52 ru Page templates with existing content links, Article/Product Metadata masks, primary/home covers, static page headings and demo noindex policies. Four completely empty test articles remain stored as hidden.
- [x] Lighthouse 13.6.0 mobile on five URLs: SEO 100 on all; Performance 78/43/44/40/36. Three comparable pages use 3 font requests (~158 KB), down from 22 (~1.19 MB).
- [x] Browser: local home and production module/article render without application errors. Lighthouse reports external Yandex Webvisor CORS errors on two articles.

[Production review and priorities](https://github.com/singlepagestartup/singlepagestartup/issues/380#issuecomment-6514109866); 18 reports are attached to the release.

Earlier SEO implementation:

- [x] Focused Jest suites: 554 passed; one pre-existing backend test skipped. Covers Host module/app, shared API/components/utils, middleware, MCP, File Storage, TipTap and anonymous product SSR.
- [x] `tsc -p apps/host/tsconfig.json --noEmit`; scoped ESLint with the repository configuration; `git diff --check`.
- [x] `bun tools/studio/design-system/validate.ts`; `node tools/agents/module-dependencies.mjs` — 0 dependency violations.
- [x] Production Next build with isolated output, one CPU and webpack cache disabled.
- [x] Fresh isolated database migration plus upgrade with existing articles/products/profile/pages; generated defaults and content preserved.
- [x] Live API/SDK/MCP round-trip, JSON preservation and stale-write 409; uploaded PNG and Metadata cover relation.
- [x] Production HTTP matrix: 18 routes, locale metadata, article/product H1, tracking canonical, noindex, true 404, pagination, 20 expected sitemap URLs and draft preview.
- [x] Warm HTML and sitemap update after title edits/hide/restore; hidden cover File/link removes OG. API outage gives HTML 500 and sitemap 503/no-store/Retry-After.
- [x] Browser/Storybook checks: article content after hydration, product presentation, invalid JSON feedback and recovery preserving sibling sections/locales.
- [ ] Owner acceptance of the completed editing flows; rollout to other projects is separate.

## Notes

Reconciled current main in the same branch, retaining its Article/Product presentation and public Author API. Added hidden to its three new relations and regenerated consistency capture as 0010. Existing local Studio/workflow edits remain unstaged; hashes of 451 unrelated paths are preserved.

The diff is broad because every model/relation receives the requested hidden contract. Existing variants and database data snapshots are preserved. Public rendering no longer depends on request headers/cookies. Current-Subject controls must stay in client compositions; private reads and previews bypass public caches.

The original test database is in use. Localized Page templates preserve shared content IDs and do not establish translated content. The production crawl has no missing/multiple H1. Remaining priorities are the 1.72 MB first-load client bundle, article/module layout shifts, 8 catalog URLs using the generic site description, Metadata seed duplication, FileInput replacement behavior, Store composition and analytics configuration. See the linked review for evidence and proposed scope.

The authorized test production singlepagestartup.com is updated to 0.0.331. Production m2commerce.ru and its data are unchanged. Existing literal Metadata titles still take priority: deployments must configure real masks, translations and covers. Search reports can only improve after rollout and recrawl. Hreflang, author entity types, publication dates and commerce offers are emitted only when supported; this change does not invent them.

## Downstream migration

Back up and reconcile each project's migration baseline; apply the generated content JSON, Metadata image, Page locale/indexing, Metadata→File and provider capture migrations. Audit duplicate URL/language pairs and legacy viewport settings.

Adapt owned components and SDK readers to hidden/publicOnly/includeHidden behavior. Admin hidden reads require collection POST permission or operator credentials and must remain separate from anonymous caches. Keep public product content available before session initialization.

Public author Pages use `[social.profiles.id]`, explicit visible Article/Product links and GET permission for `/api/social/profiles/authors`; private slugs and non-SEO Profile JSON are not public.

Link real Pages to Metadata, replace shared literals with square masks, populate requested locales and `metadata.seo`, and attach real covers. Preserve unrelated JSON sections and send `_expectedMetadata` for concurrent API/MCP/editor updates. Set public Host/API origins and define a policy for content-changing query parameters.

Merge localized Host routes/layout and the globalNotFound configuration; render Page documents through the owning model. Keep getSeoCanonicalUrl inputs resolved and unlocalized. Adapt custom Page seed filters to match both URL and language, using the schema default for legacy snapshots and preserving relation IDs. Copy legacy Page templates and their Widget/Layout/Metadata links only for actual intended locales, preserving translations and shared content. Do not add server session reads or a root loading boundary to cached public documents.

Adopt partial-schema repository update validation in owned overrides. Send explicit values for intended resets, audit records previously edited through partial updates for unexpected empty JSON/localized fields, and restore verified revisions through the owning data flow while preserving IDs and relations. Verify variant-only Article/Product/relation PATCH preserves every unrelated field and explicit empty objects affect only the requested field.

Verify built anonymous HTML, MISS/HIT, 404/noindex, images, JSON-LD, sitemap and cache refresh after SDK/direct writes before deployment. Then arrange recrawl separately. Detailed evidence and rollout steps are in `thoughts/shared/processes/singlepagestartup/ISSUE-380.md`.

Owned admin compositions must mount their readers after the client session/role guard with `isServer=false`. Custom legacy table adapters must supply `count` with the same parent/search filters as `find`, preserving client headers/no-store. Page creation uses the configured default language. For existing Pages, prepare project-owned localized SEO input and real covers, retain the private before-manifest, publish through `tools/runtime/page-seo.ts` and verify repeat publication. Cover lookup and verification use exact slugs/related File IDs rather than scanning unrelated uploads.
