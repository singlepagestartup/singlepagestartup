---
confirmation:
  confirmed: false
review:
  dependencies:
    asset-index: 62c40075601691ae7c3d7270b63268e3973e8be65a7c7091ce2dcabb6e329298
    brand: d5832fea9d6f4995d90b780efb5a8889ead9fe63e13d26620fb8a6c4538a3d78
    brief: 3bfbc769cf05602249af173264b5bbad1b5b4bbfc5aea26eedfcea76b43d34db
---

# Design

## Decision status

| Field                 | Current value                                                                         |
| --------------------- | ------------------------------------------------------------------------------------- |
| Brand prerequisite    | Approved on 2026-08-11;                                                               |
| Client style analysis | `confirmed`;                                                                          |
| Partial decisions     | Fonts, accent, and digital-first Photography confirmed; complete Design awaits review |
| Visual proposal ID    | `measured-space`                                                                      |

## Design intent

### Client visual preference profile

| Dimension                             | Confirmed preference or professional inference                                                                                                              | Source                                                                   | Confidence or unresolved conflict                       |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------- |
| Contrast and palette                  | Near-monochrome fields with one sharp light-green locator; palette colors come from SinglePageStartup, not reference brands                                 | categorized interface, marketing, illustration references; accent sample | Explicit;,                                              |
| Density, whitespace, grid, and rhythm | Spacious editorial landings and structured, denser work screens; clear alignment and limited hierarchy levels                                               | interface set                                                            | Explicit                                                |
| Surface, shape, and motion            | Restrained borders, rounded controls, selective translucency; motion blur communicates movement                                                             | interface and photography sets                                           | Explicit                                                |
| Typography                            | Monospaced copy with a serif for headings and italic emphasis                                                                                               | typography set                                                           | Explicit; JetBrains Mono + Cormorant Garamond confirmed |
| Photography and illustration          | References define camera/motion; project context requires recognizable device use with secondary architecture. Illustration uses minimal isometric linework | categorized photography and illustration sets; project context           | Explicit;                                               |
| Marketing composition                 | Photography-led vertical compositions with sparse copy, overlays, one dominant statement and one action                                                     | marketing set                                                            | Explicit                                                |

### Brand idea and character

**Measured Space** combines technical precision with editorial expression. Light layouts, serif headlines, monospaced text, restrained diagrams, and a vivid green accent create a technology aesthetic. Photography shows digital work; minimal illustrations explain connections.

### Reusable graphic language

- Use Tailwind `gap-2/4/6/8`, `py-12/16/24`, `max-w-7xl` (`1280px`), `px-4 sm:px-6 lg:px-8`, four/eight/twelve columns at base/`md`/`lg`, and `rounded-md/xl/3xl` for tags, controls, and panels.
- Use a 24px icon grid with 2px strokes. Dashed lines mean intended or unverified. Code and terminal output must be real, selectable, dated, and limitation-aware.
- Use opaque surfaces by default. Reserve translucency for temporary overlays with a solid fallback and verified contrast. Presentations use White fields, Paper insets, Ink content, and Accent `#BFEF61` locators.
- Use motion only to explain state, within `120–240ms`, with reduced-motion alternatives. Preserve visible focus, semantic structure, alternatives, and adjacent disclosures.
- Across every medium, use one dominant statement and one Accent locator; never let visual polish or proof-like UI imply readiness, adoption, or evidence.

### Do and do not

| Do                                                    | Do not                                               |
| ----------------------------------------------------- | ---------------------------------------------------- |
| Use one dominant statement and one Accent locator     | Fill layouts with accent or decorative proof-like UI |
| Render only registered assets within lifecycle limits | Treat proposals as published identity or evidence    |
| Keep claims adjacent to limits                        | Let polish imply readiness or adoption               |

## Identity application

### Naming and lockups

Use **SinglePageStartup**, never an acronym. Preserve the operator-created pixel-grid S. The primary lockup pairs it with outlined Cormorant Garamond Bold; avatar and favicon use the mark alone. Keep one mark-width clear space. Accent never recolors the mark.

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

Photography shows people using digital tools; it never proves software outcomes.

### Style master prompt

