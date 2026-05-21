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
import { act } from "react";
import {
  cleanupHarness,
  createDomHarness,
  enableReactActEnvironment,
  renderInHarness,
  TDomHarness,
} from "../test-utils/dom-harness";

const useTableContextMock = jest.fn();

jest.mock("@sps/shared-ui-shadcn", () => {
  return jest.requireActual("../test-utils/shadcn-mocks").adminV2ShadcnMocks;
});

jest.mock("../table-controller/Context", () => ({
  useTableContext: () => useTableContextMock(),
}));

function createApi(params: {
  count: jest.Mock;
  find: jest.Mock;
  mutateAsync?: jest.Mock;
}) {
  return {
    count: params.count,
    find: params.find,
    delete: jest.fn(() => ({
      mutateAsync: params.mutateAsync ?? jest.fn().mockResolvedValue(undefined),
    })),
  };
}

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
        api={createApi({ count, find }) as any}
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
        api={createApi({ count, find }) as any}
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
        api={createApi({ count, find }) as any}
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

  /**
   * BDD Scenario: table exposes current-page selection actions.
   *
   * Given: table context knows the visible row ids for the current page.
   * When: the select-visible checkbox is checked.
   * Then: selected row ids are set to the visible current-page ids only.
   */
  it("WHEN select visible rows is checked THEN selected row ids match visible row ids", () => {
    const setState = jest.fn();
    const count = jest.fn().mockReturnValue({
      data: 2,
      isLoading: false,
    });
    const find = jest.fn().mockReturnValue({
      data: [{ id: "row-1" }, { id: "row-2" }],
      isLoading: false,
    });

    useTableContextMock.mockReturnValue({
      debouncedSearch: "",
      selectedField: "id",
      searchField: "id",
      offset: 0,
      limit: 25,
      total: 2,
      selectedRowIds: [],
      visibleRowIds: ["row-1", "row-2"],
      bulkDeletePending: false,
      setState,
    });

    renderInHarness(
      harness,
      <Component
        variant="admin-v2-table"
        isServer={false}
        api={createApi({ count, find }) as any}
        Component={() => <div data-testid="ok">ok</div>}
      />,
    );

    const checkbox = harness.container.querySelector(
      'input[aria-label="Select visible rows"]',
    ) as HTMLInputElement | null;
    expect(checkbox).toBeTruthy();

    act(() => {
      checkbox!.click();
    });

    const selectionUpdate = setState.mock.calls.at(-1)?.[0];
    expect(
      selectionUpdate({
        selectedRowIds: [],
        visibleRowIds: ["row-1", "row-2"],
      }),
    ).toEqual({
      selectedRowIds: ["row-1", "row-2"],
      visibleRowIds: ["row-1", "row-2"],
    });
  });

  /**
   * BDD Scenario: table deletes selected current-page rows in bulk.
   *
   * Given: two visible rows are selected.
   * When: the bulk delete confirmation action is clicked.
   * Then: the existing delete mutation is called once per selected row id.
   */
  it("WHEN bulk delete is confirmed THEN delete mutation is called for each selected visible row", async () => {
    const setState = jest.fn();
    const mutateAsync = jest.fn().mockResolvedValue(undefined);
    const count = jest.fn().mockReturnValue({
      data: 2,
      isLoading: false,
    });
    const find = jest.fn().mockReturnValue({
      data: [{ id: "row-1" }, { id: "row-2" }],
      isLoading: false,
    });

    useTableContextMock.mockReturnValue({
      debouncedSearch: "",
      selectedField: "id",
      searchField: "id",
      offset: 0,
      limit: 25,
      total: 2,
      selectedRowIds: ["row-1", "row-2"],
      visibleRowIds: ["row-1", "row-2"],
      bulkDeletePending: false,
      setState,
    });

    renderInHarness(
      harness,
      <Component
        variant="admin-v2-table"
        isServer={false}
        api={createApi({ count, find, mutateAsync }) as any}
        Component={() => <div data-testid="ok">ok</div>}
      />,
    );

    const triggerButton = Array.from(
      harness.container.querySelectorAll("button"),
    ).find((button) => button.textContent?.includes("Delete selected"));
    expect(triggerButton).toBeTruthy();

    act(() => {
      triggerButton!.click();
    });

    const confirmButton = harness.container.querySelector(
      '[data-testid="alert-action"]',
    ) as HTMLButtonElement | null;
    expect(confirmButton).toBeTruthy();

    await act(async () => {
      confirmButton!.click();
      await Promise.resolve();
    });

    expect(mutateAsync).toHaveBeenCalledTimes(2);
    expect(mutateAsync).toHaveBeenCalledWith({ id: "row-1" });
    expect(mutateAsync).toHaveBeenCalledWith({ id: "row-2" });

    const clearSelectionUpdate = setState.mock.calls.at(-1)?.[0];
    expect(
      clearSelectionUpdate({
        selectedRowIds: ["row-1", "row-2"],
        bulkDeletePending: true,
      }),
    ).toEqual({
      selectedRowIds: [],
      bulkDeletePending: false,
    });
  });
});
beforeAll(() => {
  enableReactActEnvironment();
});
