/** @jest-environment jsdom */
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
const mockMutation = jest.fn();
let mockMissing = false;
const mockOptions = (seller: string) => [
  {
    offerId: `delivery-${seller}`,
    productId: "delivery",
    title: "Доставка",
    titles: { ru: "Доставка", en: "Delivery" },
    role: "delivery",
    receiptMethod: "shipping",
  },
  ...(mockMissing && seller === "b"
    ? []
    : [
        {
          offerId: `assembly-${seller}`,
          productId: "assembly",
          title: "Сборка",
          titles: { ru: "Сборка", en: "Assembly" },
          role: "add-on",
        },
      ]),
];
const mockQuote = (seller = "a", amount = "8000") => ({
  offerId: `offer-${seller}`,
  productId: "product",
  currencyId: "rub",
  storeId: `store-${seller}`,
  quantity: 1,
  amount,
  version: `terms-${amount}`,
  expiresAt: "2030-01-01T00:00:00Z",
  currencyIds: ["rub"],
  availableQuantity: 5,
  serviceOptions: mockOptions(seller),
  issues: [],
  charges: [
    {
      offerId: `offer-${seller}`,
      role: "product",
      quantity: 1,
      amount: seller === "a" ? "5000" : "5400",
    },
    {
      offerId: `delivery-${seller}`,
      role: "delivery",
      quantity: 1,
      amount: seller === "a" ? "1000" : "500",
    },
    {
      offerId: `assembly-${seller}`,
      role: "add-on",
      quantity: 1,
      amount: seller === "a" ? "2000" : "1500",
    },
  ],
});
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    ecommerceModuleOrderSelection: () => ({
      mutateAsync: mockMutation,
      isPending: false,
    }),
  },
}));
jest.mock("@sps/ecommerce/relations/stores-to-products/sdk/client", () => ({
  api: {
    quote: ({ data }: any) => ({
      data: data.offerId
        ? {
            ...mockQuote(data.offerId.endsWith("b") ? "b" : "a"),
            offerId: data.offerId,
            quantity: data.quantity,
          }
        : undefined,
    }),
  },
}));
jest.mock("@sps/billing/models/currency/sdk/client", () => ({
  api: { find: () => ({ data: [{ id: "rub", slug: "rub", symbol: "₽" }] }) },
}));
import { Selection } from "./Selection";
const line = {
  id: "line",
  productId: "product",
  offerId: "offer-a",
  quoteVersion: "terms-8000",
  quantity: 1,
  destination: { address: "City address", region: "city" },
  selectionUpdatedAt: new Date("2026-11-17T00:00:00Z"),
  product: { title: { ru: "Шкаф" } },
};
const props: any = {
  language: "ru",
  subject: { id: "subject" },
  ecommerceModuleOrder: { id: "order" },
  line,
  details: {
    billingModuleCurrencyId: "rub",
    availableCurrencyIds: ["rub"],
    offerQuotes: [mockQuote()],
    offers: [
      {
        id: "offer-a",
        variant: "default",
        productId: "product",
        sku: "A",
        storeId: "store-a",
        store: { title: { ru: "Магазин А" } },
      },
      {
        id: "offer-b",
        variant: "default",
        productId: "product",
        sku: "B",
        storeId: "store-b",
        store: { title: { ru: "Магазин Б" } },
      },
    ],
    lines: [
      line,
      {
        id: "delivery-line",
        parentLineId: "line",
        productId: "delivery",
        offerId: "delivery-a",
        quantity: 1,
      },
      {
        id: "assembly-line",
        parentLineId: "line",
        productId: "assembly",
        offerId: "assembly-a",
        quantity: 1,
      },
    ],
  },
};
beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = jest.fn();
});
beforeEach(() => {
  mockMissing = false;
  mockMutation.mockReset().mockResolvedValue({
    quotes: [mockQuote("b", "7400")],
    applied: false,
    orderIds: ["order"],
  });
});
async function selectSeller(seller = "Б") {
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Магазин" }), {
    key: "Enter",
  });
  fireEvent.keyDown(
    await screen.findByRole("option", {
      name: `Магазин ${seller}`,
    }),
    { key: "Enter" },
  );
}
async function chooseSeller() {
  await selectSeller();
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: /Проверить цену|Посмотреть новую цену/ })
        .hasAttribute("disabled"),
    ).toBe(false),
  );
}
it("previews an equivalent seller with the same quantity, destination, currency and services", async () => {
  render(<Selection {...props} />);
  await chooseSeller();
  fireEvent.click(
    screen.getByRole("button", {
      name: /Проверить цену|Посмотреть новую цену/,
    }),
  );
  await screen.findByRole("region", { name: "Сравнение перед сохранением" });
  const comparison = screen.getByRole("region", {
    name: "Сравнение перед сохранением",
  });
  expect(
    within(comparison).getByRole("heading", { name: "Смена магазина" }),
  ).toBeTruthy();
  expect(within(comparison).getByText("Магазин А")).toBeTruthy();
  expect(within(comparison).getByText("Магазин Б")).toBeTruthy();
  expect(within(comparison).getByText("Сейчас")).toBeTruthy();
  expect(within(comparison).getByText("После подтверждения")).toBeTruthy();
  expect(mockMutation).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        action: "preview",
        lineId: "line",
        selections: [
          {
            offerId: "offer-b",
            quantity: 1,
            currencyId: "rub",
            destination: { address: "City address", region: "city" },
            services: [
              { offerId: "delivery-b", quantity: 1 },
              { offerId: "assembly-b", quantity: 1 },
            ],
          },
        ],
      }),
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
  expect(screen.getByRole("combobox", { name: "Магазин" }).textContent).toBe(
    "Магазин А",
  );
  expect(mockMutation).toHaveBeenCalledTimes(1);
});

