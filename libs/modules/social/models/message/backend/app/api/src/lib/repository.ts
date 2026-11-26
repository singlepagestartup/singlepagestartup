import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { DatabaseRepository } from "@sps/shared-backend-api";
import { Table } from "@sps/social/models/message/backend/repository/database";
import { eq } from "drizzle-orm";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async bindWorkReply(
    id: string,
    key: string,
    interaction?: (typeof Table.$inferSelect)["interaction"],
  ) {
    await this.db
      .update(Table)
      .set({ workReplyKey: key, updatedAt: new Date(), interaction })
      .where(eq(Table.id, id));
  }
}
