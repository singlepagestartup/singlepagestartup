/** @jest-environment jsdom */
import { useState } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
const mockCreate = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
const mockRefetch = jest.fn();
const mockQuoteRead = jest.fn();
const mockCardPriceRead = jest.fn();
let mockOffers: any[];
let mockCurrencyIds: string[] = [];
let mockPrices: Record<string, string> = {};
let mockLoading = false;
let mockIssues: any[] = [];
let mockAmount = "5000";
let mockUnitAmount: string | null | undefined;
let mockUnitInput: string | undefined;
let mockServices: any[] = [];
let mockSelectedServices: ((data: any) => any[]) | undefined;
let mockQuotedCurrency: string | undefined;
let mockValidateStock = false;
let mockRequireShippingAddress = false;
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    customerWork: () => ({ data: undefined }),
    customerWorkAvailability: () => ({
      data: { consultation: false, order: false, payAfterAcceptance: false },
      isPending: false,
    }),
    changeCustomerWork: () => ({ isPending: false }),
    ecommerceModuleOrderCreate: () => ({
      mutateAsync: mockCreate,
      isPending: false,
    }),
  },
}));
jest.mock("@sps/ecommerce/relations/stores-to-products/sdk/client", () => ({
  api: {
    find: () => ({
      data: mockOffers,
      isPending: mockLoading,
      refetch: mockRefetch,
    }),
    quote: ({ data }: any) => {
      mockQuoteRead(data);
      const amount =
        mockPrices[`${data.offerId}:${data.currencyId}`] ?? mockAmount;
      return {
        data: data.offerId
          ? {
              ...data,
              currencyId: mockQuotedCurrency ?? data.currencyId,
              amount,
              currencyIds: mockCurrencyIds,
              availableQuantity: 5,
              serviceOptions: mockServices,
              selectedServices: mockSelectedServices?.(data),
              issues:
                mockValidateStock && data.quantity > 5
                  ? [
                      {
                        code: "stock",
                        offerId: data.offerId,
                        message: "Not enough stock",
                      },
                    ]
                  : mockRequireShippingAddress &&
                      data.services?.some((service: any) =>
                        mockServices.some(
                          (option) =>
                            option.offerId === service.offerId &&
                            option.receiptMethod === "shipping",
                        ),
                      ) &&
                      !data.destination?.address?.trim()
                    ? [
                        {
                          code: "address_required",
                          offerId: "delivery-a",
                          message: "Delivery address is required",
                        },
                      ]
                    : mockIssues,
              version: JSON.stringify(data),
              charges: [
                {
                  offerId: data.offerId,
                  role: "product",
                  quantity: data.quantity,
                  amount,
                  unitAmount: mockUnitAmount,
                  inputs:
                    mockUnitInput === undefined
                      ? {}
                      : { unit_price: mockUnitInput },
                },
                ...(data.services ?? []).map((service: any) => ({
                  ...service,
                  role: service.offerId.startsWith("delivery")
                    ? "delivery"
                    : "add-on",
                  amount: "123.45",
                })),
              ],
            }
          : undefined,
        isFetching: false,
        refetch: mockRefetch,
      };
    },
  },
}));
jest.mock("@sps/ecommerce/models/store/sdk/client", () => ({
  api: {
    find: () => ({
      data: [
        { id: "store-a", title: { ru: "Магазин А" } },
        { id: "store-b", title: { ru: "Магазин Б" } },
      ],
    }),
  },
}));
jest.mock("@sps/billing/models/currency/sdk/client", () => ({
  api: {
    find: () => ({
      data: mockCurrencyIds.map((id) => ({
        id,
        slug: id,
        symbol: id === "eur" ? "€" : "₽",
      })),
    }),
  },
}));
jest.mock("@sps/ecommerce/models/store/frontend/component", () => ({
  Component: (props: any) => {
    mockCardPriceRead(props);
    return (
      <output aria-label="Цена карточки">
        {mockPrices[`${props.offerId}:${props.billingModuleCurrencyId}`]}
      </output>
    );
  },
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  ...jest.requireActual("@sps/shared-frontend-client-utils"),
  cn: (...values: any[]) => values.filter(Boolean).join(" "),
}));
jest.mock("@sps/ui-adapter", () => ({
  Icon: () => null,
  Select: ({
    id,
    value,
    disabled,
    placeholder,
    options,
    onValueChange,
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
jest.mock("@sps/shared-ui-shadcn", () => ({
  ...jest.requireActual("@sps/shared-ui-shadcn"),
  Button: ({ children, variant, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  Input: (props: any) => <input {...props} />,
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      {...props}
      type="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange(event.target.checked)}
    />
  ),
}));
jest.mock("../list/checkout-default/DeliveryAddress", () => ({
  DeliveryAddress: ({ id, label, value, onChange }: any) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  ),
}));
import { Component } from "./ClientComponent";
import { OfferPrice, OfferPriceProvider } from "./OfferPrice";
const props: any = {
  data: { id: "subject" },
  language: "ru",
  variant: "ecommerce-module-order-create-default",
  ecommerceModuleProduct: { id: "product" },
};
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
beforeEach(() => {
  mockCreate.mockReset().mockResolvedValue({});
  mockRefetch.mockReset().mockResolvedValue({});
  mockQuoteRead.mockClear();
  mockCardPriceRead.mockClear();
  mockCurrencyIds = ["rub"];
  mockPrices = {};
  mockOffers = [
    {
      id: "offer-a",
      variant: "default",
      productId: "product",
      storeId: "store-a",
      sku: "A",
      createdAt: "2024-06-02T00:00:00.000Z",
    },
  ];
  mockLoading = false;
  mockIssues = [];
  mockAmount = "5000";
  mockUnitAmount = undefined;
  mockUnitInput = undefined;
  mockServices = [];
  mockSelectedServices = undefined;
  mockQuotedCurrency = undefined;
  mockValidateStock = false;
  mockRequireShippingAddress = false;
});
it("submits the exact unique retail offer with a supported currency", async () => {
  render(<Component {...props} />);
  const button = screen.getByRole("button", { name: "Добавить в корзину" });
  await waitFor(() => expect(button.hasAttribute("disabled")).toBe(false));
  fireEvent.click(button);
  await waitFor(() =>
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "subject",
        data: expect.objectContaining({
          productId: "product",
          offerId: "offer-a",
          storeId: "store-a",
          quantity: 1,
          billingModuleCurrencyId: "rub",
        }),
      }),
    ),
  );
  expect(await screen.findByText("Товар в корзине.")).toBeTruthy();
});
it("selects the earliest retail store and its server price when several stores sell the Product", async () => {
  mockOffers.push({
    id: "offer-b",
    variant: "default",
    productId: "product",
    storeId: "store-b",
    sku: "B",
    createdAt: "2024-06-01T00:00:00.000Z",
  });
  mockUnitAmount = "4123.45";
  const slot = jest.fn((_configuration: any, _actions: any) => null);
  render(<Component {...props} checkoutSlot={slot} />);
  expect((screen.getByLabelText("Магазин") as HTMLSelectElement).value).toBe(
    "offer-b",
  );
  await waitFor(() =>
    expect(screen.getByLabelText("Цена за 1 шт.").textContent).toMatch(
      /4\s123,45 ₽/,
    ),
  );
  expect(mockQuoteRead.mock.calls.at(-1)![0].offerId).toBe("offer-b");
  expect(slot.mock.calls.at(-1)![0]).toMatchObject({
    storeId: "store-b",
    selection: { offerId: "offer-b" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Добавить в корзину" }));
  await waitFor(() =>
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          offerId: "offer-b",
          storeId: "store-b",
        }),
      }),
    ),
  );
});
it("keeps an explicit store choice when offers refetch or an earlier offer appears", async () => {
  mockOffers.push({
    id: "offer-b",
    variant: "default",
    productId: "product",
    storeId: "store-b",
    sku: "B",
    createdAt: "2024-06-03T00:00:00.000Z",
  });
  const view = render(<Component {...props} />);
  const button = screen.getByRole("button", { name: "Добавить в корзину" });
  expect((screen.getByLabelText("Магазин") as HTMLSelectElement).value).toBe(
    "offer-a",
  );
  fireEvent.change(screen.getByLabelText("Магазин"), {
    target: { value: "offer-b" },
  });
  mockOffers = [
    ...mockOffers.toReversed(),
    {
      ...mockOffers[0],
      id: "offer-earlier",
      createdAt: "2024-01-01T00:00:00.000Z",
    },
  ];
  view.rerender(<Component {...props} />);
  expect((screen.getByLabelText("Магазин") as HTMLSelectElement).value).toBe(
    "offer-b",
  );
  await waitFor(() => expect(button.hasAttribute("disabled")).toBe(false));
  fireEvent.click(button);
  await waitFor(() =>
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          offerId: "offer-b",
          storeId: "store-b",
        }),
      }),
    ),
  );
});
it("updates the card and form price together after a manual store or currency choice", async () => {
  mockCurrencyIds = ["rub", "eur"];
  mockPrices = {
    "offer-a:rub": "5000",
    "offer-b:rub": "8100",
    "offer-b:eur": "7200",
  };
  mockOffers.push({
    ...mockOffers[0],
    id: "offer-b",
    storeId: "store-b",
    createdAt: "2024-06-03T00:00:00.000Z",
  });
  render(
    <OfferPriceProvider>
      <OfferPrice product={props.ecommerceModuleProduct} language="ru">
        <span>Server-rendered price</span>
      </OfferPrice>
      <Component {...props} />
    </OfferPriceProvider>,
  );
  expect(screen.getByText("Server-rendered price")).toBeTruthy();
  expect(mockCardPriceRead).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Магазин"), {
    target: { value: "offer-b" },
  });
  await waitFor(() =>
    expect(screen.getByLabelText("Цена карточки").textContent).toBe("8100"),
  );
  expect(screen.getByLabelText("Цена за 1 шт.").textContent).toMatch(
    /8\s100 ₽/,
  );
  expect(mockCardPriceRead.mock.calls.at(-1)![0]).toMatchObject({
    isServer: false,
    variant: "product-price-default",
    product: props.ecommerceModuleProduct,
    storeId: "store-b",
    offerId: "offer-b",
    billingModuleCurrencyId: "rub",
    language: "ru",
    readOnly: true,
  });
  expect(screen.queryByText("Server-rendered price")).toBeNull();
  fireEvent.change(screen.getByLabelText("Валюта"), {
    target: { value: "eur" },
  });
  await waitFor(() =>
    expect(screen.getByLabelText("Цена карточки").textContent).toBe("7200"),
  );
  expect(screen.getByLabelText("Цена за 1 шт.").textContent).toMatch(
    /7\s200 €/,
  );
  expect(mockCardPriceRead.mock.calls.at(-1)![0]).toMatchObject({
    offerId: "offer-b",
    billingModuleCurrencyId: "eur",
  });
  mockCardPriceRead.mockClear();
  fireEvent.change(screen.getByLabelText("Количество"), {
    target: { value: "2" },
  });
  await waitFor(() =>
    expect(mockQuoteRead.mock.calls.at(-1)![0].quantity).toBe(2),
  );
  expect(mockCardPriceRead).not.toHaveBeenCalled();
});
it("restores the original card price when a manually configured form hides or unmounts", async () => {
  mockCurrencyIds = ["rub", "eur"];
  mockPrices = { "offer-a:eur": "4000" };
  const purchase = (visible: boolean, mounted = true) => (
    <OfferPriceProvider>
      <OfferPrice product={props.ecommerceModuleProduct} language="ru">
        <span>Server-rendered price</span>
      </OfferPrice>
      {mounted && <Component {...props} hideConfiguration={!visible} />}
    </OfferPriceProvider>
  );
  const view = render(purchase(true));
  fireEvent.change(screen.getByLabelText("Валюта"), {
    target: { value: "eur" },
  });
  expect(screen.getByLabelText("Цена карточки").textContent).toBe("4000");
  view.rerender(purchase(false));
  expect(screen.getByText("Server-rendered price")).toBeTruthy();
  expect(screen.queryByLabelText("Цена карточки")).toBeNull();
  view.rerender(purchase(true));
  expect(screen.getByLabelText("Цена карточки").textContent).toBe("4000");
  view.rerender(purchase(true, false));
  await waitFor(() =>
    expect(screen.getByText("Server-rendered price")).toBeTruthy(),
  );
  expect(screen.queryByLabelText("Цена карточки")).toBeNull();
});
it("isolates the card price between separate product providers", () => {
  mockCurrencyIds = ["rub", "eur"];
  mockPrices = { "offer-a:eur": "4000" };
  render(
    <>
      {["First card", "Second card"].map((name) => (
        <section aria-label={name} key={name}>
          <OfferPriceProvider>
            <OfferPrice product={props.ecommerceModuleProduct} language="ru">
              <span>Server-rendered price</span>
            </OfferPrice>
            <Component {...props} />
          </OfferPriceProvider>
        </section>
      ))}
    </>,
  );
  const first = within(screen.getByRole("region", { name: "First card" }));
  const second = within(screen.getByRole("region", { name: "Second card" }));
  fireEvent.change(first.getByLabelText("Валюта"), {
    target: { value: "eur" },
  });
  expect(first.getByLabelText("Цена карточки").textContent).toBe("4000");
  expect(second.getByText("Server-rendered price")).toBeTruthy();
  expect(second.queryByLabelText("Цена карточки")).toBeNull();
});
it("blocks stock and configuration errors locally", () => {
  mockIssues = [
    { code: "insufficient_stock", offerId: "offer-a", message: "Available 0" },
  ];
  render(<Component {...props} />);
  expect(
    screen
      .getByRole("button", { name: "Добавить в корзину" })
      .hasAttribute("disabled"),
  ).toBe(true);
  expect(mockCreate).not.toHaveBeenCalled();
});
it("blocks the purchase when no configured fulfillment method is available", async () => {
  mockIssues = [
    {
      code: "delivery_required",
      offerId: "offer-a",
      message: "No fulfillment method is available",
    },
  ];
  render(<Component {...props} />);
  expect(
    await screen.findByText(
      "Для выбранных условий заказа нет доступного способа получения.",
    ),
  ).toBeTruthy();
  expect(
    screen
      .getByRole("button", { name: "Добавить в корзину" })
      .hasAttribute("disabled"),
  ).toBe(true);
});
it.each(["address_required"])(
  "allows %s as an incomplete cart draft while withholding payment",
  async (code) => {
    mockIssues = [
      {
        code,
        offerId: "offer-a",
        message: "Choose delivery",
      },
    ];
    const slot = jest.fn((_configuration: any, _actions: any) => null);
    render(<Component {...props} checkoutSlot={slot} />);
    await waitFor(() =>
      expect(
        screen
          .getByRole("button", { name: "Добавить в корзину" })
          .hasAttribute("disabled"),
      ).toBe(false),
    );
    expect(slot.mock.calls.at(-1)![0]).toBeUndefined();
    expect(
      screen.getByText(
        "Получение, адрес и услуги можно уточнить в корзине. Для оплаты завершите выбор.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Добавить в корзину" }));
    await waitFor(() =>
      expect(mockCreate.mock.calls[0][0].data).toMatchObject({
        offerId: "offer-a",
        billingModuleCurrencyId: "rub",
        quantity: 1,
        destination: {},
        services: [],
        expectedQuoteVersion: expect.any(String),
      }),
    );
  },
);
it("does not reuse a previous Product's loaded offer", () => {
  const view = render(<Component {...props} />);
  view.rerender(
    <Component {...props} ecommerceModuleProduct={{ id: "different" }} />,
  );
  expect(
    screen
      .getByRole("button", { name: "Добавить в корзину" })
      .hasAttribute("disabled"),
  ).toBe(true);
});
it("shows an API failure without marking the offer added", async () => {
  mockCreate.mockRejectedValue(new Error("Offer terms changed"));
  render(<Component {...props} />);
  const button = screen.getByRole("button", { name: "Добавить в корзину" });
  await waitFor(() => expect(button.hasAttribute("disabled")).toBe(false));
  fireEvent.click(button);
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Offer terms changed",
  );
  expect(screen.queryByText("Товар в корзине.")).toBeNull();
  await waitFor(() => expect(mockRefetch).toHaveBeenCalledTimes(1));
});

