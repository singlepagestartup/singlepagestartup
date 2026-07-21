import * as pgCore from "drizzle-orm/pg-core";

export interface IConstraintColumns {
  profileId: pgCore.PgColumn;
  chatId: pgCore.PgColumn;
}

export function constraints(
  table: IConstraintColumns,
): pgCore.PgTableExtraConfigValue[] {
  return [
    pgCore
      .uniqueIndex("sl_profile_chat_unique")
      .on(table.profileId, table.chatId),
  ];
}
