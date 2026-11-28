/** @jest-environment jsdom */
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type {
  ICustomerWorkView,
  IOrderWorkView,
} from "@sps/rbac/models/subject/sdk/model";
import { ThreadCustomerWork, ThreadOrderStage } from "./ThreadCustomerWork";
import { OrderPaymentButtons } from "./OrderPaymentButtons";
import { ResultReview } from "../../../../../../../ecommerce-module/order/create-default/customer-work/ResultReview";

const mockChatCheckout = jest.fn();
const mockOrderWorkRead = jest.fn();
const mockOrderDecision = jest.fn();
const mockUseOrderDecision = jest.fn(() => ({
  mutateAsync: mockOrderDecision,
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock("@sps/billing/models/currency/sdk/client", () => ({
  api: { find: () => ({ data: [{ id: "rub", title: "Ruble", symbol: "₽" }] }) },
}));

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    orderWork: {
      read: () => mockOrderWorkRead(),
      decision: () => mockUseOrderDecision(),
    },
    changeCustomerWork: () => ({ mutateAsync: mockChatCheckout }),
    identityFind: () => ({}),
    ecommerceModuleOrderCheckout: () => ({ mutateAsync: jest.fn() }),
  },
}));

jest.mock("@sps/ecommerce/models/product/frontend/component", () => ({
  Component: jest.requireActual(
    "@sps/ecommerce/models/product/frontend/component/src/lib/singlepage/cart/default/Component",
  ).Component,
}));

jest.mock(
  "@sps/ecommerce/relations/products-to-file-storage-module-files/frontend/component",
  () => ({
    Component: ({
      children,
      variant,
    }: {
      children?: (props: { data: { id: string }[] }) => React.ReactNode;
      variant: string;
    }) =>
      variant === "find" ? (
        children?.({ data: [{ id: "cover-image" }] })
      ) : (
        <img alt="Обложка товара" src="/cover.jpg" />
      ),
  }),
);

const work: ICustomerWorkView = {
  storeId: "store",
  taskId: "task",
  chatId: "chat",
  threadId: "thread",
  orderId: "order",
  offerId: "offer",
  productSlug: "cover",
  assignment: "unassigned",
  canRequestManager: false,
  status: "active",
  customerPays: false,
  messages: [],
};

beforeEach(() => {
  mockOrderWorkRead.mockReset().mockReturnValue({});
  mockUseOrderDecision.mockClear();
});

function renderOrder(order: ICustomerWorkView) {
  render(
    <ThreadCustomerWork
      subjectId="subject"
      work={order}
      productTitle="Обложка"
      language="ru"
    />,
  );
  return within(
    screen.getByRole("heading", { name: "Заказ" }).closest("section")!,
  );
}

it("keeps attachment preview access without purchase actions for staff", () => {
  const order: IOrderWorkView = {
    orderId: "order",
    taskId: "task",
    storeId: "store",
    state: "awaiting-result",
    acceptedFileId: null,
    paidFileId: null,
    files: [
      {
        id: "version",

        createdAt: new Date().toISOString(),
        preview: { id: "preview", path: "/artifact" },
        currencyId: "rub",
        price: "1590",
      },
    ],
    receipt: null,
    result: null,
    deliveryStatus: "pending",
    trackingNumber: null,
  };
  const props = {
    subjectId: "manager",
    language: "en",
    checkoutHref: "/checkout",
    onReadArtifact: jest.fn(),
  };
  const { rerender } = render(<ResultReview {...props} work={order} />);
  expect(screen.queryByRole("combobox")).toBeNull();
  expect(screen.getByRole("button", { name: "Download preview" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: /accept|decline/i })).toBeNull();
  rerender(
    <ResultReview
      {...props}
      work={{
        ...order,
        state: "awaiting-payment",
        acceptedFileId: "version",
      }}
    />,
  );
  expect(
    screen.queryByRole("link", { name: "Continue to payment" }),
  ).toBeNull();
  expect(mockUseOrderDecision).not.toHaveBeenCalled();
  expect(mockOrderDecision).not.toHaveBeenCalled();
});

