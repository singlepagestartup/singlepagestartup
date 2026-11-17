/** @jest-environment jsdom */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  IEcommerceCartSelection,
  IEcommerceCartSelectionResult,
} from "@sps/rbac/models/subject/sdk/model";
import type {
  IOfferCharge,
  IOfferQuote,
  IOfferServiceOption,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";

const mockMutation = jest.fn();
const mockInvalidate = jest.fn();
const mockQueryClient = { invalidateQueries: mockInvalidate };
let mockPublish:
  ((request: any, result: IEcommerceCartSelectionResult) => void) | undefined;
let mockMissing = false;
let mockSavedSequence = 0;
const mockDiscovery = new Map<string, IOfferQuote>();
const savedAt = "2026-11-17T00:00:00.000Z";

const mockOptions = (seller: string): IOfferServiceOption[] => [
  {
    offerId: `delivery-${seller}`,
    productId: "delivery",
    title: "Доставка",
    titles: { ru: "Доставка", en: "Delivery" },
    role: "delivery",
    receiptMethod: "shipping",
    currencyIds: ["rub", "usd"],
  },
  ...(mockMissing && seller === "b"
    ? []
    : [
        {
          offerId: `assembly-${seller}`,
          productId: "assembly",
          title: "Сборка",
          titles: { ru: "Сборка", en: "Assembly" },
          role: "add-on" as const,
          currencyIds: ["rub", "usd"],
        },
      ]),
];

function mockCharge(
  offerId: string,
  role: IOfferCharge["role"],
  amount: string,
  quantity = 1,
): IOfferCharge {
  return {
    offerId,
    role,
    quantity,
    amount,
    productId:
      role === "product"
        ? "product"
        : role === "delivery"
          ? "delivery"
          : "assembly",
    storeId: offerId.endsWith("-b") ? "store-b" : "store-a",
    providerStoreId: offerId.endsWith("-b") ? "store-b" : "store-a",
    recurrence: "each",
    stockQuantity: 5,
    availableQuantity: 5,
    formula: "server-formula",
    formulaVersion: "1",
    inputs: {},
  };
}

function mockQuote(
  seller = "a",
  selection?: IEcommerceCartSelection,
): IOfferQuote {
  const services = selection?.services ?? [
    { offerId: `delivery-${seller}`, quantity: 1 },
    { offerId: `assembly-${seller}`, quantity: 1 },
  ];
  const charges = [
    mockCharge(
      selection?.offerId ?? `offer-${seller}`,
      "product",
      seller === "a" ? "5000" : "5400",
      selection?.quantity ?? 1,
    ),
    ...services.map((service) =>
      mockCharge(
        service.offerId,
        service.offerId.startsWith("delivery") ? "delivery" : "add-on",
        service.offerId.startsWith("delivery")
          ? seller === "a"
            ? "1000"
            : "500"
          : seller === "a"
            ? "2000"
            : "1500",
        service.quantity,
      ),
    ),
  ];
  const amount = String(
    charges.reduce((sum, charge) => sum + Number(charge.amount), 0),
  );
  return {
    offerId: selection?.offerId ?? `offer-${seller}`,
    productId: "product",
    currencyId: selection?.currencyId ?? "rub",
    storeId: `store-${seller}`,
    quantity: selection?.quantity ?? 1,
    amount,
    version: `terms-${seller}-${amount}`,
    expiresAt: "2030-01-01T00:00:00Z",
    currencyIds: ["rub", "usd"],
    availableQuantity: 5,
    serviceOptions: mockOptions(seller),
    issues: [],
    charges,
    destination: selection?.destination,
  };
}

function mockResult(
  selections: IEcommerceCartSelection[],
  timestamp?: string,
): IEcommerceCartSelectionResult {
  return {
    quotes: selections.map((selection) =>
      mockQuote(selection.offerId === "offer-b" ? "b" : "a", selection),
    ),
    applied: true,
    orderIds: ["order"],
    selectionUpdatedAt:
      timestamp ??
      new Date(Date.parse(savedAt) + ++mockSavedSequence * 1000).toISOString(),
  };
}

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    ecommerceModuleOrderSelection: () => ({
      mutateAsync: async (request: any) => {
        const result = await mockMutation(request);
        mockPublish?.(request, result);
        return result;
      },
      isPending: false,
    }),
  },
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
}));
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQueryClient: () => mockQueryClient,
}));
jest.mock("@sps/ecommerce/relations/stores-to-products/sdk/client", () => ({
  api: {
    quote: ({ data }: { data: IEcommerceCartSelection }) => {
      const key = JSON.stringify(data);
      if (data.offerId && !mockDiscovery.has(key))
        mockDiscovery.set(key, {
          ...mockQuote(data.offerId === "offer-b" ? "b" : "a", data),
          amount: "999999",
          charges: [],
        });
      return { data: mockDiscovery.get(key) };
    },
  },
}));
jest.mock("@sps/billing/models/currency/sdk/client", () => ({
  api: {
    find: () => ({
      data: [
        { id: "rub", slug: "rub", symbol: "₽" },
        { id: "usd", slug: "usd", symbol: "$" },
      ],
    }),
  },
}));

