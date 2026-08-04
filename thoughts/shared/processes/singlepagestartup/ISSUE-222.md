---
issue_number: 222
issue_title: "Build the AI-native client lifecycle from first meeting to customer-acquisition website"
repository: singlepagestartup
created_at: 2026-08-02T20:13:08Z
last_updated: 2026-08-04T23:45:00+03:00
status: active
current_phase: complete
---

# Process Log: ISSUE-222 - Build the AI-native client lifecycle from first meeting to customer-acquisition website

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow
learnings for the unified customer-delivery and artifact-system initiative.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: complete
- Next step: manual code review and merge PR #225.

## Phase Notes

### Create

- Summary: Synthesized the shared ChatGPT conversation and the operator's
  clarification into umbrella issue #222 for an AI-native client lifecycle from
  the first meeting to a measurable, published customer-acquisition website.
- Outputs: Ticket at
  `thoughts/shared/tickets/singlepagestartup/ISSUE-222.md`; process log at
  `thoughts/shared/processes/singlepagestartup/ISSUE-222.md`; GitHub issue at
  `https://github.com/singlepagestartup/singlepagestartup/issues/222`.
- Notes: Priority inferred as high, size as large, and type as feature because
  the request introduces a new cross-repository business workflow and artifact
  system. Existing QA and deployment are explicitly treated as reusable
  capabilities rather than new implementation scope. The issue was added to
  GitHub Project #2, transitioned through Triage, and left in Research Needed.
  The issue description was then made self-contained: the private shared-chat
  URL was removed and replaced with a compact discussion summary. After operator
  review, the target repository architecture and the mandatory dependency-ordered
  refactoring sequence were restored explicitly instead of being deferred to a
  generic migration-plan statement. The operator then selected a single-change
  execution strategy: issue #222 will use one dedicated implementation branch
  and one cohesive delivery, with the numbered phases retained as internal
  checkpoints that must be exercised and verified in practice before continuing.

### Research

- Summary: Documented the live pre-refactoring architecture for the canonical
  engineering workflow and provider adapters, thoughts-based durable memory,
  singlepage/startup inheritance, Drafts/Storybook catalog, legacy
  digital-agency method, production module surfaces, and existing QA/deployment
  boundaries. The requested .agents, workspace, .sps, apps/studio, general
  artifact resolver, version-locked knowledge inheritance, and resolved/diff
  projections are not implemented in the current checkout.
- Outputs: Research artifact at
  thoughts/shared/research/singlepagestartup/ISSUE-222.md. Baseline verification
  passed with npm run drafts:validate, npm run drafts:ds:validate, and npm run
  drafts:storybook:build; the built Storybook 10.4.6 index contains 149 entries.
- Notes: The live catalog contains 128 story files, 104 block manifests, 24 page
  manifests, and 128 Figma metadata files; manifest layers are 126 singlepage
  and 2 startup. Research also confirmed that QA and deployment are established
  reusable systems, not missing subsystems. The issue's one-branch/one-PR
  execution contract and dependency-ordered practical checkpoints are preserved
  as planning inputs. No production code, workflow definitions, deployment
  configuration, or runtime data was changed during research.

### Plan

- Summary: Operator narrowed the target to the pre-development client system and
  then rejected the first full plan because it fragmented one project across too
  many artifacts and stopped short of an implementation-ready business, brand,
  content, and Storybook design result. The revised plan uses four
  pre-development stages,
  eight compact living artifact types, and four repository checkpoints.
- Outputs: Implementation plan at
  `thoughts/shared/plans/singlepagestartup/ISSUE-222.md`.
