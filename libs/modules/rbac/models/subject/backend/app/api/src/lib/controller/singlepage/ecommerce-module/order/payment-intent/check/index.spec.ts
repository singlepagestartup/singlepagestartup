import { Service as CheckPayment } from "../../../../../../service/singlepage/ecommerce/order/payment-check";
/**
 * BDD Suite: Billing payment-intent initialization recovery.
 *
 * Given: a non-terminal payment intent may temporarily exist before its invoice relation.
 * When: the periodic payment-intent check processes the attempt.
 * Then: it preserves fresh work and fails stale orphaned attempts without throwing.
 */

const mockPaymentIntentUpdate = jest.fn();
const mockPaymentIntentFind = jest.fn();

jest.mock(
  "@sps/billing/relations/payment-intents-to-invoices/sdk/server",
  () => ({
    api: {
      find: jest.fn(async () => [
        { paymentIntentId: "intent-1", invoiceId: "invoice-1" },
      ]),
    },
  }),
);

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  CLOUDPAYMENTS_API_SECRET: "test-secret",
  CLOUDPAYMENTS_PUBLIC_ID: "test-public",
  RBAC_SECRET_KEY: "test-rbac-secret",
}));

jest.mock("@sps/backend-utils", () => ({
  ...jest.requireActual("@sps/backend-utils"),
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
    find: (...args: unknown[]) => mockPaymentIntentFind(...args),
    update: (...args: unknown[]) => mockPaymentIntentUpdate(...args),
  },
}));

import { Service } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/service";
import { Service as InvoiceService } from "@sps/billing/models/invoice/backend/app/api/src/lib/service";
import { Handler } from "./index";
const PAYMENT_INTENT_INITIALIZATION_GRACE_PERIOD_MS = 5 * 60 * 1000;

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
      new Handler(
        new CheckPayment(service as any, { check: jest.fn() }),
      ).execute(context as any, undefined),
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
      new Handler(
        new CheckPayment(service as any, { check: jest.fn() }),
      ).execute(context as any, undefined),
    ).resolves.toEqual({
      data: failedPaymentIntent,
    });
    expect(mockPaymentIntentUpdate).toHaveBeenCalledWith(
      paymentIntent.id,
      new Date(Date.now() - PAYMENT_INTENT_INITIALIZATION_GRACE_PERIOD_MS),
    );
  });
});

