---
description: Turn a rough founder brief into an evidence-aware business, strategy, reusable brand and design system, and an atomic catalog of product materials before engineering begins.
---

# Pre-development workflow

## Entry

Use this workflow when the operator invokes `singlepagestartup` or asks in plain
language to start, continue, inspect, or change the active project before
engineering begins.

Resolve the active layer through the shared repository-layer resolver using
`apps/studio/workspace/utils/config.yaml` and its safety-checked gitignored
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

Follow `.agents/contracts/document-confirmation.md` for the document-owned user
confirmation parameter, source-layer inheritance, content fingerprints, and
header status. Scope or partial decisions never imply whole-document approval.

Quality, correctness, and a decision-ready result take precedence over response
length, number of turns, execution time, or token use. Never skip a material
question, source check, professional review, or artifact correction to make the
workflow shorter.

The operator must be able to review and edit every primary document without
reconstructing the agent session. `brief`, each model, each product
`research`, `strategy`, `brand`, `design`, and each product-local `product`,
`website`, and `creative`
documents strongly target about 1,400 words per reviewable page, so a normal
review takes about five to seven minutes. This is a preference, never a hard
word, line, source or segment cap. Follow `.agents/contracts/document-readability.md`: preserve material information and use
navigable detail pages when needed. Assets is a reference index,
loaded only when relevant. State each decision once; retain material attribution
with that statement and historical versions in Git. No standalone Evidence
register or mandatory global source ledger is created.

Use the operator's language for questions and handoffs unless they request
otherwise. Use the requested artifact language independently: translate and
normalize operator input when necessary without changing its meaning. Ask one
highest-impact question at a time in plain language. Do not use unexplained
professional shorthand, and do not expand an ambiguous word into requirements
before confirming what the operator meant.

Classify every material unknown by who can resolve it:

- `operator-fact`: current facts or constraints controlled or known by the
  operator, including the project boundary, existing customers or users,
  the current or intended products in scope and the role of supporting
  acquisition activities or internal work,
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
apps/studio/workspace/utils/pre-development/<layer>.yaml
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
`utils/pre-development/singlepage.yaml`; a downstream project reads
`utils/pre-development/startup.yaml`.

## Pipeline compatibility reconciliation

After reading the layer cursor and before accepting its stage, run the
executable stage machine declared in `.agents/pipeline/pre-development.yaml`:

```bash
npm run singlepagestartup:pipeline:check -- --format text
```

The command evaluates every structural gate of every stage against the
resolved workspace and the active layer's own sources, compares the recorded
cursor with the earliest incomplete stage, names detected legacy shapes with
their migration procedure, and prints the manual-review criteria of the active
stage. It writes nothing and does not fail on gaps; its report is the
structural part of the reconciliation below. Judgment gaps still require the
owning role. Then follow `.agents/contracts/pipeline-reconciliation.md`. Compare the existing Workspace
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

Route every missing file, section, schema key, current requirement, or required
approval record to its earliest owning stage. Repair it from attributable current
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
   live under `apps/studio/workspace/<artifact>/`; their read-only stories and
   rendering code live in `apps/studio/workspace/utils/`. Optional project-specific context uses
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
   do not repeatedly regenerate product models, product Research, Strategy, Brand, Website, or
   marketing creative
   from each partial answer. Propagate a batch only after the decision subject
   and affected upstream section are stable or when a confirmed correction
   invalidates an existing downstream decision.
   On a full professional rerun use the canonical template and stable upstream
   dependencies. For Product/model migration, first inspect existing unique facts,
   whole topics, source attribution and extensions; preserve them at their owners.
   Never discard a client fact merely because a template changed. Git retains history.
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
3. Resolve document statuses and reverse dependencies with the shared review
   resolver, including product-local inputs. Follow
   `.agents/contracts/document-confirmation.md`: changed inputs produce `stale`;
   review their semantic impact before use. Refresh a dependency snapshot after
   a no-material-effect review without re-requesting unchanged approval. For a
   material effect, record `review.stale` until the owning correction and required
   confirmation are complete. Never refresh hashes merely to hide stale work.
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

Rules for AI judgment live in `.agents/roles/`, templates, and this workflow.
Project facts, decisions, questions, and constraints live in their owning
workspace documents. Do not create a separate decision checklist, gate table,
or approval register in workspace, and do not copy project business content into
`.agents/`.

Before completing a stage, its owner applies these checks to the actual content:

1. Describe the current or intended business model from client inputs in
   Brief and the owning Product/model. Identify distinct users, buyers, payers, beneficiaries,
   transaction/value units, money flow, capacity, geography, and material limits
   only where they change a decision. Allow compound models; unknown facts stay
   unknown instead of being forced into a familiar category.
2. Record each material unanswered question once, in the document that needs
   its answer. Classify it as `operator-fact`, `research-question`,
   `professional-choice`, or `evidence-gap`. State the decision it blocks and
   any later-stage or launch boundary. Ask the client for operator facts;
   research external questions within the named product; let the responsible
   professional propose choices. An assumption never resolves a client fact.
3. Keep source attribution, applicable metrics, risks, regulation, and viability
   conditions beside the owning decision. General checklists, role instructions,
   and stage rules remain in `.agents/`. Use a named method or benchmark only
   when the consuming document explains its source, fit, limitations, and effect
   on a material decision. Familiar terminology is not evidence.
4. Check the active stage's required content, actual inputs, source limitations,
   and semantic dependency status. Resolve material questions needed for the next
   decision; retain later unknowns explicitly without falsely marking them
   answered. Explain inapplicability where material. A completed heading or
   fluent generic prose never establishes quality or readiness.
