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

  it("WHEN model metadata and href are provided THEN title, route, and open link are rendered", () => {
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
      />,
    );

    expect(harness.container.textContent).toContain("product");
    expect(harness.container.textContent).toContain("/api/ecommerce/products");
    expect(harness.container.textContent).toContain("Open model");

    const openLink = harness.container.querySelector(
      'a[href="/admin/ecommerce/product"]',
    );
    expect(openLink).toBeTruthy();
  });

  it("WHEN href is absent THEN open model action content is not rendered", () => {
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
    expect(harness.container.textContent).toContain(
      "/api/ecommerce/attributes",
    );
    expect(harness.container.textContent).not.toContain("Open model");
  });
});

beforeAll(() => {
  enableReactActEnvironment();
});
