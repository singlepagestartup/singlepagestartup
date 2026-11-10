import {
  Table as Message,
  selectSchema as messageSchema,
} from "@sps/broadcast/models/message/backend/repository/database";
import "reflect-metadata";
import { and, eq, isNull } from "drizzle-orm";
import { injectable } from "inversify";
import {
  DatabaseRepository,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import {
  Table,
  selectSchema,
} from "@sps/broadcast/relations/channels-to-messages/backend/repository/database";

@injectable()
export class Repository extends DatabaseRepository<typeof Table> {
  async findWithMessage(id: string) {
    await this.trackRead({ and: [{ column: "id", method: "eq", value: id }] });
    const [row] = await this.db
      .select({ relation: Table, message: Message })
      .from(Table)
      .innerJoin(Message, eq(Message.id, Table.messageId))
      .where(and(eq(Table.id, id), this.readScope))
      .limit(1);
    if (!row) {
      return null;
    }
    await trackRepositoryRead(Message, this.db, {
      and: [{ column: "id", method: "eq", value: row.message.id }],
    });
    return {
      relation: selectSchema.parse(row.relation),
      message: messageSchema.parse(row.message),
    };
  }

  protected override get readScope() {
    return eq(Table.feedVisible, true);
  }

  protected override get writeScope() {
    return isNull(Table.deliveryKey);
  }
}