it("excludes provider offers from the buyer's store selector", async () => {
  mockOffers.push({
    id: "provider-offer",
    variant: "provider",
    productId: "product",
    storeId: "store-b",
    sku: "PROVIDER",
  });
  render(<Component {...props} />);
  expect(screen.queryByRole("option", { name: "Магазин Б" })).toBeNull();
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Добавить в корзину" })
        .hasAttribute("disabled"),
    ).toBe(false),
  );
});
it("offers a service separately only when its retail offer is standalone", async () => {
  mockOffers = [
    {
      id: "linked-service",
      variant: "default",
      productId: "product",
      storeId: "store-a",
      sku: "LINKED",
      settings: { standalone: false },
    },
    {
      id: "standalone-service",
      variant: "default",
      productId: "product",
      storeId: "store-b",
      sku: "STANDALONE",
      settings: { standalone: true },
    },
  ];
  render(
    <Component
      {...props}
      ecommerceModuleProduct={{ id: "product", kind: "service" }}
    />,
  );
  expect(screen.queryByRole("option", { name: "Магазин А" })).toBeNull();
  expect(screen.getByRole("option", { name: "Магазин Б" })).toBeTruthy();
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Добавить в корзину" })
        .hasAttribute("disabled"),
    ).toBe(false),
  );
});
it("renders the quoted amount after a quantity change without calculating money in the browser", async () => {
  const view = render(<Component {...props} />);
  mockAmount = "1234.56";
  fireEvent.change(screen.getByLabelText("Количество"), {
    target: { value: "2" },
  });
  await waitFor(() =>
    expect(
      within(screen.getByRole("region", { name: "Расчёт" })).getAllByText(
        /1\s234,56/,
      ).length,
    ).toBeGreaterThan(0),
  );
  expect(screen.queryByText(/10000/)).toBeNull();
});

