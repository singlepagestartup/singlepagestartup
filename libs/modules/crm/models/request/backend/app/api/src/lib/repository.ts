import "reflect-metadata";
import { injectable } from "inversify";
import { DatabaseRepository } from "@sps/shared-backend-api";
import { sql } from "drizzle-orm";
import { Table } from "@sps/crm/models/request/backend/repository/database";

@injectable()
export class Repository extends DatabaseRepository<typeof Table> {
  transaction<T>(operation: (tx: typeof this.db) => Promise<T>) {
    return this.db.transaction(operation);
  }
  async lockSubmission(key: string) {
    await this.db.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${key}))`);
  }
}