5. Read scope confirmation in Brief and required whole-document confirmations
   from source metadata under `.agents/contracts/document-confirmation.md`.
   Never duplicate approval in a second checklist. Scope confirmation does not
   approve the whole Brief; whole-document confirmation does not verify market
   claims. Strategy, Brand, and complete Design remain proposals until the
   active project's user confirmation is valid.
6. Derive the current stage from these criteria and the living documents, then
   update only the minimal layer-local workflow cursor. When a changed premise
   affects downstream content, follow semantic impact review rather than
   importing or automatically rewriting another document.

Ask one highest-impact unanswered question at a time. Write usable answers into
their owning sections and replace stale assertions rather than adding a dialogue
log. Research only questions that can change the current decision. Project-specific
constraints remain reviewable in the operator's ordinary documents.

## 00 — Client Request

**State**: `active_stage: 00-business`. Begin with
`active_artifacts: [brief]`, then `[product-models]`. Resolve model/product files through the catalog; `product-models` is a cursor task, not a global document.

**Owners**: Account Manager, then Business Analyst.

**Required inputs**: founder request, client conversation, supplied documents
and assets, existing project records, and the active index.

**Capabilities**: artifact read/write, inspection of supplied materials, and
browser interaction to read a client-provided source. No external market search
or Market Researcher work belongs to this stage.

Capture `brief` first using its six-section template. It is a self-contained
current business intake, with known meaningful numbers and source attribution
in metadata. Keep quotations, scope-status prose, review chronology, downstream
document links and a generic unknowns checklist out of the body. Discuss
contradictions in chat; retain a material unresolved discrepancy in source
metadata. Before Business Analyst starts, the brief must separate and name:

- the primary decision subject and current business/project goal;
- current or intended products, their stable IDs, client-stated buyer/user,
  availability, price, and delivery mechanics where known;
- supporting reference or demonstration projects;
- historical context and explicit out-of-scope topics;
- current reality, client intentions, and unknowns.

Obtain a compact natural-language scope confirmation including the products in
scope. Record its attribution under Brief's `intake.scope`, separately from
whole-document confirmation. Existing attributable confirmation remains valid
until scope changes.
Do not merge a framework, reference implementation, customer project, and
historical service model because they share people or technology.

Brief also records five separate visual-reference sets: interface/website,
typography, photography, illustration, and marketing creative. Record asset IDs,
client likes/dislikes, and category status; exact IDs and status may be in
Brief frontmatter under `visual_references`. In the visible table, put each
category description and its exact uploaded filenames/working links in the
same row. Include explicit rows for project name, logo, slogan and any supplied
color or other identity elements before the five reference categories. Record
confirmed absence or missing intake explicitly, without inventing an element.
Do not create a separate uploaded-files section. Folder paths alone are
insufficient. Assets owns files and
rights. On additions, verify the files, register their IDs/category and review
the affected description before it is used as a design input; untouched
categories retain their confirmed preferences. Agents inspect the actual source
images and supply them as model reference inputs where supported, rather than
relying only on their textual summaries. This
intake may remain incomplete during product models, Strategy, and Brand, but all five
categories must be ready before Design generation. The client can communicate
preferences through examples without professional design vocabulary. During
Brief intake, the Account Manager delegates bounded reference analysis to the
Brand Designer as each category arrives. The agent inspects the actual files,
compares common traits and returns a short description per category in the
operator's language. Record confirmed descriptions in Brief; inferred traits
remain proposed until reviewed. Final Design decisions still belong to 30-design.
For a new photography direction collect more than three photographs: minimum
four, usually five distinct examples. Preserve already confirmed descriptions
when their references and preference are unchanged.

After scope confirmation, describe the business model from client inputs in
Product, Operations & Economics and Sales; place material questions in the documents that need their answers. `00-business` owns only
operator facts and observations of supplied materials. External research
questions belong to a named product at `10-strategy` or a later consuming stage;
professional proposals belong to their owning later stage. Do not block factual
intake on market research and do not use research to answer an operator fact.

Operations & Economics consolidates client-supplied shared mechanics, ownership, resources,
and constraints. Record each material assertion's source and state: client
statement, supplied-material observation, confirmed intention, explicit
calculation from supplied inputs, or unknown. A client's belief about demand
remains a client claim. A proposed funnel, benchmark, segment, or forecast must
not be presented as a current business fact.

Record each active product's supplied current or client-confirmed intended
sales process in `products/<layer>/<product-id>/sales.yaml`. Use confirmed Brief
IDs or existing catalog paths; do not load delivery drafts to reconstruct facts.
Mark missing operational details in Sales blockers instead of inventing them.
Missing details block `00-business` only when the next strategic decision needs
an operator fact; otherwise retain their exact later-stage or launch gate.
Improvements to the process are later product/strategy proposals.

Claim sources follow `.agents/contracts/evidence.md`. Current client facts stay
in Brief and the owning Product/model, external findings and sources in product Research, and asset
rights in Assets. Approvals and current dependency review are source metadata
under `.agents/contracts/document-confirmation.md`; Git owns prior versions.
Do not create Evidence, a transcript register, or a substitute fact/change log.
Client approval does not make a market hypothesis true. Inherited framework
facts require client confirmation of applicability in the owning startup source.

Completion requires confirmed scope and products, attributable current facts
and intentions, explicit unknowns, and answers to the operator facts needed for
the next strategic decision. Scope confirmation belongs in Brief. Outputs are
Brief, v2 catalog with all confirmed products and model IDs, initial Product,
Operations & Economics, and product Sales intake. Practical materials need not
exist before their stage. Research intake may record questions without findings. There is no business-wide Research artifact.

