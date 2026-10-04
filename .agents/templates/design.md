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

## Iconography

- Name the icon source: library, version or pinned revision, weight, source URL,
  license and registered assets; for a custom set, record its authorship,
  editable vector sources and drawing method
- Define the source grid, stroke or fill treatment, caps, joins, corner rules,
  optical alignment, display sizes, color, states and accessible labels
- Render a dedicated `Icons` block (`data-specimen="icons"`) with the actual
  glyphs at their intended sizes and on the required surfaces. Show actions,
  navigation and status symbols before products reuse the set. Icon cards are
  a separate composition example and do not replace this block
- Use one coherent family. New custom glyphs follow the recorded geometry;
  library glyphs retain the selected family's native paths and weight
- If the project uses no icons, record that scope explicitly

## Interface and product surfaces

<!-- Reusable interface foundations, component variants/states and compositions.
Product-specific pages, routes, forms and workflows stay product-local.

Organize Interface kit into task-based categories using layout.yaml children;
Content blocks composes kit elements. The canonical IDs, titles, categories
and dependencies are in tools/studio/design/specimens.ts. Preserve them while
restyling the selected layer. Missing required specimens need a reasoned
interface_review.omitted_specimens.<id> entry.

Use interactive TSX/JSX for behaviour and static HTML for CSS/native examples.
Declare literal Specimen id/title props or data-specimen plus canonical H3 in
a selected source; shared primitives carry common styles and behaviour.
Show applicable variants, focus/keyboard rules, default/selected/disabled,
pending, empty, error and success. Include compact usage and exact recipes.
Content blocks declare data-composes and reuse those primitives.

Document the downstream token mapping and component/composition boundary.
Verify narrow screens, long copy, contrast, touch targets, keyboard, reduced
motion, focus containment/return and themed portals. Clearly identify local
simulations. The Brand Designer owns implementation and browser review. -->

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
- Generate the source master with a free aspect ratio suited to its composition;
  do not force square dimensions in the generation request
- Preserve the original. In a separate image-editing step, expand the shorter
  canvas dimension with outpainting until the image is square, keeping the
  entire source composition and its proportions. An already-square master may
  be reused unchanged. Cropping, stretching and CSS masks do not perform this step
- Use the project's common square delivery resolution; resize proportionally
  only after canvas expansion when needed. Upscaling alone does not make an
  image square or prove higher quality
- Register the source and delivery asset separately, including their dimensions,
  exact generation and expansion prompts, tool and source linkage. Render the
  square delivery in Design and reusable image cards

### Generation examples

| Example | Use | Content brief | Avoid | Asset ID |
| ------- | --- | ------------- | ----- | -------- |

### Review and quality gate

<!-- This is an internal agent quality contract. Studio does not render it as a human-review card. -->

- At least three materially different registered examples reviewed together at
  source size, intended size and small preview
- Each delivery is square at the recorded common resolution. Compare it with
  its source: the full composition remains visible, extensions are plausible,
  and proportions, detail, color and focal subjects are preserved
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
- Choose the background for the project and intended use; transparency is optional
- Generate the source master with a free aspect ratio suited to the relationship;
  do not force square dimensions in the generation request
- Preserve the original. Prepare a separate square delivery by expanding the
  shorter canvas dimension through outpainting. Keep the complete drawing,
  proportions, thin lines and background treatment; do not crop or stretch it.
  An already-square master may be reused unchanged
- Use the project's common square delivery resolution. Record both assets,
  actual dimensions, exact prompts, editing tool and source linkage in Assets;
  review the expansion before using the delivery in Design or products

### Generation examples

| Example | Use | Content brief | Avoid | Asset ID |
| ------- | --- | ------------- | ----- | -------- |

### Review and quality gate

<!-- This is an internal agent quality contract. Studio does not render it as a human-review card. -->

- At least three materially different registered examples reviewed together at
  source size, intended size and small preview
- Each delivery is square at the recorded common resolution. Compare it with
  its source: the full composition remains visible, extensions are plausible,
  and proportions, detail, color and focal subjects are preserved
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
