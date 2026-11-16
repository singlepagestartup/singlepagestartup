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
    subjectsToBillingModulePaymentIntents: {
      find: jest.fn(async (props) =>
        [...orders.keys()]
          .map((id) => ({
            subjectId: "subject",
            variant: "purchaser",
            billingModulePaymentIntentId: `payment-${id}`,
          }))
          .filter((row) =>
            props.params.filters.and.every((filter: any) =>
              filter.method === "inArray"
                ? filter.value.includes(row[filter.column])
                : row[filter.column] === filter.value,
            ),
          ),
      ),
    },
    socialModule: {
      profilesToEcommerceModuleOrders: {
        find: jest.fn(async (props) => [
          {
            profileId: `profile-${props.params.filters.and[0].value}`,
            ecommerceModuleOrderId: props.params.filters.and[0].value,
          },
        ]),
      },
    },
    rolesToEcommerceModuleProducts: {
      find: jest.fn(async () => [{ ecommerceModuleProductId: "product" }]),
    },
    ecommerceModule: {
      ordersToBillingModulePaymentIntents: {
        find: jest.fn(async (props) =>
          [...orders.keys()]
            .map((id) => ({
              orderId: id,
              billingModulePaymentIntentId: `payment-${id}`,
            }))
            .filter((row) =>
              props.params.filters.and.every((filter: any) =>
                filter.method === "inArray"
                  ? filter.value.includes(row[filter.column])
                  : row[filter.column] === filter.value,
              ),
            ),
        ),
      },
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
  expect(
    service.subjectsToBillingModulePaymentIntents.find,
  ).toHaveBeenCalledWith(
    expect.objectContaining({
      params: {
        filters: {
          and: [
            { column: "subjectId", method: "eq", value: "subject" },
            { column: "variant", method: "eq", value: "purchaser" },
          ],
        },
        limit: 100,
        offset: 0,
        orderBy: { and: [{ column: "id", method: "asc" }] },
      },
    }),
  );
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
