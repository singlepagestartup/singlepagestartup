---
confirmation:
  confirmed: false
proposal_id: living-focus
review:
  dependencies:
    asset-index: eb4181781ae7407c2581216acc813b1c3786cac2ba4e294eff978c7648fbf15f
    brand: 8dbe5a27b000710a03ca504b7a56040516cfdb9b54be0a95d910ee4506361590
    brief: 1636c06e5e68d369527a3efb1939e956cd3c559b1a9672b19f7df047fbb6a960
scoped_confirmations:
  preference_profile:
    confirmed: true
    by: operator
    at: 2026-10-03
    source: Operator selected the second Living Focus concept, rejected JetBrains and requested the
      complete system rollout in chat, 2026-10-03.
    scope: Confirms the selected Living Focus visual territory and the revised typography preference.
      Unchanged photography, illustration and reference-family input remains attributable to the
      earlier category confirmations; final system details require rendered review.
  selected_elements:
    confirmed: true
    by: operator
    at: 2026-10-03
    source: Operator selected the second Living Focus concept, rejected JetBrains and requested the
      complete system rollout in chat, 2026-10-03.
    scope: "Use Onest for all visible typography, preserving the supplied pixel-grid S and #BFEF61. The
      direction selection does not confirm the completed Design or each new generated asset."
  illustration_background:
    confirmed: true
    by: operator
    at: 2026-10-04
    source: Operator rejects warm, yellow and cream design backgrounds in chat, 2026-10-04; this
      supersedes the earlier illustration-background scope.
    scope: "Illustrations use a flat pure white background (#FFFFFF); surrounding design surfaces use
      cool gray or white. Preserve graphite, Onest and #BFEF61. This confirms the input constraint
      only, not new image outputs or the complete Design."
  image_production_workflow:
    confirmed: true
    by: operator
    at: 2026-10-04
    source: "Operator correction in chat: generate images in proportions suited to their composition and
      quality, then prepare square versions with a separate tool while preserving originals."
    scope: Confirms the separate original-generation and square-adaptation workflow. It does not approve
      a particular derivative or replacement icon library.
  visual_component_corrections:
    confirmed: true
    by: operator
    at: 2026-10-04
    source: "Brief intake.visual_component_corrections; Operator response after the seven
      browser-comment corrections were implemented: «Да, отлично, то, что надо», followed by the
      request for a complete framework Interface kit."
    scope: Confirms the Material type chips and Starting point choices with neutral tracks, white
      selected options and small lime checks; the neutral graphite-gray Needs review badge; the
      Create project tile filling its grid cell in width and row height; and cool-white bitmap
      backgrounds in Illustration and text, the Coffee and Creative project previews, and the entire
      Illustration gallery. Includes the rule excluding warm yellow and cream backgrounds. This
      confirms these seven visual corrections only, not the whole Brief, complete Design or pending
      business decisions.
sources:
  visual_profile:
    classification: supplied-material-observation
    source: apps/studio/workspace/brief/singlepage.md#visual-reference-intake
    source_keys:
      - visual_references
      - sources.visual_preferences
    inspected_files: 37
    photography_files: 7
    distinct_photographic_compositions: 6
    summary: All 37 categorized reference files were inspected directly. The selected direction uses
      clean proportional text, cool neutral surfaces, lime main actions and candid human
      photography; the light isometric illustration family remains secondary.
    interpretation_status: confirmed
  meaning_translation:
    classification: assumption
    resolution: professional-choice
    source: apps/studio/workspace/brand/singlepage.md
    sections:
      - Intended perception
      - Meaning and message hierarchy
      - Consistency rules
    supports: One compact project page becoming a private landing-page preview, then a GitHub repository
      and a public site on the user's server; people remain visible in the work, while reusable
      foundations and human-directed agent work support later product needs.
    limitation: Editorial images, interface compositions and conceptual diagrams do not prove provider
      integration, deployment speed, market response, useful answers, adoption, implemented
      architecture or successful setup.
  operator_direction:
    classification: constraint
    source: Operator selected the second Living Focus concept, rejected JetBrains and requested the
      complete system rollout in chat, 2026-10-03.
    scope: Living Focus replaces the paper-like concept; JetBrains and the serif heading system are
      excluded from current typography.
    rejection: The operator rejected visual proposal measured-space.
  icon_direction:
    classification: constraint
    source: Operator correction of the current rough and dated icons in chat, 2026-10-04.
    scope: Icons need a neat, contemporary appearance. A different library or original icons are
      permitted; Phosphor Regular is a professional proposal, not an operator-confirmed library.
  image_production_rule:
    classification: constraint
    source: Operator request for a mandatory Icons block and free-proportion generation followed by
      square enlargement, clarified as canvas outpainting in chat, 2026-10-04.
    scope: For future photography and illustration outputs, preserve the entire original frame and
      extend the shorter canvas dimension to 1:1 through outpainting. Cropping and stretching are
      excluded. Existing reviewed outputs remain unchanged.
  background_direction:
    classification: constraint
    source: Operator correction in chat, 2026-10-04; recorded in Brief visual preferences.
    scope: Remove warm, yellow and cream design backgrounds. Illustration backgrounds are flat pure
      white; interface surfaces are cool neutral. Preserve the selected lime accent, graphite and
      typography.
  interface_kit:
    classification: constraint
    source: Brief sources.interface_kit; operator request in chat, 2026-10-04.
    scope: A categorized framework catalogue covers common UI components with working variants and
      states. Shared semantic tokens support downstream restyling; content blocks compose those
      components. The expanded kit remains proposed.
