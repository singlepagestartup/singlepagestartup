/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: rbac product cart button behavior.
 *
 * Given: the subject's cart route and the subject's order line route are mocked with deterministic data.
 * When: the cart button renders for a product.
 * Then: it decides between creating an order and managing the cart order from the
 * subject's own routes, without the module-level order and order line reads.
 */

import { render, screen } from "@testing-library/react";

const ecommerceModuleOrderListMock = jest.fn();
const ecommerceModuleOrderOrdersToProductsMock = jest.fn();
const ecommerceModuleOrderMock = jest.fn();
const ecommerceModuleOrdersToProductsMock = jest.fn();

jest.mock("server-only", () => ({}), { virtual: true });

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: {
    ecommerceModuleOrderList: (...args: unknown[]) =>
      ecommerceModuleOrderListMock(...args),
    ecommerceModuleOrderOrdersToProducts: (...args: unknown[]) =>
      ecommerceModuleOrderOrdersToProductsMock(...args),
  },
}));

jest.mock("@sps/ui-adapter", () => ({
  ErrorBoundary: ({ children }: any) => <>{children}</>,
}));

jest.mock(
  "@sps/ecommerce/relations/orders-to-products/frontend/component",
  () => ({
    Component: (props: any) => {
      ecommerceModuleOrdersToProductsMock(props);

      return null;
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
    ecommerceModuleOrderOrdersToProductsMock.mockReset();
    ecommerceModuleOrderMock.mockReset();
    ecommerceModuleOrdersToProductsMock.mockReset();
  });

  /**
   * BDD Scenario: manage the cart order that holds the product.
   *
   * Given: the subject's cart route answers one order, and the subject's order
   * line route answers a line of the product in that order.
   * When: the cart button renders.
   * Then: it asks the line route for the product's lines and renders the
   * update, delete and checkout actions for that order, without the
   * module-level order and order line reads.
   */
  it("When: the cart holds the product Then: renders the actions from the subject's routes", () => {
    ecommerceModuleOrderListMock.mockReturnValue({
      data: [{ id: "order-1", type: "cart", status: "new" }],
    });
    ecommerceModuleOrderOrdersToProductsMock.mockReturnValue({
      data: [{ id: "line-1", orderId: "order-1", productId: "product-1" }],
    });

    renderCartButton();

    expect(ecommerceModuleOrderListMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "subject-1" }),
    );
    expect(ecommerceModuleOrderOrdersToProductsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "subject-1",
        params: {
          filters: {
            and: [{ column: "productId", method: "eq", value: "product-1" }],
          },
        },
      }),
    );
    expect(screen.getByTestId("order-update-order-1")).toBeTruthy();
    expect(screen.getByTestId("order-delete-order-1")).toBeTruthy();
    expect(screen.getByTestId("order-checkout-order-1")).toBeTruthy();
    expect(screen.queryByTestId("order-create")).toBeNull();
    expect(ecommerceModuleOrderMock).not.toHaveBeenCalled();
    expect(ecommerceModuleOrdersToProductsMock).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: the product sits only in an order that left the cart.
   *
   * Given: the subject's cart route answers one order, and the product's only
   * line belongs to another of the subject's orders.
   * When: the cart button renders.
   * Then: it offers to create an order.
   */
  it("When: the product is only in an order outside the cart Then: offers to create an order", () => {
    ecommerceModuleOrderListMock.mockReturnValue({
      data: [{ id: "order-1", type: "cart", status: "new" }],
    });
    ecommerceModuleOrderOrdersToProductsMock.mockReturnValue({
      data: [{ id: "line-2", orderId: "order-paid", productId: "product-1" }],
    });

    renderCartButton();

    expect(screen.getByTestId("order-create")).toBeTruthy();
    expect(screen.queryByTestId("order-update-order-paid")).toBeNull();
  });

  /**
   * BDD Scenario: offer to create an order for an empty cart.
   *
   * Given: the subject's cart route answers no order.
   * When: the cart button renders.
   * Then: it offers to create an order without reading lines.
   */
  it("When: the cart is empty Then: offers to create an order", () => {
    ecommerceModuleOrderListMock.mockReturnValue({ data: [] });

    renderCartButton();

    expect(screen.getByTestId("order-create")).toBeTruthy();
    expect(ecommerceModuleOrderOrdersToProductsMock).not.toHaveBeenCalled();
    expect(ecommerceModuleOrderMock).not.toHaveBeenCalled();
  });
});
