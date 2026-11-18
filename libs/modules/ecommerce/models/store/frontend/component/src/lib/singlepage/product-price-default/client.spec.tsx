/** @jest-environment jsdom */
import { render, screen, waitFor } from "@testing-library/react";

const mockFind = jest.fn();
const mockQuote = jest.fn();
const mockCurrency = jest.fn();
const mockStore = jest.fn();
jest.mock("@sps/ecommerce/relations/stores-to-products/sdk/client", () => ({
  api: {
    find: (props: unknown) => mockFind(props),
    quote: (props: unknown) => mockQuote(props),
  },
}));
jest.mock("@sps/billing/models/currency/sdk/client", () => ({
  api: { findById: (props: unknown) => mockCurrency(props) },
}));
jest.mock("@sps/ecommerce/models/store/sdk/client", () => ({
  api: { findById: (props: unknown) => mockStore(props) },
}));
jest.mock("./Component", () => ({
  Component: (props: any) => (
    <output>
      {JSON.stringify({
        quote: props.quote,
        pending: props.pending,
        symbol: props.currencySymbol,
        selectedOffer: props.selectedOffer,
        readOnly: props.readOnly,
        storeTitle: props.storeTitle,
      })}
    </output>
  ),
}));
import { Component } from "./client";

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
  isServer: false,
  variant: "product-price-default" as const,
  product,
  language: "en",
};

beforeEach(() => {
  jest.resetAllMocks();
  mockFind.mockReturnValue({ data: [offer], isPending: false });
  mockQuote.mockImplementation(({ data }) => ({
    data: {
      ...data,
      productId: "product",
      currencyIds: ["usd"],
      charges: [],
      issues: [],
    },
    isPending: false,
  }));
  mockCurrency.mockImplementation(({ id }) => ({ data: { id, symbol: "$" } }));
  mockStore.mockReturnValue({
    data: { id: "store", title: { en: "First shop", ru: "Первый магазин" } },
  });
});

it("resolves a default currency and keeps the result in the SDK readers", async () => {
  render(<Component {...baseProps} storeId="store" />);
  await waitFor(() =>
    expect(mockQuote).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: { offerId: "offer", quantity: 1, currencyId: "usd" },
      }),
    ),
  );
  expect(JSON.parse(screen.getByRole("status").textContent!)).toMatchObject({
    quote: { offerId: "offer", currencyId: "usd" },
    symbol: "$",
  });
  expect(mockFind.mock.calls[0][0].params.filters.and).toContainEqual({
    column: "storeId",
    method: "eq",
    value: "store",
  });
});

it("quotes the earliest offer across stores independently of API result order", () => {
  const earlier = {
    ...offer,
    id: "other",
    storeId: "other-store",
    createdAt: "2026-01-01T00:00:00Z",
  };
  mockFind.mockReturnValue({
    data: [offer, earlier],
    isPending: false,
  });
  const view = render(
    <Component {...baseProps} billingModuleCurrencyId="usd" />,
  );
  expect(mockQuote).toHaveBeenLastCalledWith(
    expect.objectContaining({
      data: { offerId: "other", quantity: 1, currencyId: "usd" },
      reactQueryOptions: { enabled: true },
    }),
  );
  expect(JSON.parse(screen.getByRole("status").textContent!)).toMatchObject({
    selectedOffer: { id: "other", storeId: "other-store" },
  });
  mockFind.mockReturnValue({ data: [earlier, offer], isPending: false });
  view.rerender(<Component {...baseProps} billingModuleCurrencyId="usd" />);
  expect(mockQuote).toHaveBeenLastCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ offerId: "other" }),
    }),
  );
});

it("preserves an explicit offer and never replaces an invalid explicit selection", () => {
  const earlier = {
    ...offer,
    id: "earlier",
    createdAt: "2026-01-01T00:00:00Z",
  };
  mockFind.mockReturnValue({ data: [earlier, offer], isPending: false });
  const view = render(
    <Component {...baseProps} offerId="offer" billingModuleCurrencyId="usd" />,
  );
  expect(mockQuote).toHaveBeenLastCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ offerId: "offer" }),
    }),
  );
  view.rerender(
    <Component
      {...baseProps}
      offerId="missing"
      billingModuleCurrencyId="usd"
    />,
  );
  expect(mockQuote).toHaveBeenLastCalledWith(
    expect.objectContaining({ reactQueryOptions: { enabled: false } }),
  );
  expect(
    JSON.parse(screen.getByRole("status").textContent!),
  ).not.toHaveProperty("quote");
});

