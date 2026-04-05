/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: rbac order checkout action behavior.
 *
 * Given: checkout action dependencies are mocked with deterministic submit data.
 * When: user submits checkout.
 * Then: checkout mutation receives provider/email/orders payload and browser redirects to invoice payment URL.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mutateAsyncMock = jest.fn();
const useFormMock = jest.fn();

const submitPayload = {
  provider: "stripe",
  email: "subject@example.com",
  ecommerceModule: {
    orders: [{ id: "order-1" }],
  },
};

const originalLocation = window.location;

beforeAll(() => {
  Object.defineProperty(window, "location", {
    value: { href: "" },
    writable: true,
  });
});

afterAll(() => {
  Object.defineProperty(window, "location", {
    value: originalLocation,
  });
});

jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...classes: Array<string | undefined>) =>
    classes.filter(Boolean).join(" "),
}));

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    ecommerceModuleOrderCheckout: () => ({
      mutateAsync: mutateAsyncMock,
      isPending: false,
    }),
  },
}));

jest.mock("react-hook-form", () => ({
  useForm: (...args: unknown[]) => useFormMock(...args),
}));

jest.mock("@hookform/resolvers/zod", () => ({
  zodResolver: () => undefined,
}));

jest.mock("@sps/shared-ui-shadcn", () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Form: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@sps/ui-adapter", () => ({
  FormField: ({ name }: any) => <div data-testid={`field-${name}`} />,
}));

import { Component } from "./ClientComponent";

describe("Given: order checkout-default action component", () => {
  beforeEach(() => {
    mutateAsyncMock.mockReset();
    useFormMock.mockReset();
    (window.location as any).href = "";

    mutateAsyncMock.mockResolvedValue({
      billingModule: {
        invoices: [{ paymentUrl: "https://pay.local/invoice-1" }],
      },
    });

    useFormMock.mockReturnValue({
      control: {},
      handleSubmit:
        (submit: (data: typeof submitPayload) => Promise<void>) => () =>
          submit(submitPayload),
    });
  });

  it("When: checkout is submitted Then: checkout payload is sent and redirect is applied", async () => {
    render(
      <Component
        variant="ecommerce-module-order-checkout-default"
        data={{ id: "subject-1" } as any}
        order={{ id: "order-1" } as any}
        language="en"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        id: "subject-1",
        data: submitPayload,
      });
    });

    await waitFor(() => {
      expect((window.location as any).href).toBe("https://pay.local/invoice-1");
    });

    expect(useFormMock).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultValues: expect.objectContaining({
          provider: "stripe",
          ecommerceModule: { orders: [{ id: "order-1" }] },
        }),
      }),
    );
  });
});
