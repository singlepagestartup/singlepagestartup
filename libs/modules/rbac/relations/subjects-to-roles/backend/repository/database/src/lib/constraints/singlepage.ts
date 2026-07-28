import * as pgCore from "drizzle-orm/pg-core";

export interface IConstraintColumns {
  subjectId: pgCore.PgColumn;
  roleId: pgCore.PgColumn;
}

export function constraints(
  table: IConstraintColumns,
): pgCore.PgTableExtraConfigValue[] {
  return [
    pgCore
      .uniqueIndex("sps_rc_subject_role_unique")
      .on(table.subjectId, table.roleId),
  ];
}