it.each(["0", "0.00000001", "123.45678901"])(
  "shows the server one-item price %s separately from a multi-item receipt",
  async (unitAmount) => {
    mockUnitAmount = unitAmount;
    mockAmount = "9876.54";
    render(<Component {...props} />);
    fireEvent.change(screen.getByLabelText("Количество"), {
      target: { value: "2" },
    });
    await waitFor(() =>
      expect(screen.getByLabelText("Цена за 1 шт.").textContent).toContain(
        unitAmount.replace(".", ","),
      ),
    );
    expect(
      screen.getByLabelText("Цена за 1 шт.").parentElement?.textContent,
    ).toBe(`${screen.getByLabelText("Цена за 1 шт.").textContent} за 1 шт.`);
    expect(
      within(screen.getByRole("region", { name: "Расчёт" })).getAllByText(
        /9\s876,54/,
      ).length,
    ).toBeGreaterThan(0);
    expect(screen.getByLabelText("Цена за 1 шт.").textContent).not.toMatch(
      /9\s876,54/,
    );
  },
);

it("uses only a quantity-one total for old quotes and never divides an old batch total or shows its coefficient", async () => {
  mockAmount = "10";
  mockUnitInput = "3.125";
  const view = render(<Component {...props} />);
  expect(screen.getByLabelText("Цена за 1 шт.").textContent).toBe("10 ₽");
  fireEvent.change(screen.getByLabelText("Количество"), {
    target: { value: "3" },
  });
  await waitFor(() =>
    expect(screen.getByLabelText("Цена за 1 шт.").textContent).toBe("—"),
  );
  mockUnitInput = undefined;
  view.rerender(<Component {...props} />);
  expect(screen.getByLabelText("Цена за 1 шт.").textContent).toBe("—");
});