Before Strategy, Business Analyst creates or reconciles the v2 catalog and initial
Product/model sources. Apply `.agents/contracts/product-models.md` for source
ownership, model boundaries, funding and cost allocation. No business model is
inferred solely from the catalog's product count. The existing `00-business`
stage ID remains compatible but it has no Business output. A cursor naming
`business` resumes as `product-models` after content-aware migration; never mark
intake complete because the old document was deleted.

When complete, persist `10-strategy`, `in_progress`, and `[product-research]`.

## 10 — Strategy

**State**: `active_stage: 10-strategy`. Begin with
`active_artifacts: [product-research]`, then `[strategy]` once research inputs
are sufficient. `product-research` is a cursor task: resolve exact product paths
from confirmed Brief IDs or existing catalog entries; it is not a global document.

**Owners**: Market Researcher for each product, then Strategist.

**Required inputs**: completed client fact intake, confirmed Brief products,
product Sales intake, and only relevant project knowledge
and professional references.

**Capabilities**: artifact read/write, decision-led external research, and
optional document export only when requested.

Before strategic selection, research each product whose audience, alternatives,
pricing, channel, demand, or viability evidence can change the current choice.
Each active product needs a bounded `products/<layer>/<product-id>/research.md`;
include a future product only when comparing it is material to the current
choice. Use `.agents/templates/product-research.md`. Do not perform blanket
research on all possible products. A material unsupported claim remains an
explicit gap or experiment question, never an invented answer.

Work one product at a time. Scope sources, observations, inferences, and unknowns
to that product. Cross-product comparison belongs to Strategy and cites the
relevant product findings; there is no shared market-research summary. A source
may inform multiple products only when its applicability is stated separately.
Do not copy product market findings into product models or a shared register. A contradiction with a client statement becomes a question linked
from product Research; only attributable client clarification or corrected
supplied material updates the factual intake.

Build Strategy from current operator-confirmed Brief facts and external
research. Existing model/Product/Sales intake cross-checks client facts and
resources; unfinished product decisions do not become strategic premises.
Keep evidence provenance in Strategy metadata, without visible citations to
downstream product documents. Name the audience-growth priority (or why none
is active) and sales-product priority. Define the marketing role of each relevant
confirmed Brief product and connect goals, positioning, coordinated channels,
activation, conversion, continued use, recommendations and cross-product adoption.
Supporting activities remain strategic context unless explicitly defined as
separate offers. Detailed offers, campaign calendars, budgets and tests belong
to product work; a first experiment is not the organizing principle of Strategy.

Strategy is the concrete target-state description of the whole project after it
meets the approved Brief as fully as the known constraints allow. Describe how
the resulting marketing system works, how its products, audiences, channels and
customer journeys fit together, and which durable rules govern allocation and
change. Make trade-offs explicit when Brief goals compete. Keep intended and
forecast outcomes distinct from observed results, but present the selected end
state itself rather than narrating the route from today's situation to it. Do
not turn Strategy into a roadmap, backlog, phased transition, a list of what to
prepare or configure next, or a summary of missing product deliverables.
Brief owns the attributable current state and confirmed intentions. Strategy
references only the current facts needed to justify its target state, proof
boundary or material constraint. Product, Sales, Website and Marketing Creative
own the intended offer, process and deliverables; task coordination belongs in
the handoff or later engineering workflow. When a current evidence gap
materially constrains the direction, express the resulting boundary or
management rule in Strategy instead of a next-step instruction.

The shared Strategy template and quality criteria apply equally to new framework
and downstream work. Select the active source with the repository-layer resolver;
downstream projects author `strategy/startup.md` from their own Brief and research.
The inherited framework document is a reference, not a ready-made strategy or
approval for that project. Reconcile existing strategies under the cross-project
rules in `.agents/contracts/pipeline-reconciliation.md` before advancing stages.

`strategy.md` is a replacement projection, not an interview log. During fact
collection, update the owning Brief, product models, product Research, or Sales; do not invoke the Strategist after each answer. Invoke it once
the input batch is stable. Explicit operator corrections confirm the stated
input facts for the requested draft revision; apply them without asking the
same factual questions again. Keep changed whole-document confirmations
unrenewed and present the affected input changes with the revised proposal
for one review batch. This does not approve the new Strategy or advance to Brand.
On first generation or any full strategy rerun:

1. Treat the previous strategy body as invalid and do not load it as an input.
2. Start from `.agents/templates/strategy.md` and replace the complete active
   strategy source from the approved upstream dependency closure.
3. Use exactly the five template sections: Strategic direction; Audiences and
   product roles; Growth system; Customer journey; Measurement and priorities.
   Explain why the selected channels and product experience reinforce each
   other. Approval and review state stay in metadata and the Studio badge; no
   Decision status section or empty blocker table is needed. Keep material
   uncertainty beside the affected decision. Write one coherent final picture
   of the project that fulfills the approved Brief, plus its durable management
   rules, not preparation tasks, transition phases or the next work stage.
   Do not repeat the same audience, value, route or measurement rationale across
   sections.
4. Do not add interview chronology, repeated operator-fact lists, superseded or
   invalidated wording, downstream instructions, or handoff prose to the
   artifact. Use Git for history, document metadata for review state, and the
   response for coordination.
5. Prefer a source of about 1,400 words, without a hard line or word cap and do not add third-level
   headings. Keep product-level business learning to a concise line; do not require
   an experiment track, sample quota, trial calendar or stop-rule table here.
