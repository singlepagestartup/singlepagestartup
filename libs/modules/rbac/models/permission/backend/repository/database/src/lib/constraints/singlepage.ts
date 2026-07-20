import * as pgCore from "drizzle-orm/pg-core";

export interface IConstraintColumns {
  type: pgCore.PgColumn;
  method: pgCore.PgColumn;
  path: pgCore.PgColumn;
}

export function constraints(
  table: IConstraintColumns,
): pgCore.PgTableExtraConfigValue[] {
  return [
    pgCore
      .uniqueIndex("sps_rc_permission_type_method_path_unique")
      .on(table.type, table.method, table.path),
  ];
}
