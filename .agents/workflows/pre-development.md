---
description: Turn a rough founder brief into an evidence-aware business, strategy, reusable brand and design system, and an atomic catalog of product materials before engineering begins.
---

# Pre-development workflow

## Entry

Use this workflow when the operator invokes `singlepagestartup` or asks in plain
language to start, continue, inspect, or change the active project before
engineering begins.

Resolve the active layer through the shared repository-layer resolver using
`apps/studio/workspace/config.yaml` and its safety-checked gitignored
`config.local.yaml`. A detected repository identity is authoritative and a
conflicting local layer is an error. The configured default is `startup`; the
canonical `singlepagestartup/singlepagestartup` repository is explicitly mapped
to `singlepage`. The GitHub preflight and workspace loader must use that same
resolution result; an agent must not choose the layer independently. All
project business context lives under `apps/studio/workspace/**`; do not create
or use a repository-root `workspace/` directory. Follow
`.agents/contracts/context-loading.md` before reading project content.

When the active layer is `startup`, read the resolved `default` artifact
assembled from singlepage and startup, then write project-specific changes to
the startup source. Do not copy
unchanged SinglePageStartup sections into startup files.

## GitHub change preflight

Before reading the durable stage cursor or launching any professional owner,
follow `.agents/contracts/github-reconciliation.md` and run:

```bash
npm run singlepagestartup:github:check
```

This preflight is mandatory on every invocation. It resolves and reports the
repository identity, active layer, and resolution source before selecting the
layer-local config. An optional `--layer` argument is an assertion for tests or
diagnostics; a mismatch is a hard failure and never overrides repository
routing. It scans the configured GitHub
branch from the first published approved-strategy commit, routes unreconciled
relevant file changes, records their material or no-material-effect result, and
completes every required evidence, dependency, approval, and cursor side effect
before normal stage work. `waiting-for-baseline` is non-blocking before that
first commit exists. GitHub unavailability is blocking and must never be
silently replaced by a stale local comparison.

## Quality and interaction rules

Quality, correctness, and a decision-ready result take precedence over response
length, number of turns, execution time, or token use. Never skip a material
question, source check, professional review, or artifact correction to make the
workflow shorter.

The operator must be able to review and edit every primary document without
reconstructing the agent session. `brief`, `business`, `research`, `strategy`,
`brand`, `design`, and each product-local `product`, `website`, and `creative`
document contain at most 1,400 words,
including tables, so a normal review takes about five to seven minutes. This is
a human-usability rule, not a token-saving rule. Evidence and assets are indexed
reference registers; agents load only the rows used by the active decision.
Every primary artifact states each decision once and points to evidence IDs
instead of copying evidence limitations into several sections.

Use the operator's language for questions and handoffs unless they request
otherwise. Use the requested artifact language independently: translate and
normalize operator input when necessary without changing its meaning. Ask one
highest-impact question at a time in plain language. Do not use unexplained
professional shorthand, and do not expand an ambiguous word into requirements
before confirming what the operator meant.

Classify every material unknown by who can resolve it:

- `operator-fact`: current facts or constraints controlled or known by the
  operator, including the project boundary, existing customers or users,
  the complete set of current or intended offers and which are product
  candidates, supporting only, or deferred,
  budget, available time and contacts, rights and license intent, support
  capacity, geography, decision authority, owned assets, preferred references,
  and non-goals;
- `research-question`: an external fact that requires attributable evidence;
- `professional-choice`: a strategy, communication, design, or experiment
  proposal the owning role is expected to make;
- `evidence-gap`: proof that does not yet exist and must remain explicitly
  missing or become the subject of an experiment.

An `assumption` may support a clearly labeled proposal, but it never answers an
`operator-fact`. Ask the operator instead. Do not convert missing operating
capacity, budget, channel access, rights, support, or decision authority into a
number merely to satisfy a template or pass a stage.

A bare `singlepagestartup` invocation authorizes inspection and resumption; it
does not confirm the project scope or any operator fact. Repository files may
support a proposed scope summary, but they do not reveal the operator's current
intent. If the brief does not contain an attributable, explicit request and
scope confirmation, stop before specialist analysis and ask for confirmation or
correction.

## Durable state

