/**
 * BDD Suite: Product-specific sales process
 * Given one active product has a machine-readable sales workflow
 * When Studio parses and renders that workflow
 * Then the product identity, completion rule, fallback, and metric remain explicit
 */

import { describe, expect, test } from "bun:test";

import { parseSalesProcess, salesProcessMarkdown } from "./sales";

const source = `schema: singlepagestartup.sales-process.v1
product_id: framework-product
readiness: blocked
owner: Sales owner
seller: Seller of record
pricing: 100 RUB
capacity: One order per week
blockers:
  - Contract is not approved
stages:
  - id: qualify
    name: Qualify
    owner: Sales owner
    entry_conditions:
      - Contact exists
    required_fields:
      - Need
    action: Verify fit
    exit_condition: Fit is recorded
    failure: Close as not a fit
    metric: Qualified leads per week
`;

describe("sales process", () => {
  /**
   * BDD Scenario: Preserve process controls in the Studio document
   * Given a valid sales-process source for the expected product
   * When it is rendered as Markdown
   * Then the stage exit, fallback, and metric are visible
   */
  test("renders explicit stage controls", () => {
    const process = parseSalesProcess(source, "framework-product");
    const markdown = salesProcessMarkdown(process);

    expect(process.product_id).toBe("framework-product");
    expect(markdown).toContain("Fit is recorded");
    expect(markdown).toContain("Close as not a fit");
    expect(markdown).toContain("Qualified leads per week");
  });

  /**
   * BDD Scenario: Prevent cross-product sales documents
   * Given the active product requests its own sales process
   * When the document declares a different product id
   * Then parsing fails instead of mixing two offers
   */
  test("rejects a sales process from another product", () => {
    expect(() => parseSalesProcess(source, "another-product")).toThrow(
      "must match catalog product another-product",
    );
  });
});
