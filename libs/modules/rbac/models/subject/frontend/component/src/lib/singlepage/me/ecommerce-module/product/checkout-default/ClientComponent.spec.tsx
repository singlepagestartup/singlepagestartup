/** @jest-environment jsdom */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { IConfiguredPurchase } from "@sps/rbac/models/subject/frontend/component";
const mockCheckout = jest.fn();
const mockCart = jest.fn();
const mockInvalidate = jest.fn();
const mockQueries = { invalidateQueries: mockInvalidate };
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQueryClient: () => mockQueries,
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
}));
jest.mock("./client", () => ({ __esModule: true, default: () => null }));
jest.mock("./server", () => ({ __esModule: true, default: () => null }));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    identityFind: () => ({ data: [] }),
    ecommerceModuleProductCheckout: () => ({
      mutateAsync: mockCheckout,
      isPending: false,
    }),
    ecommerceModuleOrderCreate: () => ({
      mutateAsync: mockCart,
      isPending: false,
    }),
  },
}));
jest.mock("@sps/shared-ui-shadcn", () => ({
  Input: (props: any) => <input {...props} />,
  Form: ({ children }: any) => <>{children}</>,
  Button: ({ children, variant, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));
jest.mock("@sps/ui-adapter", () => ({
  Icon: () => null,
  ErrorBoundary: ({ children }: any) => children,
  Select: ({
    id,
    value,
    onValueChange,
    options,
    disabled,
    placeholder,
  }: any) => (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(event) => onValueChange(event.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
  FormField: (props: any) => (
    <label>
      {props.label || props.name}
      {props.type === "select" ? (
        <select
          aria-label={props.label || props.name}
          {...props.form.register(props.name)}
        >
          {props.options.map(([id, label]: string[]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      ) : (
        <input
          aria-label={props.label || props.name}
          type={props.type === "number" ? "number" : "text"}
          {...props.form.register(props.name, {
            valueAsNumber: props.type === "number",
          })}
        />
      )}
    </label>
  ),
}));
jest.mock("@sps/ecommerce/models/product/frontend/component", () => ({
  Component: (props: any) => {
    const React = jest.requireActual<typeof import("react")>("react");
    React.useEffect(() => {
      props.onCurrenciesResolved?.([
        { id: "currency-usd" },
        { id: "currency-eur" },
      ]);
    }, [props.onCurrenciesResolved]);
    return props.variant === "price-default" ? (
      <span>REAL-SDK-PRICE</span>
    ) : (
      <select
        aria-label="Currency"
        {...props.form.register(props.formFieldName)}
      >
        <option value="">Choose</option>
        <option value="currency-usd">USD</option>
        <option value="currency-eur">EUR</option>
      </select>
    );
  },
}));
jest.mock("@sps/ecommerce/models/store/frontend/component", () => ({
  Component: () => <span>REAL-SDK-PRICE</span>,
}));
jest.mock("@sps/ecommerce/relations/stores-to-products/sdk/client", () => ({
  api: {
    find: () => ({
      data: [
        {
          id: "offer",
          variant: "default",
          productId: "product",
          storeId: "store",
          sku: "SKU",
        },
      ],
    }),
    quote: ({ data }: any) => ({
      data: {
        ...data,
        amount: "100",
        currencyIds: ["currency-usd", "currency-eur"],
        issues: [],
        charges: [
          {
            offerId: data.offerId,
            productId: "product",
            storeId: "store",
            providerStoreId: "store",
            role: "product",
            quantity: data.quantity,
            amount: "100",
            recurrence: "each",
            stockQuantity: null,
            availableQuantity: null,
            formula: "server-formula",
            formulaVersion: "1",
            inputs: {},
          },
        ],
        availableQuantity: null,
        serviceOptions: [],
        version: "terms-current",
        productId: "product",
        storeId: "store",
        expiresAt: "2030-01-01T00:00:00.000Z",
      },
      isFetching: false,
    }),
  },
}));
jest.mock("@sps/ecommerce/models/store/sdk/client", () => ({
  api: { find: () => ({ data: [{ id: "store", title: { en: "Store" } }] }) },
}));
jest.mock("@sps/billing/models/currency/sdk/client", () => ({
  api: {
    find: () => ({
      data: [
        { id: "currency-usd", slug: "usd", symbol: "$" },
        { id: "currency-eur", slug: "eur", symbol: "€" },
      ],
    }),
  },
}));
import { Component } from "./ClientComponent";
import { Component as PublicCheckout } from "./index";
import { Component as CreateCart } from "../../../../ecommerce-module/order/create-default/ClientComponent";
const props = {
  isServer: false,
  variant: "me-ecommerce-module-product-checkout-default" as const,
  data: { id: "subject" } as any,
  ecommerceModuleProduct: { id: "product" } as any,
  ecommerceModuleStore: { id: "store" } as any,
  language: "en",
};
beforeEach(() => {
  mockCheckout.mockReset();
  mockCart.mockReset();
  mockInvalidate.mockReset().mockResolvedValue(undefined);
  window.location.hash = "";
});
const purchaseConfiguration: IConfiguredPurchase = {
  selection: {
    offerId: "offer-configured",
    quantity: 3,
    currencyId: "currency-eur",
    destination: { address: "Configured address", region: "city" },
    services: [
      { offerId: "delivery-configured", quantity: 1 },
      { offerId: "assembly-configured", quantity: 2 },
    ],
  },
  storeId: "configured-store",
  expectedQuoteVersion: "configured-terms",
  currencySymbol: "€",
  quote: {
    offerId: "offer-configured",
    productId: "product",
    storeId: "configured-store",
    quantity: 3,
    currencyId: "currency-eur",
    amount: "1234.50",
    version: "configured-terms",
    expiresAt: "2030-01-01T00:00:00.000Z",
    issues: [],
    charges: [
      {
        offerId: "offer-configured",
        productId: "product",
        role: "product" as const,
        quantity: 3,
        amount: "1000",
      },
      {
        offerId: "delivery-configured",
        productId: "delivery",
        role: "delivery" as const,
        quantity: 1,
        amount: "100",
      },
      {
        offerId: "assembly-configured",
        productId: "assembly",
        role: "add-on" as const,
        quantity: 2,
        amount: "134.50",
      },
    ].map((charge) => ({
      ...charge,
      storeId: "configured-store",
      providerStoreId: "configured-store",
      recurrence: "each" as const,
      stockQuantity: null,
      availableQuantity: null,
      formula: "server-formula",
      formulaVersion: "1",
      inputs: {},
    })),
    currencyIds: ["currency-eur"],
    availableQuantity: 5,
    serviceOptions: [
      {
        offerId: "delivery-configured",
        productId: "delivery",
        title: "Shipping",
        role: "delivery",
        receiptMethod: "shipping",
        currencyIds: ["currency-eur"],
      },
      {
        offerId: "assembly-configured",
        productId: "assembly",
        title: "Assembly",
        role: "add-on",
        currencyIds: ["currency-eur"],
      },
    ],
  },
};
it("submits the actual currency, Store, quantity, email, comment and one of all eight providers then follows the server invoice URL", async () => {
  mockCheckout.mockResolvedValue({
    billingModule: {
      invoices: [
        {
          id: "legacy-invoice",
          paymentUrl: `${window.location.origin}/#invoice-confirmed`,
        },
      ],
    },
  });
  render(<Component {...props} />);
  fireEvent.click(screen.getByText("One step checkout"));
  const provider = screen.getByLabelText("Payment method");
  expect((provider as HTMLSelectElement).options).toHaveLength(8);
  fireEvent.change(provider, {
    target: { value: "payselection-international" },
  });
  fireEvent.change(screen.getByLabelText("Currency"), {
    target: { value: "currency-eur" },
  });
  fireEvent.change(screen.getByLabelText("Quantity"), {
    target: { value: "3" },
  });
  fireEvent.change(screen.getByLabelText("Email for a bill"), {
    target: { value: "customer@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Comment"), {
    target: { value: "Existing checkout comment" },
  });
  fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
  await waitFor(() =>
    expect(mockCheckout).toHaveBeenCalledWith({
      id: "subject",
      productId: "product",
      data: {
        provider: "payselection-international",
        email: "customer@example.com",
        quantity: 3,
        comment: "Existing checkout comment",
        storeId: "store",
        billingModule: { currency: { id: "currency-eur" } },
      },
    }),
  );
  await waitFor(() => expect(window.location.hash).toBe("#invoice-confirmed"));
});
it("keeps validation and displays a backend checkout failure without reporting success", async () => {
  mockCheckout.mockRejectedValue(new Error("Provider unavailable"));
  render(<Component {...props} />);
  fireEvent.click(screen.getByText("One step checkout"));
  fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
  await waitFor(() => expect(mockCheckout).not.toHaveBeenCalled());
  fireEvent.change(screen.getByLabelText("Email for a bill"), {
    target: { value: "customer@example.com" },
  });
  fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toBe("Provider unavailable"),
  );
  expect(window.location.hash).toBe("");
});
it("uses the existing cart operation and keeps the selected currency, quantity and Store", async () => {
  mockCart.mockResolvedValue({ id: "order" });
  render(
    <CreateCart {...props} variant="ecommerce-module-order-create-default" />,
  );
  fireEvent.change(screen.getByLabelText("Currency"), {
    target: { value: "currency-usd" },
  });
  fireEvent.change(screen.getByLabelText("Quantity"), {
    target: { value: "2" },
  });
  await waitFor(() =>
    expect(screen.getByText("Add to cart").hasAttribute("disabled")).toBe(
      false,
    ),
  );
  fireEvent.submit(screen.getByText("Add to cart").closest("form")!);
  await waitFor(() =>
    expect(mockCart).toHaveBeenCalledWith({
      id: "subject",
      data: {
        quantity: 2,
        productId: "product",
        storeId: "store",
        offerId: "offer",
        billingModuleCurrencyId: "currency-usd",
        expectedQuoteVersion: "terms-current",
        destination: {},
        services: [],
      },
    }),
  );
  expect(screen.getByText("Added to your cart.").getAttribute("role")).toBe(
    "status",
  );
});

it("reuses the configured offer, services, destination, currency, quantity and exact quote without duplicate selectors", async () => {
  mockCheckout.mockResolvedValue({
    billingModule: {
      invoices: [
        {
          id: "invoice",
          paymentUrl: `${window.location.origin}/#configured-invoice`,
        },
      ],
    },
  });
  render(
    <Component {...props} purchaseConfiguration={purchaseConfiguration} />,
  );
  fireEvent.click(screen.getByText("One step checkout"));
  expect(screen.queryByLabelText("Quantity")).toBeNull();
  expect(screen.queryByLabelText("Currency")).toBeNull();
  expect(screen.queryByLabelText("Delivery address")).toBeNull();
  expect(screen.queryByText("REAL-SDK-PRICE")).toBeNull();
  expect(
    screen.getByLabelText("Payment total").textContent?.replace(/\u00a0/g, " "),
  ).toBe("1,234.5 €");
  fireEvent.change(screen.getByLabelText("Email for a bill"), {
    target: { value: "customer@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Comment"), {
    target: { value: "Configured checkout" },
  });
  fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
  await waitFor(() =>
    expect(mockCheckout).toHaveBeenCalledWith({
      id: "subject",
      productId: "product",
      data: {
        provider: "dummy",
        email: "customer@example.com",
        comment: "Configured checkout",
        offerId: purchaseConfiguration.selection.offerId,
        storeId: purchaseConfiguration.storeId,
        quantity: 3,
        destination: purchaseConfiguration.selection.destination,
        services: purchaseConfiguration.selection.services,
        expectedQuoteVersion: "configured-terms",
        billingModule: { currency: { id: "currency-eur" } },
      },
    }),
  );
  expect(mockCart).not.toHaveBeenCalled();
  await waitFor(() => expect(window.location.hash).toBe("#configured-invoice"));
  expect(
    screen.getByRole("link", { name: "Pay invoice 1" }).getAttribute("href"),
  ).toContain("#configured-invoice");
});

it("forwards the configured purchase through the public loaded-data reader and explicit client boundary", () => {
  const view = render(
    <PublicCheckout
      {...props}
      dataSource="props"
      purchaseConfiguration={purchaseConfiguration}
    />,
  );
  expect(
    screen.getByLabelText("Payment total").textContent?.replace(/\u00a0/g, " "),
  ).toBe("1,234.5 €");
  expect(screen.queryByLabelText("Currency")).toBeNull();
  expect(screen.queryByLabelText("Quantity")).toBeNull();
  expect(mockCheckout).not.toHaveBeenCalled();
  view.rerender(
    <PublicCheckout
      {...props}
      dataSource="props"
      purchaseConfiguration={null}
      hideWhenIdle
    />,
  );
  expect(screen.queryByText("One step checkout")).toBeNull();
});

it("keeps payment disabled for an incomplete shared configuration and retains payment details when it becomes ready", async () => {
  const view = render(<Component {...props} purchaseConfiguration={null} />);
  fireEvent.click(screen.getByText("One step checkout"));
  expect(screen.queryByLabelText("Quantity")).toBeNull();
  expect(screen.queryByLabelText("Currency")).toBeNull();
  expect(screen.getByText("Continue to payment").hasAttribute("disabled")).toBe(
    true,
  );
  fireEvent.change(screen.getByLabelText("Email for a bill"), {
    target: { value: "customer@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Payment method"), {
    target: { value: "paykeeper" },
  });
  fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
  await waitFor(() => expect(mockCheckout).not.toHaveBeenCalled());
  view.rerender(
    <Component {...props} purchaseConfiguration={purchaseConfiguration} />,
  );
  expect(screen.getByText("Continue to payment").hasAttribute("disabled")).toBe(
    false,
  );
  expect(
    (screen.getByLabelText("Email for a bill") as HTMLInputElement).value,
  ).toBe("customer@example.com");
  expect(
    (screen.getByLabelText("Payment method") as HTMLSelectElement).value,
  ).toBe("paykeeper");
});

it.each(["currency", "quantity", "version", "issues"] as const)(
  "blocks a configured checkout with a quote that no longer matches its %s",
  async (field) => {
    const quote = {
      ...purchaseConfiguration.quote,
      ...(field === "currency" ? { currencyId: "currency-usd" } : {}),
      ...(field === "quantity" ? { quantity: 1 } : {}),
      ...(field === "version" ? { version: "old-terms" } : {}),
      ...(field === "issues"
        ? {
            issues: [
              {
                code: "stock",
                offerId: "offer-configured",
                message: "Unavailable stock",
              },
            ],
          }
        : {}),
    };
    render(
      <Component
        {...props}
        purchaseConfiguration={{ ...purchaseConfiguration, quote }}
      />,
    );
    expect(
      screen.getByText("Continue to payment").hasAttribute("disabled"),
    ).toBe(true);
    expect(screen.queryByLabelText("Payment total")).toBeNull();
    fireEvent.change(screen.getByLabelText("Email for a bill"), {
      target: { value: "customer@example.com" },
    });
    fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
    await waitFor(() => expect(mockCheckout).not.toHaveBeenCalled());
  },
);

it("submits the latest configured snapshot without resetting entered payment details", async () => {
  mockCheckout.mockResolvedValue({
    billingModule: {
      invoices: [
        {
          id: "invoice",
          paymentUrl: `${window.location.origin}/#latest-invoice`,
        },
      ],
    },
  });
  const view = render(
    <Component {...props} purchaseConfiguration={purchaseConfiguration} />,
  );
  fireEvent.change(screen.getByLabelText("Email for a bill"), {
    target: { value: "customer@example.com" },
  });
  const latest: IConfiguredPurchase = {
    ...purchaseConfiguration,
    selection: {
      ...purchaseConfiguration.selection,
      quantity: 4,
      services: [],
      destination: {},
    },
    expectedQuoteVersion: "latest-terms",
    quote: {
      ...purchaseConfiguration.quote,
      quantity: 4,
      version: "latest-terms",
      amount: "999.75",
    },
  };
  view.rerender(<Component {...props} purchaseConfiguration={latest} />);
  expect(screen.getByLabelText("Payment total").textContent).toBe("999.75 €");
  fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
  await waitFor(() =>
    expect(mockCheckout.mock.calls[0][0].data).toEqual(
      expect.objectContaining({
        quantity: 4,
        services: [],
        destination: {},
        expectedQuoteVersion: "latest-terms",
        email: "customer@example.com",
      }),
    ),
  );
});

it("shows every returned payment link when checkout has multiple invoices", async () => {
  mockCheckout.mockResolvedValue({
    billingModule: {
      invoices: [
        { id: "invoice-1", paymentUrl: `${window.location.origin}/#first` },
        { id: "invoice-2", paymentUrl: `${window.location.origin}/#second` },
      ],
    },
  });
  render(
    <Component {...props} purchaseConfiguration={purchaseConfiguration} />,
  );
  fireEvent.change(screen.getByLabelText("Email for a bill"), {
    target: { value: "customer@example.com" },
  });
  fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
  expect(
    (await screen.findByRole("link", { name: "Pay invoice 1" })).getAttribute(
      "href",
    ),
  ).toContain("#first");
  expect(
    screen.getByRole("link", { name: "Pay invoice 2" }).getAttribute("href"),
  ).toContain("#second");
  expect(window.location.hash).toBe("");
  expect(screen.getByText("Continue to payment").hasAttribute("disabled")).toBe(
    true,
  );
  expect(mockCheckout).toHaveBeenCalledTimes(1);
});

it("shows quote conflicts without adding to the cart or navigating", async () => {
  mockCheckout.mockRejectedValue(
    new Error("Conflict error. Offer terms changed"),
  );
  render(
    <Component {...props} purchaseConfiguration={purchaseConfiguration} />,
  );
  fireEvent.change(screen.getByLabelText("Email for a bill"), {
    target: { value: "customer@example.com" },
  });
  fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(mockCart).not.toHaveBeenCalled();
  expect(window.location.hash).toBe("");
});

it("refreshes rejected quote terms and requires the new configured snapshot before retrying", async () => {
  const onQuoteStale = jest.fn().mockResolvedValue(undefined);
  mockCheckout.mockRejectedValueOnce(
    new Error("Conflict error. Offer terms changed"),
  );
  const view = render(
    <Component
      {...props}
      purchaseConfiguration={purchaseConfiguration}
      onQuoteStale={onQuoteStale}
    />,
  );
  fireEvent.change(screen.getByLabelText("Email for a bill"), {
    target: { value: "customer@example.com" },
  });
  fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
  await waitFor(() => expect(onQuoteStale).toHaveBeenCalledTimes(1));
  expect(screen.getByText("Continue to payment").hasAttribute("disabled")).toBe(
    true,
  );
  fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
  await waitFor(() => expect(mockCheckout).toHaveBeenCalledTimes(1));
  const fresh = {
    ...purchaseConfiguration,
    expectedQuoteVersion: "fresh-terms",
    quote: {
      ...purchaseConfiguration.quote,
      version: "fresh-terms",
      amount: "1275.25",
    },
  };
  view.rerender(
    <Component
      {...props}
      purchaseConfiguration={fresh}
      onQuoteStale={onQuoteStale}
    />,
  );
  expect(
    screen.getByLabelText("Payment total").textContent?.replace(/\u00a0/g, " "),
  ).toBe("1,275.25 €");
  expect(screen.getByText("Continue to payment").hasAttribute("disabled")).toBe(
    false,
  );
  mockCheckout.mockResolvedValueOnce({
    billingModule: {
      invoices: [
        {
          id: "invoice",
          paymentUrl: `${window.location.origin}/#fresh-invoice`,
        },
      ],
    },
  });
  fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
  await waitFor(() =>
    expect(mockCheckout.mock.calls[1][0].data.expectedQuoteVersion).toBe(
      "fresh-terms",
    ),
  );
});

it("preserves the submitted snapshot and error while its offer disappears after cart reconciliation", async () => {
  let reject!: (cause: Error) => void;
  mockCheckout.mockImplementationOnce(
    () =>
      new Promise((_resolve, fail) => {
        reject = fail;
      }),
  );
  const view = render(
    <Component {...props} purchaseConfiguration={purchaseConfiguration} />,
  );
  fireEvent.change(screen.getByLabelText("Email for a bill"), {
    target: { value: "customer@example.com" },
  });
  fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
  await waitFor(() => expect(mockCheckout).toHaveBeenCalledTimes(1));
  view.rerender(
    <Component {...props} purchaseConfiguration={null} hideWhenIdle />,
  );
  expect(
    screen.getByLabelText("Payment total").textContent?.replace(/\u00a0/g, " "),
  ).toBe("1,234.5 €");
  reject(new Error("Provider unavailable after creating the order"));
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.getByText("Continue to payment").hasAttribute("disabled")).toBe(
    true,
  );
  fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
  await waitFor(() => expect(mockCheckout).toHaveBeenCalledTimes(1));
  expect(screen.getByText("One step checkout")).toBeTruthy();
});

it("keeps partial invoice links visible with an error and never redirects to only one of them", async () => {
  mockCheckout.mockResolvedValue({
    billingModule: {
      invoices: [
        {
          id: "invoice-1",
          paymentUrl: `${window.location.origin}/#only-one-link`,
        },
        { id: "invoice-2", paymentUrl: null },
      ],
    },
  });
  const view = render(
    <Component {...props} purchaseConfiguration={purchaseConfiguration} />,
  );
  fireEvent.change(screen.getByLabelText("Email for a bill"), {
    target: { value: "customer@example.com" },
  });
  fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(
    screen.getByRole("link", { name: "Pay invoice 1" }).getAttribute("href"),
  ).toContain("#only-one-link");
  expect(window.location.hash).toBe("");
  view.rerender(
    <Component {...props} purchaseConfiguration={null} hideWhenIdle />,
  );
  expect(screen.getByRole("link", { name: "Pay invoice 1" })).toBeTruthy();
  expect(screen.getByText("Continue to payment").hasAttribute("disabled")).toBe(
    true,
  );
  fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
  await waitFor(() => expect(mockCheckout).toHaveBeenCalledTimes(1));
});

it("hides only an idle checkout when its source offer is unavailable", () => {
  const view = render(
    <Component {...props} purchaseConfiguration={null} hideWhenIdle />,
  );
  expect(screen.queryByText("One step checkout")).toBeNull();
  view.rerender(
    <Component
      {...props}
      purchaseConfiguration={purchaseConfiguration}
      hideWhenIdle={false}
    />,
  );
  expect(screen.getByText("One step checkout")).toBeTruthy();
  expect(mockCheckout).not.toHaveBeenCalled();
});

it.each([
  new Error("Validation error. Invalid provider"),
  new Error("Validation error. Receipt email must be valid"),
  new Error("Validation error. Email is required for checkout."),
  Object.assign(new Error("Invalid fields"), { status: 422 }),
])(
  "allows correcting a definite validation failure and retrying: %s",
  async (cause) => {
    mockCheckout.mockRejectedValueOnce(cause).mockResolvedValueOnce({
      billingModule: {
        invoices: [
          {
            id: "corrected",
            paymentUrl: `${window.location.origin}/#corrected`,
          },
        ],
      },
    });
    render(
      <Component {...props} purchaseConfiguration={purchaseConfiguration} />,
    );
    fireEvent.change(screen.getByLabelText("Email for a bill"), {
      target: { value: "customer@example.com" },
    });
    fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(
      screen.getByText("Continue to payment").hasAttribute("disabled"),
    ).toBe(false);
    fireEvent.change(screen.getByLabelText("Email for a bill"), {
      target: { value: "corrected@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Payment method"), {
      target: { value: "paykeeper" },
    });
    fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
    await waitFor(() => expect(mockCheckout).toHaveBeenCalledTimes(2));
    expect(mockCheckout.mock.calls[1][0].data).toEqual(
      expect.objectContaining({
        email: "corrected@example.com",
        provider: "paykeeper",
        expectedQuoteVersion: "configured-terms",
      }),
    );
    await waitFor(() => expect(window.location.hash).toBe("#corrected"));
  },
);

it("refreshes the cart after an ambiguous outcome without retrying the purchase or losing the payment error", async () => {
  mockCheckout.mockRejectedValueOnce(new Error("Network unavailable"));
  mockInvalidate.mockRejectedValueOnce(new Error("Read unavailable"));
  render(
    <Component {...props} purchaseConfiguration={purchaseConfiguration} />,
  );
  fireEvent.change(screen.getByLabelText("Email for a bill"), {
    target: { value: "customer@example.com" },
  });
  fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
  expect(await screen.findByText("Network unavailable")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Refresh cart" }));
  expect(
    await screen.findByText("Could not refresh the cart. Please retry."),
  ).toBeTruthy();
  expect(screen.getByText("Network unavailable")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Refresh cart" }));
  await waitFor(() => expect(mockInvalidate).toHaveBeenCalledTimes(2));
  expect(mockInvalidate).toHaveBeenLastCalledWith(
    { queryKey: ["/api/rbac/subjects/subject/ecommerce-module/orders"] },
    { throwOnError: true },
  );
  expect(screen.getByText("Continue to payment").hasAttribute("disabled")).toBe(
    true,
  );
  fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
  await waitFor(() => expect(mockCheckout).toHaveBeenCalledTimes(1));
});

it.each(["subject", "product", "store"] as const)(
  "ignores a late checkout result after the %s scope changes",
  async (scope) => {
    let resolve!: (result: any) => void;
    mockCheckout.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const view = render(
      <PublicCheckout
        {...props}
        dataSource="props"
        purchaseConfiguration={purchaseConfiguration}
      />,
    );
    fireEvent.change(screen.getByLabelText("Email for a bill"), {
      target: { value: "customer@example.com" },
    });
    fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
    await waitFor(() => expect(mockCheckout).toHaveBeenCalledTimes(1));
    const next = {
      ...props,
      ...(scope === "subject"
        ? { data: { id: "another-subject" } as any }
        : {}),
      ...(scope === "product"
        ? { ecommerceModuleProduct: { id: "another-product" } as any }
        : {}),
      ...(scope === "store"
        ? { ecommerceModuleStore: { id: "another-store" } as any }
        : {}),
    };
    view.rerender(
      <PublicCheckout
        {...next}
        dataSource="props"
        purchaseConfiguration={null}
      />,
    );
    expect(
      (screen.getByLabelText("Email for a bill") as HTMLInputElement).value,
    ).toBe("");
    await act(async () =>
      resolve({
        billingModule: {
          invoices: [
            { id: "old", paymentUrl: `${window.location.origin}/#stale-scope` },
          ],
        },
      }),
    );
    expect(window.location.hash).toBe("");
    expect(screen.queryByRole("link", { name: "Pay invoice 1" })).toBeNull();
    expect(mockCheckout).toHaveBeenCalledTimes(1);
  },
);