After the GitHub preflight succeeds, read the active layer's state before
loading project content:

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
00-business -> 10-strategy -> 20-brand -> 30-design -> 40-products
not_started | in_progress | blocked | complete
```

The state is layer-local and never inherited: the framework reads
`pre-development/singlepage.yaml`; a downstream project reads
`pre-development/startup.yaml`.

## Pipeline compatibility reconciliation

After reading the layer cursor and before accepting its stage, follow
`.agents/contracts/pipeline-reconciliation.md`. Compare the existing Workspace
with the current checked-out workflow, roles, templates, contracts, active
index, and stage completion rules on every invocation. This makes a synchronized
pipeline change discover missing artifact sections in both the framework and a
downstream project without a separate command or stored workflow version.

The structural scan may inspect section names, schema keys, index entries, and
file references across completed, active, and later non-empty artifacts. Load
full content only for a discovered gap and its dependency closure. Respect
singlepage-to-startup inheritance: keep applicable inheritance, write only
project-specific startup changes, and never let unrelated inherited project
facts satisfy an active startup approval or scope gate.

Route every missing file, section, schema key, current requirement, or stable
approval row to its earliest owning stage. Repair it from attributable current
facts when possible; otherwise classify and ask for the highest-impact missing
input. Move and persist the cursor before downstream work. An unchanged pipeline
and compatible Workspace make this reconciliation a no-op.

At every launch, reconcile the cursor before doing work:

1. Read the state and active index, then complete the mandatory pipeline
   compatibility reconciliation.
2. Read the resulting active-stage outputs and their prerequisite closure, then
   verify the completion criteria of the recorded stage and its prerequisites.
   Existing artifacts are not grandfathered: a brief without explicit scope
   confirmation, a strategy without explicit strategy approval, or a brand
   without explicit brand approval is incomplete even if its prose looks final
   or the cursor previously advanced past it.
3. If an earlier prerequisite is incomplete or contradicted, move the cursor
   back to the earliest affected stage and name the artifacts that require work.
4. If the recorded stage is complete, advance to the next stage. When Products
   is complete, keep `active_stage: 40-products`, set `status: complete`, and clear
   `active_artifacts` and `blockers`.
5. Write the state after every atomic artifact update and before returning a
   handoff. If a previous task ended between the artifact write and the state
   write, reconciliation repairs the cursor from the artifacts.

## Operating modes

### Start or continue

1. Resolve the active layer, complete the mandatory GitHub change preflight,
   then read its `pre-development.yaml`, complete pipeline compatibility
   reconciliation, and reconcile the cursor; report the resulting stage,
   status, and active artifacts.
2. Load only the dependency closure of those active artifacts. Living sources
   are colocated with `index.stories.tsx` under
   `apps/studio/workspace/<artifact>/`; project-specific working knowledge uses
   `apps/studio/workspace/knowledge/<kind>/`.
3. Classify unresolved items as `operator-fact`, `research-question`,
   `professional-choice`, or `evidence-gap`. Ask for the highest-impact missing
   operator fact and record unknowns instead of inventing answers. If work
   cannot continue, set `status: blocked` and reference the owning artifact
   sections in `blockers`.
4. Launch the provider custom agent whose ID matches each artifact owner. Its
   adapter must load the matching canonical role before acting. That one file
   contains both professional responsibility and method; load only the resolved
   project dependencies and capability bindings required for this decision.
5. Update the earliest canonical artifact directly. During initial interview,
   do not repeatedly regenerate business, research, strategy, brand, website, or
   marketing creative
   from each partial answer. Propagate a batch only after the decision subject
   and affected upstream section are stable or when a confirmed correction
   invalidates an existing downstream decision.
   When a professional artifact is generated or fully rerun, replace its body
   from the template and stable upstream dependencies. The previous body is not
   an input and must not be summarized, compressed, or incrementally amended.
   Git retains its history.
   Before saving, search the document for every earlier statement about the
   changed fact and replace or remove all stale occurrences in the same edit.
   Never append a corrected answer below an obsolete answer.
6. Recompute the earliest incomplete
   stage, persist the cursor, then return decisions, unresolved evidence, and a
   clear handoff.

### Change an existing decision

1. Classify the request as a correction, new evidence, changed constraint, or
   requested presentation change.
2. Update the earliest canonical artifact that owns the changed fact or decision.
3. Compute reverse dependencies from the workspace index.
4. Re-run only owners whose artifacts are now contradicted or stale. A narrowly
   scoped request may explicitly freeze unaffected upstream decisions.
   A full owner rerun replaces the owned artifact from its template and current
   upstream dependency closure. It never preserves chronological corrections,
   invalidation prose, or handoff metadata from the stale artifact.
5. If invalidation retires assets, verify their ownership, exact registry IDs
   and paths, and current references before cleanup. Remove generated files and
   rows when their current proposal is retired. Remove client, stock, or
   public-reference files and rows only when an attributable owning decision
   marks the exact input rejected, replaced, duplicated, or no longer needed.
   Remove stale current-artifact mentions in the same change; Git retains
   history, and age alone never authorizes deletion.
6. Move the durable cursor to the earliest affected stage, persist it, and
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
4. Use `required`, `blocked`, `proposed`, `answered`, `approved`, or
   `not-applicable`. `answered` is for a resolved factual requirement and must
   reference an artifact and evidence or an explicit non-evidence class.
   `proposed` is a professional choice awaiting the confirmation required by
   its stage. `approved` records operator acceptance of a material direction.
   `not-applicable` must explain why. `required`, `blocked`, and `proposed`
   prevent stage completion.
5. Account Manager proposes the initial classification; Business Analyst and
   Market Researcher propose economic, operational, market, legal, and evidence
   corrections. Later owners propose new rows only when a discovered constraint
   can change their output. The coordinator serializes profile updates just as
   it serializes evidence-register updates.
6. Before completing any stage, review only the rows assigned to that stage.
   Factual rows must be `answered`, approval rows must be `approved`, and any
   other row must be explicitly `not-applicable`. Its owning artifact must
   contain the project-specific decision. Structural completeness, fluent prose,
   or an `assumption` written as an answer never passes the gate.

Every project profile must contain three stable approval rows: scope confirmation
at `00-business`, including the complete offer inventory and its workflow
classifications; strategy approval at `10-strategy`, including the exact active
product set and first priority; and brand approval at `20-brand`. During reconciliation, add a missing row and move the cursor back
to its stage. A prior cursor position or completed-looking artifact never implies
approval.

Ask one highest-impact unanswered question at a time. Research only material
profile rows, write an answer into its owning artifact as soon as it is usable,
and do not ask or research it again unless new evidence contradicts it. If the
model classification changes, move the cursor to `00-business`, update the
profile, and invalidate every dependent artifact whose assumptions changed.

## 00 — Business

**State**: `active_stage: 00-business`. Begin with
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

Capture the indexed `brief` and `evidence` sources first. Before Business
Analyst or Market Researcher starts, the brief must separate and name:

- the primary decision subject being developed;
- its current business or project goal;
- every current or intended offer that may otherwise be confused with the
  primary product, including its current/intended state, role, buyer or user,
  commercial signal, and whether it is a product candidate, supporting only, or
  deferred;
- any supporting reference or demonstration project;
- historical context that is evidence but not the active model;
- explicit out-of-scope topics;
- current reality versus desired future state.

Brief also owns the operator's visual-reference input inventory. Record five
separately labeled sets for interface and website appearance, typography,
photography, illustration, and marketing creative, together with reference
asset IDs, liked or disliked examples, observable qualities, and a category
status. Existing project materials and their rights remain canonical in Assets
and are summarized once outside this intake table when relevant. This inventory may remain incomplete while Business,
Strategy, and Brand proceed; it becomes a blocking prerequisite only before
Design generation. The files themselves remain in Assets, not in Brief.

Return a compact scope summary in the operator's language and ask them to
confirm or correct it, including the offer inventory and each offer's workflow
scope. This confirmation is part of `00-business`, needs no special command,
and remains a blocker until received. Do not merge the
framework, a reference implementation, a customer project, and a historical
service model merely because they are related.

After scope confirmation, update the active
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

Completion requires confirmed decision scope, a complete and bounded offer
inventory with no ambiguous product/supporting/reference boundary, explicit
operator facts and unknowns, a complete
customer/service operating process, source-aware market/customer findings, and
every `00-business` factual profile row answered, every scope approval row
approved, and every other row explicitly not applicable or kept as a blocker.
The canonical outputs are the active layer's colocated `brief`,
`evidence`, `business`, and `research` files plus its project-specific decision
profile; project claims, external observations, and inferences remain distinct.

When complete, persist `10-strategy`, `in_progress`, and `[strategy]` before
handoff.

## 10 — Strategy

**State**: `active_stage: 10-strategy`, `active_artifacts: [strategy]`.

**Owner**: Strategist.

**Required inputs**: completed Understand outputs, the resolved decision
profile, the resolved acquisition knowledge for the active project, and only
the shared professional references relevant to the decision.

**Capabilities**: artifact read/write, web research when a current assumption
needs checking, and document export only when explicitly requested.

Use the resolved `brief`, `business`, and `research` artifacts to update the
active layer's `strategy` source with one business-level commercial direction,
an exact active product set selected only from the operator-confirmed Brief
portfolio, one primary product and audience for the first experiment,
commercial logic, acquisition focus, evidence limits, and one bounded first
experiment with decision rules. Explicitly keep supporting-only and deferred
offers out of the active product set.

`strategy.md` is a replacement projection, not an interview log. During fact
collection, update the owning brief, evidence, business, research, and decision
profile sources; do not invoke the Strategist after each answer. Invoke it once
the input batch is stable. On first generation or any full strategy rerun:

1. Treat the previous strategy body as invalid and do not load it as an input.
2. Start from `.agents/templates/strategy.md` and replace the complete active
   strategy source from the approved upstream dependency closure.
3. Use exactly the four template sections. Each decision has one canonical
   home: approval state in Decision status, selection and trade-offs, including
   the exact active product set and its priority, in Commercial choice,
   execution and thresholds in First experiment, and only
   unresolved material boundaries in Risks and missing evidence.
   Experiment rows may refer to the selected audience, offer, and route by a
   short label; they must not restate the Commercial choice rationale. Risks
   must not repeat a decided limit merely to explain it again and are capped at
   the five gaps most likely to change the decision.
4. Do not add interview chronology, repeated operator-fact lists, superseded or
   invalidated wording, profile disposition, evidence proposals, downstream
   instructions, or handoff prose to the artifact. Those belong to Git,
   evidence, the decision profile, dependency invalidation, or the response.
5. Keep the source within 180 lines and 1,400 words, keep Decision status within
   12 non-empty lines and 120 words, and do not add third-level headings.
6. Read the complete current strategy as the operator will see it. A
   structurally complete but repetitive strategy fails the stage.

The Strategist owns professional choices, but may not invent operator facts.
If the experiment depends on available hours, cash budget, reachable contacts,
channel access, license intent, support capacity, response commitments, or
decision authority that the operator has not supplied, keep the stage blocked
and ask for the highest-impact fact.

Completion requires an exact active product set traceable to the confirmed
Brief portfolio, one primary product with one selected audience and buying
situation for the first experiment, explicit deferred or supporting-only
offers, rejected options, operational and economic fit, a budget/time limit,
useful signal, positive, negative, and stop rules. Every factual `10-strategy` profile
row must be answered or explicitly not applicable, and the strategy approval
row must be approved before the stage completes. The completed strategy is
first a `proposed` professional direction. The strategy source itself must pass
the operator-readable compactness and ownership review. Return a compact summary of the audience,
offer, positioning, acquisition focus, experiment, material assumptions, and
rejected options in the operator's language. Keep `10-strategy` blocked on the
strategy approval section until the operator confirms or corrects it. On
confirmation, mark the approval row `approved` and only then persist
`20-brand`, `in_progress`, and `[brand]`.
Record the confirmation in both the strategy artifact's Decision status section
and the profile approval row.

No separate stage command is required; a natural-language approval or
correction is sufficient.

## 20 — Brand

**State**: `active_stage: 20-brand`, `active_artifacts: [brand]`.

**Owners**: Communication Strategist, then Brand Designer.

**Required inputs**: operator-approved strategy, research/evidence, the resolved
decision profile, resolved communication knowledge, and the current `brand`.

**Capabilities**: artifact read/write and selective web research.

`brand.md` is the meaning that should form in the audience's mind. Communication
Strategist defines audience state, promise, proof boundary, objections, voice,
terminology, CTA, and prohibited claims. Brand Designer completes the brand
premise, character, naming, memorable difference, and governance. Neither role
puts colors, typography, logos, layouts, photographs, illustrations, prompts,
generated files, or channel formats into Brand; those belong to Design.

On a full Brand run, replace the complete active brand source from
`.agents/templates/brand.md` and stable upstream dependencies. Do not load the
old body as generation input. Keep the result within 1,400 words and state every
meaning or communication decision once.

Completion requires a reviewable intended perception, message hierarchy, proof
limits, objections, voice, naming, governance, every factual `20-brand`
profile row answered or explicitly not applicable, and the brand approval row
approved. The canonical output is `brand/<layer>.md`.

The Communication Strategist and Brand Designer make the professional
communication and visual choices; do not ask the operator to design the answer
for them. Return the resulting direction for confirmation, however, because
website work must not silently freeze an unreviewed brand. Until confirmation,
keep `20-brand` blocked on the brand approval section and treat the brand and
its meaning as proposed. On confirmation, mark the approval row `approved`, then
persist `30-design`, `in_progress`, and `[design, assets]`.
Record the confirmation in both the brand artifact's Decision status section
and the profile approval row.

## 30 — Design

**State**: `active_stage: 30-design`,
`active_artifacts: [design, assets]`.

**Owner**: Brand Designer.

**Required inputs**: business, approved strategy, approved brand, evidence, the
resolved decision profile, a complete categorized visual-reference intake in
the resolved Brief, matching registered Assets, and every upstream correction
triggered during design.

**Capabilities**: artifact read/write, image inspection/generation and Figma
when available, plus static Studio composition; no production data capability.

Before loading, generating, or updating Design decisions, inspect the resolved
Brief's `Visual reference intake` and the matching registered Assets. Brief
must contain five separately labeled reference sets: interface and website
appearance, typography, photography, illustration, and marketing creative.
For every family it records the required reference set, reference asset IDs,
liked and disliked qualities, and category status. Existing project materials
stay canonical in Assets rather than being duplicated in each intake row.
Every category needs supplied references or an explicit out-of-scope decision;
silence is not an answer. A reference expresses preference, not copying
permission.

If this prerequisite is incomplete, keep `active_stage: 30-design`, set
`active_artifacts: [brief, assets]`, and block on
`brief/<layer>.md#visual-reference-intake`. Route operator facts to the Account
Manager-owned Brief and files to Assets. The Brand Designer may validate
category fit, but must not copy this intake table into `design.md`, create a
visual preference profile, select tokens, write media prompts, or generate
Design assets before the Brief gate passes.

