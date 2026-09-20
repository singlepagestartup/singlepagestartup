---
confirmation:
  confirmed: false
proposal_id: ""
---

# Design

<!-- This is a starting document structure, not a fixed page layout. Choose
in-scope visual families from the brief. Configure visible blocks, additional
Markdown/React/HTML/media sections, or a full TSX/JSX template in
design/<layer>/layout.yaml; see workspace/README.md. Files are layer-owned.
The shared renderer keeps a neutral Design header above the visual canvas in
all non-empty projections, including startup. Project templates start at H2,
keep their styles inside the canvas, and never repeat the document title,
confirmation badge, or process metadata in the mockup.
Changing the layout does not approve content or resolve omitted requirements. -->

<!-- Reusable visual translation of approved Brand. Keep pages and forms in
product-local website.md; keep channel formats in product-local
marketing-creative.md. Photography and Illustration use the same five-part
schema because Studio renders both through one media template. -->

<!-- Keep whole-document confirmation, attributable scoped approvals,
and the current proposal_id in frontmatter. Studio renders confirmation;
the review body contains current visual decisions without a status table. -->

## Design intent

### Client visual preference profile

| Dimension                                | Confirmed preference or professional inference | Source                          | Confidence or unresolved conflict |
| ---------------------------------------- | ---------------------------------------------- | ------------------------------- | --------------------------------- |
| Contrast and palette                     | Observable description                         | Asset IDs or operator statement | Explicit, inferred, or unknown    |
| Density, whitespace, grid, and rhythm    | Observable description                         | Asset IDs or operator statement | Explicit, inferred, or unknown    |
| Surface, shape, and motion               | Observable description                         | Asset IDs or operator statement | Explicit, inferred, or unknown    |
| Typography character and reading use     | Observable description                         | Asset IDs or operator statement | Explicit, inferred, or unknown    |
| Photography                              | Observable description                         | Asset IDs or operator statement | Explicit, inferred, or unknown    |
| Illustration and infographics            | Observable description                         | Asset IDs or operator statement | Explicit, inferred, or unknown    |
| Marketing composition and text hierarchy | Observable description                         | Asset IDs or operator statement | Explicit, inferred, or unknown    |

- First preserve one plain-language description for each of the five input
  categories. Show recurring traits across inspected examples and the asset
  IDs supporting them, then explain coherence across categories. Reuse reviewed
  Brief descriptions; the client is not required to formulate design criteria.
- Return this coherent style description in the operator's language and obtain
  confirmation or correction before selecting the visual territory
- Do not select final tokens, font assets, master prompts, or registered media
  examples from an unconfirmed profile
- Source this analysis only from the completed Brief `Visual reference intake`,
  its operator statements, and the corresponding Assets IDs; the input register
  itself remains in Brief and Assets

### Brand idea and character

- One positive paragraph explaining the selected style through its visual
  character, atmosphere, hierarchy, media, and recognizable contrast
- Do not turn this paragraph into a list of rejected alternatives, reference
  restrictions, rights, provenance, or internal process notes

### Reusable graphic language

- Three to six portable rules covering Tailwind layout and spacing, shape and
  surface treatment, icons and diagrams, imagery and video, motion,
  accessibility, and truthfulness across every medium
- State each rule once; do not repeat the brand summary or inventory asset
  counts

### Do and do not

| Do  | Do not |
| --- | ------ |

## Identity application

### Naming and lockups

- Public name, mark and lockup rules, favicon/avatar behavior

## Visual system

### Semantic color system

| Role | Light | Dark | Usage |
| ---- | ----- | ---- | ----- |

### Typography

| Role    | CSS family     | Weights           | Usage and language coverage    | Font asset ID            |
| ------- | -------------- | ----------------- | ------------------------------ | ------------------------ |
| Default | Text family    | Available weights | Body, UI, and long-form use    | Registered font asset ID |
| Primary | Heading family | Available weights | Heading and short emphasis use | Registered font asset ID |

- Sizes, line height, spacing, and fallback rules
- When no exact font is mandated, compare two or three real pairings for
  language coverage, readability, character, licensing, and role fit
- Browser QA: `document.fonts.check(...)` and computed `font-family` match the
  selected family; silent fallback is not accepted

## Interface and product surfaces

<!-- The reusable interface language only: how the semantic colors, type, and
shape rules above behave on a product surface. Specific pages, routes, and
forms stay in product-local website.md. Omit this section when the brief
supplies no interface references and the project ships no product surface.