it("shows the paid original without a version selector", () => {
  const version = {
    id: "earlier",

    createdAt: new Date().toISOString(),
    preview: { id: "preview1", path: "/artifact" },
    currencyId: "rub",
    price: "1590",
  };
  const order: IOrderWorkView = {
    orderId: "order",
    taskId: "task",
    storeId: "store",
    state: "delivered",
    acceptedFileId: "paid",
    paidFileId: "paid",
    files: [
      version,
      {
        ...version,
        id: "paid",

        preview: { id: "preview2", path: "/artifact" },
      },
    ],
    receipt: null,
    result: { id: "original", path: "/artifact" },
    deliveryStatus: "available",
    trackingNumber: null,
  };
  const props = {
    subjectId: "manager",
    language: "en",
    work: order,
    onReadArtifact: jest.fn(),
  };
  render(<ResultReview {...props} />);
  expect(screen.queryByRole("combobox")).toBeNull();
  expect(screen.getByText("Paid")).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Download original" }),
  ).toBeTruthy();
});

it("shows a read-only cart product with its cover, quantity and one exact order link", () => {
  const order = renderOrder({
    ...work,
    cartProposal: {
      id: "confirmed-proposal",
      orderId: "order",
      offerId: "offer",
      title: "Название подтверждённого предложения",
      currencyId: "rub",
      currency: "rub",
      quantity: 2,
      amount: "1590",
      expiresAt: "2026-11-21T10:00:00.000Z",
    },
    orderSummary: {
      product: {
        id: "product",
        slug: "cover",
        title: { ru: "Обложка" },
        shortDescription: {},
        type: "one_off",
      },
      quantity: 2,
      offerId: "offer",
      total: { amount: 1590, symbol: "₽", precision: 2 },
    },
  });

  expect(
    order.getByRole("img", { name: "Обложка товара" }).getAttribute("src"),
  ).toBe("/cover.jpg");
  expect(order.getByText("Количество 2")).toBeTruthy();
  expect(order.getByText("Итого по заказу")).toBeTruthy();
  expect(order.getByText(/590 ₽/)).toBeTruthy();
  expect(order.queryByText("Название подтверждённого предложения")).toBeNull();
  expect(order.getAllByRole("link")).toHaveLength(1);
  expect(
    order.getByRole("link", { name: "Обложка" }).getAttribute("href"),
  ).toBe("/ru/ecommerce/products/cover?offer=offer#order-order");
  expect(order.queryByRole("button")).toBeNull();
});

it("keeps one link for an older response with no projected order line", () => {
  const order = renderOrder(work);

  expect(order.getAllByRole("link")).toHaveLength(1);
  expect(
    order.getByRole("link", { name: "Обложка" }).getAttribute("href"),
  ).toBe("/ru/ecommerce/products/cover?offer=offer#order-order");
  expect(order.queryByText("Итого по заказу")).toBeNull();
});

it("links a store test chat back to its funnel and task", () => {
  renderOrder({
    ...work,
    storeTest: {
      storeSlug: "cover-studio",
      funnelId: "funnel-id",
      funnelSlug: "marketplace-cover",
    },
  });

  expect(
    screen
      .getByRole("link", { name: "Редактировать воронку" })
      .getAttribute("href"),
  ).toBe(
    "/ru/ecommerce/stores/cover-studio/crm/funnels/marketplace-cover?testTask=task",
  );
});

it("keeps the manager section visible while the buyer’s handoff is pending", () => {
  renderOrder({ ...work, awaitingManager: true });
  const manager = within(
    screen.getByRole("heading", { name: "Менеджер" }).closest("section")!,
  );
  expect(manager.getByRole("status").textContent).toBe("Вы позвали менеджера");
  expect(
    manager.queryByRole("button", { name: "Позвать менеджера" }),
  ).toBeNull();
});

