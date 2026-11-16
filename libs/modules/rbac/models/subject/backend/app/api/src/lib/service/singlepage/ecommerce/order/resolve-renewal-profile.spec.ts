import { Service } from "./resolve-renewal-profile";

function fixture() {
  const original = {
    id: "original",
    status: "completed",
    subscriptionPeriodInvoiceId: "paid-period",
    subscriptionPeriodEndsAt: new Date(Date.now() - 1000),
  };
  const service = {
    socialModule: {
      profilesToEcommerceModuleOrders: {
        find: jest
          .fn()
          .mockResolvedValue([
            { profileId: "assistant", ecommerceModuleOrderId: "original" },
          ]),
      },
    },
    subjectsToBillingModulePaymentIntents: {
      find: jest.fn().mockResolvedValue([
        {
          subjectId: "buyer",
          variant: "purchaser",
          billingModulePaymentIntentId: "intent",
        },
      ]),
    },
    ecommerceModule: {
      ordersToBillingModulePaymentIntents: {
        find: jest
          .fn()
          .mockResolvedValue([
            { orderId: "original", billingModulePaymentIntentId: "intent" },
          ]),
      },
      order: {
        findById: jest.fn().mockResolvedValue(original),
        findByIdCheckoutAttributes: jest
          .fn()
          .mockResolvedValue({ type: "subscription" }),
      },
      ordersToProducts: {
        find: jest
          .fn()
          .mockResolvedValue([{ orderId: "original", productId: "product" }]),
      },
    },
    billingModule: {
      paymentIntentsToInvoices: {
        find: jest
          .fn()
          .mockResolvedValue([
            { paymentIntentId: "intent", invoiceId: "paid-period" },
          ]),
      },
      invoice: {
        findById: jest
          .fn()
          .mockResolvedValue({ id: "paid-period", status: "paid" }),
      },
    },
  };
  return { original, service, resolve: new Service(service as any) };
}
const props = {
  renewalOrderId: "original",
  subjectId: "buyer",
  socialModuleProfileId: "assistant",
  productIds: ["product"],
};

it("uses the captured buyer and profile after the profile's manager changes", async () => {
  const f = fixture();
  await expect(f.resolve.execute(props)).resolves.toBe("assistant");
});

it.each([
  { subjectId: "new-manager" },
  { socialModuleProfileId: "other-profile" },
  { productIds: ["other-product"] },
])("rejects changes to renewal scope %j", async (changes) => {
  const f = fixture();
  await expect(f.resolve.execute({ ...props, ...changes })).rejects.toThrow(
    "Permission error",
  );
});

it("requires the original paid invoice to belong to the original payment", async () => {
  const f = fixture();
  f.service.billingModule.paymentIntentsToInvoices.find.mockResolvedValueOnce(
    [],
  );
  await expect(f.resolve.execute(props)).rejects.toThrow("original payment");
  expect(f.service.billingModule.invoice.findById).not.toHaveBeenCalled();
});

it("does not renew a period before it ends", async () => {
  const f = fixture();
  f.original.subscriptionPeriodEndsAt = new Date(Date.now() + 3600000);
  await expect(f.resolve.execute(props)).rejects.toThrow("not ready");
});
