/**
 * Given authenticated provider notifications, every successful payment delegates
 * to the same atomic settlement; incomplete or forged notifications do not.
 */
import { createHmac } from "node:crypto";
import { Service } from "./index";
import { api as invoiceApi } from "@sps/billing/models/invoice/sdk/server";

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "fixture-secret",
  STRIPE_SECRET_KEY: "sk_test_fixture",
  CLOUDPAYMENTS_PUBLIC_ID: "fixture-public",
  CLOUDPAYMENTS_API_SECRET: "fixture-secret",
  TIPTOPPAY_PUBLIC_ID: "fixture-public",
  TIPTOPPAY_API_SECRET: "fixture-secret",
  O_X_PROCESSING_SHOP_ID: "fixture-shop",
  O_X_PROCESSING_WEBHOOK_PASSWORD: "fixture-secret",
  PAYSELECTION_RUB_SITE_ID: "fixture-site",
  PAYSELECTION_RUB_PUBLIC_KEY: "fixture-public",
  PAYSELECTION_RUB_SECRET_KEY: "fixture-secret",
  PAYSELECTION_RUB_SITE_NAME: "fixture-site-name",
  PAYSELECTION_RUB_WEBHOOK_URL: "https://fixture.invalid/webhook",
  TELEGRAM_SERVICE_BOT_TOKEN: "fixture-token",
}));
jest.mock("@sps/billing/models/invoice/sdk/server", () => ({
  api: { find: jest.fn(), findById: jest.fn(), update: jest.fn() },
}));
jest.mock("stripe", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    subscriptions: {
      retrieve: jest
        .fn()
        .mockResolvedValue({ metadata: { paymentIntentId: "intent-1" } }),
    },
  })),
}));

function fixture(provider: string) {
  const invoice = {
    id: "invoice-1",
    amount: 100,
    status: "open",
    provider,
    providerId: "456",
  };
  const service = new Service({} as any, {} as any);
  const settle = jest
    .spyOn(service, "settlePayment")
    .mockResolvedValue({ ...invoice, status: "paid" } as any);
  (invoiceApi.find as jest.Mock).mockResolvedValue([invoice]);
  (invoiceApi.findById as jest.Mock).mockResolvedValue(invoice);
  return { service, settle, invoice };
}
beforeEach(() => jest.clearAllMocks());

it.each(["cloudpayments", "tiptoppay"] as const)(
  "%s delegates completed incoming payments using the original Amount",
  async (provider) => {
    const f = fixture(provider);
    const data = {
      Data: JSON.stringify({ invoiceId: f.invoice.id }),
      Status: "Completed",
      OperationType: "Payment",
      Amount: 100,
      PaymentAmount: "999.99",
    };
    const rawBody = JSON.stringify(data);
    const signature = createHmac("sha256", "fixture-secret")
      .update(rawBody)
      .digest("base64");
    await expect(
      f.service[provider]({
        action: "webhook",
        data,
        rawBody,
        headers: { "content-hmac": signature, "x-content-hmac": signature },
      } as any),
    ).resolves.toEqual({ code: 0 });
    expect(f.settle).toHaveBeenCalledWith({
      invoiceId: f.invoice.id,
      provider,
      providerId: "456",
      amount: 100,
    });
    expect(invoiceApi.update).not.toHaveBeenCalled();
  },
);

it.each(["cloudpayments", "tiptoppay"] as const)(
  "%s rejects invalid signatures and does not settle authorization or payout",
  async (provider) => {
    const f = fixture(provider);
    for (const data of [
      { Status: "Completed", OperationType: "Payment", forged: true },
      { Status: "Authorized", OperationType: "Payment" },
      { Status: "Completed", OperationType: "CardPayout" },
    ]) {
      const payload = {
        ...data,
        Data: JSON.stringify({ invoiceId: f.invoice.id }),
        Amount: 100,
      };
      const rawBody = JSON.stringify(payload);
      const signature = createHmac("sha256", "fixture-secret")
        .update(rawBody)
        .digest("base64");
      const request = f.service[provider]({
        action: "webhook",
        data: payload,
        rawBody,
        headers: {
          "content-hmac": data.forged ? "invalid" : signature,
          "x-content-hmac": signature,
        },
      } as any);
      if (data.Status === "Authorized")
        await expect(request).resolves.toEqual({ code: 0 });
      else await expect(request).rejects.toThrow();
    }
    expect(f.settle).not.toHaveBeenCalled();
  },
);