import { Selection } from "./Selection";

const line = {
  id: "line",
  productId: "product",
  offerId: "offer-a",
  quoteVersion: "terms-a-8000",
  quantity: 1,
  destination: { address: "City address", region: "city" },
  selectionUpdatedAt: new Date(savedAt),
  product: { title: { ru: "Шкаф", en: "Wardrobe" } },
};
const props: any = {
  language: "ru",
  subject: { id: "subject" },
  ecommerceModuleOrder: { id: "order" },
  line,
  details: {
    billingModuleCurrencyId: "rub",
    availableCurrencyIds: ["rub", "usd"],
    offerQuotes: [mockQuote()],
    offers: [
      {
        id: "offer-a",
        variant: "default",
        productId: "product",
        sku: "A",
        storeId: "store-a",
        store: { title: { ru: "Магазин А", en: "Store A" } },
      },
      {
        id: "offer-b",
        variant: "default",
        productId: "product",
        sku: "B",
        storeId: "store-b",
        store: { title: { ru: "Магазин Б", en: "Store B" } },
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
  mockSavedSequence = 0;
  mockDiscovery.clear();
  mockPublish = undefined;
  mockInvalidate.mockReset().mockResolvedValue(undefined);
  mockMutation
    .mockReset()
    .mockImplementation(async ({ data }) => mockResult(data.selections));
});

async function selectOption(name: string, option: string) {
  fireEvent.keyDown(screen.getByRole("combobox", { name }), { key: "Enter" });
  fireEvent.keyDown(await screen.findByRole("option", { name: option }), {
    key: "Enter",
  });
}
function receipt() {
  return within(screen.getByRole("region", { name: "Расчёт" }));
}
function savedSnapshot(
  current: any,
  selection: IEcommerceCartSelection,
  result: IEcommerceCartSelectionResult,
) {
  const primary = {
    ...current.line,
    offerId: selection.offerId,
    quantity: selection.quantity,
    destination: selection.destination,
    quoteVersion: result.quotes[0].version,
    selectionUpdatedAt: new Date(result.selectionUpdatedAt!),
  };
  const services = (selection.services ?? []).map((service) => ({
    id: `saved-${service.offerId}`,
    parentLineId: primary.id,
    productId: result.quotes[0].serviceOptions.find(
      (option) => option.offerId === service.offerId,
    )!.productId,
    ...service,
  }));
  return {
    ...current,
    line: primary,
    details: {
      ...current.details,
      billingModuleCurrencyId: selection.currencyId,
      offerQuotes: [result.quotes[0]],
      lines: [primary, ...services],
    },
  };
}
function renderSelection(initial = props) {
  let current = initial;
  const view = render(<Selection {...current} />);
  // The SDK awaits its authorized cart-list refetch before resolving a save.
  mockPublish = (request, result) => {
    if (!result.applied || !result.selectionUpdatedAt) return;
    current = savedSnapshot(current, request.data.selections[0], result);
    view.rerender(<Selection {...current} />);
  };
  return view;
}
async function settleDebounce() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
  });
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

