import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import type { IModel } from "@sps/rbac/relations/subjects-to-billing-module-wallets/sdk/model";
import { Repository } from "../../repository";

@injectable()
export class Service extends CRUDService<IModel> {
  declare repository: Repository;

  constructor(@inject(DI.IRepository) repository: Repository) {
    super(repository);
  }
  defaultWallet(subjectId: string) {
    return this.repository.defaultWallet(subjectId);
  }

  ensureDefaultWallet(subjectId: string) {
    return this.repository.ensureDefaultWallet(subjectId);
  }
}
