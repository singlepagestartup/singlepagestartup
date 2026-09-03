/**
 * BDD Suite: Atomic workspace catalogs
 * Given framework and project layers both use complete manifest files
 * When a catalog is resolved
 * Then an empty startup inherits and a non-empty startup replaces the whole base
 */

import { describe, expect, test } from "bun:test";

import { replacePortfolioCatalog, replaceProductCatalog } from "./merge";

describe("atomic workspace catalogs", () => {
  /**
   * BDD Scenario: Keep a complete portfolio together
   * Given a framework portfolio and an empty startup portfolio
   * When the portfolio-catalog strategy resolves them
   * Then the framework source passes through unchanged
   */
  test("inherits the framework portfolio when startup is empty", () => {
    const base =
      "schema: singlepagestartup.portfolio.v1\ndirections:\n  - { id: framework-product }\n";
    const overlay = "schema: singlepagestartup.portfolio.v1\ndirections: []\n";

    expect(replacePortfolioCatalog(base, overlay)).toEqual({
      content: base,
      overlayContributes: false,
    });
  });

  /**
   * BDD Scenario: Replace a framework portfolio with the project portfolio
   * Given startup declares one project direction
   * When the portfolio-catalog strategy resolves it
   * Then no framework direction is merged into the project inventory
   */
  test("replaces the whole portfolio when startup is non-empty", () => {
    const base =
      "schema: singlepagestartup.portfolio.v1\ndirections:\n  - { id: framework-product }\n";
    const overlay =
      "schema: singlepagestartup.portfolio.v1\ndirections:\n  - { id: project-product }\n";

    expect(replacePortfolioCatalog(base, overlay)).toEqual({
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
