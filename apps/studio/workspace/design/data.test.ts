/**
 * BDD Suite: Medium-independent Studio design data
 * Given layered design and asset sources
 * When Studio derives the reusable Design projection
 * Then it contains identity rules and prompts without website or campaign data
 */

import { describe, expect, test } from "bun:test";
import { projectDesignData, resolvedProjectDesignData } from "./data";
import type { IStudioWorkspace } from "../types";

function workspace(design: string, assets = "assets: []"): IStudioWorkspace {
  return {
    activeLayer: "singlepage",
    artifacts: [
      {
        content: design,
        description: "Design",
        id: "singlepage.design",
        inherited: false,
        kind: "design",
        layer: "singlepage",
        resolution: "local",
        sourceIds: ["singlepage.design"],
        sourcePath: "design/singlepage.md",
        sourcePaths: ["design/singlepage.md"],
        usedBy: [],
        uses: [],
      },
      {
        content: assets,
        description: "Assets",
        id: "singlepage.asset-index",
        inherited: false,
        kind: "asset-index",
        layer: "singlepage",
        resolution: "local",
        sourceIds: ["singlepage.asset-index"],
        sourcePath: "assets/singlepage.yaml",
        sourcePaths: ["assets/singlepage.yaml"],
        usedBy: [],
        uses: [],
      },
    ],
    exports: [],
    id: "singlepage",
    imports: [],
    label: "SinglePageStartup",
    workspaceRoot: "apps/studio/workspace",
  };
}

