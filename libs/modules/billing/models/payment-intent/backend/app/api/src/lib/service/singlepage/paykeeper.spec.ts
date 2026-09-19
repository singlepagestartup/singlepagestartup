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
    key: "provider-key",
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

function webhookProps(overrides: Record<string, unknown> = {}) {
  return {
    action: "webhook" as const,
    data: webhookData(overrides),
    rawBody: "",
    headers: {},
    callback: jest.fn().mockResolvedValue({ ok: true }),
  };
}

describe("PayKeeper webhook identifiers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario
   * Given: PayKeeper posts an orderid that is not a canonical uuid.
   * When: the webhook is processed.
   * Then: the service answers a validation error and never queries the relation.
   */
  it("refuses a non-uuid orderid before the relation is queried", async () => {
    await expect(
      new Service().proceed(webhookProps({ orderid: "not-a-uuid" })),
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
      new Service().proceed(webhookProps({ id: { value: "301" } })),
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

    await expect(new Service().proceed(webhookProps())).rejects.toThrow(
      "Not Found error. Payment intent to invoice relation not found",
    );

    expect(mockedPaymentIntentToInvoiceFind).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "paymentIntentId",
              method: "eq",
              value: paymentIntentId,
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
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
    const invoice = {
      id: "invoice-1",
      amount: 0,
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
        }),
    } as any);

    mockedPaymentIntentToInvoiceFind.mockResolvedValue([
      { id: "relation-1", paymentIntentId, invoiceId: "invoice-1" },
    ]);
    mockedInvoiceFindById.mockResolvedValue(invoice);
    mockedInvoiceUpdate.mockResolvedValue(updatedInvoice);

    await expect(new Service().proceed(props)).resolves.toEqual({ ok: true });

    expect(mockedInvoiceUpdate).toHaveBeenCalledWith({
      id: "invoice-1",
      data: expect.objectContaining({
        amount: 100,
        status: "paid",
      }),
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
      },
    });
    expect(props.callback).toHaveBeenCalledWith({ invoice: updatedInvoice });

    fetchSpy.mockRestore();
  });
});
