---
date: 2026-08-03T23:52:26+03:00
issue_number: 222
repository: singlepagestartup
topic: "Build the compact pre-development client system"
status: in_progress
---

# Compact Pre-development Client System Implementation Plan

## Overview

Reorganize the repository into one AI-native system that turns a founder's rough
description into a coherent business definition, market-informed commercial
decision, usable brand package, and concrete website solution ready to enter the
existing engineering workflow. The system uses a small set of connected living
artifacts, automatically restores context from the repository, and presents the
result as real static compositions in Storybook Studio.

## Intent Interpretation

This revision follows the operator's latest review and supersedes the previous
eight-phase, highly fragmented plan.

- Issue #222 covers the process before production development: understand the
  business, decide what to sell and test, package the communication and identity,
  and design the website solution.
- The output must be sufficient to start the existing engineering workflow. It
  is not only research or a moodboard.
- Production implementation, deployment, rollback, analytics integration, and a
  separate client QA/testing phase remain out of scope.
- Technical verification of the repository migration is in scope. Renaming and
  extending Studio must leave its inventory, validation, and Storybook build
  working.
- The existing GitHub-Project-gated engineering workflow remains intentionally
  unchanged. Pre-development work runs locally through Codex/ChatGPT; engineering
  continues to use its existing issue gates and `thoughts/shared/**` artifacts.
- Both `workspace/singlepage/` and `workspace/startup/` use the same compact
  artifact model. Singlepage develops singlepagestartup itself; startup is the
  downstream project's one default workspace and has no client-name subfolder.
- Startup inherits reusable singlepage knowledge only through explicit exports
  and imports. Non-exported singlepage project artifacts are excluded from agent
  context and Studio startup views, even if they are physically present after a
  normal upstream Git merge.
- Issue #222 guarantees deterministic semantic isolation, not repository-level
  confidentiality. A downstream repository that merges the complete public
  upstream history may physically contain non-exported singlepage files; it must
  never load them as startup knowledge. A future private-data distribution model
  would require a separate selective-sync or packaging decision.
- Git is the change history. There is no client state machine, run journal,
  recovery cache, `.sps/` directory, or business-artifact versioning system.
- Useful `tools/digital-agency` material is normalized into the new system and
  the obsolete parallel business process is removed.
- New project-specific names use `singlepagestartup` in full; new `SPS`
  abbreviations are not introduced.

## Current State Analysis

### Agent and workflow sources

- `AGENTS.md:53-116` declares provider-neutral behavior but points to canonical
  definitions inside the provider-named `.claude/` tree.
- `.claude/commands/**`, `.claude/references/**`, and `.claude/agents/**` contain
  the current engineering process; `.codex/**` contains manually maintained
  wrappers and mirrored roles (`thoughts/shared/research/singlepagestartup/ISSUE-222.md:107-175`).
- Root onboarding files overlap, and the legacy agency repeats the same business
  process across provider-specific files
  (`thoughts/shared/research/singlepagestartup/ISSUE-222.md:150-175`).
- `.claude/helpers/**` is already provider-independent executable automation and
  must remain path-stable because the current engineering workflow depends on it.

### Business and artifact system

- `tools/digital-agency/**` contains useful discovery, marketing, content,
  channel, and role material, but assumes a missing `/project/` directory and is
  disconnected from Storybook and durable project context
  (`thoughts/shared/research/singlepagestartup/ISSUE-222.md:288-336`).
- The previous plan split one project into about twenty living files, increasing
  the chance of repeated content, partial updates, and artificial distinctions
  between closely related decisions.
- There is no `workspace/` root, artifact index, export/import enforcement,
  dependency loader, or deterministic rule for recovering relevant context.
- `workspace/config.yaml` as previously proposed would be both framework-owned
  and checkout-owned, causing conflicts between upstream and downstream defaults.

### Visual workspace

- `apps/drafts/**` and `tools/drafts/**` already provide a working
  presentation-only Storybook catalog with stable manifests, inventory, and
  validation. The research baseline passed the current Drafts validation,
  inventory-related checks, and Storybook build with 149 built entries
  (`thoughts/shared/research/singlepagestartup/ISSUE-222.md:238-286`).
- Storybook currently presents module stories only. It does not read business
  artifacts, validate their graph, or build concrete startup brand/page stories.
- `thoughts/shared/**` is durable engineering memory but is not visible in the
  visual workspace.

## Desired End State

### One source per responsibility

- `.agents/` owns provider-neutral workflows, role responsibilities, invariant
  contracts, and the tool capability catalog.
- `.claude/` and `.codex/` keep their public entry points and provider metadata
  as thin adapters. They do not restate shared process or role semantics.
- `.claude/helpers/**` and `thoughts/shared/**` remain path-stable and keep their
  current engineering behavior.
- `workspace/singlepage/` contains singlepagestartup's own project artifacts plus
  reusable knowledge and templates.
- `workspace/startup/` contains one downstream project's artifacts, regardless
  of the client or repository name.
- `apps/studio/` is the one Storybook runtime for component projections,
  pre-development artifacts, concrete design compositions, and read-only
  engineering research/plans.
