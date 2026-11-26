import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { DatabaseRepository } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/relations/subjects-to-crm-module-tasks/backend/repository/database";
import { type SQL, and, eq, inArray, or } from "drizzle-orm";

type ParticipantRole = "customer" | "assignee";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async participants(taskIds: string[]) {
    if (!taskIds.length) {
      return [];
    }
    await this.trackRead({
      and: [{ column: "crmModuleTaskId", method: "inArray", value: taskIds }],
    });
    return this.db
      .select({
        taskId: Table.crmModuleTaskId,
        subjectId: Table.subjectId,
        role: Table.variant,
      })
      .from(Table)
      .where(inArray(Table.crmModuleTaskId, taskIds));
  }

  async taskIds(filter: { customerId?: string; assigneeId?: string }) {
    const conditions: (SQL | undefined)[] = [];
    for (const [variant, id] of [
      ["customer", filter.customerId],
      ["assignee", filter.assigneeId],
    ] as const) {
      if (id) {
        conditions.push(
          and(eq(Table.variant, variant), eq(Table.subjectId, id)),
        );
        await this.trackRead({
          and: [{ column: "subjectId", method: "eq", value: id }],
        });
      }
    }
    return this.db
      .select({ taskId: Table.crmModuleTaskId, role: Table.variant })
      .from(Table)
      .where(or(...conditions));
  }

  async assign(
    taskId: string,
    variant: ParticipantRole,
    subjectId: string | null,
  ) {
    if (!subjectId) {
      await this.db
        .delete(Table)
        .where(
          and(eq(Table.crmModuleTaskId, taskId), eq(Table.variant, variant)),
        );
      return;
    }
    await this.db
      .insert(Table)
      .values({ crmModuleTaskId: taskId, variant, subjectId })
      .onConflictDoUpdate({
        target: [Table.crmModuleTaskId, Table.variant],
        set: { subjectId, updatedAt: new Date() },
      });
  }
}
