---
issue_number: 222
issue_title: "Build the AI-native client lifecycle from first meeting to customer-acquisition website"
start_date: 2026-08-03T21:02:54Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-222.md
status: in_progress
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

**Notes**: Reusable discovery, acquisition-channel, communication, role, and
template knowledge has one indexed owner plus a migration/omission map. The
legacy agency tree is removed. The project-runtime validator rejects duplicate
IDs, missing files, invalid imports, broken uses, and cycles; canonical
singlepage/startup modes and a downstream fixture pass. Requested website
context loads only its eight-artifact dependency closure.

### Phase 3: Drafts to Studio and Artifact Presentation

- [x] Started: 2026-08-03T21:39:40Z
- [x] Completed: 2026-08-03T21:58:04Z
- [x] Automated verification: 2026-08-03T21:58:04Z

**Notes**: The complete visual catalog and tooling moved atomically to Studio.
All 128 story files, 104 block manifests, 24 page manifests, 128 Figma metadata
files, four runnable manifests, and stable block/page IDs are preserved. Studio
validation now includes workspace integrity; generated inventory exposes three
workspaces plus 37 engineering research and 33 plan artifacts. Storybook Docs,
read-only artifact/reverse-dependency views, and static design shells build
successfully. The final index has 165 entries: the original 149 plus exactly 16
workspace/design story and docs entries.

### Phase 4: Compact Client Method, Founder Pilot, and Cleanup

- [x] Started: 2026-08-03T21:58:04Z
- [x] Completed: 2026-08-03T21:58:04Z
- [x] Automated verification: 2026-08-03T21:58:04Z

**Notes**: The four stages now state inputs, capabilities, canonical outputs,
completion criteria, and reverse-dependency correction behavior. The isolated
founder pilot contains eight local artifacts, a complete operating process,
current sourced market observations, one bounded experiment, a provenance-aware
identity, final page/form/success copy, four indexed vector assets, and nine
concrete Studio compositions. Canonical `workspace/startup/` remains an
eight-artifact clean scaffold and exposes no non-exported singlepage project
files. Repository navigation now uses Studio and the retired agency tree is
absent. Manual criteria remain intentionally unchecked until operator review of
the complete PR.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 5 -->

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

- (populated during implementation)

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [ ] All phases completed
- [ ] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-08-03T21:58:04Z
