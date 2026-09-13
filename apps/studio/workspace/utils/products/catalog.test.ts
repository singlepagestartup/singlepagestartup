/**
 * BDD Suite: Atomic product-catalog inheritance
 * Given singlepage has framework products and startup may define downstream products
 * When default resolves its product catalog
 * Then an empty startup inherits everything and a non-empty startup replaces everything
 */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { parseProductCatalog, resolveProductCatalog } from "./catalog";

function catalog(ids: string[]): string {
  if (!ids.length) {
    return "schema: singlepagestartup.product-catalog.v1\nproducts: []\n";
  }
  return `schema: singlepagestartup.product-catalog.v1\nproducts:\n${ids
    .map(
      (id) =>
        `  - { id: ${id}, name: ${id}, summary: ${id}, research: ${id}/research.md, sales: ${id}/sales.yaml, product: ${id}/product.md, website: ${id}/website.md, marketing_creative: ${id}/marketing-creative.md, presentation: ${id}/presentation/ProjectPresentation.tsx, presentation_data: ${id}/presentation/data.yaml }`,
    )
    .join("\n")}\n`;
}

describe("product catalog", () => {
  /**
   * BDD Scenario: Restore both client-confirmed framework products
   * Given the live framework catalog and an empty startup catalog
   * When the default catalog is resolved
   * Then Code Framework and AI Chat both remain available
   */
  test("retains both client-confirmed products in the live catalog", () => {
    const base = parseProductCatalog(
      readFileSync(
        new URL("../../products/singlepage/catalog.yaml", import.meta.url),
        "utf8",
      ),
      "singlepage",
    );
    const resolved = resolveProductCatalog(
      base,
      parseProductCatalog(
        readFileSync(
          new URL("../../products/startup/catalog.yaml", import.meta.url),
          "utf8",
        ),
        "startup",
      ),
    );
    expect(resolved.catalog.products.map(({ id }) => id)).toEqual([
      "singlepagestartup",
      "ai-chat",
    ]);
    expect(
      base.products.every((product) =>
        product.presentation_data?.endsWith("/presentation/data.yaml"),
      ),
    ).toBe(true);
  });

  /**
   * BDD Scenario: Replace every real framework product with one client product
   * Given singlepage contains Code Framework and AI Chat
   * When startup defines its first product
   * Then default contains only that product and its startup-owned sources
   */
  test("replaces the two real products with the first startup product", () => {
    const base = parseProductCatalog(
      readFileSync(
        new URL("../../products/singlepage/catalog.yaml", import.meta.url),
        "utf8",
      ),
      "singlepage",
    );
    const resolved = resolveProductCatalog(
      base,
      parseProductCatalog(catalog(["client-service"]), "startup"),
    );
    expect(resolved.catalog.layer).toBe("startup");
    expect(resolved.catalog.products.map(({ id }) => id)).toEqual([
      "client-service",
    ]);
    expect(resolved.catalog.products[0].presentation_data).toBe(
      "client-service/presentation/data.yaml",
    );
  });
  /**
   * BDD Scenario: Keep the complete product context in one folder
   * Given an independently owned startup product
   * When its catalog is parsed
   * Then Research and Sales resolve to that product's own source paths
   */
  test("keeps research and sales with the selected product", () => {
    const parsed = parseProductCatalog(catalog(["course"]), "startup");

    expect(parsed.products[0].research).toBe("course/research.md");
    expect(parsed.products[0].sales).toBe("course/sales.yaml");
  });

  /**
   * BDD Scenario: Reject incomplete product context
   * Given a product without its Research or Sales reference
   * When the catalog is parsed
   * Then it fails instead of inheriting another product's inputs
   */
  test("rejects products missing research or sales", () => {
    for (const reference of [
      "research: course/research.md, ",
      "sales: course/sales.yaml, ",
    ]) {
      expect(() =>
        parseProductCatalog(
          catalog(["course"]).replace(reference, ""),
          "startup",
        ),
      ).toThrow();
    }
  });

  /**
   * BDD Scenario: Pass the framework catalog through
   * Given startup has no products
   * When default is resolved
   * Then it contains the complete singlepage catalog
   */
  test("inherits all singlepage products when startup is empty", () => {
    const singlepage = parseProductCatalog(
      catalog(["one", "two"]),
      "singlepage",
    );
    const startup = parseProductCatalog(catalog([]), "startup");
    const resolved = resolveProductCatalog(singlepage, startup);

    expect(resolved.inherited).toBe(true);
    expect(resolved.catalog.products.map(({ id }) => id)).toEqual([
      "one",
      "two",
    ]);
  });

  /**
   * BDD Scenario: Replace the framework catalog atomically
   * Given startup defines one product
   * When default is resolved
   * Then no singlepage product remains in default
   */
  test("uses only startup products when startup is non-empty", () => {
    const singlepage = parseProductCatalog(
      catalog(["one", "two"]),
      "singlepage",
    );
    const startup = parseProductCatalog(catalog(["client-product"]), "startup");
    const resolved = resolveProductCatalog(singlepage, startup);

    expect(resolved.inherited).toBe(false);
    expect(resolved.catalog.products.map(({ id }) => id)).toEqual([
      "client-product",
    ]);
  });

  /**
   * BDD Scenario: Add optional product-local review surfaces
   * Given a startup product has a rendered website and flexible content
   * When its catalog is parsed
   * Then both safe component paths remain attached to that product
   */
  test("keeps optional website and content surfaces product-local", () => {
    const source = catalog(["course"]).replace(
      "presentation: course/presentation/ProjectPresentation.tsx",
      "presentation: course/presentation/ProjectPresentation.tsx, website_component: course/website/Website.tsx, content: course/content/Content.tsx",
    );
    const parsed = parseProductCatalog(source, "startup");

    expect(parsed.products[0].website_component).toBe(
      "course/website/Website.tsx",
    );
    expect(parsed.products[0].content).toBe("course/content/Content.tsx");
  });

  /**
   * BDD Scenario: Read a catalog created before the Content migration
   * Given a product still declares its optional surface as video
   * When the v1 catalog is parsed
   * Then the path is exposed through the generic content contract
   */
  test("maps the legacy video surface to content", () => {
    const source = catalog(["course"]).replace(
      "presentation: course/presentation/ProjectPresentation.tsx",
      "presentation: course/presentation/ProjectPresentation.tsx, video: course/video/Video.tsx",
    );
    const parsed = parseProductCatalog(source, "startup");

    expect(parsed.products[0].content).toBe("course/video/Video.tsx");
  });
});