const accepted: IOrderWorkView = {
  orderId: "order",
  storeId: "store",
  taskId: "task",
  state: "awaiting-payment",
  acceptedFileId: "v2",
  paidFileId: null,
  files: [
    {
      id: "v1",

      createdAt: "",
      currencyId: "rub",
      price: "400",
      preview: { id: "preview-1", path: "/preview-1" },
    },
    {
      id: "v2",

      createdAt: "",
      currencyId: "rub",
      price: "500",
      preview: { id: "preview-2", path: "/preview-2" },
    },
  ],
  result: null,
  receipt: null,
  trackingNumber: null,
  deliveryStatus: "pending",
};

it("links the accepted file to the checkout of its exact order and official offer", () => {
  mockOrderWorkRead.mockReturnValue({ data: accepted });
  renderOrder({
    ...work,
    productSlug: "old-slug",
    offerId: "old-offer",
    orderSummary: {
      product: {
        id: "product",
        slug: "official-cover",
        title: { ru: "Обложка" },
        shortDescription: {},
        type: "one_off",
      },
      quantity: 1,
      offerId: "exact-offer",
    },
  });
  expect(screen.getByText(/Файл принят.*500/)).toBeTruthy();
  expect(
    screen.getByRole("link", { name: "Перейти к оплате" }).getAttribute("href"),
  ).toBe(
    "/ru/ecommerce/products/official-cover?offer=exact-offer#checkout-order-order",
  );
});

it("binds revision requests to the current preview without an inline form", async () => {
  const pending = {
    ...accepted,
    state: "awaiting-result" as const,
    acceptedFileId: null,
  };
  const review = (fileId: string) => (
    <ResultReview
      subjectId="buyer"
      work={pending}
      language="ru"
      promptMessageId="review-message"
      prompt={{
        fileId,
        acceptText: "Принять файл",
        declineText: "Запросить правки",
      }}
    />
  );
  const { rerender } = render(review("v1"));
  expect(screen.queryByRole("button")).toBeNull();
  rerender(review("v2"));
  expect(
    (screen.getByRole("button", { name: "Принять файл" }) as HTMLButtonElement)
      .disabled,
  ).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Запросить правки" }));
  expect(screen.queryByRole("textbox")).toBeNull();
  await waitFor(() =>
    expect(mockOrderDecision).toHaveBeenCalledWith({
      id: "buyer",
      orderId: "order",
      data: {
        operation: "request-changes",
        fileId: "v2",
        messageId: "review-message",
        storeId: "store",
        taskId: "task",
        operationKey: expect.any(String),
      },
    }),
  );
});

it("starts conversational checkout and leaves paid documents in their own messages", () => {
  mockChatCheckout.mockResolvedValue({});
  mockOrderWorkRead.mockReturnValue({ data: accepted });
  const stage = (
    orderStep:
      "review" | "ecommerce-module-order-payment" | "order-file-delivery",
  ) => (
    <ThreadOrderStage
      subjectId="buyer"
      work={{
        ...work,
        assignment: "assistant",
        workflow: { title: "Service", stageTitle: "Stage", orderStep },
      }}
      language="en"
    />
  );
  const { rerender } = render(stage("review"));
  expect(screen.queryByLabelText("Payment method")).toBeNull();
  rerender(stage("ecommerce-module-order-payment"));
  expect(mockChatCheckout).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "buyer",
      data: expect.objectContaining({
        operation: "chat-checkout",
        taskId: work.taskId,
        storeId: work.storeId,
        input: { kind: "begin" },
      }),
    }),
  );
  expect(
    screen.queryByRole("region", { name: "Pay for this order" }),
  ).toBeNull();
  expect(screen.queryByLabelText("Payment method")).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Download original" }),
  ).toBeNull();
  mockOrderWorkRead.mockReturnValue({
    data: {
      ...accepted,
      state: "paid",
      paidFileId: accepted.acceptedFileId,
      receipt: { id: "receipt", path: "/receipt" },
    },
  });
  rerender(stage("ecommerce-module-order-payment"));
  expect(
    screen.queryByRole("region", { name: "Pay for this order" }),
  ).toBeNull();
  expect(screen.queryByRole("button", { name: "Download receipt" })).toBeNull();
  mockOrderWorkRead.mockReturnValue({
    data: {
      ...accepted,
      state: "delivered",
      paidFileId: accepted.acceptedFileId,
      deliveryStatus: "available",
      result: { id: "original", path: "/original" },
    },
  });
  rerender(stage("order-file-delivery"));
  expect(
    screen.queryByRole("button", { name: "Continue to payment" }),
  ).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Download original" }),
  ).toBeNull();
});

