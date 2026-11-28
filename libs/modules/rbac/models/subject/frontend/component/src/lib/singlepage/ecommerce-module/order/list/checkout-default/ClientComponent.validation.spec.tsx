/** @jest-environment jsdom */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
const checkout = jest.fn();
const openWork = jest.fn();
const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));
let pending = 0;
let fetching = 0;
let currencyId = "rub";
let identityRows: { provider: string; email: string }[] = [];
let orderIds = ["order"];
let linesByOrder: Record<string, { id: string }[]> = {};
let extraDetails: Record<string, object> = {};
const selectionCallbacks = new Map<
  string,
  (lineId: string, blocked: boolean) => void
>();
const pendingCallbacks = new Map<
  string,
  (lineId: string, pending: boolean) => void
>();
jest.mock("@tanstack/react-query", () => ({
  useIsMutating: () => pending,
  useIsFetching: () => fetching,
}));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/api/rbac/subjects",
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    changeCustomerWork: () => ({ mutateAsync: openWork, isPending: false }),
    identityFind: () => ({ data: identityRows }),
    ecommerceModuleOrderCheckout: () => ({
      mutateAsync: checkout,
      isPending: false,
    }),
  },
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: ({ children, variant, ecommerceModuleOrder }: any) =>
    variant === "ecommerce-module-order-checkout-default" ? (
      <div
        role="group"
        aria-label={`accepted-checkout-${ecommerceModuleOrder.id}`}
      />
    ) : (
      children({
        data: orderIds.map((id) => ({
          id,
          cartDetails: {
            lines: linesByOrder[id] ?? [],
            ...extraDetails[id],
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
      })
    ),
}));
jest.mock("./Row", () => ({
  Component: ({
    ecommerceModuleOrder,
    onOrderSelectionStateChange,
    onOrderSelectionPendingChange,
    onCartItemSelectionChange,
    selected,
    headerSlot,
    children,
  }: any) => {
    selectionCallbacks.set(ecommerceModuleOrder.id, (lineId, blocked) =>
      onOrderSelectionStateChange(ecommerceModuleOrder.id, lineId, blocked),
    );
    pendingCallbacks.set(ecommerceModuleOrder.id, (lineId, pending) =>
      onOrderSelectionPendingChange(ecommerceModuleOrder.id, lineId, pending),
    );
    return (
      <li data-testid={`order-${ecommerceModuleOrder.id}`}>
        {headerSlot ?? (
          <label>
            <input
              type="checkbox"
              checked={selected ?? true}
              onChange={(e) =>
                onCartItemSelectionChange(
                  ecommerceModuleOrder.id,
                  e.target.checked,
                )
              }
            />
            {ecommerceModuleOrder.id}
          </label>
        )}
        {children}
      </li>
    );
  },
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
  openWork.mockReset();
  push.mockReset();
  pending = 0;
  fetching = 0;
  currencyId = "rub";
  identityRows = [];
  orderIds = ["order"];
  linesByOrder = {};
  extraDetails = {};
  selectionCallbacks.clear();
  pendingCallbacks.clear();
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

it("shows token-funded work outside the postpayment section and checkout totals", async () => {
  orderIds = ["brief", "chair"];
  extraDetails.brief = {
    lines: [
      { id: "brief-line", productId: "brief-item", offerId: "brief-offer" },
    ],
    work: {
      orderId: "brief",
      storeId: "store",
      paymentTiming: "work-tokens",
      state: "requires-discussion",
    },
  };
  checkout.mockResolvedValue({ billingModule: { invoices: [] } });
  render(<Component {...props} />);
  expect(screen.getByRole("heading", { name: "Оплата токенами" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Перейти в чат" })).toBeTruthy();
  expect(screen.queryByText("Оплата после принятия результата.")).toBeNull();
  expect(screen.getByText("К оплате сейчас")).toBeTruthy();
  expect(screen.getByText("100 ₽")).toBeTruthy();
  expect(screen.queryByText("200 ₽")).toBeNull();
  fireEvent.change(screen.getByLabelText("Email для чека"), {
    target: { value: "buyer@example.test" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Перейти к оплате" }));
  await waitFor(() =>
    expect(checkout).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ecommerceModule: { orders: [{ id: "chair" }] },
        }),
      }),
    ),
  );
});

it("opens the service discussion and charges only the selected prepaid product in a mixed cart", async () => {
  orderIds = ["cover", "chair", "lamp"];
  linesByOrder = {
    cover: [{ id: "cover-line" }],
    chair: [{ id: "chair-line" }],
    lamp: [{ id: "lamp-line" }],
  };
  extraDetails.cover = {
    work: {
      orderId: "cover",
      storeId: "store",
      paymentTiming: "after-acceptance",
      state: "awaiting-result",
    },
    discussion: {
      storeId: "store",
      taskId: "task",
      chatId: "chat",
      threadId: "thread",
    },
  };
  checkout.mockResolvedValue({ billingModule: { invoices: [] } });
  render(<Component {...props} />);
  const discussion = screen.getByRole("button", { name: "Перейти в чат" });
  openWork.mockResolvedValue({ chatId: "chat", threadId: "thread" });
  fireEvent.click(discussion);
  await waitFor(() =>
    expect(openWork).toHaveBeenCalledWith({
      id: "subject",
      data: {
        operation: "enter-order-discussion",
        orderId: "cover",
        storeId: "store",
        taskId: "task",
        operationKey: expect.any(String),
      },
    }),
  );
  fireEvent.click(screen.getByRole("checkbox", { name: "lamp" }));
  expect(screen.getByText("100 ₽")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Email для чека"), {
    target: { value: "buyer@example.test" },
  });
  fireEvent.click(screen.getByRole("button", { name: /оплат/i }));
  await waitFor(() =>
    expect(checkout).toHaveBeenCalledWith({
      id: "subject",
      data: expect.objectContaining({
        ecommerceModule: { orders: [{ id: "chair", lineIds: ["chair-line"] }] },
      }),
    }),
  );
  fireEvent.click(screen.getByRole("checkbox", { name: "chair" }));
  expect(screen.queryByRole("textbox", { name: "Email для чека" })).toBeNull();
  expect(screen.getByRole("button", { name: "Перейти в чат" })).toBeTruthy();
  expect(screen.queryByRole("checkbox", { name: "cover" })).toBeNull();
  expect(screen.getByTestId("order-cover").contains(discussion)).toBe(true);
  expect(screen.queryByRole("button", { name: /оплат/i })).toBeNull();
  expect(checkout).toHaveBeenCalledTimes(1);
});
it("requires an explicit choice for a legacy order containing multiple primary products", async () => {
  orderIds = ["bundle"];
  linesByOrder = { bundle: [{ id: "first" }, { id: "second" }] };
  checkout.mockResolvedValue({ billingModule: { invoices: [] } });
  render(<Component {...props} />);
  const choice = screen.getByRole("checkbox", {
    name: "bundle",
  }) as HTMLInputElement;
  expect(choice.checked).toBe(false);
  expect(screen.queryByRole("button", { name: /оплат/i })).toBeNull();
  fireEvent.click(choice);
  fireEvent.change(screen.getByLabelText("Email для чека"), {
    target: { value: "buyer@example.test" },
  });
  fireEvent.click(screen.getByRole("button", { name: /оплат/i }));
  await waitFor(() =>
    expect(checkout).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ecommerceModule: {
            orders: [{ id: "bundle", lineIds: ["first", "second"] }],
          },
        }),
      }),
    ),
  );
});