it("hides an explicitly unavailable unit quote and any amount belonging to an old currency", () => {
  mockUnitInput = "5000";
  mockUnitAmount = null;
  const view = render(<Component {...props} />);
  expect(screen.getByLabelText("Цена за 1 шт.").textContent).toBe("—");
  mockUnitAmount = "123";
  mockQuotedCurrency = "usd";
  view.rerender(<Component {...props} />);
  expect(screen.getByLabelText("Цена за 1 шт.").textContent).not.toContain(
    "123",
  );
});

it("uses localized store names without exposing a unique offer's technical SKU", () => {
  render(<Component {...props} />);
  expect(screen.getByLabelText("Магазин")).toBeTruthy();
  expect(screen.getByLabelText("Валюта")).toBeTruthy();
  expect(screen.getByRole("option", { name: "Магазин А" })).toBeTruthy();
  expect(screen.queryByRole("option", { name: /· A/ })).toBeNull();
});

it("distinguishes multiple offers from the same store", () => {
  mockOffers.push({ ...mockOffers[0], id: "other-offer", sku: "B" });
  render(<Component {...props} />);
  expect(screen.getByRole("option", { name: "Магазин А · A" })).toBeTruthy();
  expect(screen.getByRole("option", { name: "Магазин А · B" })).toBeTruthy();
});

it.each([
  ["5000.00", /5\s000 ₽/],
  ["0.00000001", /0,00000001 ₽/],
])(
  "renders the quoted amount %s without redundant zeros or rounding",
  (amount, expected) => {
    mockAmount = amount;
    render(<Component {...props} />);
    expect(
      within(screen.getByRole("region", { name: "Расчёт" })).getAllByText(
        expected,
      ).length,
    ).toBeGreaterThan(0);
  },
);

it("offers localized real services directly on the product page", () => {
  mockServices = [
    {
      offerId: "service",
      title: "Consultation",
      titles: { ru: "Консультация", en: "Consultation" },
      role: "add-on",
      currencyIds: ["rub"],
    },
  ];
  render(<Component {...props} />);
  expect(screen.getByRole("checkbox", { name: "Консультация" })).toBeTruthy();
  expect(screen.queryByText(/Consultation/)).toBeNull();
  expect(screen.queryByText(/В корзине можно выбрать/)).toBeNull();
});

it("removes a previous offer's service hint when choosing another store", () => {
  mockServices = [
    {
      offerId: "service",
      productId: "service",
      title: "Consultation",
      role: "add-on",
      currencyIds: ["rub"],
    },
  ];
  mockOffers.push({ ...mockOffers[0], id: "other-offer", storeId: "store-b" });
  render(<Component {...props} />);
  fireEvent.change(screen.getByLabelText("Магазин"), {
    target: { value: "offer-a" },
  });
  expect(screen.getByText(/Consultation/)).toBeTruthy();
  mockServices = [];
  fireEvent.change(screen.getByLabelText("Магазин"), {
    target: { value: "other-offer" },
  });
  expect(screen.queryByText(/Consultation/)).toBeNull();
});

