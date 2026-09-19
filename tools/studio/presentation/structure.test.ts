/**
 * BDD Suite: React-first layered Studio presentation
 * Given singlepage provides the base and startup may provide a higher-priority override
 * When the presentation pipeline is validated
 * Then default resolves the layered React source and publication exports only that result
 */

import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const repositoryRoot = path.resolve(import.meta.dir, "../../..");

/** The five reference families, as the roles name them in prose. */
const INTAKE_LABELS = [
  "interface and website appearance",
  "typography",
  "photography",
  "illustration",
  "marketing creative",
];

function source(relativePath: string): string {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function pngDimensions(relativePath: string): [number, number] {
  const file = readFileSync(path.join(repositoryRoot, relativePath));
  return [file.readUInt32BE(16), file.readUInt32BE(20)];
}

describe("Studio presentation structure", () => {
  /**
   * BDD Scenario: Retire the unused Evidence review document
   * Given facts and sources live with their owning documents
   * When Studio indexes and presentation inputs are loaded
   * Then no Evidence source, template, or mandatory input remains
   */
  test("keeps the retired Evidence register out of Studio", () => {
    expect(
      existsSync(path.join(repositoryRoot, "apps/studio/workspace/evidence")),
    ).toBe(false);
    expect(
      existsSync(
        path.join(repositoryRoot, ".agents/templates/evidence-register.md"),
      ),
    ).toBe(false);
    for (const layer of ["singlepage", "startup"]) {
      const index = source(`apps/studio/workspace/utils/index/${layer}.yaml`);
      expect(index).not.toContain("kind: evidence");
      expect(index).not.toContain(".evidence");
    }
    expect(
      source("apps/studio/workspace/utils/products/presentation-data.ts"),
    ).not.toContain('artifactContent(workspace, "evidence")');
  });

  /**
   * BDD Scenario: Keep reusable React templates out of the workspace root
   * Given artifact, design, and deck renderers are shared by multiple stories
   * When the Studio workspace structure is validated
   * Then those templates live in components and no duplicate root files remain
   */
  test("keeps shared React templates in the components folder", () => {
    for (const component of [
      "ArtifactBrowser",
      "LayerDataStatus",
      "ProjectDesign",
      "ProjectPresentation",
    ]) {
      expect(
        existsSync(
          path.join(
            repositoryRoot,
            `apps/studio/workspace/utils/components/${component}.tsx`,
          ),
        ),
      ).toBe(true);
      expect(
        existsSync(
          path.join(repositoryRoot, `apps/studio/workspace/${component}.tsx`),
        ),
      ).toBe(false);
    }
  });

  /**
   * BDD Scenario: Preserve the content width of every product catalog
   * Given singlepage and startup catalogs use the same workspace renderer
   * When products are selected in Studio
   * Then product materials retain the full page width and optional surfaces
   */
  test("preserves product materials without adding a permanent content sidebar", () => {
    const component = source(
      "apps/studio/workspace/utils/components/ProductCatalog.tsx",
    );

    expect(component).toContain('label: "Product"');
    expect(component).toContain('label: "Research"');
    expect(component).toContain('label: "Sales"');
    expect(component).toContain('label: "Promotion"');
    expect(component).toContain('label: "Analytics"');
    expect(component).toContain('label: "Content"');
    expect(component).toContain("product.content");
    expect(component).toContain("<Content />");
    expect(component).toContain("product.websiteComponent");
    expect(component).toContain("<Website />");
    expect(component).not.toContain("justify-between gap-x-6 gap-y-2");
    expect(component).not.toContain("lg:grid-cols-[280px_1fr]");
    expect(component).not.toContain("<aside");
  });

  /**
   * BDD Scenario: Keep the AI Chat development loop editable and visible
   * Given Project model guides work from the Brief through validation
   * When its text source and React layout are reviewed
   * Then both preserve the same decision loop before materials and implementation
   */
  test("keeps the Project model validation loop aligned across text and layout", () => {
    const document = source(
      "apps/studio/workspace/products/singlepage/ai-chat/content/workspace-map.md",
    );
    const layout = source(
      "apps/studio/workspace/products/singlepage/ai-chat/content/WorkspaceMap.tsx",
    );

    expect(document).toContain("```mermaid\nflowchart LR");
    expect(document).toContain("D --> E[Critical assumptions]");
    expect(document).toContain(
      "G -->|Disproves| I[Change Product, model or Sales]",
    );
    expect(document).toContain("I --> E");
    expect(document).toContain("H --> J[Materials and implementation]");
    expect(layout).toContain('title: "Critical assumptions"');
    expect(layout).toContain('title: "Research & experiments"');
    expect(layout).toContain("What did the evidence show?");
  });

  /**
   * BDD Scenario: Keep every product definition decision-ready
   * Given the framework owns one canonical Product contract covering offer and economics
   * When the template and both current framework products are validated
   * Then all use the same sections and the superseded shallow structure is absent
   */
  test("enforces the Product contract, offer and economics together", () => {
    const expectedSections = [
      "Product identity",
      "Customer Segments",
      "Problem and desired progress",
      "Value Propositions",
      "Offer and usage",
      "Revenue Streams",
      "Key Activities",
      "Key Resources",
      "Key Partnerships",
      "Cost Structure",
      "Assumptions and decision rules",
      "Business goals and metrics",
    ];
    const template = source(".agents/templates/product.md");
    const products = [
      source(
        "apps/studio/workspace/products/singlepage/singlepagestartup/product.md",
      ),
      source("apps/studio/workspace/products/singlepage/ai-chat/product.md"),
    ];
    const sections = (document: string): string[] =>
      [...document.matchAll(/^## (.+)$/gm)].map((match) => match[1]);

    expect(sections(template)).toEqual(expectedSections);
    for (const product of products) {
      expect(sections(product)).toEqual(expectedSections);
      for (const supersededHeading of [
        "Decision status",
        "Buyer and buying situation",
        "Offer and outcome",
        "Adoption ladder",
        "Proof and claim boundaries",
      ]) {
        expect(product).not.toContain(`## ${supersededHeading}`);
      }
    }
  });

  /**
   * BDD Scenario: Review AI Chat presentation slides as Text and Layout
   * Given AI Chat has a product-owned React presentation
   * When Studio loads its slide data and renderer
   * Then each slide supplies reviewable Markdown text and the shared PDF-ready layout
   */
  test("keeps AI Chat presentation text paired with its layout", () => {
    const renderer = source(
      "apps/studio/workspace/products/singlepage/ai-chat/presentation/ProjectPresentation.tsx",
    );
    const data = parse(
      source(
        "apps/studio/workspace/products/singlepage/ai-chat/presentation/data.yaml",
      ),
    ) as {
      content: { slides: Array<{ id: string; title: string }> };
    };

    expect(data.content.slides.length).toBeGreaterThanOrEqual(6);
    expect(
      data.content.slides.every(({ id, title }) => Boolean(id && title)),
    ).toBe(true);
    expect(renderer).toContain("presentationSlideMarkdown(slide)");
    expect(renderer).toContain("<ProjectPresentation");
    expect(renderer).toContain("data-slide-content");
    expect(renderer).toContain("data-slide-footer");
  });

  /**
   * BDD Scenario: Keep font assets and styles in their workspace layer
   * Given Studio runtime is project-neutral and downstream brands may override the framework
   * When the layered style structure is validated
   * Then fonts are registered with singlepage Assets and default loads singlepage before startup
   */
  test("keeps font assets and cascading styles in workspace", () => {
    const fontRoot = "apps/studio/workspace/assets/singlepage/fonts";
    expect(
      existsSync(
        path.join(
          repositoryRoot,
          fontRoot,
          "jetbrains-mono/JetBrainsMono-wght.ttf",
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        path.join(
          repositoryRoot,
          fontRoot,
          "cormorant-garamond/CormorantGaramond[wght].ttf",
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        path.join(
          repositoryRoot,
          fontRoot,
          "cormorant-garamond/CormorantGaramond-Italic[wght].ttf",
        ),
      ),
    ).toBe(true);

    const runtime = source("apps/studio/runtime/styles.css");
    expect(runtime).not.toContain("@font-face");
    expect(runtime).not.toContain("JetBrains Mono");
    expect(runtime).not.toContain("Cormorant Garamond");
    expect(runtime).not.toContain("workspace-singlepage");

    const resolvedStyles = source("apps/studio/workspace/styles/default.css");
    expect(resolvedStyles).toContain(
      "@layer workspace-singlepage, workspace-startup;",
    );
    expect(resolvedStyles.indexOf("./singlepage.css")).toBeLessThan(
      resolvedStyles.indexOf("./startup.css"),
    );
    const singlepage = source("apps/studio/workspace/styles/singlepage.css");
    expect(singlepage).toContain("../assets/singlepage/fonts/jetbrains-mono");
    expect(singlepage).toContain(
      "../assets/singlepage/fonts/cormorant-garamond",
    );
    const storybook = source("apps/studio/.storybook/main.ts");
    expect(storybook).not.toContain("../../host/styles/fonts/Primary");
  });

  /**
   * BDD Scenario: Keep the machine asset registry out of human review navigation
   * Given Assets is canonical YAML consumed by code and AI agents
   * When Storybook discovers human-review stories
   * Then it does not expose a raw Assets document in the sidebar
   */
  test("keeps the machine-only Assets registry out of Storybook", () => {
    expect(
      existsSync(
        path.join(
          repositoryRoot,
          "apps/studio/workspace/assets/index.stories.tsx",
        ),
      ),
    ).toBe(false);
  });

  /**
   * BDD Scenario: Keep internal projection diagnostics out of the design
   * Given Storybook already identifies the selected source or resolved story
   * When a design page is presented or exported
   * Then it omits readiness warnings and duplicated technical breadcrumbs
   */
  test("keeps projection diagnostics out of the design canvas", () => {
    const design = source(
      "apps/studio/workspace/utils/components/ProjectDesign.tsx",
    );
    expect(design).not.toContain("function Readiness");
    expect(design).not.toContain("This is the {data.projectionLabel}");
    expect(design).not.toContain("Project · Design ·");
  });

  /**
   * BDD Scenario: Render every layer through one project-neutral Design template
   * Given singlepage and startup own structured Design data and CSS tokens
   * When the Design React files are inspected
   * Then shared React owns presentation while no layer owns a separate component
   */
  test("keeps Design decisions in data and composition in one shared template", () => {
    const component = source(
      "apps/studio/workspace/utils/components/ProjectDesign.tsx",
    );
    const data = source("apps/studio/workspace/utils/design/data.ts");

    expect(component).toContain('from "react"');
    expect(component).toContain("export default function ProjectDesign");
    expect(component).toContain("data.conceptName");
    expect(component).toContain("function MediaSection");
    expect(component).not.toContain("data.mediaIntake");
    expect(component).not.toContain("Media direction");
    expect(component).not.toContain("Measured Space");
    expect(component).not.toContain("JetBrains Mono");
    expect(component).not.toContain("singlepage-generated-");
    expect(
      existsSync(
        path.join(
          repositoryRoot,
          "apps/studio/workspace/design/singlepage/ProjectDesign.tsx",
        ),
      ),
    ).toBe(false);
    expect(
      existsSync(
        path.join(
          repositoryRoot,
          "apps/studio/workspace/design/startup/ProjectDesign.tsx",
        ),
      ),
    ).toBe(false);
    expect(data).toContain('stringField(asset, "design_role")');
    expect(data).toContain('stringField(asset, "design_key")');
    expect(data).toContain("function mediaFor");
    expect(data).not.toContain('? "Startup" : "SinglePageStartup"');
  });

  /**
   * BDD Scenario: Keep reusable Design separate from Website and Marketing Creative
   * Given the brand system is shared across pages and acquisition channels
   * When the Design stories and sources are validated
   * Then they contain only portable identity views and the other applications have separate artifacts
   */
  test("separates reusable design from product applications", () => {
    const component = source(
      "apps/studio/workspace/utils/components/ProjectDesign.tsx",
    );
    const designSource = source("apps/studio/workspace/utils/design/source.ts");
    const designStories = source(
      "apps/studio/workspace/utils/stories/design.stories.tsx",
    );

    expect(designSource).not.toContain("../website/");
    for (const removedView of [
      "KeyComponents",
      "PrimaryLandingPage",
      "MobilePage",
      "SuccessState",
      "AcquisitionCreative",
      'view === "form"',
    ]) {
      expect(designStories + component).not.toContain(removedView);
    }
    for (const retainedSection of [
      'id="overview"',
      'id="logos"',
      'id="colors"',
      'id="typography"',
      'id="photography"',
      'id="illustration"',
    ]) {
      expect(component).toContain(retainedSection);
    }
    expect(component).not.toContain('id="graphic-language"');
    expect(designStories).toContain('title: "Workspace/30 Design"');
    expect(designStories).toContain("export const Default");
    expect(designStories).toContain("export const Singlepage");
    expect(designStories).toContain("export const Startup");
    expect(designStories).not.toContain("export const Overview");
    for (const artifact of [
      "apps/studio/workspace/products/singlepage/catalog.yaml",
      "apps/studio/workspace/products/startup/catalog.yaml",
      "apps/studio/workspace/products/singlepage/singlepagestartup/product.md",
      "apps/studio/workspace/products/singlepage/singlepagestartup/website.md",
      "apps/studio/workspace/products/singlepage/singlepagestartup/marketing-creative.md",
      "apps/studio/workspace/products/singlepage/singlepagestartup/presentation/ProjectPresentation.tsx",
      "apps/studio/workspace/utils/stories/products.stories.tsx",
    ]) {
      expect(existsSync(path.join(repositoryRoot, artifact))).toBe(true);
    }
    for (const removed of [
      "apps/studio/workspace/website/index.stories.tsx",
      "apps/studio/workspace/creative/index.stories.tsx",
      "apps/studio/workspace/presentation/default/index.stories.tsx",
    ]) {
      expect(existsSync(path.join(repositoryRoot, removed))).toBe(false);
    }
  });

  /**
   * BDD Scenario: Resolve Design data and project-owned layouts separately
   * Given singlepage supplies Design and startup may supply higher-priority data
   * When Storybook discovers all three projections
   * Then startup remains inspectable and default resolves both data and the selected layout
   */
  test("exposes three Design projections with separately resolved layouts", () => {
    const layeredStory =
      "apps/studio/workspace/utils/stories/design.stories.tsx";
    expect(existsSync(path.join(repositoryRoot, layeredStory))).toBe(true);
    for (const removedStory of [
      "apps/studio/workspace/design/default/index.stories.tsx",
      "apps/studio/workspace/design/singlepage/index.stories.tsx",
      "apps/studio/workspace/design/startup/index.stories.tsx",
    ]) {
      expect(existsSync(path.join(repositoryRoot, removedStory))).toBe(false);
    }

    const story = source(layeredStory);
    expect(story).toContain("LayerDataStatus");
    expect(story).toContain("hasProjectDesignData");
    expect(story).toContain("resolvedProjectDesignData");
    expect(story).toContain(
      'import { DesignRenderer } from "../components/DesignRenderer"',
    );
    expect(story).not.toContain("resolveLayeredComponent");
    expect(story).not.toContain("import.meta.glob");
  });

  /**
   * BDD Scenario: Hold photography and illustration to the same quality contract
   * Given imagery quality is a primary Design gate
   * When the roles, templates, and shared renderer are inspected
   * Then both media families require the same structured prompts, examples, and visual review
   */
  test("requires symmetric, visually verified media systems", () => {
    const role = source(".agents/roles/brand-designer.md");
    const roleText = role.replace(/\s+/g, " ");
    const briefRole = source(".agents/roles/account-manager.md");
    const briefRoleText = briefRole.replace(/\s+/g, " ");
    const briefTemplate = source(".agents/templates/brief.md");
    const template = source(".agents/templates/design.md");
    const component = source(
      "apps/studio/workspace/utils/components/ProjectDesign.tsx",
    );

    // Symmetry is a contract between the two media families, so it is measured
    // across their own span; other sections may reuse a shared heading name.
    const media = template.slice(
      template.indexOf("## Photography"),
      template.indexOf("## Outputs and provenance"),
    );
    expect(media).toContain("## Illustration and diagrams");
    for (const heading of [
      "### Purpose and evidence boundary",
      "### Style master prompt",
      "### Production specification",
      "### Generation examples",
      "### Review and quality gate",
    ]) {
      expect(media.split(heading)).toHaveLength(3);
    }
    // Both families carry the same review rule, stated once in each of them.
    expect(
      media.match(/At least three materially different registered examples/g),
    ).toHaveLength(2);
    expect(
      template.match(/category-defining structure, count, scale/g),
    ).toHaveLength(2);

    // Brief owns the intake register; Design points at it instead of copying it.
    expect(roleText).toContain("`brief/<layer>.md#visual-reference-intake`");
    expect(briefTemplate).toContain("## Visual reference intake");
    expect(briefTemplate).toMatch(/^\| Marketing creative\s+\|/m);
    expect(template).not.toMatch(/^\| Marketing creative\s+\|/m);
    expect(briefTemplate).not.toContain("Existing asset IDs");
    expect(template).toContain("### Client visual preference profile");
    expect(template).not.toContain("Categorized reference intake");
    for (const label of INTAKE_LABELS) {
      expect(briefRoleText).toContain(label);
      expect(roleText).toContain(label);
    }
    expect(template).not.toContain("centered `55% × 55%` crop-safe");
    expect(template).toContain("### Reusable graphic language");
    expect(template).not.toContain("## Graphic language");
    expect(component).toContain("function MediaSection");
    expect(component.match(/<MediaSection/g)).toHaveLength(2);
    expect(component).not.toContain("function PreferenceProfile");
    expect(component).not.toContain('id="preference-profile"');
    expect(component).toContain("Reusable graphic language");
    expect(component).toContain('className="flex items-center gap-4"');
    expect(component).toContain("function PromptUsageTooltip");
    expect(component).toContain('role="tooltip"');
    expect(component).toContain(
      'aria-label="How to use this style master prompt"',
    );
    expect(component).toContain("guidance={media.productionRules}");
    expect(component).not.toContain("Acceptance checks");
    expect(component).not.toContain("media.reviewRules");
    expect(component).not.toContain("Production specification");
    expect(component).not.toContain("Review and quality gate");
    expect(component).not.toContain('aria-label="Design sections"');
    expect(component).not.toContain("Logo assets");
    expect(component).not.toContain("Photography examples");
    expect(component.match(/data\.conceptSummary/g)).toHaveLength(1);
    expect(component).not.toContain("function ReferenceIntake");
    expect(component).not.toContain("data.referenceIntake");
    expect(component).toContain('className="block h-auto w-full"');

    const assetIndex = parse(
      source("apps/studio/workspace/assets/singlepage.yaml"),
    ) as {
      assets: Array<{
        design_role?: string;
        lifecycle?: string;
        path?: string;
        dimensions?: { width: number; height: number };
      }>;
    };
    const imageMasters = assetIndex.assets.filter(
      (asset) =>
        ["photography", "motif"].includes(asset.design_role ?? "") &&
        ["approved", "proposed"].includes(asset.lifecycle ?? "") &&
        asset.path?.endsWith(".png"),
    );
    expect(imageMasters.length).toBeGreaterThanOrEqual(6);
    for (const asset of imageMasters) {
      const [width, height] = pngDimensions(
        `apps/studio/workspace/${asset.path}`,
      );
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
      if (asset.dimensions) {
        expect({ width, height }).toEqual(asset.dimensions);
      }
    }
  });

  /**
   * BDD Scenario: One intake vocabulary across template, role and check
   * Given the Brief frontmatter is read by the pipeline check and written by the role
   * When the three of them are compared
   * Then they name the same categories and the same statuses
   */
  test("keeps the Brief intake vocabulary identical in template, role and check", () => {
    const template = source(".agents/templates/brief.md");
    const role = source(".agents/roles/account-manager.md");
    const checks = source("tools/singlepagestartup/pipeline/checks.ts");

    const declared = [
      ...checks
        .slice(
          checks.indexOf("export const VISUAL_CATEGORIES"),
          checks.indexOf("] as const;", checks.indexOf("VISUAL_CATEGORIES")),
        )
        .matchAll(/"([a-z-]+)"/g),
    ].map((match) => match[1]);
    expect(declared).toHaveLength(INTAKE_LABELS.length);
    for (const category of declared) {
      expect(template).toContain(`\`${category}\``);
    }

    // `ready` and `out-of-scope` are the states the check accepts; the other
    // two exist so a category can say it is neither.
    const accepted = checks.slice(
      checks.indexOf("const ACCEPTED_INTAKE_STATUSES"),
      checks.indexOf("\n", checks.indexOf("const ACCEPTED_INTAKE_STATUSES")),
    );
    for (const status of [
      "missing",
      "supplied-unreviewed",
      "ready",
      "out-of-scope",
    ]) {
      expect(template).toContain(`\`${status}\``);
      expect(role).toContain(`\`${status}\``);
      expect(accepted.includes(`"${status}"`)).toBe(
        status === "ready" || status === "out-of-scope",
      );
    }
  });

  /**
   * BDD Scenario: Bind typography and layout rules to real implementation tokens
   * Given Design is shared by singlepage and downstream startup projects
   * When the role, source, parser, and layered CSS are inspected
   * Then fonts are registered and verifiable while layout uses named Tailwind utilities
   */
  test("binds typography and layout to registered assets and Tailwind", () => {
    const role = source(".agents/roles/brand-designer.md").replace(/\s+/g, " ");
    const template = source(".agents/templates/design.md");
    const design = source("apps/studio/workspace/design/singlepage.md");
    const parser = source("apps/studio/workspace/utils/design/data.ts");
    const component = source(
      "apps/studio/workspace/utils/components/ProjectDesign.tsx",
    );
    const styles = source("apps/studio/workspace/styles/singlepage.css");

    expect(template).toMatch(/^\| Role\s+\| CSS family\s+\| Weights\s+\|/m);
    expect(role).toContain("`document.fonts.check(...)`");
    expect(role).toContain("Tailwind `max-w-7xl` (`1280px`)");
    expect(design).toContain("singlepage-font-cormorant-garamond-variable");
    expect(design).toContain("`max-w-7xl` (`1280px`)");
    expect(design).not.toContain("`1200px` grid");
    expect(parser).toContain("references missing font asset");
    expect(component).toContain("data-font-family");
    expect(component).toContain("data-font-asset-id");
    expect(styles).toContain('font-family: "Cormorant Garamond"');
    expect(styles).toContain("CormorantGaramond-Italic[wght].ttf");
  });

  /**
   * BDD Scenario: Present project decisions instead of Studio diagnostics
   * Given the presentation is a review deck derived from canonical artifacts
   * When the base React deck is inspected
   * Then YAML owns the ordered slides and their text without design-placeholder copy
   */
  test("builds a decision deck instead of reusing design diagnostics", () => {
    const presentation = source(
      "apps/studio/workspace/products/singlepage/singlepagestartup/presentation/ProjectPresentation.tsx",
    );
    expect(presentation).not.toContain("<ProjectDesign");
    expect(presentation).not.toContain("Design follows this source layer only");
    expect(presentation).not.toContain("Waiting for content");
    const data = parse(
      source(
        "apps/studio/workspace/products/singlepage/singlepagestartup/presentation/data.yaml",
      ),
    );
    expect(presentation).toContain("slides={data.slides.map");
    expect(presentation).toContain("text: presentationSlideMarkdown(slide)");
    for (const slideId of [
      "product",
      "audience",
      "workflow",
      "adaptation",
      "chat-bridge",
      "economics",
      "growth",
      "goals",
      "start",
    ]) {
      expect(
        data.content.slides.some(
          (slide: { id: string }) => slide.id === slideId,
        ),
      ).toBe(true);
    }
  });

  /**
   * BDD Scenario: Resolve presentation surfaces from the approved Design palette
   * Given Design defines White Surface, Paper Canvas, Ink, and Lime roles
   * When the React deck assigns its page and information surfaces
   * Then it uses semantic Design tokens instead of an unrelated canvas color
   */
  test("uses approved semantic colors for presentation surfaces", () => {
    const presentation = source(
      "apps/studio/workspace/products/singlepage/singlepagestartup/presentation/ProjectPresentation.tsx",
    );
    const styles = source("apps/studio/workspace/styles/singlepage.css");
    const design = source("apps/studio/workspace/design/singlepage.md");

    expect(presentation).toContain(
      'backgroundColor: paletteValue(data, "surface")',
    );
    expect(presentation).toContain("--workspace-brand-background,#F7F6F2");
    expect(styles).toContain("--workspace-brand-surface: #ffffff");
    expect(design).toContain(
      "Presentations use White fields, Paper insets, Ink content, and Accent `#BFEF61` locators.",
    );
  });

  /**
   * BDD Scenario: Publish only the resolved deck
   * Given default is the resolved layered deck
   * When HTML, PDF, and PNG derivatives are exported
   * Then the exporter uses default and lets repository identity choose the output owner layer
   */
  test("keeps derived publication bound to default", () => {
    const exporter = source("tools/studio/presentation/export.ts");
    expect(exporter).toContain(
      'const STORY_ID = "workspace-40-products--default"',
    );
    expect(exporter).toContain(
      'source: "apps/studio/workspace/utils/stories/products.stories.tsx"',
    );
    expect(exporter).toContain("document=presentation&product=");
    expect(exporter).toContain("resolvePresentationOutputTarget");
    expect(exporter).toContain("127\\.0\\.0\\.1|localhost");
    expect(exporter).toContain(
      "querySelectorAll('script, link[rel=\"modulepreload\"]')",
    );
    expect(exporter).not.toContain("<script\\b");
  });

  /**
   * BDD Scenario: Serve registered workspace identity assets to React
   * Given brand outputs are stored below the workspace asset tree
   * When Storybook renders the brand and imagery views
   * Then those files are served from the deterministic workspace-assets route
   */
  test("serves workspace identity assets to the React presentation", () => {
    const storybook = source("apps/studio/.storybook/main.ts");
    expect(storybook).toContain(
      '{ from: "../workspace/assets", to: "/workspace-assets" }',
    );
  });
});