- Notes: Both layers now use colocated `brief`, `evidence`, `business`,
  `research`, `strategy`, `brand`, `website`, and asset-registry sources beside
  their Studio stories. The method is Understand,
  Decide, Package, Design. `business.md` must contain the complete operating
  process; `strategy.md` a bounded first experiment; `brand.md` usable identity
  outputs; and `website.md` real page copy and post-conversion behavior. The
  SinglePageStartup itself is the live project in `singlepage` sources;
  downstream projects override matching content in sibling `startup` sources.
  A deterministic loader enforces indexes,
  imports/exports, dependencies, cycles, and reverse dependencies. Inheritance
  is explicitly semantic/context isolation over normal Git sync, not a physical
  confidentiality guarantee. Checkout selection uses a gitignored local config
  plus repository-identity fallback. Studio must build real brand, landing,
  mobile, form, success, and acquisition compositions. Engineering research and
  plans stay exclusively in `thoughts/shared/**`. Technical Studio and adapter checks are required,
  but production implementation, client QA, deployment, runtime orchestration,
  and engineering workflow changes remain out of scope. All professions now live
  directly in the flat `.agents/roles/` directory and use their exact profession
  names as stable IDs. Phase 1 explicitly researches and synthesizes seven
  source-backed role contracts instead of accepting the legacy agency personas:
  each contract is capped at 700 words, excludes fictional biography, memory,
  theatrical performance, repeated workflow/templates, and provider tool prose,
  and loads deeper professional methods on demand. Normal and red-flag founder
  SinglePageStartup project decisions are compared with both the legacy role and
  a generalist baseline; an instruction is retained only when it improves artifact quality
  relative to its context cost.

### Implement

- Summary: Implementation started from the approved compact four-phase plan.
- Outputs: Operational progress is tracked at
  `thoughts/shared/handoffs/singlepagestartup/ISSUE-222-progress.md`.
- Notes: GitHub Project status passed the `Ready for Dev` gate and was moved to
  `In Dev`. Comments newer than the plan sync marker contain no additional scope
  or constraints. Phase 1 automated verification now passes for agent/adaptor
  structure, workspace selection, canonical engineering helper resolution,
  helper shell syntax, Drafts manifests/design-system validation, and the
  existing Storybook production build. The phase is waiting at its manual
  checkpoint before Phase 2 begins. The operator then explicitly requested
  consecutive execution through all phases and deferred manual review until the
  complete result. Phase 2 migrated reusable legacy knowledge and templates,
  removed the parallel agency tree, and added deterministic two-sided
  inheritance with negative fixtures and minimal-context verification.
  Phases 3 and 4 then moved the complete presentation catalog to Studio and
  integrated direct canonical workspace sources with Docs. Operator review then
  removed the fictional example: Studio now presents the active project as a
  resolved `current` view plus isolated `singlepage` and `startup`
  sources. The same split applies to every Design projection. The original
  module stories, manifests/Figma pairs, runnable
  projects, and stable manifest IDs remain.
  Operator review clarified that the committed startup living files must be
  truly zero-content, not heading-only scaffolds; `current` therefore passes
  through `singlepage` until a downstream project writes an override.
  A later boundary review moved invariant profession methods and document
  templates beside the agents under `.agents/**`, while project-variable
  discovery, acquisition, and communication knowledge now has separate
  singlepage/startup sources in Studio and resolves through the same overlay
  mechanism. Legacy migration evidence remains temporarily; issue #226 tracks
  its deletion after all maintained downstream projects are updated.
  A subsequent quality review found that the compact templates guaranteed file
  shape but not sufficient depth across unrelated industries. The workflow now
  maintains a resolved singlepage-to-startup domain decision profile during
  Understand; material questions, metrics, evidence, risks, regulations, and
  viability rules become mandatory stage gates while the eight final artifacts
  remain unchanged.
  All required automated checks pass and PR #225 contains the cohesive
  implementation. Manual Storybook/workspace review remains for the operator at
  the Code Review gate; production integration stays outside this issue.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions,
> tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 16 -->

### Incident 16 — Layer-first paths and implicit merging left agent routing ambiguous

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: Project artifacts were colocated by kind, but indexes, cursors,
  and knowledge still used competing `singlepage/` and `startup/` roots. The
  active layer depended on repository inference, same-kind pairing implied the
  merge algorithm, and inherited framework evidence could be mistaken for proof
  about an unrelated downstream business.
