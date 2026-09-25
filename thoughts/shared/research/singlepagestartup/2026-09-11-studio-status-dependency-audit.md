---
repository: singlepagestartup/singlepagestartup
date: 2026-09-11
status: superseded
---

# Confirmation, upstream changes, and remaining Evidence ownership

Implementation update: [Evidence removal and stale status](2026-09-11-studio-evidence-removal-and-stale.md) supersedes the current-state findings below; retain this audit only as historical engineering context.

The operator asked whether Evidence now lives in Git and document statuses,
which statuses exist, what happens when upstream documents affect an unchanged
dependent document, and whether Studio/agent instructions cover that process.

## Verified current behavior

Evidence remains an independent Markdown artifact, sidebar story, template,
scoped row merger, and shared dependency. Its removal was recommended in the
earlier Evidence audit but was not implemented. The confirmation feature moves
whole-document approval into metadata; it does not migrate every source,
classification, limitation, or SP-EV consumer out of Evidence. Sources:
`apps/studio/workspace/index/singlepage.yaml:12`,
`apps/studio/workspace/evidence/singlepage.md`, and
`2026-09-11-studio-evidence-audit.md`.

`tools/studio/workspace/document.ts:6` declares exactly three computed states:
`unconfirmed`, `confirmed`, and `changed`. The editable metadata contains a
boolean plus approval attribution and a fingerprint. `changed` means a recorded
true confirmation no longer matches the current body or is incomplete; false
or missing metadata yields `unconfirmed`.

The fingerprint covers only the effective body of the same document, with
metadata and outer whitespace excluded (`document.ts:58`). Partial inheritance
therefore handles a retained singlepage section changing the startup result.
It does not fingerprint other documents or read their review states.

The loader computes `uses` closure and reverse dependencies, but its confirmation
calls receive only the document text, layer, and format
(`tools/studio/workspace/loader.ts:432`, `:461`, `:738`). Browser resolution and
product documents do the same (`workspace/project-source.ts:128`,
`workspace/products/source.ts:275`). Thus an unchanged Strategy can still show
confirmed after a material Business change. There is no computed `stale` state
or persisted dependency-review record in this implementation.

## Documentation and agent coverage

Existing instructions do require semantic impact review:

- `artifact-lifecycle.md:93` requires treating contradicted downstream artifacts
  as stale, moving to the earliest affected stage, and not consuming stale work.
- `pre-development.md`, Change an existing decision, requires updating the owner,
  computing reverse dependencies, and rerunning only contradicted/stale owners.
- `pipeline-reconciliation.md:129` explicitly excludes structural additions that
  merely restate approved decisions from automatic invalidation.
- `github-reconciliation.md:110` requires invalidating affected approval rows
  and requesting fresh approval for materially changed decisions.
- `context-loading.md:182` routes shared dependencies through `uses` and product
  dependencies through catalog references, owner paths, and citations.
- Codex role adapters load canonical roles, context-loading, evidence, and
  lifecycle contracts; the shared workflow references document-confirmation.

However, these methods do not define a machine-readable upstream-stale marker,
its priority over a valid body stamp, a dependency snapshot or review boundary,
or restoration after a no-material-effect review. The human-facing Studio
README covers confirmation and same-document inheritance but does not explain
that cross-document invalidation still depends on agent action. The instructions
are sufficient for the basic workflow but incomplete for reliable automatic
status propagation. A profile/cursor update alone cannot change the UI badge.

## Recommended next change, not implemented here

Preserve the three current meanings and introduce an explicit upstream-stale
state: the existing document was reviewed, but materially changed inputs make
it unsuitable as an approved dependency. Keep approval history distinct from
current applicability. Record a compact reason and exact affecting source in
document metadata, without creating a second global register.

The common agent/browser resolver should detect dependency revision changes and
require impact review before reporting that a document is current. A file diff
is a review trigger, not automatic proof of changed meaning. The owner compares
the relevant changes: a no-material-effect result can retain the existing
approval without requesting it again; a material effect marks the dependent
document stale and routes it for revision and any required user confirmation.
Persist enough dependency/review information to resume after context loss.
Apply this to transitive consumers and exact product documents in the active
resolved layer; ignore changes hidden by startup overrides and unrelated
products. Do not approve a startup using inherited singlepage consent.

The status contract, human README, workflow, agent rules, loader, header,
product routing, and tests must agree before claiming this behavior exists.
Removing Evidence remains a separate migration: sources and limits stay with
their owning facts/research, approvals stay in document metadata, and Git holds
history. Git commits and approval badges do not independently verify claims.

GitHub preflight was clean at origin/main
`99e3037f085283f666d96654750cff5ecb5ac620`. The cursor remains at `30-design`,
in progress. This audit did not modify runtime behavior, primary document
approvals, or the workflow cursor.
