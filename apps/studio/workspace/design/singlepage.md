---
confirmation:
  confirmed: true
  by: operator
  at: 2026-09-18
  source: "Operator confirmed the Design including the extended type scale in
    chat: «в целом пойдет. Подтверждаем и идем дальше»."
  content_sha256: 6f29bf4c2ea795a190382e7091a7085ee9270f892486aeccd6c2aca62f1179c8
proposal_id: measured-space
review:
  dependencies:
    asset-index: 3959f399ca7ce73eb67531f94dc5349d1cfd3a03e7fb9921627e4c09252b1f41
    brand: 8dbe5a27b000710a03ca504b7a56040516cfdb9b54be0a95d910ee4506361590
    brief: 6b2c413d4d8f686e53dc2886c93c5ad79c8e04b93d75158f0a1fb15051b3fe2f
scoped_confirmations:
  preference_profile:
    confirmed: true
    by: operator
    at: 2026-09-13
    source: "Operator explicitly approved the current Design in chat: «Так, всё,
      подтверди дизайн. Окей, будем с этим работать. Идём дальше»."
    scope: Approves the five-category Client visual preference profile contained in
      the current Design.
  selected_elements:
    confirmed: true
    by: operator
    at: 2026-08-14
    source: Operator-selected JetBrains Mono and Cormorant Garamond, supplied Accent
      BFEF61 and mandatory pixel-grid S.
    scope: Selected identity, font pairing and accent.
  media_direction:
    confirmed: true
    by: operator
    at: 2026-09-13
    source: Operator requests people-and-business imagery, optional devices, compact
      flexible master prompts and replacement of the three photographs.
    scope: Authorizes reference reanalysis and photo production; generated outputs
      remain proposed.
  interface_type_scale:
    confirmed: true
    by: operator
    at: 2026-09-18
    source: "Operator reviewed the rendered specimens and asked for tighter sizes and colour: «текст как будто для слабовидящих... надо поработать именно с размерами шрифтов и, возможно, с цветом», then confirmed the result."
    scope: Adds the Card title 24/28 and Interface body 14/22 steps and the muted supporting-body rule to the Typography scale.
  illustration_background:
    confirmed: true
    by: operator
    at: 2026-09-13
    source: Operator selects the existing warm off-white illustration background and
      requires preservation of line detail and image quality.
    scope: Use the original illustrations with their existing background; processing
      must preserve visual quality.
sources:
  visual_profile:
    classification: supplied-material-observation
    source: apps/studio/workspace/brief/singlepage.md#visual-reference-intake
    source_keys:
      - sources.photography_reanalysis
      - sources.other_visual_reference_reanalysis
      - visual_references
    inspected_files: 42
    photography_files: 7
    distinct_photographic_compositions: 6
    summary: Direct inspection of all original files; recurring treatment and
      meaningful variation inform the revised five-category profile. No original
      photograph requires a digital device.
    interpretation_status: proposed
  meaning_translation:
    classification: assumption
    resolution: professional-choice
    source: apps/studio/workspace/brand/singlepage.md
    sections:
      - Intended perception
      - Meaning and message hierarchy
      - Consistency rules
    supports: One compact project page becoming a private landing-page preview, then
      a GitHub repository and a public site on the user's server; people remain
      visible in the work, while reusable foundations and human-directed agent
      work support later product needs.
    limitation: Editorial images, interface compositions and conceptual diagrams do
      not prove provider integration, deployment speed, market response, useful
      answers, adoption, implemented architecture or successful setup.