media_review:
  source: Generation-agent and coordinator inspection of all three Living Focus originals, 2026-10-03;
    this is visual QA, not operator approval.
  photography:
    status: proposed
    asset_ids:
      - singlepage-generated-living-focus-photography-business-conversation-square
      - singlepage-generated-living-focus-photography-moment-of-focus-square
      - singlepage-generated-living-focus-photography-work-in-motion-square
    reference_fit: Cool daylight and warm natural skin connect the set. Conversation gesture, reflective
      stillness and a physical order handover remain distinct; subjects, gestures, scene props and
      full framing are plausible.
    prompt_verification:
      status: visually-verified
      style_master_sha256: 9425ac405b2e6979438a4f25a5c23823c9b2e768f0f3bfe594905aa28db64dae
      method: Three separate generation calls used the exact master and distinct scene briefs, each with
        the selected direction board and named original photography inputs. Originals inspected
        together for shared treatment and scene plausibility.
      scope: The original-generation master remains unchanged and was tested on the three source scenes.
        Square adaptation is a separate production step with exact per-derivative instructions and
        source links in Assets.
    display: Use the separately prepared square derivatives in Design examples and product compositions.
      Preserve free-format original masters as production sources; no automatic cover crop or
      stretch substitutes for square adaptation.
    browser_review:
      status: visually-verified
      source: Coordinator browser inspection of the complete default Design projection and affected
        product compositions, 2026-10-04.
      checks:
        - All three Photography examples load the registered square derivatives at a natural size of
          1254 by 1254 and render as equal squares at approximately 445px.
        - The three Photo cards render at approximately 269px square with equal card heights; all
          images also load as squares at viewport widths of 320px and 414px.
        - The overview hero renders at approximately 494px square, aligned with the graphite panel
          without an empty field.
        - The Code Framework hero renders at 592px square. Photographs in its ten presentation
          slides retain a 1:1 ratio and all slide footers remain clear.
      scope: Visual and responsive checks of the prepared derivatives in the reviewed surfaces; this is
        agent QA, not operator approval or evidence of actual customers or delivered work.
    source_master_asset_ids:
      - singlepage-generated-living-focus-photography-business-conversation
      - singlepage-generated-living-focus-photography-moment-of-focus
      - singlepage-generated-living-focus-photography-work-in-motion
    square_adaptation_review:
      status: visually-verified
      source: Production-agent source comparison and coordinator source and browser review, 2026-10-04.
      checks:
        - The conversation derivative preserves both people, the face and complete expressive hand;
          the work derivative preserves the face, full box and meaningful handover.
        - The already-square moment-of-focus derivative is byte-identical to its original. All three
          original master hashes remain unchanged.
        - The three 1254 by 1254 derivatives retain the shared lighting, natural skin, photographic
          detail and distinct scene compositions at source, layout and small-preview sizes.
        - Prepared squares render consistently without stretching or an additional composition crop
          in the inspected Design and product surfaces.
      scope: The square adaptation is reviewed separately from the unchanged original-generation master;
        each exact adaptation instruction and source link remains in Assets.
  illustration:
    status: proposed
    source: Scoped background correction, 2026-10-04; the current illustration master applies to three
      edits of preserved source compositions.
    asset_ids:
      - singlepage-generated-living-focus-illustration-module-hierarchy-cool-square
      - singlepage-generated-living-focus-illustration-framework-inheritance-cool-square
      - singlepage-generated-living-focus-illustration-coordinated-agents-cool-square
    source_master_asset_ids:
      - singlepage-generated-living-focus-illustration-module-hierarchy
      - singlepage-generated-living-focus-illustration-framework-inheritance
      - singlepage-generated-living-focus-illustration-coordinated-agents
    prompt_verification:
      status: visually-verified
      style_master_sha256: a9c8132263edfe1282919ba2260326fe4c08eb6048fd662cc3acd5610172e7b2
      method: Three independent image_gen.imagegen edits used the exact current master, the same
        color-correction instruction and a distinct scene-preservation brief, each with its
        registered source master. Exact prompts and references are verified in Assets. Source
        inspection and the three rendered Design examples were compared for consistent treatment and
        preserved relationships.
      scope: Tests the master as an edit instruction on these three compositions; it does not establish
        output approval or performance on unrelated scenes.
    display: Prepared square illustration derivatives on flat pure white. Original source masters remain
      registered for edit provenance and are excluded from active delivery roles.
    source_review:
      status: visually-verified
      source: Production-agent and coordinator comparison of all three source masters and derivatives,
        2026-10-04.
      checks:
        - All three outputs are native 1254 by 1254 squares; original master hashes remain unchanged.
        - Defining contours, secondary dotted connections, lime detail and complete object
          arrangements remain legible; the warm cast is removed.
      background_limit: "The target is #FFFFFF. Outputs appear white with minor sampled background-channel
        variations from 253 to 255, so this review does not claim a uniform RGB 255,255,255 field.
        No pixel normalization was applied."
      scope: Source-image comparison of all three compositions. Browser and small-preview checks are
        recorded separately below.
    browser_review:
      status: visually-verified
      source: Coordinator browser inspection of the complete default Design projection, 2026-10-04.
      checks:
        - All three built-in illustration examples load the registered cool-square files at native
          1254 by 1254 and render at approximately 590.5px square on desktop.
        - The illustration catalogue, Illustration and text specimen and repeated-item cards show
          white backgrounds with legible contours and complete framing.
        - At a 320px viewport the document scrollWidth is 320px; repeated-grid images render at
          approximately 208.66px square without overflow.
      scope: Design surfaces only. This review does not certify product placements or operator approval of
        the images.
  production_policy:
    effective_at: 2026-10-04
    scope: Applies to future outputs and their square delivery preparation; it does not rewrite past
      prompts, processing methods or visual reviews.
    current_examples: The two existing non-square photography adaptations permitted reframing in their
      recorded prompts and are not verified examples of strict full-frame outpainting. Their
      reviewed outputs remain in use. The already-square photograph needs no canvas extension. The
      illustration sources are square; the separate background edits preserve square delivery.
    delivery_resolution: Current square files are 1254 by 1254. This is a delivery size, not evidence of
      greater image quality.
