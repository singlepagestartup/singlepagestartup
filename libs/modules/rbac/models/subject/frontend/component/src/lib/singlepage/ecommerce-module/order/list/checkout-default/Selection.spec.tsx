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
let mockPickup = false;
let mockCurrencyLoading = false;
let mockDeliveryTariff: IOfferServiceOption["deliveryTariff"] | undefined;
let mockSavedSequence = 0;
const mockDiscovery = new Map<string, IOfferQuote>();
const savedAt = "2026-11-17T00:00:00.000Z";

const mockOptions = (
  seller: string,
  currencyId = "rub",
): IOfferServiceOption[] => [
  {
    offerId: `delivery-${seller}`,
    productId: "delivery",
    title: "Доставка",
    titles: { ru: "Доставка", en: "Delivery" },
    role: "delivery",
    receiptMethod: "shipping",
    deliveryTariff: mockDeliveryTariff ?? {
      basis: "fixed",
      fixedAmount:
        currencyId === "usd" ? "12.35" : seller === "a" ? "1000" : "500",
    },
    currencyIds: ["rub", "usd"],
  },
  ...(mockPickup
    ? [
        {
          offerId: `pickup-${seller}`,
          productId: "pickup",
          title: "Пункт выдачи",
          titles: { ru: "Пункт выдачи", en: "Collection point" },
          role: "delivery" as const,
          receiptMethod: "pickup" as const,
          pickupPointIds: ["pickup-1", "pickup-2"],
          currencyIds: ["rub", "usd"],
        },
      ]
    : []),
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
          ? offerId.startsWith("pickup")
            ? "pickup"
            : "delivery"
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
        /^(delivery|pickup)/.test(service.offerId) ? "delivery" : "add-on",
        service.offerId.startsWith("pickup")
          ? "0"
          : service.offerId.startsWith("delivery")
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
    serviceOptions: mockOptions(seller, selection?.currencyId),
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
    addressSuggestions: () => ({
      data: { suggestions: [] },
      isPending: false,
      isFetching: false,
      isError: false,
    }),
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
      data: mockCurrencyLoading
        ? undefined
        : [
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
  mockPickup = false;
  mockCurrencyLoading = false;
  mockDeliveryTariff = undefined;
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
  const onSelectionPendingChange = jest.fn();
  renderSelection({
    ...props,
    onSelectionStateChange,
    onSelectionPendingChange,
  });
  expect(screen.getByRole("combobox", { name: "Магазин" }).tagName).toBe(
    "BUTTON",
  );
  expect(screen.getByRole("combobox", { name: "Валюта" }).tagName).toBe(
    "BUTTON",
  );
  const store = screen.getByRole("combobox", { name: "Магазин" });
  for (const control of [
    screen.getByRole("spinbutton", { name: "Количество" }),
    screen.getByRole("combobox", { name: "Валюта" }),
    screen.getByLabelText("Стоимость товара"),
  ]) {
    expect(
      control.compareDocumentPosition(store) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  }
  expect(
    screen
      .getByLabelText("Стоимость товара")
      .textContent?.replace(/\u00a0/g, " "),
  ).toContain("5 000 ₽");
  expect(receipt().queryByRole("status")).toBeNull();
  expect(receipt().getByText("Шкаф × 1")).toBeTruthy();
  expect(receipt().getByText("Доставка × 1")).toBeTruthy();
  expect(receipt().getByText("Сборка × 1")).toBeTruthy();
  expect(receipt().getByText("8 000 ₽")).toBeTruthy();
  expect(screen.getAllByText("Итого")).toHaveLength(1);
  expect(screen.queryByText("999 999 ₽")).toBeNull();
  expect(screen.queryByText("Выбор сохранён.")).toBeNull();
  expect(screen.queryByText("Selection saved.")).toBeNull();
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
  expect(onSelectionPendingChange).not.toHaveBeenCalledWith("line", true);
});

it("automatically persists removing and adding a service from its label and keyboard", async () => {
  const user = userEvent.setup();
  renderSelection();
  const assembly = screen.getByRole("checkbox", { name: "Сборка" });
  expect(assembly.getAttribute("aria-checked")).toBe("true");
  expect(assembly.querySelector("svg")).toBeTruthy();
  const assemblyLabel = within(screen.getByRole("group", { name: "Сборка" }))
    .getByText("Сборка")
    .closest("label")!;
  fireEvent.click(assemblyLabel);
  expect(assembly.getAttribute("aria-checked")).toBe("false");
  expect(receipt().queryByText("Шкаф × 1")).toBeNull();
  expect(
    screen
      .getByLabelText("Стоимость товара")
      .textContent?.replace(/\u00a0/g, " "),
  ).not.toContain("5 000 ₽");
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
    assemblyLabel.contains(
      screen.getByRole("spinbutton", { name: "Количество единиц услуги" }),
    ),
  ).toBe(false);
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
  const onSelectionPendingChange = jest.fn();
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
  renderSelection({
    ...props,
    onSelectionStateChange,
    onSelectionPendingChange,
  });
  fireEvent.change(screen.getByRole("spinbutton", { name: "Количество" }), {
    target: { value: "2" },
  });
  expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", true);
  expect(onSelectionPendingChange).toHaveBeenLastCalledWith("line", true);
  expect(receipt().queryByText("Шкаф × 1")).toBeNull();
  expect(receipt().queryByText("8 000 ₽")).toBeNull();
  expect(
    screen
      .getByLabelText("Стоимость товара")
      .textContent?.replace(/\u00a0/g, " "),
  ).not.toContain("5 000 ₽");
  fireEvent.change(screen.getByRole("spinbutton", { name: "Количество" }), {
    target: { value: "3" },
  });
  fireEvent.change(screen.getByLabelText("Адрес доставки"), {
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
  expect(
    screen
      .getByLabelText("Стоимость товара")
      .textContent?.replace(/\u00a0/g, " "),
  ).toContain("9 900,25 ₽");
  expect(receipt().getByText("350,55 ₽")).toBeTruthy();
  expect(
    within(screen.getByRole("group", { name: "Доставка" })).getByText(
      "1 350 ₽",
    ),
  ).toBeTruthy();
  expect(
    within(screen.getByRole("group", { name: "Доставка" })).queryByText(
      "1 000 ₽",
    ),
  ).toBeNull();
  expect(receipt().getByText("Шкаф × 3")).toBeTruthy();
  expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", false);
  expect(onSelectionPendingChange).toHaveBeenLastCalledWith("line", false);
});

it("serializes overlapping saves, keeps controls editable, and chains the returned concurrency timestamp", async () => {
  const first = deferred<IEcommerceCartSelectionResult>();
  const second = deferred<IEcommerceCartSelectionResult>();
  const onSelectionStateChange = jest.fn();
  const onSelectionPendingChange = jest.fn();
  mockMutation
    .mockImplementationOnce(() => first.promise)
    .mockImplementationOnce(() => second.promise);
  renderSelection({
    ...props,
    onSelectionStateChange,
    onSelectionPendingChange,
  });
  fireEvent.change(screen.getByRole("spinbutton", { name: "Количество" }), {
    target: { value: "2" },
  });
  expect(onSelectionPendingChange).toHaveBeenLastCalledWith("line", true);
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
  expect(receipt().getByRole("status").textContent).toMatch(/Сохраняем/);
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
  expect(onSelectionPendingChange.mock.calls).toEqual([["line", true]]);
  const secondResult = mockResult(
    mockMutation.mock.calls[1][0].data.selections,
    "2026-11-17T00:00:11.000Z",
  );
  secondResult.quotes[0].amount = "18000";
  secondResult.quotes[0].charges[0].amount = "17000";
  await act(async () => second.resolve(secondResult));
  await waitFor(() => expect(receipt().getByText("18 000 ₽")).toBeTruthy());
  expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", false);
  expect(onSelectionPendingChange).toHaveBeenLastCalledWith("line", false);
  expect(
    screen.getByRole("region", { name: "Расчёт" }).getAttribute("aria-busy"),
  ).toBe("false");
  expect(
    mockMutation.mock.calls.map(([request]) => request.data.action),
  ).toEqual(["save", "save"]);
});

it("requires an explicit choice before dropping a service unavailable at another seller", async () => {
  mockMissing = true;
  const onSelectionPendingChange = jest.fn();
  renderSelection({ ...props, onSelectionPendingChange });
  await selectOption("Магазин", "Магазин Б");
  const remove = await screen.findByRole("checkbox", {
    name: "Убрать недоступные услуги",
  });
  await settleDebounce();
  expect(mockMutation).not.toHaveBeenCalled();
  expect(onSelectionPendingChange).toHaveBeenLastCalledWith("line", false);
  expect(screen.getByRole("alert").textContent).toMatch(/Сборка/);
  fireEvent.click(remove);
  expect(onSelectionPendingChange).toHaveBeenLastCalledWith("line", true);
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
  expect(mockMutation.mock.calls[0][0].data.selections[0].services).toEqual([
    { offerId: "delivery-b", quantity: 1 },
  ]);
  await waitFor(() => expect(receipt().getByText("5 900 ₽")).toBeTruthy());
});

it("keeps an incomplete destination unsaved and recovers automatically after the address is completed", async () => {
  const onSelectionStateChange = jest.fn();
  const onSelectionPendingChange = jest.fn();
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
  renderSelection({
    ...props,
    onSelectionStateChange,
    onSelectionPendingChange,
  });
  fireEvent.change(screen.getByLabelText("Адрес доставки"), {
    target: { value: "" },
  });
  expect(onSelectionPendingChange).not.toHaveBeenCalledWith("line", true);
  expect(await screen.findByText("Delivery address is required")).toBeTruthy();
  expect(mockMutation).toHaveBeenCalledTimes(1);
  expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", true);
  expect(receipt().queryByText("8 000 ₽")).toBeNull();
  expect(receipt().getByText("Нужен выбор")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Адрес доставки"), {
    target: { value: "Complete address" },
  });
  expect(onSelectionPendingChange).toHaveBeenLastCalledWith("line", true);
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
  const onSelectionPendingChange = jest.fn();
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
  renderSelection({
    ...props,
    onSelectionStateChange,
    onSelectionPendingChange,
  });
  fireEvent.change(screen.getByRole("spinbutton", { name: "Количество" }), {
    target: { value: "2" },
  });
  expect(onSelectionPendingChange).toHaveBeenLastCalledWith("line", true);
  expect(await screen.findByText("Only one item is available")).toBeTruthy();
  expect(receipt().getByText("Нужен выбор")).toBeTruthy();
  expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", true);
  expect(onSelectionPendingChange).toHaveBeenLastCalledWith("line", false);
  fireEvent.change(screen.getByRole("spinbutton", { name: "Количество" }), {
    target: { value: "1" },
  });
  expect(screen.queryByText("Only one item is available")).toBeNull();
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
  const onSelectionPendingChange = jest.fn();
  mockMutation.mockRejectedValueOnce(new Error("Network unavailable"));
  renderSelection({
    ...props,
    onSelectionStateChange,
    onSelectionPendingChange,
  });
  fireEvent.click(screen.getByRole("checkbox", { name: "Сборка" }));
  expect(onSelectionPendingChange).toHaveBeenLastCalledWith("line", true);
  expect(await screen.findByText("Network unavailable")).toBeTruthy();
  expect(receipt().queryByText("8 000 ₽")).toBeNull();
  expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", true);
  expect(onSelectionPendingChange).toHaveBeenLastCalledWith("line", false);
  expect(
    screen
      .getByRole("checkbox", { name: "Сборка" })
      .getAttribute("aria-checked"),
  ).toBe("false");
  fireEvent.click(screen.getByRole("button", { name: "Повторить сохранение" }));
  expect(onSelectionPendingChange).toHaveBeenLastCalledWith("line", true);
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
  const onSelectionPendingChange = jest.fn();
  const splitProps = {
    ...props,
    onSelectionPendingChange,
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
  expect(onSelectionPendingChange).not.toHaveBeenCalledWith("line", true);
  await settleDebounce();
  expect(mockMutation).not.toHaveBeenCalled();
  expect(
    screen
      .getByRole("button", { name: "Разделить заказ" })
      .hasAttribute("disabled"),
  ).toBe(true);
  fireEvent.change(screen.getByLabelText("Адрес второго заказа"), {
    target: { value: "City address" },
  });
  await settleDebounce();
  expect(mockMutation).not.toHaveBeenCalled();
  expect(
    screen
      .getByRole("button", { name: "Разделить заказ" })
      .hasAttribute("disabled"),
  ).toBe(true);
  fireEvent.change(screen.getByLabelText("Адрес второго заказа"), {
    target: { value: "Second address" },
  });
  await settleDebounce();
  expect(mockMutation).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Разделить заказ" }));
  expect(onSelectionPendingChange).toHaveBeenLastCalledWith("line", true);
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
  expect(onSelectionPendingChange).toHaveBeenLastCalledWith("line", false);
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
  const onSelectionPendingChange = jest.fn();
  const view = render(
    <Selection
      {...props}
      onSelectionStateChange={onSelectionStateChange}
      onSelectionPendingChange={onSelectionPendingChange}
    />,
  );
  fireEvent.click(screen.getByRole("checkbox", { name: "Сборка" }));
  expect(
    await screen.findByRole("button", { name: "Обновить корзину" }),
  ).toBeTruthy();
  expect(mockMutation).toHaveBeenCalledTimes(1);
  expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", true);
  expect(onSelectionPendingChange).toHaveBeenLastCalledWith("line", false);
  expect(receipt().getByRole("status").textContent).toMatch(
    /Обновляем корзину/,
  );
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

it("does not defer close for an invalid quantity and cancels a debounced save on unmount", async () => {
  const onSelectionPendingChange = jest.fn();
  const view = render(
    <Selection
      {...props}
      onSelectionPendingChange={onSelectionPendingChange}
    />,
  );
  fireEvent.change(screen.getByRole("spinbutton", { name: "Количество" }), {
    target: { value: "" },
  });
  expect(onSelectionPendingChange).not.toHaveBeenCalledWith("line", true);
  await settleDebounce();
  expect(mockMutation).not.toHaveBeenCalled();
  expect(
    screen.getByRole("region", { name: "Расчёт" }).getAttribute("aria-busy"),
  ).toBe("false");
  fireEvent.change(screen.getByRole("spinbutton", { name: "Количество" }), {
    target: { value: "2" },
  });
  expect(onSelectionPendingChange).toHaveBeenLastCalledWith("line", true);
  view.unmount();
  expect(onSelectionPendingChange).toHaveBeenLastCalledWith("line", false);
  await settleDebounce();
  expect(mockMutation).not.toHaveBeenCalled();
});

it.each([
  [{ basis: "fixed", fixedAmount: "2500" }, "Фиксированная стоимость"],
  [{ basis: "distance" }, "По расстоянию"],
  [{ basis: "calculated" }, "Расчётный тариф"],
] as const)(
  "shows the available %s delivery tariff before that option is selected",
  async (tariff, label) => {
    mockDeliveryTariff = tariff;
    const selection: IEcommerceCartSelection = {
      offerId: "offer-a",
      quantity: 1,
      currencyId: "rub",
      destination: {},
      services: [{ offerId: "assembly-a", quantity: 1 }],
    };
    const quote = mockQuote("a", selection);
    const savedLine = { ...line, destination: {}, quoteVersion: quote.version };
    renderSelection({
      ...props,
      line: savedLine,
      details: {
        ...props.details,
        offerQuotes: [quote],
        lines: [savedLine, props.details.lines[2]],
      },
    });
    const delivery = within(screen.getByRole("group", { name: "Доставка" }));
    expect(
      delivery
        .getByRole("checkbox", { name: "Доставка" })
        .getAttribute("aria-checked"),
    ).toBe("false");
    expect(delivery.getByText(label)).toBeTruthy();
    expect(delivery.getByText("Зона доставки не указана")).toBeTruthy();
    expect(delivery.queryByLabelText("Адрес доставки")).toBeNull();
    expect(screen.queryByLabelText("Регион")).toBeNull();
    if (tariff.basis === "fixed")
      expect(delivery.getByText("2 500 ₽")).toBeTruthy();
    else expect(delivery.queryByText(/₽/)).toBeNull();
    await settleDebounce();
    expect(mockMutation).not.toHaveBeenCalled();
  },
);

it("keeps shipping and pickup fields inside their selected fulfillment option and service units separate", async () => {
  mockPickup = true;
  const onSelectionPendingChange = jest.fn();
  mockMutation.mockImplementation(async ({ data }) => {
    const result = mockResult(data.selections);
    if (!data.selections[0].destination?.pickupPointId) {
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
                code: "pickup",
                offerId: "pickup-a",
                message: "Choose a pickup point",
              },
            ],
          },
        ],
      };
    }
    return result;
  });
  renderSelection({ ...props, onSelectionPendingChange });
  const delivery = within(screen.getByRole("group", { name: "Доставка" }));
  expect(delivery.getByLabelText("Адрес доставки")).toBeTruthy();
  expect(
    delivery.queryByRole("spinbutton", { name: "Количество единиц услуги" }),
  ).toBeNull();
  expect(screen.queryByLabelText("Регион")).toBeNull();
  const assembly = within(screen.getByRole("group", { name: "Сборка" }));
  expect(
    assembly.getByRole("spinbutton", { name: "Количество единиц услуги" }),
  ).toBeTruthy();
  expect(assembly.queryByLabelText("Адрес доставки")).toBeNull();
  fireEvent.click(screen.getByRole("checkbox", { name: /Пункт выдачи/ }));
  expect(onSelectionPendingChange).not.toHaveBeenCalledWith("line", true);
  expect(screen.queryByLabelText("Адрес доставки")).toBeNull();
  const pickup = within(screen.getByRole("group", { name: /Пункт выдачи/ }));
  expect(
    pickup.getByRole("combobox", { name: "Точка самовывоза" }),
  ).toBeTruthy();
  expect(
    pickup.queryByRole("spinbutton", { name: "Количество единиц услуги" }),
  ).toBeNull();
  await selectOption("Точка самовывоза", "pickup-2");
  expect(onSelectionPendingChange).toHaveBeenCalledWith("line", true);
  await waitFor(() =>
    expect(mockMutation).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          selections: [
            expect.objectContaining({
              destination: { pickupPointId: "pickup-2" },
              services: expect.arrayContaining([
                { offerId: "pickup-a", quantity: 1 },
                { offerId: "assembly-a", quantity: 1 },
              ]),
            }),
          ],
        }),
      }),
    ),
  );
  await waitFor(() =>
    expect(onSelectionPendingChange).toHaveBeenLastCalledWith("line", false),
  );
  expect(
    screen
      .getByRole("checkbox", { name: "Доставка" })
      .getAttribute("aria-checked"),
  ).toBe("false");
});

