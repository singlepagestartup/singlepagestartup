/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import type { IComponentPropsExtended } from "./interface";

const mockProduct = jest.fn();
jest.mock("@sps/ecommerce/models/product/frontend/component", () => ({
  Component: (props: unknown) => {
    mockProduct(props);
    return null;
  },
}));

import { Component } from "./Component";

const props = {
  isServer: false,
  variant: "product-price-default",
  language: "en",
  product: { id: "product", kind: "physical" },
  selectedOffer: { id: "offer", storeId: "store" },
  currencySymbol: "$",
  pending: false,
  quote: {
    offerId: "offer",
    charges: [
      { role: "product", amount: "1234567.10000000" },
      { role: "delivery", amount: "500.00" },
    ],
    amount: null,
    issues: [
      {
        code: "address_required",
        offerId: "delivery",
        message: "Address required",
      },
      {
        code: "delivery_required",
        offerId: "delivery",
        message: "Delivery required",
      },
    ],
  },
} as unknown as IComponentPropsExtended;

beforeEach(() => jest.clearAllMocks());

it("shows only the authoritative merchandise amount and seller for read-only prices", () => {
  const { container } = render(
    <Component {...props} readOnly storeTitle="First shop" />,
  );
  expect(mockProduct).toHaveBeenCalledWith(
    expect.objectContaining({
      calculatedPrice: {
        amount: "1,234,567.1",
        currencySymbol: "$",
        status: "ready",
        issues: [],
      },
    }),
  );
  expect(screen.getByText("First shop")).toBeTruthy();
  expect(container.firstElementChild?.getAttribute("data-offer-id")).toBe(
    "offer",
  );
  expect(container.firstElementChild?.getAttribute("data-store-id")).toBe(
    "store",
  );
});

it("keeps checkout validation in the interactive price path", () => {
  render(<Component {...props} />);
  expect(mockProduct).toHaveBeenCalledWith(
    expect.objectContaining({
      calculatedPrice: expect.objectContaining({
        issues: [
          { id: "delivery_required-delivery", message: "Delivery required" },
        ],
      }),
    }),
  );
});

it("does not show an unlabelled amount when the current currency has not loaded", () => {
  render(<Component {...props} readOnly currencySymbol={undefined} pending />);
  expect(mockProduct).toHaveBeenCalledWith(
    expect.objectContaining({
      calculatedPrice: expect.objectContaining({
        amount: undefined,
        status: "pending",
      }),
    }),
  );
});
