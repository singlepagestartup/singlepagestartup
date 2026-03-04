import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/broadcast/models/channel/backend/repository/database";
import { Repository } from "../../repository";
import { Service as MessageService } from "@sps/broadcast/models/message/backend/app/api/src/lib/service/singlepage";
import { Service as ChannelsToMessagesService } from "@sps/broadcast/relations/channels-to-messages/backend/app/api/src/lib/service/singlepage";
import { ChannelDI } from "../../di";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  messages: MessageService;
  channelsToMessages: ChannelsToMessagesService;

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(ChannelDI.IMessageService) messages: MessageService,
    @inject(ChannelDI.IChannelsToMessagesService)
    channelsToMessages: ChannelsToMessagesService,
  ) {
    super(repository);
    this.messages = messages;
    this.channelsToMessages = channelsToMessages;
  }
}
