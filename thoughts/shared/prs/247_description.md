## Summary

Phase 1 of compacting the pre-development instruction corpus: an inventory of every normative sentence with a provisional disposition, plus golden snapshots of the current behavior. Nothing in `.agents`, Studio or the validators changes here. The ledger is the checklist for phase 2, where each sentence ends in exactly one place or is removed with a recorded reason, and the goldens are what every later rule move must reproduce.

## Changes

- `thoughts/shared/research/singlepagestartup/2026-09-18-pre-development-rule-ledger.md`: corpus counts, disposition vocabulary, a section map for 43 files and 239 sections with the provisional disposition and target of each section, the 23 exact-duplicate groups, the 72 readability restatements, the 55 migration and retirement sentences proposed for `.agents/migrations/`, the recorded goldens and the five decisions needed before phase 2.
- `2026-09-18-pre-development-rule-ledger.tsv`: one row per sentence (2,268) with file, section, line, heuristic kind, disposition, target and duplicate references.
- `2026-09-18-pre-development-goldens.txt`: resolved workspace snapshot for both layers and projections with review states and content hashes (182 entries).
- `2026-09-18-pre-development-rule-ledger-tools/`: the extractor and generator, so the tables can be reproduced against any checkout.

## Verification

- [x] `npm run studio:validate` in the worktree at the merge of #242 — 171 tests across 20 files pass, both layers valid with self-check; recorded in the ledger as the phase-1 baseline.
- [x] Golden snapshot produced with the shared loader and review resolver; review states match the states the review helper reports for every document.
- [x] Ledger regenerated from the stored tools with identical counts.

## Notes

- Dispositions inside mixed sections are heuristic and marked as provisional; the section map is the review unit. Owner review is needed on two buckets only: the exact duplicates and the migration procedures whose legacy shape may no longer exist in any live project.
- The CSV extension is gitignored in this repository, so the machine-readable ledger is tab-separated.
- A populated downstream fixture with all six shared documents does not exist yet; phase 2 adds one before the check command is written.

## Downstream migration

None. This change adds research documents under `thoughts/` only; no workflow, contract, role, template, validator or business source changes, so child projects have nothing to adapt.
