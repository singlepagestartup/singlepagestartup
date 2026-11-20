import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { DatabaseRepository } from "@sps/shared-backend-api";
import { Table } from "@sps/social/relations/messages-to-crm-module-task-events/backend/repository/database";
import { Table as TaskEvent } from "@sps/crm/models/task-event/backend/repository/database";
import { Table as Task } from "@sps/crm/models/task/backend/repository/database";
import { and, asc, eq, lt, notExists } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async pendingHeads(limit: number, taskId?: string) {
    const earlierMessage = alias(Table, "earlier_work_message");
    const earlierEvent = alias(TaskEvent, "earlier_work_event");
    const earlierPending = this.db
      .select({ id: earlierMessage.id })
      .from(earlierMessage)
      .innerJoin(
        earlierEvent,
        eq(earlierEvent.id, earlierMessage.crmModuleTaskEventId),
      )
      .where(
        and(
          eq(earlierMessage.pending, true),
          eq(earlierEvent.taskId, TaskEvent.taskId),
          eq(earlierEvent.assignmentRevision, TaskEvent.assignmentRevision),
          lt(earlierEvent.revision, TaskEvent.revision),
        ),
      );

    return this.db
      .select({ crmModuleTaskEventId: Table.crmModuleTaskEventId })
      .from(Table)
      .innerJoin(TaskEvent, eq(TaskEvent.id, Table.crmModuleTaskEventId))
      .innerJoin(Task, eq(Task.id, TaskEvent.taskId))
      .where(
        and(
          eq(Table.pending, true),
          taskId
            ? and(
                eq(Task.id, taskId),
                eq(Task.assignmentRevision, TaskEvent.assignmentRevision),
              )
            : undefined,
          notExists(earlierPending),
        ),
      )
      .orderBy(asc(Table.updatedAt), asc(Table.id))
      .limit(limit);
  }

  async updatePending(eventId: string, pending: boolean) {
    await this.db
      .update(Table)
      .set({ pending, updatedAt: new Date() })
      .where(
        and(eq(Table.crmModuleTaskEventId, eventId), eq(Table.pending, true)),
      );
  }
}