- **Root Cause**: The physical layout and resolver retained intermediate
  migration concepts instead of making the artifact folder, active-layer
  configuration, inheritance edge, and merge semantics explicit.
- **Fix**: Flattened all variable project content into artifact-first folders,
  moved registries and cursors to `index/<layer>.yaml` and
  `pre-development/<layer>.yaml`, committed `config.yaml` with a `startup`
  default and canonical-repository mapping, and required every startup entry to
  declare `extends` plus `sections`, `keyed`, `scoped-keyed`, or `replace`.
  Evidence rows now carry scope and state; inherited singlepage evidence is
  provenance only in startup until explicitly adopted or superseded.
- **Preventive Action**: Resolve variant selection from committed configuration,
  express inheritance and merge strategy in data, and place both layer sources
  at the final artifact level. Never let directory position or prompt wording
  decide which niche knowledge or claims an agent may use.
- **References**: `apps/studio/workspace/config.yaml`;
  `apps/studio/workspace/index/{singlepage,startup}.yaml`;
  `.agents/contracts/{context-loading,evidence}.md`;
  `tools/studio/workspace/{loader,merge,validate}.ts`.

### Incident 15 — Decision profile violated uniform workspace inheritance

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: Empty startup documents inherited SinglePageStartup and
  non-empty sections overrode it, but `decision-profile.md` was a special local
  exception. The framework therefore could not exercise the same complete
  knowledge path as a downstream project.
- **Root Cause**: Domain isolation was implemented by bypassing inheritance
  instead of treating startup as the explicit override layer for all
  project-variable knowledge.
- **Fix**: Added `decision-profile` to the layered workspace kinds, retained
  both source paths, routed dependencies to the resolved profile, and added
  replacement and empty-pass-through fixtures. The startup entry now explicitly
  extends the base with `strategy: replace`, so an empty file inherits while a
  populated niche profile excludes unrelated framework rules.
- **Preventive Action**: Apply one variant-style rule to all project content:
  `singlepage` is the base, `startup` is the override, and `current` is the
  in-memory resolution. Declare the merge strategy rather than assuming every
  content type is safely merged by sections.
- **References**: `tools/studio/workspace/{loader,validate}.ts`;
  `.agents/contracts/context-loading.md`;
  `.agents/workflows/pre-development.md`.

### Incident 14 — Universal templates had no domain-specific completion gate

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: The eight templates produced a stable document shape, but two
  unrelated niches could satisfy the same headings with generic prose while
  omitting different unit economics, stakeholders, evidence, regulation, risks,
  and viability conditions. The result was not demonstrably better than an
  unstructured model conversation.
- **Root Cause**: Token-efficiency work correctly removed exhaustive generic
  questionnaires but did not replace them with a project-specific mechanism for
  selecting material domain depth and enforcing it at stage completion.
- **Fix**: Added one non-final `decision-profile.md` template and separate
  layer sources. `00-understand` now classifies potentially
  compound business models and records only material questions, metrics,
  evidence, risks, regulations, viability rules, owning artifacts, stages, and
  sourced professional methods whose fit and limitations are explicit. Every
  role and stage gate must resolve its assigned rows. Incident 15 subsequently
  aligned those sources with the normal singlepage-to-startup overlay.
- **Preventive Action**: Keep final artifacts universal, but make domain depth a
  selective project-owned routing contract. Never equate populated headings or
  fluent best practices with a completed artifact.
- **References**: `.agents/templates/decision-profile.md`;
  `.agents/workflows/pre-development.md`;
  `apps/studio/workspace/knowledge/decision-profile/{singlepage,startup}.md`;
  `tools/studio/workspace/{loader,validate}.ts`.

### Incident 13 — Artifact-only progress could not resume deterministically

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: The pre-development workflow named four stages but persisted no
  current stage. A fresh model context had to infer progress by reopening the
  whole artifact graph and could not distinguish current work from completed or
  downstream documents.
