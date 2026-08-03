# SinglePageStartup agent system

This directory is the provider-neutral source of truth for AI workflows,
professional responsibilities, invariant contracts, and tool capabilities.
Provider directories such as `.claude/` and `.codex/` contain only native
discovery metadata and adapters to these files.

## Ownership

- `workflows/engineering/` preserves the existing GitHub-Project-gated
  development process.
- `workflows/client/pre-development.md` coordinates the local client process
  before development: Understand, Decide, Package, and Design.
- `roles/` contains one flat file per profession. Workflow order and document
  templates do not belong in role files.
- `contracts/` contains rules that apply across roles and workflows.
- `tools/` defines provider-neutral capabilities and provider bindings.

Executable GitHub helpers remain under `.claude/helpers/` for path compatibility;
they are shared runtime utilities, not Claude-owned process definitions.

## Loading rule

Start with the active workflow and the role that owns the target artifact. Load
only the dependency closure declared in the active workspace index and only the
professional knowledge needed for the decision. Do not load all workflows,
roles, knowledge, templates, or both project layers into one context.
