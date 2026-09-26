/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: rbac order list checkout behavior.
 *
 * Given: checkout list dependencies are mocked with deterministic order, order line and payment data.
 * When: the cart list renders and checkout is submitted from it.
 * Then: orders and their lines come from the subject's owner-checked routes, a single invoice
 * redirects immediately, and multiple invoices render payment links.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mutateAsyncMock = jest.fn();
const useFormMock = jest.fn();
const ecommerceModuleOrderListMock = jest.fn();
const ecommerceModuleOrderOrdersToProductsMock = jest.fn();
const ecommerceModuleOrderVariantMock = jest.fn();
const ecommerceModuleOrdersToProductsMock = jest.fn();
const subjectsToEcommerceModuleOrdersMock = jest.fn();

const ordersToProducts = [
  {
    id: "line-1",
    orderId: "order-1",
    productId: "product-1",
    quantity: 1,
    total: [{ total: 100, billingModuleCurrency: { id: "usd", symbol: "$" } }],
  },
];

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

jest.mock("server-only", () => ({}), { virtual: true });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, target }: any) => (
    <a href={href} target={target}>
      {children}
    </a>
  ),
}));

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: {
    ecommerceModuleOrderCheckout: () => ({
      mutateAsync: mutateAsyncMock,
      isPending: false,
    }),
    ecommerceModuleOrderList: (...args: unknown[]) =>
      ecommerceModuleOrderListMock(...args),
    ecommerceModuleOrderOrdersToProducts: (...args: unknown[]) =>
      ecommerceModuleOrderOrdersToProductsMock(...args),
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
  ErrorBoundary: ({ children }: any) => <>{children}</>,
  FormField: ({ name }: any) => <div data-testid={`field-${name}`} />,
}));

jest.mock(
  "@sps/rbac/relations/subjects-to-ecommerce-module-orders/frontend/component",
  () => ({
    Component: (props: any) => {
      subjectsToEcommerceModuleOrdersMock(props);

      return null;
    },
  }),
);

jest.mock(
  "@sps/ecommerce/relations/orders-to-products/frontend/component",
  () => ({
    Component: (props: any) => {
      ecommerceModuleOrdersToProductsMock(props);

      return null;
    },
  }),
);

jest.mock("@sps/ecommerce/models/order/frontend/component", () => ({
  Component: ({ variant, children, data, ordersToProducts }: any) => {
    ecommerceModuleOrderVariantMock(variant, data, ordersToProducts);

    if (variant === "cart-default") {
      return (
        <div data-testid={`cart-order-${data.id}`}>
          {ordersToProducts.map((orderToProduct: any) => (
            <p key={orderToProduct.id}>line {orderToProduct.id}</p>
          ))}
          {children}
        </div>
      );
    }

    if (variant === "form-field-default") {
      return <input data-testid={`order-id-field-${data.id}`} readOnly />;
    }

    return null;
  },
}));

jest.mock("../../update-default/Component", () => ({
  Component: () => <div data-testid="update-action">update</div>,
}));

jest.mock("../../delete-default/Component", () => ({
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

function renderList() {
  return render(
    <Component
      isServer={false}
      variant="ecommerce-module-order-list-checkout-default"
      data={{ id: "subject-1" } as any}
      language="en"
    />,
  );
}

describe("Given: order list checkout component", () => {
  beforeEach(() => {
    mutateAsyncMock.mockReset();
    useFormMock.mockReset();
    ecommerceModuleOrderListMock.mockReset();
    ecommerceModuleOrderOrdersToProductsMock.mockReset();
    ecommerceModuleOrderVariantMock.mockReset();
    ecommerceModuleOrdersToProductsMock.mockReset();
    subjectsToEcommerceModuleOrdersMock.mockReset();
    (window.location as any).href = "";

    ecommerceModuleOrderListMock.mockReturnValue({
      data: [{ id: "order-1", type: "cart", status: "new" }],
    });
    ecommerceModuleOrderOrdersToProductsMock.mockReturnValue({
      data: ordersToProducts,
    });

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

    renderList();

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

    renderList();

    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));

    await waitFor(() => {
      const links = screen.getAllByText("Payment Link");
      expect(links.length).toBe(2);
    });

    expect((window.location as any).href).toBe("");
  });

  /**
   * BDD Scenario: read the cart through the subject's own routes.
   *
   * Given: the subject's cart route answers one active cart order, and the
   * subject's order line route answers its line.
   * When: the checkout list renders.
   * Then: the list asks those routes for the subject's cart and the order's
   * lines, and renders the order card with the lines and its form field from
   * the answers, without the module-level order and order line reads or the
   * subject-to-order relation, which require the Admin role.
   */
  it("When: checkout list renders Then: it reads the cart and its lines through the subject's own routes", () => {
    renderList();

    expect(ecommerceModuleOrderListMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "subject-1" }),
    );
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
    expect(screen.getByTestId("cart-order-order-1")).toBeTruthy();
    expect(screen.getByText("line line-1")).toBeTruthy();
    expect(screen.getByTestId("order-id-field-order-1")).toBeTruthy();
    expect(subjectsToEcommerceModuleOrdersMock).not.toHaveBeenCalled();
    expect(ecommerceModuleOrdersToProductsMock).not.toHaveBeenCalled();
    expect(
      ecommerceModuleOrderVariantMock.mock.calls.map(([variant]) => variant),
    ).not.toContain("find");
  });
});
