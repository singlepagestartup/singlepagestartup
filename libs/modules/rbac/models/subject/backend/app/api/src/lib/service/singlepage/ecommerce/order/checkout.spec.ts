/**
 * BDD Suite: ecommerce order checkout.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

const mockCheckoutAttributesByCurrency = jest.fn();
const mockCheckoutAttributes = jest.fn();
const mockEcommerceOrderCheck = jest.fn();
const mockEcommerceOrderUpdate = jest.fn();
const mockBillingModulePaymentIntentCreate = jest.fn();
const mockBillingModulePaymentIntentUpdate = jest.fn();
const mockBillingModulePaymentIntentProvider = jest.fn();
const mockOrdersToBillingModulePaymentIntentsCreate = jest.fn();
const mockOrdersToBillingModulePaymentIntentsDelete = jest.fn();
const mockBroadcastChannelPushMessage = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "test-rbac-secret",
  NEXT_PUBLIC_API_SERVICE_URL: "http://localhost:4000",
  INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG: "free-subscription",
}));

jest.mock("@sps/ecommerce/models/order/sdk/server", () => ({
  api: {
    checkoutAttributesByCurrency: (...args: unknown[]) =>
      mockCheckoutAttributesByCurrency(...args),
    checkoutAttributes: (...args: unknown[]) => mockCheckoutAttributes(...args),
    update: (...args: unknown[]) => mockEcommerceOrderUpdate(...args),
    check: (...args: unknown[]) => mockEcommerceOrderCheck(...args),
  },
}));

jest.mock("@sps/billing/models/payment-intent/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) =>
      mockBillingModulePaymentIntentCreate(...args),
    update: (...args: unknown[]) =>
      mockBillingModulePaymentIntentUpdate(...args),
    provider: (...args: unknown[]) =>
      mockBillingModulePaymentIntentProvider(...args),
  },
}));

jest.mock(
  "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/server",
  () => ({
    api: {
      create: (...args: unknown[]) =>
        mockOrdersToBillingModulePaymentIntentsCreate(...args),
      delete: (...args: unknown[]) =>
        mockOrdersToBillingModulePaymentIntentsDelete(...args),
    },
  }),
);

jest.mock("@sps/broadcast/models/channel/sdk/server", () => ({
  api: {
    pushMessage: (...args: unknown[]) =>
      mockBroadcastChannelPushMessage(...args),
  },
}));

import { Service } from "./checkout";

function createTestContext(props?: {
  activeOrderProductId?: string;
  productType?: "subscription" | "one_off";
  productSlug?: string;
  activeOrderStatus?: string;
  paymentIntentCreateError?: Error;
  paymentIntentProviderError?: Error;
  checkoutOrderIds?: string[];
  currencyByOrderId?: Record<string, string>;
}) {
  const productType = props?.productType ?? "subscription";
  const interval = productType === "subscription" ? "month" : undefined;
  const activeOrderProductId = props?.activeOrderProductId ?? "product-target";
  const checkoutOrderIds = props?.checkoutOrderIds ?? ["order-checkout-1"];

  const subject = {
    id: "subject-1",
  };

  const checkoutOrders = checkoutOrderIds.map((id) => ({
    id,
    status: "new",
    type: "cart",
    comment: "",
  }));

  const checkoutOrderById = new Map(
    checkoutOrders.map((checkoutOrder) => [checkoutOrder.id, checkoutOrder]),
  );

  const activeSubscriptionOrder = {
    id: "order-active-1",
    status: props?.activeOrderStatus ?? "paying",
    comment: "",
  };

  const findById = jest.fn().mockResolvedValue(subject);

  const ecommerceModule = {
    order: {
      lockForLifecycle: jest.fn().mockResolvedValue(undefined),
      update: jest.fn(async ({ id, data }) => {
        const order = checkoutOrderById.get(id);
        if (order) {
          Object.assign(order, data);
        }
        await mockEcommerceOrderUpdate({ id, data });
        return order;
      }),
      find: jest.fn().mockResolvedValue(checkoutOrders),
      findById: jest.fn().mockImplementation(({ id }: { id: string }) => {
        if (id === activeSubscriptionOrder.id) {
          return Promise.resolve(activeSubscriptionOrder);
        }

        return Promise.resolve(checkoutOrderById.get(id));
      }),
      findByIdCheckoutAttributesByCurrency: jest.fn().mockResolvedValue({
        amount: 100,
        type: productType,
        interval,
      }),
      findByIdCheckoutAttributes: jest.fn().mockResolvedValue({
        type: productType,
        interval,
      }),
    },
    ordersToProducts: {
      find: jest.fn().mockImplementation((args?: any) => {
        const filters = args?.params?.filters?.and ?? [];
        const inArrayOrderIds = filters.find((filter: any) => {
          return filter.column === "orderId" && filter.method === "inArray";
        });
        const eqOrderId = filters.find((filter: any) => {
          return filter.column === "orderId" && filter.method === "eq";
        });

        if (inArrayOrderIds) {
          return Promise.resolve(
            checkoutOrders.map((checkoutOrder, index) => ({
              id: `otp-checkout-${index + 1}`,
              orderId: checkoutOrder.id,
              productId: "product-target",
              quantity: 1,
            })),
          );
        }

        if (eqOrderId?.value === activeSubscriptionOrder.id) {
          return Promise.resolve([
            {
              id: "otp-active-1",
              orderId: activeSubscriptionOrder.id,
              productId: activeOrderProductId,
              quantity: 1,
            },
          ]);
        }

        return Promise.resolve([]);
      }),
    },
    product: {
      find: jest.fn().mockResolvedValue([
        {
          id: "product-target",
          slug: props?.productSlug ?? "paid-product",
          type: productType,
        },
      ]),
    },
    productsToAttributes: {
      find: jest.fn().mockResolvedValue([
        {
          id: "pta-1",
          productId: "product-target",
          attributeId: "attribute-price-1",
        },
      ]),
    },
    attributeKeysToAttributes: {
      find: jest.fn().mockResolvedValue([
        {
          id: "aka-1",
          attributeId: "attribute-price-1",
          attributeKeyId: "attribute-key-price-1",
        },
      ]),
    },
    attributeKey: {
      find: jest.fn().mockResolvedValue([
        {
          id: "attribute-key-price-1",
          type: "price",
        },
      ]),
    },
    attribute: {
      find: jest.fn().mockResolvedValue([
        {
          id: "attribute-price-1",
          number: "100",
        },
      ]),
    },
    attributesToBillingModuleCurrencies: {
      find: jest.fn().mockResolvedValue([]),
    },
    ordersToBillingModuleCurrencies: {
      find: jest.fn().mockResolvedValue(
        checkoutOrders.map((checkoutOrder, index) => ({
          id: `otbc-${index + 1}`,
          orderId: checkoutOrder.id,
          billingModuleCurrencyId:
            props?.currencyByOrderId?.[checkoutOrder.id] ?? "currency-1",
        })),
      ),
    },
    ordersToBillingModulePaymentIntents: {
      find: jest.fn().mockResolvedValue([]),
    },
  } as any;

  const billingModule = {
    currency: {
      find: jest.fn().mockResolvedValue([]),
    },
    paymentIntent: {
      failUninitializedPaymentIntent: jest
        .fn()
        .mockResolvedValue({ status: "failed" }),
    },
    paymentIntentsToInvoices: {
      find: jest.fn(async (args) => {
        const byId = args?.params?.filters?.and?.some(
          (filter) => filter.method === "eq",
        );
        if (byId) {
          return [];
        }
        return [
          {
            id: "pitin-1",
            paymentIntentId: "payment-intent-1",
            invoiceId: "invoice-1",
          },
        ];
      }),
    },
    invoice: {
      find: jest.fn().mockResolvedValue([
        {
          id: "invoice-1",
          paymentUrl: "https://pay.test/invoice-1",
        },
      ]),
    },
  } as any;

  const subjectsToEcommerceModuleOrders = {
    find: jest.fn(async (args) => {
      if (
        args?.params?.filters?.and?.some(
          (filter) => filter.column === "ecommerceModuleOrderId",
        )
      ) {
        return checkoutOrders.map((order) => ({
          id: `owner-${order.id}`,
          profileId: "profile-a",
          ecommerceModuleOrderId: order.id,
        }));
      }
      return [
        {
          id: "stemo-1",
          profileId: "profile-a",
          ecommerceModuleOrderId: activeSubscriptionOrder.id,
        },
      ];
    }),
  } as any;

  let profileTransaction = false;
  const service = new Service({
    repository: {
      withProfileLock: jest.fn(async (_scope, operation) => {
        profileTransaction = true;
        try {
          return await operation();
        } finally {
          profileTransaction = false;
        }
      }),
    },
    findById,
    ecommerceModule,
    billingModule,
    socialModule: {
      profilesToEcommerceModuleOrders: subjectsToEcommerceModuleOrders,
    } as any,
    subjectsToBillingModulePaymentIntents: {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: "purchaser" }),
    } as any,
    resolveProfile: jest.fn().mockResolvedValue("profile-a"),
    assertAccess: jest.fn().mockResolvedValue(undefined),
  });

  mockCheckoutAttributesByCurrency.mockResolvedValue({
    amount: 100,
    type: productType,
    interval,
  });
  mockCheckoutAttributes.mockResolvedValue({
    amount: 100,
    type: productType,
    interval,
  });

  if (props?.paymentIntentCreateError) {
    mockBillingModulePaymentIntentCreate.mockRejectedValue(
      props.paymentIntentCreateError,
    );
  } else {
    mockBillingModulePaymentIntentCreate.mockResolvedValue({
      id: "payment-intent-1",
      amount: 100,
      interval,
      type: productType,
    });
  }

  mockBillingModulePaymentIntentUpdate.mockResolvedValue({
    id: "payment-intent-1",
    amount: 200,
    interval,
    type: productType,
  });

  if (props?.paymentIntentProviderError) {
    mockBillingModulePaymentIntentProvider.mockRejectedValue(
      props.paymentIntentProviderError,
    );
  } else {
    mockBillingModulePaymentIntentProvider.mockResolvedValue({});
  }

  mockOrdersToBillingModulePaymentIntentsCreate.mockResolvedValue({
    id: "otbmpi-1",
  });
  mockOrdersToBillingModulePaymentIntentsDelete.mockResolvedValue({
    id: "otbmpi-1",
  });
  mockBroadcastChannelPushMessage.mockResolvedValue({ ok: true });
  mockEcommerceOrderUpdate.mockResolvedValue({
    id: checkoutOrders[0]?.id ?? "order-checkout-1",
    status: "updated",
  });

  return {
    service,
    checkoutOrders,
    activeSubscriptionOrder,
    inProfileTransaction: () => profileTransaction,
  };
}

describe("Given: subject starts checkout for a product", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("Then: a one-off product can create a provider checkout", async () => {
    const { service, checkoutOrders } = createTestContext({
      productType: "one_off",
    });
    await expect(
      service.execute({
        id: "subject-1",
        email: "buyer@example.com",
        provider: "stripe",
        ecommerceModule: { orders: [{ id: checkoutOrders[0].id }] },
      }),
    ).resolves.toEqual({
      billingModule: {
        invoices: [
          {
            id: "invoice-1",
            paymentUrl: "https://pay.test/invoice-1",
          },
        ],
      },
    });
    expect(mockBillingModulePaymentIntentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "one_off" }),
      }),
    );
    expect(mockBillingModulePaymentIntentProvider).toHaveBeenCalledTimes(1);
  });

  it("Then: Initial Free remains restricted to authentication bootstrap", async () => {
    const { service, checkoutOrders } = createTestContext({
      productSlug: "free-subscription",
    });
    await expect(
      service.execute({
        id: "subject-1",
        email: "buyer@example.com",
        provider: "stripe",
        ecommerceModule: { orders: [{ id: checkoutOrders[0].id }] },
      }),
    ).rejects.toThrow(
      "Initial Free is available only through authentication bootstrap",
    );
    expect(mockBillingModulePaymentIntentProvider).not.toHaveBeenCalled();
  });

  describe("When: active subscription has the same product", () => {
    it("Then: checkout is rejected with active subscription validation error", async () => {
      const { service, checkoutOrders } = createTestContext({
        activeOrderProductId: "product-target",
      });

      await expect(
        service.execute({
          id: "subject-1",
          email: "subject@example.com",
          provider: "stripe",
          comment: "",
          ecommerceModule: {
            orders: [{ id: checkoutOrders[0].id }],
          },
        }),
      ).rejects.toThrow(
        "Validation error. Checking out order has active subscription products.",
      );

      expect(mockEcommerceOrderUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: checkoutOrders[0].id,
          data: expect.objectContaining({
            status: "new",
          }),
        }),
      );
    });

    /**
     * BDD Scenario
     *
     * Given: a Telegram Star checkout attempts to buy a subscription product already active on the subject.
     * When: the checkout service evaluates active subscription products.
     * Then: checkout is rejected with the same validation error and the cart remains available for retry after validation fails.
     */
    it("Then: telegram-star checkout is rejected with active subscription validation error", async () => {
      const { service, checkoutOrders } = createTestContext({
        activeOrderProductId: "product-target",
      });

      await expect(
        service.execute({
          id: "subject-1",
          account: "telegram-chat-1",
          provider: "telegram-star",
          comment: "",
          ecommerceModule: {
            orders: [{ id: checkoutOrders[0].id }],
          },
        }),
      ).rejects.toThrow(
        "Validation error. Checking out order has active subscription products.",
      );

      expect(mockEcommerceOrderUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: checkoutOrders[0].id,
          data: expect.objectContaining({
            status: "new",
          }),
        }),
      );
    });

    /**
     * BDD Scenario
     *
     * Given: an earlier checkout attempt left a subscription order in the new cart status.
     * When: the subject retries checkout for the same subscription product.
     * Then: the stale cart does not count as an active subscription and checkout continues.
     */
    it("Then: a stale new order does not block subscription checkout", async () => {
      const { service, checkoutOrders } = createTestContext({
        activeOrderProductId: "product-target",
        activeOrderStatus: "new",
      });

      await expect(
        service.execute({
          id: "subject-1",
          email: "subject@example.com",
          provider: "stripe",
          comment: "",
          ecommerceModule: {
            orders: [{ id: checkoutOrders[0].id }],
          },
        }),
      ).resolves.toEqual({
        billingModule: {
          invoices: [
            {
              id: "invoice-1",
              paymentUrl: "https://pay.test/invoice-1",
            },
          ],
        },
      });

      expect(
        service.ecommerceModule.order.findByIdCheckoutAttributes,
      ).not.toHaveBeenCalled();
      expect(mockBillingModulePaymentIntentProvider).toHaveBeenCalledTimes(1);
    });
  });

  describe("When: active subscription has another product", () => {
    it("Then: previous subscription moves to requested_cancelation and checkout continues", async () => {
      const { service, checkoutOrders, activeSubscriptionOrder } =
        createTestContext({
          activeOrderProductId: "product-other",
          paymentIntentCreateError: new Error("stop-after-check"),
        });

      await expect(
        service.execute({
          id: "subject-1",
          email: "subject@example.com",
          provider: "stripe",
          comment: "",
          ecommerceModule: {
            orders: [{ id: checkoutOrders[0].id }],
          },
        }),
      ).rejects.toThrow("stop-after-check");

      expect(mockEcommerceOrderUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: activeSubscriptionOrder.id,
          data: expect.objectContaining({
            status: "requested_cancelation",
          }),
        }),
      );
    });
  });

  describe("When: provider integration fails", () => {
    /**
     * BDD Scenario
     *
     * Given: a validated cart is ready for payment.
     * When: the external payment provider rejects invoice creation.
     * Then: checkout publishes paying first and preserves the claim after the provider is called.
     */
    it("Then: provider failure leaves the claimed order protected from late payment", async () => {
      const { service, checkoutOrders } = createTestContext({
        activeOrderProductId: "product-other",
        paymentIntentProviderError: new Error("provider-failure"),
      });

      await expect(
        service.execute({
          id: "subject-1",
          email: "subject@example.com",
          provider: "stripe",
          comment: "",
          ecommerceModule: {
            orders: [{ id: checkoutOrders[0].id }],
          },
        }),
      ).rejects.toThrow("provider-failure");

      expect(mockBillingModulePaymentIntentCreate).toHaveBeenCalled();
      expect(mockBillingModulePaymentIntentProvider).toHaveBeenCalled();

      const checkoutOrderUpdates = mockEcommerceOrderUpdate.mock.calls.filter(
        (call) => call?.[0]?.id === checkoutOrders[0].id,
      );

      expect(checkoutOrderUpdates).toEqual([
        [
          expect.objectContaining({
            data: expect.objectContaining({
              status: "paying",
              type: "history",
            }),
          }),
        ],
      ]);
      expect(
        service.billingModule.paymentIntent.failUninitializedPaymentIntent,
      ).not.toHaveBeenCalled();
      expect(checkoutOrders[0]).toMatchObject({
        status: "paying",
        type: "history",
      });

      const payingUpdateCall =
        mockEcommerceOrderUpdate.mock.invocationCallOrder[
          mockEcommerceOrderUpdate.mock.calls.findIndex(
            (call) => call?.[0]?.data?.status === "paying",
          )
        ];
      const providerCall =
        mockBillingModulePaymentIntentProvider.mock.invocationCallOrder[0];

      expect(payingUpdateCall).toBeLessThan(providerCall);
    });
  });

  describe("When: multiple checkout orders share currency and attributes", () => {
    it("Then: payment intents are aggregated via update instead of duplicate create", async () => {
      const { service, checkoutOrders } = createTestContext({
        activeOrderProductId: "product-other",
        checkoutOrderIds: ["order-checkout-1", "order-checkout-2"],
      });

      const result = await service.execute({
        id: "subject-1",
        email: "subject@example.com",
        provider: "stripe",
        comment: "",
        ecommerceModule: {
          orders: checkoutOrders.map((checkoutOrder) => ({
            id: checkoutOrder.id,
          })),
        },
      });

      expect(result.billingModule.invoices).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "invoice-1",
          }),
        ]),
      );
      expect(mockBillingModulePaymentIntentCreate).toHaveBeenCalledTimes(1);
      expect(mockBillingModulePaymentIntentUpdate).toHaveBeenCalledTimes(1);
      expect(
        mockOrdersToBillingModulePaymentIntentsCreate,
      ).toHaveBeenCalledTimes(2);
      expect(mockBillingModulePaymentIntentProvider).toHaveBeenCalledTimes(1);
    });
  });

  it("keeps different currencies in separate payments while combining matching orders", async () => {
    const { service, checkoutOrders } = createTestContext({
      activeOrderProductId: "product-other",
      checkoutOrderIds: ["usd-1", "rub-1", "usd-2"],
      currencyByOrderId: { "usd-1": "usd", "rub-1": "rub", "usd-2": "usd" },
    });
    mockBillingModulePaymentIntentCreate
      .mockResolvedValueOnce({ id: "payment-usd", amount: 100 })
      .mockResolvedValueOnce({ id: "payment-rub", amount: 100 });
    mockBillingModulePaymentIntentUpdate.mockResolvedValue({
      id: "payment-usd",
      amount: 200,
    });
    (
      service.billingModule.paymentIntentsToInvoices.find as jest.Mock
    ).mockResolvedValue([
      { paymentIntentId: "payment-usd", invoiceId: "invoice-usd" },
      { paymentIntentId: "payment-rub", invoiceId: "invoice-rub" },
    ]);
    const invoices = [
      { id: "invoice-usd", paymentUrl: "https://pay.test/usd" },
      { id: "invoice-rub", paymentUrl: "https://pay.test/rub" },
    ];
    (service.billingModule.invoice.find as jest.Mock).mockResolvedValue(
      invoices,
    );

    const result = await service.execute({
      id: "subject-1",
      email: "subject@example.com",
      provider: "stripe",
      comment: "",
      ecommerceModule: { orders: checkoutOrders.map(({ id }) => ({ id })) },
    });

    expect(mockBillingModulePaymentIntentCreate).toHaveBeenCalledTimes(2);
    expect(mockBillingModulePaymentIntentUpdate).toHaveBeenCalledTimes(1);
    expect(mockBillingModulePaymentIntentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "payment-usd",
        data: expect.objectContaining({ amount: 200 }),
      }),
    );
    expect(mockBillingModulePaymentIntentProvider).toHaveBeenCalledTimes(2);
    for (const currency of ["usd", "rub"]) {
      expect(mockBillingModulePaymentIntentProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          id: `payment-${currency}`,
          data: expect.objectContaining({
            provider: "stripe",
            currencyId: currency,
          }),
        }),
      );
    }
    expect(result.billingModule.invoices).toEqual(invoices);
  });

  describe("When: checkout payload contains a deleted order id", () => {
    /**
     * BDD Scenario
     *
     * Given: one requested order still exists and another was already deleted.
     * When: checkout resolves the requested orders.
     * Then: only the existing order participates in checkout.
     */
    it("Then: missing orders reject checkout before any product or payment change", async () => {
      const { service, checkoutOrders } = createTestContext({
        activeOrderProductId: "product-other",
      });
      await expect(
        service.execute({
          id: "subject-1",
          email: "subject@example.com",
          provider: "stripe",
          ecommerceModule: {
            orders: [{ id: checkoutOrders[0].id }, { id: "deleted-order" }],
          },
        }),
      ).rejects.toThrow("Every requested order");
      expect(
        service.ecommerceModule.order.findByIdCheckoutAttributesByCurrency,
      ).not.toHaveBeenCalled();
      expect(mockBillingModulePaymentIntentCreate).not.toHaveBeenCalled();
    });
  });

  describe("When: checkout completes successfully", () => {
    it("checks a settled free order after registering its subject observer", async () => {
      const { service, checkoutOrders } = createTestContext({
        activeOrderProductId: "product-other",
      });
      mockBillingModulePaymentIntentCreate.mockResolvedValueOnce({
        id: "free-intent",
        amount: 0,
      });
      const id = checkoutOrders[0].id;
      await service.execute({
        id: "subject-1",
        email: "subject@example.com",
        provider: "paykeeper",
        ecommerceModule: { orders: [{ id }] },
      });
      expect(mockBroadcastChannelPushMessage).toHaveBeenCalledTimes(1);
      expect(
        JSON.parse(
          mockBroadcastChannelPushMessage.mock.calls[0][0].data.payload,
        ).trigger.method,
      ).toBe("PATCH");
      expect(mockEcommerceOrderCheck).toHaveBeenCalledWith(
        expect.objectContaining({ id }),
      );
      expect(
        mockBroadcastChannelPushMessage.mock.invocationCallOrder[0],
      ).toBeLessThan(mockEcommerceOrderCheck.mock.invocationCallOrder[0]);
    });

    it("Then: observer messages are scheduled for webhook check and RBAC subject recheck", async () => {
      const { service, checkoutOrders } = createTestContext({
        activeOrderProductId: "product-other",
      });

      await service.execute({
        id: "subject-1",
        email: "subject@example.com",
        provider: "stripe",
        comment: "",
        ecommerceModule: {
          orders: [{ id: checkoutOrders[0].id }],
        },
      });

      expect(mockBroadcastChannelPushMessage).toHaveBeenCalledTimes(2);

      const firstMessagePayload = JSON.parse(
        mockBroadcastChannelPushMessage.mock.calls[0]?.[0]?.data?.payload,
      );
      const secondMessagePayload = JSON.parse(
        mockBroadcastChannelPushMessage.mock.calls[1]?.[0]?.data?.payload,
      );

      expect(firstMessagePayload.trigger.method).toBe("POST");
      expect(firstMessagePayload.trigger.url).toContain(
        "/api/billing/payment-intents/stripe/webhook",
      );
      expect(firstMessagePayload.pipe[0].url).toContain(
        `/api/ecommerce/orders/${checkoutOrders[0].id}/check`,
      );

      expect(secondMessagePayload.trigger.method).toBe("PATCH");
      expect(secondMessagePayload.trigger.url).toContain(
        `/api/ecommerce/orders/${checkoutOrders[0].id}`,
      );
      expect(secondMessagePayload.pipe[0].url).toContain(
        "/api/rbac/subjects/subject-1/check",
      );

      const hasPayingStatusUpdate = mockEcommerceOrderUpdate.mock.calls.some(
        (call) => call?.[0]?.data?.status === "paying",
      );

      expect(hasPayingStatusUpdate).toBe(true);
    });
  });
});