it("identifies different offers at the same store without calling it a store change", async () => {
  const alternative = { ...props.details.offers[0], id: "offer-a2", sku: "A2" };
  const quote = { ...mockQuote(), offerId: "offer-a2" };
  mockMutation.mockResolvedValueOnce({
    quotes: [quote],
    comparisonQuotes: [quote],
    applied: false,
    orderIds: ["order"],
  });
  render(
    <Selection
      {...props}
      details={{
        ...props.details,
        offers: [...props.details.offers, alternative],
      }}
    />,
  );
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Магазин" }), {
    key: "Enter",
  });
  fireEvent.keyDown(
    await screen.findByRole("option", { name: "Магазин А · A2" }),
    { key: "Enter" },
  );
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Посмотреть новую цену" })
        .hasAttribute("disabled"),
    ).toBe(false),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Посмотреть новую цену" }),
  );
  const comparison = await screen.findByRole("region", {
    name: "Сравнение перед сохранением",
  });
  expect(
    within(comparison).getByRole("heading", {
      name: "Изменения перед сохранением",
    }),
  ).toBeTruthy();
  expect(within(comparison).getByText("Магазин А · A")).toBeTruthy();
  expect(within(comparison).getByText("Магазин А · A2")).toBeTruthy();
});

it("shows one verified price when the selection and authoritative quote are unchanged", async () => {
  const checkedQuote = {
    ...mockQuote(),
    amount: "8000.00",
    charges: mockQuote()
      .charges.map((charge) => ({
        ...charge,
        amount: `${charge.amount}.00`,
      }))
      .reverse(),
  };
  mockMutation.mockResolvedValueOnce({
    quotes: [checkedQuote],
    comparisonQuotes: [checkedQuote],
    applied: false,
    orderIds: ["order"],
  });
  render(<Selection {...props} />);
  expect(screen.getByRole("combobox", { name: "Магазин" }).tagName).toBe(
    "BUTTON",
  );
  expect(screen.getByRole("combobox", { name: "Валюта" }).tagName).toBe(
    "BUTTON",
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: /Проверить цену|Посмотреть новую цену/,
    }),
  );
  const comparison = await screen.findByRole("region", {
    name: "Сравнение перед сохранением",
  });
  expect(
    within(comparison).getByRole("heading", {
      name: "Выбор и стоимость не изменились",
    }),
  ).toBeTruthy();
  expect(within(comparison).getAllByText("Итого")).toHaveLength(1);
  expect(within(comparison).getByText("Доставка × 1")).toBeTruthy();
  expect(within(comparison).getByText("Сборка × 1")).toBeTruthy();
  expect(
    within(comparison).queryByText("Текущий магазин при новых параметрах"),
  ).toBeNull();
  expect(
    within(comparison).queryByRole("button", { name: "Подтвердить выбор" }),
  ).toBeNull();
  fireEvent.click(
    within(comparison).getByRole("button", { name: "Закрыть расчёт" }),
  );
  expect(
    screen.queryByRole("region", { name: "Сравнение перед сохранением" }),
  ).toBeNull();
  expect(mockMutation).toHaveBeenCalledTimes(1);
});

