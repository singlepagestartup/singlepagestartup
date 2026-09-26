/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: ecommerce order line amounts.
 *
 * Given: an order and its lines read through the subject's own routes, and order and order
 * line reads that require the Admin role.
 * When: the order is rendered through the orders-to-products-quantity-default variant.
 * Then: each line it is handed is rendered through the amount variant, and neither the order
 * nor its lines are requested.
 */

import { render, screen } from "@testing-library/react";

const findByIdMock = jest.fn();
const ordersToProductsVariantMock = jest.fn();

jest.mock("server-only", () => ({}), { virtual: true });

jest.mock("@sps/ecommerce/models/order/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: {
    findById: (...args: unknown[]) => findByIdMock(...args),
  },
}));

jest.mock(
  "@sps/ecommerce/relations/orders-to-products/frontend/component",
  () => ({
    Component: ({ variant, data, children }: any) => {
      ordersToProductsVariantMock(variant);

      if (variant === "amount") {
        return children ? children({ data: `amount-of-${data.id}` }) : null;
      }

      return null;
    },
  }),
);

import { Component } from "@sps/ecommerce/models/order/frontend/component";

describe("Given: an order and its lines read through the subject's routes", () => {
  beforeEach(() => {
    findByIdMock.mockReset();
    findByIdMock.mockReturnValue({ data: undefined, isLoading: true });
    ordersToProductsVariantMock.mockReset();
  });

  /**
   * BDD Scenario
   * Given: the cart hands the variant an order with two lines.
   * When: the variant renders.
   * Then: it renders one amount per line and requests neither the order nor
   * its lines.
   */
  it("When: the variant renders Then: it renders an amount for each line it is handed", () => {
    render(
      <Component
        isServer={false}
        variant="orders-to-products-quantity-default"
        data={{ id: "order-1", type: "cart", status: "new" } as any}
        ordersToProducts={
          [
            { id: "line-1", orderId: "order-1", productId: "product-1" },
            { id: "line-2", orderId: "order-1", productId: "product-2" },
          ] as any
        }
        language="en"
      />,
    );

    expect(screen.getByText("amount-of-line-1")).toBeTruthy();
    expect(screen.getByText("amount-of-line-2")).toBeTruthy();
    expect(findByIdMock).not.toHaveBeenCalled();
    expect(ordersToProductsVariantMock.mock.calls.map(([v]) => v)).toEqual([
      "amount",
      "amount",
    ]);
  });
});