it("uses one exact configured selection for inline service/address controls, cart creation and the separate payment slot", async () => {
  mockServices = [
    {
      offerId: "assembly-a",
      productId: "assembly",
      role: "add-on",
      title: "Сборка",
      currencyIds: ["rub"],
      pricePreview: { kind: "from", amount: "123.45" },
    },
    {
      offerId: "delivery-a",
      productId: "delivery",
      role: "delivery",
      receiptMethod: "shipping",
      title: "Доставка",
      regionIds: ["Москва"],
      currencyIds: ["rub"],
      pricePreview: { kind: "fixed", amount: "1000" },
    },
  ];
  const slot = jest.fn((_configuration: any) => (
    <button type="button">Payment slot</button>
  ));
  render(<Component {...props} checkoutSlot={slot} />);
  expect(
    screen.getByRole("button", { name: "Payment slot" }).closest("form"),
  ).toBeNull();
  const groups = screen.getAllByRole("group");
  expect(
    groups.find((group) =>
      group.getAttribute("aria-labelledby")?.endsWith("delivery-a-title"),
    ),
  ).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Количество"), {
    target: { value: "2" },
  });
  fireEvent.click(screen.getByRole("radio", { name: "Доставка" }));
  const delivery = within(
    within(screen.getByRole("radiogroup", { name: "Доставка" })).getByRole(
      "group",
      { name: "Доставка" },
    ),
  );
  expect(delivery.getByText("Зона доставки: Москва")).toBeTruthy();
  expect(screen.queryByLabelText("Регион")).toBeNull();
  fireEvent.change(delivery.getByLabelText("Адрес доставки"), {
    target: { value: "Москва, Тверская 1" },
  });
  fireEvent.click(screen.getByRole("checkbox", { name: "Сборка" }));
  fireEvent.change(screen.getByLabelText("Количество единиц услуги"), {
    target: { value: "2" },
  });
  expect(
    screen
      .getByRole("button", { name: "Добавить в корзину" })
      .hasAttribute("disabled"),
  ).toBe(true);
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Добавить в корзину" })
        .hasAttribute("disabled"),
    ).toBe(false),
  );
  const configuration = slot.mock.calls.at(-1)![0];
  expect(configuration.selection).toEqual({
    offerId: "offer-a",
    currencyId: "rub",
    quantity: 2,
    destination: { address: "Москва, Тверская 1" },
    services: [
      { offerId: "delivery-a", quantity: 1 },
      { offerId: "assembly-a", quantity: 2 },
    ],
  });
  expect(configuration.expectedQuoteVersion).toBe(configuration.quote.version);
  fireEvent.click(screen.getByRole("button", { name: "Добавить в корзину" }));
  await waitFor(() =>
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          destination: configuration.selection.destination,
          services: configuration.selection.services,
          expectedQuoteVersion: configuration.expectedQuoteVersion,
        }),
      }),
    ),
  );
});

it("collects pickup from the selected store immediately without a separate point or destination", async () => {
  mockServices = [
    {
      offerId: "pickup-a",
      productId: "pickup",
      role: "delivery",
      receiptMethod: "pickup",
      title: "Самовывоз",
      pickupPointIds: ["legacy-point"],
      currencyIds: ["rub"],
      pricePreview: { kind: "fixed", amount: "0" },
    },
  ];
  const slot = jest.fn((_configuration: any) => null);
  render(<Component {...props} checkoutSlot={slot} />);
  fireEvent.click(screen.getByRole("radio", { name: "Самовывоз" }));
  expect(screen.queryByLabelText("Точка самовывоза")).toBeNull();
  expect(screen.queryByLabelText("Адрес доставки")).toBeNull();
  await waitFor(() =>
    expect(slot.mock.calls.at(-1)![0]?.storeId).toBe("store-a"),
  );
  expect(slot.mock.calls.at(-1)![0].selection.destination).toEqual({});
  fireEvent.click(screen.getByRole("button", { name: "Добавить в корзину" }));
  await waitFor(() =>
    expect(mockCreate.mock.calls[0][0].data.destination).toEqual({}),
  );
  expect(mockCreate.mock.calls[0][0].data.storeId).toBe("store-a");
});

it("keeps pickup tied to the changed store and requires an address only after choosing shipping", async () => {
  mockOffers.push({ ...mockOffers[0], id: "offer-b", storeId: "store-b" });
  mockRequireShippingAddress = true;
  mockServices = [
    {
      offerId: "pickup-common",
      productId: "pickup",
      role: "delivery",
      receiptMethod: "pickup",
      title: "Самовывоз",
      pickupPointIds: ["legacy-point"],
      currencyIds: ["rub"],
    },
    {
      offerId: "delivery-common",
      productId: "delivery",
      role: "delivery",
      receiptMethod: "shipping",
      title: "Доставка",
      currencyIds: ["rub"],
    },
  ];
  mockSelectedServices = (data) =>
    data.services?.length
      ? data.services
      : [{ offerId: "pickup-common", quantity: 1 }];
  const slot = jest.fn((_configuration: any) => null);
  render(<Component {...props} checkoutSlot={slot} />);
  fireEvent.change(screen.getByLabelText("Магазин"), {
    target: { value: "offer-a" },
  });
  await waitFor(() =>
    expect(slot.mock.calls.at(-1)![0]?.storeId).toBe("store-a"),
  );
  fireEvent.change(screen.getByLabelText("Магазин"), {
    target: { value: "offer-b" },
  });
  await waitFor(() =>
    expect(slot.mock.calls.at(-1)![0]?.storeId).toBe("store-b"),
  );
  expect(slot.mock.calls.at(-1)![0].selection.destination).toEqual({});
  expect(
    screen
      .getByRole("radio", { name: "Самовывоз" })
      .getAttribute("aria-checked"),
  ).toBe("true");
  expect(screen.queryByLabelText("Точка самовывоза")).toBeNull();
  fireEvent.click(screen.getByRole("radio", { name: "Доставка" }));
  expect(screen.getByLabelText("Адрес доставки")).toBeTruthy();
  expect(slot.mock.calls.at(-1)![0]).toBeUndefined();
  fireEvent.change(screen.getByLabelText("Адрес доставки"), {
    target: { value: "Адрес доставки покупателя" },
  });
  await waitFor(() =>
    expect(slot.mock.calls.at(-1)![0]?.selection.destination).toEqual({
      address: "Адрес доставки покупателя",
    }),
  );
  expect(slot.mock.calls.at(-1)![0].storeId).toBe("store-b");
  expect(
    mockQuoteRead.mock.calls.every(
      ([data]) => !Object.hasOwn(data.destination ?? {}, "pickupPointId"),
    ),
  ).toBe(true);
});

