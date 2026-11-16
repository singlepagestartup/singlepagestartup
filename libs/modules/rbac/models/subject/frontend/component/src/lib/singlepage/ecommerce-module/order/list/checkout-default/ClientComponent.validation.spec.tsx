/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
const checkout = jest.fn();
let pending = 0;
let fetching = 0;
let currencyId = "rub";
let identityRows: { provider: string; email: string }[] = [];
let orderIds = ["order"];
jest.mock("@tanstack/react-query", () => ({
  useIsMutating: () => pending,
  useIsFetching: () => fetching,
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    identityFind: () => ({ data: identityRows }),
    ecommerceModuleOrderCheckout: () => ({
      mutateAsync: checkout,
      isPending: false,
    }),
  },
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: ({ children }: any) =>
    children({
      data: orderIds.map((id) => ({
        id,
        cartDetails: {
          lines: [],
          availableCurrencyIds: ["usd", "rub"],
          billingModuleCurrencyId: currencyId,
          totals: [
            {
              total: 10,
              billingModuleCurrency: { id: "usd", slug: "usd", symbol: "$" },
            },
            {
              total: 100,
              billingModuleCurrency: { id: "rub", slug: "rub", symbol: "₽" },
            },
          ],
        },
      })),
    }),
}));
jest.mock("./Row", () => ({ Component: () => null }));
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
  identityRows = [];
  orderIds = ["order"];
});
it.each([
  {
    language: "ru",
    button: "Перейти к оплате",
    emailError: "Введите корректный email для чека.",
  },
  {
    language: "en",
    button: "Proceed to payment",
    emailError: "Enter a valid email address for your receipt.",
  },
])(
  "validates the email in $language without submitting checkout",
  async (test) => {
    render(<Component {...props} language={test.language} />);
    fireEvent.click(screen.getByRole("button", { name: test.button }));
    expect(await screen.findByText(test.emailError)).toBeTruthy();
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

it("prefills the account email and submits the edited address with the currently displayed orders", async () => {
  identityRows = [
    { provider: "email", email: "previous@example.com" },
    { provider: "email_and_password", email: "account@example.com" },
  ];
  checkout.mockResolvedValue({ billingModule: { invoices: [] } });
  const view = render(<Component {...props} />);
  const field = screen.getByLabelText("Email для чека") as HTMLInputElement;
  await waitFor(() => expect(field.value).toBe("account@example.com"));
  fireEvent.change(field, { target: { value: "receipt@example.com" } });
  orderIds = ["second", "third"];
  view.rerender(<Component {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Перейти к оплате" }));
  await waitFor(() =>
    expect(checkout).toHaveBeenCalledWith({
      id: "subject",
      data: {
        provider: "stripe",
        email: "receipt@example.com",
        ecommerceModule: { orders: [{ id: "second" }, { id: "third" }] },
      },
    }),
  );
});
it("submits the suggested email when the buyer leaves it unchanged", async () => {
  identityRows = [
    { provider: "email_and_password", email: "account@example.com" },
  ];
  checkout.mockResolvedValue({ billingModule: { invoices: [] } });
  render(<Component {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Перейти к оплате" }));
  await waitFor(() =>
    expect(checkout).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: "account@example.com" }),
      }),
    ),
  );
});
it("submits an address filled by the browser without an input event", async () => {
  checkout.mockResolvedValue({ billingModule: { invoices: [] } });
  render(<Component {...props} />);
  const field = screen.getByLabelText("Email для чека") as HTMLInputElement;
  field.value = "browser@example.com";
  fireEvent.click(screen.getByRole("button", { name: "Перейти к оплате" }));
  await waitFor(() =>
    expect(checkout).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: "browser@example.com" }),
      }),
    ),
  );
});
it("preserves an explicit edit or deletion when account email loads later and clears it when the subject changes", async () => {
  const view = render(<Component {...props} />);
  const field = screen.getByLabelText("Email для чека") as HTMLInputElement;
  fireEvent.change(field, { target: { value: "edited@example.com" } });
  fireEvent.change(field, { target: { value: "" } });
  identityRows = [{ provider: "google", email: "later@example.com" }];
  view.rerender(<Component {...props} />);
  expect(field.value).toBe("");
  identityRows = [];
  view.rerender(
    <Component {...props} data={{ id: "second-subject" } as any} />,
  );
  expect(
    (screen.getByLabelText("Email для чека") as HTMLInputElement).value,
  ).toBe("");
});

it("sends the order comment and keeps the preview address local when switching between courier and pickup", async () => {
  checkout.mockResolvedValue({ billingModule: { invoices: [] } });
  render(<Component {...props} />);
  fireEvent.click(screen.getByRole("radio", { name: "Курьер" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Город" }), {
    target: { value: "Тула" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Адрес доставки" }), {
    target: { value: "Тестовая, 1" },
  });
  fireEvent.click(screen.getByRole("radio", { name: "Самовывоз" }));
  expect(screen.queryByRole("textbox", { name: "Адрес доставки" })).toBeNull();
  expect(screen.queryByRole("textbox", { name: "Город" })).toBeNull();
  fireEvent.click(screen.getByRole("radio", { name: "Курьер" }));
  expect(
    (
      screen.getByRole("textbox", {
        name: "Адрес доставки",
      }) as HTMLInputElement
    ).value,
  ).toBe("Тестовая, 1");
  fireEvent.change(screen.getByLabelText("Комментарий к заказу"), {
    target: { value: "  Первая строка\nВторая строка  " },
  });
  fireEvent.change(screen.getByLabelText("Email для чека"), {
    target: { value: "buyer@example.test" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Перейти к оплате" }));
  await waitFor(() =>
    expect(checkout).toHaveBeenCalledWith({
      id: "subject",
      data: {
        provider: "stripe",
        email: "buyer@example.test",
        comment: "Первая строка\nВторая строка",
        ecommerceModule: { orders: [{ id: "order" }] },
      },
    }),
  );
});

it("resets the delivery selection, address and order comment when the signed-in subject changes", () => {
  const view = render(<Component {...props} />);
  fireEvent.click(screen.getByRole("radio", { name: "Курьер" }));
  fireEvent.change(screen.getByLabelText("Адрес доставки"), {
    target: { value: "Тестовая, 1" },
  });
  fireEvent.change(screen.getByLabelText("Комментарий к заказу"), {
    target: { value: "Первый заказ" },
  });
  view.rerender(<Component {...props} data={{ id: "next-subject" } as any} />);
  expect(
    (screen.getByLabelText("Комментарий к заказу") as HTMLTextAreaElement)
      .value,
  ).toBe("");
  expect(
    screen.getByRole("radio", { name: "Самовывоз", checked: true }),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("radio", { name: "Курьер" }));
  expect(
    (screen.getByLabelText("Адрес доставки") as HTMLInputElement).value,
  ).toBe("");
});

it("updates the sample courier rate when the selected cart currency changes", () => {
  const view = render(<Component {...props} />);
  const courier = screen.getByRole("radio", { name: "Курьер" });
  expect(courier.closest("label")?.textContent).toContain("300 ₽");
  currencyId = "usd";
  view.rerender(<Component {...props} />);
  expect(courier.closest("label")?.textContent).toContain("4 $");
  fireEvent.click(courier);
  expect(screen.getByText("10 $")).toBeTruthy();
});
