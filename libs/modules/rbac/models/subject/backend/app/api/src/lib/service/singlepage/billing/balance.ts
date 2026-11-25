import type { SubjectServiceDependencies } from "../index";

export interface IBalance {
  amount: string;
  currencyId: string | null;
}

export class Service {
  constructor(readonly service: SubjectServiceDependencies) {}

  async execute(subjectId: string): Promise<IBalance> {
    const currencies = await this.service.modules.billing.currency.find({
      params: {
        filters: { and: [{ column: "slug", method: "eq", value: "token" }] },
      },
    });
    const currency = currencies[0];
    if (!currency) {
      return { amount: "0", currencyId: null };
    }
    const wallet =
      await this.service.module.subjectsToBillingModuleWallets.defaultWallet(
        subjectId,
      );
    const amount = wallet
      ? await this.service.modules.billing.walletsToCurrencies.total(
          wallet,
          currency.id,
        )
      : "0";
    return { amount, currencyId: currency.id };
  }
}
