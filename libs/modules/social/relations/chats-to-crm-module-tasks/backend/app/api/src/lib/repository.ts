import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import { Table } from "@sps/social/relations/chats-to-crm-module-tasks/backend/repository/database";
import { Table as ChatThread } from "@sps/social/relations/chats-to-threads/backend/repository/database";
import { ORDER_SUPPORT_THREAD_VARIANT } from "@sps/social/relations/chats-to-threads/sdk/model";
import { Table as Task } from "@sps/crm/models/task/backend/repository/database";
import { and, asc, desc, eq, getTableColumns, inArray, ne } from "drizzle-orm";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async channels(scope: {
    taskId?: string;
    threadIds?: string[];
    chatId?: string;
  }) {
    if (scope.threadIds && !scope.threadIds.length) {
      return [];
    }
    await this.trackRead(
      scope.taskId
        ? {
            and: [
              { column: "crmModuleTaskId", method: "eq", value: scope.taskId },
            ],
          }
        : {},
    );
    await trackRepositoryRead(
      ChatThread,
      this.db,
      scope.threadIds
        ? {
            and: [
              { column: "threadId", method: "inArray", value: scope.threadIds },
            ],
          }
        : {},
    );
    await trackRepositoryRead(
      Task,
      this.db,
      scope.taskId
        ? { and: [{ column: "id", method: "eq", value: scope.taskId }] }
        : {},
    );
    return this.db
      .select({
        ...getTableColumns(Table),
        threadId: ChatThread.threadId,
        openingKey: Task.openingKey,
      })
      .from(Table)
      .innerJoin(ChatThread, eq(ChatThread.chatId, Table.chatId))
      .innerJoin(Task, eq(Task.id, Table.crmModuleTaskId))
      .where(
        and(
          ne(ChatThread.variant, ORDER_SUPPORT_THREAD_VARIANT),
          scope.taskId ? eq(Table.crmModuleTaskId, scope.taskId) : undefined,
          scope.threadIds
            ? inArray(ChatThread.threadId, scope.threadIds)
            : undefined,
          scope.chatId ? eq(Table.chatId, scope.chatId) : undefined,
        ),
      )
      .orderBy(
        desc(eq(ChatThread.variant, "default")),
        asc(ChatThread.orderIndex),
        asc(ChatThread.createdAt),
        asc(ChatThread.id),
      );
  }
}