media_review:
  source: Coordinator visual review of current media; independent Brand Designer
    comparison of the three regenerated illustrations, 2026-09-13.
  photography:
    status: proposed
    asset_ids:
      - singlepage-generated-measured-space-photography-business-conversation
      - singlepage-generated-measured-space-photography-moment-of-focus
      - singlepage-generated-measured-space-photography-work-in-motion
    reference_fit: Conversation uses gesture and motion blur; portrait uses close
      framing and soft foreground layers; order handoff uses a low viewpoint and
      bright backlight. Natural warm/cool color and human presence connect the
      set. Business scenes and aspect ratios vary.
    display: Original aspect ratios; no automatic square crop.
  illustration:
    status: proposed
    source: Three fresh generations using the exact current master, three software
      content briefs and the five original illustration references.
    asset_ids:
      - singlepage-generated-measured-space-illustration-module-hierarchy
      - singlepage-generated-measured-space-illustration-framework-inheritance
      - singlepage-generated-measured-space-illustration-coordinated-agents
    prompt_verification:
      status: visually-verified
      style_master_sha256: be315e2fd67911a88bfd9380748fd7fa843399951b68d9b3a91c32f2d0265ae7
      reference_asset_ids:
        - singlepage-illustration-reference-isometric-building
        - singlepage-illustration-reference-isometric-platform
        - singlepage-illustration-reference-isometric-workflow
        - singlepage-illustration-reference-isometric-ai-chip
        - singlepage-illustration-reference-isometric-devices
      method: Compare all three generated originals with the source references and
        former examples for linework, open surfaces, restrained accent, readable
        relationships and cross-example consistency. Validate the same
        prompt-plus-brief-plus-references procedure described in the tooltip.
      scope: Style consistency across these three briefs; not pixel-identical
        composition or a guarantee for every future generation.
    reference_fit:
      module-hierarchy: Fine black isometric contours, pale guides and open unshaded
        blocks retain the reference line language; restrained green links
        connect software modules to a shared base without importing reference
        buildings.
      framework-inheritance: Black and gray line hierarchy, light open forms and a
        changed green module reproduce the established family while translating
        continuity into software reuse.
      coordinated-agents: Outlined software panels, pale dotted connections and
        restrained green marks stay consistent with the family; the person
        directs the shared task, with robot icons used as software symbols
        rather than physical characters.
    display: Original aspect ratio without automatic crop.
  product_asset_impact:
    asset_id: singlepage-generated-measured-space-og
    source: Exact immutable copy in apps/studio/workspace/assets/singlepage.yaml.
    issue: Existing copy about evaluating recurring foundations, one pinned version
      and stated rights no longer applies the approved Brand. Product-specific
      OG copy needs revision in its owning product work; this asset is not a
      reusable Design output.
interface_review:
  status: proposed
  source: Direct inspection of all twelve operator-supplied interface references,
    2026-09-18.
  reference_asset_ids:
    - singlepage-interface-reference-risk-balance-landing
    - singlepage-interface-reference-conduit-pricing-landing
    - singlepage-interface-reference-dashboard-theme-settings
    - singlepage-interface-reference-dashboard-book-grid
    - singlepage-interface-reference-agency-portfolio-landing
    - singlepage-interface-reference-pricing-plan-cards
    - singlepage-interface-reference-onboarding-role-form
    - singlepage-interface-reference-mobile-invoice-bottom-sheet
    - singlepage-interface-reference-subscription-access-card
    - singlepage-interface-reference-license-download-card
    - singlepage-interface-reference-license-add-to-cart-card
    - singlepage-interface-reference-product-license-selection-card
  method: Compare all twelve references for surface treatment, spacing rhythm,
    corner radius, navigation density, action hierarchy and state signalling;
    keep recurring traits and drop reference colours, marks, copy, icons and
    exact layouts.
  scope: Reusable interface language only. Pages, routes and forms stay in
    product-local website.md; these references are never rendered or reproduced.
  unresolved_conflict:
    field: Semantic color system - Action and Accent/locator
    observation: Accent fills the primary button in
      singlepage-interface-reference-onboarding-role-form,
      singlepage-interface-reference-pricing-plan-cards,
      singlepage-interface-reference-agency-portfolio-landing,
      singlepage-interface-reference-license-add-to-cart-card and
      singlepage-interface-reference-product-license-selection-card. The same
      card appears with a black primary in
      singlepage-interface-reference-license-download-card and an Accent primary
      in singlepage-interface-reference-license-add-to-cart-card.
    decision_needed: Whether Accent may also fill the one dominant action, or
      remains the locator only. The confirmed color system currently assigns the
      primary control to Action.
