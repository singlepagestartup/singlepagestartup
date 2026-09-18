---
confirmation:
  confirmed: false
---

# Website

<!-- A prospective website specification within the product's business plan.
Describe the visitor experience engineering should build; production
implementation and runtime tests do not gate this document.

The rendered body contains only project-specific visitor experience, routes,
copy and material interaction behavior. Keep Text/Layout synchronization,
approved-design application, responsiveness/accessibility checks, confirmation,
dependencies, implementation, backend and security instructions in this comment,
the Web Designer role, metadata or engineering work. Do not render them as
generic guidance or an “awaiting review” conclusion. -->

## Objective and customer result

- The recognizable customer problem, supplied material, concrete product output
  and business result the site helps the person pursue
- Target Product segment plus the Sales acquisition and CJM IDs this site serves
- Customer language; avoid brand-first headings, vague “start” CTAs and internal
  terms that a first-time visitor would not understand

## Customer journey and site structure

- Complete site tree derived from the whole applicable CJM, including discovery,
  access, intake, workspace, purchase, settings, delivery/publication,
  continuation, support and cross-product handoff where applicable
- For every route: visitor situation, page purpose, required information,
  primary action, next route and recovery or alternative path
- Cross-route continuity: saved work, return destination after sign-in or
  purchase, and which screen owns each customer decision

## Key product interactions

- Project-specific uploads, forms, choices, editable outputs, purchase moments,
  publishing, support and handoffs that make the customer journey work
- Only states that materially change what the person understands, can do next or
  must recover from; generic UI-state and quality checklists stay outside the body
- Exact commercial behavior comes from Product, model and Sales rather than a
  second price, support or scope description

## Page copy and metadata

- Final customer-facing title, description and route-specific messages
- Author each route's complete headings, offer, process, CTA, form labels,
  consequential states and metadata in its product-owned Markdown page
- Keep overview and page copy complementary rather than duplicated

<!-- Framework contract: register one catalog node per route with
representations.text and optional representations.preview. Work on Markdown
Text first; React receives that text and Layout uses the same wording. Keep the
shared review shell outside exported customer layouts. Apply approved Design and
verify responsive/accessibility behavior without restating those defaults in the
artifact. -->

See `apps/studio/workspace/README.md` for the catalog and component contracts.

<!-- For multilingual projects, specify the source language and supported
locales inside Page copy and metadata. Use the existing internationalization
configuration and localized vocabulary fields. Translate all page copy,
actions, navigation, status messages, accessibility labels and metadata as one
version. Text/Layout/export must use the same locale and canonical wording. -->