describe("CloudPayments invoice reconciliation", () => {
  const checkedAt = new Date("2026-07-30T10:00:00Z");
  const createdAt = new Date("2026-07-29T09:00:00Z");
  const completed = {
    Status: "Completed",
    Amount: 125,
    JsonData: JSON.stringify({ invoiceId: "invoice-1" }),
    Type: 0,
    Refunded: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(checkedAt);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  function fixture(date = createdAt) {
    const intent = { id: "intent-1", status: "processing", amount: 125 };
    const invoice = {
      id: "invoice-1",
      status: "open",
      provider: "cloudpayments",
      providerId: "1234",
      amount: 125,
      createdAt: date,
    };
    const invoiceRepository = {
      lockForSettlement: jest.fn(),
      updateFirstByField: jest.fn(async (_field, _id, data) =>
        Object.assign(invoice, data),
      ),
      find: jest.fn(async () => [{ ...invoice }]),
      findFirstByField: jest.fn(async () => ({ ...invoice })),
      consumeFirstByField: jest.fn(async (_field, _id, data, predicate) => {
        if (predicate.and[0].value !== invoice.status) {
          return undefined;
        }
        return Object.assign(invoice, data);
      }),
    };
    const repository = {
      withPaymentIntentLock: jest.fn(async (_id, run) => run()),
      withPaymentIntentLocks: jest.fn(async (_ids, run) => run()),
      updateFirstByField: jest.fn(async (_field, _id, data) =>
        Object.assign(intent, data),
      ),
      findFirstByField: jest.fn(async () => ({ ...intent })),
      consumeFirstByField: jest.fn(async (_field, _id, data, predicate) => {
        if (predicate.and[0].value !== intent.status) {
          return undefined;
        }
        return Object.assign(intent, data);
      }),
    };
    const service = new Service(repository as any, {
      currency: {} as any,
      invoice: new InvoiceService(invoiceRepository as any),
      paymentIntentsToInvoices: {
        create: jest.fn(),
        find: jest
          .fn()
          .mockResolvedValue([
            { invoiceId: invoice.id, paymentIntentId: intent.id },
          ]),
        findById: jest.fn(),
      },
    });
    const settle = jest.spyOn(service, "settlePayment");
    const ctx = {
      req: { param: () => intent.id, parseBody: async () => ({ data: "{}" }) },
      json: (value: unknown) => value,
    };
    const handler = new Handler(
      new CheckPayment(service, { check: jest.fn() }),
    );
    const check = () => handler.execute(ctx as any, undefined);
    const provider = jest.spyOn(globalThis, "fetch");
    return { intent, invoice, settle, check, provider };
  }

  it("retains a confirmed payment for an invoice older than 24 hours and returns its final intent", async () => {
    const { intent, invoice, check, provider, settle } = fixture();
    provider.mockResolvedValue(
      Response.json({ Success: true, Model: [completed] }),
    );
    await expect(check()).resolves.toMatchObject({
      data: { status: "succeeded" },
    });
    expect(invoice.status).toBe("paid");
    expect(intent.status).toBe("succeeded");
    await check();
    expect(settle).toHaveBeenCalledTimes(1);
    expect(settle).toHaveBeenCalledWith({
      invoiceId: invoice.id,
      providerId: invoice.providerId,
      provider: "cloudpayments",
      amount: 125,
    });
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("fails an expired invoice and intent when the provider confirms there is no payment", async () => {
    const { intent, invoice, check, provider, settle } = fixture();
    provider.mockResolvedValue(Response.json({ Success: true, Model: [] }));
    await expect(check()).resolves.toMatchObject({
      data: { status: "failed" },
    });
    expect(invoice.status).toBe("failed");
    expect(intent.status).toBe("failed");
    expect(settle).not.toHaveBeenCalled();
  });

  it("includes payments completed the next UTC day and follows the next page", async () => {
    const { check, provider, invoice } = fixture();
    const unrelated = { ...completed, JsonData: '{"invoiceId":"unrelated"}' };
    provider
      .mockResolvedValueOnce(
        Response.json({ Success: true, Model: Array(100).fill(unrelated) }),
      )
      .mockResolvedValueOnce(
        Response.json({ Success: true, Model: [completed] }),
      );
    await expect(check()).resolves.toMatchObject({
      data: { status: "succeeded" },
    });
    expect(invoice.status).toBe("paid");
    const requests = provider.mock.calls.map(([url, options]) => ({
      url,
      ...JSON.parse(String(options?.body)),
    }));
    expect(requests).toEqual(
      [1, 2].map((page) =>
        expect.objectContaining({
          url: "https://api.cloudpayments.ru/v2/payments/list",
          PageNumber: page,
          CreatedDateGte: createdAt.toISOString(),
          CreatedDateLte: checkedAt.toISOString(),
        }),
      ),
    );
  });

  it("keeps a fresh invoice open when the payment is missing", async () => {
    const { check, provider, invoice } = fixture(checkedAt);
    provider.mockResolvedValue(Response.json({ Success: true, Model: [] }));
    await expect(check()).resolves.toMatchObject({
      data: { status: "processing" },
    });
    expect(invoice.status).toBe("open");
  });

  it("only settles a completed payment for this invoice", async () => {
    const { check, provider, settle, invoice } = fixture();
    provider.mockResolvedValue(
      Response.json({
        Success: true,
        Model: [
          { ...completed, Status: "Declined" },
          { ...completed, Type: 1 },
          { ...completed, Refunded: true },
          { ...completed, JsonData: '{"invoiceId":"another-invoice"}' },
        ],
      }),
    );
    await expect(check()).resolves.toMatchObject({
      data: { status: "failed" },
    });
    expect(invoice.status).toBe("failed");
    expect(settle).not.toHaveBeenCalled();
  });

  it.each([
    [503, { Success: false }],
    [200, { Success: false, Model: [] }],
    [200, { Success: true }],
  ])(
    "keeps an expired invoice retryable on an inconclusive provider response (%s)",
    async (status, body) => {
      const { check, provider, intent, invoice } = fixture();
      provider.mockResolvedValue(
        Response.json(body, { status: Number(status) }),
      );
      await expect(check()).rejects.toThrow("CloudPayments");
      expect(invoice.status).toBe("open");
      expect(intent.status).toBe("processing");
    },
  );

  it("preserves a concurrent webhook confirmation while the lookup is running", async () => {
    const { check, provider, intent, invoice } = fixture();
    provider.mockImplementation(async () => {
      invoice.status = "paid";
      intent.status = "succeeded";
      return Response.json({ Success: true, Model: [] });
    });
    await expect(check()).resolves.toMatchObject({
      data: { status: "succeeded" },
    });
    expect(invoice.status).toBe("paid");
  });
});