interface_review:
  status: proposed
  source: Direct inspection of all twelve supplied interface references and the selected Living Focus
    board, 2026-10-03.
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
  method: Apply clean neutral working surfaces, plain sans-serif hierarchy, explicit states, rounded
    geometry and one lime dominant action. Preserve canonical specimen names and test rendered
    recipes.
  scope: Reusable components, their interaction contracts and visual language. Product copy, pages,
    routes and product-specific behavior remain product-local.
  browser_review:
    status: visually-verified
    source: Coordinator browser inspection of the default Design projection, 2026-10-04.
    checks:
      - Replacement Phosphor icons use consistent native geometry at 20px and 24px in the specimens;
        icon cards and the eight-glyph preview have aligned optical sizes.
      - Selecting Notes and pressing ArrowRight moves the native selected state and visible focus to
        Documents.
      - At viewport widths of 320px and 414px, document scrollWidth equals clientWidth; all three
        square Photo cards load and remain square.
    scope: Rendered icon, media, responsive and selection checks. The previous Onest loading
      verification remains recorded separately.
  cool_surface_revision:
    status: visually-verified
    source: Coordinator browser inspection of the default Design specimens, 2026-10-04.
    checks:
      - Desktop Selection segments each measure approximately 185.33px wide and choice cards
        557.26px. Widths remain stable after ArrowRight; both native radio groups switch selection
        and visible focus correctly.
      - The Needs review badge uses background RGB 244,246,248, text RGB 24,35,42 and border RGB
        220,226,230. It has no amber background.
      - All three desktop repeated-grid items, including New project, measure 367.5 by 463.5px and
        stretch to the grid cell.
      - At a 320px viewport the choice groups do not overflow. New project fills the 210px grid
        column with a 256px minimum height; document scrollWidth equals its 320px clientWidth.
    scope: Scoped Design control, badge and grid checks; existing typography, icon and photography
      reviews remain unchanged.
  error_and_attachments_review:
    status: visually-verified
    source: Agent source and browser inspection of Feedback and Conversation, 2026-10-04.
    checks:
      - The failed empty-state panel uses danger #B42338, danger-surface #FFF1F3 and danger-line #E9B4BD; its retry action uses the same palette.
      - Composer accepts multiple local files, shows metadata through the shared FileRow and supports removing files before send. Duplicate selections do not add another row.
      - Files can be sent with or without message text. Sent attachment metadata remains visible after a simulated error, retry and stop; the draft selection clears on send.
      - Files above 10 MB show a red validation message and are excluded. The demo reads file metadata only and does not upload or retain file contents.
      - At 320px attachment rows stay within the viewport and document scrollWidth equals clientWidth.
    scope: Scoped palette and composer interaction checks; complete Design confirmation remains unchanged.
  indicator_and_image_review:
    status: visually-verified
    source: Agent source and browser inspection of the four annotated details, 2026-10-04.
    checks:
      - Ready uses a centred 14px Phosphor check inside a 20px circle; choice cards use a 16px check inside a 24px circle.
      - The shared checkbox renders a 14px Phosphor check inside a 20px control throughout the kit, including tables, settings and conversation preferences.
      - Checkbox Space, label clicks and master selection work. Mixed selection displays its bar and hides the check; disabled controls retain their disabled state.
      - The editorial photograph uses object-cover and fills its frame. Its height equals the statement panel on desktop and tablet; the mobile frame remains square.
      - At 320px document scrollWidth equals clientWidth. No application console errors were observed.
    scope: Scoped visual corrections and local interactions; complete Design confirmation remains unchanged.
  picker_geometry_review:
    status: visually-verified
    source: Agent browser inspection of the default Design Inputs projection, 2026-10-04.
    reference: https://ui.shadcn.com/docs/components/radix/select
    checks:
      - Select and combobox fields use 48px height, 14px text, a 20px Phosphor caret and a soft focus ring.
      - Select uses the shadcn Radix composition with a portalled, rounded popup, padded rows and a selected check. The Data display status filter uses the same Select component.
      - Arrow keys and Enter select a value. End skips the disabled option. Escape closes the popup and restores trigger focus; the disabled select remains disabled. The Data display status filter selects Ready.
      - At 320px the controls remain 48px tall, and document scrollWidth equals clientWidth. No application console errors were observed.
    scope: Rendered picker geometry and local interactions; complete Design confirmation remains unchanged.
  catalog_revision:
    status: visually-verified
    source: Coordinator source inspection and browser review of the complete default Design projection,
      2026-10-04.
    catalogue: tools/studio/design/specimens.ts
    kit_specimens: 33
    composition_specimens: 8
    category_panels: 12
    groups:
      - Icons and theme
      - Actions
      - Inputs
      - Navigation
      - Data display
      - Feedback
      - Overlays
      - Files
      - Conversation
    checks:
      - The default DOM contains 41 unique specimens across nine component and three composition
        groups. Surface, SquareImage, Button and Icon are shared by their declared consumers.
      - At desktop and 320px and 414px Storybook viewports, every category keeps document
        scrollWidth equal to clientWidth. The table scrolls inside its own bounded region.
      - Mobile category selection uses a native select. Desktop navigation preserves category state
        and its hash; Show all exposes the complete catalogue.
      - Required-field validation shows an error and moves focus to the field. Combobox search
        selects Creative with Enter; the Project table filter returns two results; ArrowRight
        changes the Radix tab to Activity.
      - The dialog shows its empty-value error, disables Save, and returns focus to the Edit trigger
        after Escape. Its white portal uses Onest; at a 320px viewport the dialog is 288px wide with
        16px side margins.
      - A real local text file produces file metadata and an invalid extension is rejected. The
        conversation demonstration retries a failed response and retains partial text after send
        then stop.
      - The command palette selects Create with Enter. Saving produces a toast whose Undo action
        works.
      - The downloaded HTML export contains all 41 specimens and 12 category panels, with none
        hidden and no export controls.
    reduced_motion:
      status: source-checked
      scope: Transition and animation alternatives are explicitly present in classes. Browser emulation of
        the reduced-motion preference was not performed.
    console_review: No application console errors were observed. One Storybook-owned ARIA-property
      deprecation warning remained.
    scope: Agent QA covers the rendered catalogue and the interactions listed here, including local
      demonstrations rather than live product integrations. The seven earlier visual corrections
      retain their scoped acceptance; the expanded kit and complete Design remain unconfirmed.
