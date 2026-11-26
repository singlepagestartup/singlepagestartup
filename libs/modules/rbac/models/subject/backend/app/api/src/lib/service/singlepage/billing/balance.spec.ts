import { Service } from "./balance";

it("reads the subject's wallet and preserves the currency's full decimal precision", async () => {
  const amount = "999999999999999999.123456789123";
  const defaultWallet = jest.fn().mockResolvedValue("wallet");
  const total = jest.fn().mockResolvedValue(amount);
  const service = new Service({
    module: { subjectsToBillingModuleWallets: { defaultWallet } },
    modules: {
      billing: {
        currency: { find: jest.fn().mockResolvedValue([{ id: "token" }]) },
        walletsToCurrencies: { total },
      },
    },
  } as never);
  await expect(service.execute("owner")).resolves.toEqual({
    amount,
    currencyId: "token",
  });
  expect(defaultWallet).toHaveBeenCalledWith("owner");
  expect(total).toHaveBeenCalledWith("wallet", "token");
  defaultWallet.mockResolvedValue(undefined);
  await expect(service.execute("new")).resolves.toEqual({
    amount: "0",
    currencyId: "token",
  });
  expect(total).toHaveBeenCalledTimes(1);
});
