import { Service } from "./access";
describe("Current Subject cart ownership", () => {
  function setup() {
    return {
      subjectsToOrders: {
        find: jest
          .fn()
          .mockResolvedValue([
            { subjectId: "me", ecommerceModuleOrderId: "mine" },
          ]),
      },
      ordersToProducts: {
        find: jest.fn().mockResolvedValue([{ id: "my-line", orderId: "mine" }]),
      },
    };
  }
  it("rejects another subject order before loading its lines", async () => {
    const dependencies = setup();
    await expect(
      new Service(dependencies as any).execute({
        subjectId: "me",
        orderId: "other",
        lineIds: ["other-line"],
      }),
    ).rejects.toThrow("does not belong");
    expect(dependencies.ordersToProducts.find).not.toHaveBeenCalled();
  });
  it("rejects a foreign line even when the enclosing order belongs to the caller", async () => {
    const dependencies = setup();
    await expect(
      new Service(dependencies as any).execute({
        subjectId: "me",
        orderId: "mine",
        lineIds: ["other-line"],
      }),
    ).rejects.toThrow("Order line");
  });
  it("accepts only lines of the owned order", async () => {
    await expect(
      new Service(setup() as any).execute({
        subjectId: "me",
        orderId: "mine",
        lineIds: ["my-line"],
      }),
    ).resolves.toBeUndefined();
  });
});
