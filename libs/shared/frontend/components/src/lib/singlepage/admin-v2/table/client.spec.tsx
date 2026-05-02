/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: admin-v2 table client integration.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { Component } from "./client";
import {
  cleanupHarness,
  createDomHarness,
  enableReactActEnvironment,
  renderInHarness,
  TDomHarness,
} from "../test-utils/dom-harness";

const useTableContextMock = jest.fn();

jest.mock("../table-controller/Context", () => ({
  useTableContext: () => useTableContextMock(),
}));

describe("GIVEN: admin-v2 table client integration", () => {
  let harness: TDomHarness;

  beforeEach(() => {
    useTableContextMock.mockReset();
    harness = createDomHarness();
  });

  afterEach(() => {
    cleanupHarness(harness);
  });

  it("WHEN searching by UUID in id field THEN request uses eq and updates total state", () => {
    const setState = jest.fn();
    const count = jest.fn().mockReturnValue({
      data: 9,
      isLoading: false,
    });
    const find = jest.fn().mockReturnValue({
      data: [{ id: "1" }],
      isLoading: false,
    });

    useTableContextMock.mockReturnValue({
      debouncedSearch: "11111111-1111-1111-1111-111111111111",
      selectedField: "id",
      searchField: "id",
      offset: 20,
      limit: 10,
      setState,
    });

    renderInHarness(
      harness,
      <Component
        variant="admin-v2-table"
        isServer={false}
        api={{ count, find } as any}
        Component={({ data }: any) => (
          <div data-testid="rows">{String(data.length)}</div>
        )}
      />,
    );

    expect(count).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "eq",
              value: "11111111-1111-1111-1111-111111111111",
            },
          ],
        },
      },
      options: {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    });

    expect(find).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "eq",
              value: "11111111-1111-1111-1111-111111111111",
            },
          ],
        },
        offset: 20,
        limit: 10,
      },
      options: {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    });

    expect(
      harness.container.querySelector('[data-testid="rows"]')?.textContent,
    ).toBe("1");
    expect(setState).toHaveBeenCalled();
    expect(setState.mock.calls[0][0]({ total: 0 })).toEqual({ total: 9 });
  });

  it("WHEN searching by title field THEN request uses ilike with localized JSON payload", () => {
    const count = jest.fn().mockReturnValue({
      data: 1,
      isLoading: false,
    });
    const find = jest.fn().mockReturnValue({
      data: [{ id: "1" }],
      isLoading: false,
    });

    useTableContextMock.mockReturnValue({
      debouncedSearch: "desk",
      selectedField: "title",
      searchField: "title",
      offset: 0,
      limit: 5,
      setState: jest.fn(),
    });

    renderInHarness(
      harness,
      <Component
        variant="admin-v2-table"
        isServer={false}
        api={{ count, find } as any}
        Component={() => <div data-testid="ok">ok</div>}
      />,
    );

    expect(count).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "title",
              method: "ilike",
              value: JSON.stringify({ ru: "desk", en: "desk" }),
            },
          ],
        },
      },
      options: {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    });

    expect(find).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "title",
              method: "ilike",
              value: JSON.stringify({ ru: "desk", en: "desk" }),
            },
          ],
        },
        offset: 0,
        limit: 5,
      },
      options: {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    });

    expect(harness.container.querySelector('[data-testid="ok"]')).toBeTruthy();
  });

  /**
   * BDD Scenario: count preserves table API props.
   *
   * Given: table apiProps include base filters and transport options.
   * When: the client table loads entities without a search term.
   * Then: count receives filters only and both count/find preserve options with no-store headers.
   */
  it("WHEN apiProps include filters and options THEN count and find preserve them", () => {
    const setState = jest.fn();
    const baseFilter = {
      column: "tenantId",
      method: "eq",
      value: "tenant-1",
    };
    const count = jest.fn().mockReturnValue({
      data: 3,
      isLoading: false,
    });
    const find = jest.fn().mockReturnValue({
      data: [{ id: "1" }],
      isLoading: false,
    });

    useTableContextMock.mockReturnValue({
      debouncedSearch: "",
      selectedField: "id",
      searchField: "id",
      offset: 0,
      limit: 25,
      setState,
    });

    renderInHarness(
      harness,
      <Component
        variant="admin-v2-table"
        isServer={false}
        api={{ count, find } as any}
        apiProps={{
          params: {
            filters: {
              and: [baseFilter],
            },
          },
          options: {
            headers: {
              Authorization: "Bearer test",
            },
            next: {
              tags: ["attributes"],
            },
          },
        }}
        Component={() => <div data-testid="ok">ok</div>}
      />,
    );

    expect(count).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [baseFilter],
        },
      },
      options: {
        headers: {
          Authorization: "Bearer test",
          "Cache-Control": "no-store",
        },
        next: {
          tags: ["attributes"],
        },
      },
    });

    expect(find).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [baseFilter],
        },
        offset: 0,
        limit: 25,
      },
      options: {
        headers: {
          Authorization: "Bearer test",
          "Cache-Control": "no-store",
        },
        next: {
          tags: ["attributes"],
        },
      },
    });

    expect(harness.container.querySelector("[data-testid=ok]")).toBeTruthy();
    expect(setState).toHaveBeenCalled();
    expect(setState.mock.calls[0][0]({ total: 0 })).toEqual({ total: 3 });
  });
});
beforeAll(() => {
  enableReactActEnvironment();
});