- `tools/studio/` owns deterministic discovery, integrity checks, dependency
  resolution, reverse-dependency calculation, inventory generation, and the
  existing presentation tooling. Storybook displays its results but does not own
  artifact semantics.

### Four client stages

The canonical client workflow has only four stages. Progress is derived from the
connected artifacts; no separate status file is created.

1. **Understand** — capture the brief and evidence, define the business and its
   complete operating process, and research customers, market, competitors, and
   alternatives.
2. **Decide** — choose positioning, offer, commercial model, acquisition focus,
   and the first testable market hypothesis.
3. **Package** — define the communication system and identity, then create and
   register usable brand assets.
4. **Design** — define the complete visitor path, real page content, website
   structure, and static Storybook compositions for the primary page and
   conversion flow.

The stages describe customer work. The four implementation checkpoints below
describe how the repository is migrated; they are not additional client stages.

### Compact living artifact set

Both active layers use the same canonical shape:

- `workspace/<layer>/index.yaml`
- `workspace/<layer>/brief.md`
- `workspace/<layer>/evidence/register.md`
- `workspace/<layer>/business.md`
- `workspace/<layer>/research.md`
- `workspace/<layer>/strategy.md`
- `workspace/<layer>/brand.md`
- `workspace/<layer>/website.md`
- `workspace/<layer>/assets/index.yaml`
- `workspace/<layer>/assets/**`

Singlepage additionally contains:

- `workspace/singlepage/knowledge/**`
- `workspace/singlepage/templates/**`

Each living document combines closely related decisions and has internal
sections rather than a separate file for every topic:

- `brief.md`: raw request, founder wording, business description, offer,
  geography, pricing, current assets, constraints, goals, and unknowns.
- `business.md`: business model, economics, capacity, current sales, business
  goals, and the complete customer/service operating process.
- `research.md`: audiences, purchase situations, anxieties, decision criteria,
  market context, competitors, alternatives, sources, and explicit inferences.
- `strategy.md`: positioning, offer, proof, objections, commercial model,
  acquisition channel, and first-experiment contract.
- `brand.md`: tone of voice, message hierarchy, brand idea and character,
  naming, visual direction, semantic tokens, typography, imagery rules, and
  identity outputs.
- `website.md`: site objective, visitor path, sitemap, page/section structure,
  final page copy, calls to action, form, success state, post-conversion process,
  metadata, and links to Storybook compositions.

### Business process contract

`business.md` must describe the full chain from acquisition through follow-up:

`acquisition → website entry → offer understanding → lead or purchase →
qualification → response → proposal or payment → delivery → completion →
follow-up`.

For every step the artifact records the actor, required input, action, output,
responsible person, expected time, supporting system, failure case, and fallback.
It also states who receives a form submission, which data is required, response
time, lead qualification, price formation, payment and delivery behavior, error
handling, and promises the website must not make.

### First-experiment contract

`strategy.md` must contain one actionable first experiment without creating a
separate measurement stage. It records the critical assumption, target audience,
offer, expected behavior, traffic source, primary conversion, minimum useful
signal, budget limit, and decisions for positive and negative outcomes.

The contract informs the website and acquisition creative. Issue #222 does not
implement analytics collection or run the production experiment.

### Evidence and asset integrity

- Meaningful claims are classified as verified fact, client claim, assumption,
  promise, constraint, unknown, or missing evidence.
- Research sources and client materials are registered in
  `evidence/register.md`; consequential page claims link back to evidence or are
  explicitly marked with a non-evidence classification.
- `assets/index.yaml` requires a stable ID, source type (`client`, `generated`,
  `stock`, or `public-reference`), evidence flag, rights status, purpose,
  related artifacts, allowed use, prohibited use, prompt when applicable, and
  source/tool reference.
- Generated, stock, or public-reference assets may not be represented as the
  client's portfolio, completed work, customer result, team, office, or owned
  equipment without explicit evidence and rights confirmation.
- Assets are reused or deliberately replaced through the index rather than
  regenerated as disconnected session output.

### Concrete brand and website output

The brand stage produces usable files, not only descriptive guidance:

- `wordmark.svg`, or an explicit documented decision to use a text-only name;
- `favicon.svg`;
- avatar asset;
- Open Graph image;
- semantic design tokens;
- typography selection and usage rules;
- image treatment rules.

`website.md` contains actual copy for the primary page: headline, subheadline,
offer explanation, inclusions, price or calculation principle, proof,
work process, objections, FAQ, calls to action, form labels, privacy/consent
copy, success message, next step after submission, metadata, and Open Graph copy.

The minimum Storybook output is one coherent visual system and these static,
startup-specific compositions built from existing presentation-only projections:

- Brand Overview;
- Color and Typography;
- Imagery;
- Key Components;
- Primary Landing Page, including a mobile viewport composition;
- Primary Conversion Flow, including form and success state;
- one acquisition creative.

They consume the active startup `brand.md`, `website.md`, and indexed assets via
static props. They are not production components and do not use API, SDK, React
Query, authentication, or production data.

### Deterministic context and inheritance

