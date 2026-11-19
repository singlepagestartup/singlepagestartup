import { createOrderBootstrap } from "../../bootstrap";
import { createAppAssembly } from "@sps/shared-backend-api";
import { createService as createReservations } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/bootstrap";
import { createService as createPaymentIntent } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/bootstrap";

it("refuses to cancel a recurring intent shared with another Product order", async () => {
  const assembly = createAppAssembly();
  const reservations = createReservations(assembly);
  jest.spyOn(reservations, "find").mockImplementation(
    jest.fn().mockResolvedValue([
      { orderId: "order", billingModulePaymentIntentId: "shared" },
      { orderId: "other-product", billingModulePaymentIntentId: "shared" },
    ]),
  );
  const paymentIntent = createPaymentIntent(assembly);
  const stop = jest.spyOn(paymentIntent, "stopSubscriptionRenewal");
  jest
    .spyOn(paymentIntent, "hasProviderManagedSubscriptionRenewal")
    .mockResolvedValue(true);
  const service = createOrderBootstrap(
    reservations,
    paymentIntent,
  ).createService(assembly);
  jest.spyOn(service, "findByIdExtended").mockImplementation(
    jest.fn().mockResolvedValue({
      ordersToBillingModulePaymentIntents: [
        {
          billingModulePaymentIntent: {
            id: "shared",
            type: "subscription",
            amount: 100,
          },
        },
      ],
    }),
  );
  expect(await service.hasSharedSubscriptionRenewal({ id: "order" })).toBe(
    true,
  );
  await expect(
    service.stopSubscriptionRenewal({ id: "order" }),
  ).rejects.toThrow("Shared recurring payment requires reconciliation");
  expect(stop).not.toHaveBeenCalled();
});