The operator supplies each set separately, for example from Pinterest, and
labels its category at upload. Interface references must show interface
details; typography references must make type character and hierarchy
observable; photography references must be actual photographs; illustration
references must be illustrations; marketing-creative references must be
banners, covers, advertisements, or social posts with visible text and
composition. Copy accepted files into
`assets/<layer>/intake/<category>/`, where `<category>` is `interface`,
`typography`, `photography`, `illustration`, or `marketing-creative`; record the
same category in Assets. Never place a singlepage input in startup or a startup
input in singlepage.

Do not accept one mixed or unlabeled moodboard as completion of these gates.
Inspect every item, verify that it matches its declared category, and ask the
operator to correct or re-upload a mismatch rather than silently repurposing
it. A reference can be cited outside its category only as secondary
corroboration after that other category has its own valid set. Keep a mixed
input `unclassified` only while the operator is deciding how to correct it. If
the operator rejects or replaces it, remove its exact file, registry entry, and
stale current-artifact mentions after verifying that no current decision still
references it.

Interface and website-appearance intake covers reusable visual qualities such
as density, hierarchy, grid, whitespace, surfaces, shape, translucency, motion,
and the balance of type and imagery; it does not define product pages or the
visitor journey. Typography intake covers existing font files and rights,
liked and disliked type examples, required scripts and languages, reading
contexts, and desired or prohibited character. Photography and illustration
remain separate media facts. Marketing-creative references establish
cross-channel visual preferences during Design, while actual formats, copy, and
campaign compositions remain product-local work in `40-products`.

