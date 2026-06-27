# Separation-of-Concerns Decomposition Map

Goal: every "display" component (page recipe or composite widget) must COMPOSE
smaller, module-owned presentational blocks via import — never re-implement them
inline. This extends the article-detail example (already done) across all migrated
UI. Visual output must stay PIXEL-IDENTICAL to the current pages (verify heights).

Established pattern (already done) — mirror it exactly:

- `social.profile.compact` → `social/models/profile/singlepage/compact/ProfileCompact.tsx`
- `website-builder.widget.rich-content` → `.../widget/singlepage/rich-content/RichContent.tsx`
- `social.widget.blog-module-article-comment-list-default`
- `rbac.subject.blog-module-comment-form-default`
- `ArticleDetail` imports those 4 and passes data down.

Each new block = self-contained component file (impl + `defaultXxxProps` + `XxxProps`
type + `data-ds-block`/`data-ds-layer` markers) + `.stories.tsx` + `block.manifest.json`

- `figma.json`. Only import `react` (type-only) + `lucide-react`. NO router/ui/Radix/
  data imports. `$schema` in manifests = `../../../../../../block.schema.json` (6 `../`).
  `source.variant` = the block's variant (these are NEW intended variants; the validator
  will flag them as not-yet-in-inventory — that is expected and acceptable).

Reference sources (copy exact Tailwind):
`apps/drafts/runnable/startup/singlepagestartup/src/app/components/{CatalogPage,ProductPage,BlogListPage,BlogArticlePage,AuthorPage}.tsx`
Current draft shared files to refactor:
`apps/drafts/modules/ecommerce/models/widget/singlepage/services-shared/ServicesSections.tsx`
`apps/drafts/modules/blog/models/widget/singlepage/blog-shared/BlogSections.tsx`

## New atomic blocks + prop contracts

### social — model: profile (folders: social/models/profile/singlepage/<variant>/)

- **compact** ✅ DONE — `ProfileCompact({name, role, avatar, href})` — avatar h-10 + name + role.
- **byline** — `ProfileByline({name, avatar, href, size})` — small inline avatar + name.
  `size:"sm"` → avatar h-7 w-7, name text-sm text-slate-700 (used by blog featured).
  `size:"xs"` → avatar h-6 w-6, name text-xs text-slate-600 (used by blog cards).
- **card** — `ProfileCard({name, role, avatar, href, label})` — sidebar "Author" card:
  rounded-xl border bg-white p-5, uppercase label, h-12 avatar + name + role, root `<a href>`.
  Source: BlogArticlePage author card / BlogSections article-detail sidebar author card.
- **overview** — `ProfileOverview({name, role, avatar, location, joinedYear, website, socials})` —
  the author hero CONTENT (avatar h-28 w-28 rounded-2xl + emerald verified badge; name h1;
  role; meta row MapPin location / Calendar "Joined {year}" / ExternalLink website;
  social links Twitter/LinkedIn/GitHub). Source: AuthorPage hero inner (lines 255-320).
- **list-row** — `ProfileListRow({name, role, avatar, href, meta})` — "Other Authors" row:
  `<a href>` avatar h-10 + name + role + meta text + ArrowUpRight. Source: AuthorPage OtherAuthorCard.

### ecommerce — model: product (folders: ecommerce/models/product/singlepage/<variant>/)

- **card** — `ProductCard({slug, image, badge, category, priceLabel, title, subtitle, shortDescription, techStack})` —
  full catalog service card (image+badge, category badge + price, title, subtitle,
  truncated desc, up to 3 techStack tags, "Details" + ArrowUpRight). Root `<a href={"/services/"+slug}>`.
  Source: CatalogPage card (lines 80-134).
- **card-related** — `ProductCardRelated({slug, image, category, priceLabel, title, subtitle})` —
  simpler related card (image, category badge + price, title, subtitle). Root `<a>`.
  Source: ProductPage WidgetRelated card (lines 653-679).
- **pinned** — `ProductPinned({slug, title, shortDescription, priceLabel, category})` —
  article-sidebar pinned product: `<a>` Package icon box + title + desc + price + category +
  "View service". Source: BlogSections PinnedProductCard.

### blog — model: article (folders: blog/models/article/singlepage/<variant>/)

- **card** — `ArticleCard({slug, coverImage, category, date, title, excerpt, authorName, authorAvatar, authorSlug, commentCount, readTime})` —
  vertical blog card. MUST compose `social.profile.byline` (size "xs") for the author chip.
  Source: BlogListPage grid card (lines 146-206).
- **row** — `ArticleRow({slug, coverImage, category, tags, title, excerpt, date, readTime, commentCount})` —
  horizontal article card (cover left, content right). Source: AuthorPage AuthorArticleCard.
- **list-item** — `ArticleListItem({slug, category, title, date, readTime})` — compact
  related-article item (`<a>` border card, category chip, title, date+readTime).
  Source: BlogSections article-detail related-articles items.

## Display components to refactor (compose, don't inline)

| Display component (module)                | Composes                                                                    |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| `blog-featured` (BlogSections)            | `social.profile.byline` size="sm"                                           |
| `blog-list` (BlogSections)                | `blog.article.card` (maps articles → cards)                                 |
| `article-detail` sidebar (BlogSections)   | `social.profile.card`, `ecommerce.product.pinned`, `blog.article.list-item` |
| `author-hero` (BlogSections)              | `social.profile.overview`                                                   |
| `author-detail` (BlogSections)            | `social.profile.list-row`, `blog.article.row`                               |
| `product-list-catalog` (ServicesSections) | `ecommerce.product.card`                                                    |
| `product-related` (ServicesSections)      | `ecommerce.product.card-related`                                            |

Data flow: the display component keeps OWNING its data (baked defaults) and passes
slices as props to the composed blocks. Each atomic block also bakes its own sample
default props so its standalone story renders.

## Out of scope for this wave (leave inline; revisit if asked)

Tag chips, stat-counter numbers, category bar-chart, breadcrumbs, section headers —
trivial inline UI, not cross-cutting module concerns.

## Waves (dependency order)

- Wave 1 (parallel): **social** (profile blocks) + **ecommerce** (product blocks + refactor ServicesSections).
- Wave 2: **blog** (article blocks + refactor BlogSections; depends on social.profile.\* and ecommerce.product.pinned).
- Verify each page height is unchanged vs current after each wave.
