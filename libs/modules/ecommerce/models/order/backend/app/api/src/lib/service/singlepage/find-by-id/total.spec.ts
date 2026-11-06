import { Service } from "./total";
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "test-secret",
}));
function fixture(
  results: Record<
    string,
    {
      totals: { total: number; billingModuleCurrency: { id: string } }[];
      unpriced: unknown[];
    }
  >,
) {
  return new Service(
    { find: async () => [{ id: "price" }] } as any,
    {
      find: async () => Object.keys(results).map((id) => ({ id })),
      getTotal: async ({ id }: { id: string }) => results[id],
    } as any,
  );
}
it("offers only currencies priced for every product line", async () => {
  const service = fixture({
    first: {
      totals: [
        { total: 10, billingModuleCurrency: { id: "usd" } },
        { total: 100, billingModuleCurrency: { id: "rub" } },
      ],
      unpriced: [],
    },
    second: {
      totals: [{ total: 50, billingModuleCurrency: { id: "rub" } }],
      unpriced: [],
    },
  });
  const result = await service.execute({ id: "order" });
  expect(result.availableCurrencyIds).toEqual(["rub"]);
  expect(result.totals.map((entry) => entry.total)).toEqual([10, 100, 50]);
});
it("does not offer a partially priced currency when one line has no price", async () => {
  const service = fixture({
    first: {
      totals: [{ total: 100, billingModuleCurrency: { id: "rub" } }],
      unpriced: [],
    },
    second: { totals: [], unpriced: [{ productId: "missing" }] },
  });
  const result = await service.execute({ id: "order" });
  expect(result.availableCurrencyIds).toEqual([]);
  expect(result.unpriced).toHaveLength(1);
});
