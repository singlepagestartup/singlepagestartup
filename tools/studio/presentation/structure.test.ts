import { canonicalMarkdownHeadings } from "../workspace/headings";
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
      existsSync(
        path.join(
          repositoryRoot,
          "apps/studio/workspace/utils/products/presentation-data.ts",
        ),
      ),
    ).toBe(false);
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

    expect(component).toContain("documentId");
    expect(component).toContain("materialId");
    expect(component).toContain("product.sections");
    expect(component).not.toContain("websiteComponent");
    expect(component).not.toContain("groupedSurfaces");
    expect(component).not.toContain("<ProductPages");
    expect(component).not.toContain("justify-between gap-x-6 gap-y-2");
    expect(component).not.toContain("lg:grid-cols-[280px_1fr]");
    expect(component).not.toContain("<aside");
  });

  /**
   * BDD Scenario: Keep AI Chat's first-stage text review loop visible
   * Given Project model guides separate product drafts through correction
   * When its text source and React layout are reviewed
   * Then both lead to reviewed texts, export and a project topic
   */
  test("keeps the first-stage text review loop aligned across text and layout", () => {
    const document = source(
      "apps/studio/workspace/products/singlepage/ai-chat/content/workspace-map.md",
    );
    const layout = source(
      "apps/studio/workspace/products/singlepage/ai-chat/content/WorkspaceMap.tsx",
    );

    expect(document).toContain("```mermaid\nflowchart LR");
    expect(document).toContain("D --> E[Недочёты и критические предположения]");
    expect(document).toContain(
      "G --> H[Принятие, выгрузка и прикрепление к теме]",
    );
    expect(document).toContain("G --> E");
    expect(layout).toContain('title: "Недочёты, найденные AI"');
    expect(layout).toContain('title: "Проверьте, выгрузите и откройте тему"');
    expect(layout).toContain("Неизвестный факт или предположение");
  });

  /**
   * BDD Scenario: Keep every product definition decision-ready
   * Given Studio owns separate passport and economics documents
   * When the template and both current framework products are validated
   * Then each decision has one owning document and the combined web form remains compatible
   */
  test("keeps a product description and economics as separate documents", () => {
    for (const id of ["singlepagestartup", "ai-chat"]) {
      const product = source(
        `apps/studio/workspace/products/singlepage/${id}/product.md`,
      );
      const economics = source(
        `apps/studio/workspace/products/singlepage/${id}/economics.md`,
      );
      expect(product).toContain("## Что это за продукт");
      expect(product).toContain("## Кому подходит");
      expect(product).toMatch(/## (Что входит|Что получает пользователь)/);
      expect(product).not.toContain("## Конкуренты");
      expect(economics.length).toBeGreaterThan(100);
    }
    expect(
      existsSync(
        path.join(repositoryRoot, ".agents/templates/product-passport.md"),
      ),
    ).toBe(false);
  });

  /**
   * BDD Scenario: Review AI Chat presentation slides as Text and Layout
   * Given AI Chat has a product-owned React presentation
   * When Studio loads its slide data and renderer
   * Then each slide supplies reviewable Markdown text and the shared PDF-ready layout
   */
  test("keeps each presentation's content in its owning React source", () => {
    for (const id of ["singlepagestartup", "ai-chat"]) {
      const root = `apps/studio/workspace/products/singlepage/${id}/presentation`;
      const renderer = source(`${root}/ProjectPresentation.tsx`);
      expect(renderer).toContain("export const presentationContent");
      expect(renderer).toContain("<ProjectPresentation");
      expect(renderer).toContain("data-slide-content");
      expect(renderer).not.toContain("presentationSlideMarkdown");
      expect(existsSync(path.join(repositoryRoot, root, "data.yaml"))).toBe(
        false,
      );
    }
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
      existsSync(path.join(repositoryRoot, fontRoot, "onest/Onest-wght.ttf")),
    ).toBe(true);
    expect(
      existsSync(path.join(repositoryRoot, fontRoot, "onest/OFL.txt")),
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
    expect(singlepage).toContain("../assets/singlepage/fonts/onest");
    expect(singlepage).not.toContain("JetBrains Mono");
    expect(singlepage).not.toContain("Cormorant Garamond");
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
      "apps/studio/workspace/utils/stories/design.default.stories.tsx",
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
    expect(designStories).toContain('title: "Workspace/40 Дизайн/default"');
    expect(designStories).toContain("export const Document");
    expect(designStories).not.toContain("export const Overview");
    for (const artifact of [
      "apps/studio/workspace/products/singlepage/catalog.yaml",
      "apps/studio/workspace/products/startup/catalog.yaml",
      "apps/studio/workspace/products/singlepage/singlepagestartup/product.md",
      "apps/studio/workspace/products/singlepage/singlepagestartup/website.md",
      "apps/studio/workspace/products/singlepage/singlepagestartup/marketing-creative.md",
      "apps/studio/workspace/products/singlepage/singlepagestartup/presentation/ProjectPresentation.tsx",
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
  test("exposes source layers and their resolved Design view without adapters", () => {
    for (const projection of ["default", "singlepage", "startup"]) {
      const story = source(
        `apps/studio/workspace/utils/stories/design.${projection}.stories.tsx`,
      );
      expect(story).toContain(`projection: "${projection}"`);
      expect(story).not.toContain("Legacy");
    }
    const component = source(
      "apps/studio/workspace/utils/components/DesignWorkspace.tsx",
    );
    expect(component).toContain("resolvedProjectDesignData");
    expect(component).toContain("hasStartupDesignLayout");
    expect(component).toContain("<DesignRenderer");
  });

  test("registered media masters exist and report their actual dimensions", () => {
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
   * BDD Scenario: Present project decisions instead of Studio diagnostics
   * Given the presentation is a review deck derived from canonical artifacts
   * When the base React deck is inspected
   * Then YAML owns the ordered slides and their text without design-placeholder copy
   */
  test("renders the owned deck rather than design diagnostics", () => {
    const presentation = source(
      "apps/studio/workspace/products/singlepage/singlepagestartup/presentation/ProjectPresentation.tsx",
    );
    expect(presentation).not.toContain("<ProjectDesign");
    expect(presentation).toContain("slides={data.slides.map");
    expect(presentation).toContain("presentationContent");
    expect(presentation).not.toContain("presentationSlideMarkdown");
  });

  /**
   * BDD Scenario: Publish only the resolved deck
   * Given default is the resolved layered deck
   * When HTML, PDF, and PNG derivatives are exported
   * Then the exporter uses default and lets repository identity choose the output owner layer
   */
  test("keeps derived publication bound to default", () => {
    const exporter = source("tools/studio/presentation/export.ts");
    expect(exporter).toContain("presentationStoryTarget(");
    expect(exporter).toContain("target.layer,");
    expect(exporter).toContain("source: story.source");
    expect(exporter).toContain("id=${story.storyId}");
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
