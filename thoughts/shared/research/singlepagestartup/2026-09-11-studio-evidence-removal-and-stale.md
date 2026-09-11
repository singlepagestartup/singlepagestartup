---
repository: singlepagestartup/singlepagestartup
date: 2026-09-11
status: implemented
---

# Evidence retirement and document dependency review

The operator explicitly requested removal of the unused Evidence document to
reduce routine context and requested a document status for changed upstream
inputs. This implementation supersedes the same-day Evidence and dependency
status audits. Existing unrelated working-tree changes, including PDF export,
remain uncommitted and preserved.

## Result

- Removed Evidence sources, story, template, index dependencies, row merger,
  validation fixtures, reconciliation evidence IDs, and mandatory loading rules.
  Important client facts/constraints retain concise attribution in Brief/Business;
  external sources and missing proof live in product Research; Assets owns file
  provenance/rights. Presentation derives inventory from Product and proof limits
  from Research. No replacement fact, source, approval, or change register exists.
- `document.ts`, `review.ts`, and `review-loader.ts` resolve `unconfirmed`,
  `confirmed`, `changed`, and `stale`. Each source owns its last inspected direct
  input hashes in `review.dependencies`. Metadata is excluded from body hashes.
  Changed/missing/added/removed inputs and upstream staleness propagate through
  the dependency graph. `review.stale` retains a known unresolved material impact.
- A no-material-effect review refreshes only the input snapshot. Material changes
  require owner revision and the stage's applicable user confirmation; copying
  hashes cannot clear an explicit stale marker. Templates/roles are not project
  fact inputs. The selected atomic catalog contributes product-local dependencies.
- Empty startup inherits; changed startup text clears inherited approval/review;
  metadata-only local review replaces the review object atomically. Source and
  default projections evaluate the same effective text. Hidden base-section edits
  do not stale the overriding startup decision. Startup-only knowledge participates.
- Studio headers and the agent loader use the same resolver. The read-only
  `document-review.ts --file <path>` helper returns status, current body/input
  hashes, source paths, and transitive dependents, including product documents.
- Updated Studio READMEs, canonical workflow/contracts/roles/templates and shared
  AGENTS/CLAUDE instructions. The stable `.agents/contracts/evidence.md` path now
  contains project-invariant claim/asset source rules, not a project register.

## Migration and approval boundary

Retained prior attributable Strategy confirmation (2026-08-10) and Brand
confirmation (2026-08-11). Citation/governance cleanup does not change their
commercial/brand decisions; body fingerprints were reconciled for that structural
migration only. Initialized reviewed input snapshots for existing active sources.
No other whole-document confirmation was invented. Client statements are still
client statements; dated market findings were not refreshed or promoted to facts.
The cursor remains `30-design / in_progress`, with Design and Assets active.

## Verification

- GitHub preflight: clean at `99e3037f085283f666d96654750cff5ecb5ac620`;
  baseline `838f6e6dc1ed285e5e4e30c7cfa78594e4546083`.
- Studio suites: 76 passing tests; GitHub reconciliation: 5 passing tests.
- Workspace validator: both layers and inheritance self-check pass.
- Studio TypeScript check and Storybook production build pass.
- Browser: confirmed Strategy header; temporary Business input edit automatically
  changes it to stale with dependency sources; exact restoration restores prior
  confirmation. Temporary edit was removed. Business displays its unconfirmed
  status, purpose/usage, and one page title. Evidence is absent from navigation;
  no browser console errors were observed.
- `git diff --check` passes. No commit, push, or publication was performed.