it("suppresses an empty excluded offer form and keeps only different fresh offers", async () => {
  const view = render(<Component {...props} excludedOfferIds={["offer-a"]} />);
  expect(
    screen.queryByRole("button", { name: "Добавить в корзину" }),
  ).toBeNull();
  expect(screen.queryByText("Нет доступных предложений.")).toBeNull();
  mockOffers = [
    ...mockOffers,
    { ...mockOffers[0], id: "offer-b", storeId: "store-b" },
  ];
  view.rerender(<Component {...props} excludedOfferIds={["offer-a"]} />);
  expect(screen.queryByText("Другое предложение")).toBeNull();
  expect(
    screen.getByRole("button", { name: "Добавить в корзину" }),
  ).toBeTruthy();
  expect(screen.queryByRole("option", { name: "Магазин А" })).toBeNull();
});

it("keeps the selected address editor usable when the server rejects an unsupported destination", async () => {
  const shipping = {
    offerId: "delivery-a",
    productId: "delivery",
    role: "delivery",
    receiptMethod: "shipping",
    title: "Доставка",
    currencyIds: ["rub"],
  };
  mockServices = [shipping];
  const view = render(<Component {...props} />);
  fireEvent.click(screen.getByRole("radio", { name: "Доставка" }));
  mockIssues = [
    {
      offerId: "delivery-a",
      code: "unavailable",
      message: "Delivery is unavailable in this region",
    },
  ];
  view.rerender(<Component {...props} />);
  expect(screen.getByLabelText("Адрес доставки")).toBeTruthy();
  expect(
    screen
      .getByRole("button", { name: "Добавить в корзину" })
      .hasAttribute("disabled"),
  ).toBe(true);
  mockServices = [shipping];
  mockIssues = [];
  fireEvent.change(screen.getByLabelText("Адрес доставки"), {
    target: { value: "Исправленный адрес" },
  });
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Добавить в корзину" })
        .hasAttribute("disabled"),
    ).toBe(false),
  );
  expect(mockQuoteRead.mock.calls.at(-1)![0].destination).toEqual({
    address: "Исправленный адрес",
  });
});

it("does not mark a newly selected merchant added when an earlier merchant's request finishes", async () => {
  mockOffers.push({ ...mockOffers[0], id: "offer-b", storeId: "store-b" });
  let finish!: (value: object) => void;
  mockCreate.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  render(<Component {...props} />);
  fireEvent.change(screen.getByLabelText("Магазин"), {
    target: { value: "offer-a" },
  });
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Добавить в корзину" })
        .hasAttribute("disabled"),
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole("button", { name: "Добавить в корзину" }));
  fireEvent.change(screen.getByLabelText("Магазин"), {
    target: { value: "offer-b" },
  });
  await act(async () => {
    finish({});
  });
  expect(screen.queryByText("Товар в корзине.")).toBeNull();
  expect(mockCreate).toHaveBeenCalledTimes(1);
  expect(mockCreate.mock.calls[0][0].data.offerId).toBe("offer-a");
});

it.each(["excluded", "hidden"])(
  "keeps active payment mounted when the creation form is %s after cart refresh",
  async (mode) => {
    let mounts = 0;
    function PaymentProbe({ hidden }: { hidden: boolean }) {
      const [id] = useState(() => ++mounts);
      const [outcome, setOutcome] = useState("");
      return (
        <div data-testid="payment-probe" data-mount={id} data-hidden={hidden}>
          <button onClick={() => setOutcome("invoice-link")}>
            Start payment
          </button>
          {outcome}
        </div>
      );
    }
    const slot = jest.fn((_configuration: any, actions: any) => (
      <PaymentProbe hidden={actions.hideWhenIdle} />
    ));
    const view = render(<Component {...props} checkoutSlot={slot} />);
    fireEvent.click(screen.getByRole("button", { name: "Start payment" }));
    view.rerender(
      <Component
        {...props}
        excludedOfferIds={mode === "excluded" ? ["offer-a"] : undefined}
        hideConfiguration={mode === "hidden"}
        checkoutSlot={slot}
      />,
    );
    expect(screen.getByTestId("payment-probe").getAttribute("data-mount")).toBe(
      "1",
    );
    expect(
      screen.getByTestId("payment-probe").getAttribute("data-hidden"),
    ).toBe("true");
    expect(screen.getByText("invoice-link")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Добавить в корзину" }),
    ).toBeNull();
    if (mode === "excluded") expect(slot.mock.calls.at(-1)![0]).toBeUndefined();
  },
);

it("never adds an incomplete draft against a retained quote for a different currency", async () => {
  mockQuotedCurrency = "usd";
  mockIssues = [
    {
      code: "address_required",
      offerId: "offer-a",
      message: "Delivery address is required",
    },
  ];
  const slot = jest.fn((_configuration: any, _actions: any) => null);
  render(<Component {...props} checkoutSlot={slot} />);
  await waitFor(() =>
    expect((screen.getByLabelText("Валюта") as HTMLSelectElement).value).toBe(
      "rub",
    ),
  );
  expect(
    screen
      .getByRole("button", { name: "Добавить в корзину" })
      .hasAttribute("disabled"),
  ).toBe(true);
  expect(slot.mock.calls.at(-1)![0]).toBeUndefined();
  expect(mockCreate).not.toHaveBeenCalled();
});

it("shows an eligible creation form without a duplicate other-offer action", () => {
  mockOffers.push({ ...mockOffers[0], id: "offer-b", storeId: "store-b" });
  const slot = jest.fn((_configuration: any, _actions: any) => null);
  render(
    <Component {...props} excludedOfferIds={["offer-a"]} checkoutSlot={slot} />,
  );
  expect(
    screen.queryByRole("button", { name: "Другое предложение" }),
  ).toBeNull();
  expect(
    screen.getByRole("button", { name: "Добавить в корзину" }),
  ).toBeTruthy();
  expect(slot.mock.calls.at(-1)![1].hideWhenIdle).toBe(false);
});

