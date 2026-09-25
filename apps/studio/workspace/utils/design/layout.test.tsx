/**
 * BDD Suite: Project-owned Design layouts
 * Given each project can declare its visual review structure
 * When a layout resolves and renders
 * Then startup controls its blocks and template without implicit base file fallback
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { stringify } from "yaml";
import { readFileSync } from "node:fs";
import {
  parseDesignLayout,
  resolveDesignLayout,
  resolveDesignLayoutView,
  type IDesignLayoutSources,
} from "./layout";
import { projectDesignData } from "./data";
import { DesignRenderer } from "../components/DesignRenderer";
import { documentConfirmation } from "../../../../../tools/studio/workspace/document";
import { validateDesignLayoutFiles } from "../../../../../tools/studio/design/validate";

const sources: IDesignLayoutSources = {
  components: {
    "startup/icons/Icons.tsx": { default: () => <p>Project icon examples</p> },
  },
  templates: {
    "startup/Layout.tsx": {
      default: ({ children, document }) => (
        <main data-custom-design="true">
          <h1>Custom identity</h1>
          <p>{document}</p>
          {children}
        </main>
      ),
    },
  },
  markdown: {
    "startup/motion/rules.md": "# Motion\n\n![Example](../icons/check.svg)",
  },
  files: new Set(["startup/icons/check.svg", "startup/preview/index.html"]),
};
const data = projectDesignData(
  {
    id: "test",
    label: "test",
    activeLayer: "startup",
    workspaceRoot: "",
    imports: [],
    exports: [],
    artifacts: [],
  },
  "startup",
);
const local = (sections: unknown[], template?: string) =>
  parseDesignLayout(
    stringify({ sections, ...(template ? { template } : {}) }),
    "startup",
  )!;

describe("Design layout", () => {
  /** BDD Scenario: Empty startup preserves the base
   * Given the live base layout and an empty startup layout
   * When the effective layout resolves
   * Then the complete base order and source ownership are retained
   */
  test("inherits the exact base configuration while startup is empty", () => {
    const base = parseDesignLayout(
      readFileSync(
        new URL("../../design/singlepage/layout.yaml", import.meta.url),
        "utf8",
      ),
      "singlepage",
    )!;
    const startup = parseDesignLayout(
      readFileSync(
        new URL("../../design/startup/layout.yaml", import.meta.url),
        "utf8",
      ),
      "startup",
    );
    expect(resolveDesignLayout(base, startup)).toBe(base);
    expect(base.sections.map((section) => section.id)).toEqual([
      "overview",
      "logos",
      "colors",
      "typography",
      "interface",
      "interface-kit",
      "content-blocks",
      "photography",
      "illustration",
    ]);
    expect(parseDesignLayout("# Inherit\n{}", "startup")).toBeUndefined();
  });

  /** BDD Scenario: Change block order and omit irrelevant media
   * Given a project chooses colors, its own Icons, and typography
   * When rendered with the default shell
   * Then only those blocks appear in the declared order with a review status
   */
  test("reorders, removes, and adds blocks without modifying the shared template", () => {
    const layout = local([
      { id: "colors", builtin: "colors" },
      { id: "icons", title: "Icons", source: "icons/Icons.tsx" },
      { id: "typography", builtin: "typography" },
    ]);
    const html = renderToStaticMarkup(
      <DesignRenderer
        data={data}
        layout={resolveDesignLayoutView(layout, sources)}
        confirmation={documentConfirmation("# Design", "startup")}
      />,
    );
    expect(html.indexOf('id="colors"')).toBeLessThan(
      html.indexOf('id="icons"'),
    );
    expect(html.indexOf('id="icons"')).toBeLessThan(
      html.indexOf('id="typography"'),
    );
    expect(html).toContain("Project icon examples");
    expect(html).toContain("Needs confirmation");
    expect(html).not.toContain('id="photography"');
    expect(html).not.toContain('id="illustration"');
    expect(html).not.toContain('id="logos"');
  });

  /** BDD Scenario: Render an HTML specimen inside the project's own visual system
   * Given a Design section declares a plain HTML fragment and the surface supplies its source
   * When the section renders
   * Then the markup is inlined so it inherits the brand tokens instead of being isolated in an iframe
   */
  test("inlines a Design HTML fragment so it inherits the brand tokens", () => {
    const layout = resolveDesignLayoutView(
      local([{ id: "kit", title: "Interface kit", source: "kit.html" }]),
      {
        ...sources,
        files: new Set([...sources.files, "startup/kit.html"]),
        html: {
          "startup/kit.html":
            '<button class="bg-[var(--workspace-brand-primary)]">Publish</button>',
        },
      },
    );
    const html = renderToStaticMarkup(
      <DesignRenderer
        data={data}
        layout={layout}
        confirmation={documentConfirmation("# Design", "startup")}
      />,
    );

    expect(html).toContain('data-workspace-html="kit"');
    expect(html).toContain("bg-[var(--workspace-brand-primary)]");
    expect(html).not.toContain("<iframe");
  });

  /** BDD Scenario: Keep a standalone HTML page isolated
   * Given a surface that does not supply raw HTML for its declared page
   * When that section renders
   * Then the page stays in its own document instead of inheriting the surrounding styles
   */
  test("keeps an HTML page in its own document when no source is supplied", () => {
    const layout = resolveDesignLayoutView(
      local([{ id: "kit", title: "Interface kit", source: "kit.html" }]),
      { ...sources, files: new Set([...sources.files, "startup/kit.html"]) },
    );
    const html = renderToStaticMarkup(
      <DesignRenderer
        data={data}
        layout={layout}
        confirmation={documentConfirmation("# Design", "startup")}
      />,
    );

    expect(html).toContain("<iframe");
    expect(html).not.toContain("data-workspace-html");
  });

  /** BDD Scenario: Own the entire page
   * Given a startup template with no legacy blocks or parsed legacy data
   * When the template renders its own document and structure
   * Then the page is independent of the default Design schema and keeps its status
   */
  test("allows a complete template replacement without legacy data", () => {
    const layout = resolveDesignLayoutView(local([], "Layout.tsx"), sources);
    const html = renderToStaticMarkup(
      <DesignRenderer
        layout={layout}
        document="Own design structure"
        confirmation={documentConfirmation("# Design", "startup")}
      />,
    );
    expect(html).toContain('data-custom-design="true"');
    expect(html).toContain("Own design structure");
    expect(html).toContain("Needs confirmation");
    expect(html).not.toContain('id="overview"');
  });

  /** BDD Scenario: Custom documents and static pages
   * Given nested Markdown, HTML, and an SVG source
   * When those declared sections resolve
   * Then their URLs retain the selected layer and relative media paths
   */
  test("renders Markdown and mixed static formats within the owning layer", () => {
    const layout = resolveDesignLayoutView(
      local([
        { id: "motion", title: "Motion", source: "motion/rules.md" },
        { id: "preview", title: "Preview", source: "preview/index.html" },
        { id: "icon", title: "Icon", source: "icons/check.svg" },
      ]),
      sources,
    );
    expect(layout.sections.map((section) => section.page?.kind)).toEqual([
      "markdown",
      "html",
      "image",
    ]);
    const html = renderToStaticMarkup(
      <DesignRenderer data={data} layout={layout} />,
    );
    expect(html).toContain("/workspace-design/startup/icons/check.svg");
    expect(html).toContain(
      'src="/workspace-design/startup/preview/index.html"',
    );
    expect(html).toContain('sandbox="allow-scripts allow-downloads"');
  });

  /** BDD Scenario: Atomic startup replacement
   * Given startup declares its own layout and required files exist only in the base
   * When resolution selects startup
   * Then no base section or source is silently substituted
   */
  test("replaces the entire layout and fails on missing startup files", () => {
    const base = parseDesignLayout(
      "sections: [{id: logos, builtin: logos}]",
      "singlepage",
    );
    const startup = local([
      { id: "icons", title: "Icons", source: "icons/Icons.tsx" },
    ]);
    expect(resolveDesignLayout(base, startup)).toBe(startup);
    const baseOnly = {
      ...sources,
      components: {
        "singlepage/icons/Icons.tsx":
          sources.components["startup/icons/Icons.tsx"],
      },
    };
    expect(() => resolveDesignLayoutView(startup, baseOnly)).toThrow(
      "startup/icons/Icons.tsx",
    );
    expect(() =>
      resolveDesignLayoutView(local([], "Absent.tsx"), sources),
    ).toThrow("Missing Design template default export");
  });

  /** BDD Scenario: Reject broken declarations early
   * Given ambiguous sections, duplicates, or paths leaving the layer directory
   * When an agent declares the layout
   * Then validation reports the error instead of silently losing content
   */
  test("rejects empty layouts, duplicate sections, unknown keys, and escaping paths", () => {
    for (const source of [
      "../singlepage/Icons.tsx",
      "/Icons.tsx",
      "icons/%2e%2e/a.md",
      "icons//a.md",
      "https://example.com",
    ])
      expect(() => local([{ id: "icons", title: "Icons", source }])).toThrow();
    expect(() => local([])).toThrow();
    expect(() =>
      local([
        { id: "logos", builtin: "logos" },
        { id: "logos", builtin: "logos" },
      ]),
    ).toThrow("unique");
    expect(() => parseDesignLayout("section: []", "startup")).toThrow(
      "Unknown",
    );
    expect(() =>
      local([{ id: "logos", builtin: "logos", source: "icons.svg" }]),
    ).toThrow("Built-in");
  });

  /** BDD Scenario: Filesystem validation matches browser source ownership
   * Given a fixture with a TSX template and sections
   * When the CLI checks the declared files
   * Then the fixture passes and an unavailable source directory fails
   */
  test("checks declared files without layer fallback", async () => {
    const root = new URL(
      "../../../../../tools/studio/design/fixtures/startup/",
      import.meta.url,
    ).pathname;
    const layout = parseDesignLayout(
      readFileSync(root + "layout.yaml", "utf8"),
      "startup",
    )!;
    await validateDesignLayoutFiles(layout, root);
    await expect(
      validateDesignLayoutFiles(layout, root + "absent/"),
    ).rejects.toThrow("Missing Design source");
  });
});