it.each(["price", "tariff", "coverage", "padding"] as const)(
  "toggles a delivery exactly once from the header %s without adding metadata to its accessible name",
  async (target) => {
    renderSelection();
    const group = screen.getByRole("group", { name: "Доставка" });
    const delivery = within(group);
    const checkbox = delivery.getByRole("checkbox", { name: "Доставка" });
    const heading = delivery.getByText("Доставка").closest("label")!;
    expect(heading.htmlFor).toBe(checkbox.id);
    expect(
      heading.querySelector("input, button, label, [role=combobox]"),
    ).toBeNull();
    const clickTarget =
      target === "price"
        ? delivery.getByText("1 000 ₽")
        : target === "tariff"
          ? delivery.getByText("Фиксированная стоимость")
          : target === "coverage"
            ? delivery.getByText("Зона доставки не указана")
            : heading;
    fireEvent.click(clickTarget);
    expect(checkbox.getAttribute("aria-checked")).toBe("false");
    expect(screen.queryByLabelText("Адрес доставки")).toBeNull();
    await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
    expect(mockMutation.mock.calls[0][0].data.selections[0]).toEqual(
      expect.objectContaining({
        destination: {},
        services: [{ offerId: "assembly-a", quantity: 1 }],
      }),
    );
    await waitFor(() => expect(receipt().getByText("7 000 ₽")).toBeTruthy());
    expect(delivery.getByRole("checkbox", { name: "Доставка" })).toBe(checkbox);
    expect(mockMutation).toHaveBeenCalledTimes(1);
  },
);

