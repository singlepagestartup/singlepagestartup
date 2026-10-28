import { Service } from "./freeze-subscription-period";

describe("legacy subscription freeze ownership", () => {
  function fixture() {
    const freezeSubscriptionPeriod = jest
      .fn()
      .mockResolvedValue({ accepted: true });
    const service: any = {
      subjectsToEcommerceModuleOrders: {
        find: jest
          .fn()
          .mockResolvedValue([
            { subjectId: "subject", ecommerceModuleOrderId: "order" },
          ]),
      },
      subjectsToRoles: {
        find: jest
          .fn()
          .mockResolvedValue([{ subjectId: "subject", roleId: "role" }]),
      },
      rolesToEcommerceModuleProducts: {
        find: jest
          .fn()
          .mockResolvedValue([
            { roleId: "role", ecommerceModuleProductId: "product" },
          ]),
      },
      ecommerceModule: {
        order: {
          findByIdExtended: jest.fn().mockResolvedValue({
            ordersToProducts: [{ productId: "product" }],
          }),
          freezeSubscriptionPeriod,
        },
      },
    };
    return {
      service,
      action: new Service({ service }),
      freezeSubscriptionPeriod,
    };
  }
  const input = {
    id: "subject",
    ecommerceModuleOrderId: "order",
    data: { expectedUpdatedAt: "2026-10-22T10:00:00Z" },
  };
  it("passes only exact order and expected prior clock to the lower writer", async () => {
    const { action, freezeSubscriptionPeriod } = fixture();
    await action.execute(input);
    expect(freezeSubscriptionPeriod).toHaveBeenCalledWith({
      id: "order",
      expectedUpdatedAt: input.data.expectedUpdatedAt,
    });
  });
  it("rejects another subject's order", async () => {
    const { service, action, freezeSubscriptionPeriod } = fixture();
    service.subjectsToEcommerceModuleOrders.find.mockResolvedValue([
      { subjectId: "other", ecommerceModuleOrderId: "order" },
    ]);
    await expect(action.execute(input)).rejects.toThrow("does not belong");
    expect(freezeSubscriptionPeriod).not.toHaveBeenCalled();
  });
  it.each([
    { grants: [] },
    { grants: [{ subjectId: "other", roleId: "role" }] },
  ])(
    "does not backfill a missing or cross-account grant",
    async ({ grants }) => {
      const { service, action, freezeSubscriptionPeriod } = fixture();
      service.subjectsToRoles.find.mockResolvedValue(grants);
      await expect(action.execute(input)).rejects.toThrow(
        "current complete product grant",
      );
      expect(freezeSubscriptionPeriod).not.toHaveBeenCalled();
    },
  );
});
