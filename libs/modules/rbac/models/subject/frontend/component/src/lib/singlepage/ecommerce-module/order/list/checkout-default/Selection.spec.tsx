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
const mockPreview = jest.fn();
const mockInvalidate = jest.fn();
const mockQueryClient = { invalidateQueries: mockInvalidate };
const mockQuoteRead = jest.fn();
let mockPublish:
  ((request: any, result: IEcommerceCartSelectionResult) => void) | undefined;
let mockMissing = false;
let mockCommonServices = false;
let mockSelectedServices:
  | ((
      selection: IEcommerceCartSelection | undefined,
      options: IOfferServiceOption[],
    ) => { offerId: string; quantity: number }[])
  | undefined;
let mockPickup = false;
let mockCurrencyLoading = false;
let mockDeliveryTariff: IOfferServiceOption["deliveryTariff"] | undefined;
let mockExtraOptions:
  ((quantity: number, currencyId: string) => IOfferServiceOption[]) | undefined;
let mockRetainedDiscovery: IOfferQuote | undefined;
let mockSavedSequence = 0;
const mockDiscovery = new Map<string, IOfferQuote>();
const savedAt = "2026-11-17T00:00:00.000Z";

const mockOptions = (
  seller: string,
  currencyId = "rub",
  quantity = 1,
): IOfferServiceOption[] => {
  if (mockCommonServices) seller = "a";
  const legacyPickupFields = { pickupPointIds: ["pickup-1", "pickup-2"] };
  return [
    {
      offerId: `delivery-${seller}`,
      compatibleOfferIds: ["delivery-a", "delivery-b"],
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
            compatibleOfferIds: ["pickup-a", "pickup-b"],
            productId: "pickup",
            title: "Пункт выдачи",
            titles: { ru: "Пункт выдачи", en: "Collection point" },
            role: "delivery" as const,
            receiptMethod: "pickup" as const,
            ...legacyPickupFields,
            currencyIds: ["rub", "usd"],
          },
        ]
      : []),
    ...(mockMissing && seller === "b"
      ? []
      : [
          {
            offerId: `assembly-${seller}`,
            compatibleOfferIds: ["assembly-a", "assembly-b"],
            productId: "assembly",
            title: "Сборка",
            titles: { ru: "Сборка", en: "Assembly" },
            role: "add-on" as const,
            currencyIds: ["rub", "usd"],
          },
        ]),
    ...(mockExtraOptions?.(quantity, currencyId) ?? []),
  ];
};

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
            : offerId.startsWith("electronic")
              ? "electronic"
              : "delivery"
          : offerId.startsWith("setup")
            ? "setup"
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
    ...services.map((service) => {
      const option = mockOptions(
        seller,
        selection?.currencyId,
        selection?.quantity,
      ).find((option) => option.offerId === service.offerId);
      return mockCharge(
        service.offerId,
        option?.role ??
          (/^(delivery|pickup)/.test(service.offerId) ? "delivery" : "add-on"),
        service.offerId.startsWith("electronic")
          ? option?.pricePreview?.kind === "fixed"
            ? option.pricePreview.amount
            : selection?.currencyId === "usd"
              ? "1.25"
              : "20"
          : service.offerId.startsWith("setup")
            ? service.quantity === 2
              ? "125.25"
              : "75.5"
            : service.offerId.startsWith("pickup")
              ? "0"
              : service.offerId.startsWith("delivery")
                ? seller === "a"
                  ? "1000"
                  : "500"
                : seller === "a"
                  ? "2000"
                  : "1500",
        service.quantity,
      );
    }),
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
    serviceOptions: mockOptions(
      seller,
      selection?.currencyId,
      selection?.quantity,
    ),
    selectedServices: mockSelectedServices?.(
      selection,
      mockOptions(seller, selection?.currencyId, selection?.quantity),
    ),
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
    ecommerceModuleOrderSelection: () => {
      const { useState } = jest.requireActual("react");
      const [state, setState] = useState({
        data: undefined,
        variables: undefined,
        isPending: false,
        isError: false,
      });
      return {
        ...state,
        mutateAsync: async (request: any) => {
          if (request.data.action === "preview") {
            setState({
              variables: request,
              data: undefined,
              isPending: true,
              isError: false,
            });
            try {
              const result = await mockPreview(request);
              setState({
                variables: request,
                data: result,
                isPending: false,
                isError: false,
              });
              return result;
            } catch (error) {
              setState({
                variables: request,
                data: undefined,
                isPending: false,
                isError: true,
              });
              throw error;
            }
          }
          const result = await mockMutation(request);
          mockPublish?.(request, result);
          return result;
        },
      };
    },
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
    quote: (args: { data: IEcommerceCartSelection }) => {
      const { data } = args;
      mockQuoteRead(args);
      if (mockRetainedDiscovery)
        return {
          data: mockRetainedDiscovery,
          isFetching: true,
          isPending: false,
        };
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
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
beforeEach(() => {
  mockMissing = false;
  mockCommonServices = false;
  mockSelectedServices = undefined;
  mockPickup = false;
  mockCurrencyLoading = false;
  mockDeliveryTariff = undefined;
  mockExtraOptions = undefined;
  mockRetainedDiscovery = undefined;
  mockQuoteRead.mockReset();
  mockSavedSequence = 0;
  mockDiscovery.clear();
  mockPublish = undefined;
  mockInvalidate.mockReset().mockResolvedValue(undefined);
  mockPreview.mockReset().mockImplementation(async ({ data }) => ({
    ...mockResult(data.selections),
    applied: false,
  }));
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
function mockPreviewOptions(
  quantity: number,
  currencyId: string,
): IOfferServiceOption[] {
  return [
    {
      offerId: "electronic-a",
      productId: "electronic",
      title: "Электронная доставка",
      titles: { ru: "Электронная доставка", en: "Electronic delivery" },
      role: "delivery",
      receiptMethod: "electronic",
      currencyIds: ["rub", "usd"],
      pricePreview: {
        kind: "fixed",
        amount:
          currencyId === "usd"
            ? quantity === 3
              ? "1.875"
              : "1.25"
            : quantity === 3
              ? "37.5"
              : "20",
      },
    },
    {
      offerId: "setup-a",
      productId: "setup",
      title: "Настройка",
      titles: { ru: "Настройка", en: "Setup" },
      role: "add-on",
      currencyIds: ["rub", "usd"],
      pricePreview: {
        kind: "from",
        amount:
          currencyId === "usd"
            ? quantity === 3
              ? "4.125"
              : "3.5"
            : quantity === 3
              ? "60.25"
              : "50",
      },
    },
  ];
}
function servicePreviewProps(quantity = 2) {
  const quote = mockQuote("a", {
    offerId: "offer-a",
    currencyId: "rub",
    quantity,
    destination: {},
    services: [],
  });
  const primary = {
    ...line,
    quantity,
    destination: {},
    quoteVersion: quote.version,
  };
  return {
    ...props,
    line: primary,
    details: { ...props.details, offerQuotes: [quote], lines: [primary] },
  };
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
    screen.getByLabelText("Цена за 1 шт."),
  ]) {
    expect(
      control.compareDocumentPosition(store) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  }
  expect(
    screen.getByLabelText("Цена за 1 шт.").textContent?.replace(/\u00a0/g, " "),
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

it.each(["0", "0.00000001", "3333.125"])(
  "shows server unit price %s while keeping batch goods and services in the receipt",
  (unitAmount) => {
    const primary = { ...props.line, quantity: 3, quoteVersion: "unit-terms" };
    const quote = mockQuote("a", {
      offerId: "offer-a",
      quantity: 3,
      currencyId: "rub",
    });
    quote.version = "unit-terms";
    quote.amount = "12876.54";
    quote.charges[0] = { ...quote.charges[0], amount: "9876.54", unitAmount };
    renderSelection({
      ...props,
      line: primary,
      details: {
        ...props.details,
        lines: [primary, ...props.details.lines.slice(1)],
        offerQuotes: [quote],
      },
    });
    expect(
      screen.getByLabelText("Цена за 1 шт.").textContent?.replace(/\s/g, ""),
    ).toBe(`${unitAmount.replace(".", ",")}₽`);
    expect(
      screen.getByLabelText("Цена за 1 шт.").parentElement?.textContent,
    ).toBe(`${screen.getByLabelText("Цена за 1 шт.").textContent} за 1 шт.`);
    expect(receipt().getByText("Шкаф × 3")).toBeTruthy();
    expect(receipt().getByText("9 876,54 ₽")).toBeTruthy();
    expect(receipt().getByText("12 876,54 ₽")).toBeTruthy();
  },
);

it("uses an old quantity-one charge amount instead of its raw coefficient", () => {
  const quote = mockQuote();
  quote.charges[0] = {
    ...quote.charges[0],
    amount: "10",
    inputs: { unit_price: "7.12345678" },
  };
  renderSelection({
    ...props,
    details: { ...props.details, offerQuotes: [quote] },
  });
  expect(screen.getByLabelText("Цена за 1 шт.").textContent).toBe("10 ₽");
});

it("hides old batch totals and raw coefficients and a stale currency's unit price", () => {
  const primary = { ...props.line, quantity: 3, quoteVersion: "unit-terms" };
  const quote = mockQuote("a", {
    offerId: "offer-a",
    quantity: 3,
    currencyId: "rub",
  });
  quote.version = "unit-terms";
  quote.charges[0] = {
    ...quote.charges[0],
    amount: "10",
    inputs: { unit_price: "7.12345678" },
  };
  const configured = {
    ...props,
    line: primary,
    details: {
      ...props.details,
      lines: [primary, ...props.details.lines.slice(1)],
      offerQuotes: [quote],
    },
  };
  const view = renderSelection(configured);
  expect(screen.getByLabelText("Цена за 1 шт.").textContent).toBe("—");
  quote.charges[0].inputs = {};
  view.rerender(<Selection {...configured} />);
  expect(screen.getByLabelText("Цена за 1 шт.").textContent).toBe("—");
  quote.charges[0].unitAmount = "123";
  quote.currencyId = "usd";
  view.rerender(<Selection {...configured} />);
  expect(screen.getByLabelText("Цена за 1 шт.").textContent).not.toContain(
    "123",
  );
});

it("does not replace an explicitly unavailable server unit quote with a legacy coefficient", () => {
  const quote = mockQuote();
  quote.charges[0] = {
    ...quote.charges[0],
    unitAmount: null,
    inputs: { unit_price: "5000" },
  };
  renderSelection({
    ...props,
    details: { ...props.details, offerQuotes: [quote] },
  });
  expect(screen.getByLabelText("Цена за 1 шт.").textContent).toBe("—");
  expect(receipt().getByText("8 000 ₽")).toBeTruthy();
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
    screen.getByLabelText("Цена за 1 шт.").textContent?.replace(/\u00a0/g, " "),
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
        {
          ...mockCharge("offer-a", "product", "9900.25", 3),
          unitAmount: "3333.125",
        },
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
    screen.getByLabelText("Цена за 1 шт.").textContent?.replace(/\u00a0/g, " "),
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
    screen.getByLabelText("Цена за 1 шт.").textContent?.replace(/\u00a0/g, " "),
  ).toContain("3 333,125 ₽");
  expect(receipt().getByText("350,55 ₽")).toBeTruthy();
  expect(
    within(
      within(screen.getByRole("radiogroup", { name: "Доставка" })).getByRole(
        "group",
        { name: "Доставка" },
      ),
    ).getByText("1 350 ₽"),
  ).toBeTruthy();
  expect(
    within(
      within(screen.getByRole("radiogroup", { name: "Доставка" })).getByRole(
        "group",
        { name: "Доставка" },
      ),
    ).queryByText("1 000 ₽"),
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

it("reconciles an unavailable service without a manual removal checkbox", async () => {
  mockMissing = true;
  renderSelection();
  await selectOption("Магазин", "Магазин Б");
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
  expect(
    screen.queryByRole("checkbox", { name: "Убрать недоступные услуги" }),
  ).toBeNull();
  expect(screen.queryByRole("checkbox", { name: "Сборка" })).toBeNull();
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

it("uses one address and one selection for every purchased unit", async () => {
  const multi = { ...line, quantity: 3 };
  renderSelection({
    ...props,
    line: multi,
    details: {
      ...props.details,
      lines: [multi, ...props.details.lines.slice(1)],
    },
  });
  expect(
    screen.queryByRole("checkbox", { name: "Доставить часть на другой адрес" }),
  ).toBeNull();
  expect(screen.queryByRole("button", { name: "Разделить заказ" })).toBeNull();
  expect(screen.getAllByLabelText("Адрес доставки")).toHaveLength(1);
  fireEvent.change(screen.getByLabelText("Адрес доставки"), {
    target: { value: "Один адрес" },
  });
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
  const selections = mockMutation.mock.calls[0][0].data.selections;
  expect(selections).toHaveLength(1);
  expect(selections[0]).toEqual(
    expect.objectContaining({
      quantity: 3,
      destination: { address: "Один адрес", region: "city" },
    }),
  );
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

it("retains common contractor services and quantities across seller changes", async () => {
  mockCommonServices = true;
  renderSelection();
  await selectOption("Магазин", "Магазин Б");
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
  expect(mockMutation.mock.calls[0][0].data.selections[0].services).toEqual([
    { offerId: "delivery-a", quantity: 1 },
    { offerId: "assembly-a", quantity: 1 },
  ]);
  expect(
    screen
      .getByRole("checkbox", { name: "Сборка" })
      .getAttribute("aria-checked"),
  ).toBe("true");
  await selectOption("Магазин", "Магазин А");
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(2));
  expect(mockMutation.mock.calls[1][0].data.selections[0].services).toEqual(
    mockMutation.mock.calls[0][0].data.selections[0].services,
  );
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
    const delivery = within(
      within(screen.getByRole("radiogroup", { name: "Доставка" })).getByRole(
        "group",
        { name: "Доставка" },
      ),
    );
    expect(
      delivery
        .getByRole("radio", { name: "Доставка" })
        .getAttribute("aria-checked"),
    ).toBe("false");
    expect(delivery.getByText(label)).toBeTruthy();
    expect(delivery.getByText("Зона доставки не указана")).toBeTruthy();
    expect(delivery.queryByLabelText("Адрес доставки")).toBeNull();
    expect(screen.queryByLabelText("Регион")).toBeNull();
    if (tariff.basis === "fixed")
      expect(delivery.getByText("2 500 ₽")).toBeTruthy();
    else {
      expect(delivery.queryByText(/₽/)).toBeNull();
      expect(delivery.getByText("По расчёту")).toBeTruthy();
    }
    await settleDebounce();
    expect(mockMutation).not.toHaveBeenCalled();
  },
);

it("keeps shipping address and service quantity fields while collecting pickup at the selected store without a picker", async () => {
  mockPickup = true;
  const onSelectionPendingChange = jest.fn();
  renderSelection({ ...props, onSelectionPendingChange });
  const delivery = within(
    within(screen.getByRole("radiogroup", { name: "Доставка" })).getByRole(
      "group",
      { name: "Доставка" },
    ),
  );
  expect(delivery.getByLabelText("Адрес доставки")).toBeTruthy();
  expect(
    delivery.queryByRole("spinbutton", { name: "Количество единиц услуги" }),
  ).toBeNull();
  const assembly = within(screen.getByRole("group", { name: "Сборка" }));
  expect(
    assembly.getByRole("spinbutton", { name: "Количество единиц услуги" }),
  ).toBeTruthy();
  expect(assembly.queryByLabelText("Адрес доставки")).toBeNull();
  fireEvent.click(screen.getByRole("radio", { name: /Пункт выдачи/ }));
  expect(screen.queryByLabelText("Адрес доставки")).toBeNull();
  expect(screen.queryByLabelText("Точка самовывоза")).toBeNull();
  expect(
    within(screen.getByRole("group", { name: /Пункт выдачи/ })).queryByRole(
      "spinbutton",
    ),
  ).toBeNull();
  await waitFor(() =>
    expect(mockMutation).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          selections: [
            expect.objectContaining({
              destination: {},
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
});

it("ignores a legacy pickup point while changing the selected store and blocks shipping payment until its address is entered", async () => {
  mockPickup = true;
  const onSelectionStateChange = jest.fn();
  const savedLine = {
    ...line,
    destination: { address: undefined, pickupPointId: "old-branch-point" },
  };
  const selected = {
    offerId: "offer-a",
    currencyId: "rub",
    quantity: 1,
    destination: savedLine.destination,
    services: [
      { offerId: "pickup-a", quantity: 1 },
      { offerId: "assembly-a", quantity: 1 },
    ],
  };
  mockMutation.mockImplementation(async ({ data }) => {
    const result = mockResult(data.selections);
    const selection = data.selections[0];
    if (
      selection.services?.some((service: any) =>
        service.offerId.startsWith("delivery"),
      ) &&
      !selection.destination?.address?.trim()
    )
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
                code: "address_required",
                offerId: "delivery-b",
                message: "Delivery address is required",
              },
            ],
          },
        ],
      };
    return result;
  });
  renderSelection({
    ...props,
    line: savedLine,
    onSelectionStateChange,
    details: {
      ...props.details,
      offerQuotes: [mockQuote("a", selected)],
      lines: [
        savedLine,
        { ...props.details.lines[1], productId: "pickup", offerId: "pickup-a" },
        props.details.lines[2],
      ],
    },
  });
  expect(screen.queryByLabelText("Точка самовывоза")).toBeNull();
  await selectOption("Магазин", "Магазин Б");
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
  expect(mockMutation.mock.calls[0][0].data.selections[0]).toEqual(
    expect.objectContaining({
      offerId: "offer-b",
      destination: {},
      services: expect.arrayContaining([{ offerId: "pickup-b", quantity: 1 }]),
    }),
  );
  expect(
    screen
      .getByRole("radio", { name: "Пункт выдачи" })
      .getAttribute("aria-checked"),
  ).toBe("true");
  fireEvent.click(screen.getByRole("radio", { name: "Доставка" }));
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(2));
  expect(screen.getByLabelText("Адрес доставки")).toBeTruthy();
  expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", true);
  expect(receipt().queryByText("5 900 ₽")).toBeNull();
  fireEvent.change(screen.getByLabelText("Адрес доставки"), {
    target: { value: "Новый адрес доставки" },
  });
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(3));
  await waitFor(() =>
    expect(onSelectionStateChange).toHaveBeenLastCalledWith("line", false),
  );
  expect(mockMutation.mock.calls[2][0].data.selections[0].destination).toEqual({
    address: "Новый адрес доставки",
  });
  expect(
    mockQuoteRead.mock.calls.every(
      ([args]) => !Object.hasOwn(args.data.destination ?? {}, "pickupPointId"),
    ),
  ).toBe(true);
});

it("shows a loading currency label without exposing its identifier and uses the cart currency record when available", async () => {
  mockCurrencyLoading = true;
  const currencyId = "6101a20d-9b3f-46ad-b279-98232436c010";
  const quote = { ...mockQuote(), currencyId, currencyIds: [currencyId] };
  mockDiscovery.set(
    JSON.stringify({
      offerId: "offer-a",
      quantity: 1,
      currencyId,
      destination: { address: "City address", region: "city" },
      services: [
        { offerId: "delivery-a", quantity: 1 },
        { offerId: "assembly-a", quantity: 1 },
      ],
    }),
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
    screen.getByLabelText("Цена за 1 шт.").textContent?.replace(/\u00a0/g, " "),
  ).toContain("5 000 ₽");
  expect(receipt().getByText("8 000 ₽")).toBeTruthy();
  expect(view.container.textContent).not.toContain(currencyId);
  await settleDebounce();
  expect(mockMutation).not.toHaveBeenCalled();
});

it("advertises fixed electronic delivery and setup from a minimum before selection, then shows their actual server charges", async () => {
  mockExtraOptions = mockPreviewOptions;
  renderSelection(servicePreviewProps());
  const electronic = within(
    screen.getByRole("group", { name: "Электронная доставка" }),
  );
  const setup = within(screen.getByRole("group", { name: "Настройка" }));
  const setupTitle = setup.getByText("Настройка");
  const electronicCheckbox = electronic.getByRole("radio", {
    name: "Электронная доставка",
  });
  expect(electronicCheckbox.getAttribute("aria-checked")).toBe("false");
  expect(electronic.getByText("20 ₽")).toBeTruthy();
  expect(setup.getByText("от 50 ₽")).toBeTruthy();
  expect(mockQuoteRead).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        offerId: "offer-a",
        quantity: 2,
        currencyId: "rub",
      }),
    }),
  );
  expect(mockMutation).not.toHaveBeenCalled();
  fireEvent.click(electronic.getByText("20 ₽"));
  expect(electronicCheckbox.getAttribute("aria-checked")).toBe("true");
  expect(electronic.getByText("20 ₽")).toBeTruthy();
  await waitFor(() =>
    expect(receipt().getByText("Электронная доставка × 1")).toBeTruthy(),
  );
  expect(electronic.getByRole("radio", { name: "Электронная доставка" })).toBe(
    electronicCheckbox,
  );
  fireEvent.click(setup.getByText("от 50 ₽"));
  const units = setup.getByRole("spinbutton", {
    name: "Количество единиц услуги",
  });
  await waitFor(() => expect(setup.getByText("75,5 ₽")).toBeTruthy());
  expect(setup.queryByText("от 50 ₽")).toBeNull();
  expect(receipt().getByText("Настройка × 1")).toBeTruthy();
  expect(setup.getByText("Настройка")).toBe(setupTitle);
  fireEvent.change(units, { target: { value: "2" } });
  await waitFor(() => expect(setup.getByText("125,25 ₽")).toBeTruthy());
  expect(
    setup.getByRole("spinbutton", { name: "Количество единиц услуги" }),
  ).toBe(units);
  expect(receipt().getByText("Настройка × 2")).toBeTruthy();
  expect(mockMutation).toHaveBeenCalledTimes(3);
});

it.each([
  ["fixed", "0", "0 ₽"],
  ["from", "0", "от 0 ₽"],
  ["fixed", "0.125", "0,125 ₽"],
  ["from", "0.125", "от 0,125 ₽"],
] as const)(
  "preserves a %s preview of %s without hiding zero or rounding fractional amounts",
  async (kind, amount, label) => {
    mockExtraOptions = (quantity, currencyId) =>
      mockPreviewOptions(quantity, currencyId).map((option) =>
        option.offerId === "setup-a"
          ? { ...option, pricePreview: { kind, amount } }
          : option,
      );
    renderSelection(servicePreviewProps());
    const setup = within(screen.getByRole("group", { name: "Настройка" }));
    expect(setup.getByText(label)).toBeTruthy();
    expect(
      setup
        .getByRole("checkbox", { name: "Настройка" })
        .getAttribute("aria-checked"),
    ).toBe("false");
    expect(
      setup.queryByRole("spinbutton", { name: "Количество единиц услуги" }),
    ).toBeNull();
    await settleDebounce();
    expect(mockMutation).not.toHaveBeenCalled();
  },
);

it("keeps service controls while rejecting previews retained from another currency or quantity", async () => {
  mockExtraOptions = mockPreviewOptions;
  const initial = servicePreviewProps();
  mockRetainedDiscovery = initial.details.offerQuotes[0];
  const save = deferred<IEcommerceCartSelectionResult>();
  mockMutation.mockImplementationOnce(() => save.promise);
  const view = renderSelection(initial);
  const electronicCheckbox = screen.getByRole("radio", {
    name: "Электронная доставка",
  });
  const setupCheckbox = screen.getByRole("checkbox", { name: "Настройка" });
  const electronic = within(
    screen.getByRole("group", { name: "Электронная доставка" }),
  );
  const setup = within(screen.getByRole("group", { name: "Настройка" }));
  fireEvent.change(screen.getByRole("spinbutton", { name: "Количество" }), {
    target: { value: "3" },
  });
  expect(electronic.queryByText("20 ₽")).toBeNull();
  expect(setup.queryByText("от 50 ₽")).toBeNull();
  await selectOption("Валюта", "USD");
  expect(electronic.queryByText("20 $")).toBeNull();
  expect(electronic.queryByText("20 ₽")).toBeNull();
  expect(setup.queryByText("от 50 $")).toBeNull();
  expect(setup.queryByText("от 50 ₽")).toBeNull();
  expect(screen.getByRole("radio", { name: "Электронная доставка" })).toBe(
    electronicCheckbox,
  );
  expect(screen.getByRole("checkbox", { name: "Настройка" })).toBe(
    setupCheckbox,
  );
  await waitFor(() =>
    expect(mockQuoteRead).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          offerId: "offer-a",
          quantity: 3,
          currencyId: "usd",
        }),
      }),
    ),
  );
  mockRetainedDiscovery = mockQuote("a", {
    offerId: "offer-a",
    quantity: 2,
    currencyId: "usd",
    destination: {},
    services: [],
  });
  view.rerender(<Selection {...initial} />);
  expect(electronic.queryByText("1,25 $")).toBeNull();
  expect(setup.queryByText("от 3,5 $")).toBeNull();
  mockRetainedDiscovery = undefined;
  view.rerender(<Selection {...initial} />);
  expect(electronic.getByText("1,875 $")).toBeTruthy();
  expect(setup.getByText("от 4,125 $")).toBeTruthy();
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
  expect(mockMutation.mock.calls[0][0].data.selections[0]).toEqual(
    expect.objectContaining({ quantity: 3, currencyId: "usd" }),
  );
  await act(async () =>
    save.resolve(mockResult(mockMutation.mock.calls[0][0].data.selections)),
  );
  expect(electronic.getByText("1,875 $")).toBeTruthy();
  expect(setup.getByText("от 4,125 $")).toBeTruthy();
  expect(electronic.queryByText("20 $")).toBeNull();
});

