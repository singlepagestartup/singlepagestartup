/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: rbac order delete action behavior.
 *
 * Given: delete action dependencies are mocked with deterministic cart lines.
 * When: the action renders and the user triggers delete submit.
 * Then: the order's lines come from the subject's own order line route, and the delete mutation
 * is called with subject id and order id.
 */

import { fireEvent, render, screen } from "@testing-library/react";

const mutateMock = jest.fn();
const useFormMock = jest.fn();
const ecommerceModuleOrderOrdersToProductsMock = jest.fn();
const ecommerceOrdersToProductsMock = jest.fn();

jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...classes: Array<string | undefined>) =>
    classes.filter(Boolean).join(" "),
}));

jest.mock("server-only", () => ({}), { virtual: true });

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: {
    ecommerceModuleOrderDelete: () => ({
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
    Component: (props: any) => {
      ecommerceOrdersToProductsMock(props);

      return null;
    },
  }),
);

import { Component } from "./ClientComponent";

describe("Given: order delete-default action component", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    useFormMock.mockReset();
    ecommerceModuleOrderOrdersToProductsMock.mockReset();
    ecommerceOrdersToProductsMock.mockReset();

    ecommerceModuleOrderOrdersToProductsMock.mockReturnValue({
      data: [{ id: "line-1", orderId: "order-1", quantity: 1, total: [] }],
    });

    useFormMock.mockReturnValue({
      control: {},
      handleSubmit: (submit: (data: Record<string, never>) => void) => () =>
        submit({}),
    });
  });

  /**
   * BDD Scenario
   * Given: the subject's order line route answers one line of the order.
   * When: the user submits the delete.
   * Then: the lines were read through that route for the order, and the
   * mutation receives the subject and order identifiers.
   */
  it("When: delete button is submitted Then: mutation receives subject and order identifiers", () => {
    render(
      <Component
        isServer={false}
        variant="ecommerce-module-order-delete-default"
        data={{ id: "subject-1" } as any}
        order={{ id: "order-1" } as any}
        language="en"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

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
    expect(ecommerceOrdersToProductsMock).not.toHaveBeenCalled();
    expect(mutateMock).toHaveBeenCalledWith({
      id: "subject-1",
      orderId: "order-1",
    });
  });
});
