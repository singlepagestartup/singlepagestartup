import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { IPurchaseCharge } from "@sps/ecommerce/models/order/sdk/model";

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
import type { IComponentProps } from "./interface";

function renderPurchase(props: Partial<IComponentProps> = {}) {
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
      ...props,
    }),
  );
}

function purchaseCharge(
  title: string,
  role: IPurchaseCharge["charge"]["role"],
  orderLineId?: string,
  parentLineId: string | null = null,
): IPurchaseCharge {
  return {
    version: 1,
    orderLineId,
    parentLineId,
    currencyId: "rub",
    amount: "100",
    orderAmount: "100",
    purchaseType: "one_off",
    quoteVersion: "quote",
    quoteExpiresAt: "2026-10-08T12:00:00.000Z",
    charge: {
      title,
      offerId: `offer-${title}`,
      productId: `product-${title}`,
      storeId: "store",
      providerStoreId: "store",
      role,
      recurrence: "first",
      quantity: 1,
      stockQuantity: null,
      amount: "100",
      formula: "",
      formulaVersion: "",
      inputs: {},
    },
    destination: {},
  };
}

function renderedChargeRows(html: string) {
  const details = html.match(/<details[\s\S]*?<\/details>/)?.[0] ?? "";
  return Array.from(
    details.matchAll(/<li class="([^"]*)"[^>]*><div><p>(.*?) × 1<\/p>/g),
    ([, className, title]) => ({
      title,
      indented: className.split(" ").includes("ml-4"),
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
  it.each(["ru", "en"])(
    "links the saved product title to its current %s page",
    (language) => {
      const html = renderToStaticMarkup(
        createElement(Component, {
          isServer: false,
          variant: "purchase-ai-chat",
          dataSource: "props",
          language,
          data: {
            id: "purchase",
            status: "paid",
            createdAt: "2026-11-17",
          } as any,
          purchaseDetails: {
            totals: [],
            receipts: [],
            primaryProductSlug: "birch-chair",
            charges: [
              {
                charge: { role: "delivery", title: "Доставка" },
                destination: {},
              },
              {
                charge: { role: "product", title: "Стул «Берёза»" },
                destination: {},
              },
            ] as any,
          },
        }),
      );
      expect(html).toMatch(
        new RegExp(
          `<a [^>]*href="/${language}/ecommerce/products/birch-chair"[^>]*>Стул «Берёза»</a>`,
        ),
      );
    },
  );
  it("lists each product before its own services even when two lines share an offer", () => {
    const html = renderPurchase({
      dataSource: "props",
      language: "ru",
      purchaseDetails: {
        primaryProductSlug: "birch-chair",
        totals: [],
        receipts: [],
        charges: [
          purchaseCharge("Сборка стула", "add-on", "assembly", "chair"),
          purchaseCharge(
            "Доставка второго стула",
            "delivery",
            "second-delivery",
            "second-chair",
          ),
          purchaseCharge("Стул Берёза", "product", "chair"),
          purchaseCharge("Стул Берёза", "product", "second-chair"),
          purchaseCharge(
            "Доставка мастерской",
            "delivery",
            "chair-delivery",
            "chair",
          ),
          purchaseCharge("Отдельная услуга", "add-on", "standalone"),
          purchaseCharge(
            "Услуга из старого заказа",
            "add-on",
            "orphan",
            "missing",
          ),
        ],
      },
    });

    expect(html).toMatch(
      /<a [^>]*href="\/ru\/ecommerce\/products\/birch-chair"[^>]*>Стул Берёза<\/a>/,
    );
    expect(renderedChargeRows(html)).toEqual([
      { title: "Стул Берёза", indented: false },
      { title: "Сборка стула", indented: true },
      { title: "Доставка мастерской", indented: true },
      { title: "Стул Берёза", indented: false },
      { title: "Доставка второго стула", indented: true },
      { title: "Отдельная услуга", indented: false },
      { title: "Услуга из старого заказа", indented: false },
    ]);
  });
  it("puts the product first when legacy charges have no line IDs", () => {
    const html = renderPurchase({
      dataSource: "props",
      language: "ru",
      purchaseDetails: {
        totals: [],
        receipts: [],
        charges: [
          purchaseCharge("Сборка стула", "add-on"),
          purchaseCharge("Стул Берёза", "product"),
          purchaseCharge("Доставка мастерской", "delivery"),
        ],
      },
    });

    expect(renderedChargeRows(html)).toEqual([
      { title: "Стул Берёза", indented: false },
      { title: "Сборка стула", indented: true },
      { title: "Доставка мастерской", indented: true },
    ]);
  });
  it("renders the period and the next payment supplied by the buyer's Subject", () => {
    const html = renderToStaticMarkup(
      createElement(Component, {
        isServer: false,
        variant: "purchase-ai-chat",
        dataSource: "props",
        language: "ru",
        data: {
          id: "current",
          status: "delivering",
          createdAt: "2026-10-01",
          subscriptionPeriodStartsAt: "2026-10-01",
          subscriptionPeriodEndsAt: "2026-11-01",
        } as any,
        purchaseDetails: {
          totals: [],
          receipts: [],
          invoiceShares: [
            {
              invoiceId: "october",
              invoiceAmount: 100,
              amount: 100,
              currencyId: "rub",
              orderIds: ["current"],
              showSharedTotal: false,
              status: "paid",
            },
          ],
          nextPeriod: {
            orderId: "next",
            status: "paying",
            startsAt: "2026-11-01",
            endsAt: "2026-12-01",
            paymentUrl: "https://checkout.example/next",
            totals: [],
            requiresConfirmation: false,
          },
        },
      }),
    );
    expect(html).toContain("Период подписки");
    expect(html).toContain("Оплачен");
    expect(html).toContain("Оплатить следующий период");
    expect(html).toContain('href="https://checkout.example/next"');
    expect(mockTotal).not.toHaveBeenCalled();
    expect(mockReceiptLinks).not.toHaveBeenCalled();
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