it("isolates page and drawer fulfillment groups while retaining independent add-ons", async () => {
  mockPickup = true;
  render(
    <>
      <section aria-label="Page">
        <form>
          <Selection {...props} />
        </form>
      </section>
      <section aria-label="Drawer">
        <form>
          <Selection {...props} />
        </form>
      </section>
    </>,
  );
  const page = within(screen.getByRole("region", { name: "Page" }));
  const drawer = within(screen.getByRole("region", { name: "Drawer" }));
  const pageShipping = page.getByRole("radio", {
    name: "Доставка",
  }) as HTMLInputElement;
  const drawerShipping = drawer.getByRole("radio", {
    name: "Доставка",
  }) as HTMLInputElement;
  const pageInput = screen
    .getByRole("region", { name: "Page" })
    .querySelector('input[type="radio"]') as HTMLInputElement;
  const drawerInput = screen
    .getByRole("region", { name: "Drawer" })
    .querySelector('input[type="radio"]') as HTMLInputElement;
  expect(pageInput.name).toBeTruthy();
  expect(pageInput.name).not.toBe(drawerInput.name);
  expect(pageShipping.id).not.toBe(drawerShipping.id);
  fireEvent.click(page.getByRole("radio", { name: "Пункт выдачи" }));
  expect(page.getAllByRole("radio", { checked: true })).toHaveLength(1);
  expect(drawerShipping.getAttribute("aria-checked")).toBe("true");
  expect(
    drawer
      .getByRole("checkbox", { name: "Сборка" })
      .getAttribute("aria-checked"),
  ).toBe("true");
  fireEvent.click(page.getByRole("radio", { name: "Доставка" }));
  expect(
    (page.getByLabelText("Адрес доставки") as HTMLInputElement).value,
  ).toBe("City address");
  expect(
    page.queryByRole("radio", { name: "Не выбирать способ получения" }),
  ).toBeNull();
  await waitFor(() =>
    expect(
      mockMutation.mock.calls.at(-1)![0].data.selections[0].services,
    ).toEqual(
      expect.arrayContaining([
        { offerId: "delivery-a", quantity: 1 },
        { offerId: "assembly-a", quantity: 1 },
      ]),
    ),
  );
  expect(drawerShipping.getAttribute("aria-checked")).toBe("true");
});

