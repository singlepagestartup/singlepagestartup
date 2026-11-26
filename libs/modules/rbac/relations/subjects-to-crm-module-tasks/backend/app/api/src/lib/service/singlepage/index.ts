import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/relations/subjects-to-crm-module-tasks/backend/repository/database";
import type { Repository } from "../../repository";

@injectable()
@injectFromBase()
export class Service extends CRUDService<typeof Table.$inferSelect> {
  declare repository: Repository;

  async getForTasks(taskIds: string[]) {
    const rows = await this.repository.participants(taskIds);
    const participants = new Map<
      string,
      { customerId: string; assigneeId: string | null }
    >();
    for (const row of rows) {
      if (row.role === "customer") {
        participants.set(row.taskId, {
          customerId: row.subjectId,
          assigneeId: null,
        });
      }
    }
    for (const row of rows) {
      const task = participants.get(row.taskId);
      if (task && row.role === "assignee") {
        task.assigneeId = row.subjectId;
      }
    }
    return participants;
  }

  async listTaskIds(filter: { customerId?: string; assigneeId?: string }) {
    const rows = await this.repository.taskIds(filter);
    const customers = new Set(
      rows.filter((row) => row.role === "customer").map((row) => row.taskId),
    );
    const assignees = new Set(
      rows.filter((row) => row.role === "assignee").map((row) => row.taskId),
    );
    if (filter.customerId && filter.assigneeId) {
      return [...customers].filter((id) => assignees.has(id));
    }
    return [...new Set(rows.map((row) => row.taskId))];
  }

  setCustomer(taskId: string, customerId: string) {
    return this.repository.assign(taskId, "customer", customerId);
  }

  setAssignee(taskId: string, assigneeId: string | null) {
    return this.repository.assign(taskId, "assignee", assigneeId);
  }
}
