jest.mock("server-only", () => ({}));
const mockFind = jest.fn();
const mockQuote = jest.fn();
const mockCurrency = jest.fn();
jest.mock("@sps/ecommerce/relations/stores-to-products/sdk/server", () => ({
  api: {
    find: (props: unknown) => mockFind(props),
    quote: (props: unknown) => mockQuote(props),
  },
}));
jest.mock("@sps/billing/models/currency/sdk/server", () => ({
  api: { findById: (props: unknown) => mockCurrency(props) },
}));
jest.mock("./Component", () => ({ Component: () => null }));
import { Component } from "./server";

const product = { id: "product", kind: "physical" } as any;
const offer = {
  id: "offer",
  productId: "product",
  storeId: "store",
  variant: "default",
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

it("does not quote a service that is not standalone or a missing product", async () => {
  await Component({ ...baseProps, product: { ...product, kind: "service" } });
  expect(mockQuote).not.toHaveBeenCalled();
  mockFind.mockClear();
  await Component({ ...baseProps, product: { ...product, id: "" } });
  expect(mockFind).not.toHaveBeenCalled();
});
