import * as pgCore from "drizzle-orm/pg-core";

export interface IConstraintColumns {
  roleId: pgCore.PgColumn;
  permissionId: pgCore.PgColumn;
}

export function constraints(
  table: IConstraintColumns,
): pgCore.PgTableExtraConfigValue[] {
  return [
    pgCore
      .uniqueIndex("sps_rc_role_permission_unique")
      .on(table.roleId, table.permissionId),
  ];
}