typography_review:
  status: visually-verified
  source: Coordinator browser inspection of the complete default Design projection, 2026-10-03.
  font_asset_id: singlepage-font-onest-variable
  checks:
    - document.fonts.check passed for Onest 400 with Latin text and Onest 600 with Cyrillic text.
    - Rendered heading and input computed font families resolve to Onest; the local font file loaded.
  scope: Confirms loaded typography in the inspected browser; it does not confirm the complete Design
    document.
iconography_review:
  status: proposed
  source: Brand Designer and specimen owner selection of the official Phosphor Regular set for review,
    2026-10-04.
  library: Phosphor Icons Regular
  source_grid: 256
  canonical_weight: 16
  display_sizes:
    - 20
    - 24
  browser_review:
    status: visually-verified
    source: Coordinator browser review of the default Design specimens and affected Code Framework and
      AI Chat compositions, 2026-10-04.
    checks:
      - The 42 specimen SVG instances use the official Phosphor geometry with consistent 20px or
        24px display sizes; the preview and explanatory cards retain clear alignment and contrast.
      - GuidedCards uses 20px decorative icons with aria-hidden; Accept and continue updates its
        step and completed checks.
      - WorkspaceMap uses 20px directional arrows that change between down and right with the
        responsive layout; the final presentation-slide arrow renders correctly.
    scope: Confirms the inspected implementation. Phosphor Regular remains a professional proposal; no
      operator library approval is recorded.
  library_version: 2.1.1
  license_asset_id: singlepage-phosphor-icons-mit-license
  required_specimen:
    id: icons
    title: Icons
    browser_review: visually-verified
    source: Coordinator browser inspection of the separate Icons gallery in the default Design
      projection, 2026-10-04.
    checks:
      - A separate Icons heading appears at the beginning of Interface kit; eight glyphs each appear
        at 20px and 24px, for sixteen SVG instances.
      - Source and local MIT license links are present and match the registered files.
      - Desktop and 320px viewport specimens retain exact 20px and 24px sizes. At 320px the gallery
        uses two columns, text wraps and document scrollWidth equals clientWidth.
    scope: Visual QA of the dedicated gallery only; existing icon implementation reviews and all
      confirmation states remain unchanged.
---

# Design

## Design intent

### Client visual preference profile

| Family                        | Visual preference                                                                                                                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Interface appearance          | Cool light fields, white working cards, graphite contrast, generous introductions and compact work grids. Rounded controls, restrained borders, clear selection and lime main actions.        |
| Typography                    | Onest throughout: direct upright headings, readable proportional text, plain labels and Latin plus Cyrillic coverage. Hierarchy comes from size, weight and spacing.                          |
| Photography                   | People engaged in their work, close framing, gestures and a clear point of attention. Cool blue or teal daylight balances warm skin; soft depth and occasional motion keep the scene natural. |
| Illustration and infographics | Airy isometric drawings with fine graphite contours, cool secondary connections and restrained lime detail on flat pure white. Preserve full framing.                                         |
| Marketing visual language     | Large human photographs, short prominent text and compact contextual labels. A small translucent overlay may sit on a photograph when its contrast remains readable.                          |

The twelve interface references support neutral work surfaces, explicit states and rounded controls. The photography and marketing sets supply movement, proximity and color. The selected Living Focus direction uses those traits with one proportional type family; the two typography references remain evidence of expressive hierarchy rather than a requirement for serif or monospaced text.

### Brand idea and character

**Living Focus** brings people and their work into a clear digital workspace. Close, candid photography carries movement and attention; cool white surfaces and graphite panels give decisions room to stand out. Direct Onest typography keeps the interface readable, while lime marks the next useful action and the current selection.

The same visual language connects supplied materials, the reviewed project model, a landing-page sandbox and publication on the user's server. Photography shows human work; interface captures explain observed product states. Sparse diagrams support later explanations of software reuse and human-directed agent work.

### Reusable graphic language

- Pair a large human image with a clear statement or a focused working panel. Give imagery and information distinct areas, with overlap only when the relationship stays readable.
- Use Tailwind `max-w-7xl` (`1280px`), `px-4 sm:px-6 lg:px-8` (`16/24/32px`), `gap-2/4/6/8` (`8/16/24/32px`) and `py-12/16/24` (`48/64/96px`). Use four columns at base, eight at `md` (`768px`) and twelve at `lg` (`1024px`).
- Use `rounded-xl` (`12px`) for controls and grouped rows, `rounded-2xl` (`16px`) for cards, `rounded-3xl` (`24px`) for large panels and `rounded-full` for chips. Keep one clear edge between nested surfaces.
- Use the proposed Phosphor Regular icons at `size-5` (`20px`) or `size-6` (`24px`), preserving their native geometry and weight. Diagrams explain one relationship; dashed connections denote a proposal. Use small contextual labels with ordinary sentence case and normal tracking.
- Use graphite for a strong text or image-adjacent field, white for active work and lime for a dominant action or selection. Translucent labels need a readable solid fallback; photography retains its natural colors.
- Motion explains a state change within `120–240ms`. Preserve visible focus, text alternatives and semantic structure, and honour reduced-motion preferences.

