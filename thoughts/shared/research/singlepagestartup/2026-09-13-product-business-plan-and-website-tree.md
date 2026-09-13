---
repository: singlepagestartup/singlepagestartup
scope: Studio product business documents and paired website pages
---

# Business plan and Website page tree

Product formation describes the intended business before engineering. The shared
contract is `.agents/contracts/product-models.md`; Product's final H2 is
`Business goals and metrics`. Sales readiness refers to completeness of the
intended customer process, not implemented software. Research covers market and
business evidence. Technical validation of Studio artifacts is separate from
validation of a future product.

## Website source contract

- `apps/studio/workspace/utils/products/catalog.ts` supports nested `children`, a
  display `route`, and `representations: { text, preview? }`. A node cannot mix
  representations with legacy `source`. Text must be Markdown; preview must be
  React or HTML. Both paths stay in the owning product/layer.
- `utils/pages.ts` resolves both files without layer fallback and passes the full
  Markdown to a React preview's optional `text` prop. `WorkspacePage.tsx` forwards
  that prop. Additional mixed-format pages remain supported.
- `utils/components/ProductPages.tsx` renders an expandable keyboard-accessible
  page tree and Text/Layout controls. Text is the default. A text-only page remains
  editable before its layout exists; Layout is disabled until declared.
- `tools/studio/workspace/review.ts` registers paired text under the existing
  `product.<id>.page.<section>.<page>` review ID. Approval stays with the Markdown;
  displaying a layout does not approve it.
- The Code Framework landing owns its copy in `website/page.md`. Stable hidden
  `section` markers bind copy to `website/content.ts`; `Landing.tsx` consumes it.
  Changing wording in the Markdown feeds both representations. A layout author
  changing copy must edit that same source. Arbitrary HTML is not automatically
  rewritten; agents update both representations in the same change.

## Verification

`npm run studio:validate` passes TypeScript, workspace/catalog validators,
111 Bun tests and five GitHub reconciliation tests. Added BDD coverage verifies
paired copy propagation, editable headings, text-only work, independent source
ownership, review registration and missing-preview failures.

An isolated browser review checked Text-first selection, tree collapse, preserved
tab stop, ArrowRight expansion and ArrowDown focus. The landing has no horizontal
overflow at 1440px or 375px; fonts and registered images load. Three creative
compositions and all ten presentation slides fit their intended frames. PDF export
remains available. These checks cover the Studio materials, not future product
runtime behavior.

Strategy, Brand and Design content fingerprints are unchanged and their inspected
dependency snapshots preserve valid confirmations. Revised product documents stay
unconfirmed for operator review. AI Chat intake follows the same method and keeps
real commercial unknowns; its full downstream materials are separate product work.