6. Read the complete current strategy as the operator will see it. A
   structurally complete but repetitive strategy fails the stage.

The Strategist owns professional choices, but may not invent operator facts.
If the strategic direction depends on available hours, cash budget, reachable contacts,
channel access, license intent, support capacity, response commitments, or
decision authority that the operator has not supplied, keep the stage blocked
and ask for the highest-impact fact. A proposed public channel alone does not
require proof of an existing account or audience. Do not substitute an easier
channel or different customer journey for the operator-selected direction.

Completion requires coherent project goals, audience-growth and sales-product
priorities, positioning, product roles traceable to confirmed Brief IDs,
a coordinated channel system, activation/conversion/retention/adoption paths,
observable outcomes, durable resource-allocation principles and one clear,
concrete target state for the whole project. That state must satisfy the
approved Brief as fully as known constraints allow. Choices must fit the
available facts and explain material trade-offs.
Do not substitute a next-step list for the strategic direction or invent
ongoing commitments from scoped trial limits or require product-level campaign
design to approve Strategy.
Unresolved evidence must have a clear implication for the decision. Strategy
requires valid user confirmation before the stage completes. Return the compact
marketing direction in the operator's language and keep `10-strategy` blocked on
Strategy's strategic-direction section until the operator confirms or corrects
it. On
confirmation, record approval in the Strategy source metadata and only then
persist `20-brand`, `in_progress`, and `[brand]`. Do not duplicate the document
approval in body prose.

No separate stage command is required; a natural-language approval or
correction is sufficient.

## 20 — Brand

**State**: `active_stage: 20-brand`, `active_artifacts: [brand]`.

**Owners**: Communication Strategist, then Brand Designer.

**Required inputs**: operator-approved strategy, relevant product Research and
client evidence, any indexed project-specific communication context relevant to
this decision, and the current `brand`. Generic communication methods come from
the role; a separate knowledge file is not a prerequisite.

**Capabilities**: artifact read/write and selective web research.

`brand.md` is the meaning that should form in the audience's mind. Communication
Strategist defines audience state, promise, proof boundary, objections, voice,
terminology, CTA, and prohibited claims. Brand Designer completes the brand
premise, character, naming, memorable difference, and governance. Neither role
puts colors, typography, logos, layouts, photographs, illustrations, prompts,
generated files, or channel formats into Brand; those belong to Design.

On a full Brand run, replace the complete active brand source from
`.agents/templates/brand.md` and stable upstream dependencies. Do not load the
old body as generation input. Use the five current template sections: Brand
identity; Intended perception; Meaning and message hierarchy; Voice and language;
Consistency rules. Prefer a result of about 1,400 words without omitting material decisions and state every meaning
or communication decision once. Record sources in claim-keyed metadata;
confirmation stays in metadata and the Studio badge, without Decision status,
visible downstream citations, intake history or a second approval summary.

Completion requires a reviewable intended perception, message hierarchy, proof
limits, objections, voice, naming, governance, resolved material claim and
disclosure questions, and valid Brand confirmation metadata. The canonical output is `brand/<layer>.md`.

The Communication Strategist and Brand Designer make the professional
communication and visual choices; do not ask the operator to design the answer
for them. Return the resulting direction for confirmation, however, because
website work must not silently freeze an unreviewed brand. Until confirmation,
keep `20-brand` blocked on `brand/<layer>.md#intended-perception` and treat the brand and
its meaning as proposed. On confirmation, record it in the brand artifact's
metadata under `.agents/contracts/document-confirmation.md`, then persist
`30-design`, `in_progress`, and `[design, assets]`. Do not duplicate its status
in the body.

## 30 — Design

**State**: `active_stage: 30-design`,
`active_artifacts: [design, assets]`.

**Owner**: Brand Designer.

**Required inputs**: product models, approved strategy, approved brand,
a complete categorized visual-reference intake in
the resolved Brief, matching registered Assets, and every upstream correction
triggered during design.

**Capabilities**: artifact read/write, image inspection/generation and Figma
when available, plus static Studio composition; no production data capability.

Before loading, generating, or updating Design decisions, inspect the resolved
Brief's `Visual reference intake` and the matching registered Assets. Brief
must contain five separately labeled reference sets: interface and website
appearance, typography, photography, illustration, and marketing creative.
For every family it records the required reference set, reference asset IDs,
liked and disliked qualities, and category status. Read the visible preferences
together with any exact IDs/status stored in Brief's `visual_references`
frontmatter; do not reinsert workflow instructions into the client document. Existing project materials
stay canonical in Assets rather than being duplicated in each intake row.
Every category needs supplied references or an explicit out-of-scope decision;
silence is not an answer. A reference expresses preference, not copying
permission.

If this prerequisite is incomplete, keep `active_stage: 30-design`, set
`active_artifacts: [brief, assets]`, and block on
`brief/<layer>.md#visual-reference-intake`. Route operator facts to the Account
Manager-owned Brief and files to Assets. The Brand Designer may validate
category fit and describe shared traits in any supplied category, returning
that proposed description to the Account Manager for client review. This
preliminary analysis may continue while other categories are missing. Do not
copy the intake table into `design.md`, select final tokens or project visual
territories, write production media prompts, or generate Design assets before
the Brief gate passes.

