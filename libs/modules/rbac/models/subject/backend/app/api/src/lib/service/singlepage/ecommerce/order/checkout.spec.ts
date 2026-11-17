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
const mockObserverChannelFind = jest.fn();
const mockObserverMessageFind = jest.fn();
const mockObserverMessageDelete = jest.fn();
const mockObserverFetch = jest.fn();
const mockObserverError = jest.fn();

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
    provider: (...args: unknown[]) =>
      mockBillingModulePaymentIntentProvider(...args),
  },
}));

jest.mock(
  "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/server",
  () => ({
    api: {
      delete: (...args: unknown[]) =>
        mockOrdersToBillingModulePaymentIntentsDelete(...args),
    },
  }),
);

jest.mock("@sps/broadcast/models/channel/sdk/server", () => ({
  api: {
    pushMessage: (...args: unknown[]) =>
      mockBroadcastChannelPushMessage(...args),
    find: (...args: unknown[]) => mockObserverChannelFind(...args),
    messageFind: (...args: unknown[]) => mockObserverMessageFind(...args),
  },
}));

jest.mock("@sps/broadcast/models/message/sdk/server", () => ({
  api: { delete: (...args: unknown[]) => mockObserverMessageDelete(...args) },
}));

jest.mock("@sps/backend-utils", () => ({
  ...jest.requireActual("@sps/backend-utils"),
  fetchOutboundUrl: (...args: unknown[]) => mockObserverFetch(...args),
  getHttpErrorType: (error: Error) => ({ status: 500, message: error.message }),
  logger: { error: (...args: unknown[]) => mockObserverError(...args) },
}));

jest.mock(
  "@sps/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/update",
  () => ({
    Handler: class {
      async onPaymentStatusUpdated() {}
    },
  }),
);

import { Hono } from "hono";
import { Middleware as ObserverMiddleware } from "../../../../../../../../../../../../../middlewares/src/lib/observer";
import { Handler as OrderCheckHandler } from "@sps/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/find-by-id/check";
import { Service } from "./checkout";

