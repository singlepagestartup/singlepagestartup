import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  trackRepositoryRead,
  consistencyContext,
  withConsistencyDatabase,
} from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/models/order/backend/repository/database";
import { eq } from "drizzle-orm";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  withLifecycleLock<T>(
    id: string,
    operation: () => Promise<T>,
    mode: "update" | "no key update" = "update",
  ): Promise<T> {
    const run = async () => {
      await this.lockForLifecycle({ id, mode });
      return operation();
    };
    if (consistencyContext.getStore()?.database) {
      return run();
    }
    return this.db.transaction((tx) => withConsistencyDatabase(tx, run));
  }

  async lockForLifecycle(props: {
    id: string;
    mode?: "update" | "no key update";
  }) {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "id", method: "eq", value: props.id }],
    });
    return this.db
      .select({ id: Table.id })
      .from(Table)
      .where(eq(Table.id, props.id))
      .for(props.mode ?? "update");
  }
}
