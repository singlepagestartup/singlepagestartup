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
const mockRefetch = jest.fn();
const mockQuoteRead = jest.fn();
let mockOffers: any[];
let mockLoading = false;
let mockIssues: any[] = [];
let mockAmount = "5000";
let mockUnitAmount: string | null | undefined;
let mockUnitInput: string | undefined;
let mockServices: any[] = [];
let mockQuotedCurrency: string | undefined;
let mockValidateStock = false;
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
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
      return {
        data: data.offerId
          ? {
              ...data,
              currencyId: mockQuotedCurrency ?? data.currencyId,
              amount: mockAmount,
              currencyIds: ["rub"],
              availableQuantity: 5,
              serviceOptions: mockServices,
              issues:
                mockValidateStock && data.quantity > 5
                  ? [
                      {
                        code: "stock",
                        offerId: data.offerId,
                        message: "Not enough stock",
                      },
                    ]
                  : mockIssues,
              version: JSON.stringify(data),
              charges: [
                {
                  offerId: data.offerId,
                  role: "product",
                  quantity: data.quantity,
                  amount: mockAmount,
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
  api: { find: () => ({ data: [{ id: "rub", slug: "rub", symbol: "₽" }] }) },
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
  mockOffers = [
    {
      id: "offer-a",
      variant: "default",
      productId: "product",
      storeId: "store-a",
      sku: "A",
    },
  ];
  mockLoading = false;
  mockIssues = [];
  mockAmount = "5000";
  mockUnitAmount = undefined;
  mockUnitInput = undefined;
  mockServices = [];
  mockQuotedCurrency = undefined;
  mockValidateStock = false;
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
it("requires a store choice when two offers sell the same Product", async () => {
  mockOffers.push({
    id: "offer-b",
    variant: "default",
    productId: "product",
    storeId: "store-b",
    sku: "B",
  });
  render(<Component {...props} />);
  const button = screen.getByRole("button", { name: "Добавить в корзину" });
  expect(button.hasAttribute("disabled")).toBe(true);
  fireEvent.change(screen.getByLabelText("Магазин"), {
    target: { value: "offer-b" },
  });
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
it.each(["delivery_required", "address_required", "pickup_required"])(
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
    expect(screen.getByText("За 1 шт.")).toBeTruthy();
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
  const delivery = within(screen.getByRole("group", { name: "Доставка" }));
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

it("puts pickup parameters inside their selected service and includes the real pickup identifier", async () => {
  mockServices = [
    {
      offerId: "pickup-a",
      productId: "pickup",
      role: "delivery",
      receiptMethod: "pickup",
      title: "Самовывоз",
      pickupPointIds: ["pickup-1"],
      currencyIds: ["rub"],
      pricePreview: { kind: "fixed", amount: "0" },
    },
  ];
  render(<Component {...props} />);
  fireEvent.click(screen.getByRole("radio", { name: "Самовывоз" }));
  fireEvent.change(
    within(screen.getByRole("group", { name: "Самовывоз" })).getByLabelText(
      "Точка самовывоза",
    ),
    { target: { value: "pickup-1" } },
  );
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Добавить в корзину" })
        .hasAttribute("disabled"),
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole("button", { name: "Добавить в корзину" }));
  await waitFor(() =>
    expect(mockCreate.mock.calls[0][0].data.destination).toEqual({
      pickupPointId: "pickup-1",
    }),
  );
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
  expect(screen.getByText("Другое предложение")).toBeTruthy();
  expect(screen.queryByRole("option", { name: "Магазин А" })).toBeNull();
});

it("keeps the selected address editor usable when the server filters delivery out for an unsupported destination", async () => {
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
  mockServices = [];
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

it("keeps the payment slot mounted at the same tree position when cart refresh excludes every offer", async () => {
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
    <Component {...props} excludedOfferIds={["offer-a"]} checkoutSlot={slot} />,
  );
  expect(screen.getByTestId("payment-probe").getAttribute("data-mount")).toBe(
    "1",
  );
  expect(screen.getByTestId("payment-probe").getAttribute("data-hidden")).toBe(
    "true",
  );
  expect(screen.getByText("invoice-link")).toBeTruthy();
  expect(
    screen.queryByRole("button", { name: "Добавить в корзину" }),
  ).toBeNull();
  expect(slot.mock.calls.at(-1)![0]).toBeUndefined();
});

it("never adds an incomplete draft against a retained quote for a different currency", async () => {
  mockQuotedCurrency = "usd";
  mockIssues = [
    {
      code: "delivery_required",
      offerId: "offer-a",
      message: "Choose delivery",
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

it("keeps a fresh secondary offer collapsed behind an accessible explicit action", async () => {
  mockOffers.push({ ...mockOffers[0], id: "offer-b", storeId: "store-b" });
  const slot = jest.fn((_configuration: any, _actions: any) => null);
  render(
    <Component {...props} excludedOfferIds={["offer-a"]} checkoutSlot={slot} />,
  );
  const action = screen.getByRole("button", { name: "Другое предложение" });
  expect(action.getAttribute("aria-expanded")).toBe("false");
  expect(
    screen.queryByRole("button", { name: "Добавить в корзину" }),
  ).toBeNull();
  expect(slot.mock.calls.at(-1)![1].hideWhenIdle).toBe(true);
  fireEvent.click(action);
  expect(action.getAttribute("aria-expanded")).toBe("true");
  expect(
    screen.getByRole("button", { name: "Добавить в корзину" }),
  ).toBeTruthy();
  expect(slot.mock.calls.at(-1)![1].hideWhenIdle).toBe(false);
});

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
    screen.getByRole("radiogroup", { name: "Получение" }),
  );
  expect(
    (
      fulfillment.getByRole("radio", {
        name: "Не выбирать способ получения",
      }) as HTMLInputElement
    ).getAttribute("aria-checked"),
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
  fireEvent.click(
    fulfillment.getByRole("radio", { name: "Не выбирать способ получения" }),
  );
  await waitFor(() =>
    expect(mockQuoteRead.mock.calls.at(-1)![0].services).toEqual([
      { offerId: "assembly-a", quantity: 2 },
    ]),
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
  const fulfillment = screen.getByRole("radiogroup", { name: "Получение" });
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
