# SinglePageStartup agent system

This directory is the provider-neutral source of truth for AI workflows,
professional responsibilities, invariant contracts, and tool capabilities.
Provider directories such as `.claude/` and `.codex/` contain only native
discovery metadata and adapters to these files.

## Ownership

- `workflows/engineering/` preserves the existing GitHub-Project-gated
  development process.
- `workflows/pre-development.md` coordinates the local process before
  engineering through durable `00`, `10`, `20`, `30`, and `40` stages.
- `roles/` contains one flat file per profession with its responsibility,
  boundary, professional method, completion criteria, capabilities, and
  handoff. `roles/SOURCES.md` is provenance only and is not routine context.
- `templates/` contains one structural schema per living artifact and documents
  their agreed pre-development sequence in `templates/README.md`; its compact
  decision-profile template routes project-specific domain depth without
  becoming a client-facing final artifact.
- `contracts/` contains rules that apply across roles and workflows.
- `tools/` defines provider-neutral capabilities and provider bindings.

Executable GitHub helpers remain under `.claude/helpers/` for path compatibility;
they are shared runtime utilities, not Claude-owned process definitions.

## Loading rule

Context selection exists to prevent project and role collisions, not to limit
investigation. Quality and decision correctness take precedence over response
length, number of turns, execution time, or token use. Load additional relevant
material whenever it is needed to verify a material claim or complete the
professional review.

Primary living documents remain operator-readable: no more than 1,400 words,
one current decision per topic, and no interview chronology or workflow history.
Evidence and assets are reference registers and are loaded by current use.

Start with the active workflow and resolve the repository-owned layer. Run the
mandatory GitHub preflight before reading the layer-local
`apps/studio/workspace/pre-development/<layer>.yaml` cursor. Reconcile the cursor
against the current pipeline using `contracts/pipeline-reconciliation.md`, then
against its artifact prerequisite closure, and only then load the active
consolidated role and the resolved decision-profile rows assigned to that stage
and owner. Read the singlepage-to-startup resolution but write changes only to
the repository-owned layer's source. Domain-specific knowledge replaces the
base once startup content is meaningful. Do not load all workflows, roles,
profile stages, knowledge, templates, or both complete project layers into one
context.

Pipeline reconciliation runs on every invocation. It compares current templates,
index declarations, completion rules, and existing artifact shapes, so a newly
synchronized shared workflow automatically routes missing sections to the
earliest affected stage in both the framework and downstream repositories. It
stores no pipeline version or migration journal and requires no separate user
command.

Canonical files are not provider discovery entries. A provider adapter must
explicitly load the matching role. Codex does this through
`.codex/agents/<role>.toml`; a registry ID or source URL alone never adds content
to the model context.

## Pre-development workspace projections

The pre-development workflow uses three consistently named Workspace views:

| View         | Purpose                                                                |
| ------------ | ---------------------------------------------------------------------- |
| `singlepage` | Editable business and design source owned by the framework repository. |
| `startup`    | Editable override source owned by a downstream project.                |
| `default`    | Read-only result after applying startup to singlepage in memory.       |

Agents resolve `singlepage → startup → default`, but write only to the active
repository-owned `singlepage` or `startup` source. They never create or edit a
`default` Markdown, YAML, or generated content file. An empty startup source
passes singlepage through unchanged; product catalogs follow the atomic
replacement rule defined in `workflows/pre-development.md`.

Brief owns the operator-confirmed current/intended offer portfolio. Strategy
selects the exact active product set and first priority from that portfolio, and
Products must match it exactly. A showcase, reference project, possible future
payment, repository folder, or agent idea never creates a catalog entry by
inference.

The owner reviews `default` first in Storybook Studio and opens `singlepage` or
`startup` only to inspect provenance or edit the corresponding canonical source.
