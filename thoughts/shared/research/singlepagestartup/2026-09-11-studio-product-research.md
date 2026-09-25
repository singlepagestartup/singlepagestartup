---
repository: singlepagestartup/singlepagestartup
date: 2026-09-11
status: implemented-locally
---

# Client fact intake and separate product research

The operator clarified that `00 Business` is work with the client to record
facts, intentions, supplied materials, and unknowns. External research belongs
to individual products. A common market report mixed product audiences,
alternatives, acquisition hypotheses, and client-controlled facts.

## Result and ownership

- `00 Business` now displays Brief, Business, and Evidence. Removed global
  `workspace/research/`, its template, both index entries, sidebar story, global
  layered-kind registration, and obsolete dependency/preflight references.
  Evidence is numbered 03; its existing story ID still resolves old URLs.
- Business records sourced client statements, confirmed intentions, supplied
  material observations, and unknowns. It no longer duplicates Code Framework's
  evaluation funnel or presents inferred audience/value conclusions as business
  facts. Product Sales retains the intended evaluation process and attribution.
- The existing general Research was about Code Framework. Its useful findings,
  original source IDs/dates, and limitations now live in
  `apps/studio/workspace/products/singlepage/singlepagestartup/research.md`.
  This file has the six product-template sections and 833 words. This migration
  did not refresh August sources or independently validate demand.
- The external alternatives finding SP-EV-015 moved from the common Evidence
  register into that product Research, retaining its identity and attribution.
  Strategy, Product Overview, and Decision Profile now cite its product path.
- Common Evidence contains client statements/approvals, supplied-material
  observations, constraints, and missing project proof. Repeated visual
  limitations were consolidated while preserving all remaining row IDs,
  dates, classifications, and explicit approval boundaries. Detailed inputs and
  file provenance remain in Brief/Assets. Evidence is 1,400 words counting
  Markdown separators; Business is 663 and Strategy 1,397.
- Canonical workflow, roles, templates, context/evidence/reconciliation
  contracts, capability routing, AGENTS/CLAUDE, and Studio READMEs agree:
  Business is client fact intake; product Research starts at `10-strategy`
  before strategic selection; Strategy compares products by citing their
  separate findings. A research contradiction becomes a client clarification,
  never a silent rewrite of an operator fact.
- `product-research` is a cursor task, not a global artifact. Before delivery
  catalog assembly, exact product paths resolve from confirmed Brief IDs and
  Decision Profile owners. Product findings use those paths for context loading
  and consumer invalidation without a second registry or aggregate report.

## Verification

- Mandatory GitHub preflight: clean for repository-owned `singlepage`, remote
  `origin/main` at `99e3037f085283f666d96654750cff5ecb5ac620`; no pending
  published relevant commits. Fetch required normal protected `.git` access.
- Workspace self-check passes: 28 visible singlepage entries and 15 shared
  imports/exports. Startup diagnostic passes with 27 visible entries. Graph
  checks include missing IDs/files, inheritance, scope, imports, and cycles.
- `npm run studio:presentation:test`: all 50 tests / 298 expectations pass.
  Existing coverage verifies product data, module inventory, atomic layers,
  Research/Sales references, and optional surfaces.
- Production Storybook build passes to `/private/tmp/sps-studio-product-research`.
  Existing direct-eval and chunk-size warnings remain. `git diff --check` passes.
- Live Studio displays only Brief, Business, Evidence under `00 Business`.
  Product Research displays its own source path, six sections, dated source
  table, and uncertainty. Product Presentation and Prepare PDF remain available.
  The built story index contains no global Business Research story and preserves
  the Evidence URL.

The existing deck extractor reads literal Business row labels `Separate service`
and `Success unit`, and the Evidence phrase `README files:`. Preserve those
bindings until the separately identified product-presentation refactor replaces
them; changing them silently empties the showcase/module fields. Existing tests
caught both issues during this edit and the source bindings were retained.

## Reconciliation and remaining work

The earlier Business/Research ownership gaps are repaired. The durable cursor
returns to `30-design / in_progress` with Design and Assets: complete Design
approval remains the earliest unfinished substantive stage. Scope, Strategy,
and Brand approvals are retained because their actual decisions did not change.
No Design approval was inferred and no downstream product work was launched.

Website completeness, Creative's claim/asset alignment, and product-specific
presentation generation remain the separate gaps from the September 10 audit.
This change does not claim fresh market research or verified product demand.
Pre-existing PDF-export and Docker-exclusion work is preserved. No commit,
push, publication, or GitHub Project transition was performed.

Downstream projects should move attributable legacy shared findings to their
own products, keep original dates and IDs, update consumer paths/profile owners,
and remove global Research declarations. Research for one product must never
fall back to another product or to inherited framework findings as local proof.
