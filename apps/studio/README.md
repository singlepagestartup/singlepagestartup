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
Each story imports its corresponding `singlepage` and `startup` sources directly;
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

`studio:inventory` regenerates `inventory/modules.generated.json` from
production module variant contracts and Studio manifests. It also creates missing
`singlepage` and `startup` directories for every discovered model and relation,
keeping empty directories in Git with `.gitkeep`. Existing components and project
overrides are preserved. Both Storybook commands run this preparation before
starting or building. Workspace documents are not copied into generated JSON.

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

Reusable module blocks continue to mirror `libs/modules`:

```text
apps/studio/modules/<module>/<models|relations>/<entity>/<layer>/<variant>/
  Component.tsx
  Component.stories.tsx
  block.manifest.json
  figma.json
```

Host pages remain under
`apps/studio/modules/host/models/page/<layer>/<page-variant>/`. Existing Host page IDs are preserved. Domain variant IDs follow their component names.

## Local AI Chat components

AI Chat prototypes live entirely in Studio. `Component.tsx` contains each variant's
implementation, props and callbacks. `index.ts` exports the component and its
public types or helpers. Fixture data and interactive examples live in
`Component.stories.tsx`. Product website previews compose these components and
editable Markdown content.

AI Chat callers import each model from its `models/<model>/index.ts` entry and
choose the view with `variant`. The entry's `IComponentProps` is a discriminated
union: each variant retains its own required props. Relation entries keep the
native `variant="find"` contract and the full relation name.

```tsx
import { Component as SocialModuleProfile } from ".../social/models/profile";
import { Component as SubjectsToSocialModuleProfiles } from ".../rbac/relations/subjects-to-social-module-profiles";

<SocialModuleProfile variant="ai-chat-user-menu" data={profile} balance={balance} page="chat" />;
```

Model entries currently register the local AI Chat variants. Each entity's
`singlepage/variants.ts` and `startup/variants.ts` export component maps. The root
`variants.ts` merges them, with startup overrides last; `Component.tsx` selects
`variants[props.variant]`. Required props stay tied to the selected variant.
A variant imports
its own private siblings directly; it never imports its own model entry, which
would create a cycle. Cross-model compositions, stories and website adapters
use the public entries. Providers, record types and pure helpers remain separate
imports from their owning domain.

| Owner                                  | Component responsibility                                          |
| -------------------------------------- | ----------------------------------------------------------------- |
| Host Page                              | One concrete screen composed from domain components               |
| Host Layout                            | Page frame and header                                             |
| RBAC Identity / Subject                | Registration, login, account settings and account provider        |
| Social Profile                         | Project overview/sidebar, identities, user menu, forms and agents |
| Social Chat                            | Resolve the selected Thread through Chat-to-Thread links          |
| Social Thread                          | Conversation, Working On, composer, creation and settings         |
| Social Skill                           | One product-planning instruction                                  |
| Social Message                         | One message, role attribution, context and attachments            |
| RBAC / Social relations                | Subject profiles, profile chats, Sources, Threads and Messages    |
| Knowledge Source                       | Document bundle navigation and editable sections                  |
| Knowledge relation                     | Ordered Source-to-File links filtered by Source ID                |
| File Storage File                      | File lists, upload, open and detach                               |
| Ecommerce Order                        | Token purchase preview                                            |
| Website Builder Widget                 | Header slots, mobile navigation, help and landing page            |
| Website Builder Logotype               | Logo artwork and home link                                        |
| Website Builder Buttons Array / Button | Header links through ordered relations                            |

The current subject resolves its `ai-chat-user` Social Profile through
`subjects-to-social-module-profiles`. RBAC Subject `ai-chat-account` renders that
profile's `ai-chat-user-menu`, including token balance and account links. The
Website Builder header owns its mobile disclosure and receives the rendered
Profile Select and Subject Account through props supplied by Host Page. It has
no imports from Social, RBAC or Host, including transitive dependencies.