When an in-scope category has no valid reference set, keep Design blocked and
explain what belongs in that set. Do not substitute agent-invented moodboards,
style directions, or generated previews for the client's missing taste input.
Typography examples are mandatory even when the operator has not chosen an
exact font; they must show desired character, hierarchy, and required scripts.
Do not select final visual tokens, register font choices, write a media style
master prompt, or generate the registered example set until the categorized
intake is complete.

After all five categorized sets pass the Brief intake and before proposing the
visual system, the Brand Designer writes
a `Client visual preference profile` in `design.md`. It translates every used
reference and operator statement into a single coherent description across
contrast, palette, density, whitespace, grid and rhythm, surface treatment,
shape language, type character, image realism, illustration grammar, motion,
and cross-channel composition. The profile cites its source assets or operator
statements, separates explicit preferences from professional inference, and
names contradictions, unknowns, and confidence. The Brand Designer discovers
and systematizes the client's taste; they do not invent a replacement taste or
select a visual direction from generic convention. Return that description in
the operator's language for confirmation or correction. Only a confirmed
profile may drive the visual territory comparison and the resulting colors,
typography, photography, illustration, and reusable graphic language. Approval
of one family never implies approval of another.

Keep reference-derived style and project-derived scene semantics as separate
inputs. References may define observable technique such as camera distance,
motion treatment, light, focus, crop, line weight, density, or material
character. The approved Brief and Brand define what is depicted: subject,
action, environment, props, and project meaning. Never inherit a reference's
location, occupation, object, backdrop, or narrative merely because it appears
in the supplied image. A scene-setting preference becomes binding only when the
operator explicitly confirms it or the approved project context independently
requires it. Before generation, review every content brief against both inputs;
when reference atmosphere conflicts with project meaning, preserve the visual
technique and replace the scene semantics.

