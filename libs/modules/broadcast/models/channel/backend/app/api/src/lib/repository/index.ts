import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { Table as Message } from "@sps/broadcast/models/message/backend/repository/database";
import { Table as ChannelMessage } from "@sps/broadcast/relations/channels-to-messages/backend/repository/database";
import {
  DatabaseRepository,
  withConsistencyDatabase,
} from "@sps/shared-backend-api";
import { Table } from "@sps/broadcast/models/channel/backend/repository/database";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  override async deleteFirstByField(field: string, value: unknown) {
    return this.db.transaction((tx) =>
      withConsistencyDatabase(tx, async () => {
        const channel = await this.findFirstByField(field, value);
        if (!channel) {
          return;
        }
        // An incoming delivery must finish linking before deletion, or fail its FK.
        await tx
          .select({ id: Table.id })
          .from(Table)
          .where(eq(Table.id, channel.id))
          .for("update");
        const owned = tx
          .select({ id: ChannelMessage.messageId })
          .from(ChannelMessage)
          .where(
            and(
              eq(ChannelMessage.channelId, channel.id),
              isNotNull(ChannelMessage.deliveryKey),
            ),
          );
        await tx.delete(Message).where(inArray(Message.id, owned));
        return super.deleteFirstByField("id", channel.id);
      }),
    );
  }
}