- **Root Cause**: The earlier rejection of a heavy run-state system was applied
  too broadly and removed the small durable cursor needed for multi-task agent
  execution.
- **Fix**: Moved the canonical process to
  `.agents/workflows/pre-development.md`, assigned stable `00`, `10`, `20`, and
  `30` stage IDs, and added one layer-local `pre-development.yaml` containing
  only stage, status, active artifacts, and blockers. Every launch reconciles
  that cursor against artifact prerequisites, so artifacts repair an interrupted
  cursor and remain the business source of truth.
- **Preventive Action**: Distinguish a bounded resumable cursor from a run
  journal or duplicated state machine. Long agent workflows need the former;
  business decisions, history, timestamps, and document copies do not belong in
  it.
- **References**: `.agents/workflows/pre-development.md`;
  `apps/studio/workspace/pre-development/{singlepage,startup}.yaml`;
  `tools/singlepagestartup/agents/validate.ts`.

### Incident 12 — One profession was split across two always-loaded files

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `.agents/roles/<profession>.md` and
  `.agents/knowledge/professions/<profession>.md` shared the same profession name
  and every provider adapter always loaded both, so the supposed selective
  knowledge layer added navigation and token overhead without changing runtime
  selection.
- **Root Cause**: The architecture separated responsibility from method before
  proving that either file had an independent loading lifecycle.
- **Fix**: Merged the useful method into each role's `Required method`, removed
  the seven playbooks, their index, `profession.*` workspace entries, exports,
  and imports, and simplified both provider adapters to one canonical pointer.
  Moved source provenance to `.agents/roles/SOURCES.md` and extended validation
  to reject the obsolete directory, `knowledge` role metadata, or a second
  playbook pointer.
- **Preventive Action**: Split knowledge only when it is selected independently
  at runtime. Files that always load together and describe the same profession
  belong in one compact contract.
- **References**: `.agents/roles/*.md`; `.agents/roles/SOURCES.md`;
  `tools/singlepagestartup/agents/validate.ts`.

### Incident 11 — Canonical profession files were not registered as provider agents

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: The pre-development workflow named seven artifact owners, but Codex could
  not discover any of them as custom agents. The role frontmatter referenced
  profession knowledge, yet nothing guaranteed that the playbook was loaded.
  Source URLs inside the playbooks looked like runtime inputs even though links
  do not add their contents to an agent context.
- **Root Cause**: Phase 1 migrated the canonical role content and existing
  engineering adapters but did not create provider discovery adapters for the
  new pre-development professions. Structural validation checked pointers that
  existed, not the required one-to-one adapter set.
- **Fix**: Added seven `.codex/agents/*.toml` custom agents and matching Claude
  adapters, documented that live research must be explicit, and extended the
  validator to require provider discovery and runtime loading. Incident 12 then
  consolidated responsibility and method into the single role file. Flattened
  the artifact templates from `.agents/templates/client/` to
  `.agents/templates/` and added a sequence/provenance contract.
- **Preventive Action**: Treat canonical content, provider discovery, and
  runtime loading as three separate checks. A role ID, file path, or source URL
  is not evidence that the provider will load it.
- **References**: `.codex/agents/account-manager.toml`;
  `.agents/roles/account-manager.md`; `.agents/templates/README.md`;
  `tools/singlepagestartup/agents/validate.ts`.

### Incident 10 — Broad Drafts rename touched generic JSON vocabulary

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: The first composite Studio validation rejected every block
  manifest and inspection showed invalid JSON Schema URLs.
- **Root Cause**: An initial broad rename treated the generic JSON Schema
  `draft/2020-12` token and the lifecycle state `draft` as product-name uses.
- **Fix**: Restored the standard JSON Schema URI and `draft` lifecycle value,
  retained Studio naming only for product identifiers, and reran validation and
  the Storybook production build successfully.
- **Preventive Action**: Classify rename occurrences before replacement;
  preserve standards vocabulary and domain lifecycle values, then run schemas
  and manifest validators immediately after the move.