When Photography must communicate a software or digital-technology context,
architecture, transport, concrete, blueprints, and other built-environment cues
alone do not satisfy the content brief. Name and visibly verify the relevant
computing artifacts or active digital interaction—such as a correctly
proportioned computer, laptop, or smartphone—while treating architecture only
as setting. If the operator names specific device categories, the example set
must include them and quality review must reject invented controls, implausible
keyboards, unreadable category silhouettes, or construction-led substitutes.

`design.md` translates the approved Brand into reusable visual decisions:
identity application, colors, typography, spacing, grid, shapes, photography,
illustration, iconography, diagrams, motion, accessibility, and do/don't rules.
It may contain concise reusable prompts and example purposes, but not pages,
forms, success states, campaign formats, or advertisements. Keep it within
1,400 words. The asset registry owns file provenance and lifecycle; Design
references asset IDs without duplicating their full records.

Typography is a professional proposal derived from the confirmed preference
profile, not a request for the operator to choose an exact font without
guidance. Compare two or three viable pairings when no exact family is already
mandated, explaining language coverage, readability, character, licensing,
and role fit. After the operator selects a pairing, typography becomes
structured data, not prose parsing. Every selected type role
records an exact CSS family name, available weights, usage, and one registered
font asset ID. The layer stylesheet must declare that same family and asset
path. Before review, load the real font and verify both
`document.fonts.check(...)` and the specimen's computed `font-family`; a
browser fallback that merely resembles the selection fails the gate. A startup
typography override must provide its own complete role rows, registered font
assets, and layered CSS declarations. An empty startup continues to inherit the
singlepage rows and files unchanged.

