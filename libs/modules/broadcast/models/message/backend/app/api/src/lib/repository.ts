import "reflect-metadata";
import { injectable } from "inversify";
import { asc, eq, inArray, isNotNull, lte } from "drizzle-orm";
import { DatabaseRepository } from "@sps/shared-backend-api";
import { Table } from "@sps/broadcast/models/message/backend/repository/database";

@injectable()
export class Repository extends DatabaseRepository<typeof Table> {
  protected override get readScope() {
    return isNotNull(Table.expiresAt);
  }
  async isDurable(id: string) {
    const [message] = await this.db
      .select({ expiresAt: Table.expiresAt })
      .from(Table)
      .where(eq(Table.id, id))
      .limit(1);
    return Boolean(message && message.expiresAt === null);
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
