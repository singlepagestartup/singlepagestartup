/**
 * BDD Suite: Ecommerce order lifecycle recovery checks.
 *
 * Given: a current ecommerce order is processed by the periodic check.
 * When: payment initialization or subscription delivery reaches a lifecycle boundary.
 * Then: the order advances or recovers without remaining stuck.
 */

const mockOrderUpdate = jest.fn();
const mockOrderExpire = jest.fn();
const mockPaymentIntentUpdate = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "test-rbac-secret",
}));

jest.mock("@sps/backend-utils", () => ({
  getHttpErrorType: jest.fn(),
  logger: {
    error: jest.fn(),
  },
}));

jest.mock("@sps/ecommerce/models/order/sdk/server", () => ({
  api: {
    update: (...args: unknown[]) => mockOrderUpdate(...args),
  },
}));

jest.mock("@sps/billing/models/payment-intent/sdk/server", () => ({
  api: {
    update: (...args: unknown[]) => mockPaymentIntentUpdate(...args),
  },
}));

import { Handler, PAYMENT_INITIALIZATION_GRACE_PERIOD_MS } from "./index";

describe("Given: a delivering subscription with an hourly interval", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-22T10:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * BDD Scenario: the hourly subscription reaches its deadline.
   *
   * Given: a delivering order has a fixed hourly deadline and a recent unrelated update.
   * When: the periodic order check processes it.
   * Then: it marks the order delivered for the renewal processor.
   */
  it("Then: marks the order delivered at its fixed deadline", async () => {
    const order = {
      id: "order-1",
      status: "delivering",
      updatedAt: "2026-07-22T09:59:59.999Z",
      subscriptionPeriodEndsAt: "2026-07-22T09:59:59.999Z",
      subscriptionPeriodInvoiceId: "invoice-a",
    };
    const service = {
      findById: jest.fn().mockResolvedValue(order),
      expireSubscriptionPeriod: mockOrderExpire,
      findByIdCheckoutAttributesByCurrency: jest.fn().mockResolvedValue({
        amount: 1,
        type: "subscription",
        interval: "hour",
      }),
      ordersToBillingModuleCurrencies: {
        find: jest.fn().mockResolvedValue([
          {
            orderId: "order-1",
            billingModuleCurrencyId: "currency-telegram-star",
          },
        ]),
      },
      ordersToBillingModulePaymentIntents: {
        find: jest.fn().mockResolvedValue([]),
      },
      billingModule: {
        paymentIntent: {
          findById: jest.fn(),
        },
        paymentIntentsToInvoices: {
          find: jest.fn(),
        },
        invoice: {
          findById: jest.fn(),
        },
      },
    };
    const context = {
      req: {
        param: jest.fn().mockReturnValue("order-1"),
      },
      json: jest.fn((data) => data),
    };

    await new Handler(service as any).execute(context as any, undefined);

    expect(mockOrderExpire).toHaveBeenCalledWith({
      id: "order-1",
      expectedInvoiceId: "invoice-a",
      expectedEndsAt: "2026-07-22T09:59:59.999Z",
    });
  });
});

