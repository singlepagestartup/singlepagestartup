# SinglePageStartup Studio

`apps/studio` is the repository's read-only presentation system. It combines
two projections without becoming a second source of truth:

- existing presentation-only module and page components;
- validated business, marketing, brand, design, and asset artifacts
  from an indexed workspace.

Canonical project artifacts are readable Markdown and YAML files under
`apps/studio/workspace/<artifact>/`. Assets, products, and layered styles stay
at the workspace root. Shared components, read-only stories, and technical
helpers live in `apps/studio/workspace/utils/`.
The workspace-specific operating guide is
`apps/studio/workspace/README.md` and is also rendered as
`Workspace/README` in Storybook.
Workspace stories resolve their corresponding `singlepage` and `startup` sources;
Studio does not create a second content inventory.
`apps/studio/workspace/utils/index/<layer>.yaml` remains the artifact/dependency
registry and points to those files. No repository-root `workspace/` directory
is used.

## Production Docker boundary

The root [`.dockerignore`](../../.dockerignore) excludes the entire
`apps/studio` directory from production build contexts. This includes both
workspace layers, source documents, intake files, images, fonts, runnable
prototypes, generated PDFs, and future files added anywhere under Studio.
Studio remains available in the checkout for development and review; its
contents are not copied into production images.

Production applications must not import or read files from `apps/studio` at
build time or runtime. Publish approved content through the owning module,
its database and file-storage flows, or the production application’s static
assets. Put reusable code in the appropriate shared library. Configure any
runtime knowledge corpus outside Studio. Database snapshots under
`libs/modules/**/backend/repository/database/src/lib/data/` remain part of the
production context.

Downstream projects must retain this exclusion when syncing the framework.
If a project adds a Dockerfile-specific ignore file or an alternative build
context, preserve the same boundary there. Required production assets should
be published to their runtime location instead of re-including Studio.

## Commands

```bash
npm run studio:list
npm run studio:dev -- runnable/startup/singlepagestartup
npm run studio:init -- runnable/startup/landing-v1
npm run studio:validate
npm run studio:inventory
npm run studio:catalog
npm run studio:storybook
npm run studio:storybook:build
npm run studio:presentation:export
```

`studio:validate` type-checks Workspace stories and checks runnable manifests,
module/page/Figma metadata, both canonical workspace layers, inheritance rules,
dependency cycles, and isolated validator fixtures. Once a downstream project's
own cursor reaches `30-design`, it also requires that project to own its
brandbook: a written and separately confirmed `design/startup.md` plus at least
one registered asset in `assets/startup.yaml`. Independently, any layer that
documents an `Interface and product surfaces` section must render the required
specimens. A selected HTML/TSX section declares `data-specimen="<id>"` and its
canonical heading, or literal `Specimen` id/title props. An omission needs an
attributed reason in `interface_review.omitted_specimens`. Design layouts support
nested category groups: Interface kit contains reusable elements and states;
Content blocks contains compositions of those elements. Shared navigation
preserves example state, and the HTML download includes every category. See
[Design layouts and authoring](workspace/README.md) for layer ownership and
restyling rules.

`studio:inventory` regenerates `inventory/modules.generated.json` from production
model variant contracts and Studio manifests. It prepares missing `singlepage`
and `startup` model directories, preserving existing components and overrides.
Telegram and relations are excluded. Both Storybook commands run this preparation.

`studio:catalog` adds local views for all 61 production models. It reads schema
syntax without importing or executing production code. Sample records and dates
live in each model's `singlepage/admin-v2-table/data.json`; `interface.ts` holds
the local contract. Existing data and authored variants are preserved.

Every model exports `Component` through `index.ts`. Its `variants.ts` merges
`singlepage/variants.ts` and `startup/variants.ts`, with startup taking precedence.
Callers import the public model entry and select its display with `variant`.
Cross-model views always use this entry. Private sibling imports remain inside
one model; providers and helpers keep their state-specific entry points.

```tsx
import { Component as BlogModuleArticle } from "../../../article";

Array.from({ length: count }, (_, index) => <BlogModuleArticle key={`featured-${index}`} variant="featured" />);
```

Put an explicit model `variant` after any prop spreads: `<Model {...props}
variant="featured" />`. Use a separate display prop such as `appearance` for
states within that variant. Bidirectional compositions use ReactNode slots:
Host supplies an author's Article list; Blog Widget supplies the Article tags
card. This keeps model entry imports acyclic.

