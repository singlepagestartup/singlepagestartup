/**
 * BDD Suite: Telegram Star invoice lifecycle.
 *
 * Given: SPS creates Telegram Star invoices and Telegram sends successful_payment updates.
 * When: the billing Telegram Star service processes creation or payment confirmation.
 * Then: it sends the invoice to the target account and safely marks paid invoices.
 */

const mockSendInvoice = jest.fn();

jest.mock("@sps/shared-utils", () => {
  const actual = jest.requireActual("@sps/shared-utils");

  return {
    ...actual,
    RBAC_SECRET_KEY: "rbac-secret",
    TELEGRAM_SERVICE_BOT_TOKEN: "telegram-token",
  };
});

jest.mock("@sps/billing/models/invoice/sdk/server", () => {
  return {
    api: {
      create: jest.fn(),
      find: jest.fn(),
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
      },
    };
  },
);

jest.mock("grammy", () => ({
  Bot: jest.fn().mockImplementation(() => ({
    api: {
      sendInvoice: (...args: unknown[]) => mockSendInvoice(...args),
    },
  })),
}));

import { Service } from "./telegram-star";
import { api as invoiceApi } from "@sps/billing/models/invoice/sdk/server";
import { api as paymentIntentsToInvoicesApi } from "@sps/billing/relations/payment-intents-to-invoices/sdk/server";

const mockedInvoiceCreate = invoiceApi.create as jest.Mock;
const mockedInvoiceFind = invoiceApi.find as jest.Mock;
const mockedInvoiceUpdate = invoiceApi.update as jest.Mock;
const mockedPaymentIntentToInvoiceCreate =
  paymentIntentsToInvoicesApi.create as jest.Mock;

describe("Telegram Star invoice creation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario
   * Given: a one-off payment intent is created for an hourly Telegram Stars subscription renewal.
   * When: the Telegram Star provider creates its invoice.
   * Then: it persists the invoice, sends it to the exact Telegram account, and links it to the payment intent.
   */
  it("sends a newly created renewal invoice to the Telegram account", async () => {
    const invoice = {
      id: "invoice-1",
      amount: 1,
      status: "open",
      provider: "telegram-star",
    };

    mockedInvoiceCreate.mockResolvedValue(invoice);
    mockSendInvoice.mockResolvedValue({});
    mockedPaymentIntentToInvoiceCreate.mockResolvedValue({});

    await expect(
      new Service().proceed({
        action: "create",
        account: "telegram-account-1",
        currency: "telegram-star",
        entity: {
          id: "payment-intent-1",
          amount: 1,
        } as any,
        metadata: {
          paymentIntentId: "payment-intent-1",
        },
      }),
    ).resolves.toEqual(invoice);

    expect(mockedInvoiceCreate).toHaveBeenCalledWith({
      data: {
        amount: 1,
        status: "open",
        provider: "telegram-star",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
      },
    });
    expect(mockSendInvoice).toHaveBeenCalledWith(
      "telegram-account-1",
      "Invoice created",
      "Pay invoice to get the target good",
      "invoice-1",
      "XTR",
      [{ label: "Star", amount: 1 }],
    );
    expect(mockedPaymentIntentToInvoiceCreate).toHaveBeenCalledWith({
      data: {
        paymentIntentId: "payment-intent-1",
        invoiceId: "invoice-1",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
      },
    });
  });
});

describe("Telegram Star payment webhook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario
   * Given: the successful_payment payload references an open Telegram Star invoice.
   * When: the webhook is processed.
   * Then: the invoice is marked paid and the payment intent callback is called.
   */
  it("marks the invoice paid from successful_payment data", async () => {
    const service = new Service();
    const invoice = {
      id: "invoice-1",
      amount: 25,
      status: "open",
      provider: "telegram-star",
      providerId: null,
    };
    const updatedInvoice = {
      ...invoice,
      amount: 25,
      status: "paid",
      providerId: "telegram-charge-1",
    };
    const callback = jest.fn().mockResolvedValue({ ok: true });
    const fetchSpy = jest.spyOn(globalThis, "fetch");

    mockedInvoiceFind.mockResolvedValue([invoice]);
    mockedInvoiceUpdate.mockResolvedValue(updatedInvoice);

    await expect(
      service.proceed({
        action: "webhook",
        data: {
          currency: "XTR",
          total_amount: 25,
          invoice_payload: "invoice-1",
          telegram_payment_charge_id: "telegram-charge-1",
          provider_payment_charge_id: "provider-charge-1",
        },
        callback,
      }),
    ).resolves.toEqual({ code: 0 });

    expect(fetchSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("getStarTransactions"),
    );
    expect(mockedInvoiceUpdate).toHaveBeenCalledWith({
      id: "invoice-1",
      data: expect.objectContaining({
        providerId: "telegram-charge-1",
        amount: 25,
        status: "paid",
      }),
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
      },
    });
    expect(callback).toHaveBeenCalledWith({ invoice: updatedInvoice });

    fetchSpy.mockRestore();
  });

  /**
   * BDD Scenario
   * Given: the successful_payment amount differs from the SPS invoice amount.
   * When: the webhook is processed.
   * Then: the service refuses to mark the invoice paid.
   */
  it("rejects mismatched Telegram Star amounts", async () => {
    const service = new Service();

    mockedInvoiceFind.mockResolvedValue([
      {
        id: "invoice-1",
        amount: 25,
        status: "open",
        provider: "telegram-star",
        providerId: null,
      },
    ]);

    await expect(
      service.proceed({
        action: "webhook",
        data: {
          currency: "XTR",
          total_amount: 20,
          invoice_payload: "invoice-1",
          telegram_payment_charge_id: "telegram-charge-1",
          provider_payment_charge_id: "provider-charge-1",
        },
        callback: jest.fn(),
      }),
    ).rejects.toThrow("Telegram Star amount does not match");

    expect(mockedInvoiceUpdate).not.toHaveBeenCalled();
  });
});
