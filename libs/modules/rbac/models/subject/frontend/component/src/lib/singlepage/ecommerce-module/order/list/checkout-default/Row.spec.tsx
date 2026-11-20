/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Component } from "./Row";
const mockUpdate = jest.fn();
const mockInvalidate = jest.fn();
const mockRemoveProps = jest.fn();
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    ecommerceModuleOrderUpdate: () => ({
      mutateAsync: mockUpdate,
      isPending: false,
    }),
  },
}));
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
}));
jest.mock("@sps/ui-adapter", () => ({
  Icon: () => null,
  Select: ({
    id,
    value,
    onValueChange,
    disabled,
    placeholder,
    options,
  }: any) => (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(event) => onValueChange(event.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((option: { value: string; label: string }) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));
jest.mock("@sps/ecommerce/models/product/frontend/component", () => ({
  Component: ({ children, priceSlot }: any) => (
    <article>
      {priceSlot}
      {children}
    </article>
  ),
}));
const mockFindOrder = jest.fn();
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@sps/ecommerce/models/order/sdk/client", () => ({
  Provider: ({ children }: any) => children,
  api: { findById: (...args: unknown[]) => mockFindOrder(...args) },
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) => {
    mockRemoveProps(props);
    return (
      <button type="button">
        {props.label ??
          (props.language === "ru" ? "Удалить из корзины" : "Remove from cart")}
      </button>
    );
  },
}));
jest.mock("./Selection", () => ({
  Selection: ({ line, onSelectionStateChange }: any) => (
    <div data-testid={`selection-${line.id}`}>
      <input
        aria-label={`Draft ${line.id}`}
        defaultValue="saved"
        onChange={() => onSelectionStateChange?.(line.id, true)}
      />
      <span>Itemized receipt</span>
    </div>
  ),
}));
const props: any = {
  subject: { id: "owner" },
  ecommerceModuleOrder: {
    id: "order",
    cartDetails: {
      maxLineQuantity: 3,
      lines: [
        {
          id: "line",
          quantity: 2,
          product: { slug: "course", title: { ru: "Курс" } },
        },
      ],
      totals: [],
    },
  },
  language: "ru",
};
beforeEach(() => {
  mockUpdate.mockReset().mockResolvedValue({});
  mockInvalidate.mockReset().mockResolvedValue(undefined);
  mockRemoveProps.mockClear();
});
it("renders the Ecommerce Order cart card with the Subject snapshot and no second order read", () => {
  const { container } = render(<Component {...props} />);
  const card = container.querySelector(
    '[data-module="ecommerce"][data-model="order"][data-variant="cart-card-default"]',
  );
  expect(card?.getAttribute("data-id")).toBe("order");
  expect(
    card?.contains(
      screen.getByRole("button", { name: "Увеличить количество" }),
    ),
  ).toBe(true);
  expect(mockFindOrder).not.toHaveBeenCalled();
});
it("updates only the selected line and reloads the authorized cart totals", async () => {
  render(<Component {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Увеличить количество" }));
  await waitFor(() =>
    expect(mockUpdate).toHaveBeenCalledWith({
      id: "owner",
      orderId: "order",
      data: { ordersToProducts: [{ id: "line", quantity: 3 }] },
    }),
  );
  await waitFor(() =>
    expect(mockInvalidate).toHaveBeenCalledWith({
      queryKey: ["/api/rbac/subjects/owner/ecommerce-module/orders"],
    }),
  );
});
it("shows an update failure without replacing the saved quantity or totals", async () => {
  mockUpdate.mockRejectedValue(new Error("unavailable"));
  render(<Component {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Уменьшить количество" }));
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.getByText("2")).toBeTruthy();
  expect(mockInvalidate).not.toHaveBeenCalled();
});

it("repairs a commissioned cart line only after the buyer confirms the quantity change", async () => {
  const { cartDetails } = props.ecommerceModuleOrder;
  const order = {
    ...props.ecommerceModuleOrder,
    cartDetails: {
      ...cartDetails,
      offers: [],
      work: { state: "awaiting-result" },
      lines: [
        {
          ...cartDetails.lines[0],
          quantity: 5,
          product: {
            ...cartDetails.lines[0].product,
            singleUnitPerOrder: true,
          },
        },
        { id: "service", parentLineId: "line", quantity: 3 },
      ],
    },
  };
  render(<Component {...props} ecommerceModuleOrder={order} />);
  expect(
    screen.queryByRole("button", { name: "Увеличить количество" }),
  ).toBeNull();
  expect(screen.getByRole("alert").textContent).toMatch(/В корзине — 5/);
  expect(screen.getByText(/Количество связанных услуг/)).toBeTruthy();
  expect(mockUpdate).not.toHaveBeenCalled();

  fireEvent.click(
    screen.getByRole("button", { name: "Установить количество 1" }),
  );
  await waitFor(() =>
    expect(mockInvalidate).toHaveBeenCalledWith({
      queryKey: ["/api/rbac/subjects/owner/ecommerce-module/orders"],
    }),
  );
  expect(mockUpdate).toHaveBeenCalledWith({
    id: "owner",
    orderId: "order",
    data: {
      ordersToProducts: [
        { id: "line", quantity: 1 },
        { id: "service", quantity: 1 },
      ],
    },
  });
});

it("changes only the selected order currency and waits for the authorized cart refresh", async () => {
  const currencyProps = {
    ...props,
    ecommerceModuleOrder: {
      ...props.ecommerceModuleOrder,
      cartDetails: {
        ...props.ecommerceModuleOrder.cartDetails,
        availableCurrencyIds: ["usd", "rub"],
        billingModuleCurrencyId: "usd",
        totals: [
          {
            total: 10,
            billingModuleCurrency: { id: "usd", symbol: "$", title: "USD" },
          },
          {
            total: 100,
            billingModuleCurrency: { id: "rub", symbol: "₽", title: "RUB" },
          },
        ],
      },
    },
  };
  const view = render(<Component {...currencyProps} />);
  expect(screen.getByText("10 $").closest("article")).toBeTruthy();
  const remove = screen.getByRole("button", {
    name: "Удалить из корзины: Курс",
  });
  expect(remove.closest("article")).toBeNull();
  expect(remove.closest("header")?.contains(screen.getByRole("article"))).toBe(
    true,
  );
  expect(screen.queryByText("100 ₽")).toBeNull();
  fireEvent.change(screen.getByLabelText("Валюта оплаты"), {
    target: { value: "rub" },
  });
  await waitFor(() =>
    expect(mockUpdate).toHaveBeenCalledWith({
      id: "owner",
      orderId: "order",
      data: { billingModule: { currency: { id: "rub" } } },
    }),
  );
  expect(mockInvalidate).toHaveBeenCalledWith({
    queryKey: ["/api/rbac/subjects/owner/ecommerce-module/orders"],
  });
  view.rerender(
    <Component
      {...currencyProps}
      ecommerceModuleOrder={{
        ...currencyProps.ecommerceModuleOrder,
        cartDetails: {
          ...currencyProps.ecommerceModuleOrder.cartDetails,
          billingModuleCurrencyId: "rub",
        },
      }}
    />,
  );
  expect(screen.getByText("100 ₽")).toBeTruthy();
  expect(screen.queryByText("10 $")).toBeNull();
});
it("keeps the price and remove action attached to the order when several products share it", () => {
  const details = props.ecommerceModuleOrder.cartDetails;
  render(
    <Component
      {...props}
      language="en"
      ecommerceModuleOrder={{
        ...props.ecommerceModuleOrder,
        cartDetails: {
          ...details,
          billingModuleCurrencyId: "usd",
          availableCurrencyIds: ["usd"],
          totals: [
            {
              total: 3,
              billingModuleCurrency: { id: "usd", slug: "usd", symbol: "$" },
            },
            {
              total: 6,
              billingModuleCurrency: { id: "usd", slug: "usd", symbol: "$" },
            },
          ],
          lines: [details.lines[0], { ...details.lines[0], id: "second" }],
        },
      }}
    />,
  );
  expect(screen.getAllByRole("article")).toHaveLength(2);
  expect(screen.getByText("9 $").closest("article")).toBeNull();
  expect(
    screen
      .getByRole("button", { name: "Remove item group" })
      .closest("article"),
  ).toBeNull();
  expect(
    screen.getByRole("button", { name: "Remove item group" }).closest("header"),
  ).toBe(screen.getAllByRole("article")[0].parentElement);
  expect(mockRemoveProps).toHaveBeenCalledWith(
    expect.objectContaining({
      iconOnly: true,
      data: props.subject,
      ecommerceModuleOrder: expect.objectContaining({ id: "order" }),
    }),
  );
  expect(
    screen.getAllByRole("button", { name: "Increase quantity" }),
  ).toHaveLength(2);
});
it("requires an explicit choice when a legacy selection is no longer priced", () => {
  render(
    <Component
      {...props}
      ecommerceModuleOrder={{
        ...props.ecommerceModuleOrder,
        cartDetails: {
          ...props.ecommerceModuleOrder.cartDetails,
          availableCurrencyIds: ["rub"],
          billingModuleCurrencyId: "old-stars",
          totals: [
            {
              total: 100,
              billingModuleCurrency: { id: "rub", symbol: "₽", title: "RUB" },
            },
          ],
        },
      }}
    />,
  );
  expect(
    (screen.getByLabelText("Валюта оплаты") as HTMLSelectElement).value,
  ).toBe("");
  expect(mockUpdate).not.toHaveBeenCalled();
});

it.each([2, 6])(
  "stops increasing at the API limit and lets the buyer reduce a saved quantity of %i",
  async (quantity) => {
    const details = props.ecommerceModuleOrder.cartDetails;
    render(
      <Component
        {...props}
        ecommerceModuleOrder={{
          ...props.ecommerceModuleOrder,
          cartDetails: {
            ...details,
            maxLineQuantity: 2,
            lines: [{ ...details.lines[0], quantity }],
          },
        }}
      />,
    );
    const increase = screen.getByRole("button", {
      name: "Увеличить количество",
    }) as HTMLButtonElement;
    expect(increase.disabled).toBe(true);
    fireEvent.click(increase);
    expect(mockUpdate).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Уменьшить количество" }),
    );
    const expectedQuantity = quantity === 2 ? 1 : 2;
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith({
        id: "owner",
        orderId: "order",
        data: {
          ordersToProducts: [{ id: "line", quantity: expectedQuantity }],
        },
      }),
    );
  },
);

it("keeps the itemized receipt below the product and removes its redundant header total", () => {
  const line = {
    ...props.ecommerceModuleOrder.cartDetails.lines[0],
    productId: "product",
    offerId: "offer",
  };
  render(
    <Component
      {...props}
      ecommerceModuleOrder={{
        id: "order",
        cartDetails: {
          ...props.ecommerceModuleOrder.cartDetails,
          lines: [line],
          offers: [{ id: "offer", productId: "product", variant: "default" }],
          offerQuotes: [{ offerId: "offer", productId: "product" }],
          billingModuleCurrencyId: "rub",
          availableCurrencyIds: ["rub"],
          totals: [
            { total: 100, billingModuleCurrency: { id: "rub", symbol: "₽" } },
          ],
        },
      }}
    />,
  );
  const article = screen.getByRole("article");
  const receipt = screen.getByText("Itemized receipt");
  const remove = screen.getByRole("button", {
    name: "Удалить из корзины: Курс",
  });
  const header = remove.closest("header")!;
  expect(header.lastElementChild?.contains(remove)).toBe(true);
  expect(header.nextElementSibling?.contains(receipt)).toBe(true);
  expect(
    article.compareDocumentPosition(receipt) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(screen.queryByText("100 ₽")).toBeNull();
});

it("keeps legacy and special-offer amounts visible when there is no itemized quote", () => {
  render(
    <Component
      {...props}
      ecommerceModuleOrder={{
        ...props.ecommerceModuleOrder,
        cartDetails: {
          ...props.ecommerceModuleOrder.cartDetails,
          offers: [],
          offerQuotes: [],
          billingModuleCurrencyId: "rub",
          availableCurrencyIds: ["rub"],
          totals: [
            { total: 100, billingModuleCurrency: { id: "rub", symbol: "₽" } },
          ],
        },
      }}
    />,
  );
  expect(screen.getByText("100 ₽").closest("article")).toBeTruthy();
});

it("preserves a live draft across server timestamps and reports its own order and line", () => {
  const onOrderSelectionStateChange = jest.fn();
  const order = {
    ...props.ecommerceModuleOrder,
    cartDetails: {
      ...props.ecommerceModuleOrder.cartDetails,
      offers: [],
      lines: [
        {
          ...props.ecommerceModuleOrder.cartDetails.lines[0],
          selectionUpdatedAt: "first",
        },
      ],
    },
  };
  const view = render(
    <Component
      {...props}
      ecommerceModuleOrder={order}
      onOrderSelectionStateChange={onOrderSelectionStateChange}
    />,
  );
  fireEvent.change(screen.getByLabelText("Draft line"), {
    target: { value: "latest draft" },
  });
  expect(onOrderSelectionStateChange).toHaveBeenCalledWith(
    "order",
    "line",
    true,
  );
  view.rerender(
    <Component
      {...props}
      onOrderSelectionStateChange={onOrderSelectionStateChange}
      ecommerceModuleOrder={{
        ...order,
        cartDetails: {
          ...order.cartDetails,
          lines: [
            { ...order.cartDetails.lines[0], selectionUpdatedAt: "second" },
          ],
        },
      }}
    />,
  );
  expect((screen.getByLabelText("Draft line") as HTMLInputElement).value).toBe(
    "latest draft",
  );
});

it("keeps one header delete action scoped to each displayed owner and order", () => {
  render(
    <>
      <Component {...props} />
      <Component
        {...props}
        subject={{ id: "second-owner" }}
        ecommerceModuleOrder={{
          ...props.ecommerceModuleOrder,
          id: "second-order",
          cartDetails: {
            ...props.ecommerceModuleOrder.cartDetails,
            lines: [
              {
                ...props.ecommerceModuleOrder.cartDetails.lines[0],
                id: "second-line",
                product: { slug: "table", title: { ru: "Стол" } },
              },
            ],
          },
        }}
      />
    </>,
  );
  const first = screen.getByRole("button", {
    name: "Удалить из корзины: Курс",
  });
  const second = screen.getByRole("button", {
    name: "Удалить из корзины: Стол",
  });
  expect(first.closest("header")).not.toBe(second.closest("header"));
  expect(mockRemoveProps).toHaveBeenCalledWith(
    expect.objectContaining({
      data: { id: "owner" },
      ecommerceModuleOrder: expect.objectContaining({ id: "order" }),
    }),
  );
  expect(mockRemoveProps).toHaveBeenCalledWith(
    expect.objectContaining({
      data: { id: "second-owner" },
      ecommerceModuleOrder: expect.objectContaining({ id: "second-order" }),
    }),
  );
});

it.each([{ lines: [] }, { lines: [{ id: "unavailable", product: null }] }])(
  "keeps an empty or unavailable order removable once",
  ({ lines }) => {
    render(
      <Component
        {...props}
        language="en"
        ecommerceModuleOrder={{
          ...props.ecommerceModuleOrder,
          cartDetails: { ...props.ecommerceModuleOrder.cartDetails, lines },
        }}
      />,
    );
    expect(
      screen.getAllByRole("button", { name: "Remove from cart" }),
    ).toHaveLength(1);
    expect(mockRemoveProps).toHaveBeenCalledWith(
      expect.objectContaining({
        iconOnly: true,
        ecommerceModuleOrder: expect.objectContaining({ id: "order" }),
      }),
    );
  },
);