Tracked `workspace/config.example.yaml` documents configuration. Gitignored
`workspace/config.local.yaml` is checkout-owned and may override the active
layer without upstream merge conflicts. When the local override is absent, the
loader chooses `singlepage` only for the canonical singlepagestartup repository
identity and `startup` for other repositories. Examples pass an explicit
workspace root rather than changing checkout configuration.

`workspace/singlepage/index.yaml` declares local entries and an explicit export
allowlist. `workspace/startup/index.yaml` declares local entries and an explicit
import allowlist. Startup may load an item only when singlepage exports it and
startup imports it. Project-specific singlepage brief, evidence, business,
research, strategy, brand, website, and assets are non-exported by default.

The build-time loader under `tools/studio/` performs the mechanical work that
must not be left to prompt interpretation:

1. discover the configured indexes and relevant `thoughts/shared/**` documents;
2. validate unique IDs and declared paths;
3. validate startup imports against singlepage exports;
4. validate `uses` references and detect dependency cycles;
5. compute requested dependency closure and reverse dependencies;
6. expose only allowed inherited material to startup agents and Studio;
7. produce deterministic Storybook navigation/inventory data.

No resolved artifact copy, database, cache directory, run log, or workflow state
is persisted.

### Tool catalog and agent launch

`.agents/tools/catalog.yaml` defines provider-neutral capabilities such as
artifact read/write, attachment reading, web research, browser interaction,
image inspection, image generation, document creation, and Figma interaction.
Each capability records purpose, inputs/outputs, allowed roles, artifact types,
whether it is required, provenance requirements, and fallback behavior.

`.agents/tools/providers/codex.yaml` and
`.agents/tools/providers/claude.yaml` map those capability IDs to concrete tools
available in each runtime. Roles and workflows reference capabilities, never a
provider-specific API name. The coordinator checks availability at launch and
must record provenance or state that a required result cannot be produced; it
must not simulate unavailable research, image, browser, or design tools.

The public entry points are a canonical
`.agents/workflows/client/pre-development.md`, a thin Codex
`.codex/skills/singlepagestartup/SKILL.md`, a thin Claude
`.claude/commands/singlepagestartup.md`, and natural-language routing from
`AGENTS.md`.

The workflow itself coordinates specialist roles; no separate coordinator role
document is needed:

- Account Manager captures `brief.md` and proposes evidence entries.
- Business Analyst owns `business.md`.
- Market Researcher owns `research.md` and proposes sourced evidence entries.
- Strategist owns `strategy.md`.
- Communication Strategist contributes the communication sections of
  `brand.md`; Brand Designer owns and finalizes `brand.md` plus identity assets.
- Web Designer owns `website.md` and its Studio compositions.

After a usable brief exists, Business Analyst and Market Researcher may run in
parallel because they own different files. Later roles run in dependency order.
Only the workflow coordinator updates shared indexes and serializes changes to
the evidence register; two agents never edit the same file concurrently.

### Concise professional role contracts

All professions live directly under `.agents/roles/` and use the profession as
their stable file and role ID, for example `account-manager.md`,
`business-analyst.md`, `market-researcher.md`, `strategist.md`,
`communication-strategist.md`, `brand-designer.md`, and `web-designer.md`.
Engineering professions use the same flat directory. Roles are not grouped into
`client`, `business-design`, or `engineering` subdirectories because a profession
may participate in more than one workflow and its exact name is the useful
discovery key.

The current `tools/digital-agency/agency_roles.md` is migration input, not an
approved professional definition. Before writing the seven pre-development role
contracts, compare relevant open role libraries with primary professional
frameworks and standards. Use role libraries to find useful operating patterns;
use professional sources to validate actual competencies, methods, ethical
boundaries, and expected decisions. Record the source and license for reused
material and synthesize the result rather than copying a third-party persona.

Each role contract contains only instructions that change professional behavior:

- mission and decision boundary;
- artifacts read and owned;
- required methods and evidence standard;
- decision thresholds, red flags, failure modes, and escalation conditions;
- allowed tool capabilities;
- handoff and completion criteria.

Role files must not contain fictional biography, invented experience or memory,
personality theatre, first-person performance, motivational prose, repeated
workflow order, duplicated artifact templates, or provider-specific tool
instructions. Detailed professional methods live as selectively loaded
references under `workspace/singlepage/knowledge/professions/**`; they are not
automatically loaded with the compact role contract.

The role contract has a 700-word maximum. The adapter validator reports its size
and repeated text. A specialist works directly on the owned artifact and returns
only decisions, unresolved evidence, and a short handoff summary rather than a
role-play monologue. A compact contract is accepted only when representative
founder-pilot decisions are at least as complete, evidence-aware, and actionable
as the legacy/theatrical prompt while using less role-instruction context.

### Relationship to engineering

Issue #222 creates the pre-development system. It does not change engineering
gates or create production code. `website.md`, brand assets, and linked Studio
compositions form the reviewable input for a future integration into the current
engineering workflow.

Studio reads `thoughts/shared/research/**` and `thoughts/shared/plans/**` without
moving or mutating them, so one interface can show Business, Brand, Design,
Engineering Research, and Engineering Plans while the two operational systems
remain deliberately separate.