it("keeps a selected accepted result's checkout separate from prepaid products", () => {
  orderIds = ["cover", "chair"];
  linesByOrder = { chair: [{ id: "chair-line" }] };
  extraDetails.cover = {
    lines: [
      {
        id: "cover-line",
        product: { id: "cover-product", title: { ru: "Обложка" } },
      },
    ],
    work: {
      orderId: "cover",
      storeId: "store",
      paymentTiming: "after-acceptance",
      state: "awaiting-payment",
    },
  };
  render(<Component {...props} />);
  expect(
    screen.getByRole("group", { name: "accepted-checkout-cover" }),
  ).toBeTruthy();
  expect(screen.getByText("100 ₽")).toBeTruthy();
  fireEvent.click(screen.getByRole("checkbox", { name: "cover" }));
  expect(
    screen.queryByRole("group", { name: "accepted-checkout-cover" }),
  ).toBeNull();
  expect(screen.getByRole("button", { name: /оплат/i })).toBeTruthy();
  expect(checkout).not.toHaveBeenCalled();
});

it("blocks checkout for invalid saved quantities and duplicate limited products until the cart is corrected", async () => {
  const line = {
    id: "line",
    productId: "limited",
    product: { singleUnitPerOrder: true },
    quantity: 5,
  };
  linesByOrder = { order: [line] };
  const { rerender } = render(<Component {...props} />);
  const pay = screen.getByRole("button", {
    name: "Перейти к оплате",
  }) as HTMLButtonElement;
  expect(pay.disabled).toBe(true);
  expect(checkout).not.toHaveBeenCalled();

  const corrected = { ...line, quantity: 1 };
  linesByOrder = { order: [corrected, { ...corrected, id: "duplicate" }] };
  rerender(<Component {...props} />);
  fireEvent.click(screen.getByRole("checkbox", { name: "order" }));
  expect(pay.disabled).toBe(true);

  linesByOrder = { order: [corrected] };
  rerender(<Component {...props} />);
  expect(pay.disabled).toBe(false);
});

