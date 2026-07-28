import { sql } from "drizzle-orm";
import * as pgCore from "drizzle-orm/pg-core";

export interface IConstraintColumns {
  chatId: pgCore.PgColumn;
  threadId: pgCore.PgColumn;
  variant: pgCore.PgColumn;
}

export function constraints(
  table: IConstraintColumns,
): pgCore.PgTableExtraConfigValue[] {
  return [
    pgCore
      .uniqueIndex("sl_chat_thread_unique")
      .on(table.chatId, table.threadId),
    pgCore
      .uniqueIndex("sl_chat_default_thread_unique")
      .on(table.chatId)
      .where(sql`${table.variant} = 'default'`),
  ];
}
