jest.mock("@sps/shared-utils", () => ({ RBAC_SECRET_KEY: "test-key" }));
jest.mock("@sps/backend-utils", () => ({
  getHttpErrorType: (error: Error) => ({ status: 500, message: error.message }),
  logger: { info: jest.fn() },
}));

import { Handler } from "./delete-canceled";

it("excludes recoverable payment cancellations and delegates deletion to the locked Order capability", async () => {
  const find = jest.fn().mockResolvedValue([{ id: "old-canceled" }]);
  const remove = jest.fn().mockResolvedValue(undefined);
  const service = {
    ecommerceModule: { order: { find, deleteCanceledWithoutPayment: remove } },
  };
  await new Handler(service as any).execute(
    { json: (value: unknown) => value } as any,
    undefined,
  );
  expect(find).toHaveBeenCalledWith({
    params: {
      filters: {
        and: [
          { column: "status", method: "eq", value: "canceled" },
          { column: "paymentFailureCanceledAt", method: "isNull", value: null },
          { column: "createdAt", method: "lt", value: expect.any(String) },
        ],
      },
    },
  });
  expect(remove).toHaveBeenCalledWith({
    id: "old-canceled",
    createdBefore: expect.any(Date),
  });
});
