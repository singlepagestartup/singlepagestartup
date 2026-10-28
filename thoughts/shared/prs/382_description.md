## Summary

Pages currently reuse site-wide metadata, and missing or hidden content can remain indexable. Resolve each page from its database Metadata and exact route content, preserve localized fields, and make public visibility consistent across HTML, API reads and sitemap.

Resolves #380. Work stays on `codex/studio-linear-workflow`; unrelated local Studio/workflow edits are not included in these commits.

## Changes

- Square masks with allowlisted fields, exact ID/slug roots, explicit relation chains, locale-specific text and whole-field fallbacks. The first visible linked Metadata wins by orderIndex/ID.
- Validated JSONB `metadata.seo` on Article/Product/Profile; both admin generations and Studio editors; atomic `_expectedMetadata` conflict checks through API/SDK/MCP.
- Metadata image fields and a generated Metadata→File relation, ordered covers, alt/dimensions and draft preview. Metadata-only File PATCH now updates the existing upload.
- `hidden` across 61 models and 95 relations, generator support, filtering before count/pagination, true 404 for primary content and separate authorized admin reads.
- Language-aware Page uniqueness/lookup, `indexing`, canonical, robots, factual JSON-LD and bounded sitemap chunks with 503 on upstream failure.
- Server-rendered rich text and H1 for article/product content. Product cart/checkout remain session-owned client actions. Request rendering avoids the reproduced ISR fallback 500 and settles route visibility before streaming.

## Verification

- [x] Focused Jest suites: 467 passed; one pre-existing backend test skipped. Covers Host module/app, shared API/components/utils, middleware, MCP, File Storage, TipTap and anonymous product SSR.
- [x] `tsc -p apps/host/tsconfig.json --noEmit`; scoped ESLint with the repository configuration; `git diff --check`.
- [x] `bun tools/studio/design-system/validate.ts`; `node tools/agents/module-dependencies.mjs` — 0 dependency violations.
- [x] Production Next build with isolated output, one CPU and webpack cache disabled.
- [x] Fresh isolated database migration plus upgrade with existing articles/products/profile/pages; generated defaults and content preserved.
- [x] Live API/SDK/MCP round-trip, JSON preservation and stale-write 409; uploaded PNG and Metadata cover relation.
- [x] Production HTTP matrix: 18 routes, locale metadata, article/product H1, tracking canonical, noindex, true 404, pagination, 20 expected sitemap URLs and draft preview.
- [x] Warm HTML and sitemap update after title edits/hide/restore; hidden cover File/link removes OG. API outage gives HTML 500 and sitemap 503/no-store/Retry-After.
- [x] Browser/Storybook checks: article content after hydration, product presentation, invalid JSON feedback and recovery preserving sibling sections/locales.
- [ ] Owner acceptance of the administrative editing flows and project-specific production rollout.

## Notes

The diff is broad because every model/relation receives the requested hidden contract. Existing variants and database data snapshots are preserved. The runtime change to request rendering has a performance tradeoff; final local fixture responses were 13–841 ms (841 ms for the first home request), which is not a production load benchmark.

One pre-existing local database has an inconsistent migration baseline; it was not changed. Migration verification used isolated databases. A fresh full API migration currently omits Analytic, so its existing target was run separately for the test environment.

Production m2commerce.ru and its data are unchanged. Existing literal Metadata titles still take priority: deployments must configure real masks, translations and covers. Search reports can only improve after rollout and recrawl. Hreflang, author entity types, publication dates and commerce offers are emitted only when supported; this change does not invent them.

## Downstream migration

Back up and reconcile each project's migration baseline; apply the generated content JSON, Metadata image, Page locale/indexing, Metadata→File and provider capture migrations. Audit duplicate URL/language pairs and legacy viewport settings.

Adapt owned components and SDK readers to hidden/publicOnly/includeHidden behavior. Admin hidden reads require collection POST permission or operator credentials and must remain separate from anonymous caches. Keep public product content available before session initialization.

Link real Pages to Metadata, replace shared literals with square masks, populate requested locales and `metadata.seo`, and attach real covers. Preserve unrelated JSON sections and send `_expectedMetadata` for concurrent API/MCP/editor updates. Set public Host/API origins and define a policy for content-changing query parameters.

Verify built anonymous HTML, 404/noindex, images, JSON-LD, sitemap and cache refresh before deployment. Then arrange recrawl separately. Detailed evidence and rollout steps are in `thoughts/shared/processes/singlepagestartup/ISSUE-380.md`.
