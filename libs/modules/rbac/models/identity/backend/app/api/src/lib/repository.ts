import "reflect-metadata";
import { and, eq } from "drizzle-orm";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/identity/backend/repository/database";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  protected override get readScope() {
    return eq(Table.usage, "inbound");
  }

  async outboundProvider(id: string) {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "id", method: "eq", value: id }],
    });
    const [identity] = await this.db
      .select({ provider: Table.provider })
      .from(Table)
      .where(and(eq(Table.id, id), eq(Table.usage, "outbound_api")));
    return identity;
  }
}
