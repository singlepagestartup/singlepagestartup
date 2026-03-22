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
    const find = jest
      .fn()
      .mockReturnValueOnce({
        data: [{ id: "1" }, { id: "2" }, { id: "3" }],
        isLoading: false,
      })
      .mockReturnValueOnce({
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
        api={{ find } as any}
        Component={({ data }: any) => (
          <div data-testid="rows">{String(data.length)}</div>
        )}
      />,
    );

    expect(find).toHaveBeenNthCalledWith(2, {
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
  });

  it("WHEN searching by title field THEN request uses ilike with localized JSON payload", () => {
    const find = jest
      .fn()
      .mockReturnValueOnce({
        data: [{ id: "1" }],
        isLoading: false,
      })
      .mockReturnValueOnce({
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
        api={{ find } as any}
        Component={() => <div data-testid="ok">ok</div>}
      />,
    );

    expect(find).toHaveBeenNthCalledWith(2, {
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
});
beforeAll(() => {
  enableReactActEnvironment();
});
