import { createHash } from "node:crypto";
/**
 * BDD Suite: PayKeeper webhook identifier validation.
 *
 * Given: PayKeeper posts a notification whose identifiers are unvalidated external input.
 * When: the billing PayKeeper service processes the webhook.
 * Then: it rejects unusable identifiers before any lookup and keeps the existing flow for canonical ones.
 */

jest.mock("@sps/shared-utils", () => {
  const actual = jest.requireActual("@sps/shared-utils");

  return {
    ...actual,
    RBAC_SECRET_KEY: "rbac-secret",
    PAYKEEPER_BASE_URL: "https://paykeeper.test",
    PAYKEEPER_API_LOGIN: "paykeeper-login",
    PAYKEEPER_API_PASSWORD: "paykeeper-password",
    PAYKEEPER_WEBHOOK_SECRET: "paykeeper-webhook-secret",
  };
});

jest.mock("@sps/billing/models/invoice/sdk/server", () => {
  return {
    api: {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    },
  };
});

jest.mock(
  "@sps/billing/relations/payment-intents-to-invoices/sdk/server",
  () => {
    return {
      api: {
        create: jest.fn(),
        find: jest.fn(),
      },
    };
  },
);

import { Service } from "./paykeeper";
import { api as invoiceApi } from "@sps/billing/models/invoice/sdk/server";
import { api as paymentIntentsToInvoicesApi } from "@sps/billing/relations/payment-intents-to-invoices/sdk/server";

const mockedInvoiceFindById = invoiceApi.findById as jest.Mock;
const mockedInvoiceUpdate = invoiceApi.update as jest.Mock;
const mockedPaymentIntentToInvoiceFind =
  paymentIntentsToInvoicesApi.find as jest.Mock;

const paymentIntentId = "8f1c0d4e-0b24-4f8c-9a9f-2cf0d3c1a111";

function webhookData(overrides: Record<string, unknown> = {}) {
  return {
    id: "301",
    sum: "100.00",
    clientid: "",
    orderid: paymentIntentId,
    key: "",
    pk_hostname: "paykeeper.test",
    ps_id: "ps-1",
    client_email: "client@example.com",
    client_phone: "",
    service_name: "service",
    fop_receipt_key: "",
    obtain_datetime: "2026-08-24 11:30:50",
    ...overrides,
  } as any;
}

function signedData(overrides: Record<string, unknown> = {}) {
  const data = webhookData(overrides);
  data.key = createHash("md5")
    .update(
      `${data.id}${data.sum}${data.clientid}${data.orderid}paykeeper-webhook-secret`,
    )
    .digest("hex");
  return data;
}
const dependencies = {
  billingModule: {
    paymentIntentsToInvoices: {
      find: (...args: unknown[]) => mockedPaymentIntentToInvoiceFind(...args),
    },
    invoice: {
      findById: (...args: unknown[]) => mockedInvoiceFindById(...args),
    },
  },
  settle: jest.fn().mockResolvedValue(undefined),
};
function service() {
  return new Service(dependencies as any);
}

function webhookProps(overrides: Record<string, unknown> = {}) {
  return {
    action: "webhook" as const,
    data: signedData(overrides),
    rawBody: "",
    headers: {},
    callback: jest.fn().mockResolvedValue({ ok: true }),
  };
}