it("filters a selected store and excludes a service that is not sold standalone", () => {
  mockFind.mockReturnValue({
    data: [
      offer,
      {
        ...offer,
        id: "other",
        storeId: "other-store",
        settings: { standalone: true },
      },
    ],
    isPending: false,
  });
  render(
    <Component
      {...baseProps}
      product={{ ...product, kind: "service" }}
      storeId="store"
      billingModuleCurrencyId="usd"
    />,
  );
  expect(mockQuote).toHaveBeenLastCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ offerId: "" }),
      reactQueryOptions: { enabled: false },
    }),
  );
});

it("does not render a cached quote for a previous product, quantity or currency", () => {
  mockQuote.mockReturnValue({
    data: {
      offerId: "offer",
      productId: "other-product",
      quantity: 1,
      currencyId: "eur",
      currencyIds: ["usd"],
    },
    isPending: true,
  });
  render(
    <Component {...baseProps} billingModuleCurrencyId="usd" quantity={2} />,
  );
  expect(JSON.parse(screen.getByRole("status").textContent!)).toMatchObject({
    pending: true,
    symbol: "$",
  });
  expect(
    JSON.parse(screen.getByRole("status").textContent!),
  ).not.toHaveProperty("quote");
});

it("never issues an unfiltered offer query for a missing product ID", () => {
  mockFind.mockReturnValue({ data: [], isPending: false });
  render(<Component {...baseProps} product={{ ...product, id: "" }} />);
  expect(mockFind).toHaveBeenLastCalledWith(
    expect.objectContaining({ reactQueryOptions: { enabled: false } }),
  );
});

it("quotes one unit and loads the selected store title for a read-only catalog price", () => {
  render(
    <Component
      {...baseProps}
      readOnly
      quantity={7}
      billingModuleCurrencyId="usd"
    />,
  );
  expect(mockQuote).toHaveBeenLastCalledWith(
    expect.objectContaining({
      data: { offerId: "offer", quantity: 1, currencyId: "usd" },
    }),
  );
  expect(mockStore).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "store",
      reactQueryOptions: { enabled: true },
    }),
  );
  expect(JSON.parse(screen.getByRole("status").textContent!)).toMatchObject({
    readOnly: true,
    storeTitle: "First shop",
  });
});

it("does not show cached currency symbols or store titles from another selection", () => {
  mockCurrency.mockReturnValue({ data: { id: "eur", symbol: "€" } });
  mockStore.mockReturnValue({
    data: { id: "old-store", title: { en: "Old shop" } },
  });
  render(<Component {...baseProps} readOnly billingModuleCurrencyId="usd" />);
  const result = JSON.parse(screen.getByRole("status").textContent!);
  expect(result).not.toHaveProperty("symbol");
  expect(result).not.toHaveProperty("storeTitle");
});

it("uses a public English store title on ru pages and the currency slug when its symbol is empty", () => {
  mockStore.mockReturnValue({
    data: {
      id: "store",
      title: { ru: "", en: "Single Page Shop" },
      adminTitle: "stormy fuchsia harrier",
      slug: "single-page-shop",
    },
  });
  mockCurrency.mockReturnValue({
    data: { id: "rub", slug: "rub", symbol: "" },
  });
  render(
    <Component
      {...baseProps}
      language="ru"
      readOnly
      billingModuleCurrencyId="rub"
    />,
  );
  expect(JSON.parse(screen.getByRole("status").textContent!)).toMatchObject({
    storeTitle: "Single Page Shop",
    symbol: "RUB",
  });
  expect(screen.queryByText("stormy fuchsia harrier")).toBeNull();
});

it("uses a generic public store label only after the selected store is loaded", () => {
  mockStore.mockReturnValue({ data: undefined, isPending: true });
  const view = render(
    <Component
      {...baseProps}
      language="ru"
      readOnly
      billingModuleCurrencyId="usd"
    />,
  );
  expect(
    JSON.parse(screen.getByRole("status").textContent!),
  ).not.toHaveProperty("storeTitle");
  mockStore.mockReturnValue({
    data: { id: "store", adminTitle: "Internal name" },
  });
  view.rerender(
    <Component
      {...baseProps}
      language="ru"
      readOnly
      billingModuleCurrencyId="usd"
    />,
  );
  expect(JSON.parse(screen.getByRole("status").textContent!)).toMatchObject({
    storeTitle: "Магазин",
  });
});
