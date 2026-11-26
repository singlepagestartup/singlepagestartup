import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import type { IModel } from "@sps/billing/relations/transactions-to-wallets/sdk/model";
import { Repository } from "../../repository";

@injectable()
export class Service extends CRUDService<IModel> {
  declare repository: Repository;

  constructor(@inject(DI.IRepository) repository: Repository) {
    super(repository);
  }
}
