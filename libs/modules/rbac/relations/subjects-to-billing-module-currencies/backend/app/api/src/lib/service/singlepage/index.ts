import { createModules } from "@sps/rbac/backend/app/api/src/lib/modules";
import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/repository/database";

import { Repository } from "../../repository";

export interface IUpdateAmountIfUnchangedProps {
  id: string;
  expectedAmount: string;
  amount: string;
}

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  declare repository: Repository;

  constructor(@inject(DI.IRepository) repository: Repository) {
    super(repository);
  }

  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  total(subjectId: string, currencyId: string) {
    return this.repository.total(subjectId, currencyId);
  }

  applyDelta(subjectId: string, currencyId: string, delta: string) {
    return this.repository.applyDelta(subjectId, currencyId, delta);
  }

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