it.each(["ru", "en"])(
  "uses the localized delivery heading without selection hints in %s",
  (language) => {
    renderSelection({ ...props, language });
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

it("keeps a required fulfillment radio selected and supports keyboard selection of another method", async () => {
  mockPickup = true;
  const required = {
    ...props,
    details: {
      ...props.details,
      offers: props.details.offers.map((offer: any) => ({
        ...offer,
        settings: { ...offer.settings, requiredDelivery: true },
      })),
    },
  };
  renderSelection(required);
  const group = screen.getByRole("radiogroup", { name: "Доставка" });
  expect(group.getAttribute("aria-required")).toBe("true");
  expect(
    within(group).queryByRole("radio", {
      name: "Не выбирать способ получения",
    }),
  ).toBeNull();
  const shipping = within(group).getByRole("radio", {
    name: "Доставка",
  }) as HTMLInputElement;
  fireEvent.click(shipping);
  expect(shipping.getAttribute("aria-checked")).toBe("true");
  expect(mockMutation).not.toHaveBeenCalled();
  act(() => shipping.focus());
  const user = userEvent.setup();
  await user.keyboard("{ArrowDown>}");
  await waitFor(() =>
    expect(
      (
        within(group).getByRole("radio", {
          name: "Пункт выдачи",
        }) as HTMLInputElement
      ).getAttribute("aria-checked"),
    ).toBe("true"),
  );
  await user.keyboard("{/ArrowDown}");
  expect(within(group).getAllByRole("radio", { checked: true })).toHaveLength(
    1,
  );
});

it("keeps quantity steppers and typing stable through saves, max-line limits and an invalid service correction", async () => {
  const savedLine = { ...line, quantity: 2 };
  mockMutation.mockImplementation(async ({ data }) => {
    const result = mockResult(data.selections);
    const selected = data.selections[0];
    if (
      selected.services.some(
        (service: { quantity: number }) => service.quantity > selected.quantity,
      )
    ) {
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
                code: "service_quantity",
                offerId: "assembly-a",
                message: "Service quantity exceeds product",
              },
            ],
          },
        ],
      };
    }
    return result;
  });
  renderSelection({
    ...props,
    line: savedLine,
    details: {
      ...props.details,
      maxLineQuantity: 4,
      offerQuotes: [{ ...mockQuote(), quantity: 2 }],
      lines: [savedLine, ...props.details.lines.slice(1)],
    },
  });
  const quantity = screen.getByRole("spinbutton", { name: "Количество" });
  const increase = screen.getByRole("button", {
    name: "Увеличить количество товара: Шкаф",
  });
  expect(quantity.getAttribute("max")).toBe("4");
  fireEvent.click(increase);
  fireEvent.keyDown(quantity, { key: "ArrowUp" });
  fireEvent.keyDown(quantity, { key: "ArrowUp" });
  expect((quantity as HTMLInputElement).value).toBe("4");
  expect(increase.hasAttribute("disabled")).toBe(true);
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
  expect(mockMutation.mock.calls[0][0].data.selections[0].quantity).toBe(4);
  expect(screen.getByRole("spinbutton", { name: "Количество" })).toBe(quantity);
  fireEvent.click(
    screen.getByRole("button", { name: "Уменьшить количество товара: Шкаф" }),
  );
  fireEvent.keyDown(quantity, { key: "ArrowDown" });
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(2));
  expect(mockMutation.mock.calls[1][0].data.selections[0].quantity).toBe(2);
  const units = screen.getByRole("spinbutton", {
    name: "Количество единиц услуги",
  });
  const serviceIncrease = screen.getByRole("button", {
    name: "Увеличить количество услуги: Сборка (Шкаф)",
  });
  expect(units.getAttribute("max")).toBe("2");
  fireEvent.click(serviceIncrease);
  fireEvent.keyDown(units, { key: "ArrowUp" });
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(3));
  expect((units as HTMLInputElement).value).toBe("2");
  expect(serviceIncrease.hasAttribute("disabled")).toBe(true);
  fireEvent.change(units, { target: { value: "5" } });
  expect(
    await screen.findByText("Service quantity exceeds product"),
  ).toBeTruthy();
  expect((units as HTMLInputElement).value).toBe("5");
  fireEvent.click(
    screen.getByRole("button", {
      name: "Уменьшить количество услуги: Сборка (Шкаф)",
    }),
  );
  expect((units as HTMLInputElement).value).toBe("2");
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(5));
  expect(screen.queryByText("Service quantity exceeds product")).toBeNull();
  expect(
    screen.getByRole("spinbutton", { name: "Количество единиц услуги" }),
  ).toBe(units);
  expect(
    mockMutation.mock.calls[4][0].data.selections[0].services,
  ).toContainEqual({ offerId: "assembly-a", quantity: 2 });
});