describe("PayKeeper webhook identifiers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    dependencies.settle.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("refuses a non-RUB checkout before creating an invoice", async () => {
    await expect(
      service().proceed({
        action: "create",
        currency: "usd",
        entity: { id: paymentIntentId, amount: 100 } as any,
        email: "fixture@example.invalid",
        metadata: { paymentIntentId },
      }),
    ).rejects.toThrow("Validation error. PayKeeper supports RUB payments only");
    expect(invoiceApi.create).not.toHaveBeenCalled();
  });

  it.each([undefined, null, [], "malformed", 42])(
    "rejects an invalid webhook body (%p) without reading or updating an invoice",
    async (data) => {
      const props = { ...webhookProps(), data: data as any };
      const fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockRejectedValue(new Error("Unexpected provider call"));
      await expect(service().proceed(props)).rejects.toThrow(
        "Validation error. Invalid webhook payload",
      );
      expect(mockedPaymentIntentToInvoiceFind).not.toHaveBeenCalled();
      expect(mockedInvoiceFindById).not.toHaveBeenCalled();
      expect(mockedInvoiceUpdate).not.toHaveBeenCalled();
      expect(props.callback).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["orderid", ""],
    ["orderid", "%"],
    ["orderid", {}],
    ["sum", 100],
    ["clientid", []],
  ])(
    "rejects malformed %s before any relation lookup",
    async (field, value) => {
      await expect(
        service().proceed(webhookProps({ [field as string]: value })),
      ).rejects.toThrow(`Validation error. Invalid ${field}`);
      expect(mockedPaymentIntentToInvoiceFind).not.toHaveBeenCalled();
      expect(mockedInvoiceUpdate).not.toHaveBeenCalled();
    },
  );

  it("rejects an invalid signature before any lookup, provider call or settlement", async () => {
    const props = webhookProps();
    props.data.key = "0".repeat(32);
    const fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("Unexpected network"));
    await expect(service().proceed(props)).rejects.toThrow(
      "Permission error. Invalid PayKeeper webhook signature",
    );
    expect(mockedPaymentIntentToInvoiceFind).not.toHaveBeenCalled();
    expect(dependencies.settle).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: PayKeeper posts an orderid that is not a canonical uuid.
   * When: the webhook is processed.
   * Then: the service answers a validation error and never queries the relation.
   */
  it("refuses a non-uuid orderid before the relation is queried", async () => {
    await expect(
      service().proceed(webhookProps({ orderid: "not-a-uuid" })),
    ).rejects.toThrow("Validation error. Invalid orderid");

    expect(mockedPaymentIntentToInvoiceFind).not.toHaveBeenCalled();
    expect(mockedInvoiceFindById).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a caller sends a JSON body whose payment identifier is an object.
   * When: the webhook is processed.
   * Then: the service answers a validation error naming the field and never queries the relation.
   */
  it("refuses a payment identifier that is not a string", async () => {
    await expect(
      service().proceed(webhookProps({ id: { value: "301" } })),
    ).rejects.toThrow("Validation error. Invalid id");

    expect(mockedPaymentIntentToInvoiceFind).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: the orderid is a canonical uuid with no payment-intent relation row.
   * When: the webhook is processed.
   * Then: the relation is queried by exact equality and the existing not-found answer is kept.
   */
  it("answers not found for a canonical but unknown orderid", async () => {
    mockedPaymentIntentToInvoiceFind.mockResolvedValue([]);

    await expect(service().proceed(webhookProps())).rejects.toThrow(
      "Not Found error. Payment intent to invoice relation not found",
    );

    expect(mockedPaymentIntentToInvoiceFind).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            { column: "paymentIntentId", method: "eq", value: paymentIntentId },
          ],
        },
      },
    });
  });

  /**
   * BDD Scenario
   * Given: the orderid is a canonical uuid whose relation row points at a paid PayKeeper invoice.
   * When: the webhook is processed.
   * Then: the invoice is marked paid and the payment intent callback is called.
   */
  it("keeps the existing flow for a known orderid", async () => {
    const logSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const invoice = {
      id: "invoice-1",
      amount: 100,
      status: "open",
      provider: "paykeeper",
      providerId: "301",
    };
    const updatedInvoice = {
      ...invoice,
      amount: 100,
      status: "paid",
    };
    const props = webhookProps();
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      headers: { entries: () => [] },
      text: async () =>
        JSON.stringify({
          id: "301",
          status: "paid",
          pay_amount: "100.00",
          orderid: paymentIntentId,
          paymentid: "301",
          clientid: "",
        }),
    } as any);

    mockedPaymentIntentToInvoiceFind.mockResolvedValue([
      { id: "relation-1", paymentIntentId, invoiceId: "invoice-1" },
    ]);
    mockedInvoiceFindById.mockResolvedValue(invoice);
    mockedInvoiceUpdate.mockResolvedValue(updatedInvoice);

    await expect(service().proceed(props)).resolves.toEqual({
      ok: true,
      acknowledgment:
        "OK " +
        createHash("md5").update("301paykeeper-webhook-secret").digest("hex"),
    });

    expect(dependencies.settle).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceId: "invoice-1",
        providerId: "301",
        event: expect.objectContaining({
          id: "301",
          orderid: paymentIntentId,
          amountInMinorUnits: 10000,
        }),
      }),
    );
    expect(mockedInvoiceUpdate).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });
});
