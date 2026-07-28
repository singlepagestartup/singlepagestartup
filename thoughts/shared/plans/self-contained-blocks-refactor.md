# Self-Contained Blocks Refactor

Goal: every draft block's implementation must live in its OWN folder (next to its
`.stories.tsx` / `block.manifest.json` / `figma.json`). The four shared "sections"
files must be eliminated. Re-export wrappers become full implementations.

Reference for the target style: the already self-contained atomic blocks, e.g.
`social/models/profile/singlepage/compact/ProfileCompact.tsx`,
`website-builder/models/feature/singlepage/card/FeatureCard.tsx`,
`blog/models/tag/singlepage/default/TagDefault.tsx` — impl + `defaultXProps` +
`XProps` type + `data-ds-block` markers, importing only `react` + `lucide-react`
(+ other module blocks where composed). NO shared sections file, NO `mergeProps`
helper (they use inline `{ ...defaults, ...props }`).

## The four shared files to dissolve

- `website-builder/models/widget/singlepage/home-shared/HomeSections.tsx`
- `ecommerce/models/widget/singlepage/services-shared/ServicesSections.tsx`
- `website-builder/models/widget/singlepage/content/detail-shared/ContentDetailSections.tsx`
- `blog/models/widget/singlepage/blog-shared/BlogSections.tsx`

## Conversion rules (apply to EVERY block)

1. The block's `Component.tsx` is currently a thin re-export. Replace it with the FULL
   implementation moved out of the shared file. Keep the EXACT exported names the
   wrapper had: `export function <Name>`, `export const default<Name>Props`,
   `export type <Name>Props`. (Wrappers often rename, e.g. `ContentHero` wraps
   `HomeHero`; in the block file name everything after the block: `ContentHero`,
   `defaultContentHeroProps`, `ContentHeroProps` — but keep the SAME default values
   and the SAME `data-ds-block` value the shared impl used.)
2. Inline shared style constants as their resolved literal strings (read the const
   definitions at the top of the shared file). Tailwind class order is irrelevant.
3. Replace `mergeProps(defaults, props)` with `const {...} = { ...defaults, ...props };`.
   Do NOT introduce a mergeProps helper.
4. Inline shared helper components used by the block (e.g. `SectionHeader`,
   `BrandMark`, `BrandLockup`, `TextField`) as local functions inside the block file
   (or inline their JSX). Duplication across blocks is expected and acceptable.
5. Keep `data-ds-block="<id>"` and `data-ds-layer="singlepage"` exactly as before.
6. Only import `react` (type-only if needed) + `lucide-react` + other module blocks
   that are composed (see each block below). Do NOT import the shared file.
7. **Relative import depth:** the shared files sit at `…/singlepage/<x>-shared/`.
   - For blocks ALSO directly under `…/singlepage/<block>/` (ecommerce product\*,
     blog widgets, navbar handled separately) the relative path to other modules is
     IDENTICAL — copy verbatim.
   - For blocks NESTED one level deeper at `…/singlepage/content/<block>/` or
     `…/singlepage/navbar/default/` or `…/singlepage/footer/<x>/`, ADD one `../` to
     every relative import that leaves the block folder.
8. **Brand SVG assets:** `home-shared/assets/{singlepagestartup.svg,singlepagestartup-logo.svg}`
   are used by `BrandMark` (navbar, footer/compact) and `BrandLockup` (footer/default)
   via `new URL("./assets/<svg>", import.meta.url).href`. Copy the needed svg into the
   block's own `assets/` folder so `./assets/<svg>` resolves locally.
9. Do NOT touch `.stories.tsx`, `block.manifest.json`, `figma.json` (the story imports
   from `./Component` which now holds the real impl — still valid).
10. **Visual output MUST stay pixel-identical.** Copy exact JSX/classes/default data.

## Block lists per shared file

### home-shared → (handled across agents; do NOT delete home-shared — orchestrator deletes it last)