---

# Design

## Design intent

### Client visual preference profile

| Family                        | Visual preference                                                                                                                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Interface appearance          | Light neutral surfaces, generous spacing and clear hierarchy; expressive landing headlines, aligned work grids, compact navigation, rounded cards and restrained borders and shadows.                                                       |
| Typography                    | Monospaced body copy with upright serif headings and short italic emphasis; Latin and Cyrillic.                                                                                                                                             |
| Photography                   | Human presence, gestures and movement; natural light, film-like texture, warm skin and varied warm or cool surroundings. Close details and wider views vary; blur, foreground softness, backlight and light trails are optional techniques. |
| Illustration and infographics | Airy isometric drawings, fine defining contours, pale secondary connections, dotted guides and restrained color; composition and detail follow the idea.                                                                                    |
| Marketing visual language     | Expressive human photography, varied viewpoints or spare typographic compositions; short prominent text, thin diagrams, light labels and selective translucent overlays.                                                                    |

Neutral interface fields and the light-green accent connect these families. Photography keeps its natural colors; spacious rhythm keeps expressive imagery and technical detail readable.

### Brand idea and character

**Measured Space** makes a startup feel possible to hold on one page. Spacious light fields, expressive serif headings and orderly monospaced text gather the essential project decisions into one clear composition. A vivid green accent marks the next useful action: complete the page, preview it, publish it or add the next necessary detail.

The same visual grammar connects the compact project page with its landing-page sandbox, repository connection and public site. Product captures show the actual transition; human photography brings the work and the people behind it into view. Sparse diagrams explain how later documents and products extend the original foundation, including how a maker can reuse Code Framework when a concrete software need appears.

### Reusable graphic language

- Use one dominant page or panel as the compositional anchor. Attach supporting cards, products or documents at its edge only when they explain how the project grows. Do not turn the project context into a dense network diagram.
- Use Tailwind `gap-2/4/6/8`, `py-12/16/24`, `max-w-7xl` (`1280px`), `px-4 sm:px-6 lg:px-8`, four/eight/twelve columns at base/`md`/`lg`, and `rounded-md/xl/3xl` for tags, controls, and panels.
- Use a 24px icon grid with 2px strokes. Diagrams explain one relationship at a time; dashed lines denote a proposed connection. Keep conceptual diagrams distinct from actual product captures.
- Presentations use White fields, Paper insets, Ink content, and Accent `#BFEF61` locators. Reserve translucency for small overlays with a solid fallback and verified contrast.
- Use motion only to explain change, within `120–240ms`, with reduced-motion alternatives. Preserve visible focus, semantic structure and text alternatives.

### Do and do not

| Do                                                                                      | Do not                                                                      |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Use one dominant page, one dominant statement and one Accent locator                    | Fill the composition with competing pages or equal emphasis                 |
| Show the progression from project page to sandbox and publication as a few clear states | Explain the product through data pipelines, vector diagrams or dense graphs |
| Show people exchanging ideas, making decisions and doing their work                     | Reduce every business story to a device demonstration                       |
| Use actual product captures to explain an observed result                               | Present generated screens or diagrams as working product evidence           |

## Identity application

### Naming and lockups

- Use the exact **SinglePageStartup** name in lockups. AI Chat and Code Framework are accompanying product names, separate from the mark.
- Preserve the pixel-grid S. The primary lockup pairs it with outlined Cormorant Garamond Bold; avatar and favicon use the mark alone.
- Keep one mark-width clear space. Retain the black or white mark; Accent never recolors it.

## Visual system

### Semantic color system