it("reconciles saved service aliases to current contractor options without losing quantities", async () => {
  mockExtraOptions = () => [];
  mockSelectedServices = (selection, options) =>
    (selection?.services ?? []).map((service) => ({
      ...service,
      offerId:
        options.find(
          (option) =>
            option.offerId === service.offerId ||
            option.compatibleOfferIds?.includes(service.offerId),
        )?.offerId ?? service.offerId,
    }));
  const alias = { ...props.details.lines[2], offerId: "old-assembly" };
  const quote = mockQuote();
  quote.serviceOptions.find(
    (option) => option.offerId === "assembly-a",
  )!.compatibleOfferIds = ["old-assembly"];
  mockDiscovery.set(
    JSON.stringify({
      offerId: "offer-a",
      quantity: 1,
      currencyId: "rub",
      destination: { address: "City address", region: "city" },
      services: [
        { offerId: "delivery-a", quantity: 1 },
        { offerId: "old-assembly", quantity: 1 },
      ],
    }),
    {
      ...quote,
      selectedServices: [
        { offerId: "delivery-a", quantity: 1 },
        { offerId: "assembly-a", quantity: 1 },
      ],
    },
  );
  renderSelection({
    ...props,
    details: {
      ...props.details,
      offerQuotes: [quote],
      lines: [line, props.details.lines[1], alias],
    },
  });
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
  expect(
    screen
      .getByRole("checkbox", { name: "Сборка" })
      .getAttribute("aria-checked"),
  ).toBe("true");
  expect(mockMutation.mock.calls[0][0].data.selections[0].services).toEqual(
    expect.arrayContaining([{ offerId: "assembly-a", quantity: 1 }]),
  );
});

