# Services & Blog → Storybook Migration Spec

Single source of truth for migrating the `/services` and `/blog` pages (incl. inner
pages) of the runnable prototype into the SPS drafts Storybook as reusable,
Tailwind-only blocks + host page recipes.

## Context

- **Source (runnable):** `apps/drafts/runnable/startup/singlepagestartup/src/app/`
  (Vite + React + Tailwind v4). Live at `http://localhost:5180`.
- **Target (storybook):** `apps/drafts/modules/<module>/...`. Storybook glob:
  `apps/drafts/modules/**/*.stories.@(ts|tsx|mdx)`. Live at `http://localhost:4320`.
- The **home page** is already migrated — study it as the canonical example:
  - Shared sections file: `apps/drafts/modules/website-builder/models/widget/singlepage/home-shared/HomeSections.tsx`
  - A thin widget re-export: `.../content/hero/ContentHero.tsx` (+ `.stories.tsx`, `block.manifest.json`, `figma.json`)
  - A page recipe: `apps/drafts/modules/host/models/page/singlepage/home-default/` (`HomeDefault.tsx`, `.stories.tsx`, `page.manifest.json`, `figma.json`)

## Routes being migrated

| Route                | Source component                 | Page recipe (new)                      |
| -------------------- | -------------------------------- | -------------------------------------- |
| `/services`          | `components/CatalogPage.tsx`     | `host/.../singlepage/services-catalog` |
| `/services/:slug`    | `components/ProductPage.tsx`     | `host/.../singlepage/service-detail`   |
| `/blog`              | `components/BlogListPage.tsx`    | `host/.../singlepage/blog-list`        |
| `/blog/:slug`        | `components/BlogArticlePage.tsx` | `host/.../singlepage/blog-article`     |
| `/blog/author/:slug` | `components/AuthorPage.tsx`      | `host/.../singlepage/author-profile`   |

Concrete content to bake for detail pages: product = **`website-development`**
(catalogData), article = **`how-to-choose`** (blogData), author = **`sarah-kim`** (blogData).

## Architecture (MIRROR the home pattern exactly)

Each module gets ONE shared sections file holding style atoms + all that module's
section components + their `defaultXxxProps`. Each block is a thin re-export folder.

```
<module>/models/widget/singlepage/<shared-folder>/<ModuleSections>.tsx   ← all impl + defaults
<module>/models/widget/singlepage/<block>/<Component>.tsx                 ← thin re-export wrapper
<module>/models/widget/singlepage/<block>/<Component>.stories.tsx
<module>/models/widget/singlepage/<block>/block.manifest.json
<module>/models/widget/singlepage/<block>/figma.json
```

### Block inventory & module ownership

**website-builder** (shared file: `content/detail-shared/ContentDetailSections.tsx`):
| Block folder | Component | Source section |
|---|---|---|
| `content/page-header` | `ContentPageHeader` | CatalogPage header `<section>` (lines 25-38) — eyebrow + h1 + description on white band. Reused by services + blog lists (props-driven). |
| `content/features-grid` | `ContentFeaturesGrid` | ProductPage `WidgetFeatures` (252-279) — "What's Included" 4-col card grid |
| `content/process-steps` | `ContentProcessSteps` | ProductPage `WidgetProcess` (283-313) — "Our Process" 4 steps |
| `content/testimonials` | `ContentTestimonials` | ProductPage `WidgetTestimonials` (533-584) — 2-col cards w/ stars (render STATIC grid, no carousel) |
| `content/faq` | `ContentFaq` | ProductPage `WidgetFaq` (588-634) — 2-col: copy + accordion (use native `<details>`) |

**ecommerce** (shared file: `services-shared/ServicesSections.tsx`):
| Block folder | Component | Source section |
|---|---|---|
| `product-list-catalog` | `ProductListCatalog` | CatalogPage toolbar + grid (40-138) — category tabs + search + product cards |
| `product-hero` | `ProductHero` | ProductPage `WidgetHeroBanner` (51-96) |
| `product-purchase` | `ProductPurchase` | ProductPage `WidgetProductCard` (100-231) — image + cart sidebar |
| `product-stats` | `ProductStats` | ProductPage `WidgetStats` (235-248) |
| `product-gallery` | `ProductGallery` | ProductPage `WidgetGallery` (317-529) — render STATIC: main image + thumb strip + "1 / N" + Portfolio header. NO carousel/lightbox |
| `product-related` | `ProductRelated` | ProductPage `WidgetRelated` (638-685) |
| `product-cta` | `ProductCta` | ProductPage `WidgetCta` (689-731) — dark band, Add to Cart + Book a Call |

