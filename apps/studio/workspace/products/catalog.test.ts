/**
 * BDD Suite: Atomic product-catalog inheritance
 * Given singlepage has framework products and startup may define downstream products
 * When default resolves its product catalog
 * Then an empty startup inherits everything and a non-empty startup replaces everything
 */

import { describe, expect, test } from "bun:test";

import { parseProductCatalog, resolveProductCatalog } from "./catalog";

function catalog(ids: string[]): string {
  if (!ids.length) {
    return "schema: singlepagestartup.product-catalog.v1\nproducts: []\n";
  }
  return `schema: singlepagestartup.product-catalog.v1\nproducts:\n${ids
    .map(
      (id) =>
        `  - { id: ${id}, name: ${id}, summary: ${id}, product: ${id}/product.md, website: ${id}/website.md, marketing_creative: ${id}/marketing-creative.md, presentation: ${id}/presentation/ProjectPresentation.tsx }`,
    )
    .join("\n")}\n`;
}

describe("product catalog", () => {
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
});
