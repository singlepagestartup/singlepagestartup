---
description: Turn a rough founder brief into an evidence-aware business, strategy, reusable brand and design system, and an atomic catalog of product materials before engineering begins.
---

# Pre-development workflow

## Entry

Use this workflow when the operator invokes `singlepagestartup` or asks in
plain language to start, continue, inspect, or change the active project
before engineering begins. A bare invocation authorizes inspection and
resumption only; it confirms neither the project scope nor any operator fact.
Repository files may support a proposed scope summary, but they do not reveal
the operator's current intent.

The workflow runs in one context without separate commands for stages, roles
or document editing. Layers, projections and write ownership follow
`.agents/contracts/inheritance.md`; claims, unknowns and assets follow
`.agents/contracts/evidence.md`; approval and review state follow
`.agents/contracts/document-confirmation.md`; capabilities follow
`.agents/contracts/tool-use.md`.

## Every invocation

1. Run the GitHub preflight under `.agents/contracts/github-reconciliation.md`:

   ```bash
   npm run singlepagestartup:github:check
   ```

   It is mandatory, it resolves the layer itself, and a GitHub failure is
   blocking; `waiting-for-baseline` is not. The command only reads and reports:
   the agent performs the side effects of a material commit (earliest owning
   artifact, impact review, cursor) and writes the ledger rows itself, before
   step 3.

2. Read the durable cursor
   `apps/studio/workspace/utils/pre-development/<layer>.yaml`. It holds only
   `active_stage`, `status`, `active_artifacts` and anchors in `blockers`;
   business truth stays in the living artifacts and history in Git. Stage IDs,
   statuses and artifact names are declared once in
   `.agents/pipeline/pre-development.yaml`. A blocker is a workspace-relative
   anchor, `<path>#<heading-or-key>`, such as
   `strategy/singlepage.md#strategic-direction` or
   `products/singlepage/ai-chat/sales.yaml#blockers`; list the anchor of the
   earliest blocked stage first and add a later-stage anchor only when it
   blocks the same decision. When a stage is blocked on a fact owned by an
   earlier document, keep the computed stage and add that document to
   `active_artifacts`.

3. Run the stage machine:

   ```bash
   npm run singlepagestartup:pipeline:check -- --format text
   ```

   The report evaluates every structural gate against the resolved workspace
   and the active layer's own sources, compares the recorded cursor with the
   earliest incomplete stage, names detected legacy shapes with their
   procedure under `.agents/migrations/`, and prints the manual-review
   criteria of the active stage. It writes nothing. Because it compares the
   workspace with the checked-out pipeline every time, a synchronized pipeline
   change takes effect at the next invocation in the framework and in every
   downstream project without a stored version, migration journal or hash.
   The report is the structural half of reconciliation; judgment gaps still
   need the owning role, and existing artifacts are never grandfathered: a
   brief without scope confirmation or a strategy without approval is
   incomplete even when the cursor once advanced past it. An unchanged
   pipeline and a compatible workspace make this step a no-op.

4. Repair gaps before stage work. A `structural-gap` is a missing file, index
   entry, section, schema key, product reference or approval record; every
   other gap carries one of the unknown classes of the evidence contract. For
   each gap, identify the earliest owning artifact and stage; let its owner
   repair only the missing part from attributable current facts and approved
   upstream decisions, or regenerate the artifact when a full replacement is
   required; never insert placeholder prose, infer an operator fact, copy
   framework business data into a downstream project, or keep an obsolete
   decision to make a shape pass; mark only contradicted dependents stale,
   because a new section that records an already-approved decision invalidates
   nothing; move the cursor to the earliest incomplete stage, `in_progress`
   when an owner can repair it now or `blocked` with exact anchors when
   operator input or evidence is missing; persist the artifact and the cursor,
   then rerun the check. A detected legacy shape in the active layer is
   migrated once by its named procedure before the stage resumes, and until
   then the stage that owns the affected documents counts as incomplete even
   when the check computes it complete; a legacy shape reported in the
   inherited singlepage base of a downstream checkout is framework-owned:
   report it and continue. Refreshing dependency snapshots after a
   no-material-effect review is reconciliation, not stage work, and may be done
   for any stage in the same invocation. If a shared role, template, contract
   or pipeline file is missing from the checkout, stop with a structural
   blocker rather than recreating it inside the workspace.

5. Load only what the decision needs: the effective active artifact, its
   transitive `uses` closure, the owning role, the stage entry in the pipeline
   definition and the indexed knowledge selected for the decision. Do not load
   both complete layers, unrelated roles or stages, every template, or
   completed downstream artifacts into an earlier decision unless invalidation
   makes them relevant. Compatibility scans compare headings and schema keys
   without loading every body; templates are loaded only to create an artifact
   or repair a missing section and never replace the role. This separation
   prevents semantic collisions, not thorough research: load any further
   material needed to verify a claim or complete a professional review.

