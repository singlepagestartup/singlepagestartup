/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: host subject order list widget.
 *
 * Given: the RBAC subject and ecommerce order components are mocked with a controllable subject, orders and lines.
 * When: the order list widget renders.
 * Then: it lists the subject's cart orders of every status with their lines from the subject's own
 * routes, without the module-level order, order line or relation reads.
 */

import { render, screen } from "@testing-library/react";

let authSubject: any = { id: "subject-1" };
const orderListPropsMock = jest.fn();
const ordersToProductsListPropsMock = jest.fn();
const subjectsToEcommerceModuleOrdersMock = jest.fn();
const ecommerceModuleOrdersToProductsMock = jest.fn();

jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) => {
    if (props.variant === "authentication-me-default") {
      return props.children ? props.children({ data: authSubject }) : null;
    }

    if (props.variant === "ecommerce-module-order-list-default") {
      orderListPropsMock(props);

      return props.children
        ? props.children({
            data: [
              { id: "order-new", type: "cart", status: "new" },
              { id: "order-paid", type: "cart", status: "paid" },
            ],
          })
        : null;
    }

    if (
      props.variant === "ecommerce-module-order-list-orders-to-products-default"
    ) {
      ordersToProductsListPropsMock(props);

      const orderId = props.apiProps.params.filters.and[0].value;

      return props.children
        ? props.children({
            data: [{ id: `line-of-${orderId}`, orderId, total: [] }],
          })
        : null;
    }

    return <div data-testid={props.variant} />;
  },
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

jest.mock(
  "@sps/rbac/relations/subjects-to-ecommerce-module-orders/frontend/component",
  () => ({
    Component: (props: any) => {
      subjectsToEcommerceModuleOrdersMock(props);

      return null;
    },
  }),
);

jest.mock("@sps/ecommerce/models/order/frontend/component", () => ({
  Component: ({ variant, data, ordersToProducts }: any) => (
    <div data-testid={`${variant}-${data.id}`}>
      {ordersToProducts?.map((orderToProduct: any) => (
        <p key={orderToProduct.id}>{orderToProduct.id}</p>
      ))}
    </div>
  ),
}));

import { Component } from "./Component";

function renderWidget() {
  return render(
    <Component
      isServer={false}
      variant="subject-ecommerce-order"
      language="en"
      url="/orders"
      data={{ id: "widget-1" } as any}
    />,
  );
}

describe("Given: the subject order list widget", () => {
  beforeEach(() => {
    authSubject = { id: "subject-1" };
    orderListPropsMock.mockReset();
    ordersToProductsListPropsMock.mockReset();
    subjectsToEcommerceModuleOrdersMock.mockReset();
    ecommerceModuleOrdersToProductsMock.mockReset();
  });

  /**
   * BDD Scenario: no subject.
   *
   * Given: no subject is authenticated.
   * When: the widget renders.
   * Then: it renders nothing and requests no orders.
   */
  it("When: no subject is authenticated Then: renders nothing", () => {
    authSubject = null;

    const { container } = renderWidget();

    expect(container.innerHTML).toBe("");
    expect(orderListPropsMock).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: list the subject's cart orders.
   *
   * Given: the subject's order route answers a new and a paid cart order, and
   * the subject's order line route answers each order's line.
   * When: the widget renders.
   * Then: it asks the order route for cart orders of any status and the line
   * route for each order's lines, and renders one cart card per order with its
   * lines, without the subject-to-order relation or the module-level line reads.
   */
  it("When: a subject is authenticated Then: lists its cart orders from the subject's order route", () => {
    renderWidget();

    expect(orderListPropsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { id: "subject-1" },
        apiProps: {
          params: {
            filters: {
              and: [{ column: "type", method: "eq", value: "cart" }],
            },
          },
        },
      }),
    );
    expect(ordersToProductsListPropsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { id: "subject-1" },
        apiProps: {
          params: {
            filters: {
              and: [{ column: "orderId", method: "eq", value: "order-paid" }],
            },
          },
        },
      }),
    );
    expect(screen.getByTestId("cart-default-order-new")).toBeTruthy();
    expect(screen.getByTestId("cart-default-order-paid")).toBeTruthy();
    expect(screen.getByText("line-of-order-new")).toBeTruthy();
    expect(screen.getByText("line-of-order-paid")).toBeTruthy();
    expect(subjectsToEcommerceModuleOrdersMock).not.toHaveBeenCalled();
    expect(ecommerceModuleOrdersToProductsMock).not.toHaveBeenCalled();
  });
});
