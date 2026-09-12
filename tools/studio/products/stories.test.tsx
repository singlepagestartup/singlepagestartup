/**
 * BDD Suite: Product navigation in the Storybook sidebar.
 * Given: product catalogs can inherit or replace their source layer.
 * When: Studio derives its stories and opens one product.
 * Then: every product has stable source views without a second product selector or model menu.
 */
import { describe, expect, test } from "bun:test";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { stringify } from "yaml";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductCatalog } from "../../../apps/studio/workspace/utils/components/ProductCatalog";
import type { IProductCatalogView } from "../../../apps/studio/workspace/utils/products/source";
import { productStoryEntries, syncProductStories } from "./stories";

const catalog = (entries: Record<string, string>) =>
  stringify({
    schema: "singlepagestartup.product-catalog.v2",
    models: Object.keys(entries).length
      ? [{ id: "shared", name: "Shared", source: "models/shared/model.md" }]
      : [],
    products: Object.entries(entries).map(([id, name]) => ({
      id,
      model: "shared",
      name,
      summary: `${name} summary`,
      product: `${id}/product.md`,
      research: `${id}/research.md`,
      sales: `${id}/sales.yaml`,
    })),
  });

describe("product sidebar", () => {
  /** BDD Scenario: Source-first navigation. Given: base and client products, including a repeated ID. When: sidebar entries are derived. Then: each product stays under its owning layer and default creates no branch. */
  test("groups only each layer's products under singlepage and startup", () => {
    const base = catalog({ course: "Course", coaching: "Coaching" });
    const inherited = productStoryEntries(base, catalog({}));
    expect(inherited.map(({ layer, id }) => [layer, id])).toEqual([
      ["singlepage", "course"],
      ["singlepage", "coaching"],
    ]);
    expect(
      inherited.every(
        ({ title }) => title === "Workspace/40 Products/singlepage",
      ),
    ).toBe(true);
    const separate = productStoryEntries(
      base,
      catalog({ course: "Client / Course", service: "Service" }),
    );
    expect(separate.map(({ layer, id }) => [layer, id])).toEqual([
      ["singlepage", "course"],
      ["singlepage", "coaching"],
      ["startup", "course"],
      ["startup", "service"],
    ]);
    expect(separate[0].storyId).toBe(
      "workspace-40-products-singlepage--product-course",
    );
    expect(separate[2].storyId).toBe(
      "workspace-40-products-startup--product-course",
    );
    expect(separate[2].name).toContain("Client / Course");
    expect(separate.some(({ title }) => title.includes("default"))).toBe(false);
  });

  /** BDD Scenario: Empty and populated source navigation. Given: derived stories. When: a startup product appears and is removed. Then: only that source changes and its empty state remains discoverable. */
  test("keeps an empty startup visible without inheriting base product stories", () => {
    const root = mkdtempSync(path.join(tmpdir(), "sps-product-stories-"));
    try {
      for (const layer of ["singlepage", "startup"])
        mkdirSync(path.join(root, "products", layer), { recursive: true });
      const basePath = path.join(root, "products/singlepage/catalog.yaml");
      const localPath = path.join(root, "products/startup/catalog.yaml");
      const output = path.join(root, "generated");
      writeFileSync(basePath, catalog({ course: "Course" }));
      writeFileSync(localPath, catalog({}));
      syncProductStories(root, output);
      const baseFile = path.join(output, "singlepage.stories.tsx");
      const localFile = path.join(output, "startup.stories.tsx");
      const modified = statSync(baseFile).mtimeMs;
      expect(readdirSync(output).sort()).toEqual([
        "singlepage.stories.tsx",
        "startup.stories.tsx",
      ]);
      expect(readFileSync(localFile, "utf8")).toContain("export const Empty");
      expect(readFileSync(localFile, "utf8")).not.toContain(
        'productId: "course"',
      );
      expect(readFileSync(baseFile, "utf8")).not.toContain(
        "export const Default",
      );
      writeFileSync(localPath, catalog({ client: "Client" }));
      syncProductStories(root, output);
      expect(statSync(baseFile).mtimeMs).toBe(modified);
      expect(readFileSync(localFile, "utf8")).toContain('productId: "client"');
      expect(readFileSync(localFile, "utf8")).not.toContain(
        "export const Empty",
      );
      writeFileSync(localPath, catalog({}));
      writeFileSync(
        path.join(output, "old-product.stories.tsx"),
        "obsolete navigation",
      );
      syncProductStories(root, output);
      expect(readFileSync(localFile, "utf8")).toContain("export const Empty");
      expect(readdirSync(output).sort()).toEqual([
        "singlepage.stories.tsx",
        "startup.stories.tsx",
      ]);
      expect(readFileSync(localPath, "utf8")).toBe(catalog({}));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  const view: IProductCatalogView = {
    id: "default",
    label: "default",
    inherited: true,
    sourcePaths: ["catalog.yaml"],
    products: ["course", "coaching"].map((id) => ({
      id,
      name: id,
      summary: `${id} definition`,
      sections: [],
      model: {
        id: "shared",
        name: "Shared model",
        products: ["course", "coaching"],
      },
      documents: [
        {
          kind: "product",
          label: "Product",
          sourcePath: `${id}/product.md`,
          content: `# Product\n\n${id} complete offer`,
          confirmation: {
            confirmed: false,
            state: "unconfirmed",
            layer: "singlepage",
          },
        },
      ],
    })),
  };
  /** BDD Scenario: Open one product. Given: a shared model and multiple products. When: its story renders. Then: only the selected offer and document navigation appear. */
  test("renders the selected product without duplicate navigation", () => {
    const html = renderToStaticMarkup(
      <ProductCatalog view={view} productId="coaching" />,
    );
    expect(html).toContain("coaching complete offer");
    expect(html).not.toContain("course complete offer");
    expect(html).not.toContain('aria-label="Products"');
    expect(html).not.toContain("<details");
    expect(html).not.toContain("Customer Segments</button>");
    expect(html).toContain('aria-label="Product documents"');
  });
  /** BDD Scenario: Product absent from selected layer. Given: a base-only product after startup replacement. When: its default view opens. Then: the UI explains absence instead of falling back to another product. */
  test("never substitutes an unrelated product in a source view", () => {
    const html = renderToStaticMarkup(
      <ProductCatalog view={view} productId="base-only" />,
    );
    expect(html).toContain("Product absent from this catalog");
    expect(html).not.toContain("complete offer");
  });
});
