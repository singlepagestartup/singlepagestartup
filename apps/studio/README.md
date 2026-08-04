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
```

`studio:validate` type-checks Workspace stories and checks runnable manifests,
module/page/Figma metadata, both canonical workspace layers, inheritance rules,
dependency cycles, and isolated validator fixtures.

`studio:inventory` regenerates `inventory/modules.generated.json` from
production module variant contracts and Studio manifests. Workspace documents
are not copied into generated JSON.

## Layout

```text
apps/studio/
  .storybook/                 Storybook configuration
  foundations/                Shared presentation tokens and Figma variables
  inventory/                  Derived module navigation and coverage data
  modules/                    Existing module/page projections
  runnable/<layer>/           Standalone imported prototypes
  runtime/                    Studio-only styles and static runtime
  workspace/                  Config, indexes, project knowledge, living sources, and presentation
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
living-artifact section exposes three read-only projections: `current` is the
resolved result, `singlepage` is the framework source, and `startup` is the
project override alone. Each document has a readable folder such as
`apps/studio/workspace/brand/`, containing `singlepage.md`,
`startup.md`, and `index.stories.tsx`. The story imports those sibling sources
directly. Studio aggregates them in memory, shows their repository paths as
provenance, and never creates a second artifact set. Assets use
`singlepage.yaml` and `startup.yaml`. Project-specific domain, discovery,
acquisition, and communication knowledge is grouped under
`apps/studio/workspace/knowledge/<kind>/`, with sibling `singlepage.md` and
`startup.md` sources and its own Studio projections. Domain-specific knowledge
uses replacement semantics once startup content exists; final documents merge
sections, assets merge by ID, and evidence merges by stable ID plus scope and
state. Shared profession responsibilities and methods live
together under `.agents/roles/`; artifact templates live under
`.agents/templates/` and are referenced by the workspace indexes.

Each layer also owns `apps/studio/workspace/pre-development/<layer>.yaml`. This
file is not business content and is not shown in Storybook: it is the minimal
agent cursor for `00-understand`, `10-decide`, `20-package`, or `30-design`.
Every new workflow task reconciles it against the indexed artifacts before
continuing, so Markdown/YAML remains authoritative if an earlier task ended
between writes.

Storybook exposes final documents directly under `Workspace/**` and working
knowledge under `Workspace/Knowledge/**`.
Engineering research, plans, and implementation notes stay exclusively in
`thoughts/shared/**` and are not included in Studio inventory or navigation.

`Workspace/Design/**` repeats the same three projections as nested
`current`, `singlepage`, and `startup` sections. Each renders its selected
`brand.md`, `website.md`, and asset index as brand, token, imagery, component,
page, form, success, and acquisition views. When those artifacts are still
empty, the stories remain visible and state exactly which source document needs
content; they never substitute fictional project decisions.

SinglePageStartup itself is developed through the colocated `singlepage` files.
A downstream project starts with zero-content sibling `startup` files and writes
only its overrides there. `apps/studio/workspace/index/singlepage.yaml` and
`apps/studio/workspace/index/startup.yaml` remain structural registries, not
content stores. The startup index explicitly declares each `extends` relation
and resolution strategy. Missing or empty startup content passes through the
singlepage source; populated content follows the declared strategy in the
resolved `current` view.

## Figma metadata

Each reusable block/page keeps its paired manifest and `figma.json`. The files
must agree on component/page/variant names and node identifiers. Studio can
maintain local inventory and metadata; creation or editing in a real Figma file
requires an explicitly available Figma capability and target.

## Guardrails

- Keep all Studio components presentation-only and driven by static props.
- Do not import production APIs, SDK providers, authentication, React Query, or
  mutation code.
- Do not edit generated inventory as a business or design source.
- Keep project evidence distinct from generated, stock, reference, and
  decorative assets.
- Pre-development ends at concrete static design decisions. The existing
  GitHub-gated engineering workflow remains the separate next system; production
  implementation, testing, analytics, deployment, and the bridge into them are
  outside issue 222.