it("shows one itemized server receipt on mount without writing or confirmation controls", async () => {
  const onSelectionStateChange = jest.fn();
  renderSelection({ ...props, onSelectionStateChange });
  expect(screen.getByRole("combobox", { name: "Магазин" }).tagName).toBe(
    "BUTTON",
  );
  expect(screen.getByRole("combobox", { name: "Валюта" }).tagName).toBe(
    "BUTTON",
  );
  expect(receipt().getByText("Шкаф × 1")).toBeTruthy();
  expect(receipt().getByText("Доставка × 1")).toBeTruthy();
  expect(receipt().getByText("Сборка × 1")).toBeTruthy();
  expect(receipt().getByText("8 000 ₽")).toBeTruthy();
  expect(screen.getAllByText("Итого")).toHaveLength(1);
  expect(screen.queryByText("999 999 ₽")).toBeNull();
  expect(
    screen.queryByRole("button", {
      name: /Проверить цену|Посмотреть новую цену|Подтвердить выбор|Отмена/,
    }),
  ).toBeNull();
  expect(
    receipt().getByText("Итого").parentElement!.nextElementSibling,
  ).toBeNull();
  expect(
    screen.getByRole("region", { name: "Расчёт" }).nextElementSibling,
  ).toBeNull();
  await settleDebounce();
  expect(mockMutation).not.toHaveBeenCalled();
  expect(onSelectionStateChange).not.toHaveBeenCalledWith("line", true);
});

it("automatically persists removing and adding a service from the full row and keyboard", async () => {
  const user = userEvent.setup();
  renderSelection();
  const assembly = screen.getByRole("checkbox", { name: "Сборка" });
  expect(assembly.getAttribute("aria-checked")).toBe("true");
  expect(assembly.querySelector("svg")).toBeTruthy();
  fireEvent.click(assembly.closest("label")!);
  expect(assembly.getAttribute("aria-checked")).toBe("false");
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
  expect(mockMutation).toHaveBeenLastCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        action: "save",
        selections: [
          expect.objectContaining({
            services: [{ offerId: "delivery-a", quantity: 1 }],
          }),
        ],
      }),
    }),
  );
  await waitFor(() => expect(receipt().getByText("6 000 ₽")).toBeTruthy());
  expect(receipt().queryByText("Сборка × 1")).toBeNull();
  expect(
    screen.queryByRole("spinbutton", { name: "Количество единиц услуги" }),
  ).toBeNull();
  assembly.focus();
  await user.keyboard(" ");
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(2));
  expect(assembly.getAttribute("aria-checked")).toBe("true");
  expect(
    screen
      .getByRole("spinbutton", { name: "Количество единиц услуги" })
      .closest("label"),
  ).not.toBe(assembly.closest("label"));
  await waitFor(() => expect(receipt().getByText("8 000 ₽")).toBeTruthy());
  expect(mockMutation.mock.calls[1][0].data.expectedSelectionUpdatedAt).toBe(
    "2026-11-17T00:00:01.000Z",
  );
});

it("saves an equivalent seller immediately with mapped services and the original destination and currency", async () => {
  renderSelection();
  await selectOption("Магазин", "Магазин Б");
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
  expect(mockMutation).toHaveBeenCalledWith({
    id: "subject",
    orderId: "order",
    data: {
      action: "save",
      lineId: "line",
      expectedSelectionUpdatedAt: savedAt,
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
    },
  });
  await waitFor(() => expect(receipt().getByText("7 400 ₽")).toBeTruthy());
  expect(receipt().queryByText("8 000 ₽")).toBeNull();
  expect(screen.getAllByText("Итого")).toHaveLength(1);
});

