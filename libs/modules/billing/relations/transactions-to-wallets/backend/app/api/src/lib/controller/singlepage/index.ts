import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import type { IModel } from "@sps/billing/relations/transactions-to-wallets/sdk/model";
import { Service } from "../../service";

// Only subject-scoped operations may read or mutate these records.
@injectable()
export class Controller extends RESTController<IModel> {
  constructor(@inject(DI.IService) service: Service) {
    super(service);
    this.bindHttpRoutes([]);
  }
}