function createTestContext(props?: {
  activeOrderProductId?: string;
  productType?: "subscription" | "one_off";
  productSlug?: string;
  activeOrderStatus?: string;
  activeOrderSettled?: boolean;
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
    status: props?.activeOrderStatus ?? "paid",
    comment: "",
  };

  const findById = jest.fn().mockResolvedValue(subject);

  const ecommerceModule = {
    order: {
      find: jest.fn().mockResolvedValue(checkoutOrders),
      lockForLifecycle: jest.fn(),
      update: jest.fn(async (input) => {
        const order = checkoutOrderById.get(input.id);
        if (order) {
          Object.assign(order, input.data);
        }
        await mockEcommerceOrderUpdate(input);
        return order;
      }),
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
              offerId: "offer-target",
              parentLineId: null,
              destination: {},
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
          kind: "digital",
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
        ...(interval
          ? [
              {
                id: "pta-interval",
                productId: "product-target",
                attributeId: "attribute-interval",
              },
            ]
          : []),
      ]),
    },
    attributeKeysToAttributes: {
      find: jest.fn().mockResolvedValue([
        {
          id: "aka-1",
          attributeId: "attribute-price-1",
          attributeKeyId: "attribute-key-price-1",
        },
        ...(interval
          ? [
              {
                id: "aka-interval",
                attributeId: "attribute-interval",
                attributeKeyId: "key-interval",
              },
            ]
          : []),
      ]),
    },
    attributeKey: {
      find: jest.fn().mockResolvedValue([
        {
          id: "attribute-key-price-1",
          type: "price",
        },
        ...(interval ? [{ id: "key-interval", type: "interval" }] : []),
      ]),
    },
    attribute: {
      find: jest.fn().mockResolvedValue([
        {
          id: "attribute-price-1",
          number: "100",
        },
        ...(interval
          ? [{ id: "attribute-interval", string: { en: interval } }]
          : []),
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
      create: jest.fn((input) =>
        mockOrdersToBillingModulePaymentIntentsCreate(input),
      ),
      lockOffers: jest.fn(),
      reserveCharges: jest.fn(async ({ paymentIntentId, lines }) => {
        for (const line of lines) {
          await mockOrdersToBillingModulePaymentIntentsCreate({
            data: {
              orderId: line.orderId,
              billingModulePaymentIntentId: paymentIntentId,
            },
          });
        }
      }),
    },
    store: {
      find: jest
        .fn()
        .mockResolvedValue([{ id: "store-1", title: { en: "Seller" } }]),
    },
    storesToProducts: {
      quoteMany: jest.fn(async (inputs) =>
        inputs.map((input) => ({
          offerId: input.offerId,
          productId: "product-target",
          storeId: "store-1",
          currencyId: input.currencyId,
          quantity: input.quantity,
          amount: "100",
          issues: [],
          currencyIds: [input.currencyId],
          serviceOptions: [],
          version: "v1",
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
          charges: [
            {
              offerId: input.offerId,
              productId: "product-target",
              storeId: "store-1",
              providerStoreId: "store-1",
              lineId: input.lineId,
              role: "product",
              recurrence: "each",
              quantity: input.quantity,
              stockQuantity: null,
              amount: "100",
              formula: "unit_price * quantity",
              formulaVersion: "v1",
              inputs: {},
            },
          ],
        })),
      ),
      quotesUnderLock: jest.fn(async (_inputs, previews) => previews),
    },
  } as any;

  const billingModule = {
    paymentIntent: {
      prepareCheckoutDispatch: jest.fn(),
      create: jest.fn((input) => mockBillingModulePaymentIntentCreate(input)),
      update: jest.fn((input) => mockBillingModulePaymentIntentUpdate(input)),
      find: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({
        id: "payment-intent-1",
        status: "requires_payment_method",
      }),
      failUnpaidIntent: jest.fn(async (id, status) =>
        mockBillingModulePaymentIntentUpdate({
          id,
          data: { status: "failed" },
        }),
      ),
    },
    currency: {
      find: jest
        .fn()
        .mockResolvedValue(
          [
            ...new Set(
              checkoutOrders.map(
                (order) => props?.currencyByOrderId?.[order.id] ?? "currency-1",
              ),
            ),
          ].map((id) => ({ id, slug: "usd", symbol: "$" })),
        ),
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
      ...checkoutOrders.map((order) => ({
        subjectId: subject.id,
        ecommerceModuleOrderId: order.id,
      })),
      {
        id: "stemo-1",
        subjectId: subject.id,
        ecommerceModuleOrderId: activeSubscriptionOrder.id,
      },
    ]),
  } as any;

  let transactionActive = false;
  const repository = {
    withSubjectLock: jest.fn(async (_scope, operation) => {
      if (transactionActive) {
        return operation();
      }
      const snapshot = structuredClone(checkoutOrders);
      transactionActive = true;
      try {
        return await operation();
      } catch (error) {
        for (const [index, order] of checkoutOrders.entries()) {
          Object.assign(order, snapshot[index]);
        }
        throw error;
      } finally {
        transactionActive = false;
      }
    }),
  };
  const service = new Service({
    repository,
    settledOrderIds: jest.fn(
      async ({ orderIds }) =>
        new Set(
          props?.activeOrderSettled &&
            orderIds.includes(activeSubscriptionOrder.id)
            ? [activeSubscriptionOrder.id]
            : [],
        ),
    ),
    findById,
    ecommerceModule,
    billingModule,
    subjectsToEcommerceModuleOrders,
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
    repository,
    transactionActive: () => transactionActive,
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

      expect(checkoutOrders[0]).toMatchObject({ type: "cart", status: "new" });
    });

    /**
     * BDD Scenario
     *
     * Given: a Telegram Star checkout attempts to buy a subscription product already active on the subject.
     * When: the checkout service evaluates active subscription products.
     * Then: checkout is rejected with the same validation error and the new checkout order returns to the cart.
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

      expect(checkoutOrders[0]).toMatchObject({ type: "cart", status: "new" });
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
    it("Then: a failed attempt leaves the previous subscription unchanged", async () => {
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

      expect(mockEcommerceOrderUpdate).not.toHaveBeenCalledWith(
        expect.objectContaining({ id: activeSubscriptionOrder.id }),
      );
      expect(checkoutOrders[0]).toMatchObject({ type: "cart", status: "new" });
    });
  });

  describe("When: provider integration fails", () => {
    /**
     * BDD Scenario
     *
     * Given: a validated cart is ready for payment.
     * When: the external payment provider rejects invoice creation.
     * Then: checkout preserves the pending order and payment intent for settlement.
     */
    it("Then: a provider timeout preserves the pending attempt for late settlement", async () => {
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

      expect(checkoutOrderUpdates).toHaveLength(1);
      expect(checkoutOrders[0]).toMatchObject({
        type: "history",
        status: "paying",
      });
      expect(mockBillingModulePaymentIntentUpdate).not.toHaveBeenCalled();

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
        productType: "one_off",
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
      productType: "one_off",
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
    it("Then: stale order ids are excluded from downstream processing", async () => {
      const { service, checkoutOrders } = createTestContext({
        activeOrderProductId: "product-other",
      });

      await service.execute({
        id: "subject-1",
        email: "subject@example.com",
        provider: "stripe",
        comment: "",
        ecommerceModule: {
          orders: [{ id: checkoutOrders[0].id }, { id: "deleted-order" }],
        },
      });

      expect(
        service.ecommerceModule.storesToProducts.quoteMany,
      ).toHaveBeenCalledTimes(1);
      expect(
        service.ecommerceModule.storesToProducts.quoteMany,
      ).toHaveBeenCalledWith([
        expect.objectContaining({ lineId: "otp-checkout-1" }),
      ]);
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
      expect(mockBroadcastChannelPushMessage).toHaveBeenCalledTimes(2);
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

      expect(mockBroadcastChannelPushMessage).toHaveBeenCalledTimes(3);

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

describe("Retrying a pending subscription", () => {
  beforeEach(() => jest.clearAllMocks());
  it("allows the same product when the original paying history has no settlement", async () => {
    const { service, checkoutOrders, activeSubscriptionOrder } =
      createTestContext({
        activeOrderProductId: "product-target",
        activeOrderStatus: "paying",
      });
    await expect(
      service.execute({
        id: "subject-1",
        provider: "stripe",
        email: "owner@example.test",
        ecommerceModule: { orders: [{ id: checkoutOrders[0].id }] },
      }),
    ).resolves.toHaveProperty("billingModule.invoices");
    expect(activeSubscriptionOrder.status).toBe("paying");
    expect(mockBillingModulePaymentIntentProvider).toHaveBeenCalledTimes(1);
  });
  it("still blocks the same product when a paying history has settled", async () => {
    const { service, checkoutOrders } = createTestContext({
      activeOrderProductId: "product-target",
      activeOrderStatus: "paying",
      activeOrderSettled: true,
    });
    await expect(
      service.execute({
        id: "subject-1",
        provider: "stripe",
        email: "owner@example.test",
        ecommerceModule: { orders: [{ id: checkoutOrders[0].id }] },
      }),
    ).rejects.toThrow("active subscription products");
    expect(mockBillingModulePaymentIntentProvider).not.toHaveBeenCalled();
    expect(checkoutOrders[0]).toMatchObject({ type: "cart", status: "new" });
  });
  it("does not overwrite a successful late settlement while compensating a provider timeout", async () => {
    const { service, checkoutOrders } = createTestContext({
      productType: "one_off",
      paymentIntentProviderError: new Error("timeout"),
    });
    mockBillingModulePaymentIntentProvider.mockImplementationOnce(async () => {
      Object.assign(checkoutOrders[0], { type: "history", status: "paid" });
      throw new Error("timeout");
    });
    await expect(
      service.execute({
        id: "subject-1",
        provider: "stripe",
        email: "owner@example.test",
        ecommerceModule: { orders: [{ id: checkoutOrders[0].id }] },
      }),
    ).rejects.toThrow("timeout");
    expect(checkoutOrders[0].status).toBe("paid");
    expect(mockBillingModulePaymentIntentUpdate).not.toHaveBeenCalled();
  });
});

it("rolls back the claimed cart when local payment preparation fails", async () => {
  jest.clearAllMocks();
  const { service, checkoutOrders, transactionActive } = createTestContext({
    productType: "one_off",
    paymentIntentCreateError: new Error("create-failed"),
  });
  mockBillingModulePaymentIntentCreate.mockImplementationOnce(async () => {
    expect(transactionActive()).toBe(true);
    expect(checkoutOrders[0]).toMatchObject({
      type: "history",
      status: "paying",
    });
    throw new Error("create-failed");
  });
  await expect(
    service.execute({
      id: "subject-1",
      provider: "stripe",
      email: "owner@example.test",
      ecommerceModule: { orders: checkoutOrders.map(({ id }) => ({ id })) },
    }),
  ).rejects.toThrow("create-failed");
  expect(checkoutOrders[0]).toMatchObject({ type: "cart", status: "new" });
  expect(mockBillingModulePaymentIntentProvider).not.toHaveBeenCalled();
  expect(mockBroadcastChannelPushMessage).not.toHaveBeenCalled();
});

it("keeps every committed history recoverable after a multi-currency provider failure", async () => {
  jest.clearAllMocks();
  const { service, checkoutOrders } = createTestContext({
    productType: "one_off",
    checkoutOrderIds: ["first", "second", "third"],
    currencyByOrderId: { first: "usd", second: "eur", third: "rub" },
  });
  const intents = new Map(
    ["first", "second", "third"].map((id) => [
      `intent-${id}`,
      { id: `intent-${id}`, amount: 100, status: "requires_payment_method" },
    ]),
  );
  let links: {
    id: string;
    orderId: string;
    billingModulePaymentIntentId: string;
  }[] = [];
  (
    service.billingModule.paymentIntentsToInvoices.find as jest.Mock
  ).mockResolvedValue([]);
  (
    service.billingModule.paymentIntent.findById as jest.Mock
  ).mockImplementation(async ({ id }) => intents.get(id));
  (
    service.billingModule.paymentIntent.failUnpaidIntent as jest.Mock
  ).mockImplementation(async (id) => {
    intents.get(id)!.status = "failed";
  });
  (
    service.ecommerceModule.ordersToBillingModulePaymentIntents
      .find as jest.Mock
  ).mockImplementation(async (query) => {
    const intentIds = query.params.filters.and.find(
      (filter) => filter.column === "billingModulePaymentIntentId",
    )?.value;
    return links.filter(
      (link) =>
        !intentIds || intentIds.includes(link.billingModulePaymentIntentId),
    );
  });
  const deleteLink = jest.fn(async ({ id }) => {
    links = links.filter((link) => link.id !== id);
  });
  service.ecommerceModule.ordersToBillingModulePaymentIntents.delete =
    deleteLink;
  for (const intent of intents.values()) {
    mockBillingModulePaymentIntentCreate.mockResolvedValueOnce(intent);
  }
  mockOrdersToBillingModulePaymentIntentsCreate.mockImplementation(
    async ({ data }) => {
      const link = { id: `link-${data.orderId}`, ...data };
      links.push(link);
      return link;
    },
  );
  mockBillingModulePaymentIntentProvider
    .mockResolvedValueOnce({})
    .mockRejectedValueOnce(new Error("second-timeout"));
  await expect(
    service.execute({
      id: "subject-1",
      provider: "stripe",
      email: "owner@example.test",
      ecommerceModule: { orders: checkoutOrders.map(({ id }) => ({ id })) },
    }),
  ).rejects.toThrow("second-timeout");
  expect(checkoutOrders[0]).toMatchObject({
    type: "history",
    status: "paying",
  });
  expect(checkoutOrders[1]).toMatchObject({
    type: "history",
    status: "paying",
  });
  expect(checkoutOrders[2]).toMatchObject({
    type: "history",
    status: "paying",
  });
  expect([...intents.values()].map((intent) => intent.status)).toEqual([
    "requires_payment_method",
    "requires_payment_method",
    "failed",
  ]);
  expect(deleteLink).not.toHaveBeenCalled();
  expect(links.map((link) => link.orderId)).toEqual([
    "first",
    "second",
    "third",
  ]);
});

it("validates every requested order before claiming any cart", async () => {
  jest.clearAllMocks();
  const { service, checkoutOrders } = createTestContext({
    productType: "one_off",
    checkoutOrderIds: ["first", "empty"],
  });
  (
    service.ecommerceModule.ordersToProducts.find as jest.Mock
  ).mockResolvedValue([
    {
      id: "line-first",
      orderId: "first",
      productId: "product-target",
      quantity: 1,
    },
  ]);
  await expect(
    service.execute({
      id: "subject-1",
      provider: "stripe",
      email: "owner@example.test",
      ecommerceModule: { orders: checkoutOrders.map(({ id }) => ({ id })) },
    }),
  ).rejects.toThrow("Every checkout order must have products");
  expect(mockEcommerceOrderUpdate).not.toHaveBeenCalled();
  expect(mockBillingModulePaymentIntentCreate).not.toHaveBeenCalled();
  expect(
    checkoutOrders.every(
      (order) => order.type === "cart" && order.status === "new",
    ),
  ).toBe(true);
});

it("creates a separate recurring intent for each subscription order", async () => {
  jest.clearAllMocks();
  const { service, checkoutOrders, transactionActive } = createTestContext({
    activeOrderProductId: "product-other",
    checkoutOrderIds: ["first", "second"],
    productType: "subscription",
  });
  mockBillingModulePaymentIntentCreate
    .mockResolvedValueOnce({ id: "first-intent", amount: 100 })
    .mockResolvedValueOnce({ id: "second-intent", amount: 100 });
  mockBillingModulePaymentIntentProvider.mockImplementation(async () => {
    expect(transactionActive()).toBe(false);
    return {};
  });
  await service.execute({
    id: "subject-1",
    provider: "stripe",
    email: "owner@example.test",
    ecommerceModule: { orders: checkoutOrders.map(({ id }) => ({ id })) },
  });
  expect(mockBillingModulePaymentIntentCreate).toHaveBeenCalledTimes(2);
  expect(mockBillingModulePaymentIntentUpdate).not.toHaveBeenCalled();
  expect(mockOrdersToBillingModulePaymentIntentsCreate.mock.calls).toEqual([
    [
      {
        data: {
          orderId: "first",
          billingModulePaymentIntentId: "first-intent",
        },
      },
    ],
    [
      {
        data: {
          orderId: "second",
          billingModulePaymentIntentId: "second-intent",
        },
      },
    ],
  ]);
  expect(mockBillingModulePaymentIntentProvider).toHaveBeenCalledTimes(2);
  expect(
    mockBillingModulePaymentIntentProvider.mock.calls.map(([input]) =>
      input.data.metadata.ecommerceModule.orders.map(
        (order: { id: string }) => order.id,
      ),
    ),
  ).toEqual([["first"], ["second"]]);
});

it("registers timeout recovery after commit and before calling the provider", async () => {
  jest.clearAllMocks();
  const { service, checkoutOrders, transactionActive } = createTestContext({
    productType: "one_off",
    paymentIntentProviderError: new Error("timeout"),
  });
  mockBroadcastChannelPushMessage.mockImplementation(async () => {
    expect(transactionActive()).toBe(false);
    return { ok: true };
  });
  await expect(
    service.execute({
      id: "subject-1",
      provider: "stripe",
      email: "owner@example.test",
      ecommerceModule: { orders: checkoutOrders.map(({ id }) => ({ id })) },
    }),
  ).rejects.toThrow("timeout");
  expect(mockBroadcastChannelPushMessage).toHaveBeenCalledTimes(3);
  expect(
    mockBroadcastChannelPushMessage.mock.invocationCallOrder[1],
  ).toBeLessThan(
    mockBillingModulePaymentIntentProvider.mock.invocationCallOrder[0],
  );
  expect(checkoutOrders[0]).toMatchObject({
    type: "history",
    status: "paying",
  });
});

it("fails every unexposed intent when recovery observer registration fails", async () => {
  jest.clearAllMocks();
  const { service, checkoutOrders } = createTestContext({
    productType: "one_off",
    checkoutOrderIds: ["first", "second"],
    currencyByOrderId: { first: "usd", second: "eur" },
  });
  mockBillingModulePaymentIntentCreate
    .mockResolvedValueOnce({ id: "first-intent", amount: 100 })
    .mockResolvedValueOnce({ id: "second-intent", amount: 100 });
  (
    service.billingModule.paymentIntent.findById as jest.Mock
  ).mockImplementation(async ({ id }) => ({
    id,
    status: "requires_payment_method",
  }));
  mockBroadcastChannelPushMessage.mockRejectedValueOnce(
    new Error("observer-failed"),
  );
  await expect(
    service.execute({
      id: "subject-1",
      provider: "stripe",
      email: "owner@example.test",
      ecommerceModule: { orders: checkoutOrders.map(({ id }) => ({ id })) },
    }),
  ).rejects.toThrow("observer-failed");
  expect(mockBillingModulePaymentIntentProvider).not.toHaveBeenCalled();
  expect(mockBillingModulePaymentIntentUpdate.mock.calls).toEqual([
    [{ id: "first-intent", data: { status: "failed" } }],
    [{ id: "second-intent", data: { status: "failed" } }],
  ]);
  expect(checkoutOrders).toEqual([
    expect.objectContaining({ id: "first", type: "history", status: "paying" }),
    expect.objectContaining({
      id: "second",
      type: "history",
      status: "paying",
    }),
  ]);
});

it.each([
  { resume: false, paymentStatus: "succeeded", orderStatus: "paid" },
  { resume: false, paymentStatus: "failed", orderStatus: "canceling" },
  { resume: true, paymentStatus: "succeeded", orderStatus: "paid" },
])(
  "dispatches Subject fulfillment from a direct Order check, resume=$resume, payment=$paymentStatus",
  async ({ resume, paymentStatus, orderStatus }) => {
    jest.clearAllMocks();
    const { service, checkoutOrders, transactionActive } = createTestContext({
      productType: "one_off",
    });
    const order = checkoutOrders[0];
    if (resume) {
      (
        service.ecommerceModule.ordersToBillingModulePaymentIntents
          .find as jest.Mock
      ).mockResolvedValue([
        {
          id: "legacy-link",
          orderId: order.id,
          billingModulePaymentIntentId: "payment-intent-1",
        },
      ]);
      (service.billingModule.paymentIntent.find as jest.Mock).mockResolvedValue(
        [{ id: "payment-intent-1", status: "processing" }],
      );
      (service.billingModule.invoice.find as jest.Mock).mockResolvedValue([
        {
          id: "invoice-1",
          status: "open",
          provider: "paykeeper",
          paymentUrl: "https://pay.test/invoice-1",
        },
      ]);
    }
    await service.execute({
      id: "subject-1",
      provider: "stripe",
      email: "owner@example.test",
      ecommerceModule: { orders: [{ id: order.id }] },
    });
    const messages = mockBroadcastChannelPushMessage.mock.calls.map(
      ([input], index) => ({
        id: `observer-${index}`,
        payload: input.data.payload,
      }),
    );
    expect(
      messages.map((message) => JSON.parse(message.payload).trigger),
    ).toEqual([
      {
        type: "request",
        method: "POST",
        url: `http://localhost:4000/api/billing/payment-intents/${resume ? "paykeeper" : "stripe"}/webhook`,
      },
      {
        type: "request",
        method: "PATCH",
        url: `http://localhost:4000/api/ecommerce/orders/${order.id}`,
      },
      {
        type: "request",
        method: "POST",
        url: `http://localhost:4000/api/ecommerce/orders/${order.id}/check`,
      },
    ]);
    if (resume) {
      expect(mockBillingModulePaymentIntentProvider).not.toHaveBeenCalled();
      expect(mockBillingModulePaymentIntentCreate).not.toHaveBeenCalled();
    }
    mockObserverChannelFind.mockResolvedValue([{ id: "observer-channel" }]);
    mockObserverMessageFind.mockResolvedValue(messages);
    let completePipeline!: () => void;
    const pipelineCompleted = new Promise<void>((resolve) => {
      completePipeline = resolve;
    });
    mockObserverMessageDelete.mockImplementation(async () => {
      completePipeline();
      return {};
    });
    const subjectFulfillment = jest.fn(async () => {
      expect(transactionActive()).toBe(false);
      expect(order.status).toBe(orderStatus);
    });
    const app = new Hono();
    app.use(new ObserverMiddleware().init());
    app.post("/api/rbac/subjects/subject-1/check", async (context) => {
      await subjectFulfillment();
      return context.json({ data: { ok: true } });
    });
    const check = new OrderCheckHandler({
      findById: async () => ({ ...order, updatedAt: new Date().toISOString() }),
      ordersToBillingModulePaymentIntents: {
        find: async () => [
          { billingModulePaymentIntentId: "payment-intent-1" },
        ],
      },
      billingModule: {
        paymentIntent: {
          prepareCheckoutDispatch: jest.fn(),
          findById: async () => ({
            id: "payment-intent-1",
            status: paymentStatus,
          }),
        },
      },
      completePaymentStatus: async () => {
        Object.assign(order, { status: "paid" });
        return { ...order };
      },
      transitionPaymentStatus: async () => {
        Object.assign(order, { status: "canceling" });
        return { ...order };
      },
    } as any);
    app.post("/api/ecommerce/orders/:uuid/check", (context, next) =>
      check.execute(context, next),
    );
    mockObserverFetch.mockImplementation((url, init) => app.request(url, init));
    const response = await app.request(
      `/api/ecommerce/orders/${order.id}/check`,
      { method: "POST" },
    );
    await pipelineCompleted;
    expect(response.status).toBe(200);
    expect(subjectFulfillment).toHaveBeenCalledTimes(1);
    expect(mockObserverFetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/rbac/subjects/subject-1/check",
      expect.objectContaining({
        method: "POST",
        headers: { "X-RBAC-SECRET-KEY": "test-rbac-secret" },
      }),
      { allowServiceOrigins: true },
    );
    expect(mockObserverMessageDelete).toHaveBeenCalledWith(
      expect.objectContaining({ id: "observer-2" }),
    );
    expect(mockEcommerceOrderUpdate).toHaveBeenCalledTimes(1);
    expect(mockObserverError).not.toHaveBeenCalled();
  },
);

it("fulfills through the webhook pipeline after an earlier pending check consumed its observer", async () => {
  jest.clearAllMocks();
  const { service, checkoutOrders } = createTestContext({
    productType: "one_off",
  });
  const order = checkoutOrders[0];
  await service.execute({
    id: "subject-1",
    provider: "stripe",
    email: "owner@example.test",
    ecommerceModule: { orders: [{ id: order.id }] },
  });
  let messages = mockBroadcastChannelPushMessage.mock.calls.map(
    ([input], index) => ({
      id: `observer-${index}`,
      payload: input.data.payload,
    }),
  );
  expect(
    JSON.parse(messages[0].payload).pipe.map(
      (step: { url: string }) => step.url,
    ),
  ).toEqual([
    `http://localhost:4000/api/ecommerce/orders/${order.id}/check`,
    "http://localhost:4000/api/rbac/subjects/subject-1/check",
  ]);
  mockObserverChannelFind.mockResolvedValue([{ id: "observer-channel" }]);
  mockObserverMessageFind.mockImplementation(async () => [...messages]);
  let earlyCheckComplete!: () => void;
  const earlyCheckCompleted = new Promise<void>((resolve) => {
    earlyCheckComplete = resolve;
  });
  let webhookComplete!: () => void;
  const webhookCompleted = new Promise<void>((resolve) => {
    webhookComplete = resolve;
  });
  let webhookStepCount = 0;
  mockObserverMessageDelete.mockImplementation(async ({ id }) => {
    messages = messages.filter((message) => message.id !== id);
    if (id === "observer-2") {
      earlyCheckComplete();
    }
    if (id === "observer-0") {
      webhookStepCount += 1;
      if (webhookStepCount === 2) {
        webhookComplete();
      }
    }
    return {};
  });
  let paymentStatus = "processing";
  const fulfillment = jest.fn();
  const subjectCheckStatuses: string[] = [];
  const app = new Hono();
  app.use(new ObserverMiddleware().init());
  app.post("/api/rbac/subjects/subject-1/check", (context) => {
    subjectCheckStatuses.push(order.status);
    if (order.status === "paid") {
      fulfillment();
    }
    return context.json({ data: { ok: true } });
  });
  const check = new OrderCheckHandler({
    findById: async () => ({ ...order, updatedAt: new Date().toISOString() }),
    ordersToBillingModulePaymentIntents: {
      find: async () => [{ billingModulePaymentIntentId: "payment-intent-1" }],
    },
    billingModule: {
      paymentIntent: {
        prepareCheckoutDispatch: jest.fn(),
        findById: async () => ({
          id: "payment-intent-1",
          status: paymentStatus,
        }),
      },
    },
    completePaymentStatus: async () => {
      Object.assign(order, { status: "paid" });
      return { ...order };
    },
  } as any);
  app.post("/api/ecommerce/orders/:uuid/check", (context, next) =>
    check.execute(context, next),
  );
  app.post("/api/billing/payment-intents/stripe/webhook", (context) =>
    context.json({ data: { ok: true } }),
  );
  mockObserverFetch.mockImplementation((url, init) => app.request(url, init));
  const early = await app.request(`/api/ecommerce/orders/${order.id}/check`, {
    method: "POST",
  });
  await earlyCheckCompleted;
  expect(early.status).toBe(200);
  expect(order.status).toBe("paying");
  expect(fulfillment).not.toHaveBeenCalled();
  expect(messages.map((message) => message.id)).toEqual([
    "observer-0",
    "observer-1",
  ]);
  paymentStatus = "succeeded";
  const webhook = await app.request(
    "/api/billing/payment-intents/stripe/webhook",
    { method: "POST" },
  );
  await webhookCompleted;
  expect(webhook.status).toBe(200);
  expect(order.status).toBe("paid");
  expect(subjectCheckStatuses).toEqual(["paying", "paid"]);
  expect(fulfillment).toHaveBeenCalledTimes(1);
  expect(mockEcommerceOrderUpdate).toHaveBeenCalledTimes(1);
  expect(mockObserverError).not.toHaveBeenCalled();
});
