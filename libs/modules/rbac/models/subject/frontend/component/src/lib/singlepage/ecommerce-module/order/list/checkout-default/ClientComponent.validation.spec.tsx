/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type * as ReactHookForm from "react-hook-form";
const checkout = jest.fn();
let pending = 0;
let fetching = 0;
let currencyId = "rub";
jest.mock("@tanstack/react-query", () => ({
  useIsMutating: () => pending,
  useIsFetching: () => fetching,
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    ecommerceModuleOrderCheckout: () => ({
      mutateAsync: checkout,
      isPending: false,
    }),
  },
}));
jest.mock("@sps/shared-ui-shadcn", () => ({
  Form: (props: any) => {
    const { FormProvider } =
      jest.requireActual<typeof ReactHookForm>("react-hook-form");
    return <FormProvider {...props}>{props.children}</FormProvider>;
  },
  Button: ({ children, variant, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));
jest.mock("@sps/ui-adapter", () => ({
  FormField: (props: any) =>
    props.name === "email" ? (
      <label>
        {props.label}
        <input aria-label={props.label} {...props.form.register(props.name)} />
        <span>{props.form.formState.errors[props.name]?.message}</span>
      </label>
    ) : (
      <select aria-label={props.label} {...props.form.register(props.name)}>
        <option value="stripe">stripe</option>
      </select>
    ),
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: ({ children }: any) =>
    children({
      data: [
        {
          id: "order",
          cartDetails: {
            lines: [],
            availableCurrencyIds: ["usd", "rub"],
            billingModuleCurrencyId: currencyId,
            totals: [
              { total: 10, billingModuleCurrency: { id: "usd", symbol: "$" } },
              { total: 100, billingModuleCurrency: { id: "rub", symbol: "₽" } },
            ],
          },
        },
      ],
    }),
}));
jest.mock("./Row", () => ({
  Component: ({ form, index, ecommerceModuleOrder }: any) => (
    <input
      type="hidden"
      defaultValue={ecommerceModuleOrder.id}
      {...form.register(`ecommerceModule.orders.${index}.id`)}
    />
  ),
}));
import { Component } from "./ClientComponent";
const props = {
  isServer: false,
  variant: "ecommerce-module-order-list-checkout-default",
  data: { id: "subject" },
  language: "ru",
} as any;
beforeEach(() => {
  checkout.mockReset();
  pending = 0;
  fetching = 0;
  currencyId = "rub";
});
it.each([
  {
    language: "ru",
    button: "Перейти к оплате",
    summary: "Проверьте email для чека и данные заказа.",
    emailError: "Введите корректный email для чека.",
  },
  {
    language: "en",
    button: "Proceed to payment",
    summary: "Check your receipt email and order details.",
    emailError: "Enter a valid email address for your receipt.",
  },
])(
  "validates the email in $language without submitting checkout",
  async (test) => {
    render(<Component {...props} language={test.language} />);
    fireEvent.click(screen.getByRole("button", { name: test.button }));
    expect((await screen.findByRole("alert")).textContent).toBe(test.summary);
    expect(screen.getByText(test.emailError)).toBeTruthy();
    expect(checkout).not.toHaveBeenCalled();
  },
);
it("shows the API rejection after a valid form submission", async () => {
  checkout.mockRejectedValue(new Error("Для выбранной валюты нет цены"));
  render(<Component {...props} />);
  fireEvent.change(screen.getByLabelText("Email для чека"), {
    target: { value: "test@example.test" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Перейти к оплате" }));
  await waitFor(() =>
    expect(checkout).toHaveBeenCalledWith({
      id: "subject",
      data: expect.objectContaining({
        email: "test@example.test",
        ecommerceModule: { orders: [{ id: "order" }] },
      }),
    }),
  );
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Для выбранной валюты нет цены",
  );
});
it("shows only the selected currency amount", () => {
  render(<Component {...props} />);
  expect(screen.getByText("100 ₽")).toBeTruthy();
  expect(screen.queryByText("10 $")).toBeNull();
});
it("shows an English message when checkout returns no payment link", async () => {
  checkout.mockResolvedValue({ billingModule: { invoices: [] } });
  render(<Component {...props} language="en" />);
  fireEvent.change(screen.getByLabelText("Receipt email"), {
    target: { value: "test@example.test" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Proceed to payment" }));
  expect((await screen.findByRole("alert")).textContent).toBe(
    "Could not get a payment link. Please try again.",
  );
});
it.each(["mutation", "refresh"])("blocks checkout during a cart %s", (mode) => {
  if (mode === "mutation") pending = 1;
  else fetching = 1;
  render(<Component {...props} />);
  const button = screen.getByRole("button", { name: "Перейти к оплате" });
  expect(button.hasAttribute("disabled")).toBe(true);
  fireEvent.click(button);
  expect(checkout).not.toHaveBeenCalled();
});
it("blocks checkout when the saved currency is no longer available", () => {
  currencyId = "stars";
  render(<Component {...props} />);
  expect(screen.getByRole("alert").textContent).toContain("Выберите валюту");
  expect(
    screen
      .getByRole("button", { name: "Перейти к оплате" })
      .hasAttribute("disabled"),
  ).toBe(true);
});