it("debounces rapid quantity and address edits and renders server charge amounts without local price multiplication", async () => {
  const onSelectionStateChange = jest.fn();
  mockMutation.mockImplementation(async ({ data }) => {
    const result = mockResult(data.selections);
    result.quotes[0] = {
      ...result.quotes[0],
      amount: "11600.80",
      charges: [
        mockCharge("offer-a", "product", "9900.25", 3),
        mockCharge("delivery-a", "delivery", "1350"),
        mockCharge("assembly-a", "add-on", "350.55"),
      ],
    };
    return result;
  });
  renderSelection({ ...props, onSelectionStateChange });
  fireEvent.change(screen.getByRole("spinbutton", { name: "Количество" }), {
    target: { value: "2" },
  });
  expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", true);
  fireEvent.change(screen.getByRole("spinbutton", { name: "Количество" }), {
    target: { value: "3" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Адрес доставки" }), {
    target: { value: "New address" },
  });
  expect(mockMutation).not.toHaveBeenCalled();
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
  expect(mockMutation.mock.calls[0][0].data.selections[0]).toEqual(
    expect.objectContaining({
      quantity: 3,
      destination: { address: "New address", region: "city" },
    }),
  );
  await waitFor(() => expect(receipt().getByText("11 600,8 ₽")).toBeTruthy());
  expect(receipt().getByText("9 900,25 ₽")).toBeTruthy();
  expect(receipt().getByText("350,55 ₽")).toBeTruthy();
  expect(receipt().getByText("Шкаф × 3")).toBeTruthy();
  expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", false);
});

it("serializes overlapping saves, keeps controls editable, and chains the returned concurrency timestamp", async () => {
  const first = deferred<IEcommerceCartSelectionResult>();
  const second = deferred<IEcommerceCartSelectionResult>();
  const onSelectionStateChange = jest.fn();
  mockMutation
    .mockImplementationOnce(() => first.promise)
    .mockImplementationOnce(() => second.promise);
  renderSelection({ ...props, onSelectionStateChange });
  fireEvent.change(screen.getByRole("spinbutton", { name: "Количество" }), {
    target: { value: "2" },
  });
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("status").textContent).toMatch(/Сохраняем/);
  expect(
    screen.getByRole("region", { name: "Расчёт" }).getAttribute("aria-busy"),
  ).toBe("true");
  expect(
    screen.getByRole("combobox", { name: "Магазин" }).hasAttribute("disabled"),
  ).toBe(false);
  const assembly = screen.getByRole("checkbox", { name: "Сборка" });
  expect(assembly.hasAttribute("disabled")).toBe(false);
  fireEvent.change(screen.getByRole("spinbutton", { name: "Количество" }), {
    target: { value: "3" },
  });
  fireEvent.click(assembly);
  await settleDebounce();
  expect(mockMutation).toHaveBeenCalledTimes(1);
  const firstResult = mockResult(
    mockMutation.mock.calls[0][0].data.selections,
    "2026-11-17T00:00:10.000Z",
  );
  firstResult.quotes[0].amount = "16000";
  firstResult.quotes[0].charges[0].amount = "13000";
  await act(async () => first.resolve(firstResult));
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(2));
  expect(mockMutation.mock.calls[1][0].data).toEqual(
    expect.objectContaining({
      expectedSelectionUpdatedAt: "2026-11-17T00:00:10.000Z",
      selections: [
        expect.objectContaining({
          quantity: 3,
          services: [{ offerId: "delivery-a", quantity: 1 }],
        }),
      ],
    }),
  );
  expect(receipt().queryByText("16 000 ₽")).toBeNull();
  expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", true);
  const secondResult = mockResult(
    mockMutation.mock.calls[1][0].data.selections,
    "2026-11-17T00:00:11.000Z",
  );
  secondResult.quotes[0].amount = "18000";
  secondResult.quotes[0].charges[0].amount = "17000";
  await act(async () => second.resolve(secondResult));
  await waitFor(() => expect(receipt().getByText("18 000 ₽")).toBeTruthy());
  expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", false);
  expect(
    screen.getByRole("region", { name: "Расчёт" }).getAttribute("aria-busy"),
  ).toBe("false");
  expect(
    mockMutation.mock.calls.map(([request]) => request.data.action),
  ).toEqual(["save", "save"]);
});