Photography and illustration are primary Design quality gates, not optional
polish. A product visitor encounters their consistency before they can evaluate
strategy or implementation detail, so a Design stage cannot complete from
written direction alone. Both media families use the same required document
contract under their respective second-level section:

1. `Purpose and evidence boundary` states the communication job and what the
   imagery cannot prove.
2. `Style master prompt` contains one reusable blockquote made from observable,
   testable constraints. Specify output, palette, contrast, lighting or stroke,
   material or shape treatment, density, negative space, crop behavior, and
   excluded categories. Subjective shorthand such as "premium", "clean", or
   "on-brand" never substitutes for those values.
3. `Production specification` states the variables a content brief must add and
   the technical output requirements without prescribing a finished
   composition.
4. `Generation examples` is a table with example, use, content brief, avoid,
   and exact asset ID. The content brief states what the image communicates;
   it does not encode SVG paths, exact primitive placement, or a copied
   reference composition.
5. `Review and quality gate` defines visual comparison, crop, legibility,
   accessibility, evidence-risk, and registry checks.

Each active media family needs at least three materially different generated or
accepted examples before Design review so consistency is tested across content,
not inferred from one successful image. Review the real registered files
together at source size, intended layout size, a small preview, and every
declared crop. If one example requires a different visual grammar to work,
correct or reject it; do not silently weaken the shared master prompt. Record
exact generation prompts and tool provenance in Assets. Design contains the
reusable master and semantic content briefs, not mutable pointers standing in
for generation provenance.

When a content brief names a recognizable real-world object, review its
category-defining structure, count, scale, and proportions rather than accepting
a merely similar silhouette. Reject invented, truncated, or implausible
substitutes unless the brief explicitly requests abstraction or simplification.