| Role           | Light     | Dark      | Usage                                                    |
| -------------- | --------- | --------- | -------------------------------------------------------- |
| Canvas         | `#F7F6F2` | `#111111` | Primary field                                            |
| Surface        | `#FFFFFF` | `#1B1B1B` | Cards and bounded panels                                 |
| Text primary   | `#111111` | `#FFFFFF` | Copy and controls                                        |
| Text muted     | `#565656` | `#C9C7C1` | Secondary information                                    |
| Action         | `#111111` | `#FFFFFF` | Primary control with inverse text                        |
| Accent/locator | `#BFEF61` | `#BFEF61` | One locator, selection, or short emphasis; Ink text only |
| Border subtle  | `#CBC9C3` | `#3A3A3A` | Nonessential separation                                  |

Neutrals remain because they support both image families and stable hierarchy. Ink on Accent is `14.15:1`; white on Accent is `1.33:1` and prohibited. Accent is never body text, evidence, status, or the sole carrier of meaning.

### Typography

| Role    | CSS family                    | Weights             | Usage and language coverage                                                        | Font asset ID                                 |
| ------- | ----------------------------- | ------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------- |
| Default | `"JetBrains Mono", monospace` | 400–600             | Body, UI, labels, code; Latin and Cyrillic                                         | `singlepage-font-jetbrains-mono-variable`     |
| Primary | `"Cormorant Garamond", serif` | 500–600; italic 500 | Headings and titles at `24px+`; short italic semantic emphasis; Latin and Cyrillic | `singlepage-font-cormorant-garamond-variable` |

| Step           | Size / line                     | Face    | Use                                          |
| -------------- | ------------------------------- | ------- | -------------------------------------------- |
| Display        | `40/42` mobile, `64/64` desktop | Primary | One dominant page statement                  |
| Section title  | `32/34`                         | Primary | Section heading                              |
| Card title     | `24/28`                         | Primary | Card, panel and list-item title              |
| Document body  | `16/26`                         | Default | Running prose in documents and articles      |
| Interface body | `14/22`                         | Default | Text inside cards, rows, fields and controls |
| Label          | `12/16`                         | Default | Eyebrow, metadata, status and helper text    |

Display and section titles use `-0.02em` tracking. Use sentence case. A monospaced default is wider than a proportional face at the same size, so interface surfaces take the tighter `14/22` step; `16/26` stays with document prose. Supporting interface body takes Text muted so its title leads by size and tone together; on Accent it remains Ink, because Accent carries Ink text only. Browser QA must pass `document.fonts.check(...)` and computed-family inspection.

## Interface and product surfaces

### Purpose and evidence boundary

The interface language applies Measured Space to a working surface: what a person reads first, what they can act on, and what state the system is in. The twelve registered references record confirmed operator preference, not implemented behaviour. A reference establishes that an appearance was liked; it never establishes a validated flow, a shipped screen or a measured result.

The rules below are rendered as working specimens in `design/singlepage/interface-kit.html`, which is plain HTML and Tailwind over the resolved `--workspace-brand-*` tokens. Each specimen prints the exact class recipe it uses. Build a product surface from those recipes rather than from an approximation of this prose, and change the kit and these rules together.

### Surface, density, and shape

- Build every surface from the Canvas field and Surface cards. Separation comes from a change of surface and Border subtle hairlines, not from heavy borders or deep shadows.
- Give one dominant statement generous vertical room, then tighten to aligned grids on work screens without changing the surface language.
- Use rounded-3xl for panels and cards, rounded-xl for grouped rows and fields, and a full pill for controls, chips and status.
- Keep navigation compact and out of the reading path: a floating bar on public pages, an icon rail beside one labelled sidebar on work screens, with account switching at the top and utilities at the bottom.
- Read a group as one object. A single inset surface holds repeated choices, and hairline separators divide data rows inside a card.

### Controls, states, and actions