## Stages

Owners, active artifacts, executable checks and manual-review criteria of each
stage are declared in `.agents/pipeline/pre-development.yaml`. The cursor moves
forward only when the check reports the stage complete and the owning role has
answered the manual-review criteria.

| Stage         | Active artifacts, in order          | Outputs                                                                                                 | When complete, persist                                  |
| ------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `00-business` | `brief`, then `product-models`      | Brief; v2 catalog with every confirmed product and model; initial Product, models and Sales intake      | `10-strategy`, `in_progress`, `[product-research]`      |
| `10-strategy` | `product-research`, then `strategy` | One bounded Research per active product, then Strategy                                                  | `20-brand`, `in_progress`, `[brand]`                    |
| `20-brand`    | `brand`                             | Brand                                                                                                   | `30-design`, `in_progress`, `[design, assets]`          |
| `30-design`   | `design`, `assets`                  | Design, the asset registry and the layer-owned intake and generated files                               | `40-products`, `in_progress`, `[products]`              |
| `40-products` | `products`                          | Per product: Product, Analytics, Sales, and Website, Marketing Creative and Presentation where in scope | `40-products`, `complete`, empty artifacts and blockers |

- `product-models` and `product-research` are cursor tasks, not global
  documents: resolve product paths from confirmed Brief IDs or the existing
  catalog. Research is bounded to the products whose evidence can change the
  current choice and is written one product at a time; cross-product
  comparison belongs to Strategy and cites the product findings.
- `00-business` records only client statements, confirmed intentions,
  supplied-material observations and explicit unknowns. Scope confirmation is
  recorded under Brief `intake.scope`, separately from whole-document
  confirmation, and stays valid until the scope changes. No market research
  happens here; research questions go to the named product at `10-strategy`,
  and visual reference intake may stay incomplete until Design.
- Strategy, Brand and the complete Design remain proposals until the operator
  confirms them in plain language; no stage command exists. Return the compact
  direction in the operator's language and keep the stage blocked on
  `strategy/<layer>.md#strategic-direction`,
  `brand/<layer>.md#intended-perception` or the Design confirmation until the
  operator confirms or corrects it, then record the approval in the document
  metadata and advance. Explicit operator corrections confirm the stated input
  facts for the requested revision: apply them without repeating the same
  questions and present the affected input changes with the revised proposal as
  one review batch, which approves nothing by itself.
- `30-design` requires the layer's own Brief to hold five ready reference
  categories (interface and website appearance, typography, photography,
  illustration, marketing creative) or an explicit out-of-scope decision per
  family. Otherwise keep `30-design`, set `active_artifacts: [brief, assets]`
  and block on `brief/<layer>.md#visual-reference-intake`: operator facts route
  to the Brief, files to Assets, and the Brand Designer may describe supplied
  categories meanwhile without selecting tokens or generating outputs.
- `40-products` works through one product at a time. Business Analyst
  maintains the models and Sales, Strategist owns each `product.md`, Web
  Designer each `website.md`, Brand Designer each `marketing-creative.md`, and
  Communication Strategist with Brand Designer each presentation. Every
  catalog entry traces to a confirmed Brief product; a new offer discovered
  during product work is added and confirmed upstream first. Website,
  Marketing Creative and
  Presentation apply the approved Product, model and Sales facts and never
  establish a second price, scope or support commitment; inspect stale
  dependencies before reusing a claim. Record an explicit not-applicable
  decision instead of a placeholder, and stop before production components,
  APIs, instrumentation, QA, publication or deployment.

## Working rules

- Use the operator's language for questions and handoffs unless asked
  otherwise; author artifacts in the requested artifact language, translating
  and normalizing operator input without changing its meaning. Ask one
  highest-impact question at a time in plain words, clarify an ambiguous term
  before deriving requirements from it, and never use unexplained professional
  shorthand.
- Quality, correctness and a decision-ready result take precedence over
  response length, number of turns, execution time or token use. Never skip a
  material question, source check, professional review or correction to make
  the workflow shorter.
- Primary review documents are written for the operator, who reviews the
  resolved `default` projection and must be able to review and edit every
  document without reconstructing the session. Prefer one reviewable topic per
  page, readable in five to seven minutes (about 1,400 words). That is an
  editorial target, never a cap on words, lines, sources, segments or table
  rows; aggregate Sales YAML and Research corpora are not one linear page and
  are never truncated by loaders, validators, exports or agent output. Remove
  repeated prose, then group long material into named pages registered in the
  product catalog; an overview points to detail and never drops evidence, a
  longer page stays whole when splitting would break context, and missing
  information is never justified by the reading-time target. Additional pages
  need no uniform Markdown schema.