describe("Atomic checkout claims", () => {
  beforeEach(() => jest.clearAllMocks());
  it("commits the claim before provider I/O and rejects a second checkout while payment is pending", async () => {
    const f = createTestContext({ productType: "one_off" });
    let entered!: () => void;
    let release!: () => void;
    const called = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    mockBillingModulePaymentIntentProvider.mockImplementation(async () => {
      expect(f.inProfileTransaction()).toBe(false);
      expect(f.checkoutOrders[0]).toMatchObject({
        type: "history",
        status: "paying",
      });
      entered();
      await released;
      return {};
    });
    const props = {
      id: "subject-1",
      provider: "stripe",
      ecommerceModule: { orders: [{ id: f.checkoutOrders[0].id }] },
    };
    const first = f.service.execute(props);
    await called;
    await expect(f.service.execute(props)).rejects.toThrow(
      "no longer an open cart",
    );
    expect(mockBillingModulePaymentIntentProvider).toHaveBeenCalledTimes(1);
    release();
    await first;
  });

  it("keeps a claimed order protected when a provider succeeded before a later observer failure", async () => {
    const f = createTestContext({ productType: "one_off" });
    mockBroadcastChannelPushMessage.mockRejectedValueOnce(
      new Error("observer failure"),
    );
    await expect(
      f.service.execute({
        id: "subject-1",
        provider: "stripe",
        ecommerceModule: { orders: [{ id: f.checkoutOrders[0].id }] },
      }),
    ).rejects.toThrow("observer failure");
    expect(f.checkoutOrders[0]).toMatchObject({
      type: "history",
      status: "paying",
    });
    expect(
      f.service.billingModule.paymentIntent.failUninitializedPaymentIntent,
    ).not.toHaveBeenCalled();
  });

  it("restores a retryable cart after a failure before any provider request", async () => {
    const f = createTestContext({
      productType: "one_off",
      paymentIntentCreateError: new Error("intent unavailable"),
    });
    await expect(
      f.service.execute({
        id: "subject-1",
        provider: "stripe",
        ecommerceModule: { orders: [{ id: f.checkoutOrders[0].id }] },
      }),
    ).rejects.toThrow("intent unavailable");
    expect(mockBillingModulePaymentIntentProvider).not.toHaveBeenCalled();
    expect(f.checkoutOrders[0]).toMatchObject({ type: "cart", status: "new" });
  });
});
