import { Service } from "./customer-details";

function fixture() {
  const line = {
    id: "line",
    orderId: "order",
    productId: "product",
    quantity: 1,
  };
  const paymentLinks = { find: jest.fn().mockResolvedValue([]) };
  const ecommerce = {
    order: {
      work: {
        statesForCustomer: jest.fn().mockResolvedValue([]),
        findByOrder: jest.fn(),
      },
      paymentIntent: {
        find: jest.fn().mockResolvedValue([
          {
            id: "intent",
            status: "succeeded",
            checkoutCurrencyId: "rub",
            amount: 25,
            checkoutMetadata: {
              ecommerceModule: {
                orders: [{ id: "order", ordersToProducts: [line] }],
              },
            },
          },
        ]),
      },
      ordersToBillingModulePaymentIntents: paymentLinks,
    },
    productsToFileStorageModuleFiles: { find: jest.fn().mockResolvedValue([]) },
    ordersToProducts: { find: jest.fn().mockResolvedValue([line]) },

    product: { find: jest.fn().mockResolvedValue([]) },
  };
  const service = {
    modules: {
      ecommerce,
      billing: {
        paymentIntentsToInvoices: { find: jest.fn().mockResolvedValue([]) },
        invoice: { find: jest.fn().mockResolvedValue([]) },
        paymentIntentsToCurrencies: { find: jest.fn().mockResolvedValue([]) },
        currency: {
          find: jest.fn().mockResolvedValue([{ id: "rub", symbol: "₽" }]),
        },
      },
      fileStorage: {
        file: { publicMetadata: jest.fn().mockResolvedValue([]) },
      },
    },
    module: {
      subjectsToEcommerceModuleOrders: {
        find: jest
          .fn()
          .mockResolvedValue([
            { subjectId: "subject", ecommerceModuleOrderId: "order" },
          ]),
      },
    },
    orderWork: { publishedReceipts: jest.fn().mockResolvedValue([]) },
    protectedFile: { hasGrant: jest.fn().mockResolvedValue(true) },
    customerWork: {
      discussionForOrder: jest.fn().mockResolvedValue({
        taskId: "private",
        chatId: "chat",
        threadId: "thread",
      }),
      assertChatAccess: jest.fn(),
    },
    socialModuleChatLifecycleAssertSubjectOwnsChat: jest.fn(),
  };
  return {
    line,
    ecommerce,
    service,
    reader: new Service({ service: service as never }),
  };
}
const subjectId = "subject";