- Keep one current decision per topic. Before saving, find every earlier
  statement about a changed fact and replace or remove it in the same edit;
  never append a corrected answer below an obsolete one. Artifacts contain no
  session logs, handoff prose, workflow-owned sections or repeated decisions;
  Git keeps history, metadata keeps review state, and the handoff carries
  coordination. The editorial contract owns the form each statement takes. A completed
  heading or fluent generic prose is not a completed artifact.
- A full professional rerun is a replacement projection: start from the
  template and the stable upstream dependency closure, do not use the previous
  body as generation input, and preserve a prior decision only when its
  upstream owner still states it and the new review selects it again. Before
  any rerun or migration, read the previous document's metadata and body once
  to inventory the unique client facts, whole topics, source attribution and
  extensions that must survive, and preserve them at their owners; never
  discard a client fact because a template changed. The readability target
  counts prose; mandatory template tables are not trimmed to meet it.
- During intake, keep partial facts in Brief and do not regenerate downstream
  artifacts after every answer; propagate a batch once the decision subject and
  affected upstream section are stable, or when a confirmed correction
  invalidates a downstream decision.
- Project facts, questions, constraints and sources live in their owning
  workspace documents, once, with attribution and limits beside the statement.
  Do not create a decision checklist, gate table, approval register, evidence
  register or change log in the workspace, and do not move project content into
  `.agents/`. Use a named method or benchmark only when the consuming document
  states its source, fit, limitations and effect on a material decision;
  familiar terminology is not evidence.

## Change an existing decision

1. Classify the request as a correction, new evidence, a changed constraint or
   a presentation change.
2. Update the earliest canonical artifact that owns the changed fact or
   decision, then run the impact review of the confirmation contract over its
   reverse dependencies, including product-local files. A narrowly scoped
   request may explicitly freeze unaffected upstream decisions; an explicit
   operator request for a later-stage document while an earlier stage is
   blocked is such a request: perform it, keep the cursor at the earliest
   incomplete stage and name the frozen upstream gates in the handoff.
3. Rerun only owners whose artifacts are contradicted or stale; a full rerun
   replaces the owned artifact from its template and current upstream closure.
4. When invalidation retires assets, follow the cleanup rules of the evidence
   contract.
5. Move the cursor to the earliest affected stage, persist it and report every
   changed artifact and every downstream decision intentionally left unchanged.

## Ownership and concurrency

- One specialist owns one living artifact at a time, and two agents never edit
  the same file concurrently.
- The workflow coordinator, not a separate role, serializes index and cursor
  changes; specialists edit their owned artifacts and return completion
  evidence.
- A downstream specialist challenges an upstream assumption when new evidence
  invalidates it and routes the correction to the owning artifact. The
  coordinator updates that earliest owner first, computes reverse dependencies
  and reruns only contradicted artifacts before accepting the downstream
  output.

## Tool launch

Launch the provider custom agent whose ID matches the artifact owner: Codex
discovers the seven project agents from `.codex/agents/<role>.toml`, Claude
from `.claude/agents/<role>.md`. Adapters hold discovery metadata and pointers
only and load the canonical `.agents/roles/<role>.md`, which contains the
profession's responsibility, method, thresholds and handoff in one file.
`.agents/roles/SOURCES.md` is provenance, not routine context; a registry ID or
URL loads nothing by itself. Capabilities and their allowed roles come from
`.agents/tools/catalog.yaml` through the active provider mapping; an
unavailable capability uses its declared fallback or stops with an explicit
missing-capability result, and no search, browser action, image or design-tool
output is ever simulated.

## Handoff

Return only: the active stage, status and active artifacts after
reconciliation; whether reconciliation was a no-op or which gaps were repaired
or still block, with the earliest affected stage; decisions made and their
evidence classification; files changed, with the word count of each changed
document and the decisions replaced; unresolved evidence, questions and
contradictions; invalidated downstream artifacts; and the next useful action.
Do not list routine heading-by-heading checks when no gap exists, and do not
return role-play dialogue, a biography or a narrative of routine work. A
handoff may be as detailed as confident review needs; never omit material
reasoning to reduce length. When input is required, end with exactly one
plain-language question in the operator's language: when several gates are
open, ask about the earliest blocked stage and list the other open decisions
as statements.

## Handing work to engineering

This workflow ends when the product materials it names are approved. What
happens to an approved page next is not this workflow's to decide, and it
is not implemented in `libs/modules` directly:
`.agents/workflows/design-to-implementation.md` owns that order.

## Final editorial pass

Apply `.agents/contracts/editorial-pass.md` to prose intended for a person
after its facts, evidence, identifiers, structure and approval state are
correct.