- **References**: `apps/studio/*.schema.json`;
  `tools/studio/design-system/validate.ts`; `npm run studio:validate`.

### Incident 9 — Project Bun lacks the system Bun YAML API

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: Workspace validation passed with system Bun 1.3.6, but the first
  npm-driven agent validation failed because project Bun 1.2.5 has no
  `Bun.YAML.parse`. An offline lock refresh also requested an uncached optional
  package unrelated to this change.
- **Root Cause**: Interactive shell and npm scripts resolve different Bun
  versions; the initial implementation relied on the newer global API.
- **Fix**: Switched both validators to the already installed `yaml` package,
  declared it directly, updated the existing lock entry without changing the
  dependency tree, and verified with the project Bun runtime.
- **Preventive Action**: Run new tooling through `npm` or
  `./node_modules/.bin/bun` before accepting a system-Bun result; prefer declared
  package APIs over version-specific globals.
- **References**: `tools/drafts/workspace/loader.ts`;
  `tools/drafts/workspace/validate.ts`; `package.json`; `package-lock.json`.

### Incident 8 — Mechanical migration preserved non-uniform adapter and role prose

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: The first agent validation run reported twelve Codex wrappers
  without the normalized canonical pointer and two migrated engineering roles
  above the 700-word contract limit.
- **Root Cause**: The migration preserved heterogeneous wrapper wording and
  verbose legacy role examples while the new validator enforces one compact,
  machine-readable contract.
- **Fix**: Normalized every wrapper to `Canonical source`, replaced repeated role
  path/example lists with concise equivalent instructions, and reran validation
  successfully.
- **Preventive Action**: Run the structural validator immediately after a
  mechanical migration, then normalize adapter metadata and role prose before
  changing downstream consumers.
- **References**: `tools/singlepagestartup/agents/validate.ts`;
  `.codex/skills/**`; `.agents/roles/**`.

### Incident 7 — `.agents` requires an elevated workspace write

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: The deterministic Phase 1 migration failed with `EPERM` while
  creating `.agents` inside the otherwise writable checkout.
- **Root Cause**: The desktop sandbox exposes `.agents` as a protected read-only
  special path.
- **Fix**: Reran the same bounded migration command with explicit elevated
  permission.
- **Preventive Action**: Request elevation before the first write that creates or
  changes `.agents`; keep other repository writes sandboxed.
- **References**: `.agents/**`;
  `thoughts/shared/handoffs/singlepagestartup/ISSUE-222-progress.md`.

### Incident 1 — GitHub API unavailable in the sandboxed preflight

- **Phase**: Create, Implement
- **Occurrences**: 2
- **Symptom**: Loading the repository/project configuration printed GitHub CLI
  connectivity errors while still resolving the configured repository and
  Project identifiers.
- **Root Cause**: The default sandboxed shell has no access to `api.github.com`.
- **Fix**: Rerun the unchanged helper-driven creation or status flow with
  approved network access. The implementation-resume occurrence confirmed the
  required `In Dev` gate.
- **Preventive Action**: Keep the whole create/project/status sequence in one
  fail-fast `bash -lc` block and escalate the same helper command when GitHub is
  unavailable; do not replace it with ad hoc issue or Project commands.
- **References**: `.codex/skills/core-00-create/SKILL.md`;
  `.claude/commands/core/00-create.md`;
  `.claude/helpers/create_issue_with_project.sh`.

### Incident 2 — Shell expansion temporarily submitted an empty issue body

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: The first attempt to stream the updated local ticket into
  `gh issue edit --body-file -` expanded the sed `$p` expression under
  `set -u`; sed failed and GitHub accepted an empty stdin body.
- **Root Cause**: The nested `bash -lc` quoting did not preserve the literal sed
  address expression.
- **Fix**: Immediately restored the issue body from the known local ticket using
  `tail -n +21 ... | gh issue edit --body-file -`, then verified the remote body
  contains the problem, architecture, and refactoring-sequence sections and no
  private chat URL.
