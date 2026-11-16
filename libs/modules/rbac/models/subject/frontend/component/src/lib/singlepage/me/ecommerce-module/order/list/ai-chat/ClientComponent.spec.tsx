/** @jest-environment jsdom */

import { act, fireEvent, render, screen, within } from "@testing-library/react";

const mockRepeat = jest.fn();
const mockList = jest.fn();
const mockCheckout = jest.fn();
let mockOrders: any[];
const originalOrders = [
  {
    id: "awaiting-order",
    status: "paying",
    createdAt: "2026-11-16",
    purchaseDetails: { canRepeatPayment: true },
  },
  {
    id: "paid-order",
    status: "paid",
    createdAt: "2026-11-15",
    purchaseDetails: { canRepeatPayment: false },
  },
  {
    id: "failed-order",
    status: "failed",
    createdAt: "2026-11-14",
    purchaseDetails: { canRepeatPayment: true },
  },
  {
    id: "canceling-order",
    status: "canceling",
    createdAt: "2026-11-13",
    purchaseDetails: { canRepeatPayment: true },
  },
  {
    id: "canceled-paid-order",
    status: "canceled",
    createdAt: "2026-11-12",
    purchaseDetails: { canRepeatPayment: false },
  },
  { id: "legacy-order", status: "canceled", createdAt: "2026-11-11" },
];

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    ecommerceModuleOrderRepeat: () => ({ mutateAsync: mockRepeat }),
    ecommerceModuleOrderList: (props: unknown) => {
      mockList(props);
      return { data: mockOrders, isPending: false, isError: false };
    },
  },
}));
jest.mock("@sps/ecommerce/models/order/frontend/component", () => ({
  Component: ({ data, actions, footer }: any) => (
    <li data-testid={data.id}>
      {data.id}: {data.status}
      {actions}
      {footer}
    </li>
  ),
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) => {
    mockCheckout(props);
    return (
      <form aria-label="Checkout">
        <label>
          Payment method
          <select defaultValue="">
            <option value="">Choose a payment method</option>
            <option value="stripe">Stripe</option>
            <option value="payselection">Payselection</option>
          </select>
        </label>
      </form>
    );
  },
}));
jest.mock("@sps/ui-adapter", () => ({ Icon: () => null }));

import { Component } from "./ClientComponent";

const props = {
  variant: "me-ecommerce-module-order-list-ai-chat" as const,
  isServer: false,
  language: "en",
  data: { id: "subject" } as any,
};

function selectOrder(id = "awaiting-order") {
  fireEvent.click(
    within(screen.getByTestId(id)).getByRole("button", {
      name: "Repeat order",
    }),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockOrders = [...originalOrders];
  mockRepeat.mockResolvedValue({ orderIds: ["new-cart-order"] });
});

it("loads every historical status and confirms replacement before repeating a pending payment", () => {
  render(<Component {...props} />);
  expect(mockList).toHaveBeenLastCalledWith({
    id: "subject",
    params: {
      includePurchaseDetails: true,
      filters: { and: [{ column: "type", method: "eq", value: "history" }] },
    },
  });
  selectOrder();
  expect(
    screen.getByText(/current contents of your cart will be replaced/),
  ).toBeTruthy();
  expect(screen.getByRole("note").textContent).toContain(
    "bank is still processing the previous payment, it may also complete",
  );
  expect(mockRepeat).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("group")).toBeNull();
  expect(mockRepeat).not.toHaveBeenCalled();

  selectOrder("failed-order");
  expect(screen.getByRole("group")).toBeTruthy();
  expect(
    screen.getByText(/The original order and invoices are kept/),
  ).toBeTruthy();
  expect(screen.getByRole("note")).toBeTruthy();
});

it("repeats products into the captured subject and opens the existing fresh checkout only on request", async () => {
  render(<Component {...props} />);
  selectOrder("failed-order");
  fireEvent.click(screen.getByRole("button", { name: "Replace cart" }));
  const openCart = await screen.findByRole("button", { name: "Open cart" });
  expect(mockRepeat).toHaveBeenCalledWith({
    id: "subject",
    orderId: "failed-order",
  });
  expect(mockCheckout).not.toHaveBeenCalled();
  expect(screen.getByTestId("paid-order")).toBeTruthy();
  fireEvent.click(openCart);
  expect(mockCheckout).toHaveBeenCalledWith(
    expect.objectContaining({
      variant: "ecommerce-module-order-list-checkout-default",
      isServer: false,
      dataSource: "props",
      data: props.data,
    }),
  );
  expect(
    (screen.getByLabelText("Payment method") as HTMLSelectElement).value,
  ).toBe("");
  fireEvent.change(screen.getByLabelText("Payment method"), {
    target: { value: "payselection" },
  });
  expect(
    (screen.getByLabelText("Payment method") as HTMLSelectElement).value,
  ).toBe("payselection");
});

