import { sql } from "drizzle-orm";
import * as pgCore from "drizzle-orm/pg-core";

export interface IConstraintColumns {
  sourceSystemId: pgCore.PgColumn;
  variant: pgCore.PgColumn;
}

export function constraints(
  table: IConstraintColumns,
): pgCore.PgTableExtraConfigValue[] {
  return [
    pgCore
      .uniqueIndex("sl_chat_telegram_source_system_unique")
      .on(table.sourceSystemId)
      .where(
        sql`${table.variant} = 'telegram' AND ${table.sourceSystemId} IS NOT NULL`,
      ),
  ];
}
