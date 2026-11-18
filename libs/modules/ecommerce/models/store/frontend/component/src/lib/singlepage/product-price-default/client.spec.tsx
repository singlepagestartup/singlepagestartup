/** @jest-environment jsdom */
import { render, screen, waitFor } from "@testing-library/react";

const mockFind = jest.fn();
const mockQuote = jest.fn();
const mockCurrency = jest.fn();
jest.mock("@sps/ecommerce/relations/stores-to-products/sdk/client", () => ({
  api: {
    find: (props: unknown) => mockFind(props),
    quote: (props: unknown) => mockQuote(props),
  },
}));
jest.mock("@sps/billing/models/currency/sdk/client", () => ({
  api: { findById: (props: unknown) => mockCurrency(props) },
}));
jest.mock("./Component", () => ({
  Component: (props: any) => (
    <output>
      {JSON.stringify({
        quote: props.quote,
        pending: props.pending,
        selectionRequired: props.selectionRequired,
        symbol: props.currencySymbol,
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
  mockCurrency.mockReturnValue({ data: { symbol: "$" } });
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

it("requires a choice between stores and does not quote an arbitrary offer", () => {
  mockFind.mockReturnValue({
    data: [offer, { ...offer, id: "other", storeId: "other-store" }],
    isPending: false,
  });
  render(<Component {...baseProps} billingModuleCurrencyId="usd" />);
  expect(mockQuote).toHaveBeenLastCalledWith(
    expect.objectContaining({ reactQueryOptions: { enabled: false } }),
  );
  expect(JSON.parse(screen.getByRole("status").textContent!)).toMatchObject({
    selectionRequired: true,
  });
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
  expect(JSON.parse(screen.getByRole("status").textContent!)).toEqual({
    pending: true,
    selectionRequired: false,
    symbol: "$",
  });
});

it("never issues an unfiltered offer query for a missing product ID", () => {
  mockFind.mockReturnValue({ data: [], isPending: false });
  render(<Component {...baseProps} product={{ ...product, id: "" }} />);
  expect(mockFind).toHaveBeenLastCalledWith(
    expect.objectContaining({ reactQueryOptions: { enabled: false } }),
  );
});