### Do and do not

| Do                                                             | Do not                                                                             |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Give one photograph, statement or working panel clear priority | Give every card equal visual emphasis                                              |
| Use upright Onest and calm spacing throughout                  | Introduce serif headings, typewriter labels, paper textures or decorative tracking |
| Show people considering, discussing and doing their work       | Turn every scene into a device demonstration                                       |
| Use lime with graphite text for the next useful action         | Put white text on lime or signal a state through color alone                       |
| Show actual product captures for an observed result            | Present generated screens or conceptual diagrams as working product evidence       |

## Identity application

### Naming and lockups

- Use the exact **SinglePageStartup** spelling. AI Chat and Code Framework are accompanying product names, separate from the mark.
- Preserve the supplied pixel-grid S geometry and its black or white treatment. The primary lockup pairs it with an outlined Onest wordmark at weight 650; avatar and favicon retain the mark alone.
- Keep clear space around the complete lockup and never crop the name. Use the mark alone when the full name cannot stay legible. Lime does not recolor the supplied mark.

## Visual system

### Semantic color system

| Role             | Light     | Dark      | Usage                                                      |
| ---------------- | --------- | --------- | ---------------------------------------------------------- |
| Canvas           | `#F4F6F8` | `#18232A` | Primary field                                              |
| Surface          | `#FFFFFF` | `#24323B` | Working cards and bounded panels                           |
| Text primary     | `#18232A` | `#FFFFFF` | Main copy and control labels                               |
| Text muted       | `#5B6870` | `#C4CDD3` | Secondary information                                      |
| Primary          | `#18232A` | `#18232A` | Graphite brand field; inverse content is white             |
| On primary       | `#FFFFFF` | `#FFFFFF` | Text and icons on the strong brand field                   |
| Muted on primary | `#C4CDD3` | `#C4CDD3` | Secondary text on the strong brand field                   |
| Accent/locator   | `#BFEF61` | `#BFEF61` | Dominant action, selection and progress with graphite text |
| Border subtle    | `#DCE2E6` | `#44525C` | Nonessential separation                                    |
| On accent        | `#18232A` | `#18232A` | Text and icons on lime                                     |
| Danger           | `#B42338` | `#B42338` | Error and destructive labels on white or Danger surface    |
| Danger surface   | `#FFF1F3` | `#FFF1F3` | Bounded error or destructive control surface               |
| Danger line      | `#E9B4BD` | `#E9B4BD` | Decorative separation within Danger surface                |
| Focus            | `#18232A` | `#FFFFFF` | Visible focus on light or graphite surfaces                |

Graphite on lime is `11.99:1`; white on lime is `1.33:1` and must not be used. Muted text is `5.74:1` on white and `5.30:1` on Canvas. White on graphite is `16.00:1`, and dark-mode muted text on graphite is `9.92:1`. Borders are decorative separation, so essential field boundaries and focus use a stronger graphite or inverse outline. Status always includes a word or icon. Danger text is `6.49:1` on white and `5.91:1` on Danger surface. Danger line is decorative; an invalid field boundary and its focus indicator use the stronger Danger foreground.

The `--workspace-brand-primary` token stays graphite for brand fields and inverse panels. Pair it with `--workspace-brand-on-primary` for text and icons, and `--workspace-brand-muted-on-primary` for secondary copy. The dominant control uses `--workspace-brand-accent` with graphite text in both modes. Illustration backgrounds use flat pure white (`#FFFFFF`); interface surfaces use the cool neutral palette. Warm, yellow and cream backgrounds are excluded. Review status uses a neutral cool badge with an explicit label.

### Typography

| Role    | CSS family            | Weights                             | Usage and language coverage                                      | Font asset ID                    |
| ------- | --------------------- | ----------------------------------- | ---------------------------------------------------------------- | -------------------------------- |
| Default | `"Onest", sans-serif` | 400–600; variable 100–900 available | Body, UI, labels, numbers and code specimens; Latin and Cyrillic | `singlepage-font-onest-variable` |
| Primary | `"Onest", sans-serif` | 600–700                             | Headings, titles and wordmark; Latin and Cyrillic                | `singlepage-font-onest-variable` |

| Step           | Size / line                                             | Face    | Use                                          |
| -------------- | ------------------------------------------------------- | ------- | -------------------------------------------- |
| Display        | `36/40` mobile, `60/60` desktop; `text-4xl md:text-6xl` | Primary | One dominant statement                       |
| Section title  | `30/36`; `text-3xl`                                     | Primary | Section heading                              |
| Card title     | `24/28`; `text-2xl leading-7`                           | Primary | Card, panel and list-item title              |
| Document body  | `16/26`; `text-base leading-[26px]`                     | Default | Running prose and supporting paragraphs      |
| Interface body | `14/22`; `text-sm leading-[22px]`                       | Default | Text inside cards, rows, fields and controls |
| Label          | `12/16`; `text-xs`                                      | Default | Metadata, status and helper text             |

Use sentence case and normal tracking. Display text may use `tracking-tight`; labels do not. Use upright weights, and create emphasis through weight or color. Supporting copy uses Text muted, except on lime where it remains graphite. Browser QA checks `document.fonts.check(...)` and the computed family of both a rendered heading and body text; a fallback does not count as Onest.

