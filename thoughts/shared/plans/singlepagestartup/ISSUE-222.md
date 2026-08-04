---
date: 2026-08-03T23:52:26+03:00
issue_number: 222
repository: singlepagestartup
topic: "Build the compact pre-development client system"
status: completed
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
- Both `apps/studio/workspace/index/singlepage.yaml` and
  `apps/studio/workspace/index/startup.yaml` describe the same compact artifact
  model. Each artifact folder contains its `singlepage`, `startup`, and Storybook
  projection side by side; no client-name or `stories/project` namespace exists.
- Every layered startup entry explicitly declares the singlepage entry it
  `extends` and the merge strategy appropriate to that artifact. Reusable
  invariant support still crosses layers only through explicit exports and
  imports.
- Issue #222 guarantees deterministic semantic isolation, not repository-level
  confidentiality. A downstream repository that merges the complete public
  upstream history may physically contain non-exported singlepage files; it must
  never load them as startup knowledge. A future private-data distribution model
  would require a separate selective-sync or packaging decision.
- Git is the change history. Pre-development uses one minimal, layer-local
  cursor to survive fresh model contexts; there is no run journal, recovery
  cache, `.sps/` directory, or business-artifact versioning system.
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
- At the research baseline there was no canonical Studio workspace, artifact
  index, export/import enforcement, dependency loader, or deterministic rule
  for recovering relevant context.
- `apps/studio/workspace/config.yaml` as previously proposed would be both framework-owned
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
- `apps/studio/workspace/<artifact>/` contains the framework source, downstream
  override, and Storybook projection as `singlepage`, `startup`, and `current`.
- `apps/studio/workspace/knowledge/<kind>/` uses the same artifact-first layout
  for project-variable discovery, acquisition, communication, and domain routing.
- `apps/studio/workspace/index/` and `apps/studio/workspace/pre-development/`
  contain the two layer registries and cursors without creating competing
  layer-first workspace roots.
- `apps/studio/` is the one Storybook runtime for component projections,
  pre-development business and marketing artifacts, and concrete design
  compositions.
- `tools/studio/` owns deterministic discovery, integrity checks, dependency
  resolution, reverse-dependency calculation, inventory generation, and the
  existing presentation tooling. Storybook displays its results but does not own
  artifact semantics.

### Four pre-development stages

The canonical workflow has four stable stages. Their numeric IDs provide the
same resumable orientation that `00`, `10`, `20`, and `30` provide in the
engineering process, without introducing separate commands:

1. **00 Understand** — capture the brief and evidence, define the business and its
   complete operating process, and research customers, market, competitors, and
   alternatives.
2. **10 Decide** — choose positioning, offer, commercial model, acquisition focus,
   and the first testable market hypothesis.
3. **20 Package** — define the communication system and identity, then create and
   register usable brand assets.
4. **30 Design** — define the complete visitor path, real page content, website
   structure, and static Storybook compositions for the primary page and
   conversion flow.

Each layer persists only the last reconciled stage, status, active artifacts,
and blockers in `apps/studio/workspace/pre-development/<layer>.yaml`. On every
launch the workflow verifies that cursor against the stage's artifact
prerequisites, advances it when the stage is complete, or moves it back to the
earliest contradicted artifact. The cursor stores no business decisions,
document copies, timestamps, versions, session summaries, or run history.

Structural completeness is not sufficient. During `00-understand`, the workflow
updates `apps/studio/workspace/knowledge/decision-profile/<layer>.md` from the
brief. The profile classifies
compound business models and records only material questions, metrics,
evidence, risks, regulations, viability rules, owning artifacts, and stage
gates. Empty startup content inherits SinglePageStartup; a non-empty startup
profile replaces the framework profile because domain rules from unrelated
niches must not accumulate. Every assigned row must be answered, blocked,
or explicitly not applicable before its stage can complete; generic prose
cannot pass the gate. Relevant professional methods and benchmarks are selected
with sources, fit, and limitations only when they constrain a material decision.

The stages describe pre-development work. The four implementation checkpoints
below describe how the repository is migrated; they are not additional workflow
stages.

### Compact living artifact set

Both active layers use the same logical artifact graph in
`apps/studio/workspace/index/<layer>.yaml`. The editable living sources are colocated with
their Studio stories so a person or agent can open the complete unit directly:

- `apps/studio/workspace/{brief,evidence,business,research,strategy,brand,website}/<layer>.md`
- `apps/studio/workspace/assets/<layer>.yaml`
- `apps/studio/workspace/<artifact>/index.stories.tsx`

