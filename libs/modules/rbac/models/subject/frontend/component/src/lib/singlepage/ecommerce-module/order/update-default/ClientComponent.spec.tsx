/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: rbac order update action behavior.
 *
 * Given: update action dependencies are mocked with deterministic submit data.
 * When: user triggers update submit.
 * Then: update mutation is called with subject id, order id, and submitted order lines.
 */

import { fireEvent, render, screen } from "@testing-library/react";

const mutateMock = jest.fn();
const useFormMock = jest.fn();

const submitPayload = {
  ordersToProducts: [
    {
      id: "line-1",
      quantity: 3,
    },
  ],
};

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    ecommerceModuleOrderUpdate: () => ({
      mutate: mutateMock,
      isSuccess: false,
    }),
  },
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
    Component: ({ variant, children }: any) => {
      if (variant === "find") {
        return children
          ? children({ data: [{ id: "line-1", quantity: 1 }] })
          : null;
      }

      return <input data-testid="line-field" />;
    },
  }),
);

import { Component } from "./ClientComponent";

describe("Given: order update-default action component", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    useFormMock.mockReset();

    useFormMock.mockReturnValue({
      control: {},
      handleSubmit: (submit: (data: typeof submitPayload) => void) => () =>
        submit(submitPayload),
    });
  });

  it("When: update button is submitted Then: mutation receives id, orderId, and order lines", () => {
    render(
      <Component
        variant="ecommerce-module-order-update-default"
        data={{ id: "subject-1" } as any}
        order={{ id: "order-1" } as any}
        language="en"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    expect(mutateMock).toHaveBeenCalledWith({
      id: "subject-1",
      orderId: "order-1",
      data: submitPayload,
    });
  });
});