it("Stripe waits for a paid Checkout Session, including a delayed payment", async () => {
  const f = fixture("stripe");
  const object = {
    object: "checkout.session",
    id: "456",
    status: "complete",
    payment_status: "unpaid",
    amount_total: 10000,
  };
  await f.service.stripe({
    action: "webhook",
    data: { data: { object } },
  } as any);
  expect(f.settle).not.toHaveBeenCalled();
  await f.service.stripe({
    action: "webhook",
    data: { data: { object: { ...object, payment_status: "paid" } } },
  } as any);
  expect(f.settle).toHaveBeenCalledWith({
    invoiceId: f.invoice.id,
    provider: "stripe",
    providerId: "456",
    amount: 100,
  });
  expect(invoiceApi.update).not.toHaveBeenCalled();
});

it("0xProcessing delegates only a signed successful payment", async () => {
  const f = fixture("0xprocessing");
  const data = {
    PaymentId: "456",
    Email: "fixture@example.invalid",
    Currency: "USDT",
    AmountUSD: 100,
    Status: "Success",
  };
  const Signature = "790927fa3ba9e6c8bd7fff7b8c327228";
  await expect(
    f.service.OxProcessing({
      action: "webhook",
      data: { ...data, Signature: "invalid" },
    } as any),
  ).rejects.toThrow("Signature mismatch");
  expect(f.settle).not.toHaveBeenCalled();
  await f.service.OxProcessing({
    action: "webhook",
    data: { ...data, Status: "Insufficient", Signature },
  } as any);
  expect(f.settle).not.toHaveBeenCalled();
  await f.service.OxProcessing({
    action: "webhook",
    data: { ...data, Signature },
  } as any);
  expect(f.settle).toHaveBeenCalledWith({
    invoiceId: f.invoice.id,
    provider: "0xprocessing",
    providerId: "456",
    amount: 100,
  });
});

it("Payselection verifies its signature before invoking settlement", async () => {
  const f = fixture("payselection");
  const data = { OrderId: f.invoice.id, Event: "Payment", Amount: "100.00" };
  const rawBody = JSON.stringify(data);
  const signature = createHmac("sha256", "fixture-secret")
    .update(`POST\nhttps://fixture.invalid/webhook\nfixture-site\n${rawBody}`)
    .digest("hex");
  const input = {
    action: "webhook",
    data,
    rawBody,
    headers: { "x-site-id": "fixture-site", "x-webhook-signature": "invalid" },
  };
  await expect(f.service.payselection(input as any)).rejects.toThrow(
    "Signature mismatch",
  );
  expect(f.settle).not.toHaveBeenCalled();
  await f.service.payselection({
    ...input,
    headers: { ...input.headers, "x-webhook-signature": signature },
  } as any);
  expect(f.settle).toHaveBeenCalledWith({
    invoiceId: f.invoice.id,
    provider: "payselection",
    providerId: "456",
    amount: 100,
  });
});

it("dummy delegates to settlement and rejects another provider", async () => {
  const f = fixture("dummy");
  await f.service.dummy({ action: "webhook", data: { id: f.invoice.id } });
  expect(f.settle).toHaveBeenCalledWith({
    invoiceId: f.invoice.id,
    provider: "dummy",
    amount: 100,
  });
  f.settle.mockClear();
  (invoiceApi.find as jest.Mock).mockResolvedValue([
    { ...f.invoice, provider: "stripe" },
  ]);
  await expect(
    f.service.dummy({ action: "webhook", data: { id: f.invoice.id } }),
  ).rejects.toThrow("another payment provider");
  expect(f.settle).not.toHaveBeenCalled();
});
