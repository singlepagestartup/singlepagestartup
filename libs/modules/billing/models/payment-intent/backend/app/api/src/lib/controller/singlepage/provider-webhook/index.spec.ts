/**
 * BDD Suite: payment-intent provider webhook gate.
 *
 * Given: the payment-intent service decides which providers ALLOWED_BILLING_SERVICE_PROVIDERS allows.
 * When: a provider webhook request reaches the handler.
 * Then: a provider outside the list is refused with 400 before any invoice is read, and a listed provider keeps its handling.
 */

const mockInvoiceUpdate = jest.fn();

jest.mock("@sps/shared-utils", () => {
  const actual = jest.requireActual("@sps/shared-utils");

  return {
    ...actual,
    RBAC_SECRET_KEY: "test-rbac-secret",
    STRIPE_SECRET_KEY: undefined,
  };
});

jest.mock("@sps/billing/models/invoice/sdk/server", () => ({
  api: {
    update: (...args: unknown[]) => mockInvoiceUpdate(...args),
  },
}));

jest.mock("@sps/billing/models/payment-intent/sdk/server", () => ({
  api: {},
}));

import { Hono } from "hono";
import { Handler } from "./index";

describe("Given: the payment-intent provider webhook handler", () => {
  function createService(props: { allowedProviders: string[] }) {
    return {
      isProviderAllowed: jest.fn((params: { provider: string }) => {
        return props.allowedProviders.includes(params.provider);
      }),
      dummy: jest.fn(),
      telegramStar: jest.fn(),
      updatePaymentIntentStatus: jest.fn().mockResolvedValue({ ok: true }),
      billingModule: {
        invoice: {
          findById: jest.fn(),
        },
      },
    };
  }

  function postWebhook(props: {
    service: ReturnType<typeof createService>;
    provider: string;
    body: Record<string, unknown>;
    headers?: Record<string, string>;
  }) {
    const app = new Hono();

    app.post("/:provider/webhook", (c) => {
      return new Handler(props.service as any).execute(c, undefined);
    });

    return app.request(`/${props.provider}/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...props.headers,
      },
      body: JSON.stringify(props.body),
    });
  }

  beforeEach(() => {
    mockInvoiceUpdate.mockReset();
  });

  /**
   * BDD Scenario
   *
   * Given: the list leaves dummy out.
   * When: the dummy webhook is posted with an invoice id.
   * Then: it answers 400, reads no invoice and never reaches the dummy branch.
   */
  it("Then: refuses a dummy webhook when the list leaves dummy out", async () => {
    const service = createService({ allowedProviders: ["stripe"] });

    const response = await postWebhook({
      service,
      provider: "dummy",
      body: { data: { id: "invoice-1" } },
    });

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toContain(
      "Provider dummy is not allowed",
    );
    expect(service.isProviderAllowed).toHaveBeenCalledWith({
      provider: "dummy",
    });
    expect(service.billingModule.invoice.findById).not.toHaveBeenCalled();
    expect(service.dummy).not.toHaveBeenCalled();
    expect(mockInvoiceUpdate).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   *
   * Given: the list names dummy and the invoice has a non-zero amount.
   * When: the dummy webhook is posted with the invoice id.
   * Then: the dummy branch settles the invoice and the handler answers 200 with it.
   */
  it("Then: settles the invoice through the dummy branch when the list names dummy", async () => {
    const service = createService({ allowedProviders: ["dummy"] });
    const paidInvoice = { id: "invoice-1", amount: 100, status: "paid" };
    service.billingModule.invoice.findById.mockResolvedValue({
      id: "invoice-1",
      amount: 100,
      status: "open",
    });
    service.dummy.mockResolvedValue(paidInvoice);

    const response = await postWebhook({
      service,
      provider: "dummy",
      body: { data: { id: "invoice-1" } },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: paidInvoice });
    expect(service.dummy).toHaveBeenCalledWith({
      data: { id: "invoice-1" },
      action: "webhook",
    });
  });

  /**
   * BDD Scenario
   *
   * Given: the list names stripe and the invoice amount is zero.
   * When: the stripe webhook is posted with the invoice id, as payment creation does for a free payment.
   * Then: the handler marks the invoice paid and updates its payment intents.
   */
  it("Then: still settles a zero-amount invoice for a listed provider", async () => {
    const service = createService({ allowedProviders: ["stripe"] });
    const invoice = { id: "invoice-1", amount: 0, status: "open" };
    const paidInvoice = { ...invoice, status: "paid" };
    service.billingModule.invoice.findById.mockResolvedValue(invoice);
    mockInvoiceUpdate.mockResolvedValue(paidInvoice);

    const response = await postWebhook({
      service,
      provider: "stripe",
      body: { data: { id: "invoice-1" } },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: paidInvoice });
    expect(mockInvoiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "invoice-1",
        data: expect.objectContaining({ status: "paid" }),
      }),
    );
    expect(service.updatePaymentIntentStatus).toHaveBeenCalledWith({
      invoice: paidInvoice,
    });
  });

  /**
   * BDD Scenario
   *
   * Given: the list names telegram-star.
   * When: the telegram-star webhook is posted without the operator secret.
   * Then: it answers 403 and never reaches the Telegram Star service.
   */
  it("Then: still refuses a Telegram Star webhook without the operator secret", async () => {
    const service = createService({ allowedProviders: ["telegram-star"] });

    const response = await postWebhook({
      service,
      provider: "telegram-star",
      body: { invoice_payload: "invoice-1" },
    });

    expect(response.status).toBe(403);
    expect(service.telegramStar).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   *
   * Given: the list names telegram-star.
   * When: the Telegram bot posts a successful payment with the operator secret.
   * Then: the handler passes the payment to the Telegram Star service and answers 200.
   */
  it("Then: passes a Telegram Star payment with the operator secret to the service", async () => {
    const service = createService({ allowedProviders: ["telegram-star"] });
    const payment = {
      currency: "XTR",
      total_amount: 1,
      invoice_payload: "invoice-1",
      telegram_payment_charge_id: "telegram-charge-1",
      provider_payment_charge_id: "provider-charge-1",
    };
    service.telegramStar.mockResolvedValue({ id: "invoice-1" });

    const response = await postWebhook({
      service,
      provider: "telegram-star",
      body: payment,
      headers: { "X-RBAC-SECRET-KEY": "test-rbac-secret" },
    });

    expect(response.status).toBe(200);
    expect(service.telegramStar).toHaveBeenCalledWith(
      expect.objectContaining({ action: "webhook", data: payment }),
    );
  });
});
