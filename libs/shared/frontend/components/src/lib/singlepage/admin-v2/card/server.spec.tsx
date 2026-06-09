/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: admin-v2 card server data integration.
 *
 * Given: a server-side admin-v2 card wrapper receives a count-capable API.
 * When: the wrapper renders.
 * Then: it loads entity count through the shared count method and passes it to the child card.
 */

import { Component } from "./server";
import {
  cleanupHarness,
  createDomHarness,
  enableReactActEnvironment,
  renderInHarness,
  TDomHarness,
} from "../test-utils/dom-harness";

jest.mock("server-only", () => ({}), { virtual: true });

describe("GIVEN: admin-v2 card server data integration", () => {
  let harness: TDomHarness;

  beforeEach(() => {
    harness = createDomHarness();
  });

  afterEach(() => {
    cleanupHarness(harness);
  });

  /**
   * BDD Scenario: loads card count on the server.
   *
   * Given: apiProps include count filters and custom headers.
   * When: the server card wrapper renders.
   * Then: it calls api.count with no-store headers and renders the returned count.
   */
  it("WHEN apiProps are provided THEN api.count is called and count is passed to child", async () => {
    const filters = {
      and: [
        {
          column: "status",
          method: "eq",
          value: "active",
        },
      ],
    };
    const count = jest.fn().mockResolvedValue(11);
    const find = jest.fn();

    const element = await Component({
      variant: "admin-v2-card",
      isServer: true,
      module: "ecommerce",
      name: "product",
      type: "model",
      apiRoute: "/api/ecommerce/products",
      href: "/admin/ecommerce/product",
      api: { count, find } as any,
      apiProps: {
        params: { filters },
        options: {
          headers: {
            Authorization: "Bearer test",
          },
        },
      },
      Component: ({ count }) => <div data-testid="count">{count}</div>,
      Skeleton: () => <div />,
    });

    renderInHarness(harness, element);

    expect(count).toHaveBeenCalledWith({
      params: { filters },
      options: {
        headers: {
          Authorization: "Bearer test",
          "Cache-Control": "no-store",
        },
      },
    });
    expect(find).not.toHaveBeenCalled();
    expect(
      harness.container.querySelector("[data-testid=count]")?.textContent,
    ).toBe("11");
  });

  /**
   * BDD Scenario: keeps count fallback on the server.
   *
   * Given: api.count returns no numeric data.
   * When: the server card wrapper renders.
   * Then: it passes 0 to the child card.
   */
  it("WHEN api.count has no data THEN count falls back to 0", async () => {
    const count = jest.fn().mockResolvedValue(undefined);

    const element = await Component({
      variant: "admin-v2-card",
      isServer: true,
      api: { count } as any,
      Component: ({ count }) => <div data-testid="count">{count}</div>,
      Skeleton: () => <div />,
    });

    renderInHarness(harness, element);

    expect(
      harness.container.querySelector("[data-testid=count]")?.textContent,
    ).toBe("0");
  });
});

beforeAll(() => {
  enableReactActEnvironment();
});
