/**
 * BDD Suite: Project-owned Design layouts
 * Given each project can declare its visual review structure
 * When a layout resolves and renders
 * Then startup controls its blocks and template without implicit base file fallback
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createRoot } from "react-dom/client";
import { act, useState } from "react";
import { JSDOM } from "jsdom";
import { stringify } from "yaml";
import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  flattenDesignSections,
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
   * Given a base layout and an empty startup layout
   * When the effective layout resolves
   * Then the complete base order and source ownership are retained
   */
  test("inherits the exact base configuration while startup is empty", () => {
    const base = parseDesignLayout(
      "sections: [{id: logos, builtin: logos}, {id: colors, builtin: colors}]",
      "singlepage",
    )!;
    const startup = parseDesignLayout("", "startup");
    expect(resolveDesignLayout(base, startup)).toBe(base);
    expect(base.sections.map((section) => section.id)).toEqual([
      "logos",
      "colors",
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

  /** BDD Scenario: Nested categories keep one declared source tree
   * Given groups contain leaves and further groups
   * When the layout resolves and is flattened for validation
   * Then every section appears once in order and every leaf uses its owning layer
   */
  test("resolves nested groups and flattens their full declared order", () => {
    const layout = resolveDesignLayoutView(
      local([
        {
          id: "kit",
          title: "Interface kit",
          children: [
            { id: "icons", title: "Icons", source: "icons/Icons.tsx" },
            {
              id: "media",
              title: "Media",
              children: [
                { id: "motion", title: "Motion", source: "motion/rules.md" },
                {
                  id: "preview",
                  title: "Preview",
                  source: "preview/index.html",
                },
              ],
            },
          ],
        },
      ]),
      sources,
    );
    const sections = flattenDesignSections(layout.sections);
    expect(sections.map((section) => section.id)).toEqual([
      "kit",
      "icons",
      "media",
      "motion",
      "preview",
    ]);
    expect(
      sections
        .filter((section) => section.page)
        .map((section) => section.page?.layer),
    ).toEqual(["startup", "startup", "startup"]);
    expect(sections.find((section) => section.id === "motion")?.page?.url).toBe(
      "/workspace-design/startup/motion/rules.md",
    );

    const html = renderToStaticMarkup(
      <DesignRenderer layout={layout} data={data} />,
    );
    const document = new JSDOM(html).window.document;
    expect(
      document.querySelectorAll('nav[aria-label="Interface kit categories"]'),
    ).toHaveLength(1);
    expect(document.querySelectorAll("[data-design-category]")).toHaveLength(3);
    expect(document.getElementById("kit-heading")?.textContent).toBe(
      "Interface kit",
    );
    expect(document.querySelectorAll("[data-design-panel]")).toHaveLength(3);
    expect(
      document.querySelectorAll("[data-design-panel][hidden]"),
    ).toHaveLength(2);
    expect(
      document
        .querySelector('button[aria-controls="design-panel-icons"]')
        ?.getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      document.getElementById("design-panel-motion")?.textContent,
    ).toContain("Motion");
  });

  /** BDD Scenario: Reject ambiguous groups at any depth
   * Given malformed children or an ID repeated across different branches
   * When the layout is parsed
   * Then validation rejects the group before sources are loaded
   */
  test("rejects invalid groups, nested unsafe sources and globally duplicated IDs", () => {
    const leaf = { id: "icons", title: "Icons", source: "icons/Icons.tsx" };
    for (const entry of [
      { id: "kit", title: "Kit", children: [] },
      { id: "kit", title: "Kit", children: null },
      { id: "kit", title: "Kit", children: {} },
      { id: "kit", children: [leaf] },
      { id: "kit", title: " ", children: [leaf] },
      { id: "kit", title: "Kit", source: "kit.html", children: [leaf] },
      { id: "logos", builtin: "logos", title: "Logos", children: [leaf] },
      {
        id: "kit",
        title: "Kit",
        children: [{ ...leaf, source: "../singlepage/icons/Icons.tsx" }],
      },
      { id: "kit", title: "Kit", children: [{ ...leaf, id: "not a safe id" }] },
    ])
      expect(() => local([entry])).toThrow();
    expect(() =>
      local([
        { id: "kit", title: "Kit", children: [leaf] },
        { id: "more", title: "More", children: [leaf] },
      ]),
    ).toThrow("unique");
    expect(() =>
      local([{ id: "kit", title: "Kit", children: [{ ...leaf, id: "kit" }] }]),
    ).toThrow("unique");
  });

  /** BDD Scenario: Nested sources cannot fall through to the base
   * Given the base supplies a nested React page but startup replaces the group
   * When the effective startup layout resolves
   * Then its missing child remains an error despite the base file
   */
  test("preserves atomic layer ownership for nested groups", () => {
    const source = stringify({
      sections: [
        {
          id: "kit",
          title: "Kit",
          children: [
            { id: "icons", title: "Icons", source: "icons/Icons.tsx" },
          ],
        },
      ],
    });
    const base = parseDesignLayout(source, "singlepage")!;
    const startup = parseDesignLayout(source, "startup")!;
    expect(resolveDesignLayout(base, undefined)).toBe(base);
    expect(resolveDesignLayout(base, startup)).toBe(startup);
    const baseSources = {
      ...sources,
      components: {
        "singlepage/icons/Icons.tsx":
          sources.components["startup/icons/Icons.tsx"],
      },
    };
    expect(
      flattenDesignSections(
        resolveDesignLayoutView(base, baseSources).sections,
      )[1].page?.layer,
    ).toBe("singlepage");
    expect(() => resolveDesignLayoutView(startup, baseSources)).toThrow(
      "startup/icons/Icons.tsx",
    );
  });

  /** BDD Scenario: A builtin may live below a group
   * Given a custom template has a nested builtin
   * When the renderer is called without parsed Design data
   * Then it reports the same missing-data error as a top-level builtin
   */
  test("requires parsed data for builtins nested inside custom templates", () => {
    const layout = resolveDesignLayoutView(
      local(
        [
          {
            id: "kit",
            title: "Kit",
            children: [{ id: "colors", builtin: "colors" }],
          },
        ],
        "Layout.tsx",
      ),
      sources,
    );
    expect(() =>
      renderToStaticMarkup(<DesignRenderer layout={layout} />),
    ).toThrow("Built-in Design blocks need parsed Design data");
    expect(
      renderToStaticMarkup(<DesignRenderer layout={layout} data={data} />),
    ).toContain('id="colors"');
  });

  /** BDD Scenario: CLI validation reaches nested files and their real paths
   * Given a group points to a missing file or a link outside its source layer
   * When the filesystem validator runs
   * Then it rejects the child instead of skipping the group or accepting a base file
   */
  test("validates nested files and rejects a symlink into another layer", async () => {
    const root = await mkdtemp(join(tmpdir(), "sps-design-layout-"));
    try {
      await mkdir(join(root, "startup"));
      await mkdir(join(root, "singlepage"));
      await writeFile(join(root, "singlepage", "icons.svg"), "<svg/>");
      const layout = local([
        {
          id: "kit",
          title: "Kit",
          children: [{ id: "icons", title: "Icons", source: "icons.svg" }],
        },
      ]);
      await expect(
        validateDesignLayoutFiles(layout, join(root, "startup")),
      ).rejects.toThrow("Missing Design source: startup/icons.svg");
      await symlink(
        join(root, "singlepage", "icons.svg"),
        join(root, "startup", "icons.svg"),
      );
      await expect(
        validateDesignLayoutFiles(layout, join(root, "startup")),
      ).rejects.toThrow("Design source leaves its layer");
      await rm(join(root, "startup", "icons.svg"));
      await writeFile(join(root, "startup", "icons.svg"), "<svg/>");
      await validateDesignLayoutFiles(layout, join(root, "startup"));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  /** BDD Scenario: Browse categories without resetting specimens
   * Given two mounted categories and a stateful example in the first
   * When a reviewer selects by keyboard, click or hash and downloads the catalogue
   * Then the state survives and the exported HTML includes both categories
   */
  test("keeps panel state, supports category navigation and exports the whole catalogue", async () => {
    const dom = new JSDOM('<div id="root"></div>', {
      url: "http://localhost/iframe.html",
    });
    const globalValues: Record<string, unknown> = {
      window: dom.window,
      document: dom.window.document,
      navigator: dom.window.navigator,
      IS_REACT_ACT_ENVIRONMENT: true,
    };
    const previous = Object.fromEntries(
      Object.keys(globalValues).map((key) => [
        key,
        Object.getOwnPropertyDescriptor(globalThis, key),
      ]),
    );
    for (const [key, value] of Object.entries(globalValues))
      Object.defineProperty(globalThis, key, { configurable: true, value });
    const createUrl = Object.getOwnPropertyDescriptor(URL, "createObjectURL");
    const exports: Promise<string>[] = [];
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: (blob: Blob) => {
        exports.push(blob.text());
        return "blob:design-catalogue";
      },
    });
    dom.window.HTMLAnchorElement.prototype.click = () => {};
    const scrolls: { id: string; hidden: boolean }[] = [];
    dom.window.HTMLElement.prototype.scrollIntoView = function () {
      scrolls.push({ id: this.id, hidden: this.hidden });
    };
    const Counter = () => {
      const [count, setCount] = useState(0);
      return (
        <button type="button" onClick={() => setCount((value) => value + 1)}>
          Count {count}
        </button>
      );
    };
    const layout = resolveDesignLayoutView(
      local(
        [
          {
            id: "kit",
            title: "Interface kit",
            children: [
              { id: "buttons", title: "Buttons", source: "Counter.tsx" },
              { id: "fields", title: "Fields", source: "Fields.tsx" },
            ],
          },
        ],
        "Layout.tsx",
      ),
      {
        ...sources,
        components: {
          "startup/Counter.tsx": { default: Counter },
          "startup/Fields.tsx": {
            default: () => <p>Second category specimen</p>,
          },
        },
      },
    );
    const root = createRoot(dom.window.document.getElementById("root")!);
    const panel = (id: string) =>
      dom.window.document.getElementById(`design-panel-${id}`)!;
    const category = (id: string) =>
      dom.window.document.getElementById(`design-category-${id}`)!;
    try {
      await act(async () => root.render(<DesignRenderer layout={layout} />));
      let panelTop = 96;
      for (const id of ["buttons", "fields"]) {
        const bounds = panel(id).getBoundingClientRect();
        panel(id).getBoundingClientRect = () => ({ ...bounds, top: panelTop });
      }
      expect(panel("buttons").hidden).toBe(false);
      await act(async () =>
        (panel("buttons").querySelector("button") as HTMLButtonElement).click(),
      );
      await act(async () =>
        category("buttons").dispatchEvent(
          new dom.window.KeyboardEvent("keydown", {
            key: "ArrowDown",
            bubbles: true,
          }),
        ),
      );
      expect(panel("buttons").hidden).toBe(true);
      expect(panel("fields").hidden).toBe(false);
      expect(dom.window.document.activeElement).toBe(category("fields"));
      expect(dom.window.location.hash).toBe("#fields");
      expect(scrolls).toHaveLength(0);
      panelTop = -800;
      await act(async () => category("buttons").click());
      expect(panel("buttons").textContent).toContain("Count 1");
      expect(scrolls).toEqual([{ id: "design-panel-buttons", hidden: false }]);
      await act(async () => {
        dom.window.history.replaceState(null, "", "#fields");
        dom.window.dispatchEvent(new dom.window.HashChangeEvent("hashchange"));
      });
      expect(panel("fields").hidden).toBe(false);
      expect(scrolls.at(-1)).toEqual({
        id: "design-panel-fields",
        hidden: false,
      });
      await act(async () =>
        dom.window.dispatchEvent(new dom.window.HashChangeEvent("hashchange")),
      );
      expect(scrolls).toHaveLength(3);
      const mobileSelect = dom.window.document.getElementById(
        "kit-category-select",
      ) as HTMLSelectElement;
      expect(mobileSelect.labels?.[0].textContent).toBe(
        "Interface kit category",
      );
      expect(mobileSelect.value).toBe("fields");
      await act(async () => {
        mobileSelect.value = "buttons";
        mobileSelect.dispatchEvent(
          new dom.window.Event("change", { bubbles: true }),
        );
      });
      expect(panel("buttons").hidden).toBe(false);
      expect(panel("buttons").textContent).toContain("Count 1");
      expect(panel("fields").hidden).toBe(true);
      expect(dom.window.location.hash).toBe("#buttons");
      const showAll = Array.from(
        dom.window.document.querySelectorAll("button"),
      ).find((button) => button.textContent === "Show all")!;
      await act(async () => showAll.click());
      expect(panel("buttons").hidden).toBe(false);
      expect(panel("fields").hidden).toBe(false);
      expect(mobileSelect.value).toBe("");
      await act(async () => {
        mobileSelect.value = "fields";
        mobileSelect.dispatchEvent(
          new dom.window.Event("change", { bubbles: true }),
        );
      });
      expect(panel("buttons").hidden).toBe(true);
      expect(panel("fields").hidden).toBe(false);
      expect(showAll.textContent).toBe("Show all");
      await act(async () => {
        (
          dom.window.document.querySelector(
            '[aria-label="Download HTML"]',
          ) as HTMLButtonElement
        ).click();
      });
      const [download] = await Promise.all(exports);
      const exported = new JSDOM(download).window.document;
      expect(exported.querySelectorAll("[data-design-panel]")).toHaveLength(2);
      expect(
        exported.querySelectorAll("[data-design-panel][hidden]"),
      ).toHaveLength(0);
      expect(exported.body.textContent).toContain("Count 1");
      expect(exported.body.textContent).toContain("Second category specimen");
      expect(exported.querySelector("nav")).toBeNull();
      expect(panel("buttons").hidden).toBe(true);
      expect(category("fields").getAttribute("aria-pressed")).toBe("true");
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      for (const [key, descriptor] of Object.entries(previous)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
      if (createUrl) Object.defineProperty(URL, "createObjectURL", createUrl);
      else Reflect.deleteProperty(URL, "createObjectURL");
    }
  });
});
