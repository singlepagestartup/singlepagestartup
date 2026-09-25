---
repository: singlepagestartup/singlepagestartup
date: 2026-09-11
status: partially-superseded
---

# Products without a separate Portfolio

The later client-facts/product-Research separation supersedes this report's
Research stage ownership and cursor notes; see
[the follow-up](2026-09-11-studio-product-research.md).

The operator rejected Portfolio as redundant context: products are sufficient.
This supersedes the Portfolio expansion recommendations in the September 10
Studio structure audit. It does not change the approved Code Framework offer or
turn the supporting showcase into a product.

The 2026-09-11 client correction also supersedes the one-product interpretation:
AI Chat is a separate confirmed product. See [product restoration](2026-09-11-studio-product-restoration.md).

## Result

- Removed the Portfolio story, component, catalogs, parser/resolver, index entries,
  template, merge strategy, and direction role/lifecycle intake requirements.
- Moved Code Framework Research and Sales to
  `apps/studio/workspace/products/singlepage/singlepagestartup/`. Sales content is
  preserved; Research wording and its stale MR-05–MR-12 reference were corrected.
- The sole product catalog now declares `research` and `sales` alongside its
  existing Product, Website, Marketing Creative and Presentation references.
  Optional Website and Content components remain supported.
- `products/source.ts` reads both Markdown and Sales YAML from that product's
  layer. Missing references fail explicitly; there is no fallback to another
  product or the removed Portfolio.
- Empty startup inherits the full singlepage catalog; a non-empty startup
  catalog replaces it. Supporting activities remain concise Brief/Strategy
  context. Their former separate research added no unique evidence and was
  removed; approved scope, funding, support and acquisition boundaries remain.
- Updated canonical workflow, roles, contracts, templates, both indexes,
  AGENTS.md/CLAUDE.md and Studio documentation. Product Research/Sales are
  prepared during Business; the selected Products catalog registers those same
  files with delivery outputs. Later context loads only the relevant product.
- Closed the Business sidebar numbering gap while preserving existing story
  IDs/links. Preserved pre-existing local PDF-export and Docker-exclusion work.

## Verification

- `npm run studio:presentation:test`: 50 tests and 298 expectations pass. Coverage
  includes required Research/Sales references, wrong-product Sales rejection,
  atomic product inheritance and optional review surfaces.
- `bun tools/studio/workspace/validate.ts --self-check`: passes, with 30 visible
  entries and 16 imports/exports, including negative inheritance/graph fixtures.
- Storybook production build passes to a temporary output directory. Existing
  direct-eval and chunk-size warnings remain outside this change.
- Live Storybook: Business shows Brief, Business, Research and Evidence without
  Portfolio; Products Research and Sales render the new source paths;
  Presentation and the existing Prepare PDF control remain available; the startup
  source correctly shows its empty state. The built story index preserves the
  existing Evidence link and contains no Portfolio stories.
- `git diff --check` passes. No commit, push, publication, or GitHub Project
  transition was performed.

One existing media test hard-coded the live cursor to `30-design`; the earlier
audit had legitimately returned it to `00-business`. The assertion now permits
earlier prerequisite stages while preventing advancement past unapproved Design.
This avoids freezing workflow progress in a presentation-content test.

## Remaining boundaries

The cursor stays at `00-business / in_progress` for Business, Research and
Decision Profile reconciliation already identified by the audit. Website,
Creative, complete Design approval and product-specific presentation content
remain separate unfinished work. Removing Portfolio does not satisfy these
decisions or change Strategy/Brand approvals.

Downstream projects syncing this change must add product-local Research/Sales
references and move their own existing source files into the matching product
folder. The compatibility contract requires preserving attributable local
content and checking references before deleting obsolete files.