## What We're NOT Doing

- Implementing the production website, production components, routes, data
  models, APIs, forms, CRM delivery, notifications, analytics, or MCP wiring.
- Publishing or deploying a website, adding rollback behavior, or running a live
  market experiment.
- Adding a client workflow state machine, run log, recovery store, database,
  `.sps/` directory, or separate resolved/diff artifact storage.
- Adding artifact release versions, Brand v0.x naming, snapshots, or version
  locks.
- Creating client- or repository-named directories below `workspace/startup/`.
- Replacing the existing engineering GitHub Project gates, helper scripts,
  create/research/plan/implement sequence, or `thoughts/shared/**` paths.
- Creating a separate QA/testing phase or new client-facing test suite.
- Treating non-exported upstream files as confidential data. Context isolation is
  enforced; physical distribution privacy is not solved by issue #222.
- Loading every internal knowledge or channel file into every prompt.

## Implementation Approach

Implement issue #222 as one large change on its dedicated branch and one pull
request. Use four dependency-ordered checkpoints:

1. Agent and workspace foundation.
2. Legacy migration and inheritance.
3. Drafts-to-Studio rename and artifact presentation.
4. Compact client method, founder pilot, and cleanup.

Each checkpoint leaves the repository internally coherent. Technical checks run
inside the checkpoint that changes the relevant tooling; they are implementation
verification, not a new QA phase.

## Phase 1: Agent and Workspace Foundation

### Overview

Establish one provider-neutral agent source, compact workspace contracts, tool
catalog, conflict-free checkout configuration, and stable public entry points
without changing engineering behavior.

### Changes Required

#### 1. Move shared agent semantics to `.agents/`

**Files**:

- `.agents/README.md`
- `.agents/workflows/engineering/**`
- `.agents/workflows/client/pre-development.md`
- `.agents/contracts/context-loading.md`
- `.agents/contracts/artifact-lifecycle.md`
- `.agents/contracts/evidence.md`
- `.agents/contracts/tool-use.md`
- `.agents/roles/*.md`

**Why**: Shared process, roles, and invariant rules currently live in
provider-specific or duplicated locations.

**Changes**:

- Move current engineering commands, references, and shared roles into canonical
  provider-neutral files without changing gates, artifact paths, helper calls,
  or public meanings.
- Define the four-stage pre-development workflow and the seven client specialist
  roles with the ownership and concurrency boundaries above.
- Move existing engineering professions into the same flat role directory while
  preserving their public adapter names and behavior.
- Keep workflow order in workflows, responsibilities in roles, invariant rules
  in contracts, domain methods in knowledge, and document structure in
  templates.
- Keep `.claude/helpers/**` and checkout/provider configuration path-stable.

#### 2. Research and synthesize concise professional role contracts

**Files**:

- `tools/digital-agency/agency_roles.md`
- `.agents/roles/account-manager.md`
- `.agents/roles/business-analyst.md`
- `.agents/roles/market-researcher.md`
- `.agents/roles/strategist.md`
- `.agents/roles/communication-strategist.md`
- `.agents/roles/brand-designer.md`
- `.agents/roles/web-designer.md`
- `workspace/singlepage/knowledge/professions/**`
- `workspace/singlepage/index.yaml`

**Why**: The legacy role descriptions have not been shown to encode enough
professional judgment, while many public agent libraries spend context on
persona theatre, fictional experience, repeated workflows, and verbose output
styles that do not improve the owned artifact.

**Changes**:

- Research relevant but concise source material for every profession. Start with
  role-contract patterns from Domain Experts, selected operational material from
  Agency Agents, and the role/skill separation in `wshobson/agents`; validate
  competencies against primary sources such as the UK Government Digital and
  Data Profession framework, IIBA public Business Analysis material, O\*NET,
  ICC/ESOMAR research standards, W3C WCAG, and applicable design standards.
- Treat sources as inputs to synthesis. Do not install a third-party collection,
  copy a complete persona, or inherit its workflow, tools, memory claims, output
  style, and success metrics.
- Write one flat, profession-named role contract per specialist using the compact
  contents and 700-word maximum defined above.
- Move deeper methods, decision aids, vocabulary, and examples into indexed,
  on-demand profession knowledge; do not load them unless the active task needs
  them.
- For each role, compare at least one normal founder-pilot decision and one
  red-flag/failure case against the current legacy role and a generalist
  baseline. Retain only instructions that materially improve artifact
  completeness, evidence discipline, decision quality, or handoff clarity.
- Record source URLs, license constraints, and the reason each retained method
  changes the result.

#### 3. Create the provider-neutral tool capability catalog

**Files**:

- `.agents/tools/catalog.yaml`
- `.agents/tools/providers/codex.yaml`
- `.agents/tools/providers/claude.yaml`
- `.agents/contracts/tool-use.md`

**Why**: Saying that a role may generate images or browse is insufficient unless
the system can discover the capability, permissions, provenance requirement, and
runtime binding.

**Changes**:

- Register provider-neutral capability IDs and their input/output and provenance
  contracts.
