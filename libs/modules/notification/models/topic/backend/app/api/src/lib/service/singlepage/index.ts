import { createModule } from "../module";
import { createModules } from "@sps/notification/backend/app/api/src/lib/modules";
import "reflect-metadata";
import { Service as BoundedDelivery } from "../startup/bounded-delivery";
import type { ISendBoundedNotification } from "./bounded-delivery";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/notification/models/topic/backend/repository/database";

@injectable()
@injectFromBase()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  get module() {
    return this.appAssembly.getOrCreate(createModule);
  }

  async sendBounded(props: ISendBoundedNotification) {
    const delivery = new BoundedDelivery(this.module.notification);
    const result = await delivery.execute(props);
    return result;
  }
}