it("uses the server selected paid fulfillment for an old cart without a method and leaves add-ons optional", async () => {
  mockSelectedServices = (selection) =>
    selection?.services?.length
      ? selection.services
      : [{ offerId: "delivery-a", quantity: 1 }];
  const selected = {
    offerId: "offer-a",
    currencyId: "rub",
    quantity: 1,
    destination: line.destination,
    services: [],
  };
  renderSelection({
    ...props,
    details: {
      ...props.details,
      lines: [line],
      offerQuotes: [mockQuote("a", selected)],
    },
  });
  await waitFor(() =>
    expect(
      screen
        .getByRole("radio", { name: "Доставка" })
        .getAttribute("aria-checked"),
    ).toBe("true"),
  );
  expect(screen.getByLabelText("Адрес доставки")).toBeTruthy();
  expect(
    screen
      .getByRole("checkbox", { name: "Сборка" })
      .getAttribute("aria-checked"),
  ).toBe("false");
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
  expect(mockMutation.mock.calls[0][0].data.selections[0].services).toEqual([
    { offerId: "delivery-a", quantity: 1 },
  ]);
});

it("does not reselect an unchecked optional service from a retained quote", async () => {
  mockSelectedServices = (selection) => [
    ...(selection?.services ?? []),
    ...((selection?.services ?? []).some(
      (service) => service.offerId === "assembly-a",
    )
      ? []
      : [{ offerId: "assembly-a", quantity: 1 }]),
  ];
  renderSelection();
  const assembly = screen.getByRole("checkbox", { name: "Сборка" });
  fireEvent.click(assembly);
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
  expect(assembly.getAttribute("aria-checked")).toBe("false");
  expect(mockMutation.mock.calls[0][0].data.selections[0].services).toEqual([
    { offerId: "delivery-a", quantity: 1 },
  ]);
});

