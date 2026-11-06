/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: rbac order line list wrapper behavior.
 *
 * Given: the subject's order line query is controlled by deterministic doubles.
 * When: the query answers nothing or the lines of the subject's orders.
 * Then: the wrapper renders nothing without an answer, and hands the lines to its children,
 * querying with the subject id and the caller's filters.
 */

import { render, screen } from "@testing-library/react";

const ordersToProductsMock = jest.fn();

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    ecommerceModuleOrderOrdersToProducts: (...args: unknown[]) =>
      ordersToProductsMock(...args),
  },
}));

import { Component } from "./client";

describe("Given: the order line list wrapper of a subject", () => {
  beforeEach(() => {
    ordersToProductsMock.mockReset();
  });

  /**
   * BDD Scenario
   * Given: the query has not answered.
   * When: the wrapper renders.
   * Then: it renders nothing.
   */
  it("When: the query answers no data Then: renders nothing", () => {
    ordersToProductsMock.mockReturnValue({ data: undefined });

    const { container } = render(
      <Component
        isServer={false}
        data={{ id: "subject-1" } as any}
        variant="ecommerce-module-order-list-orders-to-products-default"
        language="en"
      />,
    );

    expect(container.innerHTML).toBe("");
  });

  /**
   * BDD Scenario
   * Given: filters for one order and a query answering its line.
   * When: the wrapper renders.
   * Then: it queries the subject's lines with those filters and hands the
   * line to its children.
   */
  it("When: the query answers lines Then: hands them to its children", () => {
    const params = {
      filters: {
        and: [{ column: "orderId", method: "eq", value: "order-1" }],
      },
    };

    ordersToProductsMock.mockReturnValue({
      data: [{ id: "line-1", orderId: "order-1", total: [] }],
    });

    render(
      <Component
        isServer={false}
        data={{ id: "subject-1" } as any}
        variant="ecommerce-module-order-list-orders-to-products-default"
        language="en"
        apiProps={{ params }}
      >
        {({ data }) => (
          <div data-testid="lines">{data.map((line) => line.id).join()}</div>
        )}
      </Component>,
    );

    expect(screen.getByTestId("lines").textContent).toBe("line-1");
    expect(ordersToProductsMock).toHaveBeenCalledWith({
      id: "subject-1",
      params,
    });
  });
});
