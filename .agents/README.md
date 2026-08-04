# SinglePageStartup agent system

This directory is the provider-neutral source of truth for AI workflows,
professional responsibilities, invariant contracts, and tool capabilities.
Provider directories such as `.claude/` and `.codex/` contain only native
discovery metadata and adapters to these files.

## Ownership

- `workflows/engineering/` preserves the existing GitHub-Project-gated
  development process.
- `workflows/pre-development.md` coordinates the local process before
  engineering through durable `00`, `10`, `20`, and `30` stages.
- `roles/` contains one flat file per profession with its responsibility,
  boundary, professional method, completion criteria, capabilities, and
  handoff. `roles/SOURCES.md` is provenance only and is not routine context.
- `templates/` contains one structural schema per living artifact and documents
  their agreed pre-development sequence in `templates/README.md`; its compact
  decision-profile template routes project-specific domain depth without adding
  a ninth final artifact.
- `contracts/` contains rules that apply across roles and workflows.
- `tools/` defines provider-neutral capabilities and provider bindings.

Executable GitHub helpers remain under `.claude/helpers/` for path compatibility;
they are shared runtime utilities, not Claude-owned process definitions.

## Loading rule

Start with the active workflow and the role that owns the target artifact. Load
the layer-local `apps/studio/workspace/pre-development/<layer>.yaml` cursor
first, reconcile it against its artifact prerequisite closure, then load only the active consolidated role and
the resolved decision-profile rows assigned to that stage and owner. Read the
singlepage-to-startup resolution but write changes only to the active layer's
source. Domain-specific knowledge replaces the base once startup content is
meaningful. Do not load all workflows, roles, profile stages, knowledge,
templates, or both complete project layers into one context.

Canonical files are not provider discovery entries. A provider adapter must
explicitly load the matching role. Codex does this through
`.codex/agents/<role>.toml`; a registry ID or source URL alone never adds content
to the model context.
