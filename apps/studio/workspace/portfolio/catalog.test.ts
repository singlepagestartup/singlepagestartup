/**
 * BDD Suite: Atomic portfolio inheritance
 * Given singlepage has framework directions and startup may define project directions
 * When the resolved portfolio catalog is selected
 * Then an empty startup inherits everything and a non-empty startup replaces everything
 */

import { describe, expect, test } from "bun:test";

import { parsePortfolioCatalog, resolvePortfolioCatalog } from "./catalog";

function portfolio(ids: string[]): string {
  const directions = ids
    .map(
      (id) => `  - id: ${id}
    name: ${id}
    summary: ${id}
    role: product
    lifecycle: active
    research: ${id}/research.md
    sales: ${id}/sales.yaml`,
    )
    .join("\n");
  return `schema: singlepagestartup.portfolio.v1
directions:${directions ? `\n${directions}` : " []"}
`;
}

describe("portfolio catalog", () => {
  /**
   * BDD Scenario: Pass the framework portfolio through
   * Given startup has no directions
   * When default is resolved
   * Then it contains the complete singlepage portfolio
   */
  test("inherits all singlepage directions when startup is empty", () => {
    const singlepage = parsePortfolioCatalog(
      portfolio(["framework-product", "second-product"]),
      "singlepage",
    );
    const startup = parsePortfolioCatalog(portfolio([]), "startup");

    const resolved = resolvePortfolioCatalog(singlepage, startup);

    expect(resolved.inherited).toBe(true);
    expect(resolved.catalog.directions.map(({ id }) => id)).toEqual([
      "framework-product",
      "second-product",
    ]);
  });

  /**
   * BDD Scenario: Replace the framework portfolio atomically
   * Given startup defines its own complete direction inventory
   * When default is resolved
   * Then no singlepage direction remains in default
   */
  test("uses only startup directions when startup is non-empty", () => {
    const singlepage = parsePortfolioCatalog(
      portfolio(["framework-product"]),
      "singlepage",
    );
    const startup = parsePortfolioCatalog(
      portfolio(["client-product"]),
      "startup",
    );

    const resolved = resolvePortfolioCatalog(singlepage, startup);

    expect(resolved.inherited).toBe(false);
    expect(resolved.catalog.directions.map(({ id }) => id)).toEqual([
      "client-product",
    ]);
  });

  /**
   * BDD Scenario: Reject an unmanageable active product
   * Given a direction is marked as an active sellable product
   * When it has no sales-process document
   * Then catalog parsing fails before Studio can present it as ready
   */
  test("requires sales for every active product", () => {
    const source = `schema: singlepagestartup.portfolio.v1
directions:
  - id: incomplete-product
    name: Incomplete product
    summary: Missing sales
    role: product
    lifecycle: active
    research: incomplete-product/research.md
`;

    expect(() => parsePortfolioCatalog(source, "startup")).toThrow(
      "active product incomplete-product needs a sales process",
    );
  });
});