it.each(["ru", "en"])(
  "uses the localized delivery heading without selection hints in %s",
  (language) => {
    mockServices = ["delivery", "add-on"].map((role) => ({
      offerId: role,
      productId: role,
      role,
      title: role,
      currencyIds: ["rub"],
    }));
    render(<Component {...props} language={language} />);
    expect(
      screen.getByRole("radiogroup", {
        name: language === "ru" ? "Доставка" : "Delivery",
      }),
    ).toBeTruthy();
    expect(
      screen.queryByText(
        /Выберите один вариант|Можно выбрать несколько|Choose one option|Choose any number/,
      ),
    ).toBeNull();
  },
);

it("groups fulfillment radios separately from add-ons and preserves address and service counts while switching", async () => {
  mockServices = [
    {
      offerId: "delivery-a",
      productId: "delivery",
      role: "delivery",
      receiptMethod: "shipping",
      title: "Доставка",
      currencyIds: ["rub"],
    },
    {
      offerId: "pickup-a",
      productId: "pickup",
      role: "delivery",
      receiptMethod: "pickup",
      title: "Самовывоз",
      pickupPointIds: ["point"],
      currencyIds: ["rub"],
    },
    {
      offerId: "assembly-a",
      productId: "assembly",
      role: "add-on",
      title: "Сборка",
      currencyIds: ["rub"],
    },
  ];
  render(<Component {...props} />);
  const fulfillment = within(
    screen.getByRole("radiogroup", { name: "Доставка" }),
  );
  expect(
    fulfillment.queryByRole("radio", { name: "Не выбирать способ получения" }),
  ).toBeNull();
  expect(
    screen
      .getByRole("radiogroup", { name: "Доставка" })
      .getAttribute("aria-required"),
  ).toBe("true");
  fireEvent.change(screen.getByLabelText("Количество"), {
    target: { value: "2" },
  });
  fireEvent.click(fulfillment.getByRole("radio", { name: "Доставка" }));
  fireEvent.change(screen.getByLabelText("Адрес доставки"), {
    target: { value: "Сохранённый адрес" },
  });
  fireEvent.click(screen.getByRole("checkbox", { name: "Сборка" }));
  fireEvent.change(
    within(screen.getByRole("group", { name: "Сборка" })).getByRole(
      "spinbutton",
    ),
    { target: { value: "2" } },
  );
  fireEvent.click(fulfillment.getByRole("radio", { name: "Самовывоз" }));
  expect(fulfillment.getAllByRole("radio", { checked: true })).toHaveLength(1);
  expect(screen.queryByLabelText("Адрес доставки")).toBeNull();
  fireEvent.click(fulfillment.getByRole("radio", { name: "Доставка" }));
  expect(
    (screen.getByLabelText("Адрес доставки") as HTMLInputElement).value,
  ).toBe("Сохранённый адрес");
  expect(
    (
      within(screen.getByRole("group", { name: "Сборка" })).getByRole(
        "spinbutton",
      ) as HTMLInputElement
    ).value,
  ).toBe("2");
  await waitFor(() =>
    expect(mockQuoteRead.mock.calls.at(-1)![0].services).toEqual(
      expect.arrayContaining([
        { offerId: "delivery-a", quantity: 1 },
        { offerId: "assembly-a", quantity: 2 },
      ]),
    ),
  );
  expect(screen.getByRole("checkbox", { name: "Сборка" })).toBeTruthy();
});

it("requires exactly one fulfillment choice when the offer marks it mandatory", () => {
  mockOffers[0].settings = { requiredDelivery: true };
  mockServices = [
    {
      offerId: "delivery-a",
      productId: "delivery",
      role: "delivery",
      receiptMethod: "shipping",
      title: "Доставка",
      currencyIds: ["rub"],
    },
  ];
  render(<Component {...props} />);
  const fulfillment = screen.getByRole("radiogroup", { name: "Доставка" });
  expect(fulfillment.getAttribute("aria-required")).toBe("true");
  expect(
    within(fulfillment).queryByRole("radio", {
      name: "Не выбирать способ получения",
    }),
  ).toBeNull();
  const radio = within(fulfillment).getByRole("radio", {
    name: "Доставка",
  }) as HTMLInputElement;
  fireEvent.click(radio);
  fireEvent.click(radio);
  expect(radio.getAttribute("aria-checked")).toBe("true");
});

