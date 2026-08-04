---
description: Turn a rough founder brief into an evidence-aware business, strategy, brand, and website design package before engineering begins.
---

# Pre-development workflow

## Entry

Use this workflow when the operator invokes `singlepagestartup` or asks in plain
language to start, continue, inspect, or change the active project before
engineering begins.

Resolve the active layer through `apps/studio/workspace/config.yaml` and its
optional gitignored `config.local.yaml` override. The configured default is
`startup`; the canonical `singlepagestartup/singlepagestartup` repository is
explicitly mapped to `singlepage`. All project business context lives under
`apps/studio/workspace/**`; do not create or use a repository-root `workspace/`
directory. Follow `.agents/contracts/context-loading.md` before reading project
content.

When the active layer is `startup`, read the resolved singlepage-plus-startup
artifact and write project-specific changes to the startup source. Do not copy
unchanged SinglePageStartup sections into startup files.

## Durable state

Read the active layer's state before loading project content:

```text
apps/studio/workspace/pre-development/<layer>.yaml
```

The state is a durable cursor, not a second source of business truth. It contains
only `active_stage`, `status`, `active_artifacts`, and artifact-section references
in `blockers`. It contains no decisions, document copies, timestamps, versions,
session summaries, or run history. Business truth remains in the indexed living
artifacts and Git remains the history.

Allowed stages and statuses are:

```text
00-understand -> 10-decide -> 20-package -> 30-design
not_started | in_progress | blocked | complete
```

The state is layer-local and never inherited: the framework reads
`pre-development/singlepage.yaml`; a downstream project reads
`pre-development/startup.yaml`.

At every launch, reconcile the cursor before doing work:

1. Read the state, active index, active-stage outputs, and their prerequisite
   closure.
2. Verify the completion criteria of the recorded stage and its prerequisites.
3. If an earlier prerequisite is incomplete or contradicted, move the cursor
   back to the earliest affected stage and name the artifacts that require work.
4. If the recorded stage is complete, advance to the next stage. When Design is
   complete, keep `active_stage: 30-design`, set `status: complete`, and clear
   `active_artifacts` and `blockers`.
5. Write the state after every atomic artifact update and before returning a
   handoff. If a previous task ended between the artifact write and the state
   write, reconciliation repairs the cursor from the artifacts.

## Operating modes

### Start or continue

1. Resolve the active layer, read and reconcile its `pre-development.yaml`, and
   report the resulting stage, status, and active artifacts.
2. Load only the dependency closure of those active artifacts. Living sources
   are colocated with `index.stories.tsx` under
   `apps/studio/workspace/<artifact>/`; project-specific working knowledge uses
   `apps/studio/workspace/knowledge/<kind>/`.
3. Ask for missing project facts that would materially change a decision;
   record unknowns instead of inventing answers. If work cannot continue, set
   `status: blocked` and reference the owning artifact sections in `blockers`.
4. Launch the provider custom agent whose ID matches each artifact owner. Its
   adapter must load the matching canonical role before acting. That one file
   contains both professional responsibility and method; load only the resolved
   project dependencies and capability bindings required for this decision.
5. Update the canonical artifact directly, recompute the earliest incomplete
   stage, persist the cursor, then return decisions, unresolved evidence, and a
   short handoff.

### Change an existing decision

1. Classify the request as a correction, new evidence, changed constraint, or
   requested presentation change.
2. Update the earliest canonical artifact that owns the changed fact or decision.
3. Compute reverse dependencies from the workspace index.
4. Re-run only owners whose artifacts are now contradicted or stale. A narrowly
   scoped request may explicitly freeze unaffected upstream decisions.
5. Move the durable cursor to the earliest affected stage, persist it, and
   report every changed artifact and downstream decision intentionally left
   unchanged.

Do not require separate commands for stages, roles, or document editing.

## Domain adaptation and quality gate

The artifact templates guarantee shape only. A populated heading, fluent prose,
or a generic list of best practices is not evidence that useful work happened.
Before Business Analyst or Market Researcher begins, create or update the
active project's routing contract:

```text
apps/studio/workspace/knowledge/decision-profile/<layer>.md
```

