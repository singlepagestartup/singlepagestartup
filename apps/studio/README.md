# SinglePageStartup Studio

`apps/studio` is the repository's read-only presentation system. It combines
three projections without becoming a second source of truth:

- existing presentation-only module and page components;
- validated business, brand, design, evidence, and asset artifacts from an
  indexed workspace;
- path-stable engineering research and plans from `thoughts/shared/**`.

Canonical client artifacts stay in `workspace/<layer>/**` or an explicitly
selected example/downstream workspace. Studio inventory is generated from those
files and may be recreated at any time.

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

`studio:validate` checks runnable manifests, module/page/Figma metadata, both
canonical workspace layers, inheritance rules, dependency cycles, and invalid
fixtures. Validate an example directly with:

```bash
bun tools/studio/workspace/validate.ts \
  --workspace-root examples/founder-pilot/workspace \
  --active-layer startup
```

`studio:inventory` regenerates:

- `inventory/modules.generated.json` from production module variant contracts
  and Studio manifests;
- `inventory/workspace.generated.json` from canonical/explicit workspace graphs
  and engineering artifacts.

## Layout

```text
apps/studio/
  .storybook/                 Storybook configuration
  foundations/                Shared presentation tokens and Figma variables
  inventory/                  Derived navigation and coverage data
  modules/                    Existing module/page projections
  runnable/<layer>/           Standalone imported prototypes
  runtime/                    Studio-only styles and static runtime
  workspace/                  Artifact viewers and static design compositions
  system.manifest.json        Studio roots and generated inventory pointers
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

Storybook discovers `apps/studio/workspace/**/*.stories.tsx`. The artifact
browser shows canonical content, source paths, imports, dependencies, and
computed reverse dependencies. A startup view contains only its local files and
explicitly imported singlepage knowledge/templates; it cannot navigate into
non-exported singlepage project artifacts.

The founder pilot lives under `examples/founder-pilot/**`, is loaded through an
explicit workspace root, and does not populate the reusable
`workspace/startup/` scaffold.

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
- Keep client evidence distinct from generated, stock, reference, and
  decorative assets.
- Client pre-development ends at concrete static design decisions. The existing
  GitHub-gated engineering workflow remains the separate next system; production
  implementation, testing, analytics, deployment, and the bridge into them are
  outside issue 222.