The user's Profile reaches project chats through `profiles-to-chats`. Only chats
with `ai-chat-project` and linked Profiles with `ai-chat-project` enter the
project selector. The route ID selects an accessible Profile; a missing link
renders an unavailable state. Creation adds a local project Profile, its chat
and the two Profile-to-Chat links. Account pages return to the selected Profile.

The active project prototype has one Products.md document, one prepared Thread,
one Knowledge Source and one product assistant using Social Skill `ai-chat-products`.
Creation needs a profile name; the Thread is available immediately. Separate product
creation remains later design work. New thread opens a local creation preview with
a name, one agent selector and Cancel. Submitting only shows preview feedback;
it does not create Thread, Chat or Message records.

Each Host Page renders one screen. `ai-chat` renders landing content; register,
login, account settings, help and tokens import their respective model views.
Project Pages are `ai-chat-projects-new`, `ai-chat-projects-project-id`,
`ai-chat-projects-project-id-settings` and
`ai-chat-projects-project-id-threads-new`. Settings and New thread are real links
to separate Page components and Storybook stories. Pages receive a `profileId`
where needed; they do not accept a URL or select another screen internally.

Host Layout `ai-chat` supplies the landing frame. Layout `ai-chat-header` owns
its own themed container and Website Builder header. All nine Pages with that header use this Layout. Pages
compose `profileSelect` and `subjectAccount` render props; Layout passes them to
the widget. The header resolves Logotype through `widgets-to-logotypes`, Buttons
Array through `widgets-to-buttons-arrays`, and Button through
`buttons-arrays-to-buttons`, using local `variant="find"` relation components.
Help is a Button record; the logo artwork belongs to Logotype. Header and its
model variants have isolated stories; the Layout story composes the real Social
and RBAC slots at Host level. `ServicePage` renders content only.

Social Profile `ai-chat-project-overview` owns the project frame, responsive
columns, collapse control and mobile drawer. It resolves the Profile scope and
renders its `ai-chat-sidebar` sibling using `profileId` and `selected`. Each project
Page uses one Host Layout `ai-chat-header` and passes its Chat, Profile settings
or Thread creation content to the overview. The content slot receives only the
sidebar toggle. Shared `PanelHeader` lives in the interface kit.

Profile `ai-chat-project/Profiles.tsx` stores project identities and access links.
The `ai-chat-project` component resolves Profile-to-Chat access and supplies the
model scope. Profile `ai-chat-project-select` reads available profiles and renders memoized
`ai-chat-project-item` rows;
`ai-chat-sidebar` reads the selected profile and renders model navigation links.
Profile creation and settings have their own `ai-chat-create` and
`ai-chat-settings` variants. Chat `ai-chat-products` resolves the prepared Products
Thread through `chats-to-threads/ai-chat-find`; Thread `ai-chat-products` displays
that conversation and its document. Agent avatar and selection are Profile variants `ai-chat-agent-avatar` and
`ai-chat-agent-select`. Pending files, previews and asset previews are File
variants `ai-chat-pending`, `ai-chat-preview` and `ai-chat-asset`.
Source variants are `ai-chat-document`,
`ai-chat-card` and `ai-chat-document-link`. No document/message/source arrays or
agent catalog pass through Profile or Chat.

`workspace/products/singlepage/ai-chat/website/Preview.tsx` is the interactive
preview adapter. It alone selects the concrete Page for a route and intercepts
prototype links. Account, Profile, File, Source and Thread providers remain
mounted independently of the selected Page; the preview retains separate model
state without hidden Page components. A production router can render the same
Pages with its own provider bindings later.

Thread's local `Thread.tsx` provider owns messages, draft text, pending File IDs,
Working On, pane selection and proposals. Conversation resolves ordered Messages
through `threads-to-messages/ai-chat-find`; each Message view renders one record.
Composer reads the Thread directly. Working On offers Whole document or the one
Products Source. Sending captures current knowledge and files; later edits and
detach preserve message history. Proposals update Source after the user applies
them. These responses are local previews, without AI API calls.

