import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { and, eq } from "drizzle-orm";
import { Table as Funnel } from "@sps/crm/models/funnel/backend/repository/database";
import { Table as Task } from "@sps/crm/models/task/backend/repository/database";
import {
  DatabaseRepository,
  trackRepositoryRead,
  withConsistencyTransaction,
} from "@sps/shared-backend-api";
import { Table } from "@sps/crm/relations/funnels-to-tasks/backend/repository/database";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  transaction<T>(operation: () => Promise<T>) {
    return withConsistencyTransaction(this.db, operation);
  }

  async lockTask(taskId: string) {
    const [task] = await this.db
      .select({ id: Task.id })
      .from(Task)
      .where(eq(Task.id, taskId))
      .for("update");
    if (!task) {
      throw new Error("Not Found error. Task does not exist");
    }
  }

  async lockLink(id: string) {
    const [link] = await this.db
      .select({ variant: Table.variant })
      .from(Table)
      .where(eq(Table.id, id))
      .for("update");
    return link;
  }

  async primary(taskId: string) {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "taskId", method: "eq", value: taskId }],
    });
    await trackRepositoryRead(Funnel, this.db);
    const [row] = await this.db
      .select({ storeId: Funnel.storeId })
      .from(Table)
      .innerJoin(Funnel, eq(Funnel.id, Table.funnelId))
      .where(and(eq(Table.taskId, taskId), eq(Table.variant, "primary")));
    return row;
  }

  async funnelStore(funnelId: string) {
    await trackRepositoryRead(Funnel, this.db, {
      and: [{ column: "id", method: "eq", value: funnelId }],
    });
    const [funnel] = await this.db
      .select({ storeId: Funnel.storeId })
      .from(Funnel)
      .where(eq(Funnel.id, funnelId));
    return funnel?.storeId;
  }
}