- Map current Codex/ChatGPT and Claude tools separately without leaking concrete
  tool names into shared roles or workflows.
- Require launch-time availability checks and explicit fallbacks; unavailable
  capabilities cannot be replaced by invented results.
- Give Brand Designer and Web Designer access to image inspection/generation and
  give research roles access to web/browser capabilities as appropriate.

#### 4. Convert provider surfaces to thin adapters

**Files**:

- `.claude/commands/**`
- `.claude/references/**`
- `.claude/agents/**`
- `.codex/skills/**`
- `.codex/agents/**`
- `.claude/README.md`
- `.codex/README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `AI_GUIDE.md`
- `README.md`
- `tools/singlepagestartup/agents/validate.ts`
- `package.json`

**Why**: Providers need native discovery files but not independent copies of the
business or engineering process.

**Changes**:

- Preserve existing Claude command and Codex skill names as thin routes to exact
  `.agents` sources.
- Add the `singlepagestartup` pre-development entry points and natural-language
  routing.
- Retain provider-only metadata locally; remove repeated shared prose.
- Make `AGENTS.md` the universal repository entry and remove competing canonical
  claims from other root documents.
- Add `singlepagestartup:agents:validate` as a structural check that adapters
  reference existing canonical files and do not contain copied canonical bodies.
- Make the same check report role word counts, duplicated passages, forbidden
  persona/memory sections, and role references that point to missing on-demand
  knowledge.

#### 5. Create compact layer scaffolds and checkout configuration

**Files**:

- `workspace/config.example.yaml`
- `.gitignore`
- `workspace/singlepage/index.yaml`
- `workspace/singlepage/{brief.md,business.md,research.md,strategy.md,brand.md,website.md}`
- `workspace/singlepage/evidence/register.md`
- `workspace/singlepage/assets/index.yaml`
- `workspace/singlepage/knowledge/**`
- `workspace/singlepage/templates/**`
- `workspace/startup/index.yaml`
- `workspace/startup/{brief.md,business.md,research.md,strategy.md,brand.md,website.md}`
- `workspace/startup/evidence/register.md`
- `workspace/startup/assets/index.yaml`

**Why**: Both singlepagestartup and downstream projects need the same small,
predictable living artifact set without checkout-owned configuration conflicts.

**Changes**:

- Commit empty/scaffolded startup artifacts rather than a demonstration client's
  content.
- Add a gitignored `workspace/config.local.yaml` override and deterministic
  repository-identity fallback.
- Define stable IDs, paths, kinds, `uses` links, local/export/import sections,
  and short descriptions in the indexes.
- Define the compact artifact contents and evidence/asset classifications from
  the Desired End State.
- Do not introduce workflow state, versions, client names, or generated resolved
  files.

### Success Criteria

#### Automated Verification

- [x] The repository's existing engineering entry points still resolve their
      canonical workflow and helper paths.
- [x] `npm run singlepagestartup:agents:validate` confirms that every provider
      adapter points to an existing `.agents` source and contains no copied
      canonical body.
- [x] The same command confirms that all profession files are flat, uniquely
      named, at most 700 words, and free of duplicated workflow/template bodies
      and forbidden theatrical persona sections.
- [x] Workspace configuration resolves `singlepage` in the canonical repository,
      `startup` in a downstream repository fixture, and respects the gitignored
      local override.

#### Manual Verification

- [ ] The engineering status model and `thoughts/shared/**` behavior are
      unchanged.
- [ ] The four client stages and role ownership are described once.
- [ ] Each pre-development profession has a source-backed compact role contract,
      on-demand professional references, and representative normal/red-flag
      comparisons against the legacy and generalist baselines.
- [ ] Compact role contracts produce equal or better founder-pilot decisions
      than the legacy/theatrical descriptions while loading less role text and
      returning no role-play monologue.
- [ ] Both layers expose the same eight living artifact types.
- [ ] Provider adapters contain only routing and provider metadata.
- [ ] No new path or identifier introduces the `SPS` abbreviation.

---

## Phase 2: Legacy Migration and Selective Inheritance

### Overview

Normalize useful agency knowledge into the compact model, remove duplicated
provider/process copies, and make startup inheritance deterministic.

### Changes Required

#### 1. Migrate reusable methods, templates, and channel knowledge

**Source files**:

- `tools/digital-agency/agency_context.md`
- `tools/digital-agency/agency_pipeline.md`
- `tools/digital-agency/agency_pipeline_first_messages.md`
- `tools/digital-agency/agency_roles.md`
- `tools/digital-agency/request_for_role.md`
- `tools/digital-agency/templates/**`
- `tools/digital-agency/platforms/**`
- `tools/digital-agency/{AGENTS.md,CLAUDE.md,GEMINI.md,README.md}`

**Target files**:

- `workspace/singlepage/knowledge/**`
- `workspace/singlepage/templates/**`
- `.agents/workflows/client/pre-development.md`
- `.agents/roles/*.md`

**Why**: Legacy sources contain useful expertise but mix execution order, roles,
templates, domain knowledge, provider instructions, and obsolete storage paths.

**Changes**:

- Preserve useful discovery questions, customer/competitor dimensions, channel
  knowledge, communication guidance, and design criteria.
- Consolidate legacy templates into the eight compact living artifact templates.
- Remove `/project/`, provider-specific process copies, verbose placeholders,
  and any process text already owned by workflow or contracts.
- Register reusable knowledge and templates with stable IDs and concise
  selection descriptions.

#### 2. Enforce two-sided semantic inheritance

**Files**:

- `workspace/singlepage/index.yaml`
- `workspace/startup/index.yaml`
- `.agents/contracts/context-loading.md`
- `.agents/contracts/artifact-lifecycle.md`
- `tools/drafts/workspace/loader.ts`
- `tools/drafts/workspace/validate.ts`

**Why**: Export/import and `uses` links cannot remain conventions interpreted
differently by each agent.

**Changes**:

- Export only reusable methods, templates, taxonomies, generic channel/design
  knowledge, quality criteria, and deliberately generalized examples.
- Import only the startup-selected subset of those exports.
- Keep singlepage's local project artifacts non-exported by default.
- Validate IDs, paths, import/export agreement, references, cycles, dependency
  closure, and reverse dependencies in deterministic code.
- Make both the agent context loader and Studio consume the same validated
  result.
- Extend the current Drafts tooling at its existing path in this checkpoint;
  Phase 3 moves it atomically to `tools/studio/` with the rest of the runtime.
- Document explicitly that this is semantic/context isolation over a normally
  merged repository, not confidential physical file filtering.

#### 3. Remove the old parallel business system

**Files**: `tools/digital-agency/**` and all repository references to it

**Why**: Retaining the old tree would recreate the duplication and context
fragmentation issue #222 is intended to remove.

**Changes**:

- Delete legacy files only after every useful item has a named canonical
  destination.
- Update root and agent navigation to the new workflow, workspace, and Studio.
- Do not leave compatibility copies or provider-specific business processes.

### Success Criteria

#### Automated Verification

- [x] Workspace validation rejects duplicate IDs, missing files, invalid
      import/export pairs, broken `uses` references, and dependency cycles.
- [x] A startup fixture resolves only explicitly imported singlepage exports and
      its own local artifacts.
- [x] Searches find no canonical references to `/project/` or the retired
      `tools/digital-agency` paths.

#### Manual Verification

- [ ] Each useful legacy role, method, template, and channel reference has one
      canonical owner.
- [ ] Startup cannot receive singlepage's local brief, evidence, business,
      research, strategy, brand, website, or assets through context resolution.
- [ ] The physical-versus-semantic inheritance guarantee is explicit and does
      not imply confidentiality that normal Git history cannot provide.
- [ ] Agents load only relevant dependencies and selected knowledge rather than
      the complete library.

---

## Phase 3: Drafts to Studio and Artifact Presentation

### Overview

Atomically rename the existing visual catalog, extend its tooling with the
artifact loader, and make Storybook the read-only interface for business,
design, and engineering planning material.

### Changes Required

#### 1. Rename the application, tooling, commands, and outputs

**Source paths**: `apps/drafts/**`, `tools/drafts/**`

**Target paths**: `apps/studio/**`, `tools/studio/**`

**Related files**: `package.json`, `package-lock.json`, `project.json`, root and
application documentation

**Why**: The current Drafts runtime already owns presentation projections and
should evolve into the one Studio rather than coexist with a new viewer.

**Changes**:

- Move the full component catalog, foundations, runtime, schemas, manifests,
  Figma metadata, inventory, validation, development tooling, and Storybook
  configuration.
- Replace `drafts:*` with `studio:*` commands and update Nx targets, package
  identity, output paths, hard-coded paths, and documentation.
- Preserve stable component/page IDs, existing story behavior, and the
  presentation-only static-props boundary.
- Do not introduce `sps-studio` or another abbreviated project identifier.

#### 2. Complete deterministic workspace tooling

**Files**:

- `tools/studio/workspace/loader.ts`
- `tools/studio/workspace/validate.ts`
- `tools/studio/workspace/inventory.ts`
- existing Studio discovery/validation entry points
- `package.json`
- `project.json`

**Why**: Agents and Storybook need one deterministic interpretation of indexes,
inheritance, dependencies, and navigation.

**Changes**:

- Integrate workspace discovery and validation into `studio:validate`.
- Extend `studio:inventory` with business/design artifacts and read-only
  `thoughts/shared/research/**` and `thoughts/shared/plans/**` discovery.
- Produce build-time navigation data for Business, Brand, Design, Engineering
  Research, and Engineering Plans without moving canonical files.
- Keep results derived and disposable; do not introduce a runtime database,
  cache root, or second editable artifact set.

#### 3. Add workspace and concrete design stories

**Files**:

- `apps/studio/.storybook/main.ts`
- `apps/studio/.storybook/preview.ts`
- `apps/studio/workspace/**`
- `apps/studio/workspace/stories/**`

**Why**: A Markdown browser alone is not a design deliverable.

**Changes**:

- Add Storybook Docs support compatible with the current runtime.
- Present the compact Markdown artifacts, evidence, indexed assets, imports, and
  reverse dependencies through the validated loader.
- Present `singlepage` and `startup` without mixing their local artifacts.
- Add reusable static story shells for Brand Overview, Color and Typography,
  Imagery, Key Components, Primary Landing Page, mobile page, form, success
  state, and acquisition creative.
- Read engineering research/plans from `thoughts/shared/**` as a separate
  read-only navigation group.
- Keep Storybook free of production SDK/API/authentication/mutation code.

### Success Criteria

#### Automated Verification

- [x] `npm run studio:validate` passes and includes workspace graph integrity.
- [x] `npm run studio:inventory` completes and includes workspace plus
      engineering read-side entries.
- [x] `npm run studio:storybook:build` passes after the atomic rename.
- [x] The built Storybook retains the pre-migration catalog entries and adds the
      intended workspace/design entries without unresolved paths.

#### Manual Verification

- [ ] Existing component stories and stable manifest IDs remain usable.
- [ ] Studio shows canonical business/design files without becoming their source
      of truth.
- [ ] Startup views cannot navigate to non-exported singlepage local artifacts.
- [ ] Engineering research and plans are visible but remain path-stable and
      read-only.
- [ ] Static design stories use workspace content/assets and no production data
      access.

---

## Phase 4: Compact Client Method, Founder Pilot, and Cleanup

### Overview

Complete the four-stage method, exercise it on an isolated founder-led example,
produce the required brand and website outputs, and remove stale navigation.

### Changes Required

#### 1. Finalize the four-stage workflow and templates

**Files**:

- `.agents/workflows/client/pre-development.md`
- `.agents/roles/*.md`
- `workspace/singlepage/templates/**`
- `workspace/singlepage/knowledge/**`

**Why**: The method must be simple to run but strong enough to transform a rough
founder story into a commercially and visually coherent website decision.

**Changes**:

- Define Understand, Decide, Package, and Design once, including required inputs,
  role contributions, tool capabilities, canonical output, and completion
  criteria.
- Require the full operating process in `business.md`, first-experiment contract
  in `strategy.md`, usable identity outputs in `brand.md`, and concrete page copy
  and visitor/conversion path in `website.md`.
- Require later roles to challenge upstream assumptions when new evidence changes
  the decision, then update affected artifacts through reverse dependencies.
- Keep specialists on one artifact each and serialize shared index/evidence
  updates.

#### 2. Create an isolated founder pilot

**Files**:

- `examples/founder-pilot/workspace/startup/index.yaml`
- `examples/founder-pilot/workspace/startup/brief.md`
- `examples/founder-pilot/workspace/startup/evidence/register.md`
- `examples/founder-pilot/workspace/startup/business.md`
- `examples/founder-pilot/workspace/startup/research.md`
- `examples/founder-pilot/workspace/startup/strategy.md`
- `examples/founder-pilot/workspace/startup/brand.md`
- `examples/founder-pilot/workspace/startup/website.md`
- `examples/founder-pilot/workspace/startup/assets/**`

**Why**: The repository needs a complete working example, but the canonical
`workspace/startup/` must remain a clean scaffold for every downstream project.

**Changes**:

- Start from the issue's minimal founder profile: rough business description,
  word-of-mouth customers, one marketplace listing, limited photos, name, and
  phone number.
- Use current research and image capabilities where available and record sources,
  prompts, rights, and limitations.
- Produce all compact artifacts, the complete operating process, one first
  experiment, identity outputs, final primary-page copy, and indexed assets.
- Load the example through an explicit workspace-root option; do not change the
  checkout's active layer or populate canonical startup files with pilot data.

#### 3. Build the pilot's concrete Studio solution

**Files**: `apps/studio/workspace/stories/**` and
`examples/founder-pilot/workspace/startup/**`

**Why**: The pilot must prove that the method ends in a usable design solution,
not a stack of prose documents.

**Changes**:

- Render the pilot's brand overview, color/typography, imagery, key components,
  primary landing page, mobile composition, form, success state, and acquisition
  creative.
- Feed them with static props derived from the pilot's brand, website, evidence,
  and asset index.
- Confirm that important page claims link to evidence or show their assumption,
  promise, or constraint classification.
- Stop before production component implementation or external service wiring.

#### 4. Remove superseded references and record the engineering boundary

**Files**: repository documentation, agent entry files, Studio documentation,
and `thoughts/shared/processes/singlepagestartup/ISSUE-222.md`

**Why**: Stale paths and an implicit handoff would force future agents to ask for
context again.

**Changes**:

- Remove references to Drafts, `/project/`, provider-specific canonical business
  processes, fragmented artifact paths, and the deleted agency tree.
- Document local pre-development as the default and the existing GitHub-gated
  engineering workflow as an intentional, unchanged subsequent system.
- Record that a future non-child integration issue may map approved
  `website.md`/Studio outputs into production implementation; do not implement
  that bridge here.

### Success Criteria

#### Automated Verification

- [x] `npm run studio:validate` passes for canonical workspaces and the explicit
      founder-pilot root.
- [x] `npm run studio:inventory` includes the pilot and the expected compact
      artifact/story groups.
- [x] `npm run studio:storybook:build` passes with the pilot compositions.
- [x] Repository searches find no stale canonical references to Drafts,
      `/project/`, or `tools/digital-agency`.

#### Manual Verification

- [ ] A fresh Codex/ChatGPT session finds the active workspace and explains the
      current context without an operator recap.
- [ ] The pilot follows only Understand, Decide, Package, and Design.
- [ ] `business.md` specifies the entire lead/purchase-to-delivery process,
      responsibilities, timing, failure cases, and fallbacks.
- [ ] `strategy.md` contains a bounded first experiment and decision rules.
- [ ] Brand outputs are usable in Storybook, the acquisition creative, and a
      later website implementation.
- [ ] `website.md` contains actual copy, form/success behavior, and the next
      business action after conversion.
- [ ] The required desktop/mobile page and conversion compositions use existing
      presentation-only component projections and static props.
- [ ] Generated or stock imagery is not represented as client evidence or
      completed client work.
- [ ] Canonical `workspace/startup/` remains a clean scaffold.
- [ ] The result is sufficient for engineering planning but contains no
      production implementation, QA, or deployment stage.

## Technical Verification Strategy

There is no separate client QA or testing phase. The following are required
implementation checks because issue #222 renames and extends working tooling:

- run `npm run singlepagestartup:agents:validate` after canonical agent sources
  and provider adapters are migrated;
- run `npm run studio:validate` after workspace loader changes and after legacy
  cleanup;
- run `npm run studio:inventory` after discovery/navigation changes;
- run `npm run studio:storybook:build` immediately after the Drafts-to-Studio
  rename and again with the founder pilot;
- compare the post-rename Storybook inventory with the research baseline so
  existing catalog entries and stable IDs are not silently lost;
- inspect both `singlepage` and `startup` Studio modes and the explicit pilot
  root;
- confirm through a downstream fixture that non-exported singlepage artifacts
  are rejected by context resolution.

These checks verify the migration itself. They do not add unit, integration,
browser, deployment, or production QA systems.

## Context and Performance Considerations

- Agents load only the active artifact's dependency closure, permitted imports,
  and selected knowledge; they do not load both complete workspaces or every
  channel reference.
- Index descriptions remain short; full reasoning lives in the compact linked
  documents.
- Reverse dependencies are computed by the loader rather than stored and allowed
  to drift.
- Markdown stays canonical and assets stay as files referenced by the asset
  index; Storybook receives derived static data.
- Provider adapters stay thin so process and role changes happen once.

## Migration Notes

- Implement all four checkpoints on
  `codex/issue-222-predevelopment-client-system` and deliver one cohesive PR.
- Preserve current engineering workflow semantics, public entry names, helper
  paths, and `thoughts/shared/**` locations while moving canonical prose to
  `.agents/`.
- Replace tracked `workspace/config.yaml` with the example/local/fallback model;
  never commit checkout-owned layer selection.
- Migrate useful agency content before deleting `tools/digital-agency/**`.
- Rename `apps/drafts/**` and `tools/drafts/**` atomically with commands, package
  identity, generated paths, docs, and technical verification.
- Keep the founder pilot under `examples/founder-pilot/**`; do not seed the
  downstream startup scaffold with example business data.
- Keep all professions directly under `.agents/roles/`; use exact profession
  names as stable IDs and keep deeper professional methods in selectively loaded
  knowledge rather than bloating role files.
- Do not migrate legacy or external role personas wholesale. Synthesize concise,
  source-backed decision contracts and retain only instructions that improve the
  founder-pilot artifacts relative to their context cost.
- Treat export/import as enforced context inheritance. Ordinary upstream Git
  history is not a privacy boundary.
- Use Git history for rollback and artifact history; do not add business
  artifact versions or runtime state.

## Follow-up Boundary

After issue #222, a separate future issue may define the explicit adapter from an
approved `website.md`, indexed brand/assets, and Studio compositions into the
existing engineering research/plan workflow. That future work may address
production implementation, CRM/forms, analytics, deployment, and experiment
measurement. It is not a child issue or implementation phase of #222.

## Open Questions (Blocking)

None. This plan deliberately chooses semantic/context isolation for normal
upstream Git synchronization and preserves the current GitHub-gated engineering
workflow. Those choices remove the alternatives raised by the review without
expanding issue #222 into distribution privacy or production development.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-222.md`
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-222.md`
- Process log: `thoughts/shared/processes/singlepagestartup/ISSUE-222.md`
- Current engineering workflow: `AGENTS.md`, `.claude/commands/**`,
  `.claude/references/**`, `.codex/**`
- Legacy business system: `tools/digital-agency/**`
- Current presentation system: `apps/drafts/**`, `tools/drafts/**`
- Professional role sources: `https://domainexperts.dev/`,
  `https://github.com/msitarzewski/agency-agents`,
  `https://github.com/wshobson/agents`,
  `https://ddat-capability-framework.service.gov.uk/`,
  `https://www.onetonline.org/`, `https://standards.esomar.org/`,
  `https://www.w3.org/TR/WCAG22/`, and
  `https://github.com/google-labs-code/design.md`

<!-- Last synced at: 2026-08-02T23:46:20Z -->
