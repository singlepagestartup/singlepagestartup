/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: ecommerce order cart card.
 *
 * Given: an order read through the subject's own cart route, and order reads by id
 * that require the Admin role.
 * When: the order is rendered through the cart-default variant.
 * Then: the card renders from the order it is handed and never requests the order again.
 */

import { render, screen } from "@testing-library/react";

const findByIdMock = jest.fn();

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
    Component: ({ variant, children }: any) => {
      if (variant === "find") {
        return children
          ? children({
              data: [
                {
                  id: "order-to-product-1",
                  orderId: "order-1",
                  productId: "product-1",
                  quantity: 2,
                },
              ],
            })
          : null;
      }

      if (variant === "id-total-default") {
        return children
          ? children({
              data: [
                {
                  total: 20,
                  billingModuleCurrency: { id: "currency-1", symbol: "$" },
                },
              ],
            })
          : null;
      }

      return null;
    },
  }),
);

jest.mock("@sps/ecommerce/models/product/frontend/component", () => ({
  Component: ({ variant, children }: any) => {
    if (variant === "find") {
      return children ? children({ data: [{ id: "product-1" }] }) : null;
    }

    return <div data-testid={`product-${variant}`} />;
  },
}));

import { Component } from "@sps/ecommerce/models/order/frontend/component";

describe("Given: an order read through the subject's cart route", () => {
  beforeEach(() => {
    findByIdMock.mockReset();
    findByIdMock.mockReturnValue({ data: undefined, isLoading: true });
  });

  /**
   * BDD Scenario
   * Given: the cart hands the variant a complete order.
   * When: the cart-default variant renders it.
   * Then: the card shows the order and its product line without an order request by id.
   */
  it("When: the cart card renders Then: it uses the order it is handed", () => {
    render(
      <Component
        isServer={false}
        variant="cart-default"
        data={{ id: "order-1", type: "cart", status: "new" } as any}
        language="en"
      >
        <div data-testid="cart-actions" />
      </Component>,
    );

    expect(screen.getByText("Order #order-1")).toBeTruthy();
    expect(screen.getByText("Quantity: 2")).toBeTruthy();
    expect(screen.getByTestId("cart-actions")).toBeTruthy();
    expect(findByIdMock).not.toHaveBeenCalled();
  });
});
