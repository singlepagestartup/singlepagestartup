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
let updatingCartCount = 0;
let fetchingCartCount = 0;
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useIsMutating: () => updatingCartCount,
  useIsFetching: () => fetchingCartCount,
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
const useFormMock = jest.fn();
const ecommerceModuleOrderApiPropsMock = jest.fn();
let cartOrders: any[];

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
    ecommerceModuleOrderUpdate: () => ({
      mutateAsync: jest.fn(),
      isPending: false,
    }),
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
  Select: () => null,
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
  Component: ({ variant, children, apiProps }: any) => {
    if (variant === "find") {
      ecommerceModuleOrderApiPropsMock(apiProps);
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

jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) => {
    ecommerceModuleOrderApiPropsMock(props.apiProps);
    return props.children?.({
      data: cartOrders,
    });
  },
}));
jest.mock("@sps/ecommerce/models/product/frontend/component", () => ({
  Component: () => null,
}));
import { Component } from "./ClientComponent";

describe("Given: order list checkout component", () => {
  beforeEach(() => {
    cartOrders = [
      {
        id: "order-1",
        cartDetails: {
          lines: [],
          totals: [
            {
              total: 100,
              billingModuleCurrency: { id: "rub", symbol: "₽", title: "RUB" },
            },
          ],
          availableCurrencyIds: ["rub"],
          billingModuleCurrencyId: "rub",
        },
      },
    ];
    updatingCartCount = 0;
    fetchingCartCount = 0;
    mutateAsyncMock.mockReset();
    useFormMock.mockReset();
    ecommerceModuleOrderApiPropsMock.mockReset();
    (window.location as any).href = "";

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

  it("When: checkout returns one invoice Then: browser redirects to payment URL", async () => {
    mutateAsyncMock.mockResolvedValue({
      billingModule: {
        invoices: [{ paymentUrl: "https://pay.local/single" }],
      },
    });

    render(
      <Component
        isServer={false}
        variant="ecommerce-module-order-list-checkout-default"
        data={{ id: "subject-1" } as any}
        language="en"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Proceed to payment" }));

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
        isServer={false}
        variant="ecommerce-module-order-list-checkout-default"
        data={{ id: "subject-1" } as any}
        language="en"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Proceed to payment" }));

    await waitFor(() => {
      const links = screen.getAllByRole("link", { name: "Proceed to payment" });
      expect(links.length).toBe(2);
      expect(links.map((link) => link.getAttribute("href"))).toEqual([
        "https://pay.local/one",
        "https://pay.local/two",
      ]);
      expect(
        links.every((link) => link.getAttribute("target") === "_blank"),
      ).toBe(true);
    });

    expect((window.location as any).href).toBe("");
  });

  /**
   * BDD Scenario: render only active cart orders.
   *
   * Given: the subject has both active and historical cart relations.
   * When: the checkout list requests its order models.
   * Then: the model query is restricted to status new and bypasses stale caches.
   */
  it("When: checkout list renders Then: it requests only new cart orders", () => {
    render(
      <Component
        isServer={false}
        variant="ecommerce-module-order-list-checkout-default"
        data={{ id: "subject-1" } as any}
        language="en"
      />,
    );

    expect(ecommerceModuleOrderApiPropsMock).toHaveBeenCalledWith({
      params: { includeCartDetails: true },
    });
  });
  it("renders totals from the same private snapshot and leaves cached amounts unchanged", () => {
    const first = {
      total: 125,
      billingModuleCurrency: { id: "eur", symbol: "€" },
    };
    cartOrders = [
      {
        id: "one",
        cartDetails: {
          lines: [],
          totals: [first],
          availableCurrencyIds: ["eur"],
          billingModuleCurrencyId: "eur",
        },
      },
      {
        id: "two",
        cartDetails: {
          lines: [],
          availableCurrencyIds: ["eur"],
          billingModuleCurrencyId: "eur",
          totals: [
            { total: 250, billingModuleCurrency: { id: "eur", symbol: "€" } },
          ],
        },
      },
    ];
    render(
      <Component
        isServer={false}
        variant="ecommerce-module-order-list-checkout-default"
        data={{ id: "subject-1" } as any}
        language="en"
      />,
    );
    expect(screen.getByText("375 €")).toBeTruthy();
    expect(first.total).toBe(125);
  });
  it("does not offer checkout for an empty cart", () => {
    cartOrders = [];
    render(
      <Component
        isServer={false}
        variant="ecommerce-module-order-list-checkout-default"
        data={{ id: "subject-1" } as any}
        language="en"
      />,
    );
    expect(screen.getByText("Your cart is empty.")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Proceed to payment" }),
    ).toBeNull();
  });
  it("blocks checkout for a legacy unpriced line while retaining the cart and amounts", async () => {
    cartOrders[0].cartDetails = {
      availableCurrencyIds: ["rub"],
      billingModuleCurrencyId: "rub",
      lines: [],
      totals: [
        { total: 100, billingModuleCurrency: { id: "rub", symbol: "₽" } },
      ],
      unpriced: [
        {
          ordersToProductsId: "bad-line",
          productId: "bad",
          reason: "No price",
        },
      ],
    };
    render(
      <Component
        isServer={false}
        variant="ecommerce-module-order-list-checkout-default"
        data={{ id: "subject-1" } as any}
        language="ru"
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain("нет цены");
    const button = screen.getByRole("button", { name: "Перейти к оплате" });
    expect(button.hasAttribute("disabled")).toBe(true);
    fireEvent.click(button);
    expect(mutateAsyncMock).not.toHaveBeenCalled();
    expect(screen.getAllByText("100 ₽")).toHaveLength(2);
  });
});
