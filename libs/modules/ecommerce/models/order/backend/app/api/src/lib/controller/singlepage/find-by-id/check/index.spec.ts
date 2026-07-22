/**
 * BDD Suite: Ecommerce subscription expiration checks.
 *
 * Given: a delivering subscription order has an interval configured by its product.
 * When: the order check runs after the interval deadline.
 * Then: the order advances to delivered so RBAC processing can renew it.
 */

const mockOrderUpdate = jest.fn();

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

import { Handler } from "./index";

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
   * Given: a delivering order was last updated more than one hour ago and has no newer invoice.
   * When: the periodic order check processes it.
   * Then: it marks the order delivered for the renewal processor.
   */
  it("Then: marks the order delivered after one hour", async () => {
    const order = {
      id: "order-1",
      status: "delivering",
      updatedAt: "2026-07-22T08:59:59.999Z",
    };
    const service = {
      findById: jest.fn().mockResolvedValue(order),
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

    expect(mockOrderUpdate).toHaveBeenCalledWith({
      id: "order-1",
      data: {
        ...order,
        status: "delivered",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      },
    });
  });
});