The catalog provides `admin-v2-table`, `admin-v2-card` and `list`. Tables expose
`empty`; lists expose `empty` and `count` through Storybook Controls. List stories
include Default, Empty and Many (20 cards). Repeated cards use one local example.
Custom model variants retain their own props and interactive states. Studio
composes models directly and requires neither production libraries nor an API.

`studio:presentation:export` builds the resolved semantic React/HTML presentation,
resolves `singlepage` or `startup` from repository identity, and writes a
standalone HTML snapshot, paginated PDF, per-slide PNG files, and a manifest to
`apps/studio/output/<resolved-layer>/`. These files are gitignored derivatives;
the React story and indexed workspace artifacts remain the editable sources.

## Browser PDF export

Every product's Presentation tab includes the shared
`workspace/utils/components/PresentationPdfDownload.tsx` controls. Export starts only
when the operator clicks **Prepare PDF**; opening the tab performs no PDF capture.
The button shows progress, exposes a **Download PDF** Blob link on success, and
allows retry after an error. Leaving the tab, changing product/content, or
unmounting releases the URL and invalidates an unfinished generation.

Presentation components expose each page with a unique `data-slide-id`. Pages
must be mounted, use one fixed logical size, and appear in export order. The
wrapper reads these existing pages without creating a duplicate hidden deck.
It derives a 2× PNG raster and PDF point dimensions at 72/96 from the source CSS
size. The default 1600 × 900 presentation becomes 3200 × 1800 raster pixels on
1200 × 675 pt PDF pages. Fonts, image readiness, ordered PDF assembly and URL
lifecycle come from the local `workspace/utils/media/pdf` implementation.
It uses browser fonts and images through html-to-image and assembles pages with jsPDF.

The direct `?document=presentation` route remains a plain deck for the existing
CLI HTML/PDF/PNG exporter. Product data, layer resolution and slide content use
the same components for both export paths.

## Portable document export

Brief, Strategy, Brand, Design, and every product-owned document or nested page
offer downloads in the same review surface. Markdown downloads remove review
frontmatter but retain the complete authored heading, list, link, and table
structure. Product file names include the product and page or customer-segment
name, so independently uploaded files remain identifiable.

HTML downloads capture the currently rendered page without Storybook chrome or
the download controls. They inline the active styles and same-origin images so
Brand, Design, product layouts, and Markdown renderings remain useful as a
portable visual reference. Text-first paired pages always keep their canonical
Markdown download; switching to Layout changes the HTML snapshot, not its source
text. Existing raw HTML pages download their owned source file directly.

## Layout

```text
apps/studio/
  .storybook/                 Storybook configuration
  foundations/                Shared presentation tokens and Figma variables
  inventory/                  Derived module navigation and coverage data
  modules/                    Existing module/page projections
  runnable/<layer>/           Standalone imported prototypes
  runtime/                    Studio-only styles and static runtime
  output/<layer>/             Gitignored HTML, PDF, and PNG presentation exports
  workspace/                  Living documents and their presentation
    assets/                   Registered images, fonts, intake, and generated files
    products/                 Catalogs, product documents, data, and React entry points
    styles/                   Layered singlepage, startup, and default brand CSS
    utils/                    Shared components, stories, helpers, indexes, and state
  system.manifest.json        Studio roots and module inventory pointer
```

Studio models live directly inside each module. Production keeps its separate
`models` and `relations` directories in `libs/modules`.

```text
apps/studio/modules/<module>/<model>/<layer>/<variant>/
  Component.tsx
  Component.stories.tsx
  block.manifest.json
  figma.json
```

Host pages remain under
`apps/studio/modules/host/page/<layer>/<page-variant>/`. Existing Host page IDs are preserved. Domain variant IDs follow their component names.

## Local AI Chat components

AI Chat prototypes live entirely in Studio. `Component.tsx` contains each variant's
implementation, props and callbacks. `index.ts` exports the component and its
public types or helpers. Fixture data and interactive examples live in
`Component.stories.tsx`. Product website previews compose these components and
editable Markdown content.

Studio callers import each model from `<module>/<model>/index.ts` and choose the
view with `variant`. Each entry's discriminated props retain the required inputs
of its variants. Singlepage and startup maps assemble those variants locally.

```tsx
import { Component as SocialModuleProfile } from ".../social/profile";

<SocialModuleProfile variant="account-menu" data={profile} balance={balance} page="chat" />;
```