## Iconography

Use the proposed Phosphor Icons Regular set from `@phosphor-icons/core` version `2.1.1` consistently across navigation, actions and explanatory cards. The set is distributed under MIT; its registered license is `singlepage-phosphor-icons-mit-license`. The official SVGs use a 256-unit viewBox and a 16-unit canonical regular weight, equivalent to 1.5px at 24px. Preserve their paths and proportions; scale complete glyphs to `size-5` (`20px`) in compact rows or `size-6` (`24px`) in feature cards and spacious controls. Do not mix families, redraw strokes or substitute text arrows and improvised symbols.

Use `currentColor` with the surrounding semantic foreground, graphite on lime and white on graphite. Align icons optically with adjacent text and keep the same size within a peer group. A visible label names each action; icon-only controls require an accessible name, while decorative SVGs stay hidden from assistive technology. Retain the registered MIT license with redistributed icons. The selected library remains a proposal for visual review.

Show a separate, mandatory **Icons** specimen with `data-specimen="icons"` in the Design review. Its labelled gallery displays representative navigation, action and status glyphs at `20px` and `24px`, with their names, size and color recipes. Show the actual licensed SVGs on light, graphite and lime surfaces so alignment, weight and contrast can be compared. Icon cards elsewhere do not replace this dedicated specimen.

## Interface and product surfaces

### Purpose and evidence boundary

Living Focus gives each working surface a clear reading order, an explicit state and a visible next action. The supplied references establish appearance preferences; they do not validate product behavior or customer outcomes.

The Interface kit contains reusable controls, navigation, data displays and interaction states. Content blocks combine those components into editorial, card and conversion compositions. Their working demonstrations establish the component contract; product routes, business data and product-specific behavior remain product-local.

### Catalogue and source ownership

The canonical catalogue is `tools/studio/design/specimens.ts`: 33 kit specimens across Icons and theme, Actions, Inputs, Navigation, Data display, Feedback, Overlays, Files and Conversation, plus eight composition specimens. It owns IDs, titles, group assignment and required coverage. Keep that catalogue as the component inventory rather than duplicating its list here.

The layer-owned implementations are `design/singlepage/interface-kit/{Foundations,Actions,Inputs,Navigation,DataDisplay,Feedback,Overlays,Files,Conversation}.tsx`. Their shared `primitives.tsx` supplies Button, Icon, Surface, SquareImage, Specimen and the shared class recipes. `design/singlepage/content-blocks/{Editorial,Cards,Conversion}.tsx` composes the same helpers. `layout.yaml` declares the groups and child sources; each visible specimen retains its canonical `data-specimen` ID and displays its applicable states, usage and exact class recipe.

The Data display group includes **Surfaces and media**: reusable surfaces, square media and dividers. Surface supplies the card treatment; SquareImage preserves a reviewed image’s square proportions and text alternative. Compositions reuse those primitives and declare their actual dependencies rather than borrowing an unrelated component ID.

A component owns its input, selection, disclosure or feedback behavior. A composition owns the arrangement and content hierarchy of components, with its dependencies declared in the catalogue. Fix a shared component or token once, then check its consuming compositions. A page-specific task or business rule belongs in the product implementation.

### Downstream restyling

A downstream project maps these semantic roles to its own colors and type in `styles/startup.css`; an empty startup layer inherits them. Keep token names, catalogue IDs, semantics, keyboard behavior and accessible labels stable. Change values and approved geometry within the owning layer, then verify every consuming component and composition.

| Token suffix after `--workspace-brand-`   | Contract                                                                      |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| `background`, `surface`, `line`           | Canvas, working surface and decorative separation                             |
| `foreground`, `muted`, `primary`          | Main text, readable secondary text and strong brand field                     |
| `on-primary`, `muted-on-primary`          | Main and secondary foregrounds on the strong brand field                      |
| `accent`, `on-accent`                     | Dominant action or selection and its contrasting text/icon color              |
| `danger`, `danger-surface`, `danger-line` | Error/destructive foreground, bounded surface and decorative border           |
| `focus`, `focus-inverse`                  | Visible keyboard outline on light and dark surfaces                           |
| `font-body`, `font-display`               | Registered reading and display families with the required scripts and weights |

Restyle through semantic roles rather than adding literal colors to individual examples. A type change updates the role table, registered font and stylesheet together. A density or shape change updates shared helper recipes and this scale together; downstream work uses its own source layer and leaves the inherited framework files intact.

### Surface, density, and shape

- Set white work cards against the cool Canvas. Separate groups through spacing, subtle hairlines and a restrained surface change.
- Keep introductions spacious and working grids compact. Use the same type roles and palette in both.
- Use the named radius scale consistently; a contextual sheet may use the large-panel radius while its fields use the control radius.
- Keep navigation compact, with one labelled reading path and utilities separated from the main work.
- Group related choices in one cool inset region with shared geometry. Segmented choices and choice cards use the same surface family, clear selected treatment and visible focus. Divide repeated data rows with hairlines; photography must not compete with editable information.
- Make a create tile fill its repeated-grid cell in width and height, with the whole tile acting as the labelled interactive target.

| Element               | Minimum size and spacing                                              | Shape and type                                        |
| --------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Button or icon action | `min-h-11` (44px), `px-5 py-2`; icon-only targets also `min-w-11`     | `rounded-xl`, `text-sm`; glyphs retain 20/24px        |
| Text input or select  | `min-h-12` (48px), `px-4 py-2`, full available width                  | `rounded-xl`, `text-base`                             |
| Grouped choices       | `gap-2` (8px), equal peer sizing, labelled targets at least 44px high | Shared `rounded-xl` track and explicit selected state |
| Card or specimen      | `p-5` (20px); specimen review may use `sm:p-6 md:p-8` (24/32px)       | `rounded-2xl`, existing title/body steps              |