it("steps product and service quantities with scoped buttons and arrow keys while retaining direct typing and stock bounds", async () => {
  mockValidateStock = true;
  mockServices = [
    {
      offerId: "assembly-a",
      productId: "assembly",
      title: "Сборка",
      role: "add-on",
      currencyIds: ["rub"],
    },
  ];
  render(
    <Component
      {...props}
      ecommerceModuleProduct={{
        ...props.ecommerceModuleProduct,
        title: { ru: "Шкаф" },
      }}
    />,
  );
  const quantity = screen.getByRole("spinbutton", { name: "Количество" });
  const increase = screen.getByRole("button", {
    name: "Увеличить количество товара: Шкаф",
  });
  const decrease = screen.getByRole("button", {
    name: "Уменьшить количество товара: Шкаф",
  });
  expect(screen.getByRole("group", { name: "Количество: Шкаф" })).toBeTruthy();
  expect(decrease.hasAttribute("disabled")).toBe(true);
  fireEvent.click(increase);
  expect((quantity as HTMLInputElement).value).toBe("2");
  fireEvent.keyDown(quantity, { key: "ArrowUp" });
  expect((quantity as HTMLInputElement).value).toBe("3");
  fireEvent.keyDown(quantity, { key: "ArrowDown" });
  expect((quantity as HTMLInputElement).value).toBe("2");
  fireEvent.change(quantity, { target: { value: "6" } });
  expect((quantity as HTMLInputElement).value).toBe("6");
  expect(increase.hasAttribute("disabled")).toBe(true);
  expect(await screen.findByText("Not enough stock")).toBeTruthy();
  fireEvent.click(decrease);
  expect((quantity as HTMLInputElement).value).toBe("5");
  await waitFor(() =>
    expect(screen.queryByText("Not enough stock")).toBeNull(),
  );
  expect(increase.hasAttribute("disabled")).toBe(true);
  fireEvent.click(screen.getByRole("checkbox", { name: "Сборка" }));
  const units = screen.getByRole("spinbutton", {
    name: "Количество единиц услуги",
  });
  const serviceIncrease = screen.getByRole("button", {
    name: "Увеличить количество услуги: Сборка (Шкаф)",
  });
  const serviceDecrease = screen.getByRole("button", {
    name: "Уменьшить количество услуги: Сборка (Шкаф)",
  });
  fireEvent.click(serviceIncrease);
  fireEvent.keyDown(units, { key: "ArrowUp" });
  fireEvent.keyDown(units, { key: "ArrowDown" });
  expect((units as HTMLInputElement).value).toBe("2");
  fireEvent.change(units, { target: { value: "9" } });
  expect((units as HTMLInputElement).value).toBe("9");
  expect(serviceIncrease.hasAttribute("disabled")).toBe(true);
  fireEvent.click(serviceDecrease);
  expect((units as HTMLInputElement).value).toBe("5");
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Добавить в корзину" })
        .hasAttribute("disabled"),
    ).toBe(false),
  );
  expect(screen.getByRole("spinbutton", { name: "Количество" })).toBe(quantity);
  expect(mockCreate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Добавить в корзину" }));
  await waitFor(() =>
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          quantity: 5,
          services: [{ offerId: "assembly-a", quantity: 5 }],
        }),
      }),
    ),
  );
});

it("uses the server fulfillment default, including a sole paid method, without selecting an add-on", async () => {
  mockServices = [
    {
      offerId: "delivery-paid",
      productId: "delivery",
      role: "delivery",
      receiptMethod: "shipping",
      title: "Доставка",
      currencyIds: ["rub"],
    },
    {
      offerId: "assembly",
      productId: "assembly",
      role: "add-on",
      title: "Сборка",
      currencyIds: ["rub"],
    },
  ];
  mockSelectedServices = (data) =>
    data.services?.length
      ? data.services
      : [{ offerId: "delivery-paid", quantity: 1 }];
  render(<Component {...props} />);
  await waitFor(() =>
    expect(
      screen
        .getByRole("radio", { name: "Доставка" })
        .getAttribute("aria-checked"),
    ).toBe("true"),
  );
  expect(screen.getByLabelText("Адрес доставки")).toBeTruthy();
  expect(
    (screen.getByRole("checkbox", { name: "Сборка" }) as HTMLInputElement)
      .checked,
  ).toBe(false);
  expect(mockQuoteRead.mock.calls.at(-1)![0].services).toEqual([
    { offerId: "delivery-paid", quantity: 1 },
  ]);
});

it("uses the server cheapest method and retains an explicit alternative across later quotes", async () => {
  mockServices = [
    {
      offerId: "delivery-paid",
      productId: "delivery",
      role: "delivery",
      receiptMethod: "shipping",
      title: "Доставка",
      currencyIds: ["rub"],
    },
    {
      offerId: "pickup-free",
      productId: "pickup",
      role: "delivery",
      receiptMethod: "pickup",
      title: "Самовывоз",
      pickupPointIds: ["point"],
      currencyIds: ["rub"],
    },
  ];
  mockSelectedServices = (data) =>
    data.services?.length
      ? data.services
      : [{ offerId: "pickup-free", quantity: 1 }];
  render(<Component {...props} />);
  await waitFor(() =>
    expect(
      screen
        .getByRole("radio", { name: "Самовывоз" })
        .getAttribute("aria-checked"),
    ).toBe("true"),
  );
  fireEvent.click(screen.getByRole("radio", { name: "Доставка" }));
  fireEvent.change(screen.getByLabelText("Адрес доставки"), {
    target: { value: "Новый адрес" },
  });
  await waitFor(() =>
    expect(mockQuoteRead.mock.calls.at(-1)![0].destination).toEqual({
      address: "Новый адрес",
    }),
  );
  expect(
    screen
      .getByRole("radio", { name: "Доставка" })
      .getAttribute("aria-checked"),
  ).toBe("true");
  expect(screen.getAllByRole("radio", { checked: true })).toHaveLength(1);
});

it("hides fulfillment when the product has no alternative methods", async () => {
  mockSelectedServices = () => [];
  render(<Component {...props} />);
  expect(screen.queryByRole("radiogroup", { name: "Доставка" })).toBeNull();
  const add = screen.getByRole("button", { name: "Добавить в корзину" });
  await waitFor(() => expect(add.hasAttribute("disabled")).toBe(false));
  fireEvent.click(add);
  await waitFor(() =>
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ services: [], destination: {} }),
      }),
    ),
  );
});

it("does not reselect an add-on from retained service metadata after the buyer removes it", async () => {
  mockServices = [
    {
      offerId: "assembly-a",
      productId: "assembly",
      role: "add-on",
      title: "Сборка",
      currencyIds: ["rub"],
    },
  ];
  let retained = false;
  mockSelectedServices = (data) =>
    retained ? [{ offerId: "assembly-a", quantity: 1 }] : data.services;
  render(<Component {...props} />);
  const assembly = screen.getByRole("checkbox", {
    name: "Сборка",
  }) as HTMLInputElement;
  fireEvent.click(assembly);
  expect(assembly.checked).toBe(true);
  retained = true;
  fireEvent.click(assembly);
  await waitFor(() => expect(assembly.checked).toBe(false));
  expect(mockQuoteRead.mock.calls.at(-1)![0].services).toEqual([]);
});
