/** @jest-environment jsdom */
import { useState } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

const mockSave = jest.fn();
const mockInvalidate = jest.fn();
let mockSavedQuantity = 1;
let mockSequence = 0;
let mockPublish: ((request: any, result: any) => void) | undefined;
const savedAt = "2026-11-17T00:00:00.000Z";
function mockQuote(quantity = 1) {
  return {
    offerId: "offer",
    productId: "product",
    storeId: "store",
    currencyId: "rub",
    currencyIds: ["rub"],
    quantity,
    version: "terms",
    amount: String(quantity * 100),
    issues: [],
    availableQuantity: 5,
    serviceOptions: [],
    charges: [
      {
        offerId: "offer",
        role: "product",
        quantity,
        amount: String(quantity * 100),
      },
    ],
  };
}
function mockResult(request: any) {
  const quantity = request.data.selections[0].quantity;
  return {
    applied: true,
    orderIds: ["order"],
    quotes: [mockQuote(quantity)],
    selectionUpdatedAt: new Date(
      Date.parse(savedAt) + ++mockSequence * 1000,
    ).toISOString(),
  };
}
function selectionProps(
  quantity = mockSavedQuantity,
  timestamp = savedAt,
): any {
  const line = {
    id: "line",
    offerId: "offer",
    productId: "product",
    quantity,
    quoteVersion: "terms",
    selectionUpdatedAt: new Date(timestamp),
    product: { title: { en: "Chair" } },
  };
  return {
    subject: { id: "subject" },
    ecommerceModuleOrder: { id: "order" },
    language: "en",
    line,
    details: {
      maxLineQuantity: 5,
      lines: [line],
      billingModuleCurrencyId: "rub",
      availableCurrencyIds: ["rub"],
      offerQuotes: [mockQuote(quantity)],
      offers: [
        {
          id: "offer",
          productId: "product",
          variant: "default",
          storeId: "store",
          store: { title: { en: "Store" } },
        },
      ],
    },
  };
}

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    ecommerceModuleOrderSelection: () => ({
      mutateAsync: async (request: any) => {
        const result = await mockSave(request);
        mockSavedQuantity = request.data.selections[0].quantity;
        mockPublish?.(request, result);
        return result;
      },
    }),
  },
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
}));
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
}));
const mockDiscovery = new Map<number, ReturnType<typeof mockQuote>>();
jest.mock("@sps/ecommerce/relations/stores-to-products/sdk/client", () => ({
  api: {
    quote: ({ data }: any) => {
      if (!mockDiscovery.has(data.quantity))
        mockDiscovery.set(data.quantity, mockQuote(data.quantity));
      return { data: mockDiscovery.get(data.quantity) };
    },
  },
}));
jest.mock("@sps/billing/models/currency/sdk/client", () => ({
  api: { find: () => ({ data: [{ id: "rub", slug: "rub", symbol: "₽" }] }) },
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) =>
    props.variant === "ecommerce-module-order-list-checkout-default" ? (
      <SelectionHarness
        onSelectionPendingChange={props.onSelectionPendingChange}
      />
    ) : null,
}));

import { Component } from "./ClientComponent";
import { Selection } from "../../../ecommerce-module/order/list/checkout-default/Selection";

function SelectionHarness({ onSelectionPendingChange }: any) {
  const [saved, setSaved] = useState(selectionProps);
  mockPublish = (request, result) => {
    setSaved(
      selectionProps(
        request.data.selections[0].quantity,
        result.selectionUpdatedAt,
      ),
    );
  };
  return (
    <Selection
      {...saved}
      onSelectionPendingChange={(_lineId: string, pending: boolean) =>
        onSelectionPendingChange(pending)
      }
    />
  );
}
function open() {
  const trigger = screen.getByRole("button", { name: "Open cart" });
  fireEvent.click(trigger);
  return trigger;
}
function mount() {
  render(
    <Component
      isServer={false}
      variant="me-ecommerce-module-cart-default"
      data={{ id: "subject" } as any}
      language="en"
    />,
  );
  return open();
}
function quantity(value: string) {
  fireEvent.change(screen.getByRole("spinbutton", { name: "Quantity" }), {
    target: { value },
  });
}
function deferred() {
  let resolve!: (result: any) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}
beforeEach(() => {
  mockSavedQuantity = 1;
  mockSequence = 0;
  mockDiscovery.clear();
  mockPublish = undefined;
  mockSave
    .mockReset()
    .mockImplementation(async (request) => mockResult(request));
  mockInvalidate.mockReset().mockResolvedValue(undefined);
});

it("persists a quantity typed immediately before closing and restores modal focus", async () => {
  const trigger = mount();
  quantity("2");
  fireEvent.click(screen.getByRole("button", { name: "Close cart" }));
  expect(screen.getByRole("dialog", { name: "Cart" })).toBeTruthy();
  expect(screen.getByText("Saving changes…").getAttribute("role")).toBe(
    "status",
  );
  await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
  expect(mockSave.mock.calls[0][0].data.selections[0].quantity).toBe(2);
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(trigger));
  open();
  expect(
    (screen.getByRole("spinbutton", { name: "Quantity" }) as HTMLInputElement)
      .value,
  ).toBe("2");
});

it("keeps a queued edit mounted until the second serialized save finishes", async () => {
  const first = deferred();
  const second = deferred();
  mockSave
    .mockImplementationOnce(() => first.promise)
    .mockImplementationOnce(() => second.promise);
  mount();
  quantity("2");
  await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
  quantity("3");
  fireEvent.click(screen.getByRole("button", { name: "Close cart" }));
  await act(async () => first.resolve(mockResult(mockSave.mock.calls[0][0])));
  await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(2));
  expect(mockSave.mock.calls[1][0].data.selections[0].quantity).toBe(3);
  expect(screen.getByRole("dialog", { name: "Cart" })).toBeTruthy();
  await act(async () => second.resolve(mockResult(mockSave.mock.calls[1][0])));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  open();
  expect(
    (screen.getByRole("spinbutton", { name: "Quantity" }) as HTMLInputElement)
      .value,
  ).toBe("3");
  expect(mockSave).toHaveBeenCalledTimes(2);
});

it("allows an invalid draft to close without scheduling a write", () => {
  mount();
  quantity("");
  fireEvent.click(screen.getByRole("button", { name: "Close cart" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(mockSave).not.toHaveBeenCalled();
});

it("honours a waiting close after a failed save without retrying or duplicating it", async () => {
  const saving = deferred();
  mockSave.mockImplementationOnce(() => saving.promise);
  mount();
  quantity("2");
  fireEvent.click(screen.getByRole("button", { name: "Close cart" }));
  await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
  await act(async () => saving.reject(new Error("Network unavailable")));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(mockSave).toHaveBeenCalledTimes(1);
  open();
  expect(
    (screen.getByRole("spinbutton", { name: "Quantity" }) as HTMLInputElement)
      .value,
  ).toBe("1");
});
