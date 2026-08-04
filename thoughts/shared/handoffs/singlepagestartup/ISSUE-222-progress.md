---
issue_number: 222
issue_title: "Build the AI-native client lifecycle from first meeting to customer-acquisition website"
start_date: 2026-08-03T21:02:54Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-222.md
status: complete
completed_date: 2026-08-04
---

# Implementation Progress: ISSUE-222 - Build the AI-native client lifecycle from first meeting to customer-acquisition website

**Started**: 2026-08-03
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-222.md`

## Phase Progress

### Phase 1: Agent and Workspace Foundation

- [x] Started: 2026-08-03T21:02:54Z
- [x] Completed: 2026-08-03T21:31:59Z
- [x] Automated verification: 2026-08-03T21:25:01Z

**Notes**: GitHub comments through the plan sync marker contain no requirements
newer than the approved local plan. Provider-neutral workflows, contracts,
roles, tool bindings, compact layer scaffolds, and checkout selection now exist.
Agent validation, canonical engineering path/helper resolution, helper shell
syntax, Drafts manifests, Drafts design-system validation, and the existing
Storybook production build pass. The operator explicitly requested consecutive
execution through all phases and will perform manual review on the complete
result.

### Phase 2: Legacy Migration and Selective Inheritance

- [x] Started: 2026-08-03T21:31:59Z
- [x] Completed: 2026-08-03T21:39:40Z
- [x] Automated verification: 2026-08-03T21:39:40Z

**Notes**: Project-invariant role methods and document templates have one
indexed owner under `.agents/**`. Project-variable discovery,
acquisition-channel, and communication knowledge stays in Studio with separate
singlepage/startup sources and resolved inheritance. The legacy agency tree is
removed, while two compatibility records remain pending downstream migration
under issue #226. The project-runtime validator rejects duplicate IDs, missing
files, invalid imports, broken uses, and cycles; canonical singlepage/startup
modes and a downstream fixture pass.

### Phase 3: Drafts to Studio and Artifact Presentation

- [x] Started: 2026-08-03T21:39:40Z
- [x] Completed: 2026-08-03T21:58:04Z
- [x] Automated verification: 2026-08-03T21:58:04Z

**Notes**: The complete visual catalog and tooling moved atomically to Studio.
All 128 story files, 104 block manifests, 24 page manifests, 128 Figma metadata
files, four runnable manifests, and stable block/page IDs are preserved. Studio
validation now includes workspace integrity. Following operator review,
engineering research and plans were removed from Studio inventory and navigation
and remain exclusively in `thoughts/shared/**`. Storybook's workspace is limited
to business, marketing, brand, design, evidence, and asset projections.

### Phase 4: Compact Client Method, Active Project, and Cleanup

- [x] Started: 2026-08-03T21:58:04Z
- [x] Completed: 2026-08-03T21:58:04Z
- [x] Automated verification: 2026-08-03T21:58:04Z

**Notes**: The four stages now state inputs, capabilities, canonical outputs,
completion criteria, and reverse-dependency correction behavior. Following
operator review, the fictional example and its separate design subtree
were removed. SinglePageStartup is the live business project in the colocated
Studio `singlepage` sources; the current Studio project view resolves that base
with optional same-kind overrides from sibling `startup` sources. Repository
navigation now uses Studio and the retired agency tree is absent. Manual criteria
remain intentionally unchecked until operator review of the complete PR.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 10 -->

### Incident 10 — Active layer and niche inheritance were implicit

- **Occurrences**: 1
- **Stage**: Phase 4 - Workspace follow-up
- **Symptom**: Layer-first knowledge paths and kind-based merging left agents
  with multiple plausible workspace roots and no committed default for a
  downstream checkout.
- **Root Cause**: Repository inference and directory placement carried semantics
  that should have been explicit configuration and index data.
- **Fix**: Flattened variable data into final artifact folders, added committed
  `config.yaml` with `default_layer: startup`, mapped the canonical framework to
  `singlepage`, and required `extends` plus an artifact-specific merge strategy.
  Evidence now has scope/state semantics that prevent framework proof from
  silently supporting a downstream claim.
- **Reusable Pattern**: Put layer variants at the artifact leaf and make both
  active-layer selection and inheritance executable data.

### Incident 9 — Compact templates lacked cross-industry quality gates

- **Occurrences**: 1
- **Stage**: Phase 4 - Compact Pre-development Method follow-up
- **Symptom**: Structurally complete artifacts could remain generic and omit
  different material economics, evidence, regulation, and viability questions
  for unrelated business niches.
- **Root Cause**: The universal templates defined output shape but no selective,
  project-owned domain completeness contract.
- **Fix**: Added a decision-profile source per layer, compound business-model
  classification in Understand, material profile rows assigned to
  stages/artifacts, fit-for-purpose sourced methods/benchmarks, role-level
  checks, resolved-profile dependency routing, and validation fixtures. The
  profile now follows the same singlepage-to-startup overlay as other project
  knowledge.
- **Reusable Pattern**: Keep final artifacts universal and compact; select and
  enforce domain depth through one local routing profile rather than cloned
  industry templates or exhaustive questionnaires.

### Incident 8 — Pre-development needed a durable stage cursor

- **Occurrences**: 1
- **Stage**: Phase 4 - Compact Pre-development Method follow-up
- **Symptom**: A fresh Codex/ChatGPT task could not identify the current
  pre-development stage without reconstructing progress from the full workspace.
- **Root Cause**: Rejecting a run journal also removed the bounded cursor needed
  to resume across model contexts.
- **Fix**: Numbered the stages `00/10/20/30`, moved the workflow to
  `.agents/workflows/pre-development.md`, and added validated, layer-local
  `pre-development.yaml` cursors that are reconciled against artifact
  prerequisites on every launch.
- **Reusable Pattern**: Persist orientation, not business content: stage,
  status, active artifacts, and blockers are enough when artifacts remain the
  source of truth.

### Incident 7 — Profession responsibility and method always loaded together

- **Occurrences**: 1
- **Stage**: Phase 1 - Agent and Workspace Foundation follow-up
- **Symptom**: Every pre-development profession existed as a role plus a second
  same-named playbook even though adapters always loaded both.
- **Root Cause**: The split anticipated selective knowledge loading that the
  runtime did not implement or need.
- **Fix**: Merged methods into the seven role files, removed the profession
  knowledge directory and registry entries, simplified provider adapters, and
  moved source provenance to `.agents/roles/SOURCES.md`.
- **Reusable Pattern**: Files that describe one profession and always load
  together should be one compact role contract.

### Incident 6 — Pre-development roles existed only as canonical Markdown

- **Occurrences**: 1
- **Stage**: Phase 1 - Agent and Workspace Foundation follow-up
- **Symptom**: Codex could not discover the seven client professions, and the
  profession source links were mistaken for knowledge automatically available
  to the agent.
- **Root Cause**: Canonical role/playbook files were created without native
  `.codex/agents/*.toml` and `.claude/agents/*.md` discovery adapters; validation
  did not require the adapter set.
- **Fix**: Registered all seven agents for both providers, required explicit
  role and playbook loading, separated source provenance from runtime content,
  flattened `.agents/templates/`, and added adapter completeness checks.
- **Reusable Pattern**: Validate canonical content, provider discovery, and
  runtime loading independently; none implies the other two.

### Incident 5 — Broad Drafts rename touched generic JSON vocabulary

- **Occurrences**: 1
- **Stage**: Phase 3 - Drafts to Studio and Artifact Presentation
- **Symptom**: The first composite Studio validation rejected every block
  manifest and inspection showed invalid JSON Schema URLs.
- **Root Cause**: An initial broad rename treated the generic JSON Schema
  `draft/2020-12` token and the lifecycle state `draft` as product-name uses.
- **Fix**: Restored the standard JSON Schema URI and `draft` lifecycle value,
  kept Studio naming only for application/tool identifiers, and reran the full
  validator and production build successfully.
- **Reusable Pattern**: During a product rename, classify occurrences before
  replacement; preserve standards vocabulary and domain lifecycle values, then
  use schema/manifest validation as the first post-move check.

### Incident 4 — Project Bun lacks the system Bun YAML API

- **Occurrences**: 1
- **Stage**: Phase 2 - Legacy Migration and Selective Inheritance
- **Symptom**: Workspace validation passed with system Bun 1.3.6, but the first
  npm-driven agent validation failed because the project-pinned Bun 1.2.5 has no
  `Bun.YAML.parse`. An offline lock refresh also requested an uncached optional
  package unrelated to this change.
- **Root Cause**: Interactive shell and npm scripts resolve different Bun
  versions; the initial implementation relied on the newer global API.
- **Fix**: Switched both validators to the already installed `yaml` package,
  declared it directly, updated the existing lock entry without changing the
  dependency tree, and verified with the project Bun runtime.
- **Reusable Pattern**: Run new tooling through `npm` or
  `./node_modules/.bin/bun` before accepting a system-Bun result; prefer declared
  package APIs over version-specific globals.

### Incident 3 — GitHub API unavailable in the sandboxed status preflight

- **Occurrences**: 2 (initial issue creation and implementation resume)
- **Stage**: Phase 2 - Legacy Migration and Selective Inheritance
- **Symptom**: The mandatory status helper could resolve repository identity but
  could not query GitHub from the default sandbox.
- **Root Cause**: The sandbox has no network access to `api.github.com`.
- **Fix**: Reran the unchanged helper command with approved network access and
  confirmed issue #222 remains `In Dev`.
- **Reusable Pattern**: Keep GitHub status reads in the shared helper and rerun
  that exact command with network approval; do not replace the gate with local
  assumptions.

### Incident 2 — Mechanical migration preserved non-uniform adapter and role prose

- **Occurrences**: 1
- **Stage**: Phase 1 - Agent and Workspace Foundation
- **Symptom**: The first agent validation run reported twelve Codex wrappers
  without the normalized canonical pointer and two migrated engineering roles
  above the 700-word contract limit.
- **Root Cause**: The migration preserved heterogeneous wrapper wording and
  verbose legacy role examples while the new validator enforces one compact,
  machine-readable contract.
- **Fix**: Normalized every wrapper to `Canonical source`, replaced repeated role
  path/example lists with concise equivalent instructions, and reran validation.
- **Reusable Pattern**: Run the structural validator immediately after a
  mechanical migration, then normalize adapter metadata and role prose before
  changing downstream consumers.

### Incident 1 — `.agents` requires an elevated workspace write

- **Occurrences**: 1
- **Stage**: Phase 1 - Agent and Workspace Foundation
- **Symptom**: The deterministic migration script failed with `EPERM` while
  creating the new `.agents` directory, although the repository root is writable.
- **Root Cause**: The desktop sandbox exposes `.agents` as a protected read-only
  special path even inside the writable repository root.
- **Fix**: Reran the same bounded migration command with explicit elevated
  permission; no migration logic changed.
- **Reusable Pattern**: Request elevation before the first write that creates or
  changes `.agents`; ordinary repository writes can remain sandboxed.

## Summary

### Changes Made

- Centralized shared process semantics, roles, contracts, and tools in
  `.agents/**` with thin provider adapters.
- Added validated singlepage/startup living workspaces, layered project
  knowledge, selectively inherited agent knowledge/templates, and deterministic
  context/inventory tooling.
- Retired the duplicate agency tree and renamed the full Drafts catalog/tooling
  to SinglePageStartup Studio without losing stable manifest IDs or stories.
- Added Storybook business, marketing, and design projections driven by the
  SinglePageStartup/startup workspace and removed the isolated fictional pilot.
- Replaced the tracked workspace JSON snapshot with readable per-artifact story
  folders whose `index.stories.tsx` files import canonical Markdown/YAML sources
  directly and resolve `current` in memory.
- Consolidated configuration, layer indexes, project-specific knowledge, living
  sources, and Storybook presentation under the single
  `apps/studio/workspace/**` root; moved invariant professions/templates beside
  the agents, and removed the former repository-root workspace.
- Split every living-document view into `current`, `singlepage`, and `startup`;
  Design repeats the same split for every visual projection.
- Reset all committed colocated `startup` living sources to zero content;
  `current` passes through singlepage until a real override is written.
- Registered all seven pre-development professions as native Codex and Claude
  agents whose thin adapters load one consolidated canonical role containing
  responsibility and professional method.
- Flattened artifact templates into `.agents/templates/`, documented their
  four-stage sequence and legacy lineage, and separated bibliographic
  provenance from runtime profession instructions.
- Numbered the pre-development stages `00/10/20/30` and added a minimal
  layer-local cursor so new model contexts resume from verified artifacts rather
  than chat history or context compaction.
- Added a layered decision profile that classifies compound business models and
  makes material questions, metrics, evidence, risks, regulations, and viability
  rules mandatory stage gates without expanding the eight final artifacts.
  Empty startup content inherits singlepage; populated niche knowledge replaces
  it so unrelated domain constraints do not accumulate.
- Flattened the workspace to artifact-first folders, moved indexes and cursors
  under their own top-level directories, and added a committed configuration
  whose downstream default is `startup` while the canonical repository maps to
  `singlepage`.
- Made every startup inheritance edge and merge strategy explicit. Documents use
  section overlays, assets use keyed overlays, evidence uses scoped keyed rows,
  and project-specific knowledge uses replacement semantics.

### Pull Request

- [x] PR created: https://github.com/singlepagestartup/singlepagestartup/pull/225
- [x] PR number: 225

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-08-04T23:45:00+03:00