Knowledge's `Source.tsx` provider owns the Source record and its File relations.
It resolves the Profile-to-Source link through the existing find variant. Source
has ID, slug, title, content and description; it has no documentId or nested Files.
The document, card and document link read this record directly. The card changes
user context while preserving analyzed material descriptions. Plain text remains
editable without files or markers. Chunks remain derived retrieval records.

File's `Files.tsx` provider owns records and uploaded Blob URLs within each project.
Source-to-File find filters links by sourceId and orders them by orderIndex; each
Source/File pair is unique. File views receive IDs and resolve records locally.
Upload supports multiple files; detach preserves the File pool so an existing
File can be attached again. Message attachments use the same pool. The preview keeps providers mounted when switching projects or opening settings/the
creation page, retaining separate state.

Relation views use `variant="find"` and `apiProps.params.filters.and`. Model-local
providers and story fixtures simulate data access in Studio. The earlier aggregate
helpers remain for adapter examples/tests; the active page does not use
`projectKnowledge`, `projectThreadGraph` or the project-wide message updater.
Durable storage, production SDK integration, attachment analysis, vector indexing
and tool execution remain later work. No production imports are allowed.

Local helpers and example data live in `workspace/utils/products`, visual primitives
in `workspace/design/singlepage/interface-kit/ai-chat`, and styles in `runtime`.
`bun tools/studio/products/publish-ai-chat.ts` generates local Studio JSON from
editable copy and role definitions. It does not publish production code or assets.
`bun test tools/studio/design-system/isolation.test.ts` rejects imports from libs
and Host, including type imports and CSS sources. Storybook has its own tsconfig
and serves fonts and images from Studio workspace assets.

## Host model and relation previews

`Modules/Host/Models/Page/Singlepage/composition` provides one local workspace
for Page, Layout, Widget, Metadata and all five existing Host relations. Each
model also has `admin-v2-list`, `admin-v2-form` and `admin-v2-select-input`
stories. Each relation has an `admin-v2-manager` story and appears inside its
owner's editor. A link editor can create or edit its target in a nested panel.
Unlink retains both model records; deleting a model removes its incident links.

`HostStudioProvider` accepts `state` with `onStateChange` for controlled data,
or `initialState` for a local preview. Each model and relation owns its local
`interface.ts` contract. All mutations affect in-memory state; reloading resets
the preview. Studio has no dependency on production SDK types or providers.

The page canvas uses the same records and links as the editors. Layout widgets
with `variant="default"` precede Page widgets; `variant="additional"` widgets
follow them. Links render by `orderIndex`, with ID as a stable tie-breaker.
Metadata renders SEO and social examples inside the canvas and does not modify
the browser's title or meta tags. The canvas labels the records and slots for
review; it is a composition inspector rather than the production route renderer.

External links retain the module and widget ID. The existing Blog and Ecommerce
Studio previews resolve `preview-blog-overview-widget` and
`preview-ecommerce-overview-widget`. Other IDs show an unavailable-renderer
placeholder until their Studio projection is connected. Existing page recipes
and Widget previews retain their IDs and behavior.

Inventory includes discoverable `storyFiles` per entity and a
`representedEntities` total. Variant coverage reads both block and page
manifests and keeps `singlepage` coverage separate from `startup`. Host coverage
tests require stories for its four models and five relations.

The Startup module has a Widget scaffold at
`apps/studio/modules/startup/models/widget/singlepage/default/`, visible in
Storybook as `Modules/Startup/Models/Widget/Singlepage/default`. A downstream
project adds its own variants under
`apps/studio/modules/startup/models/widget/startup/<variant>/`, with a component,
story, block manifest, and Figma metadata as shown above. The first `startup` in
this path names the business module; the second names the project-owned layer.
Run `npm run studio:inventory` after adding a production model or relation to
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