The operator supplies each set separately, for example from Pinterest, and
labels its category at upload. Interface references must show interface
details; typography references must make type character and hierarchy
observable; photography references must be actual photographs; illustration
references must be illustrations; marketing-creative references must be
banners, covers, advertisements, or social posts with visible text and
composition. Screenshots are valid for typography and UI fragments; illustration
includes infographics and explanatory graphics, while marketing creative also
includes printed and handout materials. The operator need only indicate that
an example appeals to them. The agent identifies the relevant visual qualities.
Copy accepted files into
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
a `Client visual preference profile` in `design.md`. Start with a separate
short description for photography, typography, interface appearance,
illustration/infographics, and marketing/handout materials. For each, explain
what recurs across its examples, using specific asset IDs for support. Inspect
actual images, not only filenames, registry descriptions or one selected image.
Keep a lone trait or disagreement separate instead of treating it as shared.
Use already confirmed intake descriptions without asking for the same approval
again. This synthesis translates every used reference and operator statement
into a coherent description across
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

Connect photographic subjects to people, activities and decisions in the
project context. A software business does not imply a computer or phone in
every photograph. Put subjects, props and scenes in each content brief; make
them mandatory only when the current operator direction requires them.
Reassess superseded preferences instead of repeating restrictions created to
repair an earlier unsuccessful image.

`design.md` translates the approved Brand into reusable visual decisions:
identity application, colors, typography, spacing, grid, shapes, photography,
illustration, iconography, diagrams, motion, accessibility, and do/don't rules.
It may contain concise reusable prompts and example purposes, but not pages,
forms, success states, campaign formats, or advertisements. Prefer about 1,400
words per page; preserve material decisions if longer. The asset registry owns
file provenance and lifecycle; Design
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
2. `Style master prompt` is a compact reusable blockquote describing recurring
   visual qualities from the references: photographic light, color, texture and
   movement, or illustration line, shape, space and color. Keep it readable to
   a person and reusable across scenes. Optional techniques stay optional; do
   not stack every reference effect into every image. Do not prescribe devices,
   output dimensions, a fixed composition, object counts, accent percentages or
   quality-check lists unless the operator explicitly requires them as style.
3. `Production specification` supplies the plain-language usage tooltip: copy
   the style prompt, add the subject/action or relationship to communicate, and
   attach relevant source references. Output format and crop requirements belong
   to the specific deliverable; internal quality checks belong to the review
   block and file dimensions to Assets.
4. `Generation examples` is a table with example, use, content brief, avoid,
   and exact asset ID. The content brief states what the image communicates;
   it does not encode SVG paths, exact primitive placement, or a copied
   reference composition.
5. `Review and quality gate` defines visual comparison, crop, legibility,
   accessibility, evidence-risk, and registry checks.

Choose illustration backgrounds for the project's visual direction and intended
placement; transparency is not a universal requirement. Preserve the original
generated master. Compare any processed or exported derivative with it at source
and display size, checking thin lines, secondary detail, color and contrast.
Reject processing that loses detail or changes the visual treatment. When
restoring a previously tested master prompt, reuse its exact original outputs
and provenance if they still satisfy the current brief.

When a reusable master prompt changes, generate at least three different
content briefs with that exact current master and the reference-input procedure
described in its tooltip. Compare the outputs with the selected reference style
and existing examples. Correct material style drift and regenerate the affected
set before calling the new prompt tested. Old images generated from another
prompt are comparison material, not evidence that the current prompt works.
Record the exact master, content brief and input asset IDs in generation
provenance; replace displayed examples with the verified current outputs.

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

Choose each image's format and composition for its subject and intended use;
there is no universal square or centered safe-area requirement. Design renders
the original aspect ratio without cropping. Assets records actual dimensions;
review any requested derivative crop separately. Consistency comes from shared
visual treatment across varied subjects and compositions, not identical framing.

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

Studio exposes Design through `default`, `singlepage`, and `startup` projections.
Choose the visible structure to fit the project's stylistic requirements using
`design/<layer>/layout.yaml`. The ordered `sections` array may select, reorder,
or omit built-in overview, logos, colors, typography, interface, photography, and
illustration blocks, and add sections with an `id`, `title`, and layer-relative `source`.
Markdown, TSX/JSX, HTML, images, and media are supported. Additional Markdown
headings alone do not create visible sections. A default-exported TSX/JSX
`template` may replace the visual canvas below the shared review header and
receive the resolved Design document,
asset registry, confirmation, and declared section children. With `sections: []`,
it can use its own structure without the legacy field schema. Use Tailwind and
layered styles; do not edit the shared template for one project's requirements.

Keep one neutral Workspace document header above the visual canvas in every
non-empty `default`, `singlepage`, and `startup` Design view: confirmation badge,
Design H1, purpose, and usage. The shared renderer owns this header even when
overview is omitted or a project supplies its own template. Project colors,
fonts, layout, and visual examples belong inside the canvas; scope project
styles so they do not restyle the review header. Start template content at H2.
Do not duplicate the title, badge, or process metadata inside the mockup.
Downstream projects inherit this presentation contract while owning their
visual choices; a new startup design must not redesign the Workspace shell.

A downstream project must own its brandbook rather than shipping the
framework's. Inheritance is the explicit starting state, so `studio:validate`
stays silent until that project's own cursor reaches `30-design`; from then on
it requires `design/startup.md` to hold decisions of its own, to carry its own
operator confirmation, and `assets/startup.yaml` to register at least one owned
asset. An inherited singlepage approval never satisfies this gate. Either write
the startup layer or move the cursor back to the stage that is actually current;
do not silence the check by copying framework prose into the startup file.

Empty startup layout inherits the complete singlepage layout. A non-empty
startup layout replaces it completely; all declared files must exist in its
own layer. Document section inheritance in `design/<layer>.md`, Assets resolution,
and CSS cascading remain independent. An inherited base layout can present
startup data and tokens. Project-specific components/data live in
`design/<layer>/`; technical support lives in `utils/design/` and shared components.
See the workspace README for the exact schema and component props. Keep source
inspection separate from the resolved default and preserve the document status.

