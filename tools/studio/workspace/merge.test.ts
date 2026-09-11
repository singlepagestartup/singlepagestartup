/**
 * BDD Suite: Atomic workspace catalogs
 * Given framework and project layers both use complete manifest files
 * When a catalog is resolved
 * Then an empty startup inherits and a non-empty startup replaces the whole base
 */

import { describe, expect, test } from "bun:test";

import { replaceProductCatalog } from "./merge";

describe("atomic workspace catalogs", () => {
  /**
   * BDD Scenario: Keep a complete product catalog together
   * Given a framework catalog and an empty startup catalog
   * When the product-catalog strategy resolves them
   * Then the framework source passes through unchanged
   */
  test("inherits the framework products when startup is empty", () => {
    const base =
      "schema: singlepagestartup.product-catalog.v1\nproducts:\n  - { id: framework-product }\n";
    const overlay =
      "schema: singlepagestartup.product-catalog.v1\nproducts: []\n";

    expect(replaceProductCatalog(base, overlay)).toEqual({
      content: base,
      overlayContributes: false,
    });
  });

  /**
   * BDD Scenario: Replace framework products with project products
   * Given startup declares one project product
   * When the product-catalog strategy resolves it
   * Then no framework product is merged into the project inventory
   */
  test("replaces all products when startup is non-empty", () => {
    const base =
      "schema: singlepagestartup.product-catalog.v1\nproducts:\n  - { id: framework-product }\n";
    const overlay =
      "schema: singlepagestartup.product-catalog.v1\nproducts:\n  - { id: project-product }\n";

    expect(replaceProductCatalog(base, overlay)).toEqual({
      content: overlay,
      overlayContributes: true,
    });
  });

  /**
   * BDD Scenario: Preserve the existing product-catalog behavior
   * Given startup has no product output
   * When the product-catalog strategy resolves it
   * Then it still inherits the framework product source
   */
  test("keeps product-catalog inheritance unchanged", () => {
    const base =
      "schema: singlepagestartup.product-catalog.v1\nproducts:\n  - { id: framework-product }\n";
    const overlay =
      "schema: singlepagestartup.product-catalog.v1\nproducts: []\n";

    expect(replaceProductCatalog(base, overlay).content).toBe(base);
  });
});