it("shows a loading currency label without exposing its identifier and uses the cart currency record when available", async () => {
  mockCurrencyLoading = true;
  const currencyId = "6101a20d-9b3f-46ad-b279-98232436c010";
  const quote = { ...mockQuote(), currencyId, currencyIds: [currencyId] };
  mockDiscovery.set(
    JSON.stringify({ offerId: "offer-a", quantity: 1, currencyId }),
    {
      ...quote,
      amount: "999999",
      charges: [],
    },
  );
  const selectionProps = {
    ...props,
    details: {
      ...props.details,
      billingModuleCurrencyId: currencyId,
      availableCurrencyIds: [currencyId],
      offerQuotes: [quote],
    },
  };
  const view = renderSelection(selectionProps);
  expect(screen.getByRole("combobox", { name: "Валюта" }).textContent).toBe(
    "Загружаем…",
  );
  expect(view.container.textContent).not.toContain(currencyId);
  view.rerender(
    <Selection
      {...selectionProps}
      details={{
        ...selectionProps.details,
        totals: [
          {
            total: 8000,
            billingModuleCurrency: {
              id: currencyId,
              slug: "rub",
              symbol: "₽",
              title: "RUB",
            },
          },
        ],
      }}
    />,
  );
  expect(screen.getByRole("combobox", { name: "Валюта" }).textContent).toBe(
    "RUB",
  );
  expect(
    screen
      .getByLabelText("Стоимость товара")
      .textContent?.replace(/\u00a0/g, " "),
  ).toContain("5 000 ₽");
  expect(receipt().getByText("8 000 ₽")).toBeTruthy();
  expect(view.container.textContent).not.toContain(currencyId);
  await settleDebounce();
  expect(mockMutation).not.toHaveBeenCalled();
});
