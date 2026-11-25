import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import type { IModel } from "@sps/billing/relations/wallets-to-currencies/sdk/model";
import { Repository } from "../../repository";

@injectable()
export class Service extends CRUDService<IModel> {
  declare repository: Repository;

  constructor(@inject(DI.IRepository) repository: Repository) {
    super(repository);
  }
  total(walletId: string, currencyId: string) {
    return this.repository.total(walletId, currencyId);
  }

  applyDelta(walletId: string, currencyId: string, delta: string) {
    return this.repository.applyDelta(walletId, currencyId, delta);
  }
}