it("requires an explicit choice before dropping a service unavailable at another seller", async () => {
  mockMissing = true;
  renderSelection();
  await selectOption("Магазин", "Магазин Б");
  const remove = await screen.findByRole("checkbox", {
    name: "Убрать недоступные услуги",
  });
  await settleDebounce();
  expect(mockMutation).not.toHaveBeenCalled();
  expect(screen.getByRole("alert").textContent).toMatch(/Сборка/);
  fireEvent.click(remove);
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
  expect(mockMutation.mock.calls[0][0].data.selections[0].services).toEqual([
    { offerId: "delivery-b", quantity: 1 },
  ]);
  await waitFor(() => expect(receipt().getByText("5 900 ₽")).toBeTruthy());
});

it("keeps an incomplete destination unsaved and recovers automatically after the address is completed", async () => {
  const onSelectionStateChange = jest.fn();
  mockMutation.mockImplementationOnce(async ({ data }) => {
    const result = mockResult(data.selections);
    return {
      ...result,
      applied: false,
      selectionUpdatedAt: undefined,
      quotes: [
        {
          ...result.quotes[0],
          amount: null,
          issues: [
            {
              code: "destination",
              offerId: "delivery-a",
              message: "Delivery address is required",
            },
          ],
        },
      ],
    };
  });
  renderSelection({ ...props, onSelectionStateChange });
  fireEvent.change(screen.getByRole("textbox", { name: "Адрес доставки" }), {
    target: { value: "" },
  });
  expect(await screen.findByText("Delivery address is required")).toBeTruthy();
  expect(mockMutation).toHaveBeenCalledTimes(1);
  expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", true);
  expect(receipt().queryByText("8 000 ₽")).toBeNull();
  expect(receipt().getByText("Нужен выбор")).toBeTruthy();
  fireEvent.change(screen.getByRole("textbox", { name: "Адрес доставки" }), {
    target: { value: "Complete address" },
  });
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(2));
  expect(
    mockMutation.mock.calls[1][0].data.selections[0].destination.address,
  ).toBe("Complete address");
  await waitFor(() =>
    expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", false),
  );
});

it("shows stock issues without a saved total and retains the original guard until a valid edit succeeds", async () => {
  const onSelectionStateChange = jest.fn();
  mockMutation.mockImplementationOnce(async ({ data }) => {
    const result = mockResult(data.selections);
    return {
      ...result,
      applied: false,
      selectionUpdatedAt: undefined,
      quotes: [
        {
          ...result.quotes[0],
          amount: null,
          issues: [
            {
              code: "stock",
              offerId: "offer-a",
              message: "Only one item is available",
              available: 1,
            },
          ],
        },
      ],
    };
  });
  renderSelection({ ...props, onSelectionStateChange });
  fireEvent.change(screen.getByRole("spinbutton", { name: "Количество" }), {
    target: { value: "2" },
  });
  expect(await screen.findByText("Only one item is available")).toBeTruthy();
  expect(receipt().getByText("Нужен выбор")).toBeTruthy();
  expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", true);
  fireEvent.change(screen.getByRole("spinbutton", { name: "Количество" }), {
    target: { value: "1" },
  });
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(2));
  expect(mockMutation.mock.calls[1][0].data.expectedSelectionUpdatedAt).toBe(
    savedAt,
  );
  await waitFor(() =>
    expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", false),
  );
  expect(screen.queryByText("Only one item is available")).toBeNull();
});

