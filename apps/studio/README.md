# SinglePageStartup Studio

`apps/studio` is the repository's read-only presentation system. It combines
two projections without becoming a second source of truth:

- existing presentation-only module and page components;
- validated business, marketing, brand, design, evidence, and asset artifacts
  from an indexed workspace.

Canonical project artifacts are readable Markdown and YAML files beside their
Workspace stories under `apps/studio/workspace/<artifact>/`.
The workspace-specific operating guide is
`apps/studio/workspace/README.md` and is also rendered as
`Workspace/README` in Storybook.
Each story imports its sibling `singlepage` and `startup` source directly;
Studio does not create a second content inventory.
`apps/studio/workspace/index/<layer>.yaml` remains the artifact/dependency
registry and points to those files. No repository-root `workspace/` directory
is used.

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
dependency cycles, and isolated validator fixtures.

`studio:inventory` regenerates `inventory/modules.generated.json` from
production module variant contracts and Studio manifests. Workspace documents
are not copied into generated JSON.

`studio:presentation:export` builds the resolved semantic React/HTML presentation,
resolves `singlepage` or `startup` from repository identity, and writes a
standalone HTML snapshot, paginated PDF, per-slide PNG files, and a manifest to
`apps/studio/output/<resolved-layer>/`. These files are gitignored derivatives;
the React story and indexed workspace artifacts remain the editable sources.

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
  workspace/                  Config, indexes, project knowledge, living sources, and presentation
    components/               Shared presentation-only React templates
    lib/                      Layer-resolution helpers used by default
    styles/                   Layered singlepage, startup, and default brand CSS
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
`apps/studio/modules/host/models/page/<layer>/<page-variant>/`. Existing stable
component/page IDs are preserved across the Studio rename.

## Workspace presentation

Storybook discovers `apps/studio/workspace/**/*.stories.tsx`. Every agreed
living-artifact section exposes three read-only projections: `default` is the
resolved result, `singlepage` is the framework source, and `startup` is the
project override alone. Each shared document has a readable folder such as
`apps/studio/workspace/brand/`, containing `singlepage.md`,
`startup.md`, and `index.stories.tsx`. The story imports those sibling sources
directly. Studio aggregates them in memory, shows their repository paths as
provenance, and never creates a second artifact set. Assets use
`singlepage.yaml` and `startup.yaml`. Project-specific domain, discovery,
acquisition, and communication knowledge is grouped under
`apps/studio/workspace/knowledge/<kind>/`, with sibling `singlepage.md` and
`startup.md` sources. It is agent working context and is intentionally absent
from the primary Storybook review navigation. Domain-specific knowledge
uses replacement semantics once startup content exists; final documents merge
sections, assets merge by ID, and evidence merges by stable ID plus scope and
state. Shared profession responsibilities and methods live
together under `.agents/roles/`; artifact templates live under
`.agents/templates/` and are referenced by the workspace indexes.

Each layer also owns `apps/studio/workspace/pre-development/<layer>.yaml`. This
file is not business content and is not shown in Storybook: it is the minimal
agent cursor for `00-business`, `10-strategy`, `20-brand`, `30-design`, or
`40-products`.
Every new workflow task reconciles it against the indexed artifacts before
continuing, so Markdown/YAML remains authoritative if an earlier task ended
between writes.

Storybook exposes owner-review documents under numbered `Workspace/**` stages.
Engineering research, plans, and implementation notes stay exclusively in
`thoughts/shared/**` and are not included in Studio inventory or navigation.

`Workspace/30 Design/default` renders the effective `design.md` and asset index
as one scrollable, medium-independent identity system: overview, logos,
semantic color, typography, photography, illustration, and graphic-language
rules. These sections are anchors within one page, not separate Storybook
stories. Page, form, success, and campaign compositions are intentionally
excluded. All three projections use the same project-neutral
`workspace/components/ProjectDesign.tsx`; only structured Markdown, registered
assets, and layered CSS tokens vary by layer. Empty startup Design and Assets
sources pass the exact singlepage data to default. Meaningful startup data takes
priority through normal artifact resolution and is rendered by the same
template. The startup inspection story shows an empty state only while startup
has no meaningful data. Photography and illustration share one media-section
layout so their master prompts, production rules, examples, registered images,
and review gates remain directly comparable.

`Workspace/00 Business/Portfolio` displays the complete direction inventory and
opens each direction's Research and active products' Sales process.
`Workspace/40 Products` displays only active sellable products. Each product
joins Research and Sales with its Product, Website, Marketing Creative, and
Presentation outputs. A product may also expose one optional `Content` React
surface for its own transcripts, imagery, documents, lesson materials, or other
formats; Studio does not impose a Markdown schema on it. An
empty `products/startup.yaml` inherits the complete singlepage catalog. A
startup catalog with at least one product replaces the complete singlepage
catalog, so offers from unrelated businesses are never mixed. The exporter
renders the selected default product's Presentation from the same story.
Current generated identity
assets registered below the workspace asset tree render as actual SVG or raster
content. Client intake, legacy material, stock, and public references remain
provenance-only unless their registry disposition explicitly allows the
requested rendered use.

Studio runtime CSS is project-neutral. Font files and their licenses are
registered below `workspace/assets/<layer>/fonts/`.
`workspace/styles/singlepage.css` defines the
framework tokens, `startup.css` contains downstream overrides only, and
`default.css` imports both in that order. The singlepage source story imports
the base stylesheet; resolved stories and exports import `default.css`.

SinglePageStartup itself is developed through the colocated `singlepage` files.
A downstream project starts with zero-content sibling `startup` files and writes
only its overrides there. `apps/studio/workspace/index/singlepage.yaml` and
`apps/studio/workspace/index/startup.yaml` remain structural registries, not
content stores. The startup index explicitly declares each `extends` relation
and resolution strategy. Missing or empty startup content passes through the
singlepage source; populated content follows the declared strategy in the
resolved `default` view.

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
