import { describe, expect, test } from "bun:test";
import {
  parseDocument,
  renderDocument,
  hasMarkdownContent,
  documentReviewBody,
} from "./document";
import { mergeMarkdown, mergeWorkspaceContent } from "./merge";
describe("workspace documents", () => {
  test("preserves ordinary metadata and content", () => {
    const source = "---\naudience: founders\n---\n\n# Описание\n\nСодержание.";
    expect(
      parseDocument(renderDocument(parseDocument(source))).metadata,
    ).toEqual({ audience: "founders" });
    expect(documentReviewBody(source, true)).toBe("Содержание.");
  });
  test("inherits empty startup sections and replaces only supplied content", () => {
    const base = "# Бриф\n\n## Цель\n\nЗапуск.\n\n## Условия\n\nКод MIT.";
    expect(mergeMarkdown(base, "").content).toBe(base);
    const result = mergeMarkdown(base, "# Бриф\n\n## Цель\n\nНовая цель.");
    expect(result.content).toContain("Новая цель.");
    expect(result.content).toContain("Код MIT.");
    expect(result.content).not.toContain("Запуск.");
  });
  test("keeps a product catalog atomic", () => {
    const base =
      "schema: singlepagestartup.product-catalog.v2\nproducts: [{id: framework}]\n";
    const empty =
      "schema: singlepagestartup.product-catalog.v2\nproducts: []\n";
    expect(
      mergeWorkspaceContent({
        base,
        overlay: empty,
        kind: "products",
        sourcePath: "catalog.yaml",
        strategy: "product-catalog",
      }).content,
    ).toBe(base);
  });
  test("ignores headings and comments when deciding whether content exists", () => {
    expect(hasMarkdownContent("# Title\n<!-- placeholder -->")).toBe(false);
    expect(hasMarkdownContent("# Title\n\nContent")).toBe(true);
    expect(
      documentReviewBody("<!-- source -->\n# Title\n\n## Section\nText", true),
    ).toContain("## Section");
  });
});
