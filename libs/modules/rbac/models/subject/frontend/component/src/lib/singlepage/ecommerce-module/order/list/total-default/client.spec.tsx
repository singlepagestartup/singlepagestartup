/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: rbac order list total wrapper behavior.
 *
 * Given: total query hook is controlled by deterministic doubles.
 * When: query returns empty or populated totals.
 * Then: wrapper renders nothing for empty response and forwards totals to children when data exists.
 */

import { render, screen } from "@testing-library/react";

const totalMock = jest.fn();

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    ecommerceModuleOrderTotal: (...args: unknown[]) => totalMock(...args),
  },
}));

import { Component } from "./client";

describe("Given: order list total wrapper", () => {
  beforeEach(() => {
    totalMock.mockReset();
  });

  it("When: total query returns no data Then: wrapper renders null", () => {
    totalMock.mockReturnValue({ data: undefined });

    const { container } = render(
      <Component
        data={{ id: "subject-1" } as any}
        variant="ecommerce-module-order-list-total-default"
      />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("When: total query returns values Then: wrapper forwards totals to children", () => {
    totalMock.mockReturnValue({
      data: [{ total: 100, billingModuleCurrency: { symbol: "$" } }],
    });

    render(
      <Component
        data={{ id: "subject-1" } as any}
        variant="ecommerce-module-order-list-total-default"
      >
        {({ data }: any) => <div data-testid="totals">{data.length}</div>}
      </Component>,
    );

    expect(screen.queryByTestId("totals")?.textContent).toBe("1");
    expect(totalMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "subject-1" }),
    );
  });
});
