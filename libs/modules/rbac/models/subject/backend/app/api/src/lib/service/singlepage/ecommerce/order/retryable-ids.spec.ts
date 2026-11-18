import { createAppAssembly } from "@sps/shared-backend-api";
import { createModules } from "../../../modules";
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
  const subjectsToEcommerceModuleOrders = reader();
  const ecommerceModule = { ordersToBillingModulePaymentIntents: reader() };
  const billingModule = {
    paymentIntent: reader(),
    paymentIntentsToInvoices: reader(),
    invoice: reader(),
  };
  return {
    service: new Service({
      modules: createAppAssembly().getOrCreate(createModules),
      ecommerceModule,
      billingModule,
      subjectsToEcommerceModuleOrders,
    }),
    subjectsToEcommerceModuleOrders,
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
    billingModule.paymentIntent.find.mockResolvedValue([
      { id: "success", status: "succeeded" },
    ]);
    billingModule.paymentIntentsToInvoices.find.mockResolvedValue([
      { paymentIntentId: "open", invoiceId: "unpaid" },
      { paymentIntentId: "not reconciled", invoiceId: "confirmed" },
    ]);
    billingModule.invoice.find.mockResolvedValue([
      { id: "confirmed", status: "paid" },
    ]);
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
          ],
        },
      },
    });
  });
});

describe("continuing an existing hosted invoice", () => {
  const url = "https://checkout.example/session";
  function attempt({
    invoiceStatus = "open",
    intentStatus = "requires_payment_method",
    orderStatus = "paying",
    provider = "stripe",
    paymentUrl = url,
    otherOwner = false,
    foreignOrder = false,
    orphanIntent = false,
    secondInvoice = false,
  } = {}) {
    const {
      service,
      billingModule,
      ecommerceModule,
      subjectsToEcommerceModuleOrders,
    } = setup();
    const order = history("mine", orderStatus);
    const orderIntent = {
      orderId: order.id,
      billingModulePaymentIntentId: "intent",
    };
    const link = { paymentIntentId: "intent", invoiceId: "invoice" };
    ecommerceModule.ordersToBillingModulePaymentIntents.find
      .mockResolvedValueOnce([orderIntent])
      .mockResolvedValueOnce(
        foreignOrder
          ? [orderIntent, { ...orderIntent, orderId: "outside" }]
          : [orderIntent],
      );
    billingModule.paymentIntent.find.mockResolvedValue([
      { id: "intent", status: intentStatus },
    ]);
    const invoice = {
      id: "invoice",
      status: invoiceStatus,
      paymentUrl,
      provider,
    };
    const invoiceLinks = secondInvoice
      ? [link, { ...link, invoiceId: "second" }]
      : [link];
    billingModule.invoice.find.mockResolvedValue(
      secondInvoice
        ? [invoice, { ...invoice, id: "second", paymentUrl: url + "/2" }]
        : [invoice],
    );
    billingModule.paymentIntentsToInvoices.find
      .mockResolvedValueOnce(invoiceLinks)
      .mockResolvedValueOnce(
        orphanIntent
          ? [...invoiceLinks, { ...link, paymentIntentId: "orphan" }]
          : invoiceLinks,
      );
    const owner = { subjectId: "subject", ecommerceModuleOrderId: order.id };
    subjectsToEcommerceModuleOrders.find.mockResolvedValue(
      otherOwner ? [owner, { ...owner, subjectId: "other" }] : [owner],
    );
    return service.purchasePayments({ subjectId: "subject", orders: [order] });
  }
  it("shows a single invoice shared by two pending orders of the same subject", async () => {
    const {
      service,
      billingModule,
      ecommerceModule,
      subjectsToEcommerceModuleOrders,
    } = setup();
    const orders = ["first", "second"].map((id) => history(id, "paying"));
    const orderIntents = orders.map(({ id }) => ({
      orderId: id,
      billingModulePaymentIntentId: id + "-intent",
    }));
    const links = orderIntents.map((link) => ({
      paymentIntentId: link.billingModulePaymentIntentId,
      invoiceId: "shared",
    }));
    ecommerceModule.ordersToBillingModulePaymentIntents.find.mockResolvedValue(
      orderIntents,
    );
    billingModule.paymentIntent.find.mockResolvedValue(
      links.map((link) => ({
        id: link.paymentIntentId,
        status: "requires_payment_method",
      })),
    );
    billingModule.paymentIntentsToInvoices.find.mockResolvedValue(links);
    billingModule.invoice.find.mockResolvedValue([
      { id: "shared", status: "open", provider: "stripe", paymentUrl: url },
    ]);
    subjectsToEcommerceModuleOrders.find.mockResolvedValue(
      orders.map(({ id }) => ({
        subjectId: "subject",
        ecommerceModuleOrderId: id,
      })),
    );
    const actions = await service.purchasePayments({
      subjectId: "subject",
      orders,
    });
    expect([...actions.paymentUrls]).toEqual([
      ["first", url],
      ["second", url],
    ]);
  });

  it.each([
    "requires_payment_method",
    "requires_action",
    "requires_confirmation",
  ])(
    "resumes the same invoice while the customer can act (%s)",
    async (intentStatus) => {
      const actions = await attempt({ intentStatus });
      expect(actions.paymentUrls.get("mine")).toBe(url);
      expect(actions.retryableIds.has("mine")).toBe(true);
    },
  );
  it.each([
    { invoiceStatus: "paid" },
    { invoiceStatus: "void" },
    { invoiceStatus: "draft" },
    { invoiceStatus: "uncollectible" },
    { intentStatus: "succeeded" },
    { intentStatus: "processing" },
    { intentStatus: "requires_capture" },
    { intentStatus: "canceled" },
    { intentStatus: "failed" },
    { orderStatus: "paid" },
    { orderStatus: "requested_cancelation" },
    { provider: "dummy" },
    { provider: "" },
    { paymentUrl: "" },
    { paymentUrl: "about:blank" },
    { otherOwner: true },
    { foreignOrder: true },
    { orphanIntent: true },
    { secondInvoice: true },
  ])("omits the payment link for %j", async (overrides) => {
    expect((await attempt(overrides)).paymentUrls.size).toBe(0);
  });
});
