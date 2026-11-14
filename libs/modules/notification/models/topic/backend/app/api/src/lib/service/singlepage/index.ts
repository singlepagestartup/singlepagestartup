import "reflect-metadata";
import {
  Service as BoundedDelivery,
  type ISendBoundedNotification,
} from "./bounded-delivery";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/notification/models/topic/backend/repository/database";
import { Repository } from "../../repository";
import { TopicDI, type INotificationModule } from "../../di";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  notificationModule: INotificationModule;

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(TopicDI.INotificationModule)
    notificationModule: INotificationModule,
  ) {
    super(repository);
    this.notificationModule = notificationModule;
  }
  async sendBounded(props: ISendBoundedNotification) {
    const delivery = new BoundedDelivery(this.notificationModule.notification);
    const result = await delivery.execute(props);
    return result;
  }
}
