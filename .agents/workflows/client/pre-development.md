---
description: Turn a rough founder brief into an evidence-aware business, strategy, brand, and website design package before engineering begins.
---

# Client pre-development workflow

## Entry

Use this workflow when the operator invokes `singlepagestartup` or asks in plain
language to start, continue, inspect, or change the active client project.

Resolve the active layer through `workspace/config.local.yaml` when it exists;
otherwise use repository identity: `singlepage` for the canonical
singlepagestartup repository and `startup` for downstream repositories. An
explicit workspace root always wins. Follow
`.agents/contracts/context-loading.md` before reading project content.

The workflow has no separate state file. Determine progress from the presence,
completeness, evidence, and dependencies of the indexed living artifacts.

## Operating modes

### Start or continue

1. Read the active index and `brief.md`.
2. Load only the dependency closure for the next incomplete artifact.
3. Ask for missing client facts that would materially change a decision; record
   unknowns instead of inventing answers.
4. Launch the artifact owner with only its role contract, relevant dependencies,
   selected professional knowledge, and available capability bindings.
5. Update the canonical artifact directly, then return decisions, unresolved
   evidence, and a short handoff.

### Change an existing decision

1. Classify the request as a correction, new evidence, changed constraint, or
   requested presentation change.
2. Update the earliest canonical artifact that owns the changed fact or decision.
3. Compute reverse dependencies from the workspace index.
4. Re-run only owners whose artifacts are now contradicted or stale. A narrowly
   scoped request may explicitly freeze unaffected upstream decisions.
5. Report every changed artifact and every downstream decision intentionally
   left unchanged.

Do not require separate commands for stages, roles, or document editing.

## Stages

### 1. Understand

**Owners**: Account Manager, Business Analyst, Market Researcher.

**Required inputs**: founder/client request, available attachments, active index,
existing brief/evidence, and attributable market sources when research is
available.

**Capabilities**: artifact read/write, image inspection, browser interaction,
and web research according to each role binding.

Capture `brief.md` and evidence first. When the brief is usable, Business
Analyst and Market Researcher may work in parallel because they own different
files. Complete `business.md` and `research.md` before strategic selection.

Completion requires a bounded offer and audience, explicit unknowns, a complete
customer/service operating process, and source-aware market/customer findings.
The canonical outputs are `brief.md`, `evidence/register.md`, `business.md`, and
`research.md`; client claims, external observations, and inferences remain
distinct.

### 2. Decide

**Owner**: Strategist.

**Required inputs**: completed Understand outputs and only the indexed
professional/channel knowledge relevant to the decision.

**Capabilities**: artifact read/write, web research when a current assumption
needs checking, and document export only when explicitly requested.

Use `brief.md`, `business.md`, and `research.md` to update `strategy.md` with one
primary audience, offer, commercial logic, acquisition focus, evidence limits,
and one bounded first experiment with decision rules.
The canonical output is `strategy.md`; completion requires one selected audience
and buying situation, explicit rejected options, operational fit, a budget/time
limit, useful signal, and positive, negative, and stop rules.

### 3. Package

**Owners**: Communication Strategist, then Brand Designer.

**Required inputs**: approved strategy, research/evidence, existing assets and
rights, and the current `brand.md`/asset index.

**Capabilities**: artifact read/write, selective web research, image inspection
and generation, and Figma interaction only when actually available and useful.

Communication Strategist edits only the message, claim, proof, objection, tone,
and CTA sections of `brand.md`. Brand Designer owns the complete file and
registered identity assets. Claims and generated imagery follow the evidence and
asset contracts.
Completion requires final message hierarchy, observable voice rules, normative
tokens, do/don't rules, usable identity outputs or precise briefs, and provenance
for every asset. The canonical outputs are `brand.md` and `assets/index.yaml`.

### 4. Design

**Owner**: Web Designer.

**Required inputs**: business, strategy, brand, evidence, indexed assets, and
every upstream correction triggered during design.

**Capabilities**: artifact read/write, image inspection/generation and Figma
when available, plus static Studio composition; no production data capability.

Update `website.md` with the visitor path, page structure, final copy, form and
success behavior, post-conversion action, metadata, and links to static Studio
compositions. Stop before production components, APIs, analytics, QA, or
deployment.
Completion requires actual desktop/mobile copy and hierarchy, qualification
form, errors and success state, post-conversion business action, accessibility
constraints, evidence classifications, and named Studio stories. The canonical
output is `website.md` plus presentation-only Studio stories.

## Ownership and concurrency

- One specialist owns one living artifact at a time.
- Two agents never edit the same file concurrently.
- Only the workflow coordinator serializes index and evidence-register changes;
  there is no separate coordinator role.
- A downstream specialist must challenge an upstream assumption when new
  evidence invalidates it, then route the correction to the owning artifact.
- The coordinator updates that earliest owner first, computes reverse
  dependencies, and re-runs only contradicted artifacts before accepting the
  downstream output.

## Tool launch

Resolve required capability IDs from `.agents/tools/catalog.yaml` through the
active provider mapping. Record provenance for research and generated assets.
If a required capability is unavailable, use its declared fallback or stop with
an explicit missing-capability result; never simulate a search, browser action,
image, or design-tool output.

## Handoff

Return only:

- decisions made and their evidence classification;
- files changed;
- unresolved evidence or client questions;
- invalidated downstream artifacts;
- the next useful action.

Do not return role-play dialogue, a biography, or a narrative of routine work.