website-builder (Agent WB-A), nested → +1 `../` on external imports; copy brand assets:

- content/hero `ContentHero` (from `HomeHero`/`defaultHomeHeroProps`)
- content/cta `ContentCta` (`HomeCta`)
- content/feature-list-card `ContentFeatureListCard` (`HomeFeatureGrid`) — composes `FeatureCard` (import `../../../../feature/singlepage/card/FeatureCard`)
- content/feature-list-testimotionals `ContentFeatureListTestimotionals` (`HomeTestimonials`)
- content/features-list-default `ContentFeaturesListDefault` (`ContentFeaturesListDefault`/stats)
- content/features-list-row `ContentFeaturesListRow` (`HomeContact`) — uses `TextField`
- content/files-list-default `ContentFilesListDefault` (`HomeAbout`)
- content/buttons-array-list-default `ContentButtonsArrayListDefault` (`HomeIntegrations`)
- navbar/default `NavbarDefault` — uses `BrandMark` + brand svg
- footer/default `FooterDefault` — uses `BrandLockup` + logo svg
- footer/compact `FooterCompact` — uses `BrandMark` + brand svg

ecommerce (Agent ECOM): `product-list-tiers` `ProductListTiers` (from `HomePricing`/`defaultHomePricingProps`).
blog (Agent BLOG): `blog-list-default` `BlogListDefault` (from `HomeBlogPreview`/`defaultHomeBlogPreviewProps`).
`DraftPageShell` + 6 host recipes: handled by orchestrator.

### services-shared → Agent ECOM (delete services-shared when done)

ecommerce product blocks (same depth, copy imports verbatim):
product-list-catalog `ProductListCatalog` (composes `ProductCard` `../../../product/singlepage/card/ProductCard`),
product-hero `ProductHero`, product-purchase `ProductPurchase`, product-stats `ProductStats`,
product-gallery `ProductGallery`, product-related `ProductRelated` (composes `ProductCardRelated`),
product-cta `ProductCta`.

### detail-shared → Agent WB-C (delete detail-shared when done)

website-builder content (nested, +1 `../` on external imports):
content/page-header `ContentPageHeader`, content/features-grid `ContentFeaturesGrid`,
content/process-steps `ContentProcessSteps`, content/testimonials `ContentTestimonials`,
content/faq `ContentFaq` (composes `FeatureDropdown` `../../../../feature/singlepage/dropdown/FeatureDropdown`).

### blog-shared → Agent BLOG (delete blog-shared when done)

blog widgets (same depth, copy imports verbatim): blog-featured `BlogFeatured`,
blog-list `BlogList` (composes `ArticleCard`), blog-tag-cloud `BlogTagCloud`,
article-cover `ArticleCover`, article-detail `ArticleDetail` (composes ProfileCompact,
ContentRich, ArticleCommentList, CommentForm, ProfileCard, ProductPinned, ArticleListItem,
ArticleTagList), author-hero `AuthorHero` (composes ProfileOverview),
author-detail `AuthorDetail` (composes ProfileListRow, ArticleRow).

## Deletion ownership

- Agent ECOM deletes `services-shared/` after moving its 7 blocks + product-list-tiers.
- Agent WB-C deletes `content/detail-shared/` after moving its 5 blocks.
- Agent BLOG deletes `blog-shared/` after moving its 7 blocks + blog-list-default.
- Orchestrator deletes `home-shared/` AFTER all agents finish (it is multi-consumer)
  and inlines `DraftPageShell` into the 6 recipes.

## Verification (orchestrator)

Restart storybook; all 7 page heights must equal baseline
(home-default 5891, landing-page-basic 1617, services-catalog 2296, service-detail 4785,
blog-listing 1964, blog-article 2312, author-profile 1331); zero story errors; no remaining
imports of any `*-shared` file; `drafts:ds:validate` only flags the known new variants.
