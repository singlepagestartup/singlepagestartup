import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  consistencyContext,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import { eq } from "drizzle-orm";
import { Table } from "@sps/billing/models/invoice/backend/repository/database";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async lockForSettlement(id: string) {
    if (!consistencyContext.getStore()?.database) {
      throw new Error("Invoice settlement lock requires an owner transaction");
    }
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "id", method: "eq", value: id }],
    });
    await this.db
      .select({ id: Table.id })
      .from(Table)
      .where(eq(Table.id, id))
      .for("update");
  }
}