**blog** (shared file: `blog-shared/BlogSections.tsx`):
| Block folder | Component | Source section |
|---|---|---|
| `blog-featured` | `BlogFeatured` | BlogListPage featured `<Link>` (55-103) |
| `blog-list` | `BlogList` | BlogListPage toolbar + grid (105-208) — category tabs (w/ counts) + search + article cards |
| `blog-tag-cloud` | `BlogTagCloud` | BlogListPage tags cloud (211-228) |
| `article-cover` | `ArticleCover` | BlogArticlePage cover (177-184) — full-width image w/ gradient |
| `article-detail` | `ArticleDetail` | BlogArticlePage 2-col section (186-420): left = breadcrumb+meta+title+author+content(HTML)+share+comments; right = sidebar (related products, author card, tags, related articles, back). One full-width block containing the `max-w-6xl` container + grid. |
| `author-hero` | `AuthorHero` | AuthorPage hero `<section>` (234-322) |
| `author-detail` | `AuthorDetail` | AuthorPage content 2-col (325-455): left = stats row + articles list; right = bio/skills/categories/other authors/back |

### Page recipes (`apps/drafts/modules/host/models/page/singlepage/<name>/`)

Each: `<Page>.tsx`, `<Page>.stories.tsx`, `page.manifest.json`, `figma.json`.
Wrap with `DraftPageShell` (import from `website-builder/.../home-shared/HomeSections`),
start with `NavbarDefault`, end with `FooterCompact` (both from home-shared — this is
exactly what the runnable `SiteLayout` renders).

1. **services-catalog** (`ServicesCatalog`): `NavbarDefault` → `ContentPageHeader` (services copy) → `ProductListCatalog` → `FooterCompact`
2. **service-detail** (`ServiceDetail`): `NavbarDefault` → `ProductHero` → `ProductPurchase` → `ProductStats` → `ContentFeaturesGrid` → `ContentProcessSteps` → `ProductGallery` → `ContentTestimonials` → `ContentFaq` → `ProductRelated` → `ProductCta` → `FooterCompact`
3. **blog-list** (`BlogListPage`-recipe → name `BlogList` page): `NavbarDefault` → `ContentPageHeader` (blog copy) → `BlogFeatured` → `BlogList` → `BlogTagCloud` → `FooterCompact`
4. **blog-article** (`BlogArticle`): `NavbarDefault` → `ArticleCover` → `ArticleDetail` → `FooterCompact`
5. **author-profile** (`AuthorProfile`): `NavbarDefault` → `AuthorHero` → `AuthorDetail` → `FooterCompact`

## Transformation rules (CRITICAL — fidelity + storybook-safe)

1. **Visual fidelity first.** Copy the EXACT Tailwind classes from the source JSX. Do
   not redesign. The result must look identical to the runnable page.
2. **No react-router.** Replace `<Link to="x">` → `<a href="x">`; drop `useNavigate`/
   `useParams`/`useLocation`. Replace `onClick`-navigation with plain `href`.
3. **No `ImageWithFallback`.** Replace with a plain `<img>` keeping the same
   `src`/`alt`/`className`.
4. **No shadcn `ui/*` and no Radix/embla.** Reimplement with plain Tailwind:
   - Accordion (FAQ) → native `<details className="group">` / `<summary>` with a
     `lucide-react` `ChevronDown` that rotates via `group-open:rotate-180`. First item `open`.
   - Carousel/lightbox (gallery, testimonials) → STATIC layout reproducing the default
     visible state (main image + thumbnail strip; testimonial cards in a grid).
5. **No data-module imports.** Do NOT import from `../catalogData`/`../blogData`.
   Instead READ those files and BAKE the real content as `defaultXxxProps` in the shared
   sections file. Copy real Unsplash image URLs and text verbatim for fidelity.
   - catalogData: `IMG` map (lines ~80-136), `catalogCategories` (138), `catalogProducts` (148+), `TESTIMONIALS_POOL`.
   - blogData: `AUTHORS` (~60-120), `blogCategories` (121), `blogProducts` (131), `blogArticles` (244+), helpers (664+).
6. **Presentation-only / data-static.** Prefer zero hooks. Filtering/search render in
   their default state (category "All"/"all" active, search empty, all items shown). No
   `useState` unless trivially needed; `<details>` covers FAQ without JS.
7. **Only allowed imports:** `react` (types only if needed), `lucide-react`. Icons must
   match the source's icons.
8. **Markers:** every block's root element gets `data-ds-block="<manifest id>"` and
   `data-ds-layer="singlepage"` (see ContentHero).
