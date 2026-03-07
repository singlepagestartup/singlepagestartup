import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/crm/models/form/backend/repository/database";
import { Repository } from "../../repository";
import { FormDI, type INotificationModule } from "../../di";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  notificationModule: INotificationModule;

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(FormDI.INotificationModule) notificationModule: INotificationModule,
  ) {
    super(repository);
    this.notificationModule = notificationModule;
  }
}