Use `.agents/templates/decision-profile.md` only to create or repair its shape.
Resolve this file through its indexed `extends` relationship. An empty startup
source inherits the complete SinglePageStartup profile; once meaningful startup
content exists, it replaces the profile as one domain-specific unit. Agents read
the resolved profile but write changes only to the active layer's source. This
prevents requirements from the infrastructure niche leaking into an unrelated
business while preserving transparent pass-through before classification.

Build and maintain the profile as follows:

1. Classify the business model from the brief. Allow compound classifications;
   for example, a developer framework monetized through infrastructure is not
   forced into only “SaaS” or only “hosting”. Identify buyer, user, payer,
   beneficiary, value/transaction unit, money flow, cost/capacity mechanism,
   geography, regulation, and material dependencies.
2. Add only decision areas that can change an artifact, experiment, or viability
   judgment. Each row records the question, why it matters, required evidence,
   metric or threshold, risks/regulation, viability rule, owning artifact, and
   stage. Do not create a generic industry encyclopedia.
3. Select fit-for-purpose professional methods or benchmarks only when they
   constrain a material decision. Record an authoritative source, why the method
   fits this business model, and its limitations. Do not name-drop Business
   Model Canvas, JTBD, underwriting, unit economics, Service Blueprint, or any
   other framework without applying it to a specific profile row.
4. Use `required`, `answered`, `blocked`, or `not-applicable`. `answered` must
   reference an artifact and evidence or an explicit non-evidence class;
   `not-applicable` must explain why. A `blocked` row blocks its stage.
5. Account Manager proposes the initial classification; Business Analyst and
   Market Researcher propose economic, operational, market, legal, and evidence
   corrections. Later owners propose new rows only when a discovered constraint
   can change their output. The coordinator serializes profile updates just as
   it serializes evidence-register updates.
6. Before completing any stage, review only the rows assigned to that stage.
   Every row must be answered or explicitly not applicable, and its owning
   artifact must contain the project-specific decision. Structural completeness
   alone never passes the gate.

Ask one highest-impact unanswered question at a time. Research only material
profile rows, write an answer into its owning artifact as soon as it is usable,
and do not ask or research it again unless new evidence contradicts it. If the
model classification changes, move the cursor to `00-understand`, update the
profile, and invalidate every dependent artifact whose assumptions changed.

## 00 — Understand

**State**: `active_stage: 00-understand`. Begin with
`active_artifacts: [brief]`. After the brief is usable, use
`active_artifacts: [decision-profile]`. Only after the initial profile passes its
classification gate may the cursor name `business` and `research` together;
evidence and profile updates use serialized proposals.

**Owners**: Account Manager, Business Analyst, Market Researcher.

**Required inputs**: founder request, available attachments, active index,
existing brief/evidence, the resolved decision profile when present, and
attributable market sources when research is available.

**Capabilities**: artifact read/write, image inspection, browser interaction,
and web research according to each role binding.

Capture the indexed `brief` and `evidence` sources first. Update the active
layer's decision-profile source from the resolved brief and inherited profile,
then let Business Analyst and Market Researcher propose corrections to it. They
may work in parallel after the initial profile exists because they own different
final files; the coordinator applies profile and evidence proposals serially.
Complete the indexed `business` and `research` sources before strategic
selection.

Evidence follows `.agents/contracts/evidence.md`. In an active startup,
inherited rows scoped to `singlepage` remain provenance only and cannot support
a startup claim. Use active `startup` or `shared` rows, or add an explicit
startup row that adopts, supersedes, or marks an inherited row not applicable.

Completion requires a bounded offer and audience, explicit unknowns, a complete
customer/service operating process, source-aware market/customer findings, and
every `00-understand` profile row answered, explicitly not applicable, or kept
as a blocker. The canonical outputs are the active layer's colocated `brief`,
`evidence`, `business`, and `research` files plus its project-specific decision
profile; project claims, external observations, and inferences remain distinct.

When complete, persist `10-decide`, `in_progress`, and `[strategy]` before
handoff.

## 10 — Decide

**State**: `active_stage: 10-decide`, `active_artifacts: [strategy]`.

**Owner**: Strategist.

**Required inputs**: completed Understand outputs, the resolved decision
profile, the resolved acquisition knowledge for the active project, and only
the shared professional references relevant to the decision.

**Capabilities**: artifact read/write, web research when a current assumption
needs checking, and document export only when explicitly requested.