- Allow one dominant action per view. Every other action stays outlined or plain, and each label names its outcome.
- Fill the dominant action with Action and inverse text. Accent remains the locator, selection and progress signal on Ink text only.
- Make selection explicit and redundant: a filled surface together with a check or a filled radio. Colour alone never carries the state.
- Show progress as Accent on a neutral track. Status uses an outlined pill that names the state in words.
- Separate a destructive action from the action row, tint it distinctly and never give it the dominant fill.
- Keep focus visible on every control, honour reduced motion and label every control that changes a setting.
- Unresolved conflict. Five references fill the primary button with the light-green accent, and two show the same card with a black primary in one variant and a green primary in the other. The confirmed Semantic color system assigns the primary control to Action and limits Accent to one locator. Follow the confirmed roles until the operator decides whether Accent may also fill the dominant action.

### Confirmed reference patterns

| Pattern            | Decision                                                                                                                                                                   | Avoid                                          | Reference asset IDs                                                                                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Editorial entry    | A centred statement over an open field, one supporting paragraph, one filled action beside one plain action, then three explanation cards with the Accent on only one.     | competing headlines, a second filled action    | singlepage-interface-reference-risk-balance-landing, singlepage-interface-reference-conduit-pricing-landing, singlepage-interface-reference-agency-portfolio-landing         |
| Work screen frame  | An icon rail beside one labelled sidebar grouped by area, and a compact header carrying the title, a one-line description and the single dominant action.                  | dense toolbars, a competing second navigation  | singlepage-interface-reference-dashboard-book-grid, singlepage-interface-reference-dashboard-theme-settings                                                                  |
| Repeated item grid | Uniform cards holding a preview, a title, one metadata line and a category pill, with the create-new action occupying the first cell.                                      | mixed card heights, decorative filler          | singlepage-interface-reference-dashboard-book-grid                                                                                                                           |
| Choice group       | One inset surface holding grouped options, the selected row marked by a check while unselected rows stay muted, and each radio row carrying its value at the end.          | colour as the only selection signal            | singlepage-interface-reference-license-download-card, singlepage-interface-reference-product-license-selection-card, singlepage-interface-reference-license-add-to-cart-card |
| Offer comparison   | Aligned summaries of equal width with the recommended one inverted to the dark surface and carrying the single Accent action, and the billing choice above it as a toggle. | more than one emphasised option                | singlepage-interface-reference-pricing-plan-cards, singlepage-interface-reference-conduit-pricing-landing, singlepage-interface-reference-subscription-access-card           |
| Step form          | One question per step with visible progress above it, chips for short answers, large fields for free text, and backward and forward actions separated at the end.          | multi-question steps, hidden progress          | singlepage-interface-reference-onboarding-role-form                                                                                                                          |
| Contextual sheet   | A sheet over dimmed context opening with the subject and its status, then grouped data rows, compact labelled icon actions, and the destructive action set apart below.    | burying the destructive action in the icon row | singlepage-interface-reference-mobile-invoice-bottom-sheet                                                                                                                   |
| Settings section   | A section title with a one-line explanation above repeated choice cards in a grid, an explicit selected state, and single settings as a labelled row carrying its control. | unlabelled controls, implicit state            | singlepage-interface-reference-dashboard-theme-settings                                                                                                                      |

### Review and quality gate

Every cited asset ID must resolve in Assets with an `allowed_use` covering abstraction; no reference is rendered, traced or presented as owned work. Each pattern states this project's own decision rather than describing its reference. Verify contrast, focus visibility and reduced-motion behaviour for every named state against the confirmed Semantic color system.

## Photography

### Purpose and evidence boundary

Photography brings people and their business into view: conversations, concentration, collaboration and work taking shape. Devices can appear when they belong to the scene. These editorial images provide atmosphere rather than customer testimony.

### Style master prompt

> Expressive editorial photography of people, with natural light, tactile color and a film-like feel. Capture presence, gesture and movement rather than posed perfection. Let framing and focus vary; blur, foreground softness, backlight or light trails can add energy when they suit the moment.

### Production specification

Copy the style prompt, add who is in the scene, what is happening and where the image will be used. Attach the relevant original photographs as style references. Choose the format for that use.

### Generation examples

