---
confirmation:
  confirmed: true
  by: operator
  at: 2026-09-13
  source: "Operator explicitly approved the current Design in chat: «Так, всё, подтверди дизайн. Окей, будем с этим работать. Идём дальше»."
  content_sha256: 99ab863f73ba4c069a79fceb3cedfc3fb0b0c91c51d50185f15779c1a8aec0b7
proposal_id: measured-space
review:
  dependencies:
    asset-index: 3959f399ca7ce73eb67531f94dc5349d1cfd3a03e7fb9921627e4c09252b1f41
    brand: 691ec9f7a801d77e97daa4266fbd617c95568804eefb1ed07c3848dfd8add19d
    brief: bf0f72b61cb12fc4a6fea78bd136dddb34e57921a7d8dbb528c25f85f30e68e1
scoped_confirmations:
  preference_profile:
    confirmed: true
    by: operator
    at: 2026-09-13
    source: "Operator explicitly approved the current Design in chat: «Так, всё, подтверди дизайн. Окей, будем с этим работать. Идём дальше»."
    scope: Approves the five-category Client visual preference profile contained in the current Design.
  selected_elements:
    confirmed: true
    by: operator
    at: 2026-08-14
    source: Operator-selected JetBrains Mono and Cormorant Garamond, supplied Accent BFEF61 and mandatory pixel-grid S.
    scope: Selected identity, font pairing and accent.
  media_direction:
    confirmed: true
    by: operator
    at: 2026-09-13
    source: Operator requests people-and-business imagery, optional devices, compact flexible master prompts and replacement of the three photographs.
    scope: Authorizes reference reanalysis and photo production; generated outputs remain proposed.
  illustration_background:
    confirmed: true
    by: operator
    at: 2026-09-13
    source: Operator selects the existing warm off-white illustration background and requires preservation of line detail and image quality.
    scope: Use the original illustrations with their existing background; processing must preserve visual quality.
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
    summary: Direct inspection of all original files; recurring treatment and meaningful variation inform the revised five-category profile. No original photograph requires a digital device.
    interpretation_status: proposed
  meaning_translation:
    classification: assumption
    resolution: professional-choice
    source: apps/studio/workspace/brand/singlepage.md
    sections:
      - Intended perception
      - Meaning and message hierarchy
      - Consistency rules
    supports: "People working on their business: attention, conversations and collaboration for the chat audience; reusable foundations and human-directed agent work for interested makers."
    limitation: Editorial images and conceptual diagrams do not prove useful answers, adoption, implemented architecture or successful setup.
media_review:
  source: Coordinator visual review of current media; independent Brand Designer comparison of the three regenerated illustrations, 2026-09-13.
  photography:
    status: proposed
    asset_ids:
      - singlepage-generated-measured-space-photography-business-conversation
      - singlepage-generated-measured-space-photography-moment-of-focus
      - singlepage-generated-measured-space-photography-work-in-motion
    reference_fit: Conversation uses gesture and motion blur; portrait uses close framing and soft foreground layers; order handoff uses a low viewpoint and bright backlight. Natural warm/cool color and human presence connect the set. Business scenes and aspect ratios vary.
    display: Original aspect ratios; no automatic square crop.
  illustration:
    status: proposed
    source: Three fresh generations using the exact current master, three software content briefs and the five original illustration references.
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
      method: Compare all three generated originals with the source references and former examples for linework, open surfaces, restrained accent, readable relationships and cross-example consistency. Validate the same prompt-plus-brief-plus-references procedure described in the tooltip.
      scope: Style consistency across these three briefs; not pixel-identical composition or a guarantee for every future generation.
    reference_fit:
      module-hierarchy: Fine black isometric contours, pale guides and open unshaded blocks retain the reference line language; restrained green links connect software modules to a shared base without importing reference buildings.
      framework-inheritance: Black and gray line hierarchy, light open forms and a changed green module reproduce the established family while translating continuity into software reuse.
      coordinated-agents: Outlined software panels, pale dotted connections and restrained green marks stay consistent with the family; the person directs the shared task, with robot icons used as software symbols rather than physical characters.
    display: Original aspect ratio without automatic crop.
  product_asset_impact:
    asset_id: singlepage-generated-measured-space-og
    source: Exact immutable copy in apps/studio/workspace/assets/singlepage.yaml.
    issue: Existing copy about evaluating recurring foundations, one pinned version and stated rights no longer applies the approved Brand. Product-specific OG copy needs revision in its owning product work; this asset is not a reusable Design output.
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

**Measured Space** makes digital work feel approachable and considered. Spacious light fields, expressive serif headings and orderly monospaced text help people focus on a question or a useful change. A vivid green accent guides attention. Human photography brings everyday business work into view; sparse diagrams explain how a maker can reuse a foundation.

### Reusable graphic language

- Use Tailwind `gap-2/4/6/8`, `py-12/16/24`, `max-w-7xl` (`1280px`), `px-4 sm:px-6 lg:px-8`, four/eight/twelve columns at base/`md`/`lg`, and `rounded-md/xl/3xl` for tags, controls, and panels.
- Use a 24px icon grid with 2px strokes. Diagrams explain one relationship at a time; dashed lines denote a proposed connection. Keep conceptual diagrams distinct from actual product captures.
- Presentations use White fields, Paper insets, Ink content, and Accent `#BFEF61` locators. Reserve translucency for small overlays with a solid fallback and verified contrast.
- Use motion only to explain change, within `120–240ms`, with reduced-motion alternatives. Preserve visible focus, semantic structure and text alternatives.

### Do and do not

| Do                                                                  | Do not                                                            |
| ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Use one dominant statement and one Accent locator                   | Fill the composition with competing emphasis                      |
| Show people exchanging ideas, making decisions and doing their work | Reduce every business story to a device demonstration             |
| Use actual product captures to explain an observed result           | Present generated screens or diagrams as working product evidence |

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

| Role    | CSS family                    | Weights             | Usage and language coverage                                             | Font asset ID                                 |
| ------- | ----------------------------- | ------------------- | ----------------------------------------------------------------------- | --------------------------------------------- |
| Default | `"JetBrains Mono", monospace` | 400–600             | Body, UI, labels, code; Latin and Cyrillic                              | `singlepage-font-jetbrains-mono-variable`     |
| Primary | `"Cormorant Garamond", serif` | 500–600; italic 500 | Headings at `32px+`; short italic semantic emphasis; Latin and Cyrillic | `singlepage-font-cormorant-garamond-variable` |

Body uses `16/26`; labels `12/16`; headings use `40/42` mobile and `64/64` desktop with `-0.02em` tracking. Use sentence case. Browser QA must pass `document.fonts.check(...)` and computed-family inspection.

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

Illustration explains reusable functions, a focused product change or human-directed agent work for makers. These conceptual relationships do not represent chat knowledge retrieval, implemented architecture, complete functionality or autonomous authority.

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