The default template is a reusable starting point. Choose relevant visual families
from the client brief; do not retain photography, illustration, or another block
solely because the starter includes it. Hiding a block does not satisfy an
unresolved requirement or out-of-scope decision. Review custom templates/sections
in a browser and check layer ownership, relative assets, responsive behavior, and
the absence of duplicate status/heading content. Primary document confirmation
does not automatically approve additional components or media. Review semantic
impact after changes and mark affected documents stale until resolved.

The default opening block states the visual concept once and applies reusable
graphic-language and do/don't rules. Its photography and illustration blocks
share one reusable media-section component.
Their Production specification is exposed through an accessible information
tooltip beside `Style master prompt`, never as a separate card. Their Review and
quality gate remains in canonical Markdown for agent validation but is not
rendered as a human-review card. Paragraph or bullet guidance must work in the
tooltip, while empty decorative panels are prohibited.

Design ships rendered specimens, not only rules. Declare them as layer-owned
HTML sections in `design/<layer>/layout.yaml`; Studio inlines a Design HTML file
so plain Tailwind resolves against the project's own `--workspace-brand-*`
tokens. Keep them framework-free, express state with CSS because injected
scripts do not run, and print each specimen's exact class recipe beside it so a
product surface is built from the string rather than from an approximation.

Generate this minimum whenever the project ships any product surface. Controls:
one dominant action with its secondary, plain, disabled, and separated
destructive variants; selection as a chip and as a grouped choice, each carrying
a non-colour signal as well; status and progress; fields and data rows;
navigation for a public page and for a work screen with a selected item; and the
dark pair whenever the colour system declares a dark column. Compositions: an
editorial entry, a content card carrying the project's own confirmed imagery at
its original aspect ratio, an icon card on the declared icon grid, and a
repeated item grid. Add an offer comparison when the project sells, a contextual
sheet when it has a mobile or overlay surface, and a media-and-text row when
illustration is an active family. Omit a specimen only with an explicit
out-of-scope decision; an absent block is not a silent answer.

Every specimen declares itself with `data-specimen="<id>"` on its container, so
completeness is checked rather than assumed. `studio:validate` requires
`actions`, `selection`, `status`, `fields`, `navigation`, `editorial-entry`,
`content-card`, `icon-card` and `item-grid` as soon as a layer documents an
`Interface and product surfaces` section, and adds `dark-pair` once the
Semantic color system declares a Dark column. It reads the layout that actually
renders, so a replacement startup layout owes its own specimens. To drop one,
record `interface_review.omitted_specimens.<id>` with the reason it is out of
scope; an empty reason does not satisfy the gate.

Every specimen uses the confirmed semantic roles and type steps. Do not invent a
size, a radius, or a colour that the Design document does not define: if a
needed step is missing, add it to the document as a proposal and obtain
confirmation instead of improvising in the markup. Never frame supplied artwork
with a second background, because a registered master keeps its own
off-white and no container colour can match every one of them. Review the
specimens in a browser and verify computed styles, not appearance alone.

Completion requires the resolved Brief to contain five separately labeled and
validated reference sets for interface and website appearance, typography,
photography, illustration, and marketing creative, or an explicit out-of-scope
decision for a genuinely unused family; an operator-confirmed Client visual preference profile; a
reusable visual system; the symmetric photography and illustration contract
above; at least three visually reviewed examples for each active media family;
a reconciled asset registry; the required rendered specimens above with their
class recipes; accessibility and evidence boundaries; resolved
material design constraints; and valid confirmation of the complete Design. Design must stay
reusable across products: marketing references inform its cross-channel visual
language, but it does not contain a product page, campaign, sales deck, or other
offer-specific composition. The canonical outputs are `design/<layer>.md`,
`assets/<layer>.yaml`, and their layer-owned intake and generated files.

When complete, persist `40-products`, `in_progress`, and `[products]` before
handoff.

## 40 — Products

**State**: `active_stage: 40-products`, `active_artifacts: [products]`.

**Owners**: Business Analyst for model coherence and process; Strategist refines each `product.md`; Web Designer for each
`website.md`; Brand Designer for each `marketing-creative.md`; Communication
Strategist and Brand Designer for each presentation.

**Required inputs**: the operator-confirmed Brief products, each active product's
Research and Sales process, initial product models, approved Strategy containing the
product roles, marketing direction and separate priorities, approved Brand, approved
Design, the product Research, and the resolved asset registry.

**Capabilities**: artifact read/write, image inspection/generation and Figma
when available, plus static Studio composition; no production data capability.

The output is a prospective, integrated business plan and product requirements
for later engineering: audience, problem, offer, intended experience, economics,
market context, promotion and business outcomes. Describe how the product should
work without presenting planned capabilities, adoption or revenue as observed.
Technical correctness is an implementation requirement. Installation checks,
runtime tests, bug repair and release/license-source audits are not completion
gates for this stage. Do not turn product documents into an implementation audit.
Static artifact, visual, link and accessibility review still verify the materials
being delivered here; they do not certify the future product's runtime behavior.

Apply this method in both source layers. Each downstream project supplies its own
business facts and intentions; it does not inherit the framework's offer, numbers
or approvals. Current market evidence informs the plan. Commercial assumptions
and forecasts retain their basis and classification; never invent operator
budgets, capacity, customers, revenue or targets. Follow
`.agents/contracts/product-models.md` for ownership and the business boundary.