Every reusable generated photography or illustration master is a `1:1` square
raster. Keep every important subject inside the centered `55% × 55%` crop-safe
area so Website, Marketing Creative, and Presentation can derive landscape or
portrait crops without regenerating the visual language. Design renders the
uncropped square master. The asset registry records the square source
dimensions, and review checks the square plus each intended derivative crop.

Spacing, container, column, breakpoint, and radius decisions use named Tailwind
utilities from the repository configuration and record their resolved values;
do not create a parallel arbitrary-pixel system in Design prose. The default
desktop Design container is at least Tailwind `max-w-7xl` (`1280px`).

Local font files and their licenses are machine-consumed assets. They belong to
the layer that selected them and live only below `assets/<layer>/fonts/`, beside
that layer's asset registry. Keep `assets/startup/fonts/` empty until the
downstream project selects its own local fonts; never copy inherited singlepage
fonts into startup. Resolved presentation styles use startup font declarations
when they exist and otherwise continue through the singlepage layer.

Generated outputs use one current proposal ID and `proposed` or `approved`
lifecycle and live only below `assets/<layer>/generated/<proposal_id>/`. On
rejection, record the attributable decision, remove only the owned generated
files and rows after checking references, and replace the stale Design
decision. Git is history. Client and public-reference inputs are never removed
because of age alone. When an attributable operator decision marks an exact
input rejected, replaced, duplicated, or no longer needed, remove its file,
registry row, and stale current-artifact mentions together after checking
current references.

Return Design for operator review. Once its current direction is confirmed,
record that status in `design.md`. No automated prose or prompt validator is
part of this workflow.

Studio presents the complete reusable Design system as one scrollable page per
projection (`default`, `singlepage`, and `startup`). One project-neutral React
template renders the structured Markdown and registered assets for every
projection; layer-owned React Design components are prohibited. Layering occurs
only in `design/<layer>.md`, `assets/<layer>.yaml`, and
`styles/<layer>.css`, with startup data and tokens taking priority in the
resolved projection. The page has no second navigation menu, inventory counters,
or repeated concept summary because Storybook already owns navigation and those
elements do not help a design decision. Its opening block states the visual
concept once as a positive explanation of the selected style, never as a list
of rejected options, provenance, rights, or process notes, and immediately
applies the reusable graphic-language and do/don't rules; logos, colors,
typography, photography, and illustration follow on the same page. Photography
and illustration use the same media-section component.
Their Production specification is exposed through an accessible information
tooltip beside `Style master prompt`, never as a separate card. Their Review and
quality gate remains in canonical Markdown for agent validation but is not
rendered as a human-review card. Paragraph or bullet guidance must work in the
tooltip, while empty decorative panels are prohibited.

Completion requires the resolved Brief to contain five separately labeled and
validated reference sets for interface and website appearance, typography,
photography, illustration, and marketing creative, or an explicit out-of-scope
decision for a genuinely unused family; an operator-confirmed Client visual preference profile; a
reusable visual system; the symmetric photography and illustration contract
above; at least three visually reviewed examples for each active media family;
a reconciled asset registry; accessibility and evidence boundaries; and every
`30-design` profile row answered or explicitly not applicable. Design must stay
reusable across products: marketing references inform its cross-channel visual
language, but it does not contain a product page, campaign, sales deck, or other
offer-specific composition. The canonical outputs are `design/<layer>.md`,
`assets/<layer>.yaml`, and their layer-owned intake and generated files.

When complete, persist `40-products`, `in_progress`, and `[products]` before
handoff.

## 40 — Products

**State**: `active_stage: 40-products`, `active_artifacts: [products]`.

**Owners**: Strategist for each `product.md`; Web Designer for each
`website.md`; Brand Designer for each `marketing-creative.md`; Communication
Strategist and Brand Designer for each presentation.

**Required inputs**: the operator-confirmed Brief offer inventory, completed
Business, approved Strategy containing the exact active product set and
priority, approved Brand, approved Design, evidence, and the resolved asset
registry.

**Capabilities**: artifact read/write, image inspection/generation and Figma
when available, plus static Studio composition; no production data capability.

Products are a catalog, not four global documents. Its layer index lives at
`products/<layer>.yaml`. Every entry names exactly one self-contained folder:

```text
products/<layer>/<product-id>/
  product.md
  website.md
  marketing-creative.md
  presentation/ProjectPresentation.tsx
```

