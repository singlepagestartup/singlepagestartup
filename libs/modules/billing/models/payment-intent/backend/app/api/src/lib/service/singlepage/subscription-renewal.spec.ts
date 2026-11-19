import { createService } from "../../bootstrap";
import {
  createAppAssembly,
  withConsistencyDatabase,
} from "@sps/shared-backend-api";

const mockRetrieveInvoice = jest.fn();
const mockRetrieveSubscription = jest.fn();
const mockUpdateSubscription = jest.fn();
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  STRIPE_SECRET_KEY: "sk_test_fixture",
}));
jest.mock("stripe", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    invoices: { retrieve: mockRetrieveInvoice },
    subscriptions: {
      retrieve: mockRetrieveSubscription,
      update: mockUpdateSubscription,
    },
  })),
}));

function fixture(type = "subscription", provider = "stripe", amount = 100) {
  const service = createService(createAppAssembly());
  jest
    .spyOn(service.module.paymentIntentsToInvoices, "find")
    .mockImplementation(
      jest
        .fn()
        .mockResolvedValue([
          { paymentIntentId: "intent", invoiceId: "invoice" },
        ]),
    );
  jest
    .spyOn(service.module.invoice, "find")
    .mockImplementation(
      jest
        .fn()
        .mockResolvedValue([
          { id: "invoice", status: "paid", provider, providerId: "in_paid" },
        ]),
    );
  jest
    .spyOn(service, "findById")
    .mockResolvedValue({ id: "intent", type, amount } as any);
  return service;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRetrieveInvoice.mockResolvedValue({
    parent: { subscription_details: { subscription: "sub_paid" } },
  });
  mockRetrieveSubscription.mockResolvedValue({
    metadata: { paymentIntentId: "intent" },
    status: "active",
    cancel_at_period_end: false,
  });
});

it("stops future Stripe renewal while preserving its paid period and accepts repeated cancellation", async () => {
  const service = fixture();
  await service.stopSubscriptionRenewal({ id: "intent" });
  expect(mockUpdateSubscription).toHaveBeenCalledWith("sub_paid", {
    cancel_at_period_end: true,
  });
  mockRetrieveSubscription.mockResolvedValue({
    metadata: { paymentIntentId: "intent" },
    status: "active",
    cancel_at_period_end: true,
  });
  await service.stopSubscriptionRenewal({ id: "intent" });
  expect(mockUpdateSubscription).toHaveBeenCalledTimes(1);
});

it.each([
  ["one_off", 100],
  ["subscription", 0],
])("does not call a provider for %s amount %s", async (type, amount) => {
  await fixture(String(type), "dummy", Number(amount)).stopSubscriptionRenewal({
    id: "intent",
  });
  expect(mockRetrieveInvoice).not.toHaveBeenCalled();
  expect(mockUpdateSubscription).not.toHaveBeenCalled();
});

it("rejects an unknown recurring provider and a Stripe contract owned by another intent", async () => {
  await expect(
    fixture("subscription", "custom").stopSubscriptionRenewal({ id: "intent" }),
  ).rejects.toThrow("cannot stop renewal automatically");
  mockRetrieveSubscription.mockResolvedValue({
    metadata: { paymentIntentId: "foreign" },
  });
  await expect(
    fixture().stopSubscriptionRenewal({ id: "intent" }),
  ).rejects.toThrow("another payment intent");
  expect(mockUpdateSubscription).not.toHaveBeenCalled();
});

it.each([
  "cloudpayments",
  "tiptoppay",
  "0xprocessing",
  "payselection",
  "paykeeper",
  "telegram-star",
  "dummy",
])(
  "does not cancel a remote contract for the non-recurring %s adapter",
  async (provider) => {
    const service = fixture("subscription", provider);
    expect(
      await service.hasProviderManagedSubscriptionRenewal({ id: "intent" }),
    ).toBe(false);
    await service.stopSubscriptionRenewal({ id: "intent" });
    expect(mockRetrieveInvoice).not.toHaveBeenCalled();
    expect(mockUpdateSubscription).not.toHaveBeenCalled();
  },
);

it("propagates provider failures so the pending cancellation can be retried", async () => {
  mockUpdateSubscription.mockRejectedValueOnce(new Error("Stripe unavailable"));
  await expect(
    fixture().stopSubscriptionRenewal({ id: "intent" }),
  ).rejects.toThrow("Stripe unavailable");
});

it("cancels the original provider contract from a successor intent's trusted dispatch context", async () => {
  const service = fixture();
  jest.spyOn(service, "findById").mockResolvedValue({
    id: "intent",
    type: "subscription",
    amount: 100,
    checkoutMetadata: { providerContractPaymentIntentId: "root-intent" },
  } as any);
  mockRetrieveSubscription.mockResolvedValue({
    metadata: { paymentIntentId: "root-intent" },
    status: "active",
    cancel_at_period_end: false,
  });
  await service.stopSubscriptionRenewal({ id: "intent" });
  expect(mockUpdateSubscription).toHaveBeenCalledWith("sub_paid", {
    cancel_at_period_end: true,
  });
});

it("does not call Stripe while an Order or Subject transaction is open", async () => {
  await expect(
    withConsistencyDatabase({} as any, () =>
      fixture().stopSubscriptionRenewal({ id: "intent" }),
    ),
  ).rejects.toThrow("requires a committed transaction");
  expect(mockRetrieveInvoice).not.toHaveBeenCalled();
  expect(mockUpdateSubscription).not.toHaveBeenCalled();
});