Products are a catalog, not four global documents. Its catalog and models are created during `00-business`; its layer index lives at
`products/<layer>/catalog.yaml`. Keep both `singlepage` and `startup` folders
with their own catalog from the outset, matching the explicit extension boundary
in `libs/modules`. An empty startup catalog inherits the base; its first product
replaces the complete base catalog. Do not create duplicate framework products
under startup. Each product owns these data sources:
the Research prepared before strategic selection and Sales intake recorded during product models:

```text
products/<layer>/<product-id>/
  research.md
  analytics.md
  sales.yaml
  product.md
  website.md
  marketing-creative.md
  presentation/data.yaml
  content/ # optional product-owned supporting data
```

Retain the catalog entries created during `00-business` for every operator-confirmed Brief product, regardless of launch or marketing priority. Every
entry must trace to a confirmed Brief product and own Research and Sales,
plus its normalized product models mechanics. Do not infer a product from a showcase, reference project,
web page, repository folder, possible future monetization, or an agent's idea.
If product identity is absent or ambiguous, return to Brief before creating product files. Missing commercial decisions remain explicit in the owned documents and do not hide a confirmed product. If product work
uncovers a genuinely new offer, add and confirm it upstream first; never append
it directly to the catalog.

`product.md` defines the intended product through six canonical second-level
sections: Product identity; Customer Segments; Problem and desired progress;
Value Propositions; Offer and usage; and Business goals and metrics. It
separates brand from product, user from buyer and payer, intended value from
measured results, and the product from related offers. It applies the approved
Strategy without silently changing shared business, brand or design decisions.

Translate the marketing direction into offers, intended customer flows, business
outcomes and promotion. Product owns goals and metric definitions; Marketing
Creative owns channel formats, content and campaign tracking; models own money
and resources. Analytics records current observed values, periods and sources;
Research interprets them for decisions without copying the observations.
Any product-level learning concerns demand, preference, value or commercial
assumptions. It is not an installation trial, technical test plan or release gate.
Add campaign schedules or business experiments only when needed for a selected
commercial decision, never as a mandatory first-experiment section.

Sales describes the complete intended customer/business process through the
segmented Sales workspace in `.agents/contracts/product-models.md`. Its internal
sidebar has Overview and customer segment pages. Each segment connects its pains,
needs, motives, objections and acquisition to a Customer Journey Map (CJM).
Product owns the segment IDs; Website and Creative use the matching segment and
journey moment when authoring materials. Sales v2 pages are generated from the
same layer-owned YAML, including Markdown export; shared Studio utilities own the
navigation and map rendering. Existing v1 intake stays readable until revised.
`readiness: ready` means its material business decisions are complete, even before
the product is implemented. Its `failure` field describes declined or unavailable
offers, abandonment, alternatives and help or continuation paths. Do not put
software errors, debugging or runtime acceptance tests in the customer process.
Keep blockers limited to missing business decisions that actually prevent its
formation; proposed professional choices never substitute for operator facts.

At 40-products, apply `.agents/contracts/research-sales-audit.md`: inspect every
Sales segment and route, record evidence verdicts, and retain competitor detail
in the shared Research tree before using conclusions in Website or Creative.
Research supplies customer, competitor, substitute, price, channel and business
model evidence. Preserve factual technical observations as source metadata when
material, or leave them in Git history; they do not block this business stage.

Use Jobs to Be Done only to expose the circumstances, functional, social, and
emotional forces, and progress behind a decision; it does not prove demand.
Use the Value Proposition Canvas only to connect customer jobs, pains, and
gains to the offer; the mapping does not prove product-market fit. Use April
Dunford's positioning sequence to relate actual competitive alternatives,
differentiated capabilities, customer value, best-fit customers, and market
category; an internal positioning exercise does not replace observed customer
choices. Record the authoritative sources, project fit, limitations, and effect
on a material decision beside that decision in the consuming document. General
method instructions remain in the canonical role.

On generation or rerun, inspect the existing Product, unique extensions and
source attribution before editing. Use `.agents/templates/product.md` for the
canonical sections; preserve every material fact and whole topic. Reconcile
changes with the approved dependency closure; never discard old content blindly. Prefer about 1,400 words per page without discarding material information,
state each decision once, and distinguish facts, proposed behavior and commercial
uncertainty without filling a section with generic product language.

`website.md` applies the shared decisions to that product's visitor journey:
information architecture, page structure, final copy, responsive hierarchy,
navigation, actions, forms, validation, error/empty/pending/success states,
post-conversion behavior, metadata, and static Studio compositions.

Derive the route inventory from the complete applicable Sales CJM. Include
discovery, registration/sign-in, intake, workspace, purchase, settings,
fulfillment/publication, continuation, support and contextual cross-product
handoffs when they exist. Do not reduce a whole customer journey to a landing
page, intake form and success page. In the rendered Website body, retain only
states that materially change the customer's decision, promise, next action or
recovery. Keep framework source mechanics, approved-design reminders, generic
responsive/accessibility rules, confirmation prose, implementation notes and
backend/security architecture in roles, templates, metadata and engineering.

The Website overview owns the visitor journey and site tree. Each route has one
catalog page with `route`, `representations.text` and optional
`representations.preview`, nested with `children` as needed. Develop page copy in
its own Markdown before its layout; Studio provides Text/Layout views of that
same page. React layouts consume the optional `text` prop so copy changes feed
both views. Wording changes made during layout work update the owning text in the
same change; separately authored HTML must also be synchronized explicitly.
Follow `.agents/templates/website.md` and the workspace README.