it("retains the repeated cart when the owning reader supplies an updated snapshot of the same Subject", async () => {
  const view = render(<Component {...props} />);
  selectOrder();
  fireEvent.click(screen.getByRole("button", { name: "Replace cart" }));
  fireEvent.click(await screen.findByRole("button", { name: "Open cart" }));
  mockOrders = mockOrders.map((order) => ({ ...order }));
  view.rerender(
    <Component
      {...props}
      data={{ ...props.data, updatedAt: "2026-11-16T12:00:00Z" }}
    />,
  );
  expect(screen.getByRole("button", { name: "Open cart" })).toBeTruthy();
  expect(screen.getByRole("form", { name: "Checkout" })).toBeTruthy();
  expect(mockRepeat).toHaveBeenCalledTimes(1);
});

it("scopes pending to the repeated row and discards a late completion after switching subjects", async () => {
  let resolve!: (value: { orderIds: string[] }) => void;
  mockRepeat.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const view = render(<Component {...props} />);
  selectOrder();
  fireEvent.click(screen.getByRole("button", { name: "Replace cart" }));
  expect(screen.getAllByRole("button", { name: "Repeating…" })).toHaveLength(1);
  expect(screen.getAllByRole("button", { name: "Repeat order" })).toHaveLength(
    2,
  );
  fireEvent.click(
    within(screen.getByTestId("failed-order")).getByRole("button", {
      name: "Repeat order",
    }),
  );
  expect(mockRepeat).toHaveBeenCalledTimes(1);

  view.rerender(
    <Component {...props} data={{ ...props.data, id: "subject-b" }} />,
  );
  await act(async () => resolve({ orderIds: ["subject-a-new-order"] }));
  expect(screen.queryByRole("button", { name: "Open cart" })).toBeNull();
  expect(mockList).toHaveBeenLastCalledWith(
    expect.objectContaining({
      id: "subject-b",
    }),
  );
  expect(mockRepeat.mock.calls[0][0].id).toBe("subject");
});

it("keeps a clear backend refusal next to the confirmation and permits retry", async () => {
  mockRepeat.mockRejectedValueOnce(
    new Error(
      "Permission error. Initial Free is available only through authentication bootstrap",
    ),
  );
  render(<Component {...props} />);
  selectOrder();
  fireEvent.click(screen.getByRole("button", { name: "Replace cart" }));
  expect((await screen.findByRole("alert")).textContent).toBe(
    "The initial free subscription cannot be ordered again.",
  );
  expect(screen.queryByRole("button", { name: "Open cart" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Replace cart" }));
  expect(await screen.findByRole("button", { name: "Open cart" })).toBeTruthy();
  expect(mockRepeat).toHaveBeenCalledTimes(2);
});

it("hides retry for paid orders, paid canceled subscriptions and missing eligibility", () => {
  render(<Component {...props} />);
  for (const id of ["paid-order", "canceled-paid-order", "legacy-order"]) {
    expect(
      within(screen.getByTestId(id)).queryByRole("button", {
        name: "Repeat order",
      }),
    ).toBeNull();
  }
  selectOrder("canceling-order");
  expect(screen.getByRole("note").textContent).toContain(
    "bank is still processing the previous payment, it may also complete",
  );
});

it("removes the confirmation if reconciliation reports that payment completed", () => {
  const view = render(<Component {...props} />);
  selectOrder();
  mockOrders = originalOrders.map((order) =>
    order.id === "awaiting-order"
      ? { ...order, purchaseDetails: { canRepeatPayment: false } }
      : order,
  );
  view.rerender(<Component {...props} />);
  expect(screen.queryByRole("button", { name: "Replace cart" })).toBeNull();
  expect(mockRepeat).not.toHaveBeenCalled();
});

it.each(["subject switch", "unmount"])(
  "ignores a late repeat rejection after %s",
  async (change) => {
    let reject!: (reason: Error) => void;
    mockRepeat.mockImplementationOnce(
      () =>
        new Promise((_, fail) => {
          reject = fail;
        }),
    );
    const view = render(<Component {...props} />);
    selectOrder();
    fireEvent.click(screen.getByRole("button", { name: "Replace cart" }));
    if (change === "subject switch") {
      view.rerender(
        <Component {...props} data={{ ...props.data, id: "subject-b" }} />,
      );
    } else {
      view.unmount();
    }
    await act(async () => reject(new Error("Old Subject payment failed")));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("button", { name: "Open cart" })).toBeNull();
  },
);