Create catalog entries only for the Strategy's exact active product set. Every
entry must trace to one operator-confirmed Brief offer and its normalized
Business mechanics. Do not infer a product from a showcase, reference project,
web page, repository folder, possible future monetization, or an agent's idea.
If the active set is absent or ambiguous, return to the earliest affected Brief,
Business, or Strategy decision before creating product files. If product work
uncovers a genuinely new offer, add and confirm it upstream first; never append
it directly to the catalog.

`product.md` is a decision-ready product definition with exactly six
second-level sections: Product identity; Best-fit customer; Problem and desired
progress; Positioning and value; Offer and usage; and Evidence and decision
rules. It distinguishes brand from product, user from buyer and payer, access
from successful use and adoption, current evidence from hypothesis, and the
product from related showcases or supporting offers. It applies the shared
Strategy and may narrow it; it never silently changes the shared business,
strategy, brand, or design decisions.

Use Jobs to Be Done only to expose the circumstances, functional, social, and
emotional forces, and progress behind a decision; it does not prove demand.
Use the Value Proposition Canvas only to connect customer jobs, pains, and
gains to the offer; the mapping does not prove product-market fit. Use April
Dunford's positioning sequence to relate actual competitive alternatives,
differentiated capabilities, customer value, best-fit customers, and market
category; an internal positioning exercise does not replace observed customer
choices. Record the authoritative sources, project fit, limitations, and effect
on a material decision in the resolved Decision Profile before applying a named
method.

On first generation or any full `product.md` rerun, do not load the previous
product body. Start from `.agents/templates/product.md` and replace the complete
file from the approved upstream dependency closure. Keep it within 1,400 words,
state each decision once, and leave unknown proof explicitly missing rather
than filling a section with generic product language.

`website.md` applies the shared decisions to that product's visitor journey:
information architecture, page structure, final copy, responsive hierarchy,
navigation, actions, forms, validation, error/empty/pending/success states,
post-conversion behavior, metadata, and static Studio compositions.

`marketing-creative.md` contains only the formats selected for that product by
the current strategy: objective, audience situation, channel and format, exact
message, proof/disclosure, composition, dimensions, crop or timing behavior,
variants, prompts, indexed assets, rights, accessibility, destination, tracking
event, owner, and review state.

The presentation is semantic React/HTML derived from the same product and
shared sources. It is not a second business document. PDF and PNG exports are
derivatives only.

Product-catalog inheritance is atomic. If `products/startup.yaml` has no
products, `default` is the complete singlepage catalog. As soon as startup
defines at least one product, `default` contains only startup products. Never
merge product entries across layers: products from different businesses must
not leak into one catalog. Each startup product owns all four referenced files;
there is no partial per-product fallback to a singlepage folder.

Work through one selected product at a time. Product, Website, Marketing
Creative, and Presentation may be reviewed separately, but the product is not
complete until all applicable outputs are coherent with one another. Record an
explicit not-applicable decision instead of creating a placeholder. Stop before
production components, APIs, analytics implementation, QA, publication, or
deployment.

Completion requires the catalog to match the approved Strategy active product
set exactly, with neither omitted nor extra entries, and every catalog entry to
have a bounded and reviewable
`product.md`, concrete website design when in scope, complete selected-channel
creative when in scope, a reviewable presentation when in scope, accessibility
and evidence boundaries, and every `40-products` profile row answered or
explicitly not applicable.

Studio remains a read-only review surface over the same sources. Shared
artifacts keep empty `startup` as pass-through and resolve
`singlepage → startup → default` in memory. Products use the atomic catalog rule
above. React stories may render the result, but Markdown/YAML and the
product-local presentation source remain what agents edit and operators review.

When complete, keep `40-products`, set `status: complete`, and persist empty
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
not loaded as a bundle. Pipeline reconciliation may compare only headings and
schema keys across the relevant current templates before a gap is found; it
must not add all template bodies to professional generation context.

## Handoff

Return only:

- active stage, status, and active artifacts after reconciliation;
- decisions made and their evidence classification;
- files changed;
- unresolved evidence or project questions;
- invalidated downstream artifacts;
- pipeline compatibility gaps repaired or still blocking;
- the next useful action.

When input is required, end with exactly one plain-language question in the
operator's language. A handoff may be as detailed as needed for confident
review; never omit material reasoning or evidence to reduce length. Do not
return role-play dialogue, a biography, or a narrative of routine work.
