import { Service } from "./balance";

it("reads only the requesting Subject's token balance", async () => {
  const currency = { find: jest.fn().mockResolvedValue([{ id: "tokens" }]) };
  const balances = { find: jest.fn().mockResolvedValue([{ amount: "3000" }]) };
  const service = new Service({
    billingModule: { currency },
    subjectsToBillingModuleCurrencies: balances,
  } as any);
  expect(await service.execute("owner")).toEqual({
    amount: "3000",
    currencyId: "tokens",
  });
  expect(balances.find).toHaveBeenCalledWith({
    params: {
      filters: {
        and: [
          { column: "subjectId", method: "eq", value: "owner" },
          { column: "billingModuleCurrencyId", method: "eq", value: "tokens" },
        ],
      },
    },
  });
});

it("returns zero for an empty balance without fetching another Subject", async () => {
  const balances = { find: jest.fn().mockResolvedValue([]) };
  const service = new Service({
    billingModule: {
      currency: { find: jest.fn().mockResolvedValue([{ id: "tokens" }]) },
    },
    subjectsToBillingModuleCurrencies: balances,
  } as any);
  expect(await service.execute("new-user")).toEqual({
    amount: "0",
    currencyId: "tokens",
  });
  expect(balances.find).toHaveBeenCalledTimes(1);
});

it("shows the whole token balance when older deliveries created more than one relation", async () => {
  const service = new Service({
    billingModule: {
      currency: { find: jest.fn().mockResolvedValue([{ id: "tokens" }]) },
    },
    subjectsToBillingModuleCurrencies: {
      find: jest.fn().mockResolvedValue([{ amount: "2982" }, { amount: "8" }]),
    },
  } as any);
  expect(await service.execute("owner")).toEqual({
    amount: "2990",
    currencyId: "tokens",
  });
});
