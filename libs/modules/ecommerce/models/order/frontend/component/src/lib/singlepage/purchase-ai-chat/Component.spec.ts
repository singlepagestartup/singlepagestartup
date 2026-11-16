import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const mockTotal = jest.fn();
const mockReceiptLinks = jest.fn();
const mockReceiptFiles = jest.fn();
let mockReceipts: { fileStorageModuleFileId: string }[] = [];
jest.mock("server-only", () => ({}));
jest.mock("client-only", () => ({}));
jest.mock("@sps/ecommerce/models/order/sdk/client", () => ({
  Provider: ({ children }: any) => children,
  api: {
    total: (...args: unknown[]) => mockTotal(...args),
    findById: ({ id }: { id: string }) => ({
      data: {
        id,
        receipt: "SPS-2026-1042",
        createdAt: "2026-10-08T12:00:00.000Z",
        type: "history",
        status: "paid",
      },
      isLoading: false,
    }),
  },
}));
jest.mock("@sps/ecommerce/models/order/sdk/server", () => ({
  api: { total: jest.fn() },
}));
jest.mock(
  "@sps/ecommerce/relations/orders-to-file-storage-module-files/frontend/component",
  () => ({
    Component: ({ children }: any) => {
      mockReceiptLinks();
      return children({ data: mockReceipts });
    },
  }),
);
jest.mock("@sps/file-storage/models/file/frontend/component", () => ({
  Component: ({ children }: any) => {
    mockReceiptFiles();
    return children({
      data: [{ id: "receipt-file", file: "/file-storage/static/receipt.pdf" }],
    });
  },
}));
jest.mock("@sps/website-builder/models/feature/frontend/component", () => ({
  Component: () => null,
}));
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  NEXT_PUBLIC_API_SERVICE_URL: "http://localhost:4000",
}));
import { Component } from "../../index";
import { Component as Server } from "./server";