| Model                                                      | Studio responsibility                                   |
| ---------------------------------------------------------- | ------------------------------------------------------- |
| Host Page / Layout                                         | Separate pages and the frame with header slots          |
| RBAC Identity / Subject                                    | Authentication, account forms and current account       |
| Social Profile                                             | Project selector, overview, sidebar, forms and agent    |
| Social Chat / Thread                                       | Chat and Thread overviews                               |
| Social Message / Skill                                     | Message overview/list and knowledge-editing instruction |
| Knowledge Source                                           | Products content, editor and document navigation        |
| File Storage File                                          | Upload, attachment list, preview and detach             |
| Ecommerce Order                                            | Token purchase preview                                  |
| Website Builder Widget / Logotype / Buttons Array / Button | Header, logo, navigation and Help                       |

AccountProvider supplies one user profile and its balance directly to Subject
`account`. ProfilesProvider supplies local project identities; the project
selector and sidebar display those examples. A route ID selects the supplied
profile. Missing examples show an unavailable state. Project creation only adds
an identity to the local preview.

The project prototype has one Products.md document, one prepared Thread, one
Knowledge Source and one knowledge assistant using Skill `overview-ai-chat`.
The New thread page shows a name, agent selection and Cancel. Submit displays
preview feedback and creates no Thread records.

Each Host Page owns one screen: landing, register, login, account settings, help,
tokens, project creation, project content, project settings and thread creation.
Pages use the public model entries. The website Preview adapter handles local
navigation between those pages.

AI Chat Layout examples use flat `singlepage/ai-chat-landing` and
`singlepage/ai-chat-dashboard` folders. Their names distinguish visual samples;
the production mapping uses Layout records with shared rendering.

Layout `ai-chat-landing` composes Website Builder `navbar-ai-chat-landing` and
`footer-ai-chat`. Its Subject slot is supplied by Page. The landing navbar uses
the same `brand-ai-chat` Logotype as the service screens. Try the chat is a Button
record displayed through Buttons Array. Page places `content-ai-chat-hero`, `content-ai-chat-try`
and `content-ai-chat-continue` inside the Layout, and supplies Social Chat as the `children`
of `content-ai-chat-try`. Each Widget has its own generated content fixture. The Social
preview reads `utils/products/ai-chat-website.generated.json`; editable website
documents pass their content override through Host Page.

Layout `ai-chat-dashboard` owns its themed container, Website Builder navbar and footer.
Pages supply `profileSelect` and `subjectAccount` slots. The navbar directly
composes Logotype, Buttons Array and Button models; Help is a Button example.
Host Layout selects the Buttons Array record, active href, navigation label,
inline/collapsible presentation and supplied slots from the page. Navbar renders
that data and both supplied slots in either presentation; it owns menu interaction
and focus handling.
Website Builder imports no Social, RBAC or Host components.

Public Home, Blog, Services, account, checkout and legal Pages use Layout
`website`. It composes Website Builder `navbar-default` and a full or compact
footer, and supplies Subject `account` and Cart views. A Page with its
own cart state can supply `cartButton` and `cartDrawer`; `subjectAccount` can
also be supplied. Navbar uses Logotype and Buttons Array → Button for navigation.
Account state and its dropdown belong to Subject. Admin Panel is visible in
that dropdown after sign-in. The compact footer contains no admin link.

Website Builder variants classify their content and navigation: editable blocks
use `content-ai-chat-hero`, `content-ai-chat-try`, `content-ai-chat-continue` and
`content-ai-chat-help`; navigation uses `navbar-ai-chat` and
`navbar-ai-chat-landing`; the footer uses `footer-ai-chat`. Button and Buttons
Array use `navbar-ai-chat` for the navbar's links. Nested folders mirror those
keys, for example `singlepage/content/ai-chat/hero`.
Navbar samples are siblings: `singlepage/navbar/ai-chat` and
`singlepage/navbar/ai-chat-landing`.

Other Studio models name their variants by purpose, with presentation last: `overview-ai-chat`
displays one model, `list-ai-chat` displays records, and
`select-item-ai-chat-project` identifies a Profile Select item in the project presentation.
Folders mirror the key, as in `singlepage/select/item/ai-chat/project`. Host Page variants and
story IDs follow their route names. Project scope is a local state wrapper;
`overview-ai-chat-project` displays the selected profile.
Profile functions live under `create`, `overview`, `select`, `settings`,
`sidebar`, `scope` and `processing`; `ai-chat/project` specifies their appearance.
The ordinary Profile uses `overview-default` in `overview/default`, with a
Component/index entry, local defaults and its own Storybook Controls.

Names describe the model path relative to the current entry, then the function
and appearance. A Thread uses `overview-ai-chat`, `create-ai-chat` and
`overview-ai-chat-settings` for its own views. Its child Message list uses
`message-list-ai-chat`; Message itself uses `list-ai-chat`, because the model
name is already given by the entry. Thread owns the context lookup and passes
records directly to Message. Each additional model step appears in order:
Subject `overview-profile-overview-chat-overview-thread-list-default` would
describe `/subjects/:subjectId/profiles/:profileId/chats/:chatId/threads`.
This is a naming example; Host Page names continue to follow their actual routes.

