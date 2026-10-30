import { Service } from "./role-revocation";

function fixture() {
  const orders = new Map<string, any>([
    [
      "matching",
      {
        id: "matching",
        status: "delivered",
        ordersToProducts: [{ productId: "product" }],
      },
    ],
    [
      "unrelated",
      {
        id: "unrelated",
        status: "delivered",
        ordersToProducts: [{ productId: "other" }],
      },
    ],
  ]);
  const service = {
    subjectsToEcommerceModuleOrders: {
      find: jest.fn(async () =>
        [...orders.keys()].map((id) => ({ ecommerceModuleOrderId: id })),
      ),
    },
    rolesToEcommerceModuleProducts: {
      find: jest.fn(async () => [{ ecommerceModuleProductId: "product" }]),
    },
    ecommerceModule: {
      order: {
        findByIdExtended: jest.fn(async ({ id }) => orders.get(id)),
        revokeSubscription: jest.fn(async () => {}),
        findByIdCheckoutAttributes: jest.fn(async () => ({ type: "one_off" })),
      },
    },
  };
  return { orders, service, revocation: new Service(service as any) };
}
const grant = { id: "grant", roleId: "role", subjectId: "subject" } as any;
it("revokes only the subject's orders containing a product linked to the removed role", async () => {
  const { service, revocation } = fixture();
  await revocation.revoke(grant);
  expect(service.subjectsToEcommerceModuleOrders.find).toHaveBeenCalledWith({
    params: {
      filters: {
        and: [{ column: "subjectId", method: "eq", value: "subject" }],
      },
    },
  });
  expect(
    service.ecommerceModule.order.revokeSubscription,
  ).toHaveBeenCalledTimes(1);
  expect(service.ecommerceModule.order.revokeSubscription).toHaveBeenCalledWith(
    { id: "matching" },
  );
});
it("rejects cleanup for a foreign order or a product unrelated to the grant", async () => {
  const { revocation } = fixture();
  expect(
    await revocation.canFulfill(grant, {
      id: "grant",
      subjectId: "subject",
      orderId: "foreign",
    }),
  ).toBe(false);
  expect(
    await revocation.canFulfill(grant, {
      id: "grant",
      subjectId: "subject",
      orderId: "unrelated",
    }),
  ).toBe(false);
});
it("retains a grant required by another active subscription", async () => {
  const { orders, revocation } = fixture();
  orders.set("active", {
    status: "delivering",
    subscriptionPeriodInvoiceId: "invoice",
    subscriptionPeriodEndsAt: new Date(Date.now() + 60000).toISOString(),
    ordersToProducts: [{ productId: "product" }],
  });
  expect(
    await revocation.canFulfill(grant, {
      id: "grant",
      subjectId: "subject",
      orderId: "matching",
    }),
  ).toBe(false);
});
it("allows verified completed one-off fulfillment", async () => {
  const { revocation } = fixture();
  expect(
    await revocation.canFulfill(grant, {
      id: "grant",
      subjectId: "subject",
      orderId: "matching",
    }),
  ).toBe(true);
});