Use `gap-2/4/6/8` for increasing separation and the existing radius scale for larger panels and chips. Compact layouts reduce surrounding spacing before shrinking targets or reading text. Controls expand vertically for wrapped labels; narrow layouts stack peers when equal-width rows cannot hold their content.

### Controls, states, and actions

- Give each view one dominant action, filled lime with graphite text. Secondary actions are outlined or plain; labels name their outcome.
- Pair a selected surface with a check, radio or explicit label. Keep hover, selected, disabled and focus states distinct.
- Show progress with lime on a neutral track and give the current stage a text label. Status pills name the state.
- Separate destructive actions from ordinary actions and use a distinct semantic treatment.
- Use visible keyboard focus, labelled controls and reduced-motion alternatives. Do not rely on subtle borders for focus or required-state information.

### Component state contract

Every specimen declares and demonstrates the states that apply to it. Controls cover default, hover, active, focus-visible and disabled; stateful components also cover their selected, checked, expanded, loading, invalid, empty or completed states. An omitted state needs a component-specific reason in its usage notes. Preserve labels and geometry when a state changes, and pair color changes with text, icons or native checked/expanded state.

Use semantic controls and stable accessible names. Tab moves between controls; Enter and Space activate the appropriate native action; arrow keys move within radio, tab or menu patterns. Keep a visible 2px focus outline with a 2px offset, using Focus inverse on graphite. Touch targets are at least 44px in each interactive dimension. Tooltips supplement visible or accessible labels and work through focus as well as hover.

Forms keep labels visible, associate helper and error text with each field, and expose invalid state programmatically. Retain the entered value and focus after validation; state what needs correction beside the field. Use readonly for inspectable fixed values and disabled for unavailable actions. Pending actions keep their label, prevent duplicate activation and expose progress without replacing the whole page.

Dialogs and drawers have a name, a predictable initial focus, Escape/dismiss behavior and focus return to the trigger. Modal surfaces contain keyboard focus; menus and popovers preserve their own navigation and dismissal contract. Feedback stays visible long enough to read, and background updates do not steal focus.

Check long labels, filenames, translated text, empty content and error copy at narrow widths. Wrap meaningful text; use truncation only where the full value remains available. Keep data-table overflow within its own region. Motion uses the existing 120–240ms range and `motion-reduce` alternatives; loading and state meaning remain visible when animation is off.

### Confirmed reference patterns

| Pattern            | Decision                                                                                                                 | Avoid                                             | Reference asset IDs                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Editorial entry    | One direct statement, short supporting copy and a lime action, paired with a substantial human image or a focused panel. | Competing headlines or an ornamental paper layout | singlepage-interface-reference-risk-balance-landing, singlepage-interface-reference-conduit-pricing-landing, singlepage-interface-reference-agency-portfolio-landing         |
| Work screen frame  | A compact rail and labelled sidebar beside a clear header and one dominant action.                                       | Dense toolbars or a competing second navigation   | singlepage-interface-reference-dashboard-book-grid, singlepage-interface-reference-dashboard-theme-settings                                                                  |
| Repeated item grid | Consistent cards containing a preview, title, metadata and a category label, with a distinct create action.              | Unequal emphasis or decorative filler             | singlepage-interface-reference-dashboard-book-grid                                                                                                                           |
| Choice group       | Related options share one inset surface; the selected row includes a check or radio and its value.                       | Color-only selection                              | singlepage-interface-reference-license-download-card, singlepage-interface-reference-product-license-selection-card, singlepage-interface-reference-license-add-to-cart-card |
| Offer comparison   | Aligned summaries with one emphasised graphite panel and a lime action; product terms come from the owning product.      | Invented prices or multiple recommended options   | singlepage-interface-reference-pricing-plan-cards, singlepage-interface-reference-conduit-pricing-landing, singlepage-interface-reference-subscription-access-card           |
| Step form          | One clear task, visible progress, readable fields and separate backward and forward actions.                             | Hidden progress or crowded questions              | singlepage-interface-reference-onboarding-role-form                                                                                                                          |
| Contextual sheet   | A subject and status above grouped rows, compact labelled actions and a separated destructive action.                    | Unlabelled icon actions                           | singlepage-interface-reference-mobile-invoice-bottom-sheet                                                                                                                   |
| Settings section   | A short explanation above explicit choice cards or a labelled control row.                                               | Implicit selected states                          | singlepage-interface-reference-dashboard-theme-settings                                                                                                                      |

### Review and quality gate

Every reference ID resolves in Assets and permits abstraction. Check the complete canonical component and composition catalogue in the resolved `default` projection at desktop and narrow widths. Verify declared states, keyboard and pointer behavior, focus, wrapping, reduced motion and contrast, then check compositions that depend on changed components. Keep canonical IDs, titles, source ownership and visible recipes. Reference artwork is never rendered as project-owned content.

## Photography

### Purpose and evidence boundary

Photography makes the people behind the project visible through conversation, concentration and work in motion. Devices may appear when the scene calls for them. Generated editorial images communicate atmosphere; they do not depict the actual team, office, customers or completed work.

### Style master prompt

> Candid editorial photography of people at work, with cool blue or teal daylight balanced by warm natural skin tones. Use close human framing, a present gesture and a clear point of attention. Keep the image photographic and contemporary, with soft foreground or background depth; allow natural motion blur when the action calls for it.

### Production specification

Generate the original with the exact style master, a scene brief and the relevant photography references. Allow free or varied proportions that suit the scene and image quality; do not force the initial generation into a square. Preserve the original unchanged.