Profile `overview-ai-chat-project` owns one sidebar and a responsive project
frame. Tailwind container queries control the frame's columns, navigation
controls and sidebar position; local state controls opening and dismissal.
Chat `overview-ai-chat` composes Thread `overview-ai-chat`. Products is the
Knowledge Source example's title. Thread derives its
identity and title from the supplied Source. The Thread provider retains local
state across project page navigation and reuses an existing scope.
Thread's local provider owns messages, draft, pending File IDs, Working On, pane
selection and proposals. Message `list-ai-chat` maps records to Social
Message `overview-ai-chat` views. RBAC Subject `message-create-ai-chat` owns the
sending form and reads that Thread state. Host Page supplies it through the
Chat/Thread `messageCreate` slot, keeping Social independent of RBAC. Working On
selects Whole document or the supplied Source's title.
Sending snapshots the supplied Source and files; later edits preserve history.

SourceProvider owns one Source and an array of displayed File IDs. Source
`overview-ai-chat` edits user context while preserving analyzed material text. It
passes File IDs to File `list-attachments-ai-chat` directly. The Source story exposes
`empty` and `withFiles` controls. Upload and detach affect only preview state;
the File pool remains available for reattachment and message attachments.

Fixtures live in `workspace/utils/products`; visual primitives live in
`workspace/design/singlepage/interface-kit/ai-chat`. The website keeps model
providers mounted across local navigation. Studio stores no relation records,
query filters or SDK adapters. Production storage, retrieval and tools belong to
`libs/modules` and are connected separately after visual design.

`bun tools/studio/products/publish-ai-chat.ts` generates local JSON from editable
copy and role definitions. Isolation tests reject production imports, including
types and CSS. Storybook uses its own tsconfig, fonts and image assets.

## Host model previews

`Modules/Host/Models/Page/Singlepage/composition` displays local Page, Layout,
Widget and Metadata examples. Each model also has list, form and select stories.
`HostStudioProvider` accepts controlled `state`/`onStateChange` or `initialState`.
Edits affect in-memory examples and reset on reload.

Page preview composes the supplied Metadata and Layout models. Layout displays
Widget examples; Widget displays a Blog model view. Standalone Host Widget
`default` selects Blog or Ecommerce through its `externalModule` prop. Metadata
renders SEO examples inside the canvas and leaves browser metadata alone.

Inventory records model stories and visual variant coverage per layer. Coverage
checks require all four Host models and their management views.

The Startup module has a Widget scaffold at
`apps/studio/modules/startup/widget/singlepage/default/`, visible in
Storybook as `Modules/Startup/Models/Widget/Singlepage/default`. A downstream
project adds its own variants under
`apps/studio/modules/startup/widget/startup/<variant>/`, with a component,
story, block manifest, and Figma metadata as shown above. The first `startup` in
this path names the business module; the second names the project-owned layer.
Run `npm run studio:inventory` after adding a production model to
prepare its Studio folders. `studio:validate` reports missing layer directories.

## Workspace presentation

Storybook discovers `apps/studio/workspace/utils/stories/*.stories.tsx`. Every agreed
living-artifact section exposes three read-only projections: `default` is the
resolved result, `singlepage` is the framework source, and `startup` is the
project override alone. Each shared document has a readable folder such as
`apps/studio/workspace/brand/`, containing `singlepage.md`,
and `startup.md`. Its story in `workspace/utils/stories/` imports both sources
directly. Studio aggregates them in memory, shows their repository paths as
provenance, and never creates a second artifact set. Assets use
`singlepage.yaml` and `startup.yaml`. Project facts, questions, constraints, and
sources stay in the documents that own them. AI methods and completion rules
live in `.agents/`; workspace has no separate decision checklist or approval
summary. Final documents merge sections and assets merge by ID. Shared profession responsibilities and methods live
together under `.agents/roles/`; artifact templates live under
`.agents/templates/` and are referenced by the workspace indexes.

Each layer also owns `apps/studio/workspace/utils/pre-development/<layer>.yaml`. This
file is not business content and is not shown in Storybook: it is the minimal
agent cursor for `00-business`, `10-strategy`, `20-brand`, `30-design`, or
`40-products`.
Every new workflow task reconciles it against the indexed artifacts before
continuing, so Markdown/YAML remains authoritative if an earlier task ended
between writes.

