# Design

<!-- Reusable visual translation of approved Brand. Maximum 1,400 words. Keep
pages and forms in product-local website.md; keep channel formats in
product-local marketing-creative.md. Photography and Illustration use the same
five-part schema because Studio renders both through one media template. -->

## Decision status

| Field                 | Current value                   |
| --------------------- | ------------------------------- |
| Brand prerequisite    | Approved status and evidence ID |
| Design status         | `proposed` or `approved`        |
| Client style analysis | `proposed` or `confirmed`       |
| Operator confirmation | Current attributable decision   |
| Visual proposal ID    | One kebab-case ID               |

## Design intent

### Client visual preference profile

| Dimension                                | Confirmed preference or professional inference | Source                          | Confidence or unresolved conflict |
| ---------------------------------------- | ---------------------------------------------- | ------------------------------- | --------------------------------- |
| Contrast and palette                     | Observable description                         | Asset IDs or operator statement | Explicit, inferred, or unknown    |
| Density, whitespace, grid, and rhythm    | Observable description                         | Asset IDs or operator statement | Explicit, inferred, or unknown    |
| Surface, shape, and motion               | Observable description                         | Asset IDs or operator statement | Explicit, inferred, or unknown    |
| Typography character and reading use     | Observable description                         | Asset IDs or operator statement | Explicit, inferred, or unknown    |
| Photography and illustration             | Observable description                         | Asset IDs or operator statement | Explicit, inferred, or unknown    |
| Marketing composition and text hierarchy | Observable description                         | Asset IDs or operator statement | Explicit, inferred, or unknown    |

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

## Photography

### Purpose and evidence boundary

What photography communicates across products and channels, and what it cannot
prove.

### Style master prompt

> One reusable prompt containing observable output, palette, lighting, material,
> density, negative-space, crop, and exclusion constraints. Do not include the
> subject of one example or subjective shorthand without measurable values.

### Production specification

<!-- Studio exposes this guidance from the information icon beside Style master prompt; do not create a separate visible card. -->

- Variables every semantic content brief must add
- `1:1` raster master, centered `55% × 55%` crop-safe area, formats,
  accessibility, derivative crops, and output checks

### Generation examples

| Example | Use | Content brief | Avoid | Asset ID |
| ------- | --- | ------------- | ----- | -------- |

### Review and quality gate

<!-- This is an internal agent quality contract. Studio does not render it as a human-review card. -->

- At least three materially different registered examples reviewed together at
  source size, intended size, small preview, and declared crops
- Named real-world objects retain category-defining structure, count, scale,
  and proportions; merely similar or implausible substitutes are rejected
- Cross-example style consistency, accessibility, evidence-risk, rights,
  lifecycle, and exact-prompt provenance checks

## Illustration and diagrams

### Purpose and evidence boundary

What illustrations and diagrams communicate across products and channels, and
what they cannot prove.

### Style master prompt

> One reusable prompt containing observable output, palette, contrast, stroke,
> form/detail count, negative-space, legibility, and exclusion constraints.
> Recognizable minimal objects are allowed when the content brief requires them;
> do not prescribe paths, primitive coordinates, or one finished composition.

### Production specification

<!-- Studio exposes this guidance from the information icon beside Style master prompt; do not create a separate visible card. -->

- Variables every semantic content brief must add
- `1:1` raster master, centered `55% × 55%` crop-safe area, formats,
  accessibility, derivative crops, and output checks

### Generation examples

| Example | Use | Content brief | Avoid | Asset ID |
| ------- | --- | ------------- | ----- | -------- |

### Review and quality gate

<!-- This is an internal agent quality contract. Studio does not render it as a human-review card. -->

- At least three materially different registered examples reviewed together at
  source size, intended size, small preview, and declared crops
- Named real-world objects retain category-defining structure, count, scale,
  and proportions unless abstraction or simplification is explicitly required
- Cross-example style consistency, accessibility, evidence-risk, rights,
  lifecycle, and exact-prompt provenance checks

## Outputs and provenance

- Current reusable visual asset IDs, lifecycle, rights, and review state
- Exact immutable generation prompts and tool provenance remain in Assets
- Product pages, presentations, and campaign formats remain outside Design
