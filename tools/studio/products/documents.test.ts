import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  validateDocumentStructure,
  validateMaterialJourney,
  validateVisibleLinks,
  moduleStoryIds,
} from "./documents";
import { parseSalesProcess } from "../../../apps/studio/workspace/utils/products/sales";

const sales = parseSalesProcess(
  readFileSync(
    new URL("./fixtures/startup/example/sales.yaml", import.meta.url),
    "utf8",
  ),
  "example",
);
const material = (segment: string, stage: string) =>
  `---\njourney:\n  segment: ${segment}\n  stage: ${stage}\n---\n# Material\n\nVisible content.\n`;

describe("visible product document contracts", () => {
  test("requires the fixed section order and rejects extra, missing or duplicated sections", () => {
    const template =
      "# Document\n\n<!-- ## Not a section -->\n\n## Audience\n\n## Result\n";
    expect(() =>
      validateDocumentStructure(
        "# Test\n\n## Audience\nKnown audience.\n\n### Detail\nMore evidence.\n\n## Result\nUseful result.\n",
        template,
        "test.md",
      ),
    ).not.toThrow();
    for (const body of [
      "## Result\n## Audience",
      "## Audience",
      "## Audience\n## Result\n## Tasks",
      "## Audience\n## Result\n## Result",
    ])
      expect(() =>
        validateDocumentStructure(body, template, "test.md"),
      ).toThrow("разделы должны совпадать");
  });

  test("ties each material to an existing segment and stage of its own sales process", () => {
    expect(() =>
      validateMaterialJourney(
        material("learners", "choose-course"),
        sales,
        "website.md",
      ),
    ).not.toThrow();
    for (const source of [
      "# Missing journey",
      material("unknown", "choose-course"),
      material("learners", "unknown"),
    ])
      expect(() =>
        validateMaterialJourney(source, sales, "website.md"),
      ).toThrow("существующий этап продаж");
  });

  test("links to visible stories and resources, not hidden research files", () => {
    const stories = new Set([
      "workspace-10-products-startup-example--semantics",
    ]);
    const link =
      "/?path=/story/workspace-10-products-startup-example--semantics#спрос";
    expect(() =>
      validateVisibleLinks(
        `[Спрос](${link})\n[Источник](https://example.com/report.csv)\n[Логотип](/workspace-assets/logo.svg)\n[Раздел](#результат)`,
        "article.md",
        stories,
      ),
    ).not.toThrow();
    for (const href of [
      "research.md",
      "../research/wordstat.csv",
      "/workspace-products/startup/example/hidden.md#source",
      "details.yaml",
      "./Preview.tsx",
    ])
      expect(() =>
        validateVisibleLinks(`[Link](${href})`, "article.md", stories),
      ).toThrow("скрытый исходник");
    expect(() =>
      validateVisibleLinks(
        "[Missing](/?path=/story/workspace-10-products-startup-missing--product)",
        "article.md",
        stories,
      ),
    ).toThrow("неизвестная история");
  });
});

// A material may reuse a module's reviewed page; the link must resolve to a real export.
test("accepts existing module stories and rejects absent variants", async () => {
  const stories = await moduleStoryIds(
    new URL(
      "../../../apps/studio/modules/host/page/singlepage/framework",
      import.meta.url,
    ).pathname,
  );
  const id = "modules-host-models-page-singlepage-framework--default";
  expect(stories.has(id)).toBe(true);
  expect(() =>
    validateVisibleLinks(
      `[Landing](/?path=/story/${id})`,
      "website.md",
      stories,
    ),
  ).not.toThrow();
  expect(() =>
    validateVisibleLinks(
      `[Missing](/?path=/story/${id}-missing)`,
      "website.md",
      stories,
    ),
  ).toThrow("неизвестная история");
});
