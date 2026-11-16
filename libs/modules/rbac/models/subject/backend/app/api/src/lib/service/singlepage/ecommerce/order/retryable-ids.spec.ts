import { Service, type IExecuteProps } from "./retryable-ids";

function history(id: string, status: string): IExecuteProps["orders"][number] {
  return {
    id,
    type: "history",
    status,
    subscriptionPeriodInvoiceId: null,
    subscriptionPeriodStartsAt: null,
    subscriptionPeriodEndsAt: null,
  };
}

function setup() {
  const reader = () => ({ find: jest.fn().mockResolvedValue([]) });
  const ecommerceModule = { ordersToBillingModulePaymentIntents: reader() };
  const billingModule = {
    paymentIntent: reader(),
    paymentIntentsToInvoices: reader(),
    invoice: reader(),
  };
  return {
    service: new Service({ ecommerceModule, billingModule }),
    ecommerceModule,
    billingModule,
  };
}

describe("retrying payment from order history", () => {
  it("excludes previously billed periods and fulfilled orders before reading Billing", async () => {
    const { service, ecommerceModule } = setup();
    const orders = [
      { ...history("cart", "new"), type: "cart" },
      history("fulfilled", "completed"),
      history("paid", "paid"),
      history("expired subscription", "expired"),
      {
        ...history("frozen", "canceled"),
        subscriptionPeriodInvoiceId: "prior invoice",
      },
    ];
    expect(await service.execute({ orders })).toEqual(new Set());
    expect(
      ecommerceModule.ordersToBillingModulePaymentIntents.find,
    ).not.toHaveBeenCalled();
  });

  it("checks billing in batches and excludes either sign of settlement even while order status lags", async () => {
    const { service, ecommerceModule, billingModule } = setup();
    const orders = [
      history("no attempt", "canceling"),
      history("pending", "paying"),
      history("rejected", "failed"),
      history("settled", "paying"),
      history("paid invoice", "canceled"),
    ];
    ecommerceModule.ordersToBillingModulePaymentIntents.find.mockResolvedValue([
      { orderId: "pending", billingModulePaymentIntentId: "open" },
      { orderId: "rejected", billingModulePaymentIntentId: "declined" },
      { orderId: "settled", billingModulePaymentIntentId: "success" },
      {
        orderId: "paid invoice",
        billingModulePaymentIntentId: "not reconciled",
      },
    ]);
    billingModule.paymentIntent.find.mockResolvedValue([{ id: "success" }]);
    billingModule.paymentIntentsToInvoices.find.mockResolvedValue([
      { paymentIntentId: "open", invoiceId: "unpaid" },
      { paymentIntentId: "not reconciled", invoiceId: "confirmed" },
    ]);
    billingModule.invoice.find.mockResolvedValue([{ id: "confirmed" }]);
    expect(await service.execute({ orders })).toEqual(
      new Set(["no attempt", "pending", "rejected"]),
    );
    for (const reader of Object.values(billingModule)) {
      expect(reader.find).toHaveBeenCalledTimes(1);
    }
    expect(billingModule.invoice.find).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            { column: "id", method: "inArray", value: ["unpaid", "confirmed"] },
            { column: "status", method: "eq", value: "paid" },
          ],
        },
      },
    });
  });
});
