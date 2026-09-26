/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: rbac order update action behavior.
 *
 * Given: update action dependencies are mocked with deterministic order lines and submit data.
 * When: the action renders and the user triggers update submit.
 * Then: the order's lines come from the subject's own order line route, and the update mutation
 * is called with subject id, order id, and submitted order lines.
 */

import { fireEvent, render, screen } from "@testing-library/react";

const mutateMock = jest.fn();
const useFormMock = jest.fn();
const ecommerceModuleOrderOrdersToProductsMock = jest.fn();
const ecommerceOrdersToProductsVariantMock = jest.fn();

const submitPayload = {
  ordersToProducts: [
    {
      id: "line-1",
      quantity: 3,
    },
  ],
};

jest.mock("server-only", () => ({}), { virtual: true });

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: {
    ecommerceModuleOrderUpdate: () => ({
      mutate: mutateMock,
      isSuccess: false,
    }),
    ecommerceModuleOrderOrdersToProducts: (...args: unknown[]) =>
      ecommerceModuleOrderOrdersToProductsMock(...args),
  },
}));

jest.mock("@sps/ui-adapter", () => ({
  ErrorBoundary: ({ children }: any) => <>{children}</>,
}));

jest.mock("react-hook-form", () => ({
  useForm: (...args: unknown[]) => useFormMock(...args),
}));

jest.mock("@hookform/resolvers/zod", () => ({
  zodResolver: () => undefined,
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn() },
}));

jest.mock("@sps/shared-ui-shadcn", () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  Form: ({ children }: any) => <div>{children}</div>,
}));

jest.mock(
  "@sps/ecommerce/relations/orders-to-products/frontend/component",
  () => ({
    Component: ({ variant, field, data }: any) => {
      ecommerceOrdersToProductsVariantMock(variant);

      return <input data-testid={`line-field-${data.id}-${field}`} />;
    },
  }),
);

import { Component } from "./ClientComponent";

describe("Given: order update-default action component", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    useFormMock.mockReset();
    ecommerceModuleOrderOrdersToProductsMock.mockReset();
    ecommerceOrdersToProductsVariantMock.mockReset();

    ecommerceModuleOrderOrdersToProductsMock.mockReturnValue({
      data: [{ id: "line-1", orderId: "order-1", quantity: 1, total: [] }],
    });

    useFormMock.mockReturnValue({
      control: {},
      handleSubmit: (submit: (data: typeof submitPayload) => void) => () =>
        submit(submitPayload),
    });
  });

  /**
   * BDD Scenario
   * Given: the subject's order line route answers one line of the order.
   * When: the user submits the update.
   * Then: the lines were read through that route for the order, bound through
   * the line form fields, and the mutation receives the submitted lines.
   */
  it("When: update button is submitted Then: mutation receives id, orderId, and order lines", () => {
    render(
      <Component
        isServer={false}
        variant="ecommerce-module-order-update-default"
        data={{ id: "subject-1" } as any}
        order={{ id: "order-1" } as any}
        language="en"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    expect(ecommerceModuleOrderOrdersToProductsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "subject-1",
        params: {
          filters: {
            and: [{ column: "orderId", method: "eq", value: "order-1" }],
          },
        },
      }),
    );
    expect(screen.getByTestId("line-field-line-1-quantity")).toBeTruthy();
    expect(
      ecommerceOrdersToProductsVariantMock.mock.calls.map(([v]) => v),
    ).not.toContain("find");
    expect(mutateMock).toHaveBeenCalledWith({
      id: "subject-1",
      orderId: "order-1",
      data: submitPayload,
    });
  });
});
