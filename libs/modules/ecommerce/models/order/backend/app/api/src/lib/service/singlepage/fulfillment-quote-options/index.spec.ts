import { Service } from "./index";

function fixture() {
  const orders = new Map<string, any>([
    [
      "cart",
      {
        id: "cart",
        type: "cart",
        subscriptionSourceOrderId: "first",
        subscriptionSourceInvoiceId: "invoice-first",
      },
    ],
    [
      "first",
      {
        id: "first",
        type: "history",
        subscriptionPeriodInvoiceId: "invoice-first",
      },
    ],
    [
      "second",
      {
        id: "second",
        type: "history",
        subscriptionPeriodInvoiceId: "invoice-second",
        subscriptionSourceOrderId: "first",
        subscriptionSourceInvoiceId: "invoice-first",
      },
    ],
  ]);
  const product = {
    purchaseType: "subscription",
    charge: {
      role: "product",
      productId: "subscription",
      offerId: "offer",
      recurrence: "each",
    },
  };
  const delivery = {
    purchaseType: "subscription",
    charge: {
      role: "delivery",
      productId: "delivery",
      offerId: "delivery-offer",
      recurrence: "first",
    },
  };
  const snapshots = new Map<string, any[]>([
    ["first", [product, delivery]],
    ["second", [product]],
  ]);
  const invoice = jest.fn(async ({ id }) => ({ id, status: "paid" }));
  const intent = jest.fn(async ({ id }) => ({
    id,
    type: "one_off",
    status: "succeeded",
  }));
  const payment = jest.fn(async (props) => {
    const id = props.params.filters.and[0].value;
    return (snapshots.get(id) ?? []).map((purchaseSnapshot) => ({
      billingModulePaymentIntentId: "intent-invoice-" + id,
      purchaseSnapshot,
    }));
  });
  const lines = jest.fn(async (props) => [
    {
      id: "line-" + props.params.filters.and[0].value,
      offerId: "offer",
      productId: "subscription",
      parentLineId: null,
    },
  ]);
  const service = new Service({
    findById: async ({ id }) => orders.get(id) ?? null,
    ordersToProducts: { find: lines },
    payments: { find: payment },
    billingModule: {
      invoice: { findById: invoice },
      paymentIntent: { findById: intent },
      paymentIntentsToInvoices: {
        find: async (props) => [
          { paymentIntentId: "intent-" + props.params.filters.and[0].value },
        ],
      },
    },
  } as any);
  return { service, orders, snapshots, invoice, intent, payment, lines };
}

it("allows a verified renewal to omit a paid first-only delivery", async () => {
  const { service } = fixture();
  expect(await service.execute({ id: "cart" })).toEqual({
    fulfilledLineIds: ["line-cart"],
  });
  expect(await service.execute({ id: "first" })).toEqual({
    fulfilledLineIds: ["line-first"],
  });
});

it("walks paid renewal history to the original first-only fulfillment", async () => {
  const { service, orders } = fixture();
  orders.get("cart").subscriptionSourceOrderId = "second";
  orders.get("cart").subscriptionSourceInvoiceId = "invoice-second";
  expect(await service.execute({ id: "cart" })).toEqual({
    fulfilledLineIds: ["line-cart"],
  });
  expect(await service.execute({ id: "second" })).toEqual({
    fulfilledLineIds: ["line-second"],
  });
});

it("keeps ordinary carts on their configured fulfillment path", async () => {
  const { service, orders, payment, lines } = fixture();
  orders.set("ordinary", { id: "ordinary", type: "cart" });
  expect(await service.execute({ id: "ordinary" })).toEqual({
    fulfilledLineIds: [],
  });
  expect(payment).not.toHaveBeenCalled();
  expect(lines).not.toHaveBeenCalled();
});

it.each([
  "unpaid",
  "failed",
  "recurring",
  "other-product",
  "each-delivery",
  "wrong-invoice",
  "revoked",
])(
  "does not suppress fulfillment with invalid source evidence: %s",
  async (reason) => {
    const { service, orders, snapshots, invoice, intent } = fixture();
    if (reason === "unpaid") {
      invoice.mockResolvedValue({ id: "invoice-first", status: "open" });
    } else if (reason === "failed") {
      intent.mockResolvedValue({
        id: "intent-invoice-first",
        type: "one_off",
        status: "failed",
      });
    } else if (reason === "recurring") {
      intent.mockResolvedValue({
        id: "intent-invoice-first",
        type: "subscription",
        status: "succeeded",
      });
    } else if (reason === "other-product") {
      snapshots.get("first")![0].charge.productId = "other";
    } else if (reason === "each-delivery") {
      snapshots.get("first")![1].charge.recurrence = "each";
    } else if (reason === "wrong-invoice") {
      orders.get("first").subscriptionPeriodInvoiceId = "different";
    } else {
      orders.get("first").subscriptionRevokedAt = new Date();
    }
    expect(await service.execute({ id: "cart" })).toEqual({
      fulfilledLineIds: [],
    });
  },
);

it("stops on cyclic renewal lineage without granting an exemption", async () => {
  const { service, orders, snapshots } = fixture();
  snapshots.set("first", [snapshots.get("first")![0]]);
  orders.get("first").subscriptionSourceOrderId = "first";
  orders.get("first").subscriptionSourceInvoiceId = "invoice-first";
  expect(await service.execute({ id: "cart" })).toEqual({
    fulfilledLineIds: [],
  });
});
