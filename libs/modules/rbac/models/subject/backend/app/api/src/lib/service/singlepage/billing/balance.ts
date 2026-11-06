import type { Service as SubjectService } from "../index";

export interface IBalance {
  amount: string;
  currencyId: string | null;
}

export class Service {
  constructor(
    readonly service: Pick<
      SubjectService,
      "billingModule" | "subjectsToBillingModuleCurrencies"
    >,
  ) {}

  async execute(subjectId: string): Promise<IBalance> {
    const currencies = await this.service.billingModule.currency.find({
      params: {
        filters: { and: [{ column: "slug", method: "eq", value: "token" }] },
      },
    });
    const currency = currencies[0];
    if (!currency) return { amount: "0", currencyId: null };
    const balances = await this.service.subjectsToBillingModuleCurrencies.find({
      params: {
        filters: {
          and: [
            { column: "subjectId", method: "eq", value: subjectId },
            {
              column: "billingModuleCurrencyId",
              method: "eq",
              value: currency.id,
            },
          ],
        },
      },
    });
    const amount = balances.reduce(
      (sum, balance) => sum + Number(balance.amount),
      0,
    );
    if (!Number.isFinite(amount))
      throw new Error("Data integrity error. Invalid token balance");
    return {
      amount: String(amount),
      currencyId: currency.id,
    };
  }
}
