---
confirmation:
  confirmed: false
---

# Website

<!-- A prospective website specification within the product's business plan.
Prefer about 1,400 words per page; preserve material information if longer. Describe the visitor experience engineering should build;
production implementation and runtime tests do not gate this document. -->

## Objective and visitor paths

- Audience, visitor situations, information needs, value and intended conversion
- Site tree with page names, routes, purpose and next customer action

## Final page specification

- Author each site's page text in its own product-owned Markdown file: headings,
  offer, inclusions, price principle, process, FAQ, CTA and relevant form/state copy
- Register one page-tree node per route with `representations.text` and an optional
  `representations.preview` (React or HTML). Do not create separate sibling entries
  for the same page's text and layout. Groups use `children`; routes use `route`.
- Work on text first. Studio opens Text and provides Layout for the same page;
  text-only nodes remain usable before a layout exists.
- Keep a page's copy in one source. React previews receive its Markdown through
  the optional `text` prop and derive visible copy from it. Changes to copy then
  appear in both representations. A layout edit that changes wording must edit
  that same Markdown in the same change. A separately authored HTML preview must
  be updated together with its text; there is no automatic HTML rewrite.
- Keep this overview about the journey and page responsibilities; final page copy
  belongs to the page text, not a second duplicated block in the overview.

## Design constraints

- Apply approved Design, assets, typography and visual language
- Specify responsive hierarchy, navigation, interactions, accessible labels and
  the intended post-conversion experience, including relevant empty/pending/
  success/unavailable states. These describe product behavior, not a QA plan.
- Keep the document header and Text/Layout controls in Studio's review shell;
  the layout itself contains only the customer-facing page.
- Campaign formats belong to Marketing Creative; do not create another identity.

## Metadata and review

- Title, description, Open Graph copy, material sources and Studio destinations
- Review text/layout consistency, links, responsive and accessible presentation
  as properties of these materials; do not require a deployed product.
- Markdown pages own confirmation metadata. Rendering a layout never approves
  its wording or an upstream document. Preserve project ownership and the atomic
  startup catalog; no implicit copy, source or approval fallback from the framework.

See `apps/studio/workspace/README.md` for the catalog and component contracts.

<!-- For multilingual projects, specify the source language and supported
locales inside Metadata and review. Use the existing internationalization
configuration and localized vocabulary fields. Translate all page copy,
actions, navigation, status messages, accessibility labels and metadata as one
version. Text/Layout/export must use the same locale and canonical wording. -->
