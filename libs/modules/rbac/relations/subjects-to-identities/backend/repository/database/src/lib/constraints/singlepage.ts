import * as pgCore from "drizzle-orm/pg-core";

export interface IConstraintColumns {
  identityId: pgCore.PgColumn;
}

export function constraints(
  table: IConstraintColumns,
): pgCore.PgTableExtraConfigValue[] {
  return [
    pgCore
      .uniqueIndex("sps_rc_subject_identity_identity_unique")
      .on(table.identityId),
  ];
}
