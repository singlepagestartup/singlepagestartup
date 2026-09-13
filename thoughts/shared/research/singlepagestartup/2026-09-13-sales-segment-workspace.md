---
repository: singlepagestartup/singlepagestartup
date: 2026-09-13
scope: Reusable Sales segment navigation, decision profiles and customer journey maps
---

# Sales segment workspace

## Operator intent and ownership

Sales needs the same internal sidebar pattern as Website and Marketing Creative.
Every customer segment must expose needs/pains, motives, decision trigger and
criteria, objections and convincing material, acquisition/messages, and its own
Customer Journey Map (CJM). A flat operational stages table does not explain who
makes the decision or why. Research revision is deferred. Preserve the human-made
and delegated-agent paths without inventing a paying agent or chat purchase.

## Shared implementation

- `apps/studio/workspace/utils/products/sales.ts` reads legacy Sales v1 and new
  `singlepagestartup.sales-process.v2`. V2 owns `segments[]`, each referencing an
  ID declared in Product frontmatter `customer_segments`. Ready profiles require
  acquisition, decision context and customer-perspective journey fields.
  Product coverage, duplicate IDs and mixed-schema ambiguity are validated.
- `utils/products/source.ts` parses selected-layer Sales once, validates Product
  IDs, attaches generated Sales segment pages and retains catalog extensions.
  It never loads a framework profile into an owned startup product.
- `utils/components/SalesSegment.tsx` produces the shared page data, profile,
  desktop CJM matrix and mobile expandable journey cards. Business handoffs are
  collapsible. Profile/CJM Markdown export comes from the same YAML values.
- `ProductPages.tsx` reuses its tree, keyboard navigation and header badge, and
  supports Markdown exports attached to rendered pages through `downloadName`.
  Each segment shows the whole Sales confirmation. There are no independent
  segment approvals or copied canonical Markdown documents.
- `tools/studio/products/validate.ts` checks Sales against Product IDs.
  `tools/studio/workspace/review.ts` makes Sales a direct Creative review input,
  as it already is for Website and Presentation.

## Pipeline and project data

Shared product-models contract, Sales/Product templates, Business Analyst role,
workflow and reconciliation describe the segmented method. AGENTS/CLAUDE and the
Studio README carry the same boundary. New downstream work uses its own IDs and
customer facts. V1 remains readable as migration input; revise it to v2 at the
next owned Sales change instead of generating imaginary profiles on load.

Code Framework Sales now owns makers and developer-agents profiles, with 6 and 5
journey points and 3 acquisition routes each. Product IDs are explicit metadata;
its visible business decisions are unchanged. Motivations/expectations are
attributed professional proposals, not interview findings. NN/g Journey Mapping
101 supplies the customer-perspective method, not project customer evidence.

Strategy's direction is unchanged: maker adoption, free code, separate hosted
chat revenue, optional chat-to-framework handoff and longer-term agent selection.
After semantic review, only its Sales input snapshot was refreshed. Strategy,
Brand and Design remain confirmed with their original body fingerprints.
Sales remains unconfirmed. Website, Creative and Presentation have explicit
Sales-impact review reasons. Their visible copy is unchanged pending targeted
review. Research is unchanged. The prior Brief changed state is untouched.
The workflow cursor remains 40-products/in_progress/products.

## Verification

- Studio validation: 135 tests in 17 files plus 5 GitHub reconciliation tests,
  all passing. Studio TypeScript and git diff --check pass.
- Added BDD cases cover distinct segments, missing customer perspective,
  missing/foreign Product segments, duplicate IDs, unknown initial intake,
  mixed schemas, and shared startup navigation/export isolation.
- Isolated real Chrome checks Overview and both segments, 6/5-column journeys,
  a single header badge, keyboard/collapse, handoff disclosure and a fresh actual
  Markdown download without metadata or the other segment's content.
- Desktop 1440px and mobile 375px have no document overflow. Desktop CJM scrolls
  within its region; mobile displays readable expandable cards. Screenshots
  inspected: maker profile, desktop CJM and mobile CJM.
- Browser script/log/results: `/tmp/sps-sales-browser-qa.ts`,
  `/tmp/sps-sales-browser-qa.log`, `/tmp/sps-sales-browser-qa/`.
  Rendered segment word counts excluding Markdown syntax: 1332 and 1220.
- Mandatory GitHub preflight clean against origin/main at 48fff95f; no pending
  published changes. Initial sandboxed fetch/Chrome launches needed ordinary
  execution escalation; retries passed. No commit, push or publication.