describe("Customer order details", () => {
  it("reads saved quantities, purchase labels, and old lines in bulk", async () => {
    const { reader, ecommerce, line, service } = fixture();
    ecommerce.ordersToProducts.find.mockResolvedValue([
      line,
      { id: "old", orderId: "historical", productId: "legacy", quantity: 3 },
      {
        id: "unavailable",
        orderId: "historical",
        productId: "removed",
        quantity: 4,
      },
    ]);
    ecommerce.product.find.mockResolvedValue([
      { id: "product", title: { en: "Renamed service" } },
      { id: "legacy", title: { en: "Print", ru: "Печать" } },
    ]);
    ecommerce.order.ordersToBillingModulePaymentIntents.find.mockResolvedValue([
      {
        billingModulePaymentIntentId: "intent",
        orderId: "order",
        orderLineId: "line",
        purchaseSnapshot: {
          charge: {
            productId: "product",
            title: "Original service",
            quantity: 2,
          },
        },
      },
    ]);
    const result = await reader.execute({
      subjectId,
      ownedHistoryOrderIds: ["order", "historical", "empty"],
    });
    expect(result.get("order")).toEqual({
      lines: [
        {
          id: "line",
          productId: "product",
          title: { und: "Original service" },
          quantity: 2,
          price: { amount: 25, symbol: "₽", precision: 2 },
        },
      ],
    });
    expect(result.get("historical")).toEqual({
      lines: [
        {
          id: "old",
          productId: "legacy",
          title: { en: "Print", ru: "Печать" },
          quantity: 3,
        },
        { id: "unavailable", productId: "removed", title: {}, quantity: 4 },
      ],
    });
    expect(result.get("empty")).toEqual({ lines: [] });
    expect(ecommerce.product.find).toHaveBeenCalledTimes(1);
    expect(service.customerWork.discussionForOrder).not.toHaveBeenCalled();
  });

  it("uses the paid service amount and exposes the receipt path only on its owner's detail", async () => {
    const { reader, service, ecommerce, line } = fixture();
    const payment = {
      id: "intent",
      status: "succeeded",
      amount: 25,
      checkoutCurrencyId: "rub",
      checkoutProvider: "dummy",
      checkoutMetadata: {
        email: "buyer@example.test",
        secret: "internal",
        ecommerceModule: {
          orders: [{ id: "order", ordersToProducts: [line] }],
        },
      },
    };
    ecommerce.order.paymentIntent.find.mockResolvedValue([payment]);
    ecommerce.order.ordersToBillingModulePaymentIntents.find.mockResolvedValue([
      { orderId: "order", billingModulePaymentIntentId: "intent" },
    ]);
    ecommerce.product.find.mockResolvedValue([
      {
        id: "product",
        variant: "default",
        slug: "artwork",
        title: { en: "Artwork" },
      },
    ]);
    ecommerce.productsToFileStorageModuleFiles.find.mockResolvedValue([
      { productId: "product", fileStorageModuleFileId: "cover" },
    ]);
    service.modules.fileStorage.file.publicMetadata.mockResolvedValue([
      {
        id: "cover",
        file: "https://example.test/cover.jpg",
        mimeType: "image/jpeg",
      },
    ]);
    ecommerce.order.work.statesForCustomer.mockResolvedValue([
      { orderId: "order", state: "delivered" },
    ]);
    ecommerce.order.work.findByOrder.mockResolvedValue({
      customerId: subjectId,
      orderId: "order",
      kind: "individual-service",
      deliveredAt: "2026-11-26T10:01:00Z",
      resultFileId: "result",
      files: [],
      paid: { paidAt: "2026-11-26T10:00:00Z", price: "25", currencyId: "rub" },
      receiptFileId: "receipt",
      expertArchive: ["private"],
    });
    const list = await reader.execute({
      subjectId,
      ownedHistoryOrderIds: ["order"],
    });
    expect(list.get("order")?.lines[0]).toMatchObject({
      productSlug: "artwork",
      coverUrl: "https://example.test/cover.jpg",
      price: { amount: 25, symbol: "₽", precision: 2 },
    });
    expect(list.get("order")?.checkout).toBeUndefined();
    const result = await reader.execute({
      subjectId,
      ownedHistoryOrderIds: ["order"],
      requestedOrderId: "order",
    });
    const path =
      "/api/rbac/subjects/subject/ecommerce-module/orders/order/work/artifacts/receipt";
    expect(service.protectedFile.hasGrant).toHaveBeenCalledWith(
      subjectId,
      path,
      "GET",
    );
    expect(result.get("order")?.checkout).toEqual({
      email: "buyer@example.test",
      paymentProvider: "dummy",
      delivery: [{ kind: "digital" }],
      paidAt: "2026-11-26T10:00:00Z",
      total: { amount: 25, symbol: "₽", precision: 2 },
      receipts: [{ id: "receipt", path }],
    });
    service.protectedFile.hasGrant.mockResolvedValue(false);
    const revoked = await reader.execute({
      subjectId,
      ownedHistoryOrderIds: ["order"],
      requestedOrderId: "order",
    });
    expect(revoked.get("order")?.checkout?.receipts).toBeUndefined();
  });

  it("uses the buyer's shipping charge and destination without exposing another order's payment data", async () => {
    const { reader, ecommerce, service, line } = fixture();
    ecommerce.ordersToProducts.find.mockResolvedValue([
      line,
      { ...line, id: "shipping", productId: "courier", quantity: 1 },
    ]);
    const common = {
      currencyId: "rub",
      orderAmount: "80.00",
      destination: {
        address: "Main Street",
        region: "North",
        pickupPointId: "point-3",
        coordinates: { latitude: 1, longitude: 2 },
      },
    };
    ecommerce.order.ordersToBillingModulePaymentIntents.find.mockResolvedValue([
      {
        orderId: "order",
        billingModulePaymentIntentId: "intent",
        orderLineId: "line",
        purchaseSnapshot: {
          ...common,
          amount: "65",
          charge: { productId: "product", quantity: 1, role: "product" },
        },
      },
      {
        orderId: "order",
        billingModulePaymentIntentId: "intent",
        orderLineId: "shipping",
        purchaseSnapshot: {
          ...common,
          amount: "15",
          charge: {
            productId: "courier",
            quantity: 1,
            role: "delivery",
            title: "Store pickup",
          },
        },
      },
      {
        orderId: "foreign",
        billingModulePaymentIntentId: "intent",
        purchaseSnapshot: {
          ...common,
          amount: "100",
          destination: { address: "Foreign address" },
        },
      },
    ]);
    ecommerce.order.paymentIntent.find.mockResolvedValue([
      {
        id: "intent",
        amount: 180,
        checkoutCurrencyId: "rub",
        status: "succeeded",
        checkoutMetadata: {
          email: "foreign@example.test",
          ecommerceModule: { orders: [{ id: "order" }, { id: "foreign" }] },
        },
      },
    ]);
    service.module.subjectsToEcommerceModuleOrders.find.mockResolvedValue([
      { subjectId, ecommerceModuleOrderId: "order" },
      { subjectId: "other", ecommerceModuleOrderId: "foreign" },
    ]);
    const result = await reader.execute({
      subjectId,
      ownedHistoryOrderIds: ["order"],
      requestedOrderId: "order",
    });
    expect(result.get("order")?.checkout).toEqual({
      delivery: [
        {
          address: "Main Street",
          region: "North",
          pickupPointId: "point-3",
          method: "Store pickup",
          price: { amount: 15, symbol: "₽", precision: 2 },
        },
      ],
      total: { amount: 80, symbol: "₽", precision: 2 },
    });
    expect(
      result.get("order")?.lines.map((item) => item.price?.amount),
    ).toEqual([65, 15]);
  });

  it("recovers deleted lines from their own saved checkout and delivery charge", async () => {
    const { reader, ecommerce, service } = fixture();
    ecommerce.ordersToProducts.find.mockResolvedValue([]);
    const saved = {
      id: "missing",
      orderId: "order",
      productId: "print",
      quantity: 3,
      products: [
        {
          id: "print",
          title: { en: "Early print" },
          productsToAttributes: [
            {
              attributes: [
                {
                  number: "0.10",
                  attributesKeysToAttributes: [
                    { attributeKey: { type: "price" } },
                  ],
                  attributesToBillingModuleCurrencies: [
                    { billingModuleCurrencyId: "rub" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    ecommerce.order.paymentIntent.find.mockResolvedValue([
      {
        id: "intent",
        status: "succeeded",
        amount: 500,
        checkoutCurrencyId: "rub",
        checkoutMetadata: {
          ecommerceModule: {
            orders: [
              {
                id: "order",
                ordersToProducts: [
                  saved,
                  { ...saved, id: "foreign-line", orderId: "sibling" },
                ],
              },
              { id: "sibling" },
            ],
          },
        },
      },
    ]);
    ecommerce.order.ordersToBillingModulePaymentIntents.find.mockResolvedValue([
      {
        billingModulePaymentIntentId: "intent",
        orderId: "order",
        orderLineId: "delivery",
        purchaseSnapshot: {
          currencyId: "rub",
          amount: "2",
          destination: { address: "Saved destination" },
          charge: {
            productId: "courier",
            title: "Courier",
            role: "delivery",
            quantity: 1,
          },
        },
      },
      {
        billingModulePaymentIntentId: "intent",
        orderId: "sibling",
        orderLineId: "private",
        purchaseSnapshot: {
          currencyId: "rub",
          amount: "100",
          charge: { productId: "foreign", quantity: 1 },
        },
      },
    ]);
    service.orderWork.publishedReceipts.mockResolvedValue([
      { id: "legacy", path: "/protected/legacy" },
    ]);
    ecommerce.order.work.statesForCustomer.mockResolvedValue([
      { orderId: "order", state: "paid" },
    ]);
    const result = (
      await reader.execute({
        subjectId,
        ownedHistoryOrderIds: ["order"],
        requestedOrderId: "order",
      })
    ).get("order");
    expect(result?.lines.map((line) => [line.id, line.price?.amount])).toEqual([
      ["missing", 0.3],
      ["delivery", 2],
    ]);
    expect(result?.lines[0]).toMatchObject({ title: { en: "Early print" } });
    expect(result?.checkout?.total?.amount).toBe(2.3);
    expect(result?.checkout?.delivery?.[0]).toMatchObject({
      method: "Courier",
      address: "Saved destination",
    });
    expect(result?.checkout?.receipts).toEqual([
      { id: "legacy", path: "/protected/legacy" },
    ]);
  });

  it.each([
    undefined,
    {
      ecommerceModule: {
        orders: [
          { id: "order", ordersToProducts: [{ id: "broken" }] },
          { id: "deleted-other" },
        ],
      },
    },
  ])(
    "omits a shared payment amount when only one link survives",
    async (checkoutMetadata) => {
      const { reader, ecommerce } = fixture();
      ecommerce.order.paymentIntent.find.mockResolvedValue([
        {
          id: "intent",
          amount: 195,
          checkoutCurrencyId: "rub",
          status: "succeeded",
          checkoutMetadata,
        },
      ]);
      ecommerce.order.ordersToBillingModulePaymentIntents.find.mockResolvedValue(
        [{ orderId: "order", billingModulePaymentIntentId: "intent" }],
      );
      const result = (
        await reader.execute({
          subjectId,
          ownedHistoryOrderIds: ["order"],
          requestedOrderId: "order",
        })
      ).get("order");
      expect(result?.checkout?.total).toBeUndefined();
      expect(result?.lines[0].price).toBeUndefined();
    },
  );

  it("reads the recorded provider and protected receipt for a purchase without fulfillment work", async () => {
    const { reader, service, ecommerce } = fixture();
    ecommerce.order.ordersToBillingModulePaymentIntents.find.mockResolvedValue([
      { orderId: "order", billingModulePaymentIntentId: "intent" },
    ]);
    service.modules.billing.paymentIntentsToInvoices.find.mockResolvedValue([
      { paymentIntentId: "intent", invoiceId: "invoice" },
    ]);
    service.modules.billing.invoice.find.mockResolvedValue([
      {
        id: "invoice",
        provider: "stripe",
        status: "paid",
        updatedAt: "2026-11-20T00:00:00Z",
      },
    ]);
    service.orderWork.publishedReceipts.mockResolvedValue([
      { id: "receipt", path: "/protected/receipt" },
    ]);
    const result = (
      await reader.execute({
        subjectId,
        ownedHistoryOrderIds: ["order"],
        requestedOrderId: "order",
      })
    ).get("order");
    expect(result?.checkout).toMatchObject({
      paymentProvider: "stripe",
      receipts: [{ id: "receipt", path: "/protected/receipt" }],
    });
    expect(result?.checkout?.paidAt).toBeUndefined();
  });

  it("returns the service state for both the history list and the selected order", async () => {
    const { reader, ecommerce } = fixture();
    ecommerce.order.work.statesForCustomer.mockResolvedValue([
      { orderId: "order", state: "awaiting-result" },
    ]);
    for (const requestedOrderId of [undefined, "order"]) {
      const result = await reader.execute({
        subjectId,
        ownedHistoryOrderIds: ["order", "old"],
        requestedOrderId,
      });
      expect(ecommerce.order.work.statesForCustomer).toHaveBeenCalledWith(
        subjectId,
        ["order", "old"],
      );
      expect(result.get("order")?.workState).toBe("awaiting-result");
      expect(result.get("old")?.workState).toBeUndefined();
    }
  });

  it("returns only the identifiers of the authorized task thread", async () => {
    const { reader, service } = fixture();
    const details = await reader.execute({
      subjectId,
      ownedHistoryOrderIds: ["order"],
      requestedOrderId: "order",
    });
    expect(service.customerWork.discussionForOrder).toHaveBeenCalledWith({
      customerId: subjectId,
      orderId: "order",
    });
    expect(
      service.socialModuleChatLifecycleAssertSubjectOwnsChat,
    ).toHaveBeenCalledWith({ subjectId, socialModuleChatId: "chat" });
    expect(service.customerWork.assertChatAccess).toHaveBeenCalledWith({
      subjectId,
      chatId: "chat",
      threadId: "thread",
      edit: false,
    });
    expect(details.get("order")?.discussion).toEqual({
      chatId: "chat",
      threadId: "thread",
    });
  });

  it.each(["no task", "no membership", "no thread access"])(
    "keeps the order when there is %s",
    async (condition) => {
      const { reader, service, line } = fixture();
      if (condition === "no task") {
        service.customerWork.discussionForOrder.mockResolvedValue(undefined);
      } else if (condition === "no membership") {
        service.socialModuleChatLifecycleAssertSubjectOwnsChat.mockRejectedValue(
          new Error("Authorization error. Not a participant"),
        );
      } else {
        service.customerWork.assertChatAccess.mockRejectedValue(
          new Error("Not Found error. Unavailable"),
        );
      }
      const details = await reader.execute({
        subjectId,
        ownedHistoryOrderIds: ["order"],
        requestedOrderId: "order",
      });
      expect(details.get("order")).toEqual({
        lines: [
          {
            id: line.id,
            productId: line.productId,
            quantity: line.quantity,
            title: {},
          },
        ],
      });
    },
  );

  it("skips all dependent reads for an exact order outside the owned history", async () => {
    const { reader, service, ecommerce } = fixture();
    const result = await reader.execute({
      subjectId,
      ownedHistoryOrderIds: [],
      requestedOrderId: "foreign",
    });
    expect(result.size).toBe(0);
    expect(ecommerce.ordersToProducts.find).not.toHaveBeenCalled();
    expect(service.customerWork.discussionForOrder).not.toHaveBeenCalled();
  });
});
