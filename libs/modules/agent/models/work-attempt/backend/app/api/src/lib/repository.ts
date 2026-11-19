import "reflect-metadata";
import { injectable, injectFromBase } from "inversify";
import { sql } from "drizzle-orm";
import {
  DatabaseRepository,
  consistencyContext,
  withConsistencyDatabase,
} from "@sps/shared-backend-api";
import { Table } from "@sps/agent/models/work-attempt/backend/repository/database";
@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async atomic<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const run = async () => {
      await this.db.execute(
        sql`select pg_advisory_xact_lock(hashtext(${"agent.work:" + key}))`,
      );
      return operation();
    };
    if (consistencyContext.getStore()?.database) return run();
    return this.db.transaction((tx) => withConsistencyDatabase(tx, run));
  }
}