| Example               | Use                        | Content brief                                                                                        | Avoid                   | Asset ID                                                                |
| --------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------- |
| Business conversation | Collaboration              | Two partners exchange an idea at a worktable; gesture, motion and warm light carry the scene         | posed meeting stock     | `singlepage-generated-measured-space-photography-business-conversation` |
| Moment of focus       | Human attention            | An intimate portrait of a business owner considering an idea, through soft foreground reflections    | generic office portrait | `singlepage-generated-measured-space-photography-moment-of-focus`       |
| Work in motion        | Everyday business progress | A business owner passes a prepared order across a worktable; close low viewpoint and bright daylight | staged success claim    | `singlepage-generated-measured-space-photography-work-in-motion`        |

### Review and quality gate

Compare the images directly with their source references for light, color, movement and closeness to people. Review them together at their intended display size: the treatment should connect them while scenes and framing vary. Display each original aspect ratio without cropping; prepare any derivative crop for its actual placement.

## Illustration and diagrams

### Purpose and evidence boundary

The primary journey is shown through a simple sequence: one compact project page, one landing-page sandbox, a repository connection and a public site on the user's server. Use actual interface captures when representing implemented product states; use neutral panels before those states exist.

Illustration supports secondary explanations: reusable functions, a focused product change or human-directed agent work for makers. These conceptual relationships do not represent chat knowledge retrieval, implemented architecture, complete functionality or autonomous authority.

### Core journey composition

- Keep the project page as the stable visual anchor across states.
- Show the landing page as a direct output beside it, using matching headings or content fragments to make the relationship understandable without explanatory technology language.
- Reveal products, research and additional documents progressively around the anchor. They extend the project; they do not replace it or imply that everything must be completed before the sandbox can be reviewed.
- Use Code Framework diagrams only after a concrete site, chatbot or software need appears. Connect the requested product to relevant existing functions and the user's server rather than to a generic local-machine setup.

### Style master prompt

> Create airy isometric line art on warm off-white, using fine black contours, light-gray secondary lines, dotted connections and restrained #BFEF61 details. Keep forms simple, unshaded and open, with generous breathing room and only meaningful connections. Borrow line treatment and spatial lightness from the references; derive the objects from the content brief.

### Production specification

Copy the style prompt and describe the idea or relationship to explain. Name helpful objects, attach the original illustration references and specify the intended use. Take drawing style from the references; choose objects from your brief.

### Generation examples

| Example               | Use                     | Content brief                                                                                                                                                                              | Avoid                | Asset ID                                                                 |
| --------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- | ------------------------------------------------------------------------ |
| Module hierarchy      | Reusable foundation     | Show reusable software modules joined to a common code foundation, using simple component blocks. Make the shared base and the modules’ relationship clear.                                | completeness claim   | `singlepage-generated-measured-space-illustration-module-hierarchy`      |
| Framework inheritance | Product adaptation      | Show a software framework reused by a new product, with a visibly changed module and a preserved common foundation. Use simple software blocks and connections.                            | verified merge claim | `singlepage-generated-measured-space-illustration-framework-inheritance` |
| Coordinated agents    | Maker task coordination | Show a person directing AI coding assistants toward a shared software task. Represent assistants as software panels and tool symbols, with the person clearly guiding their contributions. | autonomous authority | `singlepage-generated-measured-space-illustration-coordinated-agents`    |

### Review and quality gate

Compare linework, secondary detail, color and contrast with the source references at source and display size. Keep the warm off-white background and unchanged original PNG masters. Reject processing that loses lines or detail. Preserve the original aspect ratio.

## Outputs and provenance

Reusable outputs are the registered primary lockup, avatar, favicon and the six masters named above. Exact prompts, hashes, rights and lifecycle remain in Assets. The font pairing and favicon retain their existing approvals; the lockup, avatar and media remain proposed.

The six media masters remain compatible with the revised Brand and do not require regeneration. Photography supports the human work; the three current illustrations support the later Code Framework story. Product applications must compose the primary one-page journey from real interface captures or neutral panels, because the current media masters do not depict that journey by themselves.
