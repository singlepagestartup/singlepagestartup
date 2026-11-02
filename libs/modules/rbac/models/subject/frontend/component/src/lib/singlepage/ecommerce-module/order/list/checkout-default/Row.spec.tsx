/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Component } from "./Row";
const mockUpdate = jest.fn();
const mockInvalidate = jest.fn();
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    ecommerceModuleOrderUpdate: () => ({
      mutateAsync: mockUpdate,
      isPending: false,
    }),
  },
}));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
}));
jest.mock("@sps/shared-utils", () => ({
  INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG: "free-subscription",
}));
jest.mock("@sps/ui-adapter", () => ({ Icon: () => null }));
jest.mock("@sps/ecommerce/models/product/frontend/component", () => ({
  Component: ({ children }: any) => <div>{children}</div>,
}));
jest.mock("@sps/ecommerce/models/order/frontend/component", () => ({
  Component: () => null,
}));
jest.mock("../../delete-default", () => ({ Component: () => null }));
const props: any = {
  subject: { id: "owner" },
  ecommerceModuleOrder: {
    id: "order",
    cartDetails: {
      lines: [
        {
          id: "line",
          quantity: 2,
          product: { slug: "course", title: { ru: "Курс" } },
        },
      ],
      totals: [],
    },
  },
  language: "ru",
  index: 0,
  form: {},
};
beforeEach(() => {
  mockUpdate.mockReset().mockResolvedValue({});
  mockInvalidate.mockReset().mockResolvedValue(undefined);
});
it("updates only the selected line and reloads the authorized cart totals", async () => {
  render(<Component {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Увеличить количество" }));
  await waitFor(() =>
    expect(mockUpdate).toHaveBeenCalledWith({
      id: "owner",
      orderId: "order",
      data: { ordersToProducts: [{ id: "line", quantity: 3 }] },
    }),
  );
  await waitFor(() =>
    expect(mockInvalidate).toHaveBeenCalledWith({
      queryKey: ["/api/rbac/subjects/owner/ecommerce-module/orders"],
    }),
  );
});
it("shows an update failure without replacing the saved quantity or totals", async () => {
  mockUpdate.mockRejectedValue(new Error("unavailable"));
  render(<Component {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Уменьшить количество" }));
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.getByText("2")).toBeTruthy();
  expect(mockInvalidate).not.toHaveBeenCalled();
});
