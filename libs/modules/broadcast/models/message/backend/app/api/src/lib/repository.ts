import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { asc, inArray, isNotNull, lte } from "drizzle-orm";
import { DatabaseRepository } from "@sps/shared-backend-api";
import { Table } from "@sps/broadcast/models/message/backend/repository/database";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  protected override get readScope() {
    return isNotNull(Table.expiresAt);
  }
  async deleteExpired(limit: number, before: Date) {
    const expired = this.db
      .select({ id: Table.id })
      .from(Table)
      .where(lte(Table.expiresAt, before))
      .orderBy(asc(Table.expiresAt))
      .limit(limit)
      .for("update", { skipLocked: true });
    return this.db
      .delete(Table)
      .where(inArray(Table.id, expired))
      .returning({ id: Table.id });
  }
}