describe("project design data", () => {
  /**
   * BDD Scenario: Render the confirmed client preference analysis
   * Given Brief owns the categorized reference intake
   * When Studio derives its shared Design data
   * Then Design exposes only the resulting client preference profile
   */
  test("reads the client visual preference profile", () => {
    const data = projectDesignData(
      workspace(`
# Design

### Client visual preference profile

The confirmed profile is derived from the five Brief reference sets.
`),
      "singlepage",
    );

    expect(data.preferenceProfile).toContain("five Brief reference sets");
  });

  /**
   * BDD Scenario: Read selected typography and semantic colors
   * Given Design records type roles and colors as structured Markdown tables
   * When Design data is created
   * Then Studio uses the exact approved fonts and palette instead of neutral fallbacks
   */
  test("reads the approved Design tokens", () => {
    const data = projectDesignData(
      workspace(
        `
# Design

### Typography

| Role | CSS family | Weights | Usage and language coverage | Font asset ID |
| --- | --- | --- | --- | --- |
| Default | JetBrains Mono | 400–600 | Body and Cyrillic | font-base |
| Primary | Cormorant Garamond | 500–600 | Headings, short italic emphasis, and Cyrillic | font-display |

### Semantic color system

| Role | Light mode | Dark mode |
| --- | --- | --- |
| Canvas | \`#F7F6F2\` Paper | \`#111111\` Ink |
| Surface | \`#FFFFFF\` | \`#1B1B1B\` |
| Text primary | \`#111111\` | \`#FFFFFF\` |
| Text muted | \`#565656\` | \`#C9C7C1\` |
| Action | \`#111111\` with white | \`#FFFFFF\` with ink |
| Accent/locator | \`#BFEF61\` Signal lime with Ink | \`#BFEF61\` Signal lime with Ink |
| Border subtle | \`#CBC9C3\` | \`#3A3A3A\` |
`,
        `assets:
  - id: font-base
    design_role: font
    design_key: base
    path: assets/singlepage/fonts/base.ttf
    source_type: stock
  - id: font-display
    design_role: font
    design_key: display
    path: assets/singlepage/fonts/display.ttf
    source_type: stock
`,
      ),
      "singlepage",
    );

    expect(data.bodyType).toContain("JetBrains Mono");
    expect(data.displayType).toContain("Cormorant Garamond");
    expect(data.bodyTypeLabel).toBe("JetBrains Mono");
    expect(data.displayTypeLabel).toBe("Cormorant Garamond");
    expect(data.typographyRoles).toEqual([
      {
        assetId: "font-base",
        family: "JetBrains Mono",
        fontStack:
          '"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace',
        role: "Default",
        usage: "Body and Cyrillic",
        weights: "400–600",
      },
      {
        assetId: "font-display",
        family: "Cormorant Garamond",
        fontStack: '"Cormorant Garamond", ui-sans-serif, system-ui, sans-serif',
        role: "Primary",
        usage: "Headings, short italic emphasis, and Cyrillic",
        weights: "500–600",
      },
    ]);
    expect(data.palette).toEqual({
      accent: "#BFEF61",
      background: "#F7F6F2",
      foreground: "#111111",
      line: "#CBC9C3",
      muted: "#565656",
      primary: "#111111",
      surface: "#FFFFFF",
    });
  });

  /**
   * BDD Scenario: Preserve declared CSS font stacks
   * Given a layer defines quoted font names followed by generic CSS families
   * When Design data is created for the resolved projection
   * Then the first family remains the specimen label and the complete stack stays valid CSS
   */
  test("preserves declared CSS font stacks", () => {
    const data = projectDesignData(
      workspace(
        `
# Design

### Typography

| Role | CSS family | Weights | Usage and language coverage | Font asset ID |
| --- | --- | --- | --- | --- |
| Default | "JetBrains Mono", monospace | 400–600 | Body and Cyrillic | font-base |
| Primary | "Cormorant Garamond", serif | 500–600 | Headings and Cyrillic | font-display |
`,
        `assets:
  - id: font-base
    design_role: font
    design_key: default
    path: assets/startup/fonts/base.ttf
    source_type: stock
  - id: font-display
    design_role: font
    design_key: primary
    path: assets/startup/fonts/display.ttf
    source_type: stock
`,
      ),
      "startup",
    );

    expect(data.typographyRoles).toEqual([
      expect.objectContaining({
        family: "JetBrains Mono",
        fontStack: '"JetBrains Mono", monospace',
      }),
      expect.objectContaining({
        family: "Cormorant Garamond",
        fontStack: '"Cormorant Garamond", serif',
      }),
    ]);
  });

  /**
   * BDD Scenario: Reject an unregistered selected font
   * Given startup selects a font family without a matching font asset row
   * When Design data is created
   * Then Studio fails explicitly instead of silently rendering a fallback
   */
  test("rejects typography roles with missing font assets", () => {
    expect(() =>
      projectDesignData(
        workspace(`
# Design

### Typography

| Role | CSS family | Weights | Usage and language coverage | Font asset ID |
| --- | --- | --- | --- | --- |
| Primary | Missing Serif | 600 | Short headings | missing-font |
`),
        "singlepage",
      ),
    ).toThrow('references missing font asset "missing-font"');
  });

  /**
   * BDD Scenario: Derive identity content without a project-coded React template
   * Given Design names its visual territory and the asset index assigns semantic slots
   * When Design data is created
   * Then the component receives the concept and asset roles from layered sources
   */
  test("derives concept and semantic asset slots from sources", () => {
    const data = projectDesignData(
      workspace(
        `# Design

### Brand idea and character

**Signal Field** uses a compact geometric mark. A second sentence remains supporting detail.

### Reusable graphic language

- Keep one dominant visual statement.

### Do and do not

| Do | Do not |
| --- | --- |
| Use one locator | Fill the page with accents |
`,
        `assets:
  - id: project-specific-lockup-id
    design_role: logo
    design_key: primary
    path: assets/singlepage/generated/identity/primary.svg
    source_type: generated
    lifecycle: approved
    purpose: Primary identity lockup.
`,
      ),
      "singlepage",
    );

    expect(data.conceptName).toBe("Signal Field");
    expect(data.conceptSummary).toBe(
      "Signal Field uses a compact geometric mark. A second sentence remains supporting detail.",
    );
    expect(data.assets[0]).toMatchObject({
      designKey: "primary",
      designRole: "logo",
      id: "project-specific-lockup-id",
    });
    expect(data.graphicRules).toEqual(["Keep one dominant visual statement."]);
    expect(data.doDont).toEqual([
      { do: "Use one locator", dont: "Fill the page with accents" },
    ]);
  });

  /**
   * BDD Scenario: Read reusable image-production guidance
   * Given photography and illustration sections contain concrete prompt tables
   * When Design data is created
   * Then both media languages retain title, use, prompt, and negative constraints
   */
  test("reads photography and illustration prompts", () => {
    const data = projectDesignData(
      workspace(`
# Design

### Media intake and direction gate

| Family | In scope | Existing assets | Liked/disliked references | Required qualities and no-gos | Direction status |
| --- | --- | --- | --- | --- | --- |
| Photography | Unknown | None confirmed | No specific references | Awaiting operator criteria | Blocked |
| Illustration | Confirmed | None confirmed | Linear references | Minimal geometry | Proposed |

## Photography

### Purpose and evidence boundary

Quiet editorial photography.

### Style master prompt

> OUTPUT: 1 opaque square raster image, 1024 × 1024px. COLOR: Paper #F7F6F2, Ink #111111, optional Signal lime #BFEF61. COMPOSITION: 2–5 objects in a centered crop-safe area. LIGHT: 1 key light. CAMERA: 50mm, f/8. MATERIALS: 2–3 enumerated materials. EXCLUDE: excluded-category count is 0. SCENE VARIABLES: append exact subject. If a required value is absent, return MISSING_OR_UNSUPPORTED_SPEC.

### Production specification

Append the subject and crop.

### Generation examples

| Example | Use | Content brief | Avoid | Asset ID |
| --- | --- | --- | --- | --- |
| Measured surface | Editorial header | Warm paper, north-window daylight, 50mm lens, clear type area | No people, readable code, logos, or fake UI | photography-measured-surface |

### Review and quality gate

Review source and target sizes.

## Illustration and diagrams

### Purpose and evidence boundary

Original geometric motifs and separate labeled diagrams.

### Style master prompt

> OUTPUT: 1 1024px PNG. PALETTE: Ink #111111, Paper #F7F6F2, optional Signal lime #BFEF61. GEOMETRY: model-selected forms. REPRESENTATION: 0–4 objects, no more than 3 details each. RELATIONSHIP: scale and proximity; connector count 0. STROKE: 4–8px. FILLS: 3–24%. COMPOSITION: 96px edge clearance. EXCLUDE: text count is 0. CONTENT BRIEF: one semantic sentence. If a required value is absent, return MISSING_OR_UNSUPPORTED_SPEC.

### Production specification

Append one semantic content brief.

### Generation examples

| Example | Use | Content brief | Avoid | Asset ID |
| --- | --- | --- | --- | --- |
| Clear module hierarchy | Editorial illustration | Show a clear hierarchy of modules in a software project. | No architecture proof claim | illustration-module-hierarchy |

### Review and quality gate

Review thumbnail legibility.
`),
      "singlepage",
    );

    expect(data.photography.examples).toEqual([
      {
        assetId: "photography-measured-surface",
        avoid: "No people, readable code, logos, or fake UI",
        prompt: "Warm paper, north-window daylight, 50mm lens, clear type area",
        title: "Measured surface",
        use: "Editorial header",
      },
    ]);
    expect(data.photography.masterPrompt).toBe(
      "OUTPUT: 1 opaque square raster image, 1024 × 1024px. COLOR: Paper #F7F6F2, Ink #111111, optional Signal lime #BFEF61. COMPOSITION: 2–5 objects in a centered crop-safe area. LIGHT: 1 key light. CAMERA: 50mm, f/8. MATERIALS: 2–3 enumerated materials. EXCLUDE: excluded-category count is 0. SCENE VARIABLES: append exact subject. If a required value is absent, return MISSING_OR_UNSUPPORTED_SPEC.",
    );
    expect(data.photography.productionRules).toEqual([
      "Append the subject and crop.",
    ]);
    expect("reviewRules" in data.photography).toBe(false);
    expect(data.illustration.masterPrompt).toBe(
      "OUTPUT: 1 1024px PNG. PALETTE: Ink #111111, Paper #F7F6F2, optional Signal lime #BFEF61. GEOMETRY: model-selected forms. REPRESENTATION: 0–4 objects, no more than 3 details each. RELATIONSHIP: scale and proximity; connector count 0. STROKE: 4–8px. FILLS: 3–24%. COMPOSITION: 96px edge clearance. EXCLUDE: text count is 0. CONTENT BRIEF: one semantic sentence. If a required value is absent, return MISSING_OR_UNSUPPORTED_SPEC.",
    );
    expect(data.illustration.examples[0]).toMatchObject({
      assetId: "illustration-module-hierarchy",
      title: "Clear module hierarchy",
    });
  });

  /**
   * BDD Scenario: Preview only current generated identity outputs
   * Given generated, client-intake, and public-reference assets are indexed
   * When Studio derives Design data
   * Then proposed or approved generated outputs receive preview URLs and input references do not
   */
  test("maps only current generated identity outputs to previews", () => {
    const data = projectDesignData(
      workspace(
        "# Design\n\nApproved identity.",
        `
schema: singlepagestartup.asset-index.v1
assets:
  - id: approved-lockup
    path: assets/singlepage/generated/identity/primary.svg
    source_type: generated
    lifecycle: approved
    purpose: Approved primary lockup.
  - id: retired-output
    path: assets/singlepage/generated/old/retired.svg
    source_type: generated
    lifecycle: retired
    purpose: Retired output.
  - id: operator-draft
    path: assets/singlepage/intake/draft.svg
    source_type: client
    purpose: Operator draft.
`,
      ),
      "singlepage",
    );

    expect(data.assets).toHaveLength(3);
    expect(data.assets[0]?.previewUrl).toBe(
      "/workspace-assets/singlepage/generated/identity/primary.svg",
    );
    expect(data.assets[1]?.previewUrl).toBeUndefined();
    expect(data.assets[2]?.previewUrl).toBeUndefined();
  });

  /**
   * BDD Scenario: Inherit design data from singlepage
   * Given startup has no meaningful design or asset data
   * When default Design data is resolved
   * Then it is identical to the singlepage source data
   */
  test("inherits singlepage data unchanged when startup is empty", () => {
    const singlepage = workspace("# Design\n\nSinglePageStartup identity.");
    const startup = workspace("", "");

    expect(
      resolvedProjectDesignData({ default: singlepage, singlepage, startup }),
    ).toEqual(projectDesignData(singlepage, "singlepage"));
  });

  /**
   * BDD Scenario: Prefer a meaningful startup design override
   * Given startup contains project-specific design rules
   * When default Design data is resolved
   * Then the resolved workspace is rendered as the startup source layer
   */
  test("prefers startup data when its design source contains content", () => {
    const singlepage = workspace("# Design\n\nSinglePageStartup identity.");
    const startup = workspace("# Design\n\nStartup identity.");
    const resolved = workspace("# Design\n\nStartup identity.");

    const data = resolvedProjectDesignData({
      default: resolved,
      singlepage,
      startup,
    });

    expect(data.projection).toBe("startup");
  });

  /**
   * BDD Scenario: Keep framework identity out of a downstream Design review
   * Given the resolved asset registry contains both singlepage and startup logos
   * When the meaningful startup Design is rendered through the default projection
   * Then only startup-layer identity assets are exposed to the project review
   */
  test("filters resolved identity assets to the active startup layer", () => {
    const singlepage = workspace(
      "# Design\n\nSinglePageStartup identity.",
      `assets:
  - id: singlepage-logo
    design_role: logo
    path: assets/singlepage/generated/identity/logo.svg
    source_type: generated
    lifecycle: approved
    purpose: Framework logo.
`,
    );
    const startup = workspace(
      "# Design\n\nStartup identity.",
      `assets:
  - id: startup-logo
    design_role: logo
    path: assets/startup/generated/identity/logo.svg
    source_type: generated
    lifecycle: proposed
    purpose: Project logo.
`,
    );
    const resolved = workspace(
      "# Design\n\nStartup identity.",
      `assets:
  - id: singlepage-logo
    design_role: logo
    path: assets/singlepage/generated/identity/logo.svg
    source_type: generated
    lifecycle: approved
    purpose: Framework logo.
  - id: startup-logo
    design_role: logo
    path: assets/startup/generated/identity/logo.svg
    source_type: generated
    lifecycle: proposed
    purpose: Project logo.
`,
    );

    const data = resolvedProjectDesignData({
      default: resolved,
      singlepage,
      startup,
    });

    expect(data.assets.map((asset) => asset.id)).toEqual(["startup-logo"]);
  });
});
