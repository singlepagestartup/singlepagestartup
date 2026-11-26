/** @jest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { Component as Orders } from "./client";
import { Component as Order } from "../../detail/customer-default/client";

jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("../../../../../authentication/me-default/client", () => ({
  __esModule: true,
  default: ({ children }: any) =>
    children({ data: { id: "buyer" }, authenticated: mockAuthenticated }),
}));
let mockAuthenticated = true;
const mockRead = jest.fn();
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: { ecommerceModuleOrderList: (input: unknown) => mockRead(input) },
}));
jest.mock("@sps/shared-ui-shadcn", () => ({
  Button: ({ variant, ...props }: any) => <button {...props} />,
}));

const sample = {
  id: "order-one",
  createdAt: new Date("2026-11-25T12:00:00Z"),
  status: "delivering",
  customerDetails: {
    workState: "awaiting-result",
    lines: [
      {
        id: "line",
        productId: "product",
        title: { und: "Original title" },
        quantity: 2,
      },
    ],
    discussion: { chatId: "chat-id", threadId: "thread-id" },
  },
};

it("paginates the current buyer's history and keeps the lookahead off the page", () => {
  mockRead.mockImplementation(({ params }) => ({
    data: params.offset
      ? [{ ...sample, id: "last-page" }]
      : Array.from({ length: 21 }, (_, i) => ({ ...sample, id: "order-" + i })),
  }));
  render(
    <Orders
      isServer={false}
      language="en"
      variant="me-ecommerce-module-order-list-customer-default"
    />,
  );
  expect(screen.getAllByRole("link")).toHaveLength(20);
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(mockRead).toHaveBeenLastCalledWith(
    expect.objectContaining({
      id: "buyer",
      params: expect.objectContaining({
        offset: 20,
        limit: 21,
        includeCustomerDetails: true,
        filters: { and: [{ column: "type", method: "eq", value: "history" }] },
      }),
    }),
  );
  expect(screen.getByRole("link").getAttribute("href")).toBe(
    "/en/rbac/subjects/orders/last-page",
  );
  expect(
    (screen.getByRole("button", { name: "Next" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Previous" }));
  expect(screen.getAllByRole("link")).toHaveLength(20);
});

it("uses the exact order and thread, including historical titles and fulfillment status", () => {
  const renderDiscussion = jest.fn(() => <div>Existing discussion</div>);
  const props = {
    isServer: false,
    language: "en",
    variant: "me-ecommerce-module-order-detail-customer-default",
    ecommerceModuleOrderId: sample.id,
    renderDiscussion,
  } as const;
  mockRead.mockReturnValue({ data: [sample] });
  const view = render(<Order {...props} />);
  expect(mockRead).toHaveBeenLastCalledWith(
    expect.objectContaining({
      id: "buyer",
      params: {
        includeCustomerDetails: true,
        limit: 1,
        filters: {
          and: [
            { column: "type", method: "eq", value: "history" },
            { column: "id", method: "eq", value: sample.id },
          ],
        },
      },
    }),
  );
  expect(screen.getByText("Original title")).toBeTruthy();
  expect(screen.getByText("Qty 2")).toBeTruthy();
  expect(screen.getByText("Preparing the result")).toBeTruthy();
  expect(
    screen.getByRole("link", { name: "Open in chats" }).getAttribute("href"),
  ).toBe("/en/social/chats/chat-id/threads/thread-id");
  expect(renderDiscussion).toHaveBeenCalledWith(
    sample.customerDetails.discussion,
  );
  mockRead.mockReturnValue({
    data: [
      {
        ...sample,
        status: "canceled",
        customerDetails: {
          ...sample.customerDetails,
          workState: "awaiting-payment",
        },
      },
    ],
  });
  view.rerender(<Order {...props} />);
  expect(screen.getByText("Canceled")).toBeTruthy();
  expect(screen.queryByText("Awaiting payment")).toBeNull();
  mockRead.mockReturnValue({
    data: [{ ...sample, customerDetails: { lines: [] } }],
  });
  view.rerender(<Order {...props} />);
  expect(
    screen.getByText("There is no discussion for this order."),
  ).toBeTruthy();
  expect(screen.queryByText("Existing discussion")).toBeNull();
  view.rerender(<Order {...props} ecommerceModuleOrderId="unavailable" />);
  expect(screen.getByText("Order unavailable.")).toBeTruthy();
  expect(screen.queryByText("Original title")).toBeNull();
});

it("retains the last page on transient errors, clears restricted data, and offers sign-in for guests without orders", () => {
  const props = {
    isServer: false,
    language: "en",
    variant: "me-ecommerce-module-order-list-customer-default",
  } as const;
  mockRead.mockReturnValue({
    data: [sample],
    isError: true,
    error: { status: 503 },
  });
  const view = render(<Orders {...props} />);
  expect(screen.getByText("Original title")).toBeTruthy();
  mockRead.mockReturnValue({
    data: [sample],
    isError: true,
    error: { status: 403 },
  });
  view.rerender(<Orders {...props} />);
  expect(screen.queryByText("Original title")).toBeNull();
  mockAuthenticated = false;
  mockRead.mockReturnValue({ data: [] });
  view.rerender(<Orders {...props} />);
  expect(
    screen
      .getByRole("link", { name: "Sign in to your account" })
      .getAttribute("href"),
  ).toBe("/en/rbac/subject/authentication/email-and-password");
  mockRead.mockReturnValue({ data: [sample] });
  view.rerender(<Orders {...props} />);
  expect(screen.getByText("Original title")).toBeTruthy();
  mockAuthenticated = true;
});