describe("Given: a paying order is waiting for payment initialization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-30T10:00:00.000Z"));
    mockOrderUpdate.mockResolvedValue({});
    mockPaymentIntentUpdate.mockResolvedValue({});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function createPayingContext(props: {
    updatedAt: string;
    orderToPaymentIntents?: any[];
    paymentIntents?: Record<string, any>;
    paymentIntentsToInvoices?: any[];
  }) {
    const order = {
      id: "order-paying-1",
      status: "paying",
      type: "history",
      updatedAt: props.updatedAt,
    };
    const paymentIntents = props.paymentIntents ?? {};
    const service = {
      findById: jest.fn().mockResolvedValue(order),
      expireSubscriptionPeriod: mockOrderExpire,
      findByIdCheckoutAttributesByCurrency: jest.fn(),
      ordersToBillingModuleCurrencies: {
        find: jest.fn().mockResolvedValue([]),
      },
      ordersToBillingModulePaymentIntents: {
        find: jest.fn().mockResolvedValue(props.orderToPaymentIntents ?? []),
      },
      billingModule: {
        paymentIntent: {
          findById: jest.fn().mockImplementation(({ id }: { id: string }) => {
            return Promise.resolve(paymentIntents[id]);
          }),
        },
        paymentIntentsToInvoices: {
          find: jest
            .fn()
            .mockResolvedValue(props.paymentIntentsToInvoices ?? []),
        },
        invoice: {
          findById: jest.fn(),
        },
      },
    };
    const context = {
      req: {
        param: jest.fn().mockReturnValue(order.id),
      },
      json: jest.fn((data) => data),
    };

    return {
      context,
      order,
      service,
    };
  }

  /**
   * BDD Scenario
   *
   * Given: checkout published paying less than five minutes ago and has not linked a payment intent yet.
   * When: the periodic order check runs during the initialization grace period.
   * Then: it leaves the order untouched so the in-flight checkout may finish.
   */
  it("Then: preserves a fresh paying order without relations", async () => {
    const { context, service } = createPayingContext({
      updatedAt: new Date(
        Date.now() - PAYMENT_INITIALIZATION_GRACE_PERIOD_MS + 1,
      ).toISOString(),
    });

    await new Handler(service as any).execute(context as any, undefined);

    expect(mockOrderUpdate).not.toHaveBeenCalled();
    expect(mockPaymentIntentUpdate).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   *
   * Given: checkout linked a pending payment intent but no invoice before the grace period expired.
   * When: the periodic order check performs recovery.
   * Then: it fails the payment intent and moves the order to cancellation.
   */
  it("Then: cancels a stale paying order whose payment intent has no invoice", async () => {
    const paymentIntent = {
      id: "payment-intent-1",
      status: "requires_payment_method",
      updatedAt: "2026-07-30T09:00:00.000Z",
    };
    const { context, order, service } = createPayingContext({
      updatedAt: new Date(
        Date.now() - PAYMENT_INITIALIZATION_GRACE_PERIOD_MS - 1,
      ).toISOString(),
      orderToPaymentIntents: [
        {
          orderId: "order-paying-1",
          billingModulePaymentIntentId: paymentIntent.id,
        },
      ],
      paymentIntents: {
        [paymentIntent.id]: paymentIntent,
      },
      paymentIntentsToInvoices: [],
    });

    await new Handler(service as any).execute(context as any, undefined);

    expect(mockPaymentIntentUpdate).toHaveBeenCalledWith({
      id: paymentIntent.id,
      data: {
        ...paymentIntent,
        status: "failed",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      },
    });
    expect(mockOrderUpdate).toHaveBeenCalledWith({
      id: order.id,
      data: {
        ...order,
        status: "canceling",
        type: "history",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      },
    });
  });
});

describe("fixed subscription deadline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-23T10:00:00Z"));
  });
  afterEach(() => jest.useRealTimers());
  async function check(input: any) {
    const order = { subscriptionPeriodInvoiceId: "invoice-a", ...input };
    const service = {
      findById: jest.fn().mockResolvedValue(order),
      expireSubscriptionPeriod: mockOrderExpire,
      ordersToBillingModuleCurrencies: {
        find: jest.fn().mockResolvedValue([]),
      },
      ordersToBillingModulePaymentIntents: {
        find: jest.fn().mockResolvedValue([{ id: "open-renewal" }]),
      },
    };
    await new Handler(service as any).execute(
      { req: { param: () => order.id }, json: (data: unknown) => data } as any,
      undefined,
    );
    return service;
  }
  it("expires exactly at endsAt despite a recent unrelated update or an OPEN renewal", async () => {
    const order = {
      id: "fixed",
      status: "delivering",
      type: "history",
      updatedAt: new Date(),
      subscriptionPeriodEndsAt: new Date(),
    };
    const service = await check(order);
    expect(mockOrderExpire).toHaveBeenCalledWith({
      id: "fixed",
      expectedInvoiceId: "invoice-a",
      expectedEndsAt: new Date().toISOString(),
    });
    expect(
      service.ordersToBillingModulePaymentIntents.find,
    ).not.toHaveBeenCalled();
  });
  it("retains requested cancellation until the original deadline", async () => {
    await check({
      id: "fixed",
      status: "requested_cancelation",
      subscriptionPeriodEndsAt: new Date(Date.now() + 1),
    });
    expect(mockOrderExpire).not.toHaveBeenCalled();
    await check({
      id: "fixed",
      status: "requested_cancelation",
      subscriptionPeriodEndsAt: new Date(),
    });
    expect(mockOrderExpire).toHaveBeenCalledWith({
      id: "fixed",
      expectedInvoiceId: "invoice-a",
      expectedEndsAt: new Date().toISOString(),
    });
  });
  it("leaves legacy rows for explicit verified freeze instead of deriving a new mutable clock", async () => {
    await check({
      id: "legacy",
      status: "delivering",
      updatedAt: "2020-01-01T00:00:00Z",
      subscriptionPeriodEndsAt: null,
    });
    expect(mockOrderExpire).not.toHaveBeenCalled();
  });
});