it("retains the latest draft after a network failure and retries without a confirmation step", async () => {
  const onSelectionStateChange = jest.fn();
  mockMutation.mockRejectedValueOnce(new Error("Network unavailable"));
  renderSelection({ ...props, onSelectionStateChange });
  fireEvent.click(screen.getByRole("checkbox", { name: "Сборка" }));
  expect(await screen.findByText("Network unavailable")).toBeTruthy();
  expect(receipt().queryByText("8 000 ₽")).toBeNull();
  expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", true);
  expect(
    screen
      .getByRole("checkbox", { name: "Сборка" })
      .getAttribute("aria-checked"),
  ).toBe("false");
  fireEvent.click(screen.getByRole("button", { name: "Повторить сохранение" }));
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(2));
  expect(mockMutation.mock.calls[1][0].data).toEqual(
    mockMutation.mock.calls[0][0].data,
  );
  await waitFor(() => expect(receipt().getByText("6 000 ₽")).toBeTruthy());
  expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", false);
});

it("keeps a conflicting edit blocked until refreshed cart data supplies the current concurrency timestamp", async () => {
  const onSelectionStateChange = jest.fn();
  mockMutation.mockRejectedValueOnce(
    new Error(
      "Conflict error. Cart selection changed. Reload and compare again",
    ),
  );
  const view = renderSelection({ ...props, onSelectionStateChange });
  fireEvent.click(screen.getByRole("checkbox", { name: "Сборка" }));
  expect(
    await screen.findByText(/Позиция изменилась в другом окне/),
  ).toBeTruthy();
  expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", true);
  await settleDebounce();
  expect(mockMutation).toHaveBeenCalledTimes(1);
  view.rerender(
    <Selection
      {...props}
      line={{
        ...line,
        selectionUpdatedAt: new Date("2026-11-17T00:00:30.000Z"),
      }}
      onSelectionStateChange={onSelectionStateChange}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Повторить сохранение" }));
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(2));
  expect(mockMutation.mock.calls[1][0].data.expectedSelectionUpdatedAt).toBe(
    "2026-11-17T00:00:30.000Z",
  );
  expect(mockMutation.mock.calls[1][0].data.selections[0].services).toEqual([
    { offerId: "delivery-a", quantity: 1 },
  ]);
});