- **Preventive Action**: For GitHub body synchronization, prefer a prepared
  `--body-file` or a line-number-based stream that does not contain shell
  expansion syntax; always verify the remote body length and required headings.
- **References**: `thoughts/shared/tickets/singlepagestartup/ISSUE-222.md`;
  `https://github.com/singlepagestartup/singlepagestartup/issues/222`.

### Incident 3 — The source discussion and current issue encode different migration targets

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: The attached source discussion places the canonical business
  workspace under `apps/studio/` and proposes removing GitHub Project gates from
  the critical path, while an intermediate revision temporarily proposed a
  separate repository-root artifact directory and a local client workflow.
- **Root Cause**: The target architecture evolved through later operator
  clarifications after the original discussion was captured.
- **Fix**: Treat the current self-contained issue and its recorded operator
  annotations as the authoritative intent. The final operator decision keeps
  the engineering gates and consolidates all client-business context under
  `apps/studio/workspace/**`, with no second repository-root workspace.
- **Preventive Action**: Keep the engineering and client state machines separate,
  state precedence decisions in migration plans, and do not delete or relocate
  legacy artifacts until compatibility, fixture, link, and parity checks pass.
- **References**: `thoughts/shared/tickets/singlepagestartup/ISSUE-222.md`;
  `thoughts/shared/research/singlepagestartup/ISSUE-222.md`;
  `/Users/rogwild/.codex/attachments/e7ed84a2-5749-4a58-8d65-4917019e836f/pasted-text.txt`.

### Incident 4 — The first plan outline extended beyond the requested pre-development boundary

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: The proposed outline included client run-state machinery,
  versioned brand artifacts, tests, QA/deployment reuse, production module
  integration, and an engineering handoff.
- **Root Cause**: The outline carried broad targets from the umbrella issue and
  source discussion forward after the operator's intended near-term hypothesis
  had narrowed to business discovery, market analysis, communication, brand,
  and concrete design decisions before development begins.
- **Fix**: Remove all engineering-stage work and supporting orchestration from
  the outline, keep the existing development workflow semantics intact, simplify
  inheritance and artifacts, and treat Codex/ChatGPT text, research, and image
  generation as the execution environment for the pre-development system.
- **Preventive Action**: Express every planned output against the explicit
  boundary “before development”; avoid introducing lifecycle machinery,
  namespaces, versioning, or integration layers unless a current artifact needs
  them.
- **References**: `thoughts/shared/tickets/singlepagestartup/ISSUE-222.md`;
  operator annotations recorded during the plan approval checkpoint.

### Incident 5 — A zsh loop variable shadowed the shell command search path

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: The final `rg` command in the plan preflight reported
  `command not found` after a source-path existence loop, although the first
  `rg` command in the same shell invocation had succeeded.
- **Root Cause**: The loop used `path` as its variable name; in zsh, `path` is the
  special array tied to `PATH`, so the loop overwrote command lookup state.
- **Fix**: Reran the unfinished checks in a fresh shell without assigning the
  special `path` variable. The expected Drafts script/target references and plan
  metadata were confirmed.
- **Preventive Action**: Use task-specific loop names such as `source_file` in
  zsh preflight commands; never use `path` as a local loop variable.
- **References**: `thoughts/shared/plans/singlepagestartup/ISSUE-222.md`;
  `package.json`; `project.json`.

### Incident 6 — The first full plan optimized repository structure more than the client result

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: The plan used eight implementation checkpoints and roughly twenty
  living files per project layer, omitted a full operating process and first
  experiment, and allowed Studio to stop at Markdown, moodboards, and abstract
  page concepts.
- **Root Cause**: Earlier scope reductions removed engineering work correctly but
  also removed concrete pre-development outputs and deterministic integrity
  mechanisms. Related decisions were separated by taxonomy rather than by how a
  small founder-led project is actually maintained.
