---
repository: singlepagestartup/singlepagestartup
date: 2026-09-11
status: superseded
---

# Evidence register versus owning documents and Git history

Implementation update: [Evidence removal and stale status](2026-09-11-studio-evidence-removal-and-stale.md) supersedes the current-state findings below; retain this audit only as historical engineering context.

The operator requested analysis of Evidence's practical value and overlap with
GitHub commits. This review does not authorize or implement removal of the
register. It evaluates the current working tree after the product-Research
separation; those local changes are not yet published.

## Conclusion

The current standalone Evidence review document has weak incremental value.
Its useful responsibilities—source attribution, claim status, approval scope,
and proof limitations—should remain, but can live beside the facts or decisions
they qualify. Git should retain change history. A second manually maintained
business-wide summary is unnecessary for this project's current workflow.

Evidence duplicates the owning documents more directly than it duplicates
commit messages. Git preserves file versions and diffs; a commit alone neither
records an unrecorded client approval nor verifies market or runtime claims.

## Observed findings

1. The current register contains 29 rows: 23 `client-claim`, five
   `verified-fact`, and one `missing-evidence`. Nineteen concern identity,
   visual preferences, design intake, or visual corrections (IDs 054–074).
   All rows are active. This is predominantly client/decision bookkeeping,
   not a collection of external evidence. Source: the complete table in
   `apps/studio/workspace/evidence/singlepage.md:15`.
2. Duplicated decisions have clear existing homes. Experiment resource limits
   appear in Evidence row 045, Brief line 45, Business line 15, and Strategy
   line 42. Strategy approval is recorded in Evidence row 053, Strategy line
   10, and Decision Profile line 33. Brand approval is likewise in row 058,
   Brand line 8, and the profile. Reusable visual inputs and current rules are
   already in Brief, Design, and Assets. Some contextual repetition is useful;
   an additional separately edited register adds synchronization work.
3. No row's Source cell contains a direct URL or full commit SHA. Many sources
   are descriptions such as "Operator confirmation". This does not mean the
   facts are false, but the register alone cannot take a reviewer back to the
   specific confirming conversation or inspected file revision.
4. A concrete reference fails semantically:
   `apps/studio/workspace/assets/singlepage.yaml:1162` claims use/modification
   rights were confirmed in SP-EV-056, while that evidence row at
   `evidence/singlepage.md:24` verifies SVG inspection and explicitly excludes
   rights verification. The rights statement is row 054. Similar 056
   references occur in other asset entries. IDs alone do not assure provenance.
5. The workspace loader validates the table, Scope, and State, not source
   quality, approval meaning, or whether an ID supports its consumer's claim:
   `tools/studio/workspace/loader.ts:350`. It loads artifact content as a whole
   at line 401; row-selective context remains an agent instruction. The index
   makes Evidence a dependency of Business, Strategy, Brand, Design, Assets,
   Products, and Decision Profile, so unrelated visual rows can enter earlier
   contexts unless the agent filters them.

## What Git and the existing preflight actually do

- The commit utility creates selected file snapshots and descriptive messages;
  it has no Evidence-writing step:
  `.agents/workflows/engineering/utilities/commit.md:20`.
- The inspected August 14 and September 3 commits have short aggregate subjects
  (`complete pre-development product workspace`, `add portfolio-driven
pre-development workflow`). Their diffs retain document content; their
  messages do not independently encode every client decision.
- On a later workflow invocation, GitHub preflight fetches the configured branch
  and identifies relevant unprocessed SHAs by file rules. It reports candidates,
  not verified business meaning: `tools/singlepagestartup/github/check.ts:398`.
- The agent then interprets material effects, updates documents, and records
  completion in `workspace/pre-development/github/<layer>.yaml`. For material
  changes the current contract additionally requires an Evidence row; this
  can duplicate the owning artifact update:
  `.agents/contracts/github-reconciliation.md:85`.
- The technical reconciliation ledger has a distinct purpose: prevent repeated
  processing of the same published commit. It should remain technical and
  should not become a replacement client-facing history section.

## Recommended ownership if Evidence is removed

| Information                                                     | Canonical home                                                 |
| --------------------------------------------------------------- | -------------------------------------------------------------- |
| Client facts, intentions, source and date                       | Brief/Business, beside the statement                           |
| Strategy, Brand, Design approvals and scope                     | The corresponding document's Decision status                   |
| External sources, product hypotheses and proof limitations      | That product's Research and product claim rules                |
| Supplied files, usage rights, file hashes and generation status | Assets                                                         |
| Current unresolved questions and stage readiness                | Exact owning section; Decision Profile references its location |
| Previous wording, changes and reasons                           | Git commits/diffs; issues/PR discussion where applicable       |
| Published commits already reconciled                            | Existing layer-local technical ledger                          |

Do not replace Evidence with another manual global facts/decisions register or
make each agent reread the full Git history. Current documents must remain
self-contained, attributable, and sufficient for the next decision.

## Removal requirements and remaining risks

Removal is not just deleting the sidebar. Migrate remaining unique source/date,
classification, approval, rejection, and limitation information to its owner;
replace all SP-EV references; update workflow/roles/templates/index/preflight
contracts; preserve singlepage/startup ownership and approval rules. Rejected
design constraints needed to avoid reuse must remain explicit at their owner.

The presentation currently parses SP-EV-022 for module names and SP-EV-009 for
missing-proof status (`workspace/products/presentation-data.ts:192` and `:325`).
Those bindings must move to owned product inputs or the existing inventory before
the register disappears. Row merge/validation rules and affected tests also
need reconciliation. No new permanent evidence or decision registry is needed.

Mandatory GitHub preflight was clean at origin/main
`99e3037f085283f666d96654750cff5ecb5ac620`. The durable cursor remains at the
existing unfinished Design stage. No source documents, application code,
approvals, commits, or stage statuses were changed in this audit; only this
engineering analysis artifact was added. No performance benchmark or fresh
external market research was conducted.
