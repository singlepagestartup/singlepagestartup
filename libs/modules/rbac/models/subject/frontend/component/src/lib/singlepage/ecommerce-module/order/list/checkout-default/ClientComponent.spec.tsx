/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: rbac order list checkout behavior.
 *
 * Given: checkout list dependencies are mocked with deterministic order and payment data.
 * When: checkout is submitted from cart list context.
 * Then: single invoice redirects immediately, while multiple invoices render payment links.
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

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, target }: any) => (
    <a href={href} target={target}>
      {children}
    </a>
  ),
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
  Button: ({ children, onClick, disabled, asChild }: any) => {
    if (asChild) {
      return <>{children}</>;
    }

    return (
      <button onClick={onClick} disabled={disabled}>
        {children}
      </button>
    );
  },
  Form: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@sps/ui-adapter", () => ({
  FormField: ({ name }: any) => <div data-testid={`field-${name}`} />,
}));

jest.mock(
  "@sps/rbac/relations/subjects-to-ecommerce-module-orders/frontend/component",
  () => ({
    Component: ({ children }: any) =>
      children
        ? children({
            data: [{ ecommerceModuleOrderId: "order-1" }],
          })
        : null,
  }),
);

jest.mock("@sps/ecommerce/models/order/frontend/component", () => ({
  Component: ({ variant, children }: any) => {
    if (variant === "find") {
      return children ? children({ data: [{ id: "order-1" }] }) : null;
    }

    if (variant === "cart-default") {
      return <div data-testid="cart-order">{children}</div>;
    }

    if (variant === "form-field-default") {
      return <input data-testid="order-id-field" readOnly={true} />;
    }

    return null;
  },
}));

jest.mock("../../update-default", () => ({
  Component: () => <div data-testid="update-action">update</div>,
}));

jest.mock("../../delete-default", () => ({
  Component: () => <div data-testid="delete-action">delete</div>,
}));

jest.mock("../total-default", () => ({
  Component: ({ children }: any) =>
    children
      ? children({
          data: [{ total: 100, billingModuleCurrency: { symbol: "$" } }],
        })
      : null,
}));

import { Component } from "./ClientComponent";

describe("Given: order list checkout component", () => {
  beforeEach(() => {
    mutateAsyncMock.mockReset();
    useFormMock.mockReset();
    (window.location as any).href = "";

    useFormMock.mockReturnValue({
      control: {},
      handleSubmit:
        (submit: (data: typeof submitPayload) => Promise<void>) => () =>
          submit(submitPayload),
    });
  });

  it("When: checkout returns one invoice Then: browser redirects to payment URL", async () => {
    mutateAsyncMock.mockResolvedValue({
      billingModule: {
        invoices: [{ paymentUrl: "https://pay.local/single" }],
      },
    });

    render(
      <Component
        variant="ecommerce-module-order-list-checkout-default"
        data={{ id: "subject-1" } as any}
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
      expect((window.location as any).href).toBe("https://pay.local/single");
    });
  });

  it("When: checkout returns multiple invoices Then: payment links are rendered instead of redirect", async () => {
    mutateAsyncMock.mockResolvedValue({
      billingModule: {
        invoices: [
          { paymentUrl: "https://pay.local/one" },
          { paymentUrl: "https://pay.local/two" },
        ],
      },
    });

    render(
      <Component
        variant="ecommerce-module-order-list-checkout-default"
        data={{ id: "subject-1" } as any}
        language="en"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));

    await waitFor(() => {
      const links = screen.getAllByText("Payment Link");
      expect(links.length).toBe(2);
    });

    expect((window.location as any).href).toBe("");
  });
});
