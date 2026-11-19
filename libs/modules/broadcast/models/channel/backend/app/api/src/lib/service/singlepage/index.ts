import { createModule } from "../module";
import { createModules } from "@sps/broadcast/backend/app/api/src/lib/modules";
import { Service as DeliveryQueue } from "../startup/delivery-queue";
import { DeliveryRepository } from "../../repository/delivery";
import "reflect-metadata";
import { inject, injectable } from "inversify";
import {
  CRUDService,
  DI,
  type FindServiceProps,
} from "@sps/shared-backend-api";
import { Table } from "@sps/broadcast/models/channel/backend/repository/database";
import { Repository } from "../../repository";
import { ChannelDI } from "../../di";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  get module() {
    return this.appAssembly.getOrCreate(createModule);
  }

  readonly queue: DeliveryQueue;

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(ChannelDI.IDeliveryRepository)
    private readonly deliveryRepository: DeliveryRepository,
  ) {
    super(repository);
    this.queue = new DeliveryQueue(deliveryRepository);
  }
  findMessages(props: FindServiceProps) {
    return this.deliveryRepository.find(props);
  }

  transientChannelMessages(channelId: string) {
    return this.deliveryRepository.transientChannelMessages(channelId);
  }

  async deleteExpired() {
    await this.module.message.deleteExpired();
    let orphans = await this.deliveryRepository.deleteOrphanedDeliveries(100);
    while (orphans.length === 100) {
      orphans = await this.deliveryRepository.deleteOrphanedDeliveries(100);
    }
  }
}
