import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/social/relations/chats-to-crm-module-tasks/backend/repository/database";
import { isStoreEmployeeTraining } from "@sps/crm/models/task/sdk/model";
import type { Repository } from "../../repository";

@injectable()
@injectFromBase()
export class Service extends CRUDService<typeof Table.$inferSelect> {
  declare repository: Repository;

  async channels(scope: {
    taskId?: string;
    threadIds?: string[];
    chatId?: string;
  }) {
    const rows = await this.repository.channels(scope);
    return rows.filter(({ openingKey, threadId }) => {
      if (
        isStoreEmployeeTraining(openingKey) ||
        openingKey.startsWith("channel-intake:")
      ) {
        return openingKey.split(":")[1] === threadId;
      }
      return true;
    });
  }

  async forThread(threadId: string, chatId?: string) {
    const rows = await this.channels({ threadIds: [threadId], chatId });
    if (rows.length > 1) {
      throw new Error(
        "Conflict error. More than one task owns this conversation",
      );
    }
    return rows[0];
  }
}
