import type { Repository } from "../../repository";
import "reflect-metadata";
import { inject, injectable } from "inversify";
import {
  CRUDService,
  DI,
  withConsistencySnapshot,
} from "@sps/shared-backend-api";
import type { ISelectSchema } from "@sps/broadcast/relations/channels-to-messages/backend/repository/database";
import { ChannelsToMessagesDI, type IMessageService } from "../../di";

@injectable()
export class Service extends CRUDService<ISelectSchema> {
  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(ChannelsToMessagesDI.IMessageService)
    private readonly messages: IMessageService,
  ) {
    super(repository);
  }

  findWithMessage(id: string) {
    return withConsistencySnapshot(async () => {
      const relation = await this.findById({ id });
      if (!relation) {
        return null;
      }

      const message = await this.messages.findPayloadById({
        id: relation.messageId,
      });
      if (!message) {
        return null;
      }

      return { relation, message };
    });
  }
}
