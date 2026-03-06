import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/social/models/chat/backend/repository/database";
import { Repository } from "../../repository";
import { Service as MessageService } from "@sps/social/models/message/backend/app/api/src/lib/service";
import { Service as ChatsToMessagesService } from "@sps/social/relations/chats-to-messages/backend/app/api/src/lib/service";
import { ChatDI } from "../../di";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  message: MessageService;
  chatsToMessages: ChatsToMessagesService;

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(ChatDI.IMessagesService) message: MessageService,
    @inject(ChatDI.IChatsToMessagesService)
    chatsToMessages: ChatsToMessagesService,
  ) {
    super(repository);
    this.message = message;
    this.chatsToMessages = chatsToMessages;
  }
}
