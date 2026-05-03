/**
 * BDD Suite: ecommerce order checkout.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

const mockCheckoutAttributesByCurrency = jest.fn();
const mockCheckoutAttributes = jest.fn();
const mockEcommerceOrderUpdate = jest.fn();
const mockBillingModulePaymentIntentCreate = jest.fn();
const mockBillingModulePaymentIntentUpdate = jest.fn();
const mockBillingModulePaymentIntentProvider = jest.fn();
const mockOrdersToBillingModulePaymentIntentsCreate = jest.fn();
const mockOrdersToBillingModulePaymentIntentsDelete = jest.fn();
const mockBroadcastChannelPushMessage = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "test-rbac-secret",
  NEXT_PUBLIC_API_SERVICE_URL: "http://localhost:4000",
}));

jest.mock("@sps/ecommerce/models/order/sdk/server", () => ({
  api: {
    checkoutAttributesByCurrency: (...args: unknown[]) =>
      mockCheckoutAttributesByCurrency(...args),
    checkoutAttributes: (...args: unknown[]) => mockCheckoutAttributes(...args),
    update: (...args: unknown[]) => mockEcommerceOrderUpdate(...args),
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
  paymentIntentCreateError?: Error;
  paymentIntentProviderError?: Error;
  checkoutOrderIds?: string[];
  currencyByOrderId?: Record<string, string>;
}) {
  const activeOrderProductId = props?.activeOrderProductId ?? "product-target";
  const checkoutOrderIds = props?.checkoutOrderIds ?? ["order-checkout-1"];

  const subject = {
    id: "subject-1",
  };

  const checkoutOrders = checkoutOrderIds.map((id) => ({
    id,
    status: "new",
    comment: "",
  }));

  const checkoutOrderById = new Map(
    checkoutOrders.map((checkoutOrder) => [checkoutOrder.id, checkoutOrder]),
  );

  const activeSubscriptionOrder = {
    id: "order-active-1",
    status: "paying",
    comment: "",
  };

  const findById = jest.fn().mockResolvedValue(subject);

  const ecommerceModule = {
    order: {
      find: jest.fn().mockResolvedValue(checkoutOrders),
      findById: jest.fn().mockImplementation(({ id }: { id: string }) => {
        if (id === activeSubscriptionOrder.id) {
          return Promise.resolve(activeSubscriptionOrder);
        }

        return Promise.resolve(checkoutOrderById.get(id));
      }),
      findByIdCheckoutAttributesByCurrency: jest.fn().mockResolvedValue({
        amount: 100,
        type: "subscription",
        interval: "month",
      }),
      findByIdCheckoutAttributes: jest.fn().mockResolvedValue({
        type: "subscription",
        interval: "month",
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
          type: "subscription",
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
    paymentIntentsToInvoices: {
      find: jest.fn().mockResolvedValue([
        {
          id: "pitin-1",
          paymentIntentId: "payment-intent-1",
          invoiceId: "invoice-1",
        },
      ]),
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
    find: jest.fn().mockResolvedValue([
      {
        id: "stemo-1",
        subjectId: subject.id,
        ecommerceModuleOrderId: activeSubscriptionOrder.id,
      },
    ]),
  } as any;

  const service = new Service({
    findById,
    ecommerceModule,
    billingModule,
    subjectsToEcommerceModuleOrders,
  });

  mockCheckoutAttributesByCurrency.mockResolvedValue({
    amount: 100,
    type: "subscription",
    interval: "month",
  });
  mockCheckoutAttributes.mockResolvedValue({
    amount: 100,
    type: "subscription",
    interval: "month",
  });

  if (props?.paymentIntentCreateError) {
    mockBillingModulePaymentIntentCreate.mockRejectedValue(
      props.paymentIntentCreateError,
    );
  } else {
    mockBillingModulePaymentIntentCreate.mockResolvedValue({
      id: "payment-intent-1",
      amount: 100,
      interval: "month",
      type: "subscription",
    });
  }

  mockBillingModulePaymentIntentUpdate.mockResolvedValue({
    id: "payment-intent-1",
    amount: 200,
    interval: "month",
    type: "subscription",
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
  };
}

describe("Given: subject starts checkout for a subscription product", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
            status: "canceled",
          }),
        }),
      );
    });

    /**
     * BDD Scenario
     *
     * Given: a Telegram Star checkout attempts to buy a subscription product already active on the subject.
     * When: the checkout service evaluates active subscription products.
     * Then: checkout is rejected with the same validation error and the new checkout order is canceled.
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
            status: "canceled",
          }),
        }),
      );
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
    it("Then: checkout fails with provider error after payment-intent creation", async () => {
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

  describe("When: checkout completes successfully", () => {
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