For future outputs, prepare the square in a separate step by enlarging the canvas along its shorter dimension to a 1:1 ratio and outpainting only the added area. Preserve the entire original frame, including every person, gesture, object and spatial relationship. Do not crop, stretch, distort or reframe the source to make it fit. An already-square master may be reused unchanged after review.

Review the result at 100%, at intended display size and as a small preview before use. Check the seam between the original and added area, photographic detail, lighting and the complete composition. Current square deliveries are `1254 × 1254`; match a common export size after composition is complete, without treating a larger pixel count as improved quality. Display the prepared square intact, with text and UI as separate accessible elements. Register its exact outpainting instruction and source master separately.

Square preparation instruction for future outputs: retain the complete supplied photograph and extend the shorter canvas dimension to a square. Outpaint the added surroundings with matching light, perspective, color, depth and detail. Preserve all original people, gestures and objects. Do not crop, stretch, reframe or add text, logos or interface elements.

### Generation examples

| Example               | Use             | Content brief                                                                                | Avoid                   | Asset ID                                                                     |
| --------------------- | --------------- | -------------------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------- |
| Business conversation | Collaboration   | Two business partners exchange an idea, with a natural gesture and a clear human connection. | Posed meeting stock     | `singlepage-generated-living-focus-photography-business-conversation-square` |
| Moment of focus       | Human attention | A business owner considers an idea, with close framing and soft depth.                       | Generic office portrait | `singlepage-generated-living-focus-photography-moment-of-focus-square`       |
| Work in motion        | Everyday work   | A person carries out a practical business task; the action and gesture remain readable.      | Staged success claims   | `singlepage-generated-living-focus-photography-work-in-motion-square`        |

### Review and quality gate

Compare each new square derivative with its original at 100%, display and small-preview sizes. Verify that the complete original frame remains intact and the outpainted area continues its light, perspective and detail. Check cool daylight, natural skin, expressive gestures, anatomy, scene plausibility and a legible point of attention. Reject any crop, reframing, stretched proportions, lost detail or visible outpainting seam. Review the three squares together for consistent presentation while their subjects and composition remain distinct. The examples show prepared derivatives of the registered production masters; original generation prompts, separate adaptation instructions, source links and review status remain in Assets and metadata.

## Illustration and diagrams

### Purpose and evidence boundary

Illustration explains reusable functions, product adaptation and human-directed software work. These conceptual relationships are not implementation evidence. Explain the main customer journey with actual interface captures when those states exist, or plainly labelled neutral panels during design.

### Core journey composition

- Keep the reviewed project model as the stable content anchor as materials become structured decisions and a landing-page sandbox.
- Reuse recognizable content fragments across states so the relationship remains clear.
- Reveal research, documents and products when they become relevant; do not imply that every area must be complete before a useful preview exists.
- Show Code Framework in response to a concrete software need, connecting the intended product to relevant reusable functions and the user's server.

### Style master prompt

> Create airy isometric line art on a flat pure white background, using fine graphite contours, cool light-gray secondary lines, dotted connections and restrained #BFEF61 details. Keep forms simple, unshaded and open, with generous breathing room and only meaningful connections. Derive the objects from the content brief.

### Production specification

Combine the exact master with the relationship to explain and relevant illustration references. Generate future originals in free or varied proportions suited to the drawing, then preserve each master unchanged. Prepare a square separately by extending the shorter canvas dimension to 1:1 and outpainting only the added area. Keep the entire original drawing, its margins, linework, objects and relationships intact. Do not crop, stretch, distort or reframe the source.

Continue the flat pure white background, fine graphite contours and cool secondary detail into the added area, checking the junction at 100% and at display and small-preview sizes. An already-square master that meets the current color rules needs no expansion. Preserve source files unchanged and register background corrections as separate square derivatives with their exact edit instruction and source link. Use the common delivery size for consistent placement; increasing pixel dimensions does not repair weak detail. Display the complete square directly without an added decorative background.

### Generation examples

| Example               | Use                     | Content brief                                                                                    | Avoid                | Asset ID                                                                           |
| --------------------- | ----------------------- | ------------------------------------------------------------------------------------------------ | -------------------- | ---------------------------------------------------------------------------------- |
| Module hierarchy      | Reusable foundation     | Show reusable software modules joined to a common code foundation with simple component blocks.  | Completeness claim   | `singlepage-generated-living-focus-illustration-module-hierarchy-cool-square`      |
| Framework inheritance | Product adaptation      | Show a framework reused by a product, with one changed module and a preserved common foundation. | Verified merge claim | `singlepage-generated-living-focus-illustration-framework-inheritance-cool-square` |
| Coordinated agents    | Maker task coordination | Show a person guiding software assistants toward a shared task.                                  | Autonomous authority | `singlepage-generated-living-focus-illustration-coordinated-agents-cool-square`    |

### Review and quality gate

Compare defining lines, secondary detail, restrained lime and meaningful relationships with the preserved sources at source, display and small-preview sizes. Check all three current derivatives for a flat white background and cool neutral contours, with no warm cast, lost thin lines or changed relationships. For future outpainted derivatives, verify that the complete drawing remains visible and the extension matches its treatment without a seam. Reject cropping, reframing, stretching and reduced clarity.

## Outputs and provenance

Current reusable outputs are the Onest primary lockup, the preserved avatar and favicon, three prepared square photographs and three square illustration derivatives on pure white registered under `living-focus`, plus the licensed proposed Phosphor Regular icons. The photography and illustration masters remain preserved production sources. The square-image rule does not change identity lockup formats. The font and concept selection are scoped operator decisions; the completed system and new derivatives remain available for visual review. Assets stores exact prompts, source paths, hashes, rights and lifecycle. Product compositions use actual product copy and evidence under their own owners.
