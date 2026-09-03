# Pre-development pipeline reconciliation contract

## Purpose

The current checked-out `.agents/workflows/pre-development.md`, its referenced
roles, templates, contracts, and the active Workspace index define the pipeline
that every framework and downstream project must satisfy. After those shared
files are synchronized into a repository, the next `singlepagestartup`
invocation must discover any artifact work introduced by the new pipeline
without relying on chat history, context compaction, a stored pipeline version,
or a separate user command.

Run this reconciliation on every invocation after the mandatory GitHub preflight
and after reading the repository-owned layer cursor, but before accepting the
cursor or launching a professional owner. An unchanged pipeline makes this a
no-op. The repeated comparison is the change detector; do not add a workflow
version, migration ledger, timestamp, or pipeline hash to the cursor or living
artifacts.

This process checks compatibility and routes missing work. It is not an
automated prose-quality score and it never marks a professional artifact
complete merely because headings exist.

## Inspection scope

Use the current workflow and active index to inspect:

- every artifact and dependency belonging to a stage the cursor claims is
  complete;
- the recorded active artifacts and their prerequisite closure;
- every later non-empty living artifact, so an existing downstream document is
  not left on an obsolete shape merely because the cursor moved backward;
- every direction in the active resolved Portfolio and all Research and Sales
  files referenced by it;
- every product entry already present in the active resolved catalog and all
  files referenced by that entry.

First compare file existence, index declarations, headings, and schema keys.
Load full artifact content only for a discovered gap and its dependency closure.
This preserves decision-scoped context while still checking the complete
existing Workspace.

For Markdown artifacts, the current artifact template's second-level headings
are required structural sections unless the workflow explicitly says otherwise.
For YAML artifacts, require the schema and keys used by the current template and
workflow. For Portfolio, require the atomic catalog shape, one Research file per
direction, one Sales file per active product, and no Sales file on another role
or lifecycle. For Products, require the atomic catalog shape and every referenced
`product.md`, `website.md`, `marketing-creative.md`, and
`presentation/ProjectPresentation.tsx`. When a catalog entry declares optional
`content`, require its referenced React entry point but do not require any
particular supporting file extension or content schema. Also compare the artifact's decisions
with the current stage completion rules and the decision-profile rows assigned
to its owner. A changed requirement inside an existing heading is therefore
still discoverable.

The stage ownership map is:

| Stage         | Existing artifacts to reconcile                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| `00-business` | Brief, Portfolio, Business, global and direction Research, product Sales, Evidence, Decision Profile |
| `10-strategy` | Strategy                                                                                             |
| `20-brand`    | Brand                                                                                                |
| `30-design`   | Design, Assets                                                                                       |
| `40-products` | Product catalog and every product-local output                                                       |

## Layer and inheritance rules

Resolve the active layer through the repository resolver before inspecting
sources.

- In the framework repository, reconcile and write only `singlepage` sources.
- In a downstream repository, inspect the resolved `default` artifact but write
  project-specific repairs only to `startup` sources.
- An empty startup source remains valid pass-through until that artifact becomes
  active for the downstream project. It cannot satisfy a project-specific scope,
  approval, evidence, or decision-profile gate merely by inheriting an unrelated
  SinglePageStartup decision.
- When a newly added section is inherited from singlepage, inspect whether its
  content is genuinely applicable to the downstream project. Keep valid
  inheritance unchanged; write a startup section when the project needs a
  different answer; block and ask when applicability depends on an unknown
  operator fact.
- Do not copy an entire singlepage document into startup just to match a new
  template. Add only the project-owned section or decision required by the
  current pipeline.
- Product catalogs retain atomic inheritance. Once startup owns any product,
  reconcile only the complete startup catalog; never repair it with a
  singlepage product fallback.
- Portfolio catalogs follow the same atomic rule. Once startup owns any
  direction, reconcile only the complete startup Portfolio and its referenced
  files; never repair it with a singlepage direction fallback.

## Gap classification and repair

Classify each discovered incompatibility before changing content:

- `structural-gap`: a current workflow artifact, index entry, file, required
  heading, schema key, product reference, or stable approval row is absent;
- `operator-fact`: the new section or rule requires a fact controlled by the
  operator;
- `research-question`: current external evidence is required;
- `professional-choice`: the owning role must make or remake a decision;
- `evidence-gap`: the required proof does not exist and must remain explicit.

For every gap:

1. Identify the earliest owning artifact and stage.
2. If current attributable facts and approved upstream decisions are sufficient,
   let that artifact's owner repair only the missing section or regenerate the
   artifact when the current workflow requires full replacement.
3. Never insert placeholder prose, infer an operator fact, copy SinglePageStartup
   business data into a downstream project, or preserve an obsolete decision
   merely to make the shape pass.
4. Compute reverse dependencies and mark only contradicted downstream artifacts
   stale. A new section that records an already-approved decision does not by
   itself invalidate that decision.
5. Move the layer cursor to the earliest incomplete stage. Set `status` to
   `in_progress` when an owner can repair it immediately, or `blocked` with exact
   artifact-section references when operator input or unavailable evidence is
   required.
6. Persist the repaired artifact and cursor before continuing. Re-run this
   reconciliation; normal stage work may resume only when no earlier pipeline
   compatibility gap remains.

If a required role, template, contract, index entry, or source file is missing
from the synchronized checkout, stop with a structural blocker. Do not recreate
shared pipeline files inside a project-specific Workspace.

## Handoff

Report whether reconciliation was a no-op or found gaps, the earliest affected
stage, repaired and still-missing sections, downstream artifacts invalidated,
and the resumed stage. Do not expose routine heading-by-heading checks when no
gap exists.
