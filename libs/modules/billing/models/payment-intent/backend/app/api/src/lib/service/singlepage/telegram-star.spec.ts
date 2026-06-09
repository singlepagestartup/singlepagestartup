/**
 * BDD Suite: Telegram Star payment webhook.
 *
 * Given: Telegram sends a successful_payment update to the Telegram adapter.
 * When: the billing Telegram Star service receives the internal webhook payload.
 * Then: it validates the SPS invoice payload and marks the invoice as paid without blocking on getStarTransactions.
 */

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

import { Service } from "./telegram-star";
import { api as invoiceApi } from "@sps/billing/models/invoice/sdk/server";

const mockedInvoiceFind = invoiceApi.find as jest.Mock;
const mockedInvoiceUpdate = invoiceApi.update as jest.Mock;

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
