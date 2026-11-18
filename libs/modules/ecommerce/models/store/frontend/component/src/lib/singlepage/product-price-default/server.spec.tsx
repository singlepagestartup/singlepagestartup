jest.mock("server-only", () => ({}));
const mockFind = jest.fn();
const mockQuote = jest.fn();
const mockCurrency = jest.fn();
const mockStore = jest.fn();
jest.mock("@sps/ecommerce/relations/stores-to-products/sdk/server", () => ({
  api: {
    find: (props: unknown) => mockFind(props),
    quote: (props: unknown) => mockQuote(props),
  },
}));
jest.mock("@sps/billing/models/currency/sdk/server", () => ({
  api: { findById: (props: unknown) => mockCurrency(props) },
}));
jest.mock("@sps/ecommerce/models/store/sdk/server", () => ({
  api: { findById: (props: unknown) => mockStore(props) },
}));
jest.mock("./Component", () => ({ Component: () => null }));
import { Component } from "./server";

const product = { id: "product", kind: "physical" } as any;
const offer = {
  id: "offer",
  productId: "product",
  storeId: "store",
  variant: "default",
  createdAt: "2026-01-02T00:00:00Z",
  settings: {},
};
const baseProps = {
  isServer: true,
  variant: "product-price-default" as const,
  product,
  language: "en",
};
beforeEach(() => {
  jest.resetAllMocks();
  mockFind.mockResolvedValue([offer]);
  mockQuote.mockImplementation(async ({ data }) => ({
    ...data,
    productId: "product",
    currencyIds: ["usd"],
    charges: [],
    issues: [],
  }));
  mockCurrency.mockResolvedValue({ symbol: "$" });
  mockStore.mockResolvedValue({ title: { en: "First shop" } });
});

it("resolves the same offer and default currency as the client reader", async () => {
  const result = await Component(baseProps);
  expect(mockQuote).toHaveBeenNthCalledWith(1, {
    data: { offerId: "offer", quantity: 1, currencyId: "" },
  });
  expect(mockQuote).toHaveBeenNthCalledWith(2, {
    data: { offerId: "offer", quantity: 1, currencyId: "usd" },
  });
  expect(result.props).toMatchObject({
    quote: { offerId: "offer", currencyId: "usd" },
    currencySymbol: "$",
    pending: false,
  });
});

it("selects only the requested store and offer", async () => {
  mockFind.mockResolvedValue([
    offer,
    { ...offer, id: "other", storeId: "other-store" },
  ]);
  const result = await Component({
    ...baseProps,
    storeId: "other-store",
    offerId: "other",
    billingModuleCurrencyId: "usd",
  });
  expect(mockQuote).toHaveBeenCalledTimes(1);
  expect(result.props.quote?.offerId).toBe("other");
});

it("quotes the earliest retail association across stores and resolves ties by id", async () => {
  const earlier = {
    ...offer,
    id: "earlier-b",
    storeId: "other-store",
    createdAt: "2026-01-01T00:00:00Z",
  };
  const first = { ...earlier, id: "earlier-a", storeId: "first-store" };
  mockFind.mockResolvedValue([offer, earlier, first]);
  const result = await Component({
    ...baseProps,
    billingModuleCurrencyId: "usd",
  });
  expect(mockQuote).toHaveBeenCalledWith({
    data: { offerId: "earlier-a", quantity: 1, currencyId: "usd" },
  });
  expect(result.props).toMatchObject({
    selectedOffer: { id: "earlier-a", storeId: "first-store" },
  });
});

it("never falls back from an explicitly unavailable offer", async () => {
  mockFind.mockResolvedValue([
    { ...offer, id: "grant", settings: { initialGrant: true } },
    offer,
  ]);
  const result = await Component({ ...baseProps, offerId: "grant" });
  expect(mockQuote).not.toHaveBeenCalled();
  expect(result.props.selectedOffer).toBeUndefined();
  expect(result.props.quote).toBeUndefined();
});

it("quotes one unit and loads the selected seller title for read-only catalog prices", async () => {
  const result = await Component({
    ...baseProps,
    readOnly: true,
    quantity: 7,
    billingModuleCurrencyId: "usd",
  });
  expect(mockQuote).toHaveBeenCalledWith({
    data: { offerId: "offer", quantity: 1, currencyId: "usd" },
  });
  expect(mockStore).toHaveBeenCalledWith({ id: "store" });
  expect(result.props).toMatchObject({
    readOnly: true,
    storeTitle: "First shop",
  });
});

it("uses the same public title and currency fallback on ru pages as the client", async () => {
  mockStore.mockResolvedValue({
    title: { ru: "", en: "Single Page Shop" },
    adminTitle: "stormy fuchsia harrier",
    slug: "single-page-shop",
  });
  mockCurrency.mockResolvedValue({ slug: "rub", symbol: "" });
  const result = await Component({
    ...baseProps,
    language: "ru",
    readOnly: true,
    billingModuleCurrencyId: "rub",
  });
  expect(result.props).toMatchObject({
    storeTitle: "Single Page Shop",
    currencySymbol: "RUB",
  });
});

it("does not quote a service that is not standalone or a missing product", async () => {
  await Component({ ...baseProps, product: { ...product, kind: "service" } });
  expect(mockQuote).not.toHaveBeenCalled();
  mockFind.mockClear();
  await Component({ ...baseProps, product: { ...product, id: "" } });
  expect(mockFind).not.toHaveBeenCalled();
});