Use the resolved `brief`, `business`, and `research` artifacts to update the
active layer's `strategy` source with one primary audience, offer, commercial
logic, acquisition focus, evidence limits, and one bounded first experiment
with decision rules.

Completion requires one selected audience and buying situation, explicit
rejected options, operational and economic fit, a budget/time limit, useful
signal, positive, negative, and stop rules, and every `10-decide` profile row
answered or explicitly not applicable.

When complete, persist `20-package`, `in_progress`, and `[brand, assets]`.

## 20 — Package

**State**: `active_stage: 20-package`, `active_artifacts: [brand, assets]`.

**Owners**: Communication Strategist, then Brand Designer.

**Required inputs**: approved strategy, research/evidence, the resolved
decision profile, resolved communication knowledge for the active project,
existing assets and rights, and the current resolved `brand` and asset-registry
artifacts.

**Capabilities**: artifact read/write, selective web research, image inspection
and generation, and Figma interaction only when actually available and useful.

Communication Strategist edits only the message, claim, proof, objection, tone,
and CTA sections of the active layer's `brand` source. Brand Designer owns the
complete file and registered identity assets. Claims and generated imagery
follow the evidence and asset contracts.

Completion requires final message hierarchy, observable voice rules, normative
tokens, do/don't rules, usable identity outputs or precise briefs, provenance
for every asset, and every `20-package` profile row answered or explicitly not
applicable. The canonical outputs are the indexed `brand` Markdown source and
the colocated `assets/<layer>.yaml` registry.

When complete, persist `30-design`, `in_progress`, and `[website]`.

## 30 — Design

**State**: `active_stage: 30-design`, `active_artifacts: [website]`.

**Owner**: Web Designer.

**Required inputs**: business, strategy, brand, evidence, indexed assets, the
resolved decision profile, and every upstream correction triggered during
design.

**Capabilities**: artifact read/write, image inspection/generation and Figma
when available, plus static Studio composition; no production data capability.

Update the active layer's indexed `website` source with the visitor path, page
structure, final copy, form and success behavior, post-conversion action,
metadata, and links to static Studio compositions. Stop before production
components, APIs, analytics, QA, or deployment.

Completion requires actual desktop/mobile copy and hierarchy, qualification
form, errors and success state, post-conversion business action, accessibility
constraints, evidence classifications, named Studio stories, and every
`30-design` profile row answered or explicitly not applicable. The canonical
output is the indexed `website` source plus presentation-only Studio stories.

When complete, keep `30-design`, set `status: complete`, and persist empty
`active_artifacts` and `blockers`.

## Ownership and concurrency

- One specialist owns one living artifact at a time.
- Two agents never edit the same file concurrently.
- Only the workflow coordinator serializes index, evidence-register, and
  decision-profile changes; there is no separate coordinator role.
- A downstream specialist must challenge an upstream assumption when new
  evidence invalidates it, then route the correction to the owning artifact.
- The coordinator updates that earliest owner first, computes reverse
  dependencies, and re-runs only contradicted artifacts before accepting the
  downstream output.
- The coordinator alone updates `pre-development.yaml`; specialists edit their
  owned artifacts and return completion evidence to the coordinator.

## Tool launch

Codex discovers the seven project agents from `.codex/agents/<role>.toml`;
Claude uses `.claude/agents/<role>.md`. The provider adapters contain discovery
metadata and explicit pointers only. They load the canonical responsibility from
`.agents/roles/<role>.md`, which also contains the reusable professional method.
Source provenance lives in `.agents/roles/SOURCES.md` and is not routine agent
context. A registry ID or a URL by itself does not load any knowledge.

Resolve required capability IDs from `.agents/tools/catalog.yaml` through the
active provider mapping. Record provenance for research and generated assets.
If a required capability is unavailable, use its declared fallback or stop with
an explicit missing-capability result; never simulate a search, browser action,
image, or design-tool output.

Load `.agents/templates/<artifact>.<md|yaml>` only when creating the artifact or
repairing missing required sections. Templates never replace the role and are
not loaded as a bundle.

## Handoff

Return only:

- active stage, status, and active artifacts after reconciliation;
- decisions made and their evidence classification;
- files changed;
- unresolved evidence or project questions;
- invalidated downstream artifacts;
- the next useful action.

Do not return role-play dialogue, a biography, or a narrative of routine work.
