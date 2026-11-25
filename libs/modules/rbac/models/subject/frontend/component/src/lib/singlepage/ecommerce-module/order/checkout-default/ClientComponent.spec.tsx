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
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const submitPayload = {
  provider: "stripe",
  email: "subject@example.com",
  comment: "Please use the side entrance.",
  ecommerceModule: {
    orders: [{ id: "order-1" }],
  },
};

const checkoutPage = window.location.href;

jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...classes: Array<string | undefined>) =>
    classes.filter(Boolean).join(" "),
}));

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    identityFind: () => ({ data: [] }),
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
    mockReplace.mockReset();
    mutateAsyncMock.mockReset();
    useFormMock.mockReset();
    window.history.replaceState(null, "", checkoutPage);

    mutateAsyncMock.mockResolvedValue({
      billingModule: {
        invoices: [{ paymentUrl: `${checkoutPage}#invoice-1` }],
      },
    });

    useFormMock.mockReturnValue({
      control: {},
      handleSubmit:
        (submit: (data: typeof submitPayload) => Promise<void>) =>
        (event: { preventDefault: () => void }) => {
          event.preventDefault();
          return submit(submitPayload);
        },
    });
  });

  it("When: checkout is submitted Then: checkout payload is sent and redirect is applied", async () => {
    render(
      <Component
        isServer={false}
        variant="ecommerce-module-order-checkout-default"
        data={{ id: "subject-1" } as any}
        ecommerceModuleProduct={{ id: "product-1" } as any}
        ecommerceModuleOrder={{ id: "order-1" } as any}
        language="en"
      />,
    );

    expect(screen.getByTestId("field-comment")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to payment" }),
    );

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        id: "subject-1",
        data: submitPayload,
      });
    });

    await waitFor(() => {
      expect(window.location.href).toBe(`${checkoutPage}#invoice-1`);
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

  it("opens only the checkout form targeted by its exact order anchor", () => {
    window.history.replaceState(
      null,
      "",
      `${checkoutPage}#checkout-order-order-2`,
    );
    const props = {
      isServer: false,
      variant: "ecommerce-module-order-checkout-default" as const,
      data: { id: "subject-1" } as any,
      ecommerceModuleProduct: { id: "product-1" } as any,
      language: "en",
    };
    render(
      <>
        <Component {...props} ecommerceModuleOrder={{ id: "order-1" } as any} />
        <Component {...props} ecommerceModuleOrder={{ id: "order-2" } as any} />
      </>,
    );
    expect(
      (document.getElementById("checkout-order-order-1") as HTMLDetailsElement)
        .open,
    ).toBe(false);
    expect(
      (document.getElementById("checkout-order-order-2") as HTMLDetailsElement)
        .open,
    ).toBe(true);
  });

  it("returns to the exact discussion for a submitted service order with a dummy invoice", async () => {
    mutateAsyncMock.mockResolvedValue({
      billingModule: {
        invoices: [
          { provider: "dummy", paymentUrl: `${checkoutPage}#legacy-home` },
        ],
      },
    });
    render(
      <Component
        isServer={false}
        variant="ecommerce-module-order-checkout-default"
        data={{ id: "subject-1" } as any}
        ecommerceModuleProduct={{ id: "product-1" } as any}
        ecommerceModuleOrder={
          {
            id: "order-1",
            cartDetails: {
              discussion: {
                storeId: "store",
                taskId: "task",
                chatId: "exact-chat",
                threadId: "exact-thread",
              },
              work: {
                state: "awaiting-payment",
                paymentTiming: "after-acceptance",
                orderId: "order-1",
                storeId: "store",
              },
            },
          } as any
        }
        language="ru"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Перейти к оплате" }));
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(
        "/ru/social/chats/exact-chat/threads/exact-thread",
      ),
    );
    expect(window.location.href).toBe(checkoutPage);
  });
});