Required minimum whenever the project ships a product surface —
controls: dominant action with its secondary, plain, disabled and separated
destructive variants; selection as a chip and as a grouped choice, each with a
non-colour signal; status and progress; fields and data rows; navigation for a
public page and for a work screen; the dark pair when a dark column exists.
Compositions: editorial entry; a content card carrying the project's own
confirmed imagery at its original aspect ratio; an icon card on the declared
icon grid; a repeated item grid. Conditional: offer comparison when the project
sells, contextual sheet for a mobile or overlay surface, media-and-text row when
illustration is active. Point at the rendered specimens from the boundary
below. studio:validate fails a documented interface language that does not
render them: actions, selection, status, fields, navigation, editorial-entry,
content-card, icon-card, item-grid, plus dark-pair when a Dark column exists.
Section and specimen names belong to the framework: the sections are
`Interface kit` and `Content blocks`, and the specimens are named
Actions, Selection, Status and progress, Fields and data rows, Navigation,
Dark pair, Editorial entry, Photo cards, Icon cards, Numbered steps,
Illustration and text, Repeated item grid, Offer comparison and Contextual
sheet. A project restyles a block and rewrites its
content in any format the layout accepts; it never translates a heading,
renames a section or ships a block outside the catalogue.
The Brand Designer role owns how a specimen is written, declared and omitted. -->

### Purpose and evidence boundary

What the interface language carries across every product surface, and what a
reference screenshot cannot establish.

### Surface, density, and shape

- Three to six portable rules for field and card surfaces, spacing rhythm,
  corner radius, border and shadow restraint, and navigation density

### Controls, states, and actions

- Three to six portable rules for action hierarchy, selected, disabled,
  progress and status treatment, destructive separation, and focus visibility
- Name which semantic role fills the one dominant action; record an unresolved
  conflict here rather than silently changing a confirmed color role

### Confirmed reference patterns

<!-- Provenance only. Studio cites these asset IDs as text and never renders,
traces, or reproduces a reference layout; keep every registry prohibited_use
intact. -->

| Pattern | Decision | Avoid | Reference asset IDs |
| ------- | -------- | ----- | ------------------- |

### Review and quality gate

<!-- This is an internal agent quality contract. Studio does not render it as a human-review card. -->

- Every cited asset ID resolves in Assets and its `allowed_use` covers
  abstraction; no entry is rendered, traced, or presented as owned work
- Each pattern states an own decision rather than describing the reference
- Contrast, focus visibility, and reduced-motion behavior verified for the
  named states against the confirmed semantic color system

## Photography

### Purpose and evidence boundary

What photography communicates across products and channels, and what it cannot
prove.

### Style master prompt

> A compact description of the recurring photographic light, color, texture
> and movement in the references. Keep optional effects optional and allow
> varied framing. Put individual subjects, devices and technical requirements
> in their owning briefs, not in the reusable style prompt.

### Production specification

<!-- Studio exposes this guidance from the information icon beside Style master prompt; do not create a separate visible card. -->

- Plain-language usage: copy this style prompt, add the people/action or
  relationship to show, and attach relevant source references
- Format follows the specific deliverable; quality checks stay in the internal
  review block and actual dimensions in Assets

### Generation examples

| Example | Use | Content brief | Avoid | Asset ID |
| ------- | --- | ------------- | ----- | -------- |

### Review and quality gate

<!-- This is an internal agent quality contract. Studio does not render it as a human-review card. -->

- At least three materially different registered examples reviewed together at
  source size, intended size, small preview, and declared crops
- Named real-world objects retain category-defining structure, count, scale,
  and proportions; merely similar or implausible substitutes are rejected
- After a master changes, displayed examples must be generated with that exact
  master and the documented reference inputs; compare style and regenerate on
  material drift before presenting the prompt as tested
- Cross-example style consistency, accessibility, evidence-risk, rights,
  lifecycle, and exact-prompt provenance checks

## Illustration and diagrams

### Purpose and evidence boundary

What illustrations and diagrams communicate across products and channels, and
what they cannot prove.

### Style master prompt

> A compact description of recurring line, shape, space and color qualities
> in the references. Allow compositions to follow the relationship being shown.
> Do not invent fixed object counts, accent percentages or crop coordinates.

### Production specification

<!-- Studio exposes this guidance from the information icon beside Style master prompt; do not create a separate visible card. -->

- Plain-language usage: copy this style prompt, add the people/action or
  relationship to show, and attach relevant source references
- Choose the background and format for the project and intended use; transparency
  is optional. Preserve the original master; record actual dimensions in Assets.

### Generation examples

| Example | Use | Content brief | Avoid | Asset ID |
| ------- | --- | ------------- | ----- | -------- |

### Review and quality gate

<!-- This is an internal agent quality contract. Studio does not render it as a human-review card. -->

- At least three materially different registered examples reviewed together at
  source size, intended size, small preview, and declared crops
- Named real-world objects retain category-defining structure, count, scale,
  and proportions unless abstraction or simplification is explicitly required
- After a master changes, displayed examples must be generated with that exact
  master and the documented reference inputs; compare style and regenerate on
  material drift before presenting the prompt as tested
- Compare derivatives with the original for thin lines, secondary detail, color
  and contrast at source and display size; reject processing that degrades them.
- Cross-example style consistency, accessibility, evidence-risk, rights,
  lifecycle, and exact-prompt provenance checks

## Outputs and provenance

- Current reusable visual asset IDs, lifecycle, rights, and review state
- Exact immutable generation prompts and tool provenance remain in Assets
- Product pages, presentations, and campaign formats remain outside Design
