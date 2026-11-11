import { DeliveryQueue } from "./delivery-queue";
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
import { Service as MessageService } from "@sps/broadcast/models/message/backend/app/api/src/lib/service/singlepage";
import { Service as ChannelsToMessagesService } from "@sps/broadcast/relations/channels-to-messages/backend/app/api/src/lib/service/singlepage";
import { ChannelDI } from "../../di";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  readonly queue: DeliveryQueue;
  messages: MessageService;
  channelsToMessages: ChannelsToMessagesService;

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(ChannelDI.IMessageService) messages: MessageService,
    @inject(ChannelDI.IChannelsToMessagesService)
    channelsToMessages: ChannelsToMessagesService,
    @inject(ChannelDI.IDeliveryRepository)
    private readonly deliveryRepository: DeliveryRepository,
  ) {
    super(repository);
    this.queue = new DeliveryQueue(deliveryRepository);
    this.messages = messages;
    this.channelsToMessages = channelsToMessages;
  }
  findMessages(props: FindServiceProps) {
    return this.deliveryRepository.find(props);
  }

  transientChannelMessages(channelId: string) {
    return this.deliveryRepository.transientChannelMessages(channelId);
  }

  async deleteExpired() {
    await this.messages.deleteExpired();
    let orphans = await this.deliveryRepository.deleteOrphanedDeliveries(100);
    while (orphans.length === 100) {
      orphans = await this.deliveryRepository.deleteOrphanedDeliveries(100);
    }
  }
}