it("uses authenticated renewal previews without re-adding a paid first-period fulfillment while editing quantity and add-ons", async () => {
  const renewalQuote = (selection: IEcommerceCartSelection): IOfferQuote => ({
    ...mockQuote("a", selection),
    selectedServices: selection.services ?? [],
    fulfillmentAlreadySatisfied: true,
  });
  // The public catalog quote describes a first purchase and must stay disabled here.
  mockSelectedServices = (selection) => [
    ...(selection?.services ?? []),
    ...((selection?.services ?? []).some(
      (service) => service.offerId === "delivery-a",
    )
      ? []
      : [{ offerId: "delivery-a", quantity: 1 }]),
  ];
  mockPreview.mockImplementation(async ({ data }) => ({
    quotes: [renewalQuote(data.selections[0])],
    orderIds: ["order"],
    applied: false,
  }));
  mockMutation.mockImplementation(async ({ data }) => ({
    ...mockResult(data.selections),
    quotes: [renewalQuote(data.selections[0])],
  }));
  const selection = {
    offerId: "offer-a",
    currencyId: "rub",
    quantity: 1,
    destination: line.destination,
    services: [],
  };
  renderSelection({
    ...props,
    ecommerceModuleOrder: {
      id: "order",
      subscriptionSourceOrderId: "paid-source",
      subscriptionSourceInvoiceId: "paid-invoice",
    },
    details: {
      ...props.details,
      offerQuotes: [renewalQuote(selection)],
      lines: [line],
    },
  });
  await waitFor(() => expect(mockPreview).toHaveBeenCalledTimes(1));
  expect(mockMutation).not.toHaveBeenCalled();
  expect(screen.queryByRole("radiogroup", { name: "Доставка" })).toBeNull();
  expect(screen.queryByLabelText("Адрес доставки")).toBeNull();
  expect(
    mockQuoteRead.mock.calls.every(
      ([args]) => args.reactQueryOptions.enabled === false,
    ),
  ).toBe(true);
  fireEvent.change(screen.getByRole("spinbutton", { name: "Количество" }), {
    target: { value: "2" },
  });
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(1));
  expect(mockMutation.mock.calls[0][0].data.selections).toEqual([
    {
      offerId: "offer-a",
      currencyId: "rub",
      quantity: 2,
      destination: {},
      services: [],
    },
  ]);
  expect(receipt().getByText("5 000 ₽")).toBeTruthy();
  expect(
    screen.getByRole("spinbutton", { name: "Количество" }).getAttribute("max"),
  ).toBe("5");
  fireEvent.click(screen.getByRole("checkbox", { name: "Сборка" }));
  await waitFor(() => expect(mockMutation).toHaveBeenCalledTimes(2));
  expect(mockMutation.mock.calls[1][0].data.selections[0].services).toEqual([
    { offerId: "assembly-a", quantity: 1 },
  ]);
  await waitFor(() => expect(receipt().getByText("7 000 ₽")).toBeTruthy());
  expect(screen.queryByRole("radiogroup", { name: "Доставка" })).toBeNull();
  expect(
    mockPreview.mock.calls.every(
      ([request]) =>
        request.data.action === "preview" &&
        request.data.lineId === "line" &&
        request.orderId === "order",
    ),
  ).toBe(true);
});
