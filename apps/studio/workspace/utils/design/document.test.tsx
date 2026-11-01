import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { designDocumentNotes, validateDesignDocument } from "./document";
import { projectDesignData } from "./data";
import {
  parseDesignLayout,
  resolveDesignLayoutView,
  flattenDesignSections,
} from "./layout";
import { DesignRenderer } from "../components/DesignRenderer";
import LivingFocus from "../../design/singlepage/LivingFocus";
import ProjectDesign from "../components/ProjectDesign";
import type { IStudioWorkspace } from "../types";

const document = readFileSync(
  new URL("../../design/singlepage.md", import.meta.url),
  "utf8",
);
const assets = readFileSync(
  new URL("../../assets/singlepage.yaml", import.meta.url),
  "utf8",
);
const layout = parseDesignLayout(
  readFileSync(
    new URL("../../design/singlepage/layout.yaml", import.meta.url),
    "utf8",
  ),
  "singlepage",
)!;
const workspace: IStudioWorkspace = {
  id: "singlepage",
  label: "SinglePageStartup",
  activeLayer: "singlepage",
  workspaceRoot: "apps/studio/workspace",
  imports: [],
  exports: [],
  artifacts: [
    ["design", document],
    ["asset-index", assets],
  ].map(([kind, content]) => ({
    id: `singlepage.${kind}`,
    kind,
    content,
    description: kind,
    inherited: false,
    layer: "singlepage" as const,
    resolution: "local" as const,
    sourceIds: [],
    sourcePath: "",
    sourcePaths: [],
    usedBy: [],
    uses: [],
  })),
};

describe("fixed Design document and adjacent rules", () => {
  test("matches the fixed template and rejects a silently omitted section", () => {
    const template = readFileSync(
      new URL("../../../../../.agents/templates/design.md", import.meta.url),
      "utf8",
    );
    expect(() => validateDesignDocument(document)).not.toThrow();
    expect(() => validateDesignDocument(template)).not.toThrow();
    expect(() =>
      validateDesignDocument(
        document + "\n## Another hidden appendix\nDo this too.\n",
      ),
    ).toThrow("Структура Дизайна");
    expect(() =>
      validateDesignDocument(
        document.replace("### Требования к производству", "### Другие правила"),
      ),
    ).toThrow("Структура Дизайна");
    for (const value of Object.values(designDocumentNotes(document)))
      expect(value.length).toBeGreaterThan(0);
  });

  test("the reusable default layout keeps the same complete rules", () => {
    const data = projectDesignData(workspace, "singlepage");
    const html = renderToStaticMarkup(<ProjectDesign data={data} />);
    const dom = new JSDOM(html).window.document;
    expect(dom.querySelectorAll('[data-design-rules="overview"]')).toHaveLength(
      1,
    );
    expect(
      dom.querySelector('[data-design-rules="interface"]')?.textContent,
    ).toContain("Формы, коллекции и связанные записи");
    expect(
      dom.querySelector('[data-design-rules="icons"]')?.textContent,
    ).toContain("Phosphor");
    expect(html).not.toContain("Общая графика");
    expect(html).not.toContain("font-style:italic");
  });

  test("renders each rule beside its actual specimens without a repeated document", async () => {
    const components = Object.fromEntries(
      await Promise.all(
        flattenDesignSections(layout.sections)
          .filter((s) => s.source)
          .map(async (s) => [
            `singlepage/${s.source}`,
            await import(
              new URL(`../../design/singlepage/${s.source}`, import.meta.url)
                .href
            ),
          ]),
      ),
    );
    const view = resolveDesignLayoutView(layout, {
      components,
      templates: { "singlepage/LivingFocus.tsx": { default: LivingFocus } },
      markdown: {},
      files: new Set(),
    });
    const html = renderToStaticMarkup(
      <DesignRenderer
        layout={view}
        data={projectDesignData(workspace, "singlepage")}
        document={document}
      />,
    );
    const dom = new JSDOM(html).window.document;
    const rules = [...dom.querySelectorAll("[data-design-rules]")];
    expect(rules.map((el) => el.getAttribute("data-design-rules"))).toEqual([
      "overview",
      "logos",
      "colors",
      "typography",
      "interface",
      "icons",
      "photography",
      "illustration",
    ]);
    for (const section of [
      "overview",
      "logos",
      "colors",
      "typography",
      "photography",
      "illustration",
    ]) {
      expect(
        dom
          .querySelector(`[data-design-rules="${section}"]`)
          ?.closest("section")?.id,
      ).toBe(section);
    }
    expect(
      dom.querySelector('[data-design-rules="interface"]')?.closest("section")
        ?.id,
    ).toBe("interface-kit");
    expect(
      dom
        .querySelector('[data-design-rules="icons"]')
        ?.closest("[data-specimen]")
        ?.getAttribute("data-specimen"),
    ).toBe("icons");
    expect(
      dom.querySelectorAll("[data-pattern-guidance]").length,
    ).toBeGreaterThanOrEqual(8);
    expect(
      dom.querySelector('[data-design-rules="colors"]')?.textContent,
    ).toContain("11.99:1");
    expect(
      dom.querySelector('[data-design-rules="typography"]')?.textContent,
    ).toContain("Размер / интерлиньяж");
    expect(
      dom.querySelector('[data-design-rules="interface"]')?.textContent,
    ).toContain("Формы, коллекции и связанные записи");
    expect(
      dom.querySelector('[data-design-rules="icons"]')?.textContent,
    ).toContain("singlepage-phosphor-icons-mit-license");
    expect(dom.querySelector("#photography blockquote")?.textContent).toContain(
      "Естественная редакционная фотография",
    );
    expect(dom.querySelectorAll("#photography img")).toHaveLength(5);
    expect(dom.querySelectorAll("#illustration img")).toHaveLength(3);
    expect(html).not.toContain("Правила применения");
    expect(html).not.toContain("Общая графика");
    expect(html).not.toContain("design-rules-heading");
    expect(html).not.toContain("specification.md");
    expect(html).not.toContain("proposal_id");
  });
});

test("renders both media systems and semantic colors from the current Design data", () => {
  const data = projectDesignData(workspace, "singlepage");
  const html = renderToStaticMarkup(<ProjectDesign data={data} />);
  const dom = new JSDOM(html).window.document;
  for (const family of ["photography", "illustration"] as const) {
    const section = dom.getElementById(family);
    expect(section).not.toBeNull();
    expect(section!.textContent).toContain(data[family].masterPrompt);
    for (const rule of data[family].productionRules)
      expect(section!.textContent).toContain(rule);
    for (const example of data[family].examples)
      expect(section!.textContent).toContain(example.title);
  }
  expect(data.typographyRoles.length).toBeGreaterThan(0);
  for (const role of data.colorRoles) expect(html).toContain(role.light);
});
