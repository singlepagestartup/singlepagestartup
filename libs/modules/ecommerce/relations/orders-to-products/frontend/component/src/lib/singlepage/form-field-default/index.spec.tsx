/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: ecommerce order line form field.
 *
 * Given: an order line read through the subject's own route, and order line reads by id that
 * require the Admin role.
 * When: the line is bound into a form through the form-field-default variant.
 * Then: the field takes its value from the line it is handed and never requests the line again.
 */

import { render, screen } from "@testing-library/react";

const findByIdMock = jest.fn();

jest.mock("server-only", () => ({}), { virtual: true });

jest.mock("@sps/ecommerce/relations/orders-to-products/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: {
    findById: (...args: unknown[]) => findByIdMock(...args),
  },
}));

jest.mock("@sps/ui-adapter", () => ({
  ErrorBoundary: ({ children }: any) => <>{children}</>,
  FormField: ({ name }: any) => (
    <input data-testid={`field-${name}`} readOnly />
  ),
}));

import { Component } from "@sps/ecommerce/relations/orders-to-products/frontend/component";

describe("Given: an order line bound into the cart update form", () => {
  beforeEach(() => {
    findByIdMock.mockReset();
    findByIdMock.mockReturnValue({ data: undefined, isLoading: true });
  });

  /**
   * BDD Scenario
   * Given: the cart hands the variant a complete order line and a form.
   * When: the form-field-default variant renders the quantity field.
   * Then: the form receives the line's quantity without a line request by id.
   */
  it("When: the field renders Then: it binds the line it is handed", () => {
    const form = { setValue: jest.fn() };

    render(
      <Component
        isServer={false}
        variant="form-field-default"
        data={
          {
            id: "line-1",
            orderId: "order-1",
            productId: "product-1",
            quantity: 3,
          } as any
        }
        form={form as any}
        field="quantity"
        name="ordersToProducts.0.quantity"
        type="number"
      />,
    );

    expect(
      screen.getByTestId("field-ordersToProducts.0.quantity"),
    ).toBeTruthy();
    expect(form.setValue).toHaveBeenCalledWith(
      "ordersToProducts.0.quantity",
      3,
    );
    expect(findByIdMock).not.toHaveBeenCalled();
  });
});
