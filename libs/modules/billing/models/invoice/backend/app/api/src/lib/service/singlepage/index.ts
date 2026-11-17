import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/billing/models/invoice/backend/repository/database";
import { moneyNumber } from "@sps/backend-utils";
import type { Repository } from "../../repository";

@injectable()
@injectFromBase()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  declare repository: Repository;

  private normalizeAmount<T extends Record<string, unknown>>(data: T) {
    if (data.amount === undefined) {
      return { ...data };
    }
    return { ...data, amount: moneyNumber(data.amount as string | number) };
  }

  protected override insert(data: Record<string, unknown>) {
    if (data.createdAt !== undefined) {
      throw new Error("Validation error. Invoice createdAt is server assigned");
    }
    return super.insert(this.normalizeAmount(data));
  }

  override async update(props: {
    id: string;
    data: Partial<typeof Table.$inferSelect>;
  }) {
    const data = this.normalizeAmount(props.data);
    if (data.createdAt !== undefined) {
      const invoice = await this.findById({ id: props.id });
      if (
        !invoice ||
        data.createdAt == null ||
        new Date(data.createdAt).getTime() !==
          new Date(invoice.createdAt).getTime()
      ) {
        throw new Error("Validation error. Invoice createdAt is immutable");
      }
      delete data.createdAt;
    }
    return super.update({
      id: props.id,
      data,
    });
  }

  lockForSettlement(id: string) {
    return this.repository.lockForSettlement(id);
  }

  async failOpenInvoice(id: string) {
    return this.repository.consumeFirstByField(
      "id",
      id,
      { status: "failed" },
      {
        and: [{ column: "status", method: "eq", value: "open" }],
      },
    );
  }
}