Both layers additionally contain project-specific working knowledge:

- `apps/studio/workspace/knowledge/{decision-profile,discovery,acquisition,communication}/<layer>.md`

Project-invariant support stays beside the agents:

- `.agents/roles/*.md`
- `.agents/templates/**`

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
- Research sources and client materials are registered in the layered
  `evidence/<layer>.md`; consequential page claims link back to evidence or are
  explicitly marked with a non-evidence classification.
- The indexed `assets/<layer>.yaml` source requires a stable ID, source type (`client`, `generated`,
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

Tracked `apps/studio/workspace/config.yaml` sets `default_layer: startup`, so a
framework consumer needs no environment variable or local configuration. Its
repository map selects `singlepage` for the canonical SinglePageStartup checkout.
Gitignored `apps/studio/workspace/config.local.yaml` may explicitly override
`active_layer` for exceptional local work without creating an upstream conflict.

`apps/studio/workspace/index/singlepage.yaml` declares base entries and the
export allowlist. `apps/studio/workspace/index/startup.yaml` declares matching
overrides, explicit `extends`, merge `strategy`, and the import allowlist.
Project artifacts use `sections`, assets use `keyed`, evidence uses
`scoped-keyed`, and niche-specific knowledge uses `replace`. Empty startup files
therefore pass the base through, while populated files apply only their declared
semantics.

The build-time loader under `tools/studio/` performs the mechanical work that
must not be left to prompt interpretation:

1. resolve the active layer from explicit input, local override, repository map,
   then the committed `startup` default;
2. discover the two indexes and relevant `thoughts/shared/**` documents;
3. validate unique IDs, paths, `extends`, and artifact-specific strategies;
4. validate startup imports against singlepage exports;
5. validate `uses` references and detect dependency cycles;
6. compute dependency closure and reverse dependencies;
7. merge only according to the declared strategy and validate evidence scope;
8. expose the resolved graph to agents and readable Storybook projections.

No resolved artifact copy, database, cache directory, or run log is persisted.
The only workflow control file is the minimal, layer-local pre-development
cursor; artifact contents remain the source of truth and repair the cursor on
every launch.

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
`.agents/workflows/pre-development.md`, a thin Codex
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
instructions. Professional responsibility and method live together in the same
compact role contract; do not create a second profession-named runtime file.

The role contract has a 700-word maximum. The adapter validator reports its size
and repeated text. A specialist works directly on the owned artifact and returns
only decisions, unresolved evidence, and a short handoff summary rather than a
role-play monologue. A compact contract is accepted only when representative
SinglePageStartup project decisions are at least as complete, evidence-aware,
and actionable as the legacy/theatrical prompt while using less role-instruction
context.

### Relationship to engineering

Issue #222 creates the pre-development system. It does not change engineering
gates or create production code. `website.md`, brand assets, and linked Studio
compositions form the reviewable input for a future integration into the current
engineering workflow.

Studio does not read or present `thoughts/shared/**`. Business, marketing,
brand, and design decisions belong in Workspace; engineering research, plans,
and implementation history remain exclusively in the existing code workflow.

## What We're NOT Doing

- Implementing the production website, production components, routes, data
  models, APIs, forms, CRM delivery, notifications, analytics, or MCP wiring.
- Publishing or deploying a website, adding rollback behavior, or running a live
  market experiment.
- Adding a run state machine, run log, recovery store, database, `.sps/`
  directory, or separate resolved/diff artifact storage. The bounded
  `pre-development.yaml` cursor is only a resumable pointer to artifact-owned
  state.
- Adding artifact release versions, Brand v0.x naming, snapshots, or version
  locks.
- Creating client- or repository-named nesting for startup living sources.
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
4. Compact client method, active project, and cleanup.

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
- `.agents/workflows/pre-development.md`
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
- `.agents/roles/SOURCES.md`
- `apps/studio/workspace/index/singlepage.yaml`

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
- Consolidate the responsibility, professional method, decision aids, and
  red flags that materially affect the result in the same role file. Keep the
  file below 700 words and do not create an indexed `profession.*` knowledge
  entry for it.
- For each role, compare at least one normal SinglePageStartup project decision
  and one red-flag/failure case against the current legacy role and a generalist
  baseline. Retain only instructions that materially improve artifact
  completeness, evidence discipline, decision quality, or handoff clarity.
- Record source URLs, license constraints, and the reason each retained method
  changes the result in `.agents/roles/SOURCES.md`. Keep those URLs out of
  routine role context: provider adapters load the consolidated role, and an
  agent browses a primary source only when the active project needs current
  evidence.

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
- Register every pre-development profession as a native Codex custom agent and
  Claude agent. Each adapter must explicitly load the single consolidated
  `.agents/roles/<profession>.md` before acting; canonical Markdown alone is not
  provider discovery.
- Retain provider-only metadata locally; remove repeated shared prose.
- Make `AGENTS.md` the universal repository entry and remove competing canonical
  claims from other root documents.
- Add `singlepagestartup:agents:validate` as a structural check that adapters
  reference existing canonical files and do not contain copied canonical bodies.
- Make the validator fail when any required pre-development adapter, role
  pointer, runtime load instruction, consolidated professional-method section,
  or required Codex custom agent field is absent.
- Make the same check report role word counts, duplicated passages, forbidden
  persona/memory sections, duplicate profession knowledge, and obsolete
  profession directories.

#### 5. Create compact layer scaffolds and checkout configuration

**Files**:

- `apps/studio/workspace/config.yaml`
- `.gitignore`
- `apps/studio/workspace/index/singlepage.yaml`
- `apps/studio/workspace/{brief,evidence,business,research,strategy,brand,website}/singlepage.md`
- `apps/studio/workspace/assets/singlepage.yaml`
- `apps/studio/workspace/knowledge/{decision-profile,discovery,acquisition,communication}/singlepage.md`
- `.agents/templates/**`
- `apps/studio/workspace/index/startup.yaml`
- `apps/studio/workspace/{brief,evidence,business,research,strategy,brand,website}/startup.md`
- `apps/studio/workspace/assets/startup.yaml`
- `apps/studio/workspace/knowledge/{decision-profile,discovery,acquisition,communication}/startup.md`

**Why**: Both singlepagestartup and downstream projects need the same small,
predictable living artifact set without checkout-owned configuration conflicts.

**Changes**:

- Commit zero-content colocated startup living sources rather than headings,
  template scaffolds, or a demonstration client's content; keep
  `apps/studio/workspace/index/startup.yaml` populated as the structural registry.
- Commit `config.yaml` with `default_layer: startup`, map only the canonical
  framework repository to `singlepage`, and allow a gitignored local override.
- Define stable IDs, paths, kinds, `uses`, `extends`, merge strategies,
  export/import sections, and short descriptions in the indexes.
- Define the compact artifact contents and evidence/asset classifications from
  the Desired End State.
- Add one `knowledge/decision-profile/<layer>.md` source per layer and one
  invariant `.agents/templates/decision-profile.md` shape. Use replacement
  inheritance so an empty startup profile passes the framework profile through,
  while a populated niche profile excludes unrelated framework domain rules.
- Require a potentially compound business-model classification and material
  stage-specific questions, metrics, evidence, risks, regulations, and viability
  rules. Select sourced professional methods/benchmarks only where they constrain
  those decisions; reject framework name-dropping, template-only output, or
  generic prose as incomplete.
- Add `apps/studio/workspace/pre-development/{singlepage,startup}.yaml` with only
  the numbered stage, status, active artifacts, and blockers. Keep all business
  state in living artifacts; do not add run history, versions, client names, or
  generated resolved files.
- Validate the cursor schema and reconcile it from artifact prerequisites at
  every workflow launch so an interrupted or fresh model context resumes safely.

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
- [x] Validation confirms that both layers own a decision-profile source,
      business and research depend on the resolved profile, empty startup
      content inherits singlepage, non-empty sections override it, and stage
      state accepts the profile only during `00-understand`.

#### Manual Verification

- [ ] The engineering status model and `thoughts/shared/**` behavior are
      unchanged.
- [ ] The four numbered pre-development stages and role ownership are described
      once.
- [ ] Each pre-development profession has a source-backed compact role contract,
      on-demand professional references, and representative normal/red-flag
      comparisons against the legacy and generalist baselines.
- [ ] Compact role contracts produce equal or better SinglePageStartup project decisions
      than the legacy/theatrical descriptions while loading less role text and
      returning no role-play monologue.
- [ ] Both layers expose the same eight living artifact types.
- [ ] Two unrelated niches retain the same eight final artifacts while producing
      different local business classifications, material questions, metrics,
      evidence requirements, risks, regulations, and viability gates.
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

- `apps/studio/workspace/knowledge/{decision-profile,discovery,acquisition,communication}/singlepage.md`
- `.agents/templates/**`
- `.agents/workflows/pre-development.md`
- `.agents/roles/*.md`

**Why**: Legacy sources contain useful expertise but mix execution order, roles,
templates, domain knowledge, provider instructions, and obsolete storage paths.

**Changes**:

- Preserve useful discovery questions, customer/competitor dimensions, channel
  knowledge, communication guidance, and design criteria.
- Consolidate legacy templates into the eight compact living-artifact templates
  plus one decision-profile routing template directly under
  `.agents/templates/`; do not add a redundant namespace.
- Document the templates as a SinglePageStartup synthesis of the approved
  four-stage pipeline and retained legacy coverage, not as an adopted external
  framework. Keep workflow order, role judgment, template structure, and living
  project data in separate files.
- Remove `/project/`, provider-specific process copies, verbose placeholders,
  and any process text already owned by workflow or contracts.
- Register reusable knowledge and templates with stable IDs and concise
  selection descriptions.

#### 2. Enforce two-sided semantic inheritance

**Files**:

- `apps/studio/workspace/index/singlepage.yaml`
- `apps/studio/workspace/index/startup.yaml`
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
marketing, brand, and design material.

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
- `tools/studio/workspace/merge.ts`
- `tools/studio/workspace/validate.ts`
- existing Studio discovery/validation entry points
- `package.json`
- `project.json`

**Why**: Agents and Storybook need one deterministic interpretation of indexes,
inheritance, and dependencies without copying canonical document content into a
generated inventory.

**Changes**:

- Integrate workspace discovery and validation into `studio:validate`.
- Keep `studio:inventory` limited to the existing module catalog. Workspace
  stories import canonical Markdown/YAML sources directly and resolve
  `singlepage + startup` in memory.
- Keep `thoughts/shared/**` outside Studio discovery and navigation; those files
  remain owned by the existing engineering workflow.
- Keep results derived and disposable; do not introduce a runtime database,
  cache root, or second editable artifact set.

#### 3. Add workspace and concrete design stories

**Files**:

- `apps/studio/.storybook/main.ts`
- `apps/studio/.storybook/preview.ts`
- `apps/studio/workspace/**`
- `apps/studio/workspace/{brief,evidence,business,research,strategy,brand,website,assets,knowledge,design}/**`

**Why**: A Markdown browser alone is not a design deliverable.

**Changes**:

- Add Storybook Docs support compatible with the current runtime.
- Organize each compact artifact under a readable folder such as
  `workspace/brand/index.stories.tsx`; import its canonical singlepage and
  startup sources directly and present evidence, assets, and dependencies.
- Present `current`, `singlepage`, and `startup` for every living
  artifact: the first resolves both layers, while the latter two isolate their
  local source content.
- Add reusable static story shells for Brand Overview, Color and Typography,
  Imagery, Key Components, Primary Landing Page, mobile page, form, success
  state, and acquisition creative.
- Do not expose engineering research, plans, or implementation history in
  Storybook Workspace.
- Keep Storybook free of production SDK/API/authentication/mutation code.

### Success Criteria

#### Automated Verification

- [x] `npm run studio:validate` passes and includes workspace graph integrity.
- [x] `npm run studio:inventory` completes without creating a duplicate
      workspace-content inventory.
- [x] `npm run studio:storybook:build` passes after the atomic rename.
- [x] The built Storybook retains the pre-migration catalog entries and adds the
      intended workspace/design entries without unresolved paths.

#### Manual Verification

- [ ] Existing component stories and stable manifest IDs remain usable.
- [ ] Studio shows canonical business/design files without becoming their source
      of truth.
- [ ] Startup views cannot navigate to non-exported singlepage local artifacts.
- [ ] Engineering research and plans remain path-stable in `thoughts/shared/**`
      and are absent from Storybook.
- [ ] Static design stories use workspace content/assets and no production data
      access.

---

## Phase 4: Compact Client Method, Active Project, and Cleanup

### Overview

Complete the four-stage method, exercise it on SinglePageStartup as the active
business project, expose its resolved documents in Studio, and remove stale
navigation and fictional examples.

### Changes Required

#### 1. Finalize the four-stage workflow and templates

**Files**:

- `.agents/workflows/pre-development.md`
- `.agents/roles/*.md`
- `.agents/templates/**`
- `apps/studio/workspace/<layer>/knowledge/{domain,discovery,acquisition,communication}/**`

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
- Classify the potentially compound business model before analysis, update the
  resolved decision profile through the active layer, and make its assigned
  domain rows mandatory quality gates for every stage. Headings and generic best
  practices never count as completion.
- Keep specialists on one artifact each and serialize shared index, evidence,
  and decision-profile updates.

#### 2. Use SinglePageStartup as the live business project

**Files**:

- `apps/studio/workspace/index/{singlepage,startup}.yaml`
- `apps/studio/workspace/{brief,evidence,business,research,strategy,brand,website}/singlepage.md`
- matching zero-content `startup.md` overrides and
  `apps/studio/workspace/assets/{singlepage,startup}.yaml`

**Why**: SinglePageStartup is itself a business project and must use the same
pipeline that downstream projects inherit. A fictional parallel project would
duplicate context and hide whether real framework data resolves correctly.

**Changes**:

- Develop SinglePageStartup's real brief, evidence, business, research, strategy,
  brand, website, and asset index in the colocated `singlepage` sources over time.
- Treat these files as the framework project's actual business knowledge, not as
  templates or fictional example data.
- Let every downstream repository put only its changed content in the matching
  colocated `startup` files. Empty files inherit their declared base; populated
  files apply the index-declared strategy (`sections`, `keyed`, `scoped-keyed`,
  or `replace`).
- Keep reusable methods and templates behind explicit export/import rules, while
  the eight living project artifacts resolve automatically by artifact kind.

#### 3. Build the active project's concrete Studio solution

**Files**: `apps/studio/workspace/{design,brief,evidence,business,research,strategy,brand,website,assets}/**`
and `apps/studio/workspace/index/{singlepage,startup}.yaml`

**Why**: The real project must prove that the method ends in a usable design
solution, not a stack of prose documents or an unrelated demo.

**Changes**:

- Render brand overview, color/typography, imagery, key components, primary
  landing page, mobile composition, form, success state, and acquisition
  creative under separate `current`, `singlepage`, and `startup`
  subsections.
- Feed them with static props derived from the resolved brand, website, evidence,
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

- [x] `npm run studio:validate` passes for the canonical singlepage/startup pair
      and isolated overlay/fallback fixtures.
- [x] `npm run studio:inventory` includes only the canonical workspace pair and
      the expected resolved project artifact groups.
- [x] `npm run studio:storybook:build` passes without fictional example stories.
- [x] Repository searches find no stale canonical references to Drafts,
      `/project/`, or `tools/digital-agency`.

#### Manual Verification

- [ ] A fresh Codex/ChatGPT session finds the active workspace and explains the
      current context without an operator recap.
- [ ] SinglePageStartup follows only Understand, Decide, Package, and Design.
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
- [ ] Downstream colocated `startup` sources can remain empty or override only the
      sections that differ from SinglePageStartup.
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
  rename and again with the resolved active project;
- compare the post-rename Storybook inventory with the research baseline so
  existing catalog entries and stable IDs are not silently lost;
- inspect the `singlepage` source and the aggregated `startup` Studio result;
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
  index; Storybook imports those sources directly and derives `current` in
  memory.
- Provider adapters stay thin so process and role changes happen once.

## Migration Notes

- Implement all four checkpoints on
  `codex/issue-222-predevelopment-client-system` and deliver one cohesive PR.
- Preserve current engineering workflow semantics, public entry names, helper
  paths, and `thoughts/shared/**` locations while moving canonical prose to
  `.agents/`.
- Replace tracked `apps/studio/workspace/config.yaml` with the example/local/fallback model;
  never commit checkout-owned layer selection.
- Migrate useful agency content before deleting `tools/digital-agency/**`.
- Rename `apps/drafts/**` and `tools/drafts/**` atomically with commands, package
  identity, generated paths, docs, and technical verification.
- Do not maintain a fictional workspace example. Develop SinglePageStartup in
  the colocated `singlepage` sources and verify downstream overrides through
  matching `startup` files and isolated validator fixtures.
- Keep all professions directly under `.agents/roles/`; use exact profession
  names as stable IDs and keep deeper professional methods in selectively loaded
  knowledge rather than bloating role files.
- Do not migrate legacy or external role personas wholesale. Synthesize concise,
  source-backed decision contracts and retain only instructions that improve the
  SinglePageStartup project artifacts relative to their context cost.
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
