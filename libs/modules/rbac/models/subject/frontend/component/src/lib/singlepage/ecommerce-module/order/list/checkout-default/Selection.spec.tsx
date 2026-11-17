/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
const mockMutation = jest.fn();
let mockMissing = false;
const mockOptions = (seller: string) => [
  {
    offerId: `delivery-${seller}`,
    productId: "delivery",
    title: "Доставка",
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
          role: "add-on",
        },
      ]),
];
const mockQuote = (seller = "a", amount = "8000") => ({
  offerId: `offer-${seller}`,
  productId: "product",
  currencyId: "rub",
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
        store: { title: { ru: "Магазин А" } },
      },
      {
        id: "offer-b",
        variant: "default",
        productId: "product",
        sku: "B",
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
beforeEach(() => {
  mockMissing = false;
  mockMutation.mockReset().mockResolvedValue({
    quotes: [mockQuote("b", "7400")],
    applied: false,
    orderIds: ["order"],
  });
});
async function chooseSeller() {
  fireEvent.change(screen.getAllByRole("combobox")[0], {
    target: { value: "offer-b" },
  });
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Сравнить полный расчёт" })
        .hasAttribute("disabled"),
    ).toBe(false),
  );
}
it("previews an equivalent seller with the same quantity, destination, currency and services", async () => {
  render(<Selection {...props} />);
  await chooseSeller();
  fireEvent.click(
    screen.getByRole("button", { name: "Сравнить полный расчёт" }),
  );
  await screen.findByRole("region", { name: "Сравнение перед сохранением" });
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
  expect((screen.getAllByRole("combobox")[0] as HTMLSelectElement).value).toBe(
    "offer-a",
  );
  expect(mockMutation).toHaveBeenCalledTimes(1);
});
it("applies only the previewed selection with quote and buyer draft guards", async () => {
  render(<Selection {...props} />);
  await chooseSeller();
  fireEvent.click(
    screen.getByRole("button", { name: "Сравнить полный расчёт" }),
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
    screen.getByRole("button", { name: "Сравнить полный расчёт" }),
  );
  fireEvent.change(screen.getAllByRole("combobox")[0], {
    target: { value: "offer-a" },
  });
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
  expect((screen.getAllByRole("combobox")[0] as HTMLSelectElement).value).toBe(
    "offer-a",
  );
});
it("requires consent to remove a service missing from the alternative seller", async () => {
  mockMissing = true;
  render(<Selection {...props} />);
  fireEvent.change(screen.getAllByRole("combobox")[0], {
    target: { value: "offer-b" },
  });
  const consent = await screen.findByRole("checkbox", {
    name: "Подтверждаю отказ от этих услуг",
  });
  expect(
    screen
      .getByRole("button", { name: "Сравнить полный расчёт" })
      .hasAttribute("disabled"),
  ).toBe(true);
  fireEvent.click(consent);
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Сравнить полный расчёт" })
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
    screen.getByRole("button", { name: "Сравнить полный расчёт" }),
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