it("starts the discussion for the exact saved service order after an explicit click", async () => {
  orderIds = ["cover"];
  extraDetails.cover = {
    lines: [{ id: "line", productId: "item", offerId: "offer" }],
    work: {
      orderId: "cover",
      storeId: "store",
      paymentTiming: "after-acceptance",
      state: "requires-discussion",
    },
  };
  let resolve!: (result: { chatId: string; threadId: string }) => void;
  openWork.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const { rerender } = render(<Component {...props} />);
  expect(openWork).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Перейти в чат" }));
  orderIds = [];
  rerender(<Component {...props} />);
  await act(async () => resolve({ chatId: "chat", threadId: "thread" }));
  await waitFor(() =>
    expect(push).toHaveBeenCalledWith("/ru/social/chats/chat/threads/thread"),
  );
  expect(openWork).toHaveBeenCalledWith({
    id: "subject",
    data: {
      operation: "open-cart-discussion",
      orderId: "cover",
      storeId: "store",
      offerId: "offer",
      productId: "item",
      operationKey: expect.any(String),
    },
  });
  expect(checkout).not.toHaveBeenCalled();
});

it("offers no payment or unrelated chat when the store has no service funnel", () => {
  orderIds = ["cover"];
  extraDetails.cover = {
    lines: [{ id: "line", productId: "item", offerId: "offer" }],
    work: {
      orderId: "cover",
      storeId: "store",
      paymentTiming: "after-acceptance",
      state: "discussion-unavailable",
    },
  };
  render(<Component {...props} />);
  expect(screen.getByText(/Обсуждение недоступно/)).toBeTruthy();
  expect(
    screen.queryByRole("button", { name: /оплат|обсуждение/i }),
  ).toBeNull();
  expect(openWork).not.toHaveBeenCalled();
  expect(checkout).not.toHaveBeenCalled();
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
  expect(screen.getByText("Сохранённая сумма")).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Итого" })).toBeNull();
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

it("sends the trimmed comment and receipt email with the exact owned order IDs", async () => {
  checkout.mockResolvedValue({ billingModule: { invoices: [] } });
  render(<Component {...props} />);
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

it("clears the order comment when the acting Subject changes", () => {
  const view = render(<Component {...props} />);
  fireEvent.change(screen.getByLabelText("Комментарий к заказу"), {
    target: { value: "Первый заказ" },
  });
  view.rerender(<Component {...props} data={{ id: "next-subject" } as any} />);
  expect(
    (screen.getByLabelText("Комментарий к заказу") as HTMLTextAreaElement)
      .value,
  ).toBe("");
  expect(screen.queryByRole("radio", { name: "Курьер" })).toBeNull();
});

it("uses only the saved currency's server amount in the footer", () => {
  const view = render(<Component {...props} />);
  expect(screen.getByText("100 ₽")).toBeTruthy();
  expect(screen.queryByText("300 ₽")).toBeNull();
  currencyId = "usd";
  view.rerender(<Component {...props} />);
  expect(screen.getByText("10 $")).toBeTruthy();
  expect(screen.queryByText("100 ₽")).toBeNull();
  expect(screen.queryByText("4 $")).toBeNull();
});

it("places the cart total after all rows and form fields directly before the payment action", () => {
  render(<Component {...props} />);
  const total = screen.getByText("100 ₽").closest('[aria-live="polite"]')!;
  const button = screen.getByRole("button", { name: "Перейти к оплате" });
  expect(total.nextElementSibling).toBe(button);
  for (const before of [
    screen.getByTestId("order-order"),
    screen.getByLabelText("Email для чека"),
    screen.getByLabelText("Комментарий к заказу"),
  ]) {
    expect(
      before.compareDocumentPosition(total) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  }
});

it("keeps checkout blocked until every current row's latest selection has applied", () => {
  orderIds = ["one", "two"];
  linesByOrder = { one: [{ id: "same-line" }], two: [{ id: "same-line" }] };
  render(<Component {...props} />);
  const button = screen.getByRole("button", { name: "Перейти к оплате" });
  act(() => {
    selectionCallbacks.get("one")!("same-line", true);
    selectionCallbacks.get("two")!("same-line", true);
  });
  expect(button.hasAttribute("disabled")).toBe(true);
  act(() => selectionCallbacks.get("one")!("same-line", false));
  expect(button.hasAttribute("disabled")).toBe(true);
  act(() => selectionCallbacks.get("two")!("same-line", false));
  expect(button.hasAttribute("disabled")).toBe(false);
  expect(screen.getByRole("heading", { name: "Итого" })).toBeTruthy();
});

it("reports persistence pending until all current rows settle, independently of invalid-draft checkout blocking", () => {
  orderIds = ["one", "two"];
  linesByOrder = { one: [{ id: "line" }], two: [{ id: "line" }] };
  const onSelectionPendingChange = jest.fn();
  render(
    <Component
      {...props}
      onSelectionPendingChange={onSelectionPendingChange}
    />,
  );
  act(() => {
    selectionCallbacks.get("one")!("line", true);
    pendingCallbacks.get("one")!("line", true);
    pendingCallbacks.get("two")!("line", true);
  });
  expect(onSelectionPendingChange.mock.calls).toEqual([[true]]);
  act(() => pendingCallbacks.get("one")!("line", false));
  expect(onSelectionPendingChange.mock.calls).toEqual([[true]]);
  act(() => pendingCallbacks.get("two")!("line", false));
  expect(onSelectionPendingChange.mock.calls).toEqual([[true], [false]]);
  expect(
    screen
      .getByRole("button", { name: "Перейти к оплате" })
      .hasAttribute("disabled"),
  ).toBe(true);
  expect(screen.getByText("Сохранённая сумма")).toBeTruthy();
});

it("rejects direct form submission while a local invalid, pending or failed draft blocks a row", async () => {
  linesByOrder = { order: [{ id: "draft-line" }] };
  render(<Component {...props} />);
  fireEvent.change(screen.getByLabelText("Email для чека"), {
    target: { value: "test@example.test" },
  });
  act(() => selectionCallbacks.get("order")!("draft-line", true));
  await act(async () => {
    fireEvent.submit(screen.getByLabelText("Email для чека").closest("form")!);
  });
  expect(checkout).not.toHaveBeenCalled();
});

it("ignores blocked selections on removed rows and resets them when the Subject changes", () => {
  orderIds = ["one", "two"];
  linesByOrder = { one: [{ id: "line" }], two: [{ id: "line" }] };
  const view = render(<Component {...props} />);
  act(() => selectionCallbacks.get("one")!("line", true));
  orderIds = ["two"];
  view.rerender(<Component {...props} />);
  expect(
    screen
      .getByRole("button", { name: "Перейти к оплате" })
      .hasAttribute("disabled"),
  ).toBe(false);
  act(() => selectionCallbacks.get("two")!("line", true));
  const oldCallback = selectionCallbacks.get("two")!;
  view.rerender(<Component {...props} data={{ id: "next-subject" }} />);
  act(() => oldCallback("line", true));
  expect(
    screen
      .getByRole("button", { name: "Перейти к оплате" })
      .hasAttribute("disabled"),
  ).toBe(false);
});