function renderPurchase() {
  return renderToStaticMarkup(
    createElement(Component, {
      isServer: false,
      variant: "purchase-ai-chat",
      data: {
        id: "order-1",
        receipt: "SPS-2026-1042",
        createdAt: "2026-10-08T12:00:00.000Z",
        type: "history",
        status: "paid",
      } as any,
    }),
  );
}
describe("Paid purchase details", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReceipts = [{ fileStorageModuleFileId: "receipt-file" }];
    const currency = {
      id: "rub",
      slug: "rub",
      title: "Российский Рубль",
      symbol: "₽",
    };
    mockTotal.mockReturnValue({
      data: [
        { total: 100, billingModuleCurrency: currency },
        { total: 30, billingModuleCurrency: currency },
      ],
      isPending: false,
      isError: false,
    });
  });
  it("sums product totals once per currency and displays the order reference and date", () => {
    const html = renderPurchase();
    expect(html).toContain("130 RUB");
    expect(html).toContain("SPS-2026-1042");
    expect(html).toContain("2026-10-08");
    expect(html).not.toContain("100 RUB");
  });
  it("opens the stored receipt in a separate tab instead of generating preview receipt text", () => {
    const html = renderPurchase();
    expect(html).toContain(
      'href="http://localhost:4000/public/file-storage/static/receipt.pdf"',
    );
    expect(html).toContain('target="_blank"');
    expect(html).not.toContain("download=");
  });
  it("does not invent a downloadable receipt when no receipt file exists", () => {
    mockReceipts = [];
    const html = renderPurchase();
    expect(html).not.toContain("Чек");
    expect(html).not.toContain("href=");
  });
  it.each([
    ["paying", "Ожидает оплаты", "bg-amber-100", true, false],
    ["paid", "Оплачено", "bg-green-100", false, false],
    ["requested_cancelation", "Запрошена отмена", "bg-orange-100", false, true],
  ] as const)(
    "shows the actions and badge for %s",
    (status, label, color, canPay, hasReceipt) => {
      const html = renderToStaticMarkup(
        createElement(Component, {
          isServer: false,
          variant: "purchase-ai-chat",
          language: "ru",
          dataSource: "props",
          data: { id: "order", createdAt: "2026-11-16", status } as any,
          purchaseDetails: {
            totals: [],
            receipts: hasReceipt
              ? [{ file: "/public/file-storage/static/receipt.png" } as any]
              : [],
            paymentUrl: "https://checkout.example/session",
          },
        }),
      );
      expect(html).toContain(color);
      expect(html).toContain(label);
      expect(html.includes('href="https://checkout.example/session"')).toBe(
        canPay,
      );
      expect(html.includes("Перейти к оплате")).toBe(canPay);
      expect(html.includes("Чек")).toBe(hasReceipt);
      expect(
        html.includes(
          'href="http://localhost:4000/public/file-storage/static/receipt.png"',
        ),
      ).toBe(hasReceipt);
    },
  );
  it("omits both actions for a pending order with no open invoice and an empty receipt path", () => {
    const html = renderToStaticMarkup(
      createElement(Component, {
        isServer: false,
        variant: "purchase-ai-chat",
        language: "en",
        dataSource: "props",
        data: { id: "order", createdAt: "2026-11-16", status: "paying" } as any,
        purchaseDetails: { totals: [], receipts: [{ file: "   " } as any] },
      }),
    );
    expect(html).toContain("Awaiting payment");
    expect(html).not.toContain("href=");
    expect(html).not.toContain("Receipt");
  });
  it("keeps total failures local to the purchase details", () => {
    mockTotal.mockReturnValue({ isPending: false, isError: true });
    const html = renderPurchase();
    expect(html).toContain("Сумма недоступна");
    expect(html).toContain("SPS-2026-1042");
  });
  it("renders parent-owned purchase details without generic totals or receipt queries", () => {
    const html = renderToStaticMarkup(
      createElement(Component, {
        isServer: false,
        variant: "purchase-ai-chat",
        dataSource: "props",
        data: {
          id: "owned-order",
          createdAt: "2026-10-16",
          status: "paid",
        } as any,
        purchaseDetails: {
          totals: [
            {
              total: 0,
              billingModuleCurrency: {
                id: "usd",
                slug: "usd",
                symbol: "$",
              } as any,
            },
          ],
          receipts: [
            { id: "owned-file", file: "/file-storage/static/owned.pdf" } as any,
          ],
        },
      }),
    );
    expect(html).toContain("0 USD");
    expect(html).toContain("/public/file-storage/static/owned.pdf");
    expect(mockTotal).not.toHaveBeenCalled();
    expect(mockReceiptLinks).not.toHaveBeenCalled();
    expect(mockReceiptFiles).not.toHaveBeenCalled();
  });
  it("keeps an expired subscription purchase and its stored receipt available", () => {
    const html = renderToStaticMarkup(
      createElement(Component, {
        isServer: false,
        variant: "purchase-ai-chat",
        dataSource: "props",
        data: {
          id: "expired-order",
          receipt: "SPS-EXPIRED",
          createdAt: "2026-10-08T12:00:00.000Z",
          status: "expired",
        } as any,
        purchaseDetails: {
          totals: [
            {
              total: 42,
              billingModuleCurrency: {
                id: "usd",
                slug: "usd",
                symbol: "$",
              } as any,
            },
          ],
          receipts: [
            {
              id: "receipt-file",
              file: "/file-storage/static/expired.pdf",
            } as any,
          ],
        },
      }),
    );
    expect(html).toContain("Срок истёк");
    expect(html).toContain("SPS-EXPIRED");
    expect(html).toContain("42 USD");
    expect(html).toContain("/public/file-storage/static/expired.pdf");
    expect(mockTotal).not.toHaveBeenCalled();
    expect(mockReceiptLinks).not.toHaveBeenCalled();
  });
  it.each([
    ["paying", "Ожидает оплаты"],
    ["failed", "Ошибка оплаты"],
    ["canceled", "Отменён"],
    ["canceling", "Отменяется"],
    ["requested_cancelation", "Запрошена отмена"],
    ["approving", "На подтверждении"],
  ])(
    "renders the real %s status and parent-owned action and confirmation slots",
    (status, label) => {
      const html = renderToStaticMarkup(
        createElement(Component, {
          isServer: false,
          variant: "purchase-ai-chat",
          dataSource: "props",
          data: {
            id: "historical-order",
            createdAt: "2026-11-16",
            status,
          } as any,
          actions: createElement("button", { type: "button" }, "Repeat order"),
          footer: createElement("p", null, "Replace cart contents?"),
          purchaseDetails: { totals: [], receipts: [] },
        }),
      );
      expect(html).toContain(label);
      expect(html).not.toContain("Оплачено");
      expect(html).toContain("Repeat order");
      expect(html).toContain("Replace cart contents?");
      expect(mockTotal).not.toHaveBeenCalled();
      expect(mockReceiptLinks).not.toHaveBeenCalled();
    },
  );
  it("loads totals through the server SDK before rendering a server purchase", async () => {
    const serverApi = jest.requireMock(
      "@sps/ecommerce/models/order/sdk/server",
    ).api;
    serverApi.total.mockResolvedValue([
      {
        total: 42,
        billingModuleCurrency: { id: "usd", slug: "usd", symbol: "$" },
      },
    ]);
    const options = { headers: { "Cache-Control": "no-store" } };
    const result = await Server({
      isServer: true,
      variant: "purchase-ai-chat",
      data: {
        id: "server-order",
        receipt: "SPS-SERVER",
        createdAt: "2026-10-08T12:00:00.000Z",
      } as any,
      apiProps: { options },
    });
    const html = renderToStaticMarkup(result);
    expect(serverApi.total).toHaveBeenCalledWith({
      id: "server-order",
      options,
    });
    expect(html).toContain("42 USD");
    expect(html).toContain("SPS-SERVER");
  });
});
