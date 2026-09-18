# SinglePageStartup agent system

This directory is the provider-neutral source of truth for AI workflows,
professional responsibilities, invariant contracts, and tool capabilities.
Provider directories such as `.claude/` and `.codex/` contain only native
discovery metadata and adapters to these files.

## Ownership

- `workflows/engineering/` preserves the existing GitHub-Project-gated
  development process.
- `workflows/pre-development.md` coordinates the local process before
  engineering: the preflight, the cursor, the pipeline check, decision-scoped
  loading, the stage sequence and the handoff.
- `workflows/design-to-implementation.md` owns the build order after
  pre-development: draft the page in `apps/studio/workspace`, project its
  parts into `apps/studio/modules` and judge them in Storybook without data,
  then implement in `libs/modules` against `apps/api`.
- `pipeline/pre-development.yaml` declares the stage machine: stage order and
  cursor vocabulary, owners, active artifacts, executable checks,
  manual-review criteria and legacy-shape detectors.
  `npm run singlepagestartup:pipeline:check` executes it and writes nothing.
- `roles/` contains one flat file per profession with its responsibility,
  boundary, method, thresholds and handoff. `roles/SOURCES.md` is provenance
  only and is not routine context.
- `templates/` contains one structural schema per living artifact and the
  agreed sequence and page ownership in `templates/README.md`.
- `contracts/` contains rules that apply across roles and workflows:
  `inheritance.md` for layers, projections, indexes, atomic catalogs and
  downstream applicability; `evidence.md` for claims, unknowns, sources and
  assets; `document-confirmation.md` for approval and review state;
  `github-reconciliation.md` for the commit preflight; `tool-use.md` for
  capabilities; and `editorial-pass.md`, the final pass for prose written for
  people, which every role and workflow invokes and provider adapters inherit.
- `migrations/` holds dated one-time procedures for legacy workspace shapes,
  loaded only when the pipeline check reports such a shape.
- `tools/` defines provider-neutral capabilities, their allowed roles and
  provider bindings.

Executable GitHub helpers remain under `.claude/helpers/` for path compatibility;
they are shared runtime utilities, not Claude-owned process definitions.

Shared-change propagation uses `contracts/engineering/downstream-migrations.md`:
the commit workflow preserves adaptation instructions in Git, and
the separately requested `workflows/engineering/adapt-upstream.md` applies them
to child-owned code and documents using local history. Synchronization and agent
startup do not run this adaptation command or depend on its completion.
`tools/upstream/migrations.mjs` checks integrated history and maintains a small
checkout-local Git cursor; it does not store project facts or run commit text.

## Loading rule

Context selection exists to prevent project and role collisions, not to limit
investigation. Start from `workflows/pre-development.md`, which orders the
GitHub preflight, the layer-local cursor, the pipeline check and the
decision-scoped loading of artifacts, roles and templates. Read the
`singlepage → startup → default` resolution but write only to the
repository-owned layer, as `contracts/inheritance.md` defines. Canonical files
are not provider discovery entries: a provider adapter must explicitly load the
matching role, and a registry ID or source URL alone never adds content to the
model context.
