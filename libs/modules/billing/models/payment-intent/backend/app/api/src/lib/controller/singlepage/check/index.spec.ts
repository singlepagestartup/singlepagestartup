/**
 * BDD Suite: Billing payment-intent initialization recovery.
 *
 * Given: a non-terminal payment intent may temporarily exist before its invoice relation.
 * When: the periodic payment-intent check processes the attempt.
 * Then: it preserves fresh work and fails stale orphaned attempts without throwing.
 */

const mockPaymentIntentUpdate = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  CLOUDPAYMENTS_API_SECRET: "",
  CLOUDPAYMENTS_PUBLIC_ID: "",
  RBAC_SECRET_KEY: "test-rbac-secret",
}));

jest.mock("@sps/backend-utils", () => ({
  getHttpErrorType: (error: Error) => ({
    details: error,
    message: error.message,
    status: 500,
  }),
}));

jest.mock("@sps/billing/models/invoice/sdk/server", () => ({
  api: {
    update: jest.fn(),
  },
}));

jest.mock("@sps/billing/models/payment-intent/sdk/server", () => ({
  api: {
    update: (...args: unknown[]) => mockPaymentIntentUpdate(...args),
  },
}));

import {
  Handler,
  PAYMENT_INTENT_INITIALIZATION_GRACE_PERIOD_MS,
} from "./index";

describe("Given: a payment intent has no invoice relation yet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-30T10:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function createContext(updatedAt: string) {
    const paymentIntent = {
      id: "payment-intent-1",
      amount: 1,
      status: "requires_payment_method",
      type: "one_off",
      createdAt: updatedAt,
      updatedAt,
    };
    const service = {
      findById: jest.fn().mockResolvedValue(paymentIntent),
      billingModule: {
        paymentIntentsToInvoices: {
          find: jest.fn().mockResolvedValue([]),
        },
        invoice: {
          find: jest.fn(),
        },
      },
    };
    const context = {
      req: {
        param: jest.fn().mockReturnValue(paymentIntent.id),
        parseBody: jest.fn().mockResolvedValue({
          data: JSON.stringify({ check: true }),
        }),
      },
      json: jest.fn((payload) => payload),
    };

    return {
      context,
      paymentIntent,
      service,
    };
  }

  /**
   * BDD Scenario
   *
   * Given: invoice initialization started less than five minutes ago.
   * When: the payment-intent check runs.
   * Then: it returns the current intent without marking it failed.
   */
  it("Then: preserves a fresh payment intent", async () => {
    const { context, paymentIntent, service } = createContext(
      new Date(
        Date.now() - PAYMENT_INTENT_INITIALIZATION_GRACE_PERIOD_MS + 1,
      ).toISOString(),
    );

    await expect(
      new Handler(service as any).execute(context as any, undefined),
    ).resolves.toEqual({
      data: paymentIntent,
    });
    expect(mockPaymentIntentUpdate).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   *
   * Given: invoice initialization remained incomplete beyond five minutes.
   * When: the payment-intent check runs.
   * Then: it marks the orphaned intent failed instead of raising a recurring not-found error.
   */
  it("Then: fails a stale payment intent", async () => {
    const { context, paymentIntent, service } = createContext(
      new Date(
        Date.now() - PAYMENT_INTENT_INITIALIZATION_GRACE_PERIOD_MS - 1,
      ).toISOString(),
    );
    const failedPaymentIntent = {
      ...paymentIntent,
      status: "failed",
    };
    mockPaymentIntentUpdate.mockResolvedValue(failedPaymentIntent);

    await expect(
      new Handler(service as any).execute(context as any, undefined),
    ).resolves.toEqual({
      data: failedPaymentIntent,
    });
    expect(mockPaymentIntentUpdate).toHaveBeenCalledWith({
      id: paymentIntent.id,
      data: failedPaymentIntent,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      },
    });
  });
});
