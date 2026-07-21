import * as pgCore from "drizzle-orm/pg-core";
export interface IConstraintColumns {
  chatId: pgCore.PgColumn;
  messageId: pgCore.PgColumn;
}
export function constraints(
  table: IConstraintColumns,
): pgCore.PgTableExtraConfigValue[] {
  return [
    pgCore
      .uniqueIndex("sl_chat_message_unique")
      .on(table.chatId, table.messageId),
  ];
}
