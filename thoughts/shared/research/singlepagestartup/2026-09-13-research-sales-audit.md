---
repository: singlepagestartup/singlepagestartup
date: 2026-09-13
kind: implementation-knowledge
scope: Segmented Research and non-destructive reading-size guidance
---

# Research of Sales segments

The operator accepted Sales structure for framework and downstream projects,
without confirming all Sales copy. Research must now evaluate each segment's
pains, needs, motivations, choice criteria, objections, acquisition and CJM;
competitors need detailed offers. The earlier hard 1,400-word/7-minute ceiling
must become a strong per-page preference without losing core information.

## Reusable implementation

- `.agents/contracts/document-readability.md` replaces hard word/line/source caps
  across workflow, roles, templates, AGENTS.md and CLAUDE.md. Aggregate Sales YAML,
  Research corpora and customer segment counts have no cap. Preserve material
  details and use navigable pages; longer coherent pages remain valid.
- `.agents/contracts/research-sales-audit.md` defines Research overview + segment
  detail + competitors. The primary template retains six H2s; extra detail
  templates are adaptable. Framework and downstream catalogs use the same tree.
- `tools/studio/products/validate.ts` no longer fails Product/model by word count.
  It collects all registered Research Markdown, validates finding identities
  across the corpus, and checks complete Sales segment/dimension coverage when
  the primary Research declares `sales_audit: true`. Legacy intake remains
  readable until migrated. Metadata cannot prove substantive research quality.
- `tools/studio/workspace/review.ts` makes Research detail feed its summary.
  Research audits observe the raw Sales fingerprint rather than recursively
  inherit its approval state, avoiding Research → Product → Sales cycles. Both
  normal and observed inputs detect changed bodies/missing inputs; only normal
  inputs propagate upstream stale state. The read-only review helper includes
  both in reverse impact discovery.
- Shared ProductPages follows intra-section document links in its page tree;
  WorkspacePage forwards cross-document link resolution. Shared source links
  open the matching Brief/Strategy/Brand/Design story and source layer.

## Current product research and impact review

Code Framework has an overview, makers, developer-agents and competitors pages:
36 unique CF-SPS finding declarations, nine alternatives, all seven dimensions
for both segments, six acquisition routes and eleven CJM steps. Market researcher
used primary studies, explicit first-person accounts and current official offers;
source populations, commercial interests, limits and counterevidence remain in
the owning pages. No runtime/install testing or invented SPS demand is implied.

Business Analyst refined Sales proposals: task-specific function fit, continued
guidance, total cost categories, managed convenience versus control, business
outcome alongside interface, and agent adoption/switching/maintenance effort.
Structure and IDs are unchanged. Research then rechecked that final Sales body
and retained its evidence verdicts; a proposal update does not upgrade evidence.

Product already states task fit, optional entry routes and non-exclusive common
features; no Product body edit was needed. Strategy's AI Chat priority, primary
video CTA and optional maker branch remain intact. Maker-specific direct tutorial
entry elaborates existing maker guidance rather than replacing that primary
priority. No strategic goal, audience or channel commitment was changed. Its
input snapshot was refreshed after this review; approved Strategy/Brand/Design
bodies and confirmation fingerprints are preserved. Website/Creative/Presentation
retain their explicit pending Sales-impact review for their next work stage.
Brief body and its pre-existing changed status were not altered. Research and
Sales content remain unconfirmed; structural acceptance is not full copy consent.

## Verification

- `npm run studio:validate`: passed, including 139 Studio tests and five GitHub
  reconciliation tests; `npm run studio:presentation:test`: 139 passed.
- `npx tsc --noEmit -p apps/studio/tsconfig.json`: passed.
- BDD cases cover ten segments, missing/duplicate/foreign segment coverage,
  missing dimensions, long Product text, thirteen source rows, corpus finding
  collisions, nonrecursive Sales observation and Research detail propagation.
- Real temporary Chrome checks: 1440px overview/detail, 375px no document
  overflow, links select the correct tree page, collapse works, full Markdown
  downloads without frontmatter. `/tmp/sps-research-browser-qa.ts` and its output
  folder hold local browser evidence; they are not framework dependencies.
- Two Storybook service-file 404s (`vite-inject-mocker-entry.js`, `favicon.ico`)
  reproduce on the unchanged Sales route; no new Research runtime errors.

No commit, push or publication was requested or performed.
