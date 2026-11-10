/**
 * BDD Suite: Billing payment-intent initialization recovery.
 *
 * Given: a non-terminal payment intent may temporarily exist before its invoice relation.
 * When: the periodic payment-intent check processes the attempt.
 * Then: it preserves fresh work and fails stale orphaned attempts without throwing.
 */

const mockPaymentIntentUpdate = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  CLOUDPAYMENTS_API_SECRET: "fixture-secret",
  CLOUDPAYMENTS_PUBLIC_ID: "fixture-public",
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
      failUninitializedPaymentIntent: mockPaymentIntentUpdate,
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
    expect(mockPaymentIntentUpdate).toHaveBeenCalledWith(
      paymentIntent.id,
      new Date(Date.now() - PAYMENT_INTENT_INITIALIZATION_GRACE_PERIOD_MS),
    );
  });
});

describe("CloudPayments reconciliation", () => {
  afterEach(() => jest.restoreAllMocks());

  it.each(["Completed", "Declined", "Authorized"])(
    "only settles a completed incoming transaction (%s)",
    async (status) => {
      const entity = {
        id: "intent-1",
        status: "requires_payment_method",
        amount: 100,
      };
      const invoice = {
        id: "invoice-1",
        provider: "cloudpayments",
        providerId: "456",
        amount: 100,
        status: "open",
        createdAt: new Date(Date.now() - 2 * 86400000),
      };
      const service = {
        findById: jest.fn(async () => entity),
        settlePayment: jest.fn(async () => {
          entity.status = "succeeded";
          return invoice;
        }),
        expireInvoice: jest.fn(),
        billingModule: {
          paymentIntentsToInvoices: {
            find: jest.fn().mockResolvedValue([{ invoiceId: invoice.id }]),
          },
          invoice: { find: jest.fn().mockResolvedValue([invoice]) },
        },
      };
      jest.spyOn(globalThis, "fetch").mockResolvedValue({
        json: async () => ({
          Model: [
            {
              JsonData: JSON.stringify({ invoiceId: invoice.id }),
              Status: status,
              Type: 0,
              Refunded: false,
              Amount: 100,
            },
          ],
        }),
      } as any);
      const context = {
        req: {
          param: () => entity.id,
          parseBody: async () => ({ data: "{}" }),
        },
        json: (value: unknown) => value,
      };
      const result = await new Handler(service as any).execute(
        context as any,
        undefined,
      );
      if (status === "Completed") {
        expect(service.settlePayment).toHaveBeenCalledWith({
          invoiceId: invoice.id,
          provider: "cloudpayments",
          providerId: "456",
          amount: 100,
        });
        expect(service.expireInvoice).not.toHaveBeenCalled();
        expect(result).toEqual({
          data: expect.objectContaining({ status: "succeeded" }),
        });
      } else {
        expect(service.settlePayment).not.toHaveBeenCalled();
        expect(service.expireInvoice).toHaveBeenCalled();
      }
    },
  );
});
