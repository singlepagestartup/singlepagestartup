import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { stringify } from "yaml";
import {
  parseProductCatalog,
  resolveProductCatalog,
  productDocumentEntries,
  productMaterialStoryGroups,
} from "./catalog";
import {
  validateProductCatalogFiles,
  validateProductSectionFiles,
} from "../../../../../tools/studio/products/validate";
import path from "node:path";
const root = path.resolve(import.meta.dir, "../../products");
const base = parseProductCatalog(
  readFileSync(path.join(root, "singlepage/catalog.yaml"), "utf8"),
  "singlepage",
);
const source = (products: unknown[], extra = {}) =>
  stringify({
    schema: "singlepagestartup.product-catalog.v2",
    products,
    ...extra,
  });
describe("current product catalog", () => {
  test("real products resolve every declared source", async () => {
    expect(base.products.map((p) => p.id)).toEqual([
      "singlepagestartup",
      "ai-chat",
    ]);
    await validateProductCatalogFiles(base, path.join(root, "singlepage"));
    await validateProductSectionFiles(base, path.join(root, "singlepage"));
    for (const product of base.products) {
      expect(productDocumentEntries(product).map((d) => d.id)).toEqual([
        "product",
        "audience",
        "competitors",
        "semantics",
        "economics",
        "sales",
      ]);
      expect(
        productMaterialStoryGroups(product).map((g) => g.id),
      ).not.toContain("launch-plan");
    }
  });
  test("an empty startup inherits the entire catalog; its first product replaces it", () => {
    expect(
      resolveProductCatalog(base, parseProductCatalog(source([]), "startup"))
        .catalog,
    ).toBe(base);
    const own = parseProductCatalog(source([base.products[1]]), "startup");
    expect(resolveProductCatalog(base, own)).toEqual({
      catalog: own,
      inherited: false,
    });
  });
  test("only the current schema and fields are accepted", () => {
    expect(() =>
      parseProductCatalog(
        "schema: singlepagestartup.product-catalog.v1\nproducts: []",
        "startup",
      ),
    ).toThrow("unsupported schema");
    expect(() =>
      parseProductCatalog(source([], { models: [] }), "startup"),
    ).toThrow("unknown field models");
    for (const key of [
      "research",
      "model",
      "content",
      "video",
      "presentation_data",
      "website_component",
    ])
      expect(() =>
        parseProductCatalog(
          source([{ ...base.products[0], [key]: "unused" }]),
          "startup",
        ),
      ).toThrow(`unknown field ${key}`);
  });
  test("requires all six visible working documents and rejects a hidden research section", () => {
    for (const key of [
      "product",
      "audience",
      "competitors",
      "semantics",
      "economics",
      "sales",
    ]) {
      const product: Record<string, unknown> = { ...base.products[0] };
      delete product[key];
      expect(() => parseProductCatalog(source([product]), "startup")).toThrow(
        `${key} must be a safe layer-relative path`,
      );
    }
    expect(() =>
      parseProductCatalog(
        source([
          {
            ...base.products[0],
            sections: [
              {
                id: "research",
                title: "Research",
                pages: [
                  {
                    id: "notes",
                    title: "Notes",
                    source: "singlepagestartup/notes.md",
                  },
                ],
              },
            ],
          },
        ]),
        "startup",
      ),
    ).toThrow("research belongs in visible");
  });
  test("rejects ambiguous or unsafe artifact ownership", () => {
    const page = (extra = {}) => ({
      ...base.products[0],
      sections: [
        {
          id: "website",
          title: "Сайт",
          pages: [
            {
              id: "landing",
              title: "Страница",
              source: "singlepagestartup/website/Landing.tsx",
              ...extra,
            },
          ],
        },
      ],
    });
    expect(() =>
      parseProductCatalog(
        source([
          page({ representations: { text: "singlepagestartup/text.md" } }),
        ]),
        "startup",
      ),
    ).toThrow("unknown page field");
    expect(() =>
      parseProductCatalog(
        source([page({ source: "ai-chat/website/Landing.tsx" })]),
        "startup",
      ),
    ).toThrow("inside its product");
    expect(() =>
      parseProductCatalog(
        source([page({ source: "../private.md" })]),
        "startup",
      ),
    ).toThrow("safe layer-relative");
  });
});