- **Fix**: Rebuild the plan around four pre-development stages, eight compact artifacts,
  complete business/experiment/content/identity contracts, an isolated founder
  pilot, real static Storybook compositions, and a small build-time loader with
  technical migration checks.
- **Preventive Action**: Judge pre-development architecture by whether it yields
  one coherent, implementation-ready website decision from sparse founder input;
  do not equate more artifact types or fewer technical checks with simplicity.
- **References**: `thoughts/shared/plans/singlepagestartup/ISSUE-222.md`;
  operator-provided plan review dated 2026-08-03.

## Reusable Learnings

- Keep the engineering issue workflow and the pre-development workflow separate;
  viewing them in one Studio does not require merging their gates or lifecycle
  semantics.
- Persist only a numbered, layer-local pre-development cursor and reconcile it
  from durable business and design artifacts on every launch. Do not turn that
  cursor into a run journal or second copy of project decisions.
- Use the full `singlepagestartup` name in new project-specific namespaces;
  avoid `SPS` abbreviations that can collide with unrelated data.
- Treat the one colocated `startup` layer as the project workspace in every
  downstream repository; do not introduce `startup/<client>` or repository-name
  nesting.
- Make the artifact graph the working memory: agents derive context and progress
  from stable artifact links, read relevant predecessors automatically, and edit
  canonical living documents so the operator does not have to restate context.
- Keep the eight final artifact shapes universal, but resolve one layered
  decision profile that selects material domain questions and makes them stage
  gates. This spends context on decisions that can change the result instead of
  generic questionnaires or generic prose.
- Keep variable knowledge artifact-first and choose the merge policy by semantic
  type: section overlays for compatible documents, keyed overlays for assets,
  scoped keyed rows for evidence, and whole-document replacement for niche
  profiles and working knowledge that must not leak across businesses.
- Default the configured active layer to `startup`; map only the canonical
  framework repository to `singlepage`, and treat local overrides as explicit
  exceptions. A downstream user must not need to configure an environment
  variable before agents select the correct context.
- Keep client-business configuration, indexes, project-specific knowledge,
  living sources, and presentation under `apps/studio/workspace/**`; keep only
  project-invariant role methods and templates under `.agents/**`. A second
  repository-root workspace creates avoidable agent routing ambiguity.
- Keep Studio workspace documents traceable from code: one readable story folder
  per artifact, direct raw imports from canonical singlepage/startup files, and
  no tracked generated JSON containing a second copy of business knowledge.
- Keep living project documents broad enough to update coherently: separate
  evidence and assets structurally, but group closely related business,
  research, strategy, brand, and website decisions into compact artifacts.
- Removing a QA phase does not justify skipping deterministic migration checks;
  validation, inventory, and Storybook builds protect the working tool being
  renamed.
- Treat existing QA and deployment as registered capabilities, not as new
  duplicated skills or subsystems.
- After editing a GitHub issue body from a transformed local artifact, verify
  required headings and body length instead of trusting the command URL alone.
- Shared workflow semantics now live under `.agents/**`; `.claude/**` and
  `.codex/**` preserve provider discovery through explicit canonical pointers,
  and `singlepagestartup:agents:validate` rejects missing or copied targets.
- Canonical role Markdown is not an executable agent definition. Every required
  profession needs a native provider adapter that explicitly loads its single
  consolidated role contract; bibliographic links stay outside routine context.
- Do not split one profession across responsibility and method files when both
  always load together. Independent files require an independent runtime
  selection rule.
- Draft manifest validation checks paths, IDs, layers, references, and Figma
  metadata, but presentation-only import prohibitions are currently documented
  guardrails rather than statically enforced checks.
- The legacy digital-agency pipeline ends at marketing performance analysis and
  is not currently connected to Storybook, an SPS build specification,
  production implementation, or deployment.
- SinglePageStartup Studio is a derived read-only surface over canonical
  workspace and engineering artifacts; future production work may consume an
  approved `website.md` and Studio composition only through a separate explicit
  integration issue.