> OUTPUT: one opaque `1024 × 1024px` sRGB PNG. TECHNIQUE: candid, human-centered, dynamic, slightly filmic, `35–50mm`, available city/workspace light; use controlled blur, shallow focus, occlusion, close viewpoint, or low angle. SUBJECT: a person actively uses a recognizable digital device; digital work is unmistakable and architecture stays secondary. COMPOSITION: every important human part and category-defining device part fits centered `55% × 55%`; keep `22.5%` secondary environment per side. DEVICE QA: credible scale, anatomy, grip, keys, trackpad, hinge, screen, buttons, cameras, ports, and cables as applicable; reject missing, invented, or unreadable silhouettes. COLOR: natural Paper/Ink-compatible scene; one tiny Accent locator optional. EXCLUDE: construction, blueprints, architectural drawings, hard hats, drafting tools, architecture-led compositions, nature-dominant scenes, readable UI/text/code, logos, branded devices, cyberpunk, stock posing, staged success, and product proof.

### Production specification

Append device, action, setting, and technique. Retain `1:1`; verify crop, geometry, anatomy, and alt text.

### Generation examples

| Example                 | Use                | Content brief                                                                | Avoid                             | Asset ID                                                                  |
| ----------------------- | ------------------ | ---------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------- |
| Open-laptop work        | Editorial opener   | Developer types on a credible open laptop beside an urban transit interior   | fake keyboard, device crop        | `singlepage-generated-measured-space-photography-open-laptop-work`        |
| Smartphone coordination | Coordination story | Developer taps a credible smartphone in a city technology workspace          | impossible grip, readable UI      | `singlepage-generated-measured-space-photography-smartphone-coordination` |
| Connected workstation   | Technical story    | Developer uses display, keyboard, switch, and mini-computer in a city studio | invented ports, server-rack proof | `singlepage-generated-measured-space-photography-connected-workstation`   |

### Review and quality gate

Three masters passed source, 1024px, 96px, centered 55% crop, device/anatomy, cross-set, provenance, and lifecycle QA. Publication remains pending.

## Illustration and diagrams

### Purpose and evidence boundary

Illustration explains a relationship, inheritance, or bounded coordination. It never represents implemented architecture, module completeness, autonomous authority, or product proof.

### Style master prompt

> OUTPUT: one opaque `1024 × 1024px` sRGB PNG on Paper `#F7F6F2`. LINE: Ink `#111111` primary and Muted `#565656` secondary, `3–5px`, with dotted construction guides. ACCENT: exactly one `#BFEF61` locator smaller than `4%` of canvas. FORM: sparse isometric technical linework, two–five recognizable minimal objects, no more than four identifying details per object, limited depth, almost no fill. COMPOSITION: every object and connector inside the centered `55% × 55%`; outer area empty. EXCLUDE: text, numbers, logos, UI chrome, shadows, gradients, texture, glow, photorealism, copied composition, and the SinglePageStartup mark. The content brief states meaning and required object counts, never paths, primitives, coordinates, or layout.

### Production specification

Add one relationship, required objects/counts, and the false implication to avoid. Retain a `1:1` master; verify source, 1024px, 96px, and crops. Describe the relationship in alt text.

### Generation examples

| Example               | Use                    | Content brief                                                       | Avoid                | Asset ID                                                                 |
| --------------------- | ---------------------- | ------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------ |
| Module hierarchy      | Architecture explainer | Reusable modules around one developer-controlled foundation         | completeness claim   | `singlepage-generated-measured-space-illustration-module-hierarchy`      |
| Framework inheritance | Documentation          | Base inherited by one project with one focused override             | verified merge claim | `singlepage-generated-measured-space-illustration-framework-inheritance` |
| Coordinated agents    | AI workflow explainer  | One human controls exactly three assistants around one bounded task | autonomous authority | `singlepage-generated-measured-space-illustration-coordinated-agents`    |

### Review and quality gate

Three masters passed source, 1024px, 96px, crop, object-count, line, Accent, evidence, provenance, and lifecycle review; operator approval remains pending.

## Outputs and provenance

Outputs are the registered primary lockup, avatar, favicon, updated OG graphic, three Photography masters, and three Illustration masters under proposal `measured-space`. Exact prompts, hashes, rights, allowed use, and lifecycle remain in Assets. Product, presentations, and campaign formats remain outside Design.
