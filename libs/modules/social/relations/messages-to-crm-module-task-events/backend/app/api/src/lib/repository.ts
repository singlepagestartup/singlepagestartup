import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { DatabaseRepository } from "@sps/shared-backend-api";
import { Table } from "@sps/social/relations/messages-to-crm-module-task-events/backend/repository/database";
import { and, eq } from "drizzle-orm";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async updatePending(eventId: string, pending: boolean) {
    await this.db
      .update(Table)
      .set({ pending, updatedAt: new Date() })
      .where(
        and(eq(Table.crmModuleTaskEventId, eventId), eq(Table.pending, true)),
      );
  }
}