9. **Props pattern:** `export type XProps = typeof defaultXProps;` and component is
   `function X(props?: Partial<XProps>) { const {...} = mergeProps(defaultXProps, props); ... }`.
   Define `function mergeProps<T extends object>(d: T, p: Partial<T>|undefined): T { return {...d, ...p}; }`
   once per shared file. Icons in props: type as `LucideIcon` (import type from lucide-react),
   store the component reference (e.g. `icon: Globe`), render `<item.icon className="..."/>`.

## File templates

### Thin widget wrapper (`<Component>.tsx`) — mirror ContentHero.tsx

```tsx
import { ProductHero as ProductHeroBase, defaultProductHeroProps } from "../../services-shared/ServicesSections";
import type { ProductHeroProps } from "../../services-shared/ServicesSections";

export { defaultProductHeroProps };
export type { ProductHeroProps };

export function ProductHero(props: Partial<ProductHeroProps>) {
  return <ProductHeroBase {...props} />;
}
```

(adjust relative `../../` depth to reach the shared file; verify the path.)

### Story (`<Component>.stories.tsx`) — mirror ContentHero.stories.tsx

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { ProductHero, defaultProductHeroProps } from "./ProductHero";

const meta = {
  title: "Modules/Ecommerce/Models/Widget/Singlepage/Product Hero",
  component: ProductHero,
  parameters: { layout: "fullscreen" },
  args: defaultProductHeroProps,
} satisfies Meta<typeof ProductHero>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
```

Title format: `Modules/<Module Title>/Models/Widget/Singlepage/<Human Name>`
(Module Title: "Website Builder" | "Ecommerce" | "Blog").

### `block.manifest.json` — validate against `apps/drafts/block.schema.json`

```json
{
  "$schema": "../../../../../../block.schema.json",
  "id": "ecommerce.widget.product-hero",
  "title": "Ecommerce Widget / Product Hero",
  "description": "Singlepage draft block for the service/product hero banner.",
  "layer": "singlepage",
  "state": "draft",
  "source": { "module": "ecommerce", "entityType": "model", "entity": "widget", "variant": "product-detail" },
  "files": { "component": "ProductHero.tsx", "story": "ProductHero.stories.tsx" },
  "contentSlots": [{ "name": "title", "type": "text", "required": true }],
  "figma": { "componentName": "ecommerce.widget", "pageName": "ecommerce", "nodeId": null, "syncStatus": "not-created", "metadataFile": "figma.json" }
}
```

- `$schema` is a RELATIVE path to `apps/drafts/block.schema.json` — count the folder
  depth and set the correct number of `../`. From
  `modules/<m>/models/widget/singlepage/<block>/` it is `../../../../../../block.schema.json`.
  For nested website-builder content blocks
  (`.../singlepage/content/<block>/`) add one more `../` → `../../../../../../../block.schema.json`.
- `contentSlots` types allowed: `text|richText|image|link|list|media|boolean`.
- `state` allowed: `scaffold|draft|ready` → use `draft`.

### `figma.json` — mirror `content/hero/figma.json` shape (no real node yet)

```json
{
  "componentName": "ecommerce.widget",
  "pageName": "ecommerce",
  "nodeId": null,
  "variantName": "product-hero",
  "metadata": {
    "sps.drafts.blockId": "ecommerce.widget.product-hero",
    "sps.drafts.layer": "singlepage",
    "sps.drafts.syncKey": "ecommerce/models/widget/singlepage/product-hero",
    "sps.figma.component": "ecommerce.widget",
    "sps.figma.variant": "product-hero",
    "sps.source.module": "ecommerce",
    "sps.source.entityType": "model",
    "sps.source.entity": "widget",
    "sps.source.variant": "product-detail",
    "sps.contractVersion": "0.1.0",
    "sps.code.component": "apps/drafts/modules/ecommerce/models/widget/singlepage/product-hero/ProductHero.tsx",
    "sps.code.story": "apps/drafts/modules/ecommerce/models/widget/singlepage/product-hero/ProductHero.stories.tsx"
  }
}
```

### Page recipe — mirror HomeDefault.tsx / .stories / page.manifest / figma

- Component imports each block from its widget folder and stacks inside `DraftPageShell`.
- Story title: `Modules/Host/Models/Page/Singlepage/<Human Name>`.
- `page.manifest.json`: mirror home-default's (has `id`, `title`, `layer`,`state`,
  `description`, `files`, `blocks[]` (id+path), `figma`). List every block used.

## Acceptance criteria

- Storybook (`http://localhost:4320`) loads with NO errors; every new story renders.
- Each block visually matches the corresponding section in the runnable
  (`http://localhost:5180`) at desktop width 1280.
- Page recipes render the full page (navbar → sections → footer) matching the runnable.
- Pure Tailwind; only `react` + `lucide-react` imported; no router/ui/Radix/embla/data imports.
- Manifests valid against the schemas; story/figma/manifest present for every block & page.
