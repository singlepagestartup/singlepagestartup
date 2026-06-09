/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: admin-v2 card client data integration.
 *
 * Given: a client-side admin-v2 card wrapper receives a count-capable API.
 * When: the wrapper renders.
 * Then: it loads entity count through the shared count method and passes it to the child card.
 */

import { Component } from "./client";
import {
  cleanupHarness,
  createDomHarness,
  enableReactActEnvironment,
  renderInHarness,
  TDomHarness,
} from "../test-utils/dom-harness";

jest.mock("client-only", () => ({}), { virtual: true });

describe("GIVEN: admin-v2 card client data integration", () => {
  let harness: TDomHarness;

  beforeEach(() => {
    harness = createDomHarness();
  });

  afterEach(() => {
    cleanupHarness(harness);
  });

  /**
   * BDD Scenario: loads card count on the client.
   *
   * Given: apiProps include count filters and custom headers.
   * When: the client card wrapper renders.
   * Then: it calls api.count with no-store headers and renders the returned count.
   */
  it("WHEN apiProps are provided THEN api.count is called and count is passed to child", () => {
    const filters = {
      and: [
        {
          column: "status",
          method: "eq",
          value: "active",
        },
      ],
    };
    const count = jest.fn().mockReturnValue({
      data: 7,
      isLoading: false,
    });

    renderInHarness(
      harness,
      <Component
        variant="admin-v2-card"
        isServer={false}
        api={{ count } as any}
        apiProps={{
          params: { filters },
          options: {
            headers: {
              Authorization: "Bearer test",
            },
          },
        }}
        Component={({ count }) => <div data-testid="count">{count}</div>}
      />,
    );

    expect(count).toHaveBeenCalledWith({
      params: { filters },
      options: {
        headers: {
          Authorization: "Bearer test",
          "Cache-Control": "no-store",
        },
      },
    });
    expect(
      harness.container.querySelector("[data-testid=count]")?.textContent,
    ).toBe("7");
  });

  /**
   * BDD Scenario: keeps count fallback on the client.
   *
   * Given: api.count has not returned numeric data.
   * When: the client card wrapper renders.
   * Then: it passes 0 to the child card.
   */
  it("WHEN api.count has no data THEN count falls back to 0", () => {
    const count = jest.fn().mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderInHarness(
      harness,
      <Component
        variant="admin-v2-card"
        isServer={false}
        api={{ count } as any}
        Component={({ count }) => <div data-testid="count">{count}</div>}
      />,
    );

    expect(
      harness.container.querySelector("[data-testid=count]")?.textContent,
    ).toBe("0");
  });
});

beforeAll(() => {
  enableReactActEnvironment();
});