it("splits only on the structural action, preserving total quantity and fulfillment for both addresses", async () => {
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
  renderSelection(splitProps);
  fireEvent.click(
    screen.getByRole("checkbox", { name: "Разделить по адресам" }),
  );
  await settleDebounce();
  expect(mockMutation).not.toHaveBeenCalled();
  expect(
    screen
      .getByRole("button", { name: "Разделить заказ" })
      .hasAttribute("disabled"),
  ).toBe(true);
  fireEvent.change(
    screen.getByRole("textbox", { name: "Адрес второго заказа" }),
    {
      target: { value: "City address" },
    },
  );
  await settleDebounce();
  expect(mockMutation).not.toHaveBeenCalled();
  expect(
    screen
      .getByRole("button", { name: "Разделить заказ" })
      .hasAttribute("disabled"),
  ).toBe(true);
  fireEvent.change(
    screen.getByRole("textbox", { name: "Адрес второго заказа" }),
    { target: { value: "Second address" } },
  );
  await settleDebounce();
  expect(mockMutation).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Разделить заказ" }));
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
  expect(mockMutation.mock.calls[0][0].data).toEqual(
    expect.objectContaining({
      action: "save",
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
  );
  await waitFor(() => expect(receipt().getByText("Шкаф × 2")).toBeTruthy());
  expect(screen.getAllByRole("region", { name: "Расчёт" })).toHaveLength(1);
  expect(screen.getAllByText("Итого")).toHaveLength(1);
});

it("persists currency and service quantity changes with prices from the returned quote", async () => {
  mockMutation.mockImplementation(async ({ data }) => {
    const result = mockResult(data.selections);
    const serviceQuantity = data.selections[0].services.find(
      (service: { offerId: string }) => service.offerId === "assembly-a",
    ).quantity;
    result.quotes[0] = {
      ...result.quotes[0],
      amount: serviceQuantity === 2 ? "102.35" : "92.35",
      charges: [
        mockCharge("offer-a", "product", "70", 2),
        mockCharge("delivery-a", "delivery", "12.35"),
        mockCharge(
          "assembly-a",
          "add-on",
          serviceQuantity === 2 ? "20" : "10",
          serviceQuantity,
        ),
      ],
    };
    return result;
  });
  const quantityLine = { ...line, quantity: 2 };
  renderSelection({
    ...props,
    line: quantityLine,
    details: {
      ...props.details,
      lines: [quantityLine, ...props.details.lines.slice(1)],
    },
  });
  await selectOption("Валюта", "USD");
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
  expect(mockMutation.mock.calls[0][0].data.selections[0].currencyId).toBe(
    "usd",
  );
  await waitFor(() => expect(receipt().getByText("92,35 $")).toBeTruthy());
  fireEvent.change(
    screen.getByRole("spinbutton", { name: "Количество единиц услуги" }),
    { target: { value: "2" } },
  );
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(2));
  expect(
    mockMutation.mock.calls[1][0].data.selections[0].services,
  ).toContainEqual({ offerId: "assembly-a", quantity: 2 });
  await waitFor(() => expect(receipt().getByText("102,35 $")).toBeTruthy());
  expect(receipt().getByText("Сборка × 2")).toBeTruthy();
});

it("adopts refreshed server receipts without writing when the buyer has not edited", async () => {
  const view = renderSelection();
  view.rerender(
    <Selection
      {...props}
      details={{
        ...props.details,
        offerQuotes: [{ ...mockQuote(), amount: "8100.50" }],
      }}
    />,
  );
  expect(receipt().getByText("8 100,5 ₽")).toBeTruthy();
  await settleDebounce();
  expect(mockMutation).not.toHaveBeenCalled();
});

it.each([null, "old-terms"])(
  "offers explicit price recovery for saved quote version %s without writing on mount",
  async (quoteVersion) => {
    const onSelectionStateChange = jest.fn();
    renderSelection({
      ...props,
      line: { ...line, quoteVersion },
      onSelectionStateChange,
    });
    expect(screen.getByText("Цена или условия изменились.")).toBeTruthy();
    expect(receipt().queryByText("8 000 ₽")).toBeNull();
    expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", true);
    await settleDebounce();
    expect(mockMutation).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Обновить цену" }));
    await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
    expect(mockMutation.mock.calls[0][0].data).toEqual(
      expect.objectContaining({
        action: "save",
        expectedSelectionUpdatedAt: savedAt,
        selections: [
          expect.objectContaining({ offerId: "offer-a", quantity: 1 }),
        ],
      }),
    );
    await waitFor(() =>
      expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", false),
    );
    expect(receipt().getByText("8 000 ₽")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Обновить цену" })).toBeNull();
  },
);

it("keeps checkout blocked after a successful write until the authoritative list matches and retries only the cart refresh", async () => {
  const onSelectionStateChange = jest.fn();
  const view = render(
    <Selection {...props} onSelectionStateChange={onSelectionStateChange} />,
  );
  fireEvent.click(screen.getByRole("checkbox", { name: "Сборка" }));
  expect(
    await screen.findByRole("button", { name: "Обновить корзину" }),
  ).toBeTruthy();
  expect(mockMutation).toHaveBeenCalledTimes(1);
  expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", true);
  expect(screen.getByRole("status").textContent).toMatch(/Обновляем корзину/);
  expect(receipt().queryByText("6 000 ₽")).toBeNull();
  mockInvalidate.mockRejectedValueOnce(new Error("Cart refresh unavailable"));
  fireEvent.click(screen.getByRole("button", { name: "Обновить корзину" }));
  expect(
    await screen.findByText("Не удалось обновить корзину. Попробуйте ещё раз."),
  ).toBeTruthy();
  expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", true);
  expect(mockMutation).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Обновить корзину" }));
  await waitFor(() => expect(mockInvalidate).toHaveBeenCalledTimes(2));
  expect(mockInvalidate).toHaveBeenLastCalledWith(
    { queryKey: ["/api/rbac/subjects/subject/ecommerce-module/orders"] },
    { throwOnError: true },
  );
  expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", true);
  const request = mockMutation.mock.calls[0][0];
  const result = await mockMutation.mock.results[0].value;
  const snapshot = savedSnapshot(
    { ...props, onSelectionStateChange },
    request.data.selections[0],
    result,
  );
  view.rerender(<Selection {...snapshot} />);
  await waitFor(() =>
    expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", false),
  );
  expect(receipt().getByText("6 000 ₽")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Обновить корзину" })).toBeNull();
  expect(mockMutation).toHaveBeenCalledTimes(1);
});

it("preserves services when switching back from a seller that cannot supply them", async () => {
  mockMissing = true;
  renderSelection();
  await selectOption("Магазин", "Магазин Б");
  expect(
    await screen.findByRole("checkbox", { name: "Убрать недоступные услуги" }),
  ).toBeTruthy();
  expect(mockMutation).not.toHaveBeenCalled();
  await selectOption("Магазин", "Магазин А");
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
  expect(mockMutation.mock.calls[0][0].data.selections[0]).toEqual(
    expect.objectContaining({
      offerId: "offer-a",
      services: [
        { offerId: "delivery-a", quantity: 1 },
        { offerId: "assembly-a", quantity: 1 },
      ],
    }),
  );
  expect(
    screen
      .getByRole("checkbox", { name: "Сборка" })
      .getAttribute("aria-checked"),
  ).toBe("true");
  expect(
    screen.queryByRole("checkbox", { name: "Убрать недоступные услуги" }),
  ).toBeNull();
});

it("preserves the draft for review when another cart revision is newer than a delayed successful save", async () => {
  const first = deferred<IEcommerceCartSelectionResult>();
  const onSelectionStateChange = jest.fn();
  mockMutation
    .mockImplementationOnce(() => first.promise)
    .mockImplementationOnce(async ({ data }) =>
      mockResult(data.selections, "2026-11-17T00:00:31.000Z"),
    );
  const view = render(
    <Selection {...props} onSelectionStateChange={onSelectionStateChange} />,
  );
  fireEvent.click(screen.getByRole("checkbox", { name: "Сборка" }));
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
  view.rerender(
    <Selection
      {...props}
      line={{
        ...line,
        selectionUpdatedAt: new Date("2026-11-17T00:00:30.000Z"),
      }}
      onSelectionStateChange={onSelectionStateChange}
    />,
  );
  const result = mockResult(
    mockMutation.mock.calls[0][0].data.selections,
    "2026-11-17T00:00:10.000Z",
  );
  await act(async () => first.resolve(result));
  expect(
    await screen.findByText(/Позиция изменилась в другом окне/),
  ).toBeTruthy();
  expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", true);
  expect(
    screen
      .getByRole("checkbox", { name: "Сборка" })
      .getAttribute("aria-checked"),
  ).toBe("false");
  fireEvent.click(screen.getByRole("button", { name: "Повторить сохранение" }));
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(2));
  expect(mockMutation.mock.calls[1][0].data).toEqual(
    expect.objectContaining({
      expectedSelectionUpdatedAt: "2026-11-17T00:00:30.000Z",
      selections: [
        expect.objectContaining({
          services: [{ offerId: "delivery-a", quantity: 1 }],
        }),
      ],
    }),
  );
  const latest = await mockMutation.mock.results[1].value;
  view.rerender(
    <Selection
      {...savedSnapshot(
        { ...props, onSelectionStateChange },
        mockMutation.mock.calls[1][0].data.selections[0],
        latest,
      )}
    />,
  );
  await waitFor(() =>
    expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", false),
  );
  expect(receipt().getByText("6 000 ₽")).toBeTruthy();
});
