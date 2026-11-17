import { Service } from "./mutate-cart";

function fixture() {
  const order = { id: "order", type: "cart", status: "new" };
  const owners = [{ subjectId: "subject", ecommerceModuleOrderId: "order" }];
  const service = {
    ecommerceModuleOrderAssertAccess: jest.fn(),
    subjectsToEcommerceModuleOrders: {
      find: jest.fn().mockResolvedValue(owners),
    },
    ecommerceModule: {
      order: {
        lockForLifecycle: jest.fn(),
        findById: jest.fn().mockResolvedValue(order),
        delete: jest.fn(),
      },
      ordersToProducts: {
        find: jest
          .fn()
          .mockResolvedValue([{ id: "line", productId: "product" }]),
        update: jest.fn(),
      },
      product: { findById: jest.fn().mockResolvedValue({ slug: "product" }) },
      ordersToBillingModulePaymentIntents: {
        find: jest.fn().mockResolvedValue([]),
      },
    },
  };
  const repository = { withSubjectLock: jest.fn(async (_scope, run) => run()) };
  return {
    order,
    owners,
    service,
    repository,
    operation: new Service({ service, repository } as any),
  };
}
const props = { subjectId: "subject", orderId: "order" };

it("updates only validated owned lines while holding the cart lock", async () => {
  const f = fixture();
  await f.operation.execute({ ...props, lines: [{ id: "line", quantity: 4 }] });
  expect(f.repository.withSubjectLock).toHaveBeenCalledWith(
    { subjectId: "subject" },
    expect.any(Function),
  );
  expect(f.service.ecommerceModuleOrderAssertAccess).toHaveBeenCalledWith({
    ...props,
    lineIds: ["line"],
  });
  expect(
    f.service.ecommerceModule.ordersToProducts.update,
  ).toHaveBeenCalledWith({
    id: "line",
    data: { quantity: 4, selectionUpdatedAt: expect.any(Date) },
  });
});

it("deletes an empty-attempt cart through its owning service", async () => {
  const f = fixture();
  await f.operation.execute(props);
  expect(f.service.ecommerceModule.order.delete).toHaveBeenCalledWith({
    id: "order",
  });
});

it.each(["history", "paying", "shared", "payment"])(
  "refuses mutation after %s wins the cart race",
  async (change) => {
    const f = fixture();
    if (change === "history") {
      f.order.type = "history";
    }
    if (change === "paying") {
      f.order.status = "paying";
    }
    if (change === "shared") {
      f.owners.push({ subjectId: "other", ecommerceModuleOrderId: "order" });
    }
    if (change === "payment") {
      f.service.ecommerceModule.ordersToBillingModulePaymentIntents.find.mockResolvedValue(
        [{ billingModulePaymentIntentId: "intent" }],
      );
    }
    await expect(f.operation.execute(props)).rejects.toThrow();
    expect(f.service.ecommerceModule.order.delete).not.toHaveBeenCalled();
    expect(
      f.service.ecommerceModule.ordersToProducts.update,
    ).not.toHaveBeenCalled();
  },
);

it("rejects an invalid later quantity before the first line write", async () => {
  const f = fixture();
  await expect(
    f.operation.execute({
      ...props,
      lines: [
        { id: "line", quantity: 2 },
        { id: "line-2", quantity: 0 },
      ],
    }),
  ).rejects.toThrow("Quantity must be an integer");
  expect(
    f.service.ecommerceModule.ordersToProducts.update,
  ).not.toHaveBeenCalled();
});