it("hides checkout when the accepted file was invalidated", () => {
  mockOrderWorkRead.mockReturnValue({
    data: {
      ...accepted,
      files: [
        accepted.files[0],
        { ...accepted.files[1], invalidatedByCartEdit: true },
      ],
    },
  });
  renderOrder(work);
  expect(screen.queryByText(/Принята версия/)).toBeNull();
  expect(screen.queryByRole("link", { name: "Перейти к оплате" })).toBeNull();
});

it("discards order work from a different scope", () => {
  mockOrderWorkRead.mockReturnValue({
    data: { ...accepted, orderId: "another-order" },
  });
  renderOrder(work);
  expect(screen.queryByText(/Принята версия/)).toBeNull();
  expect(screen.queryByRole("link", { name: "Перейти к оплате" })).toBeNull();
});

it("makes the receipt available while the buyer waits for the employee to send the file", () => {
  mockOrderWorkRead.mockReturnValue({
    data: {
      ...accepted,
      state: "paid",
      paidFileId: "v2",
      receipt: { id: "receipt", path: "/receipt" },
    },
  });
  renderOrder(work);
  expect(
    screen.getByText("Оплата подтверждена. Ожидаем файл от исполнителя."),
  ).toBeTruthy();
  expect(screen.getByRole("button", { name: "Скачать чек" })).toBeTruthy();
  expect(screen.queryByText(/Принята версия/)).toBeNull();
  expect(screen.queryByRole("button", { name: "Скачать оригинал" })).toBeNull();
});

it("shows the original and receipt after the employee sends the accepted file", () => {
  mockOrderWorkRead.mockReturnValue({
    data: {
      ...accepted,
      state: "delivered",
      paidFileId: "v2",
      result: { id: "original-2", path: "/original-2" },
      receipt: { id: "receipt", path: "/receipt" },
      deliveryStatus: "available",
    },
  });
  renderOrder(work);
  expect(screen.getByText("Оплачено")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Скачать оригинал" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Скачать чек" })).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Перейти к оплате" })).toBeNull();
});

it("hides manager handoff when the buyer's chat has no eligible manager", () => {
  renderOrder({ ...work, assignment: "assistant" });

  expect(screen.queryByRole("heading", { name: "Менеджер" })).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Позвать менеджера" }),
  ).toBeNull();
});

it("offers handoff when the buyer's chat has an eligible manager", () => {
  renderOrder({ ...work, assignment: "assistant", canRequestManager: true });

  expect(
    screen.getByRole("button", { name: "Позвать менеджера" }),
  ).toBeTruthy();
});

it("shows an assigned manager by name without a second handoff", () => {
  renderOrder({ ...work, assignment: "manager", operator: "Анна" });

  const manager = screen
    .getByRole("heading", { name: "Менеджер" })
    .closest("section")!;
  expect(within(manager).getByText("Анна")).toBeTruthy();
  expect(
    within(manager).queryByRole("button", { name: "Позвать менеджера" }),
  ).toBeNull();
});

it("sends the clicked message and callback through the same chat command, and renders a provider URL as a link", async () => {
  mockChatCheckout.mockResolvedValue({});
  render(
    <OrderPaymentButtons
      subjectId="buyer"
      work={work}
      language="ru"
      messageId="active-prompt"
      rows={[
        [{ text: "Stripe", callback_data: "method:stripe" }],
        [{ text: "Оплатить", url: "https://example.org/invoice" }],
      ]}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Stripe" }));
  await waitFor(() =>
    expect(mockChatCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "buyer",
        data: expect.objectContaining({
          input: {
            kind: "button",
            messageId: "active-prompt",
            value: "method:stripe",
          },
        }),
      }),
    ),
  );
  expect(
    screen.getByRole("link", { name: "Оплатить" }).getAttribute("href"),
  ).toBe("https://example.org/invoice");
});
