/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: admin-v2 table-row client UI component.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { act } from "react";
import { Component } from "./ClientComponent";
import { TableContext, TableContextType } from "../table-controller/Context";
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

function findButtonByText(container: HTMLDivElement, text: string) {
  return Array.from(container.querySelectorAll("button")).find((button) =>
    button.textContent?.includes(text),
  ) as HTMLButtonElement | undefined;
}

function createTableContextState(
  overrides: Partial<TableContextType> = {},
): TableContextType {
  return {
    search: "",
    debouncedSearch: "",
    offset: 0,
    limit: 100,
    searchField: "id",
    selectedField: "id",
    total: 0,
    selectedRowIds: [],
    visibleRowIds: [],
    bulkDeletePending: false,
    ...overrides,
  };
}

describe("GIVEN: admin-v2 table-row client UI component", () => {
  let harness: TDomHarness;

  beforeEach(() => {
    harness = createDomHarness();
  });

  afterEach(() => {
    cleanupHarness(harness);
  });

  it("WHEN row type is model THEN preview action is displayed", () => {
    renderInHarness(
      harness,
      <Component
        isServer={false}
        variant="admin-v2-table-row"
        module="ecommerce"
        name="product"
        type="model"
        data={
          {
            id: "row-1",
            adminTitle: "Product Row",
            slug: "product-row",
            variant: "default",
          } as any
        }
      />,
    );

    expect(harness.container.textContent).toContain("Preview");
  });

  it("WHEN row type is relation THEN preview action is hidden and relation-style action layout is used", () => {
    renderInHarness(
      harness,
      <Component
        isServer={false}
        variant="admin-v2-table-row"
        module="ecommerce"
        name="products-to-attributes"
        type="relation"
        data={
          {
            id: "row-2",
            adminTitle: "Relation Row",
            slug: "relation-row",
            variant: "default",
          } as any
        }
      />,
    );

    expect(harness.container.textContent).not.toContain("Preview");
    const actionContainer = harness.container.querySelector(
      "article > div > div:last-child",
    ) as HTMLDivElement | null;
    expect(actionContainer?.className).toContain("flex-col");
    expect(actionContainer?.className).toContain("gap-2");
  });

  it("WHEN edit/left/right actions are opened THEN each callback form receives {data,isServer:false}", () => {
    const adminForm = jest.fn(() => <div data-testid="admin-form">Admin</div>);
    const leftModelAdminForm = jest.fn(() => (
      <div data-testid="left-form">Left</div>
    ));
    const rightModelAdminForm = jest.fn(() => (
      <div data-testid="right-form">Right</div>
    ));

    renderInHarness(
      harness,
      <Component
        isServer={false}
        variant="admin-v2-table-row"
        module="ecommerce"
        name="product"
        type="model"
        data={
          {
            id: "row-3",
            adminTitle: "Action Row",
            slug: "action-row",
            variant: "default",
          } as any
        }
        adminForm={adminForm as any}
        leftModelAdminForm={leftModelAdminForm as any}
        rightModelAdminForm={rightModelAdminForm as any}
        leftModelAdminFormLabel="Left Model"
        rightModelAdminFormLabel="Right Model"
      />,
    );

    const editButton = findButtonByText(harness.container, "Edit");
    const leftButton = findButtonByText(harness.container, "Left Model");
    const rightButton = findButtonByText(harness.container, "Right Model");

    expect(editButton).toBeTruthy();
    expect(leftButton).toBeTruthy();
    expect(rightButton).toBeTruthy();

    act(() => {
      editButton?.click();
    });
    act(() => {
      leftButton?.click();
    });
    act(() => {
      rightButton?.click();
    });

    expect(adminForm).toHaveBeenCalledWith({
      data: expect.objectContaining({ id: "row-3" }),
      isServer: false,
    });
    expect(leftModelAdminForm).toHaveBeenCalledWith({
      data: expect.objectContaining({ id: "row-3" }),
      isServer: false,
    });
    expect(rightModelAdminForm).toHaveBeenCalledWith({
      data: expect.objectContaining({ id: "row-3" }),
      isServer: false,
    });

    expect(
      harness.container.querySelector('[data-testid="admin-form"]'),
    ).toBeTruthy();
    expect(
      harness.container.querySelector('[data-testid="left-form"]'),
    ).toBeTruthy();
    expect(
      harness.container.querySelector('[data-testid="right-form"]'),
    ).toBeTruthy();
  });

  it("WHEN delete is confirmed THEN onDelete callback is called", () => {
    const onDelete = jest.fn();

    renderInHarness(
      harness,
      <Component
        isServer={false}
        variant="admin-v2-table-row"
        module="ecommerce"
        name="product"
        type="model"
        data={
          {
            id: "row-4",
            adminTitle: "Delete Row",
            slug: "delete-row",
            variant: "default",
          } as any
        }
        onDelete={onDelete}
      />,
    );

    const deleteTrigger = findButtonByText(harness.container, "Delete");
    expect(deleteTrigger).toBeTruthy();

    act(() => {
      deleteTrigger?.click();
    });

    const confirmButton = harness.container.querySelector(
      '[data-testid="alert-action"]',
    ) as HTMLButtonElement | null;
    expect(confirmButton).toBeTruthy();

    act(() => {
      confirmButton?.click();
    });

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: table row selection uses shared table context.
   *
   * Given: a row is rendered inside an admin-v2 table context.
   * When: its selection checkbox is checked.
   * Then: the row id is added to selected row ids without blocking row actions.
   */
  it("WHEN row checkbox is checked THEN row id is added to table selection", () => {
    const setState = jest.fn();
    const state = createTableContextState({
      visibleRowIds: ["row-6"],
    });

    renderInHarness(
      harness,
      <TableContext.Provider value={[state, setState]}>
        <Component
          isServer={false}
          variant="admin-v2-table-row"
          module="ecommerce"
          name="product"
          type="model"
          data={
            {
              id: "row-6",
              adminTitle: "Selectable Row",
              slug: "selectable-row",
              variant: "default",
            } as any
          }
        />
      </TableContext.Provider>,
    );

    const checkbox = harness.container.querySelector(
      'input[aria-label="Select row row-6"]',
    ) as HTMLInputElement | null;
    expect(checkbox).toBeTruthy();
    expect(harness.container.textContent).toContain("Preview");

    act(() => {
      checkbox!.click();
    });

    const selectionUpdate = setState.mock.calls.at(-1)?.[0];
    expect(selectionUpdate(state)).toEqual({
      ...state,
      selectedRowIds: ["row-6"],
    });
  });

  it("WHEN children are not provided THEN fallback fields and values are rendered", () => {
    renderInHarness(
      harness,
      <Component
        isServer={false}
        variant="admin-v2-table-row"
        module="ecommerce"
        name="product"
        type="model"
        data={
          {
            id: "row-5",
            adminTitle: "Fallback Admin",
            slug: "fallback-slug",
            variant: "fallback-variant",
          } as any
        }
      />,
    );

    expect(harness.container.textContent).toContain("Admin Title");
    expect(harness.container.textContent).toContain("Fallback Admin");
    expect(harness.container.textContent).toContain("Slug");
    expect(harness.container.textContent).toContain("fallback-slug");
    expect(harness.container.textContent).toContain("Variant");
    expect(harness.container.textContent).toContain("fallback-variant");
  });
});

beforeAll(() => {
  enableReactActEnvironment();
});
