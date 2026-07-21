import * as pgCore from "drizzle-orm/pg-core";

export interface IConstraintColumns {
  subjectId: pgCore.PgColumn;
  socialModuleProfileId: pgCore.PgColumn;
}

export function constraints(
  table: IConstraintColumns,
): pgCore.PgTableExtraConfigValue[] {
  return [
    pgCore
      .uniqueIndex("sps_rc_subject_social_profile_unique")
      .on(table.subjectId, table.socialModuleProfileId),
  ];
}
