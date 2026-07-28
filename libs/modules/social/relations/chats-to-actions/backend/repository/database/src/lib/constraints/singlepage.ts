import * as pgCore from "drizzle-orm/pg-core";
export interface IConstraintColumns {
  chatId: pgCore.PgColumn;
  actionId: pgCore.PgColumn;
}
export function constraints(
  table: IConstraintColumns,
): pgCore.PgTableExtraConfigValue[] {
  return [
    pgCore
      .uniqueIndex("sl_chat_action_unique")
      .on(table.chatId, table.actionId),
  ];
}
