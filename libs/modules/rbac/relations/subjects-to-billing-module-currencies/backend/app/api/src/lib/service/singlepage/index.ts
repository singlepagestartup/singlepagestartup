import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/repository/database";

export interface IUpdateAmountIfUnchangedProps {
  id: string;
  expectedAmount: string;
  amount: string;
}

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  async updateAmountIfUnchanged(
    props: IUpdateAmountIfUnchangedProps,
  ): Promise<(typeof Table)["$inferSelect"] | undefined> {
    return this.repository.consumeFirstByField(
      "id",
      props.id,
      { amount: props.amount },
      {
        and: [{ column: "amount", method: "eq", value: props.expectedAmount }],
      },
    );
  }
}
