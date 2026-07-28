import * as pgCore from "drizzle-orm/pg-core";
export interface IConstraintColumns {
  threadId: pgCore.PgColumn;
  messageId: pgCore.PgColumn;
}
export function constraints(
  table: IConstraintColumns,
): pgCore.PgTableExtraConfigValue[] {
  return [
    pgCore
      .uniqueIndex("sl_thread_message_unique")
      .on(table.threadId, table.messageId),
  ];
}
