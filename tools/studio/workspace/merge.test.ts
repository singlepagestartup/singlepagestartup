/**
 * BDD Suite: Atomic workspace catalogs
 * Given framework and project layers both use complete manifest files
 * When a catalog is resolved
 * Then an empty startup inherits and a non-empty startup replaces the whole base
 */

import { describe, expect, test } from "bun:test";

import { mergeMarkdown, replaceProductCatalog } from "./merge";

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

describe("markdown overlay presence", () => {
  const base =
    "# Brief\n\n## Shared direction\n\nFramework direction.\n\n## Client detail\n\nFramework default.\n";

  /**
   * BDD Scenario: Ignore an overlay made of headings and comments
   * Given a startup document contains only template headings and HTML comments
   * When it is merged over the framework source
   * Then the framework document passes through unchanged
   */
  test("passes the base through when the overlay has no content", () => {
    const overlay =
      "# Brief\n\n## Shared direction\n\n<!-- todo -->\n\n## Client detail\n\n<!-- nested comment -->\n";

    expect(mergeMarkdown(base, overlay)).toMatchObject({
      content: base,
      overlayContributes: false,
    });
  });

  /**
   * BDD Scenario: Let a written section win without rewriting either source
   * Given a startup section carries text beside comments and headings
   * When it is merged over the framework source
   * Then only that section is replaced and the other base section is retained
   */
  test("replaces only the sections that carry content", () => {
    const overlay =
      "# Brief\n\n## Shared direction\n\n<!-- keep -->\n\n## Client detail\n\nClient override.\n";

    const merged = mergeMarkdown(base, overlay);

    expect(merged.overlayContributes).toBe(true);
    expect(merged.content).toContain("Framework direction.");
    expect(merged.content).toContain("Client override.");
    expect(merged.content).not.toContain("Framework default.");
  });
});