`marketing-creative.md` contains only the formats selected for that product by
the current strategy: objective, audience situation, channel and format, exact
message, proof/disclosure, composition, dimensions, crop or timing behavior,
variants, prompts, indexed assets, rights, accessibility, destination, tracking
event, owner, and review state.

React Presentation, Website, Analytics, and optional Product Content entry points live beside
their product documents under `products/<layer>/<product-id>/`. Every catalog
path resolves below `products/<layer>/`; Sales and Presentation data YAML
remain with the product documents.

Presentation addresses an intended client, partner, investor or other business
audience. Explain the opportunity, customer value, offer, model, growth and the
relevant next business action. Separate current traction from forecasts and plans.
Do not make the deck an internal QA checklist, technical evaluation protocol or
source-release audit. A prospective presentation does not require a live product.

Every document owns its complete content. Presentation has its own `presentation/data.yaml` and a React entry point; Studio must never extract its text from Strategy, Product, product models, Brand, or another document. Shared rendering components and style tokens remain reusable. PDF and PNG exports are derivatives only. Agents may consult relevant documents during authoring, but update the owned source explicitly after semantic review.

Products can extend any core tab or add arbitrary sections using the optional
catalog `sections` tree (`id`, `title`, `pages`; page `source` and/or nested
`children`). JSX/TSX, HTML, Markdown, images, media, and other working files stay
in the product's layer folder. Shared parsers and loaders stay in
`utils/products/`. Preserve existing core documents and their Overview view.
Do not create empty sections or add every helper file to navigation. Validate
all declared page files with the Studio validator and browser-check relative
assets, nested navigation, and the chosen source layer. React presentations may
compose imported TSX pages; retain the shared slide contract and PDF export.
Additional React decks opt into PDF with `export: pdf`. Follow the workspace
README examples and keep page trees inside the atomically selected catalog.

Legacy `content` is still an optional product-local React surface declared by the
catalog. Its entry point can live in any nested product folder; the files and data
model behind that component belong to the product: they may be transcripts, lesson data,
images, covers, documents, interactive previews, or another content system.
The framework does not require a Content Markdown document, prescribe content
types, or show an empty tab when the product has no Content surface. When it is
declared, agents updating Product, Website, Marketing Creative, or Presentation
inspect the relevant product-owned Content sources because those sources may
provide more precise language and proof boundaries; Content never silently
overrides an approved upstream decision. Customer guides are optional Product
Content; debugging instructions, installation checklists and technical test plans
are not required deliverables or business-stage gates.

Product-catalog inheritance is atomic. If `products/startup/catalog.yaml` has no
products, `default` is the complete singlepage catalog. As soon as startup
defines at least one product, `default` contains only startup products. Never
merge product entries across layers: products from different businesses must
not leak into one catalog. Each startup product owns every referenced document, presentation data and React entry point;
there is no partial per-product fallback to a singlepage folder.

Work through one selected product at a time. Studio groups sources under the
`40 Products` sidebar folder: singlepage and startup are siblings, each listing
only its own products. Empty sources remain visible with a No products state.
Default resolution remains available to loaders without a third sidebar branch.
Groups are derived from catalogs; never maintain a second product inventory in stories.
The selected product opens Product first, then shows Operations & Economics,
Sales, Promotion, and Analytics. Compact badge tabs place Overview and optional
Product Content inside Product, Website/Marketing Creative/Presentation inside
Promotion, and current observations/Research inside Analytics while preserving
their separate sources, page trees, confirmation and exports. Shared models have
one source. Explicit custom sections follow the core sequence.
Supporting pages may have arbitrary nesting and do not need Markdown wrappers.
Outputs may be reviewed separately, but the product is not complete until all
applicable files are coherent with one another. Record an
explicit not-applicable decision instead of creating a placeholder. Stop before
production components, APIs, analytics instrumentation, QA, publication, or
deployment. The Analytics document may still record inspected observations and
explicit measurement gaps.

Completion requires the catalog to match the client-confirmed Brief product inventory, with neither omitted nor inferred entries, and every catalog entry to
have a bounded and reviewable
`product.md`, `analytics.md` with sourced observations or explicit `not measured`
gaps, concrete website design when in scope, complete selected-channel
creative when in scope, a reviewable presentation when in scope, accessibility
and evidence boundaries, with material offer, intended customer-process,
economics and communication decisions resolved or explicitly inapplicable in
their owning documents. Engineering implementation, runtime verification and
release/license-source alignment are outside this completion decision. Review
business coherence and distinguish planned outcomes from observed results.

Apply the material-workspace contract in `.agents/contracts/product-models.md`:
selected creative deliverables are real editable materials with Text/Layout;
presentations have slide navigation and shared PNG/PDF export; optional motion
uses shared Remotion/browser MP4 utilities. Content stays free-form. Confirmation
badges belong beside material titles, outside exported layouts.

Studio remains a read-only review surface over the same sources. Shared
artifacts keep empty `startup` as pass-through and resolve
`singlepage → startup → default` in memory. Products uses the atomic
catalog rule above. React stories may render the result, but Markdown/YAML and the
product-local presentation source remain what agents edit and operators review.

When complete, keep `40-products`, set `status: complete`, and persist empty
`active_artifacts` and `blockers`.

## Ownership and concurrency

- One specialist owns one living artifact at a time.
- Two agents never edit the same file concurrently.
- Only the workflow coordinator serializes index changes; there is no separate
  coordinator role.
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

## Final editorial pass

When the work contains prose intended for a person, apply
`.agents/contracts/editorial-pass.md` after the facts, evidence, links,
identifiers, required structure, and approval state are correct. This is the
last content-editing step before returning or storing the text.
