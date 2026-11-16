/** @jest-environment jsdom */

import { act, fireEvent, render, screen, within } from "@testing-library/react";

const mockRepeat = jest.fn();
const mockList = jest.fn();
const mockCheckout = jest.fn();
let mockProfileId = "profile-a";
const mockOrders = [
  { id: "awaiting-order", status: "paying", createdAt: "2026-11-16" },
  { id: "paid-order", status: "paid", createdAt: "2026-11-15" },
  { id: "failed-order", status: "failed", createdAt: "2026-11-14" },
];

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  useActiveSocialModuleProfile: () => ({
    socialModuleProfileId: mockProfileId,
  }),
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
  mockProfileId = "profile-a";
  mockRepeat.mockResolvedValue({ orderIds: ["new-cart-order"] });
});

it("loads every historical status and confirms replacement before repeating a pending payment", () => {
  render(<Component {...props} />);
  expect(mockList).toHaveBeenLastCalledWith({
    id: "subject",
    params: {
      socialModuleProfileId: "profile-a",
      includePurchaseDetails: true,
      filters: { and: [{ column: "type", method: "eq", value: "history" }] },
    },
  });
  selectOrder();
  expect(
    screen.getByText(
      /current contents of this profile’s cart will be replaced/,
    ),
  ).toBeTruthy();
  expect(screen.getByRole("note").textContent).toContain(
    "previous payment is not canceled and can still complete",
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
  expect(screen.queryByRole("note")).toBeNull();
});

it("repeats products into the captured profile and opens the existing fresh checkout only on request", async () => {
  render(<Component {...props} />);
  selectOrder("paid-order");
  fireEvent.click(screen.getByRole("button", { name: "Replace cart" }));
  const openCart = await screen.findByRole("button", { name: "Open cart" });
  expect(mockRepeat).toHaveBeenCalledWith({
    id: "subject",
    orderId: "paid-order",
    params: { socialModuleProfileId: "profile-a" },
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

it("scopes pending to the repeated row and discards a late completion after switching profiles", async () => {
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
    within(screen.getByTestId("paid-order")).getByRole("button", {
      name: "Repeat order",
    }),
  );
  expect(mockRepeat).toHaveBeenCalledTimes(1);

  mockProfileId = "profile-b";
  view.rerender(<Component {...props} />);
  await act(async () => resolve({ orderIds: ["profile-a-new-order"] }));
  expect(screen.queryByRole("button", { name: "Open cart" })).toBeNull();
  expect(mockProfileId).toBe("profile-b");
  expect(mockList).toHaveBeenLastCalledWith(
    expect.objectContaining({
      params: expect.objectContaining({ socialModuleProfileId: "profile-b" }),
    }),
  );
  expect(mockRepeat.mock.calls[0][0].params.socialModuleProfileId).toBe(
    "profile-a",
  );
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