it("keeps service edits in a before and after comparison within the same store", async () => {
  const nextQuote = mockQuote("a", "6000.50");
  nextQuote.charges = [
    { ...nextQuote.charges[0], amount: "5000.50" },
    nextQuote.charges[1],
  ];
  mockMutation.mockResolvedValueOnce({
    quotes: [nextQuote],
    comparisonQuotes: [nextQuote],
    applied: false,
    orderIds: ["order"],
  });
  render(<Selection {...props} />);
  fireEvent.click(screen.getByRole("checkbox", { name: "Сборка" }));
  fireEvent.click(
    screen.getByRole("button", {
      name: /Проверить цену|Посмотреть новую цену/,
    }),
  );
  const comparison = await screen.findByRole("region", {
    name: "Сравнение перед сохранением",
  });
  expect(
    within(comparison).getByRole("heading", {
      name: "Изменения перед сохранением",
    }),
  ).toBeTruthy();
  expect(within(comparison).getAllByText("Итого")).toHaveLength(2);
  expect(within(comparison).getAllByText("Магазин А")).toHaveLength(2);
  expect(within(comparison).getAllByText("Сборка × 1")).toHaveLength(1);
  expect(within(comparison).getByText("6 000,5 ₽")).toBeTruthy();
  expect(
    within(comparison).queryByText("Текущий магазин при новых параметрах"),
  ).toBeNull();
  expect(mockMutation).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        selections: [
          expect.objectContaining({
            services: [{ offerId: "delivery-a", quantity: 1 }],
          }),
        ],
      }),
    }),
  );
});

it("toggles a service once from its full row and supports keyboard selection", async () => {
  const user = userEvent.setup();
  render(<Selection {...props} />);
  const assembly = screen.getByRole("checkbox", { name: "Сборка" });
  expect(assembly.getAttribute("aria-checked")).toBe("true");
  expect(assembly.querySelector("svg")).toBeTruthy();
  fireEvent.click(assembly.closest("label")!);
  expect(assembly.getAttribute("aria-checked")).toBe("false");
  expect(
    screen.queryByRole("spinbutton", { name: "Количество единиц услуги" }),
  ).toBeNull();
  assembly.focus();
  await user.keyboard(" ");
  expect(assembly.getAttribute("aria-checked")).toBe("true");
  expect(
    screen
      .getByRole("spinbutton", { name: "Количество единиц услуги" })
      .closest("label"),
  ).not.toBe(assembly.closest("label"));
  const delivery = screen.getByRole("checkbox", { name: "Доставка" });
  fireEvent.click(delivery.closest("label")!);
  expect(delivery.getAttribute("aria-checked")).toBe("false");
  expect(screen.queryByRole("textbox", { name: "Адрес доставки" })).toBeNull();
});
it.each([null, "old-terms"])(
  "requires confirmation when saved terms are %s even if the displayed price is identical",
  async (quoteVersion) => {
    mockMutation.mockResolvedValueOnce({
      quotes: [mockQuote()],
      comparisonQuotes: [mockQuote()],
      applied: false,
      orderIds: ["order"],
    });
    render(<Selection {...props} line={{ ...line, quoteVersion }} />);
    fireEvent.click(screen.getByRole("button", { name: "Проверить цену" }));
    const comparison = await screen.findByRole("region", {
      name: "Сравнение перед сохранением",
    });
    expect(
      within(comparison).getByRole("heading", {
        name: "Подтвердите актуальный расчёт",
      }),
    ).toBeTruthy();
    expect(within(comparison).getAllByText("Итого")).toHaveLength(1);
    fireEvent.click(
      within(comparison).getByRole("button", { name: "Подтвердить выбор" }),
    );
    await waitFor(() =>
      expect(mockMutation).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "apply",
            expectedVersions: ["terms-8000"],
          }),
        }),
      ),
    );
  },
);

