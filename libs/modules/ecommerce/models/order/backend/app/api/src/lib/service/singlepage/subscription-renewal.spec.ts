import { Service } from "./index";

it("refuses to cancel a recurring intent shared with another Product order", async () => {
  const service = Object.create(Service.prototype) as Service;
  service.findByIdExtended = jest.fn().mockResolvedValue({
    ordersToBillingModulePaymentIntents: [
      {
        billingModulePaymentIntent: {
          id: "shared",
          type: "subscription",
          amount: 100,
        },
      },
    ],
  });
  service.ordersToBillingModulePaymentIntents = {
    find: jest.fn().mockResolvedValue([
      { orderId: "order", billingModulePaymentIntentId: "shared" },
      { orderId: "other-product", billingModulePaymentIntentId: "shared" },
    ]),
  } as any;
  const stop = jest.fn();
  service.billingModule = {
    paymentIntent: {
      stopSubscriptionRenewal: stop,
      hasProviderManagedSubscriptionRenewal: jest.fn().mockResolvedValue(true),
    },
  } as any;
  expect(await service.hasSharedSubscriptionRenewal({ id: "order" })).toBe(
    true,
  );
  await expect(
    service.stopSubscriptionRenewal({ id: "order" }),
  ).rejects.toThrow("Shared recurring payment requires reconciliation");
  expect(stop).not.toHaveBeenCalled();
});
