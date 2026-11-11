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
jest.mock("@sps/ui-adapter", () => ({
  Icon: () => null,
  Select: ({
    id,
    value,
    onValueChange,
    disabled,
    placeholder,
    options,
  }: any) => (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(event) => onValueChange(event.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((option: { value: string; label: string }) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));
jest.mock("@sps/ecommerce/models/product/frontend/component", () => ({
  Component: ({ children }: any) => <div>{children}</div>,
}));
jest.mock("@sps/ecommerce/models/order/frontend/component", () => ({
  Component: () => null,
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: () => null,
}));
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

it("changes only the selected order currency and waits for the authorized cart refresh", async () => {
  const currencyProps = {
    ...props,
    ecommerceModuleOrder: {
      ...props.ecommerceModuleOrder,
      cartDetails: {
        ...props.ecommerceModuleOrder.cartDetails,
        availableCurrencyIds: ["usd", "rub"],
        billingModuleCurrencyId: "usd",
        totals: [
          {
            total: 10,
            billingModuleCurrency: { id: "usd", symbol: "$", title: "USD" },
          },
          {
            total: 100,
            billingModuleCurrency: { id: "rub", symbol: "₽", title: "RUB" },
          },
        ],
      },
    },
  };
  const view = render(<Component {...currencyProps} />);
  expect(screen.getByText("10 $")).toBeTruthy();
  expect(screen.queryByText("100 ₽")).toBeNull();
  fireEvent.change(screen.getByLabelText("Валюта оплаты"), {
    target: { value: "rub" },
  });
  await waitFor(() =>
    expect(mockUpdate).toHaveBeenCalledWith({
      id: "owner",
      orderId: "order",
      data: { billingModule: { currency: { id: "rub" } } },
    }),
  );
  expect(mockInvalidate).toHaveBeenCalledWith({
    queryKey: ["/api/rbac/subjects/owner/ecommerce-module/orders"],
  });
  view.rerender(
    <Component
      {...currencyProps}
      ecommerceModuleOrder={{
        ...currencyProps.ecommerceModuleOrder,
        cartDetails: {
          ...currencyProps.ecommerceModuleOrder.cartDetails,
          billingModuleCurrencyId: "rub",
        },
      }}
    />,
  );
  expect(screen.getByText("100 ₽")).toBeTruthy();
  expect(screen.queryByText("10 $")).toBeNull();
});
it("requires an explicit choice when a legacy selection is no longer priced", () => {
  render(
    <Component
      {...props}
      ecommerceModuleOrder={{
        ...props.ecommerceModuleOrder,
        cartDetails: {
          ...props.ecommerceModuleOrder.cartDetails,
          availableCurrencyIds: ["rub"],
          billingModuleCurrencyId: "old-stars",
          totals: [
            {
              total: 100,
              billingModuleCurrency: { id: "rub", symbol: "₽", title: "RUB" },
            },
          ],
        },
      }}
    />,
  );
  expect(
    (screen.getByLabelText("Валюта оплаты") as HTMLSelectElement).value,
  ).toBe("");
  expect(mockUpdate).not.toHaveBeenCalled();
});
