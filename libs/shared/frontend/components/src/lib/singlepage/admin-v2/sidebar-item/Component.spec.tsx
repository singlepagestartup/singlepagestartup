/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: admin-v2 sidebar-item component.
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

describe("GIVEN: admin-v2 sidebar-item component", () => {
  let harness: TDomHarness;

  beforeEach(() => {
    harness = createDomHarness();
  });

  afterEach(() => {
    cleanupHarness(harness);
  });

  it("WHEN model item is active THEN href is composed with ADMIN_BASE_PATH and active styling/attributes are applied", () => {
    renderInHarness(
      harness,
      <Component
        isServer={false}
        variant="admin-v2-sidebar-item"
        module="ecommerce"
        name="product"
        type="model"
        isActive={true}
      />,
    );

    const link = harness.container.querySelector(
      'a[href="/admin/ecommerce/product"]',
    ) as HTMLAnchorElement | null;
    expect(link).toBeTruthy();
    expect(link?.getAttribute("data-module")).toBe("ecommerce");
    expect(link?.getAttribute("data-model")).toBe("product");
    expect(link?.className).toContain("border-slate-900");
    expect(link?.className).toContain("bg-slate-900");
  });

  it("WHEN relation item is inactive THEN inactive styling and relation semantic attribute are applied", () => {
    renderInHarness(
      harness,
      <Component
        isServer={false}
        variant="admin-v2-sidebar-item"
        module="ecommerce"
        name="products-to-attributes"
        type="relation"
        isActive={false}
      />,
    );

    const link = harness.container.querySelector(
      'a[href="/admin/ecommerce/products-to-attributes"]',
    ) as HTMLAnchorElement | null;
    expect(link).toBeTruthy();
    expect(link?.getAttribute("data-relation")).toBe("products-to-attributes");
    expect(link?.className).toContain("border-transparent");
  });
});

beforeAll(() => {
  enableReactActEnvironment();
});