Storybook exposes owner-review documents under numbered `Workspace/**` stages.
Engineering research, plans, and implementation notes stay exclusively in
`thoughts/shared/**` and are not included in Studio inventory or navigation.

`Workspace/30 Design/default` renders the effective Design document and assets
through the selected `workspace/design/<layer>/layout.yaml`. The base lists
reusable overview, logo, color, typography, interface, photography, and
illustration blocks; projects may reorder or omit them, add
Markdown/React/HTML/media sections, or provide a complete TSX/JSX template. The
workspace README documents the schema, custom-template props, and examples;
layout inheritance follows `.agents/contracts/inheritance.md`.

All three projections use the same loader and review-status wrapper. An entirely
custom template receives the resolved source document and assets without requiring
the legacy field schema. Startup inspection remains empty until startup has
meaningful data or its own layout. Layout and component changes require visual
review; document confirmation does not automatically approve extra sources.

`Workspace/00 Client Request` contains Brief; initial Product, model and Sales
sources are prepared next under Products.

`Workspace/40 Products` displays every client-confirmed product. Each product
links a model and owns Product, Sales, Research, Website, Marketing Creative,
and Presentation outputs; product `sections` can extend these tabs or add
further tabs with nested Markdown, HTML, JSX/TSX, image, and media pages. Shared
loaders and tests live in `workspace/utils/products/`; page files and supporting
materials stay inside their product's layer folder. React decks retain PDF
export. The catalog schema and examples are in `workspace/README.md`; the
atomic catalog rule is in `.agents/contracts/inheritance.md`. The exporter
renders the selected default product's Presentation from the same story.
Current generated identity assets registered below the workspace asset tree
render as actual SVG or raster content. Client intake, legacy material, stock,
and public references remain provenance-only unless their registry disposition
explicitly allows the requested rendered use.

Studio runtime CSS is project-neutral. Font files and their licenses are
registered below `workspace/assets/<layer>/fonts/`.
`workspace/styles/singlepage.css` defines the
framework tokens, `startup.css` contains downstream overrides only, and
`default.css` imports both in that order. The singlepage source story imports
the base stylesheet; resolved stories and exports import `default.css`.

SinglePageStartup itself is developed through the colocated `singlepage` files;
a downstream project writes only its overrides to the sibling `startup` files.
`apps/studio/workspace/utils/index/<layer>.yaml` remains a structural registry,
not a content store; the resolution rules are in
`.agents/contracts/inheritance.md`.

## Document confirmation

Primary review sources carry `confirmation` metadata and `review.dependencies`
snapshots as defined in
[the shared confirmation contract](../../.agents/contracts/document-confirmation.md).
The header shows the resolved state (`unconfirmed`, `confirmed`, `changed` or
`stale`), the document's purpose and how to use it, and hides the metadata and
the duplicate body H1. The agent loader, the browser and the review helper share
`tools/studio/workspace/document.ts`, the merge contract and the review
resolver, which adds product-local dependencies from the selected catalog.

Read the current effective fingerprint without recording consent:

```bash
bun tools/studio/workspace/document-review.ts --file apps/studio/workspace/products/startup/models/example/model.md
```

## Figma metadata

Each reusable block/page keeps its paired manifest and `figma.json`. The files
must agree on component/page/variant names and node identifiers. Studio can
maintain local inventory and metadata; creation or editing in a real Figma file
requires an explicitly available Figma capability and target.

## Guardrails

- Keep all Studio components presentation-only and driven by static props.
- Render registered current generated identity outputs in React; an asset ID by
  itself is not a visual brand review.
- Do not import production APIs, SDK providers, authentication, React Query, or
  mutation code.
- Do not edit generated inventory as a business or design source.
- Keep project evidence distinct from generated, stock, reference, and
  decorative assets.
- Pre-development ends at concrete static design decisions. The existing
  GitHub-gated engineering workflow remains the separate next system; production
  implementation, testing, analytics, deployment, and the bridge into them are
  outside issue 222.

Presentation content is owned by the selected product's `presentation_data` YAML
source and passed as `{ content }` to its React entry point. Shared components
provide layout/export; they do not extract Strategy or other document copy.
Document dependencies are semantic review relationships: `stale` requests an
impact review without automatically replacing any dependent text.

User menus use Subject `account` and Social Profile `account-menu` on every header.
`showTokens` adds the AI Chat balance and Buy tokens action. Name, avatar, email,
Settings, Change avatar, Admin Panel and Sign out share one dropdown. The account
stories expose signed-in and token controls. Studio stores the preview session
and uploaded avatar locally; AI Chat login opens the active project immediately.