it("requires confirmation for a refreshed price without buyer edits", async () => {
  mockMutation.mockResolvedValueOnce({
    quotes: [mockQuote("a", "8100.00")],
    comparisonQuotes: [mockQuote("a", "8100.00")],
    applied: false,
    orderIds: ["order"],
  });
  render(<Selection {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Проверить цену" }));
  const comparison = await screen.findByRole("region", {
    name: "Сравнение перед сохранением",
  });
  expect(within(comparison).getByText("8 000 ₽")).toBeTruthy();
  expect(within(comparison).getByText("8 100 ₽")).toBeTruthy();
  expect(
    within(comparison).getByRole("button", { name: "Подтвердить выбор" }),
  ).toBeTruthy();
  expect(mockMutation).toHaveBeenCalledTimes(1);
});

it("keeps confirmation for a legacy line without a persisted offer", async () => {
  mockMutation.mockResolvedValueOnce({
    quotes: [mockQuote()],
    comparisonQuotes: [mockQuote()],
    applied: false,
    orderIds: ["order"],
  });
  render(<Selection {...props} line={{ ...line, offerId: null }} />);
  fireEvent.click(
    screen.getByRole("button", {
      name: /Проверить цену|Посмотреть новую цену/,
    }),
  );
  expect(
    await screen.findByRole("button", { name: "Подтвердить выбор" }),
  ).toBeTruthy();
});

it("previews a split with fulfillment for both destinations and preserves the full quantity", async () => {
  const splitLine = { ...line, quantity: 3 };
  const splitProps = {
    ...props,
    line: splitLine,
    details: {
      ...props.details,
      offerQuotes: [{ ...mockQuote(), quantity: 3 }],
      lines: [splitLine, ...props.details.lines.slice(1)],
    },
  };
  mockMutation.mockResolvedValueOnce({
    quotes: [{ ...mockQuote(), quantity: 2 }, mockQuote()],
    comparisonQuotes: [{ ...mockQuote(), quantity: 2 }, mockQuote()],
    applied: false,
    orderIds: ["order"],
  });
  render(<Selection {...splitProps} />);
  fireEvent.click(
    screen.getByRole("checkbox", { name: "Разделить по адресам" }),
  );
  fireEvent.change(
    screen.getByRole("textbox", { name: "Адрес второго заказа" }),
    { target: { value: "Second address" } },
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Посмотреть новую цену" }),
  );
  await screen.findByRole("button", { name: "Подтвердить выбор" });
  expect(mockMutation).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        selections: [
          expect.objectContaining({
            quantity: 2,
            destination: { address: "City address", region: "city" },
            services: [
              { offerId: "delivery-a", quantity: 1 },
              { offerId: "assembly-a", quantity: 1 },
            ],
          }),
          expect.objectContaining({
            quantity: 1,
            destination: { address: "Second address", region: "city" },
            services: [{ offerId: "delivery-a", quantity: 1 }],
          }),
        ],
      }),
    }),
  );
});

it("applies only the previewed selection with quote and buyer draft guards", async () => {
  render(<Selection {...props} />);
  await chooseSeller();
  fireEvent.click(
    screen.getByRole("button", {
      name: /Проверить цену|Посмотреть новую цену/,
    }),
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Подтвердить выбор" }),
  );
  await waitFor(() =>
    expect(mockMutation).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "apply",
          expectedVersions: ["terms-7400"],
          expectedSelectionUpdatedAt: "2026-11-17T00:00:00.000Z",
        }),
      }),
    ),
  );
});
it("ignores a delayed preview after the buyer chooses a different seller", async () => {
  let resolve: (value: any) => void = () => {};
  mockMutation.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  render(<Selection {...props} />);
  await chooseSeller();
  fireEvent.click(
    screen.getByRole("button", {
      name: /Проверить цену|Посмотреть новую цену/,
    }),
  );
  await selectSeller("А");
  resolve({
    quotes: [mockQuote("b", "7400")],
    applied: false,
    orderIds: ["order"],
  });
  await waitFor(() =>
    expect(
      screen.queryByRole("region", { name: "Сравнение перед сохранением" }),
    ).toBeNull(),
  );
  expect(screen.getByRole("combobox", { name: "Магазин" }).textContent).toBe(
    "Магазин А",
  );
});
it("requires consent to remove a service missing from the alternative seller", async () => {
  mockMissing = true;
  render(<Selection {...props} />);
  await selectSeller();
  const consent = await screen.findByRole("checkbox", {
    name: "Подтверждаю отказ от этих услуг",
  });
  expect(
    screen
      .getByRole("button", { name: /Проверить цену|Посмотреть новую цену/ })
      .hasAttribute("disabled"),
  ).toBe(true);
  fireEvent.click(consent);
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: /Проверить цену|Посмотреть новую цену/ })
        .hasAttribute("disabled"),
    ).toBe(false),
  );
});
it("refreshes changed terms and waits for a second confirmation", async () => {
  mockMutation
    .mockResolvedValueOnce({
      quotes: [mockQuote("b", "7400")],
      applied: false,
      orderIds: ["order"],
    })
    .mockRejectedValueOnce(new Error("Conflict error. Offer terms changed"))
    .mockResolvedValueOnce({
      quotes: [mockQuote("b", "7600")],
      applied: false,
      orderIds: ["order"],
    });
  render(<Selection {...props} />);
  await chooseSeller();
  fireEvent.click(
    screen.getByRole("button", {
      name: /Проверить цену|Посмотреть новую цену/,
    }),
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Подтвердить выбор" }),
  );
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(3));
  expect(screen.getByText(/Условия изменились/)).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Подтвердить выбор" }),
  ).toBeTruthy();
});
