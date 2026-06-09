/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: admin-v2 card component.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { Component } from "./Component";
import {
  cleanupHarness,
  createDomHarness,
  enableReactActEnvironment,
  renderInHarness,
  TDomHarness,
} from "../test-utils/dom-harness";

jest.mock("@sps/shared-ui-shadcn", () => {
  return jest.requireActual("../test-utils/shadcn-mocks").adminV2ShadcnMocks;
});

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={typeof href === "string" ? href : String(href)} {...props}>
      {children}
    </a>
  ),
}));

describe("GIVEN: admin-v2 card component", () => {
  let harness: TDomHarness;

  beforeEach(() => {
    harness = createDomHarness();
  });

  afterEach(() => {
    cleanupHarness(harness);
  });

  /**
   * BDD Scenario: renders model card metadata.
   *
   * Given: model metadata, count, route, and href are provided.
   * When: the card renders.
   * Then: title, count badge, route, and open link are visible.
   */
  it("WHEN model metadata, count, and href are provided THEN title, count, route, and open link are rendered", () => {
    renderInHarness(
      harness,
      <Component
        isServer={false}
        variant="admin-v2-card"
        module="ecommerce"
        name="product"
        type="model"
        apiRoute="/api/ecommerce/products"
        href="/admin/ecommerce/product"
        count={42}
      />,
    );

    expect(harness.container.textContent).toContain("product");
    expect(harness.container.textContent).toContain("42");
    expect(harness.container.textContent).toContain("/api/ecommerce/products");
    expect(harness.container.textContent).toContain("Open model");

    const openLink = harness.container.querySelector("a");
    expect(openLink?.getAttribute("href")).toBe("/admin/ecommerce/product");
  });

  /**
   * BDD Scenario: keeps count fallback.
   *
   * Given: the card receives metadata without count or href.
   * When: the card renders.
   * Then: the badge falls back to 0 and the open action stays empty.
   */
  it("WHEN count and href are absent THEN count falls back to 0 and open model action content is not rendered", () => {
    renderInHarness(
      harness,
      <Component
        isServer={false}
        variant="admin-v2-card"
        module="ecommerce"
        name="attribute"
        type="model"
        apiRoute="/api/ecommerce/attributes"
      />,
    );

    expect(harness.container.textContent).toContain("attribute");
    expect(harness.container.textContent).toContain("0");
    expect(harness.container.textContent).toContain(
      "/api/ecommerce/attributes",
    );
    expect(harness.container.textContent).not.toContain("Open model");
  });
});

beforeAll(() => {
  enableReactActEnvironment();
});
