/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: ecommerce order form field.
 *
 * Given: an order read through the subject's own cart route, and order reads by id
 * that require the Admin role.
 * When: the order is bound into a form through the form-field-default variant.
 * Then: the field takes its value from the order it is handed and never requests the order again.
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

jest.mock("@sps/ui-adapter", () => ({
  ErrorBoundary: ({ children }: any) => <>{children}</>,
  FormField: ({ name }: any) => (
    <input data-testid={`field-${name}`} readOnly />
  ),
}));

import { Component } from "@sps/ecommerce/models/order/frontend/component";

describe("Given: an order bound into the checkout form", () => {
  beforeEach(() => {
    findByIdMock.mockReset();
    findByIdMock.mockReturnValue({ data: undefined, isLoading: true });
  });

  /**
   * BDD Scenario
   * Given: the cart hands the variant a complete order and a form.
   * When: the form-field-default variant renders it.
   * Then: the form receives the order id without an order request by id.
   */
  it("When: the field renders Then: it binds the order it is handed", () => {
    const form = { setValue: jest.fn() };

    render(
      <Component
        isServer={false}
        variant="form-field-default"
        data={{ id: "order-1", type: "cart", status: "new" } as any}
        form={form as any}
        formFieldName="ecommerceModule.orders.0.id"
        entityFieldName="id"
      />,
    );

    expect(
      screen.getByTestId("field-ecommerceModule.orders.0.id"),
    ).toBeTruthy();
    expect(form.setValue).toHaveBeenCalledWith(
      "ecommerceModule.orders.0.id",
      "order-1",
    );
    expect(findByIdMock).not.toHaveBeenCalled();
  });
});
