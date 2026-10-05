/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: rbac product cart button behavior.
 *
 * Given: the subject's cart route and the order-to-product links are mocked with deterministic data.
 * When: the cart button renders for a product.
 * Then: it decides between creating an order and managing the cart order from the
 * subject's own cart route, without the module-level order reads.
 */

import { render, screen } from "@testing-library/react";

const ecommerceModuleOrderListMock = jest.fn();
const ecommerceModuleOrderMock = jest.fn();

const ordersToProducts = [
  { id: "link-1", orderId: "order-1", productId: "product-1" },
  { id: "link-2", orderId: "order-of-another-subject", productId: "product-1" },
];

jest.mock("server-only", () => ({}), { virtual: true });

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: {
    ecommerceModuleOrderList: (...args: unknown[]) =>
      ecommerceModuleOrderListMock(...args),
  },
}));

jest.mock("@sps/ui-adapter", () => ({
  ErrorBoundary: ({ children }: any) => <>{children}</>,
}));

jest.mock(
  "@sps/ecommerce/relations/orders-to-products/frontend/component",
  () => ({
    Component: ({ apiProps, children }: any) => {
      const filters: { column: string; value: string }[] =
        apiProps?.params?.filters?.and || [];

      const data = ordersToProducts.filter((orderToProduct: any) => {
        return filters.every((filter) => {
          return orderToProduct[filter.column] === filter.value;
        });
      });

      return children ? children({ data }) : null;
    },
  }),
);

jest.mock("@sps/ecommerce/models/order/frontend/component", () => ({
  Component: (props: any) => {
    ecommerceModuleOrderMock(props);

    return null;
  },
}));

jest.mock("../../order/create-default/Component", () => ({
  Component: () => <div data-testid="order-create" />,
}));

jest.mock("../../order/update-default/Component", () => ({
  Component: ({ order }: any) => (
    <div data-testid={`order-update-${order.id}`} />
  ),
}));

jest.mock("../../order/delete-default/Component", () => ({
  Component: ({ order }: any) => (
    <div data-testid={`order-delete-${order.id}`} />
  ),
}));

jest.mock("../../order/checkout-default/Component", () => ({
  Component: ({ order }: any) => (
    <div data-testid={`order-checkout-${order.id}`} />
  ),
}));

import { Component } from "./ClientComponent";

function renderCartButton() {
  return render(
    <Component
      isServer={false}
      variant="ecommerce-module-product-cart-default"
      data={{ id: "subject-1" } as any}
      language="en"
      product={{ id: "product-1" } as any}
    />,
  );
}

describe("Given: the product cart button of a subject", () => {
  beforeEach(() => {
    ecommerceModuleOrderListMock.mockReset();
    ecommerceModuleOrderMock.mockReset();
  });

  /**
   * BDD Scenario: manage the cart order that holds the product.
   *
   * Given: the subject's cart route answers one order that holds the product,
   * and another subject's order holds it too.
   * When: the cart button renders.
   * Then: it renders the update, delete and checkout actions for the subject's
   * order only, and never reads orders through the module-level route.
   */
  it("When: the cart holds the product Then: renders the actions from the subject's cart route", () => {
    ecommerceModuleOrderListMock.mockReturnValue({
      data: [{ id: "order-1", type: "cart", status: "new" }],
    });

    renderCartButton();

    expect(ecommerceModuleOrderListMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "subject-1" }),
    );
    expect(screen.getByTestId("order-update-order-1")).toBeTruthy();
    expect(screen.getByTestId("order-delete-order-1")).toBeTruthy();
    expect(screen.getByTestId("order-checkout-order-1")).toBeTruthy();
    expect(screen.queryByTestId("order-create")).toBeNull();
    expect(
      screen.queryByTestId("order-update-order-of-another-subject"),
    ).toBeNull();
    expect(ecommerceModuleOrderMock).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: offer to create an order for an empty cart.
   *
   * Given: the subject's cart route answers no order.
   * When: the cart button renders.
   * Then: it offers to create an order.
   */
  it("When: the cart is empty Then: offers to create an order", () => {
    ecommerceModuleOrderListMock.mockReturnValue({ data: [] });

    renderCartButton();

    expect(screen.getByTestId("order-create")).toBeTruthy();
    expect(ecommerceModuleOrderMock).not.toHaveBeenCalled();
  });
});
