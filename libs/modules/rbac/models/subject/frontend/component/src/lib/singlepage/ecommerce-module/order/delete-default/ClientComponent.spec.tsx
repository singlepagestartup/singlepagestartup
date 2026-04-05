/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: rbac order delete action behavior.
 *
 * Given: delete action dependencies are mocked with deterministic cart lines.
 * When: user triggers delete submit.
 * Then: delete mutation is called with subject id and order id.
 */

import { fireEvent, render, screen } from "@testing-library/react";

const mutateMock = jest.fn();
const useFormMock = jest.fn();

jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...classes: Array<string | undefined>) =>
    classes.filter(Boolean).join(" "),
}));

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    ecommerceModuleOrderDelete: () => ({
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
    Component: ({ children }: any) =>
      children ? children({ data: [{ id: "line-1" }] }) : null,
  }),
);

import { Component } from "./ClientComponent";

describe("Given: order delete-default action component", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    useFormMock.mockReset();

    useFormMock.mockReturnValue({
      control: {},
      handleSubmit: (submit: (data: Record<string, never>) => void) => () =>
        submit({}),
    });
  });

  it("When: delete button is submitted Then: mutation receives subject and order identifiers", () => {
    render(
      <Component
        variant="ecommerce-module-order-delete-default"
        data={{ id: "subject-1" } as any}
        order={{ id: "order-1" } as any}
        language="en"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(mutateMock).toHaveBeenCalledWith({
      id: "subject-1",
      orderId: "order-1",
    });
  });
});
