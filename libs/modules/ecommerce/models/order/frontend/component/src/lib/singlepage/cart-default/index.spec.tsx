/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: ecommerce order cart card.
 *
 * Given: an order and its lines read through the subject's own routes, and order and order
 * line reads that require the Admin role.
 * When: the order is rendered through the cart-default variant with its lines.
 * Then: the card renders each line's quantity, product and totals from what it is handed and
 * never requests the order or its lines.
 */

import { render, screen } from "@testing-library/react";

const findByIdMock = jest.fn();
const ordersToProductsMock = jest.fn();

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
    Component: (props: any) => {
      ordersToProductsMock(props);

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

const ordersToProducts = [
  {
    id: "line-1",
    orderId: "order-1",
    productId: "product-1",
    quantity: 2,
    total: [
      {
        total: 20,
        billingModuleCurrency: { id: "currency-usd", symbol: "$" },
      },
      {
        total: 18,
        billingModuleCurrency: { id: "currency-eur", symbol: "€" },
      },
    ],
  },
];

describe("Given: an order and its lines read through the subject's routes", () => {
  beforeEach(() => {
    findByIdMock.mockReset();
    findByIdMock.mockReturnValue({ data: undefined, isLoading: true });
    ordersToProductsMock.mockReset();
  });

  /**
   * BDD Scenario
   * Given: the cart hands the variant a complete order and its lines with totals.
   * When: the cart-default variant renders them.
   * Then: the card shows the line's quantity, product and totals and requests
   * neither the order nor its lines.
   */
  it("When: the cart card renders Then: it uses the order and the lines it is handed", () => {
    render(
      <Component
        isServer={false}
        variant="cart-default"
        data={{ id: "order-1", type: "cart", status: "new" } as any}
        ordersToProducts={ordersToProducts as any}
        language="en"
      >
        <div data-testid="cart-actions" />
      </Component>,
    );

    expect(screen.getByText("Order #order-1")).toBeTruthy();
    expect(screen.getByText("Quantity: 2")).toBeTruthy();
    expect(screen.getByText("20 $")).toBeTruthy();
    expect(screen.getByText("18 €")).toBeTruthy();
    expect(screen.getByTestId("product-cart-default")).toBeTruthy();
    expect(screen.getByTestId("cart-actions")).toBeTruthy();
    expect(findByIdMock).not.toHaveBeenCalled();
    expect(ordersToProductsMock).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: the cart selects one currency.
   * When: the cart-default variant renders the lines.
   * Then: only that currency's total is shown and the card is marked available.
   */
  it("When: a currency is selected Then: shows that currency's total only", () => {
    const { container } = render(
      <Component
        isServer={false}
        variant="cart-default"
        data={{ id: "order-1", type: "cart", status: "new" } as any}
        ordersToProducts={ordersToProducts as any}
        billingModuleCurrencyId="currency-eur"
        language="en"
      />,
    );

    expect(screen.getByText("18 €")).toBeTruthy();
    expect(screen.queryByText("20 $")).toBeNull();
    expect(
      container
        .querySelector('[data-model="order"]')
        ?.getAttribute("data-available"),
    ).toBe("true");
  });
});
